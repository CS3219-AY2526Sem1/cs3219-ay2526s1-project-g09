import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

/**
 * Resolve Redis connection options for AWS ElastiCache
 * Only requires: REDIS_HOST, REDIS_PORT (optional), REDIS_TLS_ENABLED
 */
export const resolveRedisConnectionOptions = () => {
  const redisHost = process.env.REDIS_HOST || "redis";
  const redisPort = parseInt(process.env.REDIS_PORT || "6379");
  const redisTlsEnabled = process.env.REDIS_TLS_ENABLED === "true";

  const options = {
    socket: {
      host: redisHost,
      port: redisPort,
    },
  };

  // Add TLS for ElastiCache encryption in-transit
  if (redisTlsEnabled) {
    options.socket.tls = true;
    // ElastiCache certificates are valid. Reject unauthorized certs
    options.socket.rejectUnauthorized = true;
  }

  return options;
};

export const initialiseRedisAdapter = async () => {
  const options = resolveRedisConnectionOptions();
  console.log("Initializing Redis with config:", {
    host: options.socket.host,
    port: options.socket.port,
    tls: !!options.socket.tls,
  });

  const pubClient = createClient(options);
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
