import { createClient } from "redis";

/**
 * Resolve Redis connection options from environment variables
 * Supports both URL-based and host/port-based configuration with TLS
 */
const resolveRedisConnectionOptions = () => {
  const redisUrl = process.env.REDIS_URL ?? null;

  if (!redisUrl) {
    // Default to localhost for development
    return {
      socket: {
        host: "localhost",
        port: 6379,
      },
    };
  }

  const useTls = process.env.REDIS_TLS_ENABLED === "true";

  const options = {
    url: redisUrl,
    socket: useTls
      ? {
          tls: true,
          rejectUnauthorized: false,
          servername: new URL(redisUrl).hostname,
          connectTimeout: 20000,
          alpnProtocols: [],
        }
      : undefined,
  };

  return options;
};

class RedisService {
  static instance = null;

  constructor() {
    const options = resolveRedisConnectionOptions();

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
    await this.appClient.hDel(`room:${roomId}:users`, userId);
  }

  async deleteRoom(roomId) {
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
