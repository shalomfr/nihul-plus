import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis: Redis };

function createRedisClient() {
  const url = process.env.REDIS_URL;
  if (!url) {
    return null;
  }
  return new Redis(url, { maxRetriesPerRequest: null });
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}
