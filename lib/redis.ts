import { Redis } from '@upstash/redis';

// Check if we're on the server side
const isServer = typeof window === 'undefined';

// Only validate environment variables on the server
if (isServer && (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be defined in the environment variables');
}

// Dummy Redis client for client-side (no-op operations)
const dummyRedis = {
    get: async <T = any>(_key: string): Promise<T | null> => null,
    set: async (_key: string, _value: any, _options?: any): Promise<any> => null,
    del: async (..._keys: string[]): Promise<number> => 0,
} as Redis;

// Create Redis instance only on server, use a dummy instance on client
export const redis = isServer && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : dummyRedis;

export const CACHE_TTL = {
  SEO_METRICS: 60 * 60 * 24 * 1000, // 24 hours
  ANALYSIS_RESULT: 60 * 60 * 24 * 7 * 1000, // 7 days
  USER_PROFILE: 60 * 60 * 1000, // 1 hour
  PAGE_CONTENT: 60 * 60 * 24 * 30 * 1000, // 30 days
};
