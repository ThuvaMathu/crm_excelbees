import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    env: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },

    // Prevent pino and pino-pretty from being bundled into Netlify Edge Functions
    // (middleware runs as an Edge Function — pino uses Node.js APIs unavailable there).
    serverExternalPackages: ["pino", "pino-pretty"],

    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },

    poweredByHeader: false,

    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                ],
            },
        ];
    },
};

export default nextConfig;
