// src/services/redis.service.js
import { createClient } from "redis";

let pubClient, subClient, appClient;

export const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  pubClient = createClient({ url: redisUrl });
  subClient = pubClient.duplicate();
  appClient = pubClient.duplicate();

  pubClient.on("error", (err) => console.error("Redis Pub Error:", err));
  subClient.on("error", (err) => console.error("Redis Sub Error:", err));
  appClient.on("error", (err) => console.error("Redis App Error:", err));

  await Promise.all([
    pubClient.connect(),
    subClient.connect(),
    appClient.connect(),
  ]);

  console.log("Redis connected");
  return { pubClient, subClient, appClient };
};

export const RedisRooms = {
  async addOrUpdateUser(roomId, userId, data) {
    await appClient.hSet(`room:${roomId}:users`, userId, JSON.stringify(data));
  },

  async getUser(roomId, userId) {
    const raw = await appClient.hGet(`room:${roomId}:users`, userId);
    return raw ? JSON.parse(raw) : null;
  },

  async getAllUsers(roomId) {
    const users = await appClient.hGetAll(`room:${roomId}:users`);
    return Object.fromEntries(
      Object.entries(users).map(([id, val]) => [id, JSON.parse(val)]),
    );
  },

  async removeUser(roomId, userId) {
    await appClient.hDel(`room:${roomId}:users`, userId);
  },

  async deleteRoom(roomId) {
    await appClient.del(`room:${roomId}:users`);
  },
};
