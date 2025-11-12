import io, { type Socket } from "socket.io-client";
import {
  SOCKET_BASE_URL,
  SOCKET_WS1_BASE_URL,
  SOCKET_WS2_BASE_URL,
} from "@/api/collabService";

export const SOCKET_PATH = "/api/v1/collab-service/socket.io";

type SocketTarget = {
  id: string;
  label: string;
  base: string;
  path: string;
};

type SessionRegistration = {
  sessionId: string;
  userId?: string;
};

const PRIMARY_TARGET: SocketTarget = {
  id: "primary",
  label: "primary",
  base: SOCKET_BASE_URL,
  path: SOCKET_PATH,
};

const createDevTarget = (
  id: "ws1" | "ws2",
  fallbackPrefix: string,
  overrideBase: string,
): SocketTarget => {
  if (overrideBase) {
    return {
      id,
      label: id,
      base: overrideBase,
      path: SOCKET_PATH,
    };
  }
  return {
    id,
    label: id,
    base: "",
    path: `${fallbackPrefix}${SOCKET_PATH}`,
  };
};

const normaliseIoHint = (rawHint: string | null): "ws1" | "ws2" | null => {
  if (!rawHint) {
    return null;
  }
  const hint = rawHint.toLowerCase();
  if (hint === "2" || hint === "ws2") {
    return "ws2";
  }
  if (hint === "1" || hint === "ws1") {
    return "ws1";
  }
  return null;
};

const resolveSocketTargets = (): {
  targets: SocketTarget[];
  pinnedTargetId: string | null;
} => {
  if (typeof window === "undefined") {
    return {
      targets: [PRIMARY_TARGET],
      pinnedTargetId: null,
    };
  }

  const inShellDev = window.location.port === "5173";
  if (!inShellDev) {
    return {
      targets: [PRIMARY_TARGET],
      pinnedTargetId: null,
    };
  }

  const devTargets: SocketTarget[] = [
    createDevTarget("ws1", "/ws1", SOCKET_WS1_BASE_URL),
    createDevTarget("ws2", "/ws2", SOCKET_WS2_BASE_URL),
  ];

  const params = new URLSearchParams(window.location.search);
  const ioHint = normaliseIoHint(params.get("io"));

  if (ioHint) {
    const pinned = devTargets.find((target) => target.id === ioHint);
    if (pinned) {
      return {
        targets: [pinned],
        pinnedTargetId: pinned.id,
      };
    }
  }

  return {
    targets: devTargets,
    pinnedTargetId: null,
  };
};

class CollabSocketManager {
  private targets: SocketTarget[];
  private pinnedTargetId: string | null;
  private targetIndex: number;
  private socket: Socket;
  private listeners: Set<(socket: Socket) => void>;
  private sessions: Map<string, SessionRegistration>;
  private consecutiveFailures: number;

  constructor() {
    const { targets, pinnedTargetId } = resolveSocketTargets();
    this.targets = targets.length > 0 ? targets : [PRIMARY_TARGET];
    this.pinnedTargetId = pinnedTargetId;
    this.targetIndex = 0;
    this.listeners = new Set();
    this.sessions = new Map();
    this.consecutiveFailures = 0;
    this.socket = this.createSocket(this.targets[this.targetIndex]);
    this.bindLifecycle(this.socket, this.targets[this.targetIndex]);
  }

  getSocket() {
    return this.socket;
  }

  subscribe(listener: (socket: Socket) => void) {
    this.listeners.add(listener);
    listener(this.socket);
    return () => {
      this.listeners.delete(listener);
    };
  }

  registerSession(sessionId: string, userId?: string) {
    if (!sessionId) {
      return;
    }
    this.sessions.set(sessionId, { sessionId, userId });
    this.socket.emit("joinRoom", { sessionId, userId });
  }

  unregisterSession(sessionId: string) {
    if (!sessionId) {
      return;
    }
    this.sessions.delete(sessionId);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.socket));
  }

  private createSocket(target: SocketTarget) {
    return io(target.base, {
      path: target.path,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2_000,
    });
  }

  private bindLifecycle(socket: Socket, target: SocketTarget) {
    socket.on("connect", () => {
      console.info(
        `[collab-socket] Connected to ${target.label} (${socket.id ?? "unknown"})`,
      );
      this.consecutiveFailures = 0;
      this.replaySessions();
    });

    socket.on("disconnect", (reason) => {
      console.warn(
        `[collab-socket] Disconnected from ${target.label}: ${reason}`,
      );
      const shouldRotate = [
        "io server disconnect",
        "transport close",
        "ping timeout",
      ].includes(reason ?? "");
      if (shouldRotate) {
        this.rotateTarget("disconnect");
      }
    });

    socket.on("connect_error", (error: Error) => {
      console.warn(
        `[collab-socket] Connection error for ${target.label}:`,
        error?.message ?? error,
      );
      this.consecutiveFailures += 1;
      if (this.consecutiveFailures >= 2) {
        this.rotateTarget("connect_error");
        this.consecutiveFailures = 0;
      }
    });

    socket.io.on("reconnect_failed", () => {
      console.warn(
        `[collab-socket] Reconnect attempts exhausted for ${target.label}.`,
      );
      this.rotateTarget("reconnect_failed");
    });
  }

  private replaySessions() {
    if (this.sessions.size === 0) {
      return;
    }
    this.sessions.forEach(({ sessionId, userId }) => {
      this.socket.emit("joinRoom", { sessionId, userId });
    });
  }

  private rotateTarget(trigger: string) {
    if (this.pinnedTargetId || this.targets.length <= 1) {
      return;
    }
    const nextIndex = (this.targetIndex + 1) % this.targets.length;
    if (nextIndex === this.targetIndex) {
      return;
    }
    this.swapSocket(nextIndex, trigger);
  }

  private swapSocket(nextIndex: number, trigger: string) {
    const previousTarget = this.targets[this.targetIndex];
    const oldSocket = this.socket;
    oldSocket.removeAllListeners();
    oldSocket.disconnect();

    this.targetIndex = nextIndex;
    const nextTarget = this.targets[nextIndex];
    console.info(
      `[collab-socket] Switching from ${previousTarget.label} to ${nextTarget.label} due to ${trigger}.`,
    );
    this.socket = this.createSocket(nextTarget);
    this.bindLifecycle(this.socket, nextTarget);
    this.notifyListeners();
    this.replaySessions();
  }
}

const collabSocketManager = new CollabSocketManager();

export const getCollabSocket = () => collabSocketManager.getSocket();
export const subscribeToCollabSocket = (listener: (socket: Socket) => void) =>
  collabSocketManager.subscribe(listener);
export const registerActiveSession = (sessionId: string, userId?: string) =>
  collabSocketManager.registerSession(sessionId, userId);
export const unregisterActiveSession = (sessionId: string) =>
  collabSocketManager.unregisterSession(sessionId);
