import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

export const redis = globalForRedis.redis || new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 2000)),
});

redis.on('error', () => {
  // Prevent unhandled rejection crashes when Redis is unreachable or running offline
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
