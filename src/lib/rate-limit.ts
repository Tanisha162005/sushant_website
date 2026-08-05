import { redis } from './redis';

// In-memory fallback for environments without active Redis
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

export async function rateLimit(identifier: string, limit: number, windowSecs: number) {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSecs);
    }
    return { success: current <= limit, current, limit };
  } catch {
    // Fallback to in-memory store when Redis is offline or unreachable
    const record = memoryStore.get(key);
    if (!record || now > record.expiresAt) {
      memoryStore.set(key, { count: 1, expiresAt: now + windowSecs * 1000 });
      return { success: 1 <= limit, current: 1, limit };
    }
    record.count += 1;
    memoryStore.set(key, record);
    return { success: record.count <= limit, current: record.count, limit };
  }
}
