import { createClient } from "redis";

/**
 * Resolve Redis connection options for AWS ElastiCache
 * Only requires: REDIS_HOST, REDIS_PORT (optional), REDIS_TLS_ENABLED
 */
const resolveRedisConnectionOptions = () => {
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

class RedisService {
  static instance = null;

  constructor() {
    const options = resolveRedisConnectionOptions();
    console.log("Initializing Redis with config:", {
      host: options.socket.host,
      port: options.socket.port,
      tls: !!options.socket.tls,
    });

    this.pubClient = createClient(options);
    this.subClient = this.pubClient.duplicate();
    this.appClient = this.pubClient.duplicate();

    const handleError = (label) => (err) =>
      console.error(`Redis ${label} Error:`, err);

    this.pubClient.on("error", handleError("Pub"));
    this.subClient.on("error", handleError("Sub"));
    this.appClient.on("error", handleError("App"));
  }

  async connect() {
    console.log("Connecting to Redis...");
    await Promise.all([
      this.pubClient.connect(),
      this.subClient.connect(),
      this.appClient.connect(),
    ]);
    console.log("Redis connected");
  }

  static async getInstance() {
    if (!RedisService.instance) {
      const service = new RedisService();
      await service.connect();
      RedisService.instance = service;
    }
    return RedisService.instance;
  }

  // -------- Room operations --------
  async addOrUpdateUser(roomId, userId, data) {
    console.log(`Adding user ${userId} to room ${roomId}`);
    await this.appClient.hSet(
      `room:${roomId}:users`,
      userId,
      JSON.stringify(data),
    );
  }

  async getUser(roomId, userId) {
    const raw = await this.appClient.hGet(`room:${roomId}:users`, userId);
    return raw ? JSON.parse(raw) : null;
  }

  async getAllUsers(roomId) {
    const users = await this.appClient.hGetAll(`room:${roomId}:users`);
    return Object.fromEntries(
      Object.entries(users).map(([id, val]) => [id, JSON.parse(val)]),
    );
  }

  async removeUser(roomId, userId) {
    console.log(`Removing user ${userId} from room ${roomId}`);
    await this.appClient.hDel(`room:${roomId}:users`, userId);
  }

  async deleteRoom(roomId) {
    console.log(`Deleting room ${roomId}`);
    await this.appClient.del(`room:${roomId}:users`);
  }

  async close() {
    console.log("[chat.redis] Closing Redis clients...");
    const clients = [this.pubClient, this.subClient, this.appClient];
    await Promise.all(
      clients.map((client) =>
        client
          ?.quit()
          .catch((err) =>
            console.error("[chat.redis] Failed to close Redis client:", err),
          ),
      ),
    );
    console.log("[chat.redis] Redis clients closed");
  }
}

export default RedisService;
