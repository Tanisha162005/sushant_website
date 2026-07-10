import { redis } from './redis';

export async function rateLimit(identifier: string, limit: number, windowSecs: number) {
  const key = `ratelimit:${identifier}`;
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSecs);
  }
  
  return {
    success: current <= limit,
    current,
    limit
  };
}
