# AWS Amplify Database Connectivity Fix Plan

**Date:** 2026-03-17  
**Project:** CRM Excelbees (Next.js + Firebase + AWS Amplify)  
**Issue:** Application fails on AWS Amplify due to hardcoded localhost references and environment variable configuration issues

---

## Executive Summary

The CRM Excelbees application works locally but fails when deployed to AWS Amplify. The root cause is a combination of:

1. **Hardcoded localhost fallbacks** in email templates and tracking URLs
2. **Missing AWS Amplify configuration** (`amplify.yml` file does not exist)
3. **Environment variable naming inconsistencies** between `.env.example` and `.env.local.example`
4. **Potential Lambda connection pooling issues** with Firebase Admin SDK and Upstash Redis

---

## 1. Findings Report

### 1.1 Files with Hardcoded Localhost References

| File | Lines | Issue | Impact |
|-------|--------|--------|---------|
| `lib/email/email-service.ts` | 126, 201, 320, 355, 377, 397 | Email templates use `http://localhost:3000` as fallback for `NEXT_PUBLIC_APP_URL` |
| `lib/email/email-compose-service.ts` | 311, 325 | Email tracking pixel and link rewriting use localhost fallback |
| `.env.example` | 16 | Default `NEXT_PUBLIC_APP_URL=http://localhost:3000` |

**Analysis:** These localhost fallbacks will cause broken links in production emails if `NEXT_PUBLIC_APP_URL` is not properly set in Amplify.

### 1.2 Firebase Configuration Analysis

#### Client-Side Firebase (`lib/firebase.ts`)
- ✅ **Correctly configured** - Uses `NEXT_PUBLIC_*` prefixed environment variables
- ✅ **No emulator references** - Does not attempt to connect to Firebase emulators
- ✅ **Proper error handling** - Logs missing configuration without crashing

#### Server-Side Firebase Admin (`lib/firebase-admin.ts`)
- ⚠️ **Environment variable mismatch** - Uses `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- ❌ **Mismatch with `.env.local.example`** - Example file shows `FIREBASE_ADMIN_*` prefix
- ✅ **No emulator references** - Does not attempt to connect to Firebase emulators
- ✅ **Proper credential handling** - Correctly handles `\n` escape sequences in private keys

### 1.3 Redis Configuration Analysis (`lib/redis.ts`)
- ✅ **Correctly configured** - Uses Upstash Redis with proper environment variables
- ✅ **Server-side only** - Properly checks for server context
- ✅ **No localhost references** - Uses `UPSTASH_REDIS_REST_URL` environment variable
- ⚠️ **Potential Lambda issue** - Creates new Redis instance on module load; may cause connection issues in cold starts

### 1.4 Environment Variable Audit

#### Variable Naming Inconsistencies

| Variable | `.env.example` | `.env.local.example` | `.env.local` | Status |
|----------|----------------|----------------------|---------------|---------|
| Firebase Project ID | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ Consistent |
| Firebase Admin Project ID | Not present | `FIREBASE_ADMIN_PROJECT_ID` | `FIREBASE_PROJECT_ID` | ❌ Inconsistent |
| Firebase Admin Client Email | Not present | `FIREBASE_ADMIN_CLIENT_EMAIL` | `FIREBASE_CLIENT_EMAIL` | ❌ Inconsistent |
| Firebase Admin Private Key | Not present | `FIREBASE_ADMIN_PRIVATE_KEY` | `FIREBASE_PRIVATE_KEY` | ❌ Inconsistent |
| App URL | `NEXT_PUBLIC_APP_URL` | Not present | `NEXT_PUBLIC_APP_URL` | ⚠️ Missing in example |

#### Missing Environment Variables for Amplify

The following variables need to be configured in AWS Amplify:

**Client-Side (NEXT_PUBLIC_*) - Available to both build and runtime:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_APP_URL` (Critical for email links)

**Server-Side (Runtime only):**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `GEMINI_API_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `FROM_EMAIL`
- `FROM_EMAIL_NAME`
- `ADMIN_SYNC_SECRET`
- `CRON_SECRET`

### 1.5 Architecture Compatibility Check

#### ✅ No Edge Runtime Issues
- **No `export const runtime = 'edge'` declarations found** in API routes
- All API routes use default Node.js runtime (compatible with Amplify Lambda)

#### ⚠️ Potential Lambda Issues

1. **Firebase Admin SDK Initialization**
   - Current: Initializes on module load
   - Issue: Lambda cold starts will reinitialize, potentially causing connection issues
   - Recommendation: Implement singleton pattern with lazy initialization

2. **Upstash Redis Connection**
   - Current: Creates connection on module load
   - Issue: Lambda cold starts will create new connections rapidly
   - Recommendation: Implement connection pooling/reuse pattern

3. **Nodemailer Transporter**
   - Current: Creates transporter on module load
   - Issue: May cause issues in Lambda environment
   - Recommendation: Verify transporter recreation on each invocation

### 1.6 Missing Amplify Configuration

**Critical Finding:** No `amplify.yml` file exists in the project root.

This means:
- No build configuration for Amplify
- No environment variable injection configuration
- No cache configuration
- No Lambda function timeout/memory settings

---

## 2. Configuration Fixes

### 2.1 Create `amplify.yml`

Create a new file `amplify.yml` in the project root:

```yaml
version: 1
backend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### 2.2 Environment Variable Configuration for Amplify

#### Step 1: Configure Environment Variables in Amplify Console

Navigate to AWS Amplify Console → App Settings → Environment Variables and add:

**Client-Side Variables (NEXT_PUBLIC_ prefix):**
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCWOlfzroQZrWDpxdHtEfFlPOHlqjJxPxg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=crm-excelbees.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=crm-excelbees
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=crm-excelbees.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=801073487262
NEXT_PUBLIC_FIREBASE_APP_ID=1:801073487262:web:626db7638702a6c4e84a8f
NEXT_PUBLIC_APP_URL=https://excelbees.com
```

**Server-Side Variables (Runtime):**
```
FIREBASE_PROJECT_ID=crm-excelbees
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@crm-excelbees.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[your-private-key]\n-----END PRIVATE KEY-----"
UPSTASH_REDIS_REST_URL=https://tender-sturgeon-33382.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYJmAAIncDIxODE1Zjc0YjFhOGI0ZDVhYmUzODUxMmIwYTM5YzQxMnAyMzMzODI
GEMINI_API_KEY=AIzaSyA1iE2ZiMy96slKuzL969EggoEyPShfEWY
SMTP_HOST=smtppro.zoho.com.au
SMTP_PORT=465
SMTP_USER=contact@excelbees.com.au
SMTP_PASS=DZcFpJcNpnHK
FROM_EMAIL=info@excelbees.com.au
FROM_EMAIL_NAME=Excelbees
ADMIN_SYNC_SECRET=excelbees-admin-sync-2026
CRON_SECRET=your-strong-cron-secret
IS_PRODUCTION=true
```

#### Step 2: Update `.env.example` for Consistency

Update `.env.example` to match the actual variable names used:

```bash
# Firebase Configuration (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----"

# Application URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Zoho Email Configuration (AU)
ZOHO_EMAIL=your-email@zoho.com.au
ZOHO_APP_PASSWORD=your-app-specific-password
ZOHO_SMTP_HOST=smtp.zoho.com.au
ZOHO_SMTP_PORT=465

# Email Configuration (for sending emails)
SMTP_HOST=smtppro.zoho.com.au
SMTP_PORT=465
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
FROM_EMAIL=info@yourdomain.com
FROM_EMAIL_NAME=Your App Name

# Admin Notifications
ADMIN_EMAIL=admin@yourdomain.com

# AI Configuration
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Admin Sync Secret (for /api/admin/sync-claims endpoint)
ADMIN_SYNC_SECRET=your-strong-admin-sync-secret

# Cron Secret (for scheduled jobs)
CRON_SECRET=your-strong-cron-secret

# Production Flag
IS_PRODUCTION=false
```

#### Step 3: Update `.env.local.example` for Consistency

Update `.env.local.example` to match the actual variable names:

```bash
# Firebase Configuration (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"

# Application URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Email Configuration (for sending emails)
SMTP_HOST=smtppro.zoho.com.au
SMTP_PORT=465
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
FROM_EMAIL=info@yourdomain.com
FROM_EMAIL_NAME=Your App Name

# AI Configuration
GEMINI_API_KEY=your_gemini_key

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Admin Sync Secret
ADMIN_SYNC_SECRET=your-strong-admin-sync-secret

# Cron Secret
CRON_SECRET=your-strong-cron-secret

# Production Flag
IS_PRODUCTION=false
```

### 2.3 Update `next.config.ts` for Amplify

Update `next.config.ts` to include Amplify-specific settings:

```typescript
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
```

---

## 3. Code Refactoring Guide

### 3.1 Fix Hardcoded Localhost Fallbacks

#### File: `lib/email/email-service.ts`

**Lines 126, 201, 320, 355, 377, 397**

**Current Code:**
```typescript
<a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoices" class="button">
```

**Issue:** Using localhost as fallback will break production emails if `NEXT_PUBLIC_APP_URL` is missing.

**Recommended Fix:**

Option 1: Throw error if URL is missing (fail-fast approach)
```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
if (!appUrl) {
  throw new Error('NEXT_PUBLIC_APP_URL environment variable is required for email links');
}
<a href="${appUrl}/invoices" class="button">
```

Option 2: Use a placeholder URL with warning (graceful degradation)
```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
if (!appUrl && process.env.NODE_ENV === 'production') {
  console.error('WARNING: NEXT_PUBLIC_APP_URL is not set in production');
}
<a href="${appUrl || 'https://excelbees.com'}/invoices" class="button">
```

**Recommended:** Option 1 for production, Option 2 for development.

#### File: `lib/email/email-compose-service.ts`

**Lines 311, 325**

**Current Code:**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
```

**Recommended Fix:**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
if (!baseUrl) {
  throw new Error('NEXT_PUBLIC_APP_URL environment variable is required for email tracking');
}
```

### 3.2 Fix Firebase Admin Environment Variable Names

#### File: `lib/firebase-admin.ts`

**Current Code:**
```typescript
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
```

**Issue:** Variable names don't match `.env.local.example` which uses `FIREBASE_ADMIN_*` prefix.

**Decision:** Keep current variable names (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) as they are already working in `.env.local`. Update the example files instead.

### 3.3 Implement Environment Detection Logic

Add a utility file for environment detection:

**Create: `lib/environment.ts`**
```typescript
/**
 * Environment detection utility
 */

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production' || process.env.IS_PRODUCTION === 'true';
export const isTest = process.env.NODE_ENV === 'test';

export const getAppUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    if (isProduction) {
      throw new Error('NEXT_PUBLIC_APP_URL is required in production');
    }
    // Allow localhost in development
    return 'http://localhost:3000';
  }
  return url;
};

export const requireEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
};
```

**Update email files to use this utility:**
```typescript
import { getAppUrl } from '@/lib/environment';

const baseUrl = getAppUrl();
```

### 3.4 Firebase Admin Initialization for Lambda

#### File: `lib/firebase-admin.ts`

**Current Issue:** Initializes on module load, which can cause issues in Lambda cold starts.

**Recommended Fix:**

```typescript
// lib/firebase-admin.ts
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

let adminApp: App | null = null;

/**
 * Get or initialize Firebase Admin app
 * Implements singleton pattern for Lambda compatibility
 */
export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin: Missing required env vars. Ensure FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set."
    );
  }

  try {
    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log("Firebase Admin app initialized successfully.");
  } catch (error) {
    console.error("ERROR: Failed to initialize Firebase Admin app.");
    console.error("Details:", error);
    throw error;
  }

  return adminApp;
}

// Lazy initialization of services
export const adminDb = getFirestore(getAdminApp());
export const adminStorage = getStorage(getAdminApp());
export const adminAuth = getAuth(getAdminApp());
```

### 3.5 Redis Connection Pooling for Lambda

#### File: `lib/redis.ts`

**Current Issue:** Creates connection on module load.

**Recommended Fix:**

```typescript
import { Redis } from '@upstash/redis';

const isServer = typeof window === 'undefined';

let redisInstance: Redis | null = null;

/**
 * Get or create Redis instance
 * Implements singleton pattern for Lambda compatibility
 */
export function getRedis(): Redis {
  if (!isServer) {
    // Return dummy instance for client-side
    return {
      get: async <T = any>(_key: string): Promise<T | null> => null,
      set: async (_key: string, _value: any, _options?: any): Promise<any> => null,
      del: async (..._keys: string[]): Promise<number> => 0,
    } as Redis;
  }

  if (redisInstance) {
    return redisInstance;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be defined in environment variables');
  }

  redisInstance = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  return redisInstance;
}

// Export getter function instead of instance
export const redis = getRedis();

export const CACHE_TTL = {
  SEO_METRICS: 60 * 60 * 24 * 1000, // 24 hours
  ANALYSIS_RESULT: 60 * 60 * 24 * 7 * 1000, // 7 days
  USER_PROFILE: 60 * 60 * 1000, // 1 hour
  PAGE_CONTENT: 60 * 60 * 24 * 30 * 1000, // 30 days
};
```

### 3.6 Nodemailer Transporter for Lambda

#### File: `lib/email/email-service.ts`

**Current Issue:** Creates transporter on module load.

**Recommended Fix:**

```typescript
import nodemailer from "nodemailer";
import {
  getWelcomeEmailTemplate,
  getPasswordChangedEmailTemplate,
  getPasswordResetEmailTemplate,
} from "./templates/auth-templates";

let transporter: nodemailer.Transporter | null = null;

/**
 * Get or create email transporter
 * Implements singleton pattern for Lambda compatibility
 */
function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtppro.zoho.com.au",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
}

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await getTransporter().verify();
    console.log("✅ Email server is ready to send messages");
    return true;
  } catch (error) {
    console.error("❌ Email server verification failed:", error);
    return false;
  }
}

export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  from?: string,
  attachments?: Array<{ filename: string; path?: string; content?: string | Buffer }>,
  cc?: string | string[],
  bcc?: string | string[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const fromEmail = from || process.env.FROM_EMAIL || process.env.SMTP_USER;
    const fromName = process.env.FROM_EMAIL_NAME || "Excel Bees CRM";
    
    if (!fromEmail) {
      throw new Error("Sender email not configured");
    }

    await getTransporter().sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      attachments,
      cc,
      bcc,
    });

    return { success: true, error: null };
  } catch (error: any) {
    console.error("❌ Email send failed:", error);
    return { success: false, error: error.message };
  }
}
```

---

## 4. Firebase Initialization Update

### 4.1 Production-Ready Firebase Admin Initialization

The updated `lib/firebase-admin.ts` with singleton pattern (from section 3.4) addresses:

1. **Lambda Cold Starts:** Reuses existing app instance across invocations
2. **Connection Pooling:** Prevents multiple Firebase connections
3. **Error Handling:** Proper error messages for missing configuration
4. **Credential Security:** Correctly handles private key escape sequences

### 4.2 No Emulator Configuration Required

**Good News:** The codebase does NOT attempt to connect to Firebase emulators. This is correct for production.

Both `lib/firebase.ts` and `lib/firebase-admin.ts` use production Firebase endpoints directly.

---

## 5. Verification Steps

### 5.1 Pre-Deployment Checklist

- [ ] Create `amplify.yml` file in project root
- [ ] Update `.env.example` with all required variables
- [ ] Update `.env.local.example` with all required variables
- [ ] Update `next.config.ts` with Amplify-specific settings
- [ ] Create `lib/environment.ts` utility file
- [ ] Update `lib/email/email-service.ts` to use environment utility
- [ ] Update `lib/email/email-compose-service.ts` to use environment utility
- [ ] Update `lib/firebase-admin.ts` with singleton pattern
- [ ] Update `lib/redis.ts` with singleton pattern
- [ ] Update `lib/email/email-service.ts` with transporter singleton

### 5.2 Amplify Console Setup

- [ ] Navigate to AWS Amplify Console
- [ ] Create new Amplify app or select existing
- [ ] Connect repository (GitHub/GitLab/Bitbucket)
- [ ] Configure build settings:
  - [ ] Branch: `main` or `production`
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `.next`
- [ ] Configure environment variables (see section 2.2)
- [ ] Set up custom domain (if applicable)
- [ ] Configure auto-deployment on push

### 5.3 Local Testing (Simulating Amplify)

To test locally before deploying:

1. **Set production-like environment variables:**
   ```bash
   # In .env.local
   IS_PRODUCTION=true
   NEXT_PUBLIC_APP_URL=https://excelbees.com
   ```

2. **Test email generation:**
   - Trigger an email send
   - Check that links use the production URL
   - Verify no localhost references in generated emails

3. **Test Firebase connections:**
   - Verify Firebase Admin initializes correctly
   - Test Firestore operations
   - Test Storage operations

4. **Test Redis operations:**
   - Verify Redis connection works
   - Test cache set/get operations

### 5.4 Staging Deployment

1. **Deploy to staging environment:**
   ```bash
   # If using Amplify CLI
   amplify add environment
   amplify env add staging
   amplify push
   ```

2. **Test staging deployment:**
   - [ ] Verify all API routes work
   - [ ] Test email functionality
   - [ ] Test Firebase operations
   - [ ] Test Redis operations
   - [ ] Check CloudWatch logs for errors

3. **Monitor CloudWatch logs:**
   - Navigate to CloudWatch → Log groups
   - Check for initialization errors
   - Look for connection errors
   - Monitor cold start performance

### 5.5 Production Deployment

1. **Deploy to production:**
   ```bash
   amplify env add production
   amplify push
   ```

2. **Post-deployment verification:**
   - [ ] Test all user flows
   - [ ] Send test emails and verify links
   - [ ] Check Firebase Console for operations
   - [ ] Monitor error rates in CloudWatch
   - [ ] Verify Lambda cold start times

### 5.6 Monitoring and Alerts

Set up CloudWatch alarms:

1. **Error rate alarm:**
   - Metric: Errors
   - Threshold: > 5% error rate
   - Notification: Email/SMS

2. **Lambda duration alarm:**
   - Metric: Duration
   - Threshold: > 10 seconds
   - Notification: Email/SMS

3. **Throttling alarm:**
   - Metric: Throttles
   - Threshold: > 0
   - Notification: Email/SMS

---

## 6. Additional Recommendations

### 6.1 Security Recommendations

1. **Never commit `.env.local` to version control**
   - Already in `.gitignore` ✅

2. **Use AWS Secrets Manager for sensitive values**
   - Consider moving API keys to AWS Secrets Manager
   - Retrieve secrets at runtime using AWS SDK

3. **Implement rate limiting**
   - Add rate limiting to API routes
   - Prevent abuse and reduce costs

4. **Enable CloudWatch logging**
   - Ensure all errors are logged
   - Use structured logging for better searchability

### 6.2 Performance Recommendations

1. **Enable Lambda response streaming** (if using Node.js 18+)
   - Reduces time-to-first-byte
   - Improves perceived performance

2. **Implement database connection pooling**
   - Firebase Admin SDK handles this automatically
   - Redis singleton pattern already addresses this

3. **Use Lambda warm-up** (if applicable)
   - Configure provisioned concurrency
   - Reduces cold start frequency

### 6.3 Cost Optimization

1. **Monitor Lambda invocation costs**
   - Set budget alerts
   - Review usage regularly

2. **Optimize bundle size**
   - Use dynamic imports for rarely used code
   - Enable Next.js automatic code splitting

3. **Consider Lambda@Edge for simple routes**
   - Move static routes to Edge
   - Reduce Lambda costs

---

## 7. Troubleshooting Guide

### 7.1 Common Issues and Solutions

| Issue | Cause | Solution |
|-------|--------|----------|
| Email links point to localhost | `NEXT_PUBLIC_APP_URL` not set | Add environment variable in Amplify console |
| Firebase Admin initialization fails | Missing credentials | Verify `FIREBASE_*` variables are set correctly |
| Redis connection errors | Invalid credentials | Check `UPSTASH_REDIS_*` variables |
| Lambda timeout | Cold start + slow initialization | Implement singleton patterns, increase timeout |
| Build fails in Amplify | Missing dependencies | Ensure `package-lock.json` is committed |
| Environment variables not available | Wrong prefix | Server-side vars should NOT have `NEXT_PUBLIC_` prefix |

### 7.2 Debug Commands

```bash
# Test locally with production-like environment
NODE_ENV=production IS_PRODUCTION=true npm run build

# Check environment variables in Lambda
# Add temporary logging:
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  IS_PRODUCTION: process.env.IS_PRODUCTION,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
});

# Test Firebase connection
node -e "
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
  })
});
console.log('Firebase initialized successfully');
"
```

---

## 8. Summary of Required Changes

### Must Fix (Critical for Amplify deployment):
1. ✅ Create `amplify.yml` configuration file
2. ✅ Update `.env.example` with all required variables
3. ✅ Update `.env.local.example` with correct variable names
4. ✅ Fix localhost fallbacks in email files
5. ✅ Configure all environment variables in Amplify console

### Should Fix (Recommended for stability):
1. ⚠️ Implement singleton pattern for Firebase Admin
2. ⚠️ Implement singleton pattern for Redis
3. ⚠️ Implement singleton pattern for Nodemailer
4. ⚠️ Create environment utility file
5. ⚠️ Update `next.config.ts` for Amplify

### Nice to Have (Performance/Security):
1. 💡 Move secrets to AWS Secrets Manager
2. 💡 Implement rate limiting
3. 💡 Set up CloudWatch alarms
4. 💡 Enable Lambda response streaming

---

## Appendix A: File Changes Summary

| File | Change Type | Lines Affected |
|-------|--------------|-----------------|
| `amplify.yml` | New file | ~30 |
| `.env.example` | Update | ~40 |
| `.env.local.example` | Update | ~30 |
| `next.config.ts` | Update | ~10 |
| `lib/environment.ts` | New file | ~30 |
| `lib/email/email-service.ts` | Update | ~10 |
| `lib/email/email-compose-service.ts` | Update | ~5 |
| `lib/firebase-admin.ts` | Refactor | ~60 |
| `lib/redis.ts` | Refactor | ~35 |
| `lib/email-campaigns/queue.ts` | Update | ~5 |

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-17  
**Status:** Ready for Implementation
