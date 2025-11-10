import { createClient } from "redis";

/**
 * Parse optional integer environment variable
 */
const parseOptionalInt = (value) => {
  if (!value) return undefined;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? undefined : parsed;
};

/**
 * Resolve Redis connection options from environment variables
 * Supports both URL-based and host/port-based configuration with TLS
 */
const resolveRedisConnectionOptions = () => {
  const redisUrl = process.env.REDIS_URL ?? null;
  const redisHost = process.env.REDIS_HOST ?? null;

  if (!redisUrl && !redisHost) {
    // Default to localhost for development
    return {
      socket: {
        host: "localhost",
        port: 6379,
      },
    };
  }

  const redisPort = process.env.REDIS_PORT ?? null;
  const redisUsername = process.env.REDIS_USERNAME ?? null;
  const redisPassword = process.env.REDIS_PASSWORD ?? null;
  const redisDb = process.env.REDIS_DB ?? null;
  const redisTlsEnabled = process.env.REDIS_TLS_ENABLED === "true";

  const resolvedPort = parseOptionalInt(redisPort) ?? 6379;
  const resolvedDb = parseOptionalInt(redisDb);

  // Build base options
  const baseOptions = redisUrl
    ? { url: redisUrl }
    : {
        socket: {
          host: redisHost,
          port: resolvedPort,
        },
      };

  // Add TLS configuration if enabled
  if (redisTlsEnabled) {
    if (baseOptions.url) {
      // For URL-based config, add socket TLS option
      baseOptions.socket = {
        tls: true,
        rejectUnauthorized: false, // May be needed for AWS ElastiCache certificates
      };
    } else if (baseOptions.socket) {
      // For host/port config, add TLS to socket
      baseOptions.socket.tls = true;
      baseOptions.socket.rejectUnauthorized = false;
    }
  }

  // Add authentication if provided
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
}

export default RedisService;
