# Amplify Environment Variable Remediation Plan

## 1. Analysis & Diagnosis

### The Issue
You are experiencing a common behavior with AWS Amplify Hosting and Next.js. Environment variables configured in the Amplify Console are injected into the **Build Container** automatically, allowing static generation and Next.js configuration to access them. However, they frequently fail to cascade to the SSR runtime (Lambda serverless compute) if Next.js optimizes the API routes in a way that disconnects the execution context from the host OS environment.

This creates a distinct runtime gap:
- **`NEXT_PUBLIC_*` Variables**: Baked into the client bundle at build time by Webpack. These work perfectly because the build container has access to the Amplify secrets.
- **Private Server Variables**: (e.g., `GEMINI_API_KEY`, `FIREBASE_PRIVATE_KEY`, `SMTP_*`) Which are historically evaluated dynamically at runtime. If the Lambda environment isn't booting with these exact mapped variables, your API routes will fail with `undefined`.

### Root Cause
1. **Destructuring `process.env`**: Webpack static analysis cannot replace dynamically destructured variables (e.g., `const { GEMINI_API_KEY } = process.env`).
2. **Missing Build-to-Runtime Bridge**: For Next.js apps on Amplify, the most robust way to guarantee a variable is present in serverless functions is to map it in `next.config.ts`. This forces Next.js to bake the build-time value into the server bundle, bridging the gap without relying on Lambda injection.

---

## 2. Resolution Strategy

### Step 1: Update `next.config.ts` to Expose Variables
We will map critical server-side variables inside the `env` block of your `next.config.ts`. Next.js replaces `process.env.VAR_NAME` with the actual value during the build phase. Since Amplify’s build container *does* have access to all your console variables, this successfully hardcodes the server-side variables securely into the backend execution context.

### Step 2: Refactor API Routes & Services
We need to ensure that every usage of an environment variable is accessed using the strict `process.env.VAR_NAME` pattern globally. Dynamic access or destructuring must be eliminated.

---

## 3. Precise Code Changes Required

### Change 1: Update `next.config.ts`
We will inject fundamental server-side variables directly into the build environment mapping so Lambda functions have guaranteed access.

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose these variables from the Amplify build container into the runtime functions
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    
    // AI Variables
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,

    // Firebase Admin Variables
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    // Note: private keys with newlines are safely handled if mapped directly like this
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,

    // Email Variables
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,

    // Other Backend Configs
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    ADMIN_SYNC_SECRET: process.env.ADMIN_SYNC_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
  },
  
  // Optimize for Lambda
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  poweredByHeader: false,
};

export default nextConfig;
```

### Change 2: Ensure Strict Access Patterns in Code
*Code Snippet for Correct Runtime Usage:*
```typescript
// ❌ INCORRECT (Dynamic access or destructuring)
const envKeys = process.env;
const apiKey = envKeys.GEMINI_API_KEY;

const { GEMINI_API_KEY } = process.env;

// ✅ CORRECT (Strict static access)
// Webpack will successfully detect and embed the value from next.config.ts
const apiKey = process.env.GEMINI_API_KEY;
```

For specific complex cases like `FIREBASE_PRIVATE_KEY` formatting (due to JSON stringified newlines escaping differently in CI/CD vs local):
```typescript
// lib/firebase-admin.ts
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;
```

---

## 4. Verification Criteria
1. **Build Success**: The App builds without issues, ensuring none of the mapped keys crash the build process.
2. **Lambda Integrity**: By passing variables through `next.config.ts`, you remove the dependency on Amplify's OS-level runtime injection. The variables follow the code payload directly.
3. **Security Check**: This approach ensures variables are embedded into the server output (`.next/server/`), but importantly, they **are not exported to the browser** unless prefixed with `NEXT_PUBLIC_`. Client-side payloads remain secure.

**Please review this plan. Upon your approval, I will execute these precise configuration changes.**
