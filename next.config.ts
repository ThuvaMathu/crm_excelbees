import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure environment variables are available at build time for Lambda runtime
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    
    // AI Variables
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,

    // Firebase Admin Variables
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,

    // Email Variables
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    FROM_EMAIL: process.env.FROM_EMAIL,
    FROM_EMAIL_NAME: process.env.FROM_EMAIL_NAME,

    // Other Backend Configs
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    ADMIN_SYNC_SECRET: process.env.ADMIN_SYNC_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    IS_PRODUCTION: process.env.IS_PRODUCTION,
  },
  
  // Optimize for Lambda
  experimental: {
    // Enable server actions in Lambda
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
};

export default nextConfig;
