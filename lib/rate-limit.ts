import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

interface RateLimitConfig {
  limit: number;
  window: number; // seconds
}

const limits: Record<string, RateLimitConfig> = {
  login: { limit: 5, window: 900 },
  ai: { limit: 30, window: 60 },
  "ai-search": { limit: 10, window: 60 },
  email: { limit: 20, window: 60 },
  general: { limit: 100, window: 60 },
};

export async function checkRateLimit(
  type: keyof typeof limits,
  identifier: string
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const config = limits[type];
  if (!config) {
    return { allowed: true, remaining: 999, resetIn: 0 };
  }

  const key = `ratelimit:${type}:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - config.window;

  try {
    const count = await redis.zcount(key, windowStart, "+inf");
    const remaining = Math.max(0, config.limit - count);
    const ttl = await redis.ttl(key);

    if (count >= config.limit) {
      return { allowed: false, remaining: 0, resetIn: ttl > 0 ? ttl : config.window };
    }

    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    await redis.expire(key, config.window);
    await redis.zremrangebyscore(key, 0, windowStart - 1);

    return { allowed: true, remaining, resetIn: ttl > 0 ? ttl : config.window };
  } catch {
    // If Redis is unavailable, allow the request
    return { allowed: true, remaining: 999, resetIn: 0 };
  }
}

export async function rateLimitAI(identifier: string) {
  return checkRateLimit("ai", identifier);
}
