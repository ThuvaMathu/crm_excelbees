import { Redis } from '@upstash/redis';

// Check if we're on the server side
const isServer = typeof window === 'undefined';

// Only validate environment variables on the server
if (isServer && (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be defined in the environment variables');
}

// Create Redis instance only on server, use a dummy instance on client
export const redis = isServer && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : ({
        get: async () => null,
        set: async () => null,
        del: async () => null,
    } as any);
