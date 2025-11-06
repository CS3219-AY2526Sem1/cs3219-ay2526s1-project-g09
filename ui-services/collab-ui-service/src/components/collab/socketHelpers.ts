import io, { type Socket } from "socket.io-client";
import {
  SOCKET_BASE_URL,
  SOCKET_WS1_BASE_URL,
  SOCKET_WS2_BASE_URL,
} from "@/api/collabService";

export const SOCKET_PATH = "/api/v1/collab-service/socket.io";

export const resolveSocketTarget = () => {
  const inShellDev =
    typeof window !== "undefined" && window.location.port === "5173";

  if (!inShellDev) {
    return {
      base: SOCKET_BASE_URL,
      path: SOCKET_PATH,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const ioHint = params.get("io");

  if (ioHint === "2") {
    if (SOCKET_WS2_BASE_URL) {
      return {
        base: SOCKET_WS2_BASE_URL,
        path: SOCKET_PATH,
      };
    }
    return {
      base: "",
      path: `/ws2${SOCKET_PATH}`,
    };
  }

  if (ioHint === "1" || ioHint === "ws1") {
    if (SOCKET_WS1_BASE_URL) {
      return {
        base: SOCKET_WS1_BASE_URL,
        path: SOCKET_PATH,
      };
    }
    return {
      base: "",
      path: `/ws1${SOCKET_PATH}`,
    };
  }

  if (SOCKET_WS1_BASE_URL) {
    return {
      base: SOCKET_WS1_BASE_URL,
      path: SOCKET_PATH,
    };
  }

  return {
    base: "",
    path: `/ws1${SOCKET_PATH}`,
  };
};

export const createCollabSocket = (): Socket => {
  const { base, path } = resolveSocketTarget();
  return io(base, {
    path,
    transports: ["websocket"],
  });
};
