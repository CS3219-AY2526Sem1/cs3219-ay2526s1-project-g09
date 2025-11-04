import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

export const initialiseRedisAdapter = async () => {
  const redisUrl =
    process.env.COLLAB_REDIS_URL ?? process.env.REDIS_URL ?? null;
  const redisHost =
    process.env.COLLAB_REDIS_HOST ?? process.env.REDIS_HOST ?? null;

  if (!redisUrl && !redisHost) {
    console.log(
      "[collab.socket][redis] Adapter disabled: no COLLAB_REDIS_URL or COLLAB_REDIS_HOST configured.",
    );
    return null;
  }

  const pubClient = createClient({ url: redisUrl });
  const subClient = pubClient.duplicate();

  pubClient.on("error", (error) => {
    console.error("[collab.socket][redis] Publisher error:", error);
  });
  subClient.on("error", (error) => {
    console.error("[collab.socket][redis] Subscriber error:", error);
  });

  await Promise.all([pubClient.connect(), subClient.connect()]);

  console.log("[collab.socket] Redis adapter connected.");

  return {
    adapter: createAdapter(pubClient, subClient),
    clients: [pubClient, subClient],
  };
};
