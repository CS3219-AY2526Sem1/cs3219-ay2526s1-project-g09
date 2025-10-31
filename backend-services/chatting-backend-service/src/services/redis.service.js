import { createClient } from "redis";

class RedisService {
  static instance = null;

  constructor() {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    this.pubClient = createClient({ url: redisUrl });
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
