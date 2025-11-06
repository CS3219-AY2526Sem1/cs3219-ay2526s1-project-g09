import { createClient } from "redis";
import * as Y from "yjs";
import { resolveRedisConnectionOptions } from "./redis.service.js";
import { decodeUpdateFromBase64 } from "../utils/session.utils.js";
import { ensureSessionDoc } from "../sockets/yjsSync.js";

const CHANNEL_NAME = "collab:yjs:update";
const instanceId =
  process.env.HOSTNAME ??
  process.env.INSTANCE_ID ??
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
  `pid-${process.pid}`;

const serialiseUpdate = (payload) => JSON.stringify(payload);
const deserialiseUpdate = (message) => {
  try {
    return JSON.parse(message);
  } catch (error) {
    console.warn("[collab.socket][yjs-sync] Failed to parse Redis payload", {
      message,
      error,
    });
    return null;
  }
};

export const initialiseYjsRedisSync = async () => {
  const baseOptions = resolveRedisConnectionOptions();
  if (!baseOptions) {
    console.log(
      "[collab.socket][yjs-sync] Disabled: Redis configuration missing.",
    );
    return {
      publishUpdate: async () => {},
      clients: [],
    };
  }

  const publisher = createClient(baseOptions);
  const subscriber = publisher.duplicate();

  publisher.on("error", (error) => {
    console.error("[collab.socket][yjs-sync] Publisher error:", error);
  });
  subscriber.on("error", (error) => {
    console.error("[collab.socket][yjs-sync] Subscriber error:", error);
  });

  await Promise.all([publisher.connect(), subscriber.connect()]);

  const publishUpdate = async ({
    sessionId,
    update,
    language,
    userId,
    origin = instanceId,
  }) => {
    if (!sessionId || !update) {
      return;
    }
    const payload = {
      version: 1,
      origin,
      sessionId,
      update,
      language,
      userId,
      timestamp: new Date().toISOString(),
    };
    try {
      await publisher.publish(CHANNEL_NAME, serialiseUpdate(payload));
    } catch (error) {
      console.error(
        "[collab.socket][yjs-sync] Failed to publish update to Redis:",
        error,
      );
    }
  };

  await subscriber.subscribe(CHANNEL_NAME, async (message) => {
    const payload = deserialiseUpdate(message);
    if (!payload) {
      return;
    }
    if (payload.origin === instanceId) {
      return;
    }

    const decoded = decodeUpdateFromBase64(payload.update);
    if (!decoded) {
      console.warn("[collab.socket][yjs-sync] Ignored invalid update payload.");
      return;
    }

    const sessionId = payload.sessionId;
    if (!sessionId) {
      return;
    }

    const entry = ensureSessionDoc(sessionId);
    if (!entry) {
      return;
    }

    try {
      Y.applyUpdate(entry.doc, decoded);
      if (payload.language) {
        entry.language = payload.language;
      }
      if (payload.userId) {
        entry.lastAuthor = payload.userId;
      }
    } catch (error) {
      console.error(
        "[collab.socket][yjs-sync] Failed to apply remote Yjs update:",
        error,
      );
    }
  });

  console.log("[collab.socket][yjs-sync] Redis document sync initialised.");

  return {
    publishUpdate,
    clients: [publisher, subscriber],
  };
};
