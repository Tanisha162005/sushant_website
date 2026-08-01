import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

export const redis = process.env.WEBSITE_LIVE === 'true'
  ? globalForRedis.redis || new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
  : ({} as Redis);

if (process.env.NODE_ENV !== 'production' && process.env.WEBSITE_LIVE === 'true') globalForRedis.redis = redis;
