import { Redis } from '@upstash/redis';

// Check if we're on the server side
const isServer = typeof window === 'undefined';

// Dummy Redis client for client-side (no-op operations)
const dummyRedis = {
    get: async <T = any>(_key: string): Promise<T | null> => null,
    set: async (_key: string, _value: any, _options?: any): Promise<any> => null,
    del: async (..._keys: string[]): Promise<number> => 0,
} as Redis;

// Redis instance for singleton pattern
let redisInstance: Redis | null = null;

/**
 * Get or create Redis instance
 * Implements singleton pattern for Lambda compatibility
 * Reuses existing instance across Lambda invocations
 */
export function getRedis(): Redis {
    // Return dummy instance for client-side
    if (!isServer) {
        return dummyRedis;
    }

    // Return existing instance if already initialized
    if (redisInstance) {
        return redisInstance;
    }

    // Validate environment variables
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be defined in the environment variables');
    }

    // Create new Redis instance
    redisInstance = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    return redisInstance;
}

// Backward compatibility: Export direct accessor.
// This is a lazy proxy rather than `getRedis()` called eagerly — the old
// eager call ran `new Redis(...)` (and threw if env vars were missing) the
// moment this module was first imported, even in code paths that never
// actually touch Redis. Deferring until a method is actually invoked means
// importing this module is always safe.
export const redis = new Proxy({} as Redis, {
    get(_target, prop, receiver) {
        const instance = getRedis();
        const value = Reflect.get(instance, prop, receiver);
        return typeof value === "function" ? value.bind(instance) : value;
    },
});

export const CACHE_TTL = {
  SEO_METRICS: 60 * 60 * 24 * 1000, // 24 hours
  ANALYSIS_RESULT: 60 * 60 * 24 * 7 * 1000, // 7 days
  USER_PROFILE: 60 * 60 * 1000, // 1 hour
  PAGE_CONTENT: 60 * 60 * 24 * 30 * 1000, // 30 days
};
