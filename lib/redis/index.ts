import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

/**
 * Simple rate limiter using Redis.
 * Returns true if the request is allowed, false if rate limited.
 */
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  const remaining = Math.max(0, maxRequests - current);
  return {
    allowed: current <= maxRequests,
    remaining,
  };
}

/**
 * Cache helper: get from cache or execute function and cache result.
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const cachedValue = await redis.get(key);
  if (cachedValue) {
    return JSON.parse(cachedValue) as T;
  }

  const result = await fn();
  await redis.set(key, JSON.stringify(result), 'EX', ttlSeconds);
  return result;
}

/**
 * Invalidate a cache key.
 */
export async function invalidateCache(key: string): Promise<void> {
  await redis.del(key);
}
