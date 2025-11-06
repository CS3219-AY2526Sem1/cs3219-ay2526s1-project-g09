import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

const parseOptionalInt = (value) => {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const resolveRedisConnectionOptions = () => {
  const redisUrl =
    process.env.COLLAB_REDIS_URL ?? process.env.REDIS_URL ?? null;
  const redisHost =
    process.env.COLLAB_REDIS_HOST ?? process.env.REDIS_HOST ?? null;

  if (!redisUrl && !redisHost) {
    return null;
  }

  const redisPort =
    process.env.COLLAB_REDIS_PORT ?? process.env.REDIS_PORT ?? null;
  const redisUsername =
    process.env.COLLAB_REDIS_USERNAME ?? process.env.REDIS_USERNAME ?? null;
  const redisPassword =
    process.env.COLLAB_REDIS_PASSWORD ?? process.env.REDIS_PASSWORD ?? null;
  const redisDb = process.env.COLLAB_REDIS_DB ?? process.env.REDIS_DB ?? null;

  const resolvedPort = parseOptionalInt(redisPort) ?? 6379;
  const resolvedDb = parseOptionalInt(redisDb);

  const baseOptions = redisUrl
    ? { url: redisUrl }
    : {
        socket: {
          host: redisHost,
          port: resolvedPort,
        },
      };

  if (redisUsername) {
    baseOptions.username = redisUsername;
  }
  if (redisPassword) {
    baseOptions.password = redisPassword;
  }
  if (resolvedDb !== undefined) {
    baseOptions.database = resolvedDb;
  }

  return baseOptions;
};

export const initialiseRedisAdapter = async () => {
  const baseOptions = resolveRedisConnectionOptions();

  if (!baseOptions) {
    console.log(
      "[collab.socket][redis] Adapter disabled: no COLLAB_REDIS_URL or COLLAB_REDIS_HOST configured.",
    );
    return null;
  }

  const pubClient = createClient(baseOptions);
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
