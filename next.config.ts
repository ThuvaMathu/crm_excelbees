import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure environment variables are available at build time
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
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
