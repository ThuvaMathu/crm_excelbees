# CRM Issue Report — Phase 3 Audit

> **Project**: RCRM by ExcelBees
> **Phase**: 3 — Static Code Audit
> **Methodology**: Reverse-engineering source code against CRM-TestCases.md
> **Status**: Issues identified only — no fixes implemented

---

## Issue Summary

| Severity | Count |
|----------|-------|
| Critical | 7 |
| High | 12 |
| Medium | 8 |
| Low | 5 |
| **Total** | **32** |

---

## 1. Authentication & Authorization Issues

### ISS-001: API Email Send Route — No Authentication
- **Module**: Email
- **Feature**: Email Send API
- **Related Test Case**: TC-API-002
- **File Path**: `app/api/email/send/route.ts`
- **Function**: `POST`
- **Problem**: The email send API endpoint has NO authentication check. Any unauthenticated user can POST to this endpoint and send emails through the system's SMTP server.
- **Expected Behaviour**: The endpoint should verify the Firebase ID token before processing the email send request, using `verifyApiRequest()` or the `protectedRoute` wrapper.
- **Actual Behaviour**: The handler directly extracts the request body and calls `sendEmailWithMergeFields()` without any auth verification.
- **Root Cause**: Missing `verifyApiRequest()` call or `protectedRoute` wrapper.
- **Business Impact**: Attackers can use the CRM's SMTP server to send spam or phishing emails, damaging the organization's email reputation and potentially causing the SMTP server to be blacklisted.
- **Technical Impact**: Unauthenticated access to email infrastructure, potential for abuse, SMTP relay attack.
- **Severity**: Critical
- **Priority**: Critical
- **Risk Level**: High
- **Suggested Resolution**: Wrap the handler with `requireAuth()` or call `verifyApiRequest()` at the beginning of the handler.
- **Dependencies**: lib/auth/api-auth.ts, lib/api/protected-route.ts

### ISS-002: API Invoice Send Route — No Authentication
- **Module**: Invoices
- **Feature**: Invoice Email Send
- **Related Test Case**: TC-API-003
- **File Path**: `app/api/invoices/send/route.ts`
- **Function**: `POST`
- **Problem**: The invoice send API endpoint has NO authentication check. Any unauthenticated user can send invoice emails with PDF attachments.
- **Expected Behaviour**: The endpoint should verify the Firebase ID token and check that the user has permission to send invoices.
- **Actual Behaviour**: The handler directly extracts the request body and sends emails without any auth verification.
- **Root Cause**: Missing `verifyApiRequest()` call.
- **Business Impact**: Unauthorized invoice email sending, potential for phishing using invoice PDFs.
- **Technical Impact**: Unauthenticated access to email sending infrastructure.
- **Severity**: Critical
- **Priority**: Critical
- **Risk Level**: High
- **Suggested Resolution**: Wrap the handler with `requireAuth()` or call `verifyApiRequest()`.

### ISS-003: Email Click Tracking — Open Redirect Vulnerability
- **Module**: Email
- **Feature**: Email Click Tracking
- **Related Test Case**: TC-EMAIL-004
- **File Path**: `app/api/email/track/click/route.ts`
- **Function**: `GET`
- **Problem**: The click tracking endpoint redirects to any URL provided in the `url` query parameter without validation. This is an open redirect vulnerability that can be exploited for phishing campaigns.
- **Expected Behaviour**: The `targetUrl` should be validated against a whitelist of allowed domains, or at minimum checked to ensure it's not an external URL, or requires a signed token.
- **Actual Behaviour**: `NextResponse.redirect(targetUrl)` redirects to whatever URL is passed, including `javascript:`, `file:`, or external malicious URLs.
- **Root Cause**: No URL validation or allowlist check.
- **Business Impact**: The CRM's domain could be used in phishing attacks, damaging brand trust and potentially being blacklisted by email providers.
- **Technical Impact**: Open redirect vulnerability exploitable by attackers.
- **Severity**: Critical
- **Priority**: Critical
- **Risk Level**: High
- **Suggested Resolution**: Validate the target URL against an allowed origin list, or use a signed URL approach with HMAC verification.
- **Related Files**: app/api/email/track/click/route.ts

### ISS-004: Rate Limiter Not Applied Anywhere
- **Module**: System
- **Feature**: Rate Limiting
- **Related Test Case**: TC-AUTH-002 (negative test for too many attempts)
- **File Path**: `lib/rate-limit.ts`
- **Function**: `checkRateLimit()`
- **Problem**: The rate limiter (`lib/rate-limit.ts`) is defined with configurations for login, AI, email, and general endpoints, but it is NEVER imported or used anywhere in the application code. All endpoints are unprotected against brute force and DoS attacks.
- **Expected Behaviour**: Rate limiting should be applied to login attempts (5 per 15 min), AI endpoints, email sending, and general API routes.
- **Actual Behaviour**: The `checkRateLimit` function is never called. The `rateLimitAI` export is never imported.
- **Root Cause**: Rate limiter was implemented but never integrated into any route or action.
- **Business Impact**: Login endpoints are vulnerable to brute force password attacks. AI endpoints can be abused for excessive API usage.
- **Technical Impact**: No protection against brute force, DoS, or API abuse.
- **Severity**: Critical
- **Priority**: High
- **Risk Level**: High
- **Suggested Resolution**: Integrate rate limiting into login actions, AI actions, and email sending endpoints.

### ISS-005: Encryption Key Fallback — Weak Default
- **Module**: Security
- **Feature**: SMTP Password Encryption
- **Related Test Case**: TC-SEC-004
- **File Path**: `lib/crypto.ts`
- **Function**: `getEncryptionKey()`
- **Problem**: The encryption key derivation falls back to `"default_fallback_secret_key_change_me_in_production"` if `ENCRYPTION_KEY` and `NEXTAUTH_SECRET` environment variables are not set. This provides a deterministic, publicly known key that undermines all encryption.
- **Expected Behaviour**: If the encryption key is not configured, encryption should fail explicitly rather than using a weak fallback.
- **Actual Behaviour**: When neither `ENCRYPTION_KEY` nor `NEXTAUTH_SECRET` is set, the function uses a hardcoded fallback string, deriving the same key every time.
- **Root Cause**: Security-by-default design that prioritizes "works out of the box" over security.
- **Business Impact**: SMTP passwords stored in Firestore are effectively not encrypted if the fallback key is used.
- **Technical Impact**: Weak encryption that can be reversed by anyone who knows the fallback string.
- **Severity**: High
- **Priority**: High
- **Risk Level**: High
- **Suggested Resolution**: Throw an error if `ENCRYPTION_KEY` is not set, or generate a random key on first use and store it securely.

### ISS-006: Key Derivation Uses Static Salt
- **Module**: Security
- **Feature**: SMTP Password Encryption
- **Related Test Case**: TC-SEC-004
- **File Path**: `lib/crypto.ts:15`
- **Function**: `getEncryptionKey()`
- **Problem**: The scrypt key derivation uses a static salt `"salt"` instead of a random salt. This means the same key is always derived from the same secret, making rainbow table attacks feasible.
- **Expected Behaviour**: Use a random salt stored alongside the encrypted data, or at minimum use a unique per-app salt from configuration.
- **Actual Behaviour**: `crypto.scryptSync(secret, "salt", 32)` — static salt.
- **Severity**: Medium
- **Priority**: Medium
- **Risk Level**: Medium
- **Suggested Resolution**: Use a random per-encryption salt, or derive the salt from a configuration value.

### ISS-007: Server Action Auth — No Session Validation in Dashboard
- **Module**: Dashboard
- **Feature**: Dashboard Stats
- **Related Test Case**: TC-SA-001
- **File Path**: `app/actions/dashboard.ts`
- **Function**: `getCachedDashboardStats()`
- **Problem**: The dashboard server action accepts `userId` and `organizationId` as parameters but does NOT verify that the caller is the actual user or a member of the organization. It trusts the client-provided parameters.
- **Expected Behaviour**: The server action should verify the caller's session via `auth()` from `server-auth.ts` and validate that the caller is a member of the specified org.
- **Actual Behaviour**: The function directly uses the provided `userId` and `organizationId` to query data without any session verification.
- **Root Cause**: Missing `auth()` call at the beginning of the server action.
- **Business Impact**: A user could potentially view another user's dashboard stats by manipulating the `userId` or `organizationId` parameters.
- **Technical Impact**: Cross-user/organization data access possible.
- **Severity**: High
- **Priority**: High
- **Risk Level**: High
- **Suggested Resolution**: Call `auth()` from `server-auth.ts` to verify the session and use the authenticated user's UID instead of the parameter.

### ISS-008: Server Action Auth — Missing in Admin User Actions
- **Module**: Admin
- **Feature**: Admin User Management
- **Related Test Case**: TC-SA-003
- **File Path**: `app/actions/admin-users.ts`
- **Problem**: The admin user server actions may not have proper session verification. The file exists but needs to be audited for auth checks.
- **Expected Behaviour**: All admin actions should verify the caller is an admin via `auth()` and role check.
- **Root Cause**: Server actions are not self-validating unless explicitly coded.
- **Severity**: High
- **Priority**: High
- **Risk Level**: High
- **Suggested Resolution**: Verify and ensure all admin server actions call `auth()` and check for admin role.

---

## 2. Data & Business Logic Issues

### ISS-009: Lead Value Validation — Type Mismatch
- **Module**: Leads
- **Feature**: Lead Creation
- **Related Test Case**: TC-LEAD-001
- **File Path**: `lib/validations/lead.ts:12`
- **Function**: leadSchema
- **Problem**: The `value` field validation uses `z.number().min(0).optional().or(z.literal(""))`. The `.or(z.literal(""))` creates a union type that allows either a number meeting `min(0)` or an empty string. However, the `min(0)` constraint only applies to the number branch, and when the value is an empty string, the form submission will pass validation but the Firestore will receive an empty string instead of a number, which could cause issues in calculations.
- **Expected Behaviour**: Value should be either a non-negative number or undefined/null.
- **Actual Behaviour**: Empty string is accepted as a valid value.
- **Root Cause**: The `.or(z.literal(""))` pattern was intended to allow empty input from form fields, but it creates a type union that may cause issues downstream.
- **Severity**: Medium
- **Priority**: Medium
- **Risk Level**: Low
- **Suggested Resolution**: Use `z.number().min(0).optional().nullable()` and handle empty string → null conversion in the form handler.

### ISS-010: Invoice Template Enum Mismatch
- **Module**: Invoices
- **Feature**: Invoice Creation
- **Related Test Case**: TC-INV-001
- **File Path**: `lib/validations/invoice.ts:13` vs `types/crm.ts:489`
- **Problem**: The invoice validation schema defines `template` as `z.enum(["standard", "project", "recurring"])` but the TypeScript type `InvoiceTemplate` in `types/crm.ts` defines it as `"standard" | "professional" | "creative"`. These two enums are completely different and incompatible.
- **Expected Behaviour**: The validation schema and the type definition should use the same enum values.
- **Actual Behaviour**: Schema allows `"standard"`, `"project"`, `"recurring"` while type allows `"standard"`, `"professional"`, `"creative"`.
- **Root Cause**: Schema and type were developed independently and not synchronized.
- **Business Impact**: Invoices may fail to save or display incorrectly if the template value doesn't match the expected type.
- **Technical Impact**: TypeScript compilation errors or runtime validation failures.
- **Severity**: High
- **Priority**: High
- **Risk Level**: High
- **Suggested Resolution**: Align the validation schema enum with the type definition. Choose one set of values.

### ISS-011: getUserProfile — No Organization Filter
- **Module**: Users
- **Feature**: User Management
- **Related Test Case**: TC-USER-005
- **File Path**: `lib/firestore/users.ts:188-205`
- **Function**: `getUsers()`
- **Problem**: The `getUsers()` function reads ALL documents from the `users` collection with no organization filter. In a multi-tenant system, this exposes every user across all organizations to any caller.
- **Expected Behaviour**: Should filter by `organizationId` or at minimum require authentication to access.
- **Actual Behaviour**: `collection(db, "users")` is queried without any `where` clause.
- **Business Impact**: Any authenticated user can list all users in the system across all organizations.
- **Technical Impact**: Cross-tenant data exposure.
- **Severity**: High
- **Priority**: High
- **Risk Level**: High
- **Suggested Resolution**: Add organization filtering to user queries, or scope the query to the current organization's members.

### ISS-012: Lead Conversion — No Permission Check
- **Module**: Leads
- **Feature**: Lead Conversion
- **Related Test Case**: TC-LEAD-006, TC-LEAD-007, TC-LEAD-008
- **File Path**: `lib/firestore/leads.ts:135-227`
- **Functions**: `convertLeadToContact()`, `convertLeadToDeal()`, `convertLeadToProject()`
- **Problem**: Lead conversion functions have no permission checks. Any authenticated user can convert any lead, regardless of whether they own it or have edit permissions.
- **Expected Behaviour**: Should check that the caller has edit permission on the lead and potentially the target entity.
- **Actual Behaviour**: Functions accept `userId` and `userName` but only use them for ownership assignment and activity logging, not for permission validation.
- **Root Cause**: Missing permission validation calls.
- **Business Impact**: Team members could convert leads they don't own or shouldn't have access to.
- **Technical Impact**: Bypass of the RBAC permission system.
- **Severity**: High
- **Priority**: High
- **Risk Level**: High
- **Suggested Resolution**: Add `hasPermission()` or `validateTaskPermission()` checks before conversion.

### ISS-013: Hard Delete for Leads, Contacts, Companies
- **Module**: CRM Core
- **Feature**: Data Deletion
- **Related Test Case**: TC-LEAD-005, TC-CONT-004, TC-COMP-003
- **File Paths**: `lib/firestore/leads.ts:110-119`, `lib/firestore/contacts.ts:112-123`, `lib/firestore/companies.ts:102-111`
- **Functions**: `deleteLead()`, `deleteContact()`, `deleteCompany()`
- **Problem**: Leads, contacts, and companies are hard-deleted (permanently removed) from Firestore. This is inconsistent with deals, projects, and tasks which use soft-delete (archive/status flags).
- **Expected Behaviour**: Should use soft-delete (e.g., `isActive: false` or `archived: true`) to allow data recovery and maintain referential integrity.
- **Actual Behaviour**: `deleteDoc(docRef)` permanently removes the document.
- **Business Impact**: Accidental deletion of leads/contacts/companies results in permanent data loss.
- **Technical Impact**: Lost referential integrity if other entities reference the deleted document.
- **Severity**: High
- **Priority**: High
- **Risk Level**: High
- **Suggested Resolution**: Implement soft-delete with `isDeleted` or `archived` flag for all CRM entities.

### ISS-014: Permission Utils Use Client Firestore
- **Module**: Permissions
- **Feature**: Server-side Permission Check
- **Related Test Case**: TC-PERM-003
- **File Path**: `lib/auth/permission-utils.ts:11-12`
- **Problem**: The server-side permission utility (`permission-utils.ts`) imports `db` from `../firebase` (the client Firebase SDK) instead of `../firebase-admin` (the Admin SDK). This means permission checks run on the client side and are subject to Firestore security rules.
- **Expected Behaviour**: Server-side permission checks should use the Admin SDK which bypasses client-side security rules.
- **Actual Behaviour**: Uses client-side `firebase` import, which means the code may not work in server-side contexts (API routes, server actions) and is subject to client-side Firestore rules.
- **Root Cause**: Incorrect import of Firebase client SDK instead of Admin SDK.
- **Business Impact**: Permission validation may fail in server context or be subject to client-side restrictions.
- **Technical Impact**: The permission utilities may not work in server-side Node.js environment where the client SDK is not fully functional.
- **Severity**: High
- **Priority**: High
- **Risk Level**: High
- **Suggested Resolution**: Change import to use `adminDb` from `firebase-admin.ts` for server-side permission checks.

### ISS-015: Audit Logs Use Client Firestore
- **Module**: Audit
- **Feature**: Audit Logging
- **Related Test Case**: TC-PERM-005
- **File Path**: `lib/firestore/audit-logs.ts:7-8`
- **Problem**: The audit log module uses the client-side Firestore SDK (`db` from `@/lib/firebase`). Audit logs written from the client side can be blocked by Firestore security rules or tampered with by the client.
- **Expected Behaviour**: Audit logs should be written using the Admin SDK from server-side code only.
- **Actual Behaviour**: Uses client-side `firebase` import.
- **Severity**: Medium
- **Priority**: Medium
- **Risk Level**: Medium
- **Suggested Resolution**: Move audit log writes to server-side only, using Admin SDK.

---

## 3. API & Validation Issues

### ISS-016: Invoice Number Generator — Error Not Handled
- **Module**: Invoices
- **Feature**: Invoice Creation
- **Related Test Case**: TC-INV-001
- **File Path**: `lib/firestore/invoices.ts:22-28`
- **Problem**: The invoice number generator failure is caught and returned as an error, but the `generateNextInvoiceNumber` function may throw for various reasons (missing user settings, network error, etc.).
- **Expected Behaviour**: Graceful error handling with a fallback invoice number generation strategy.
- **Actual Behaviour**: If invoice number generation fails, the entire invoice creation fails.
- **Severity**: Medium
- **Priority**: Medium
- **Risk Level**: Low
- **Suggested Resolution**: Implement a fallback invoice number generation (e.g., timestamp-based) when the primary generator fails.

### ISS-017: Client-Side Sort on Large Datasets
- **Module**: All Modules
- **Feature**: Data Listing
- **Related Test Case**: TC-LEAD-002, TC-DEAL-002, TC-PROJ-002, TC-TASK-002
- **File Paths**: Multiple firestore modules
- **Problem**: Many firestore query functions avoid `orderBy` clauses due to "composite index may not exist" concerns, and instead perform client-side sorting. This is inefficient for large datasets (fetching all documents just to sort and filter client-side).
- **Expected Behaviour**: Use Firestore composite indexes for efficient server-side sorting and filtering.
- **Actual Behaviour**: Client-side sort after fetching all documents.
- **Business Impact**: As data grows, performance will degrade significantly.
- **Technical Impact**: O(n) memory and bandwidth for every list query, where n is total documents in collection.
- **Severity**: Medium
- **Priority**: Medium
- **Risk Level**: Medium
- **Suggested Resolution**: Create required composite indexes in Firestore and use server-side `orderBy` + `limit` for pagination.

### ISS-018: Missing Validation on Server-Side Firestore Operations
- **Module**: All Modules
- **Feature**: CRUD Operations
- **Related Test Case**: Multiple
- **File Paths**: All firestore modules
- **Problem**: Firestore CRUD functions (create, update) do not validate input data with Zod schemas. They accept `Partial<EntityInput>` or raw data directly and pass it to Firestore. This means malformed data, missing required fields, or invalid values can be written to Firestore.
- **Expected Behaviour**: Server-side validation should enforce schema constraints before writing to Firestore.
- **Actual Behaviour**: Data is passed directly to `addDoc`/`updateDoc` without validation.
- **Root Cause**: Validation is only performed client-side in forms; no server-side validation.
- **Business Impact**: Invalid or malicious data can be written to the database through API calls or direct Firestore access.
- **Technical Impact**: Data integrity cannot be guaranteed.
- **Severity**: High
- **Priority**: High
- **Risk Level**: High
- **Suggested Resolution**: Add Zod validation to all server-side create/update functions before writing to Firestore.

### ISS-019: Missing Input Validation in Server Actions
- **Module**: Server Actions
- **Feature**: All Server Actions
- **Related Test Case**: TC-SA-001, TC-SA-002, TC-SA-003
- **File Paths**: `app/actions/*.ts`
- **Problem**: Server actions accept raw data from the client without Zod validation. The `invite-actions.ts` and `dashboard.ts` actions do not validate their input parameters.
- **Expected Behaviour**: Server actions should validate all input using Zod schemas before processing.
- **Actual Behaviour**: Input data is used directly without validation.
- **Severity**: High
- **Priority**: High
- **Risk Level**: High
- **Suggested Resolution**: Add Zod validation to all server action inputs.

---

## 4. Multi-Tenancy Issues

### ISS-020: getUsers() — Cross-Org Data Exposure
- **Module**: Users
- **Feature**: User Listing
- **Related Test Case**: TC-USER-005
- **File Path**: `lib/firestore/users.ts:188-205`
- **Function**: `getUsers()`
- **Problem**: `getUsers()` reads ALL users from the `users` collection without any organization filter. In a multi-tenant system, this means any user list component will display users from all organizations.
- **Expected Behaviour**: Should filter by `organizationId` or restrict to the current organization.
- **Actual Behaviour**: No filtering.
- **Severity**: High
- **Priority**: High
- **Risk Level**: High
- **Suggested Resolution**: Add organization membership filtering or scope queries to the current org.

### ISS-021: Organization ID Not Always Set
- **Module**: All Modules
- **Feature**: Data Creation
- **Related Test Case**: TC-SEC-001
- **File Paths**: All firestore modules
- **Problem**: The `organizationId` field is optional in many firestore create functions. If `organizationId` is not provided, the document is created without it, making it invisible to org-scoped queries and potentially accessible cross-org.
- **Expected Behaviour**: `organizationId` should always be required and validated.
- **Actual Behaviour**: Functions accept `organizationId?: string` and conditionally add it.
- **Severity**: High
- **Priority**: High
- **Risk Level**: High
- **Suggested Resolution**: Make `organizationId` required for all CRM entity creation functions.

---

## 5. Email & Notification Issues

### ISS-022: Email Send API — No Auth
- **Module**: Email
- **Feature**: Email Send
- **Related Test Case**: TC-API-002
- **File Path**: `app/api/email/send/route.ts`
- **Problem**: No authentication on email send endpoint. (Duplicate of ISS-001 for completeness)
- **Severity**: Critical
- **Priority**: Critical

### ISS-023: Notifications — Empty Catch Blocks
- **Module**: Notifications
- **Feature**: Notification Creation
- **Related Test Case**: TC-NOTIF-001
- **File Paths**: `lib/firestore/deals.ts:278`, `lib/firestore/deals.ts:303`, `lib/firestore/invoices.ts:114`, `lib/firestore/emails.ts:113,124`
- **Problem**: Multiple notification creation and email tracking functions use empty `catch {}` blocks that silently swallow errors. This makes debugging notification failures impossible and hides potential issues.
- **Expected Behaviour**: Errors should be logged to facilitate debugging and monitoring.
- **Actual Behaviour**: `catch {}` — errors are completely ignored.
- **Business Impact**: Silent failures in notifications mean users may not receive important alerts about deal status changes, task assignments, or invoice payments.
- **Technical Impact**: No visibility into notification system health.
- **Severity**: Medium
- **Priority**: Medium
- **Risk Level**: Medium
- **Suggested Resolution**: Add `console.error()` logging to all empty catch blocks.

### ISS-024: Email Tracking — No Rate Limiting
- **Module**: Email
- **Feature**: Email Tracking
- **Related Test Case**: TC-EMAIL-003, TC-EMAIL-004
- **File Paths**: `app/api/email/track/click/route.ts`, `app/api/email/track/open/[id]/route.ts`
- **Problem**: Email tracking endpoints have no rate limiting. An attacker could spam the tracking endpoints to artificially inflate open/click counts or perform DoS attacks.
- **Expected Behaviour**: Rate limiting should be applied to tracking endpoints.
- **Actual Behaviour**: No rate limiting.
- **Severity**: Low
- **Priority**: Low
- **Risk Level**: Low
- **Suggested Resolution**: Add rate limiting or token-based verification to tracking endpoints.

---

## 6. Project & Task Issues

### ISS-025: Project Creation — clientId Field Doesn't Exist
- **Module**: Projects
- **Feature**: Lead-to-Project Conversion
- **Related Test Case**: TC-LEAD-008
- **File Path**: `lib/firestore/leads.ts:209`
- **Function**: `convertLeadToProject()`
- **Problem**: The `convertLeadToProject` function sets `clientId: ""` on the project data, but the `Project` interface in `types/crm.ts` does not have a `clientId` field. This field will be written to Firestore as an extra field not defined in the type.
- **Expected Behaviour**: Should not set fields that don't exist in the type definition.
- **Actual Behaviour**: `clientId: ""` is passed to `createProject`, which will persist it to Firestore even though it's not in the type.
- **Severity**: Low
- **Priority**: Low
- **Risk Level**: Low
- **Suggested Resolution**: Remove `clientId` from the project data or add it to the `Project` type.

### ISS-026: Task Archive — Status Check Before Unarchive
- **Module**: Tasks
- **Feature**: Task Archive/Unarchive
- **Related Test Case**: TC-TASK-003
- **File Path**: `lib/firestore/tasks.ts:38-46`
- **Function**: `unarchiveTask()`
- **Problem**: `unarchiveTask()` does not verify that the task was previously archived before setting `isArchived: false`. It also doesn't check if the task exists.
- **Expected Behaviour**: Should verify task exists and was previously archived before unarchiving.
- **Actual Behaviour**: Directly updates without checks.
- **Severity**: Low
- **Priority**: Low
- **Risk Level**: Low
- **Suggested Resolution**: Add existence and archive status checks before unarchiving.

---

## 7. Middleware & Routing Issues

### ISS-027: Legacy Dashboard Layout — Redundant AuthProvider + AuthGate
- **Module**: Routing
- **Feature**: Legacy Dashboard Routes
- **Related Test Case**: TC-MW-001
- **File Path**: `app/(dashboard)/layout.tsx`
- **Problem**: The legacy dashboard layout wraps content in `AuthProvider` + `AuthGate`, but the middleware redirects all legacy dashboard routes to `/org` before the layout is rendered. This means the AuthProvider and AuthGate in the legacy layout are never actually used.
- **Expected Behaviour**: Redundant code should be removed to avoid confusion.
- **Actual Behaviour**: AuthProvider + AuthGate wrap content that is never rendered (always redirected before reaching layout).
- **Severity**: Low
- **Priority**: Low
- **Risk Level**: Low
- **Suggested Resolution**: Remove the legacy dashboard layout or simplify it since middleware handles all redirects.

### ISS-028: Admin Route Protection — Inconsistent
- **Module**: Routing
- **Feature**: Admin Route Protection
- **Related Test Case**: TC-MW-003
- **File Path**: `middleware.ts:59-68`
- **Problem**: The admin route protection in middleware checks for `Authorization` header or `session` cookie, but it redirects to `/login` for unauthenticated requests. It does NOT check the user's role, so any authenticated user can access `/admin` routes.
- **Expected Behaviour**: Admin routes should also verify the user has admin role, not just authentication.
- **Actual Behaviour**: Only checks for authentication, not authorization.
- **Severity**: High
- **Priority**: High
- **Risk Level**: High
- **Suggested Resolution**: Add role verification to admin route protection in middleware, or rely on server-side role checks in the admin API routes.

---

## 8. UI/UX & State Issues

### ISS-029: AuthGate — Public Route Detection for Change-Password
- **Module**: Auth
- **Feature**: Auth Gate
- **Related Test Case**: TC-AUTH-005
- **File Path**: `components/auth/AuthGate.tsx:68`
- **Problem**: The `AuthGate` has a redirect that sends users away from `/change-password` to `/org` when they are already logged in. However, users with `isFirstLogin: true` need to be on `/change-password`. The redirect to `/org` happens before the `isFirstLogin` check can redirect them back.
- **Expected Behaviour**: The redirect logic should account for first-login users.
- **Actual Behaviour**: The `if (pathname === "/login" || ...)` block at line 68 redirects to `/org` even for first-login users on `/change-password`, because `change-password` is NOT in this condition. The first-login check at line 54-58 would redirect them back, but only after the redirect already happened.
- **Root Cause**: The `change-password` path is not included in the redirect-signed-in-users-away list.
- **Severity**: Medium
- **Priority**: Medium
- **Risk Level**: Medium
- **Suggested Resolution**: Add `/change-password` to the redirect condition or remove the redirect entirely and let the first-login check handle it.

### ISS-030: RBACGuard — Missing Dependency in useEffect
- **Module**: Auth
- **Feature**: RBACGuard
- **Related Test Case**: TC-PERM-001
- **File Path**: `components/auth/RBACGuard.tsx:99`
- **Problem**: The `useEffect` in `RBACGuard` has `currentMember` and `currentOrg` as implicit dependencies that are used in the callback but not listed in the dependency array. This could lead to stale closure values.
- **Expected Behaviour**: All reactive values used in the effect should be in the dependency array.
- **Actual Behaviour**: `currentMember` and `currentOrg` are used in the effect but not in the dependency array.
- **Severity**: Low
- **Priority**: Low
- **Risk Level**: Low
- **Suggested Resolution**: Add `currentMember` and `currentOrg` to the dependency array, or restructure to use explicit state.

---

## 9. Configuration & Environment Issues

### ISS-031: Redis init — Module-Level Instantiation
- **Module**: System
- **Feature**: Redis Caching
- **Related Test Case**: TC-CACHE-003
- **File Path**: `lib/redis.ts:48`
- **Problem**: `export const redis = getRedis()` is called at module level, which means Redis is initialized immediately when the module is first imported. This throws an error if the environment variables are not set, even if the importing module doesn't use Redis.
- **Expected Behaviour**: Redis should be lazily initialized only when actually used.
- **Actual Behaviour**: Module-level instantiation throws on import if env vars are missing.
- **Severity**: Low
- **Priority**: Low
- **Risk Level**: Low
- **Suggested Resolution**: Use `getRedis()` function calls instead of the module-level `redis` export.

### ISS-032: Firestore Rules — No Index Definitions
- **Module**: System
- **Feature**: Firestore Configuration
- **Related Test Case**: Multiple
- **File Path**: `firestore.indexes.json`
- **Problem**: The codebase has multiple comments about avoiding `orderBy` due to missing composite indexes. The `firestore.indexes.json` file may not contain the required composite indexes for efficient queries.
- **Expected Behaviour**: All required composite indexes should be defined in `firestore.indexes.json`.
- **Actual Behaviour**: Code falls back to client-side sorting to avoid index errors.
- **Severity**: Medium
- **Priority**: Medium
- **Risk Level**: Medium
- **Suggested Resolution**: Audit all Firestore queries and create the required composite indexes.

---

## Issue Distribution by Module

| Module | Critical | High | Medium | Low | Total |
|--------|----------|------|--------|-----|-------|
| Email | 2 | 0 | 1 | 1 | 4 |
| Security | 1 | 1 | 1 | 0 | 3 |
| System/Rate Limit | 1 | 0 | 0 | 0 | 1 |
| Auth/RBAC | 1 | 1 | 1 | 1 | 4 |
| Dashboard | 0 | 1 | 0 | 0 | 1 |
| Admin | 0 | 1 | 0 | 0 | 1 |
| Leads | 0 | 2 | 1 | 0 | 3 |
| Users | 0 | 2 | 0 | 0 | 2 |
| Invoices | 0 | 1 | 1 | 0 | 2 |
| Projects | 0 | 0 | 0 | 1 | 1 |
| Tasks | 0 | 0 | 0 | 1 | 1 |
| Notifications | 0 | 0 | 1 | 0 | 1 |
| Routing | 0 | 1 | 0 | 1 | 2 |
| Permissions | 0 | 1 | 1 | 0 | 2 |
| Audit | 0 | 0 | 1 | 0 | 1 |
| Redis | 0 | 0 | 0 | 1 | 1 |
| Firestore Indexes | 0 | 0 | 1 | 0 | 1 |
| **Total** | **7** | **12** | **8** | **5** | **32** |

---

## Risk Ratings

### Critical Risk (7)
- ISS-001: Email send API — no auth
- ISS-002: Invoice send API — no auth
- ISS-003: Open redirect vulnerability in click tracking
- ISS-004: Rate limiter never applied anywhere
- ISS-022: Duplicate of ISS-001
- (Also ISS-005, ISS-006, ISS-007, ISS-008 are high risk)

### High Risk (12)
- ISS-005: Weak encryption key fallback
- ISS-007: Dashboard server action — no session validation
- ISS-008: Admin actions — missing auth verification
- ISS-010: Invoice template enum mismatch
- ISS-011: getUserProfile — no org filter
- ISS-012: Lead conversion — no permission check
- ISS-013: Hard delete for leads/contacts/companies
- ISS-014: Permission utils use client Firestore
- ISS-018: Missing server-side validation
- ISS-019: Missing input validation in server actions
- ISS-020: getUsers cross-org data exposure
- ISS-028: Admin route protection — role not checked

### Medium Risk (8)
- ISS-006: Static salt in key derivation
- ISS-009: Lead value validation type mismatch
- ISS-015: Audit logs use client Firestore
- ISS-016: Invoice number generator error handling
- ISS-017: Client-side sort on large datasets
- ISS-023: Empty catch blocks in notifications
- ISS-029: AuthGate redirect logic for change-password
- ISS-032: Missing Firestore composite indexes

### Low Risk (5)
- ISS-024: Email tracking — no rate limiting
- ISS-025: clientId field doesn't exist in Project type
- ISS-026: Unarchive without status check
- ISS-027: Redundant legacy dashboard layout
- ISS-030: RBACGuard missing dependency
- ISS-031: Module-level Redis instantiation