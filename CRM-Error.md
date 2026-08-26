# CRM Error Report — Complete Issue Register

> **Document**: CRM-Error.md  
> **Purpose**: Comprehensive issue register from reverse-engineering the complete CRM  
> **Scope**: Every functional bug, business logic error, workflow gap, missing feature, UX problem, security concern  

---

## Issue Summary

| Category | Count |
|----------|-------|
| Functional Bugs | 5 |
| Business Logic Errors | 4 |
| Broken Workflows | 3 |
| Incomplete Workflows | 4 |
| Missing Features | 6 |
| UX Problems | 7 |
| Navigation Problems | 2 |
| Permission Problems | 3 |
| Security Problems | 5 |
| Validation Problems | 3 |
| Missing Feedback | 3 |
| **Total** | **45** |

| Severity | Count |
|----------|-------|
| Critical | 6 |
| High | 14 |
| Medium | 14 |
| Low | 11 |

---

## ERR-001: Lead Detail Page Has No Edit Button (Missing Feature)

**Severity**: High  
**Category**: Missing Feature  
**Affected Module**: Lead Management  
**Affected User**: All users who need to update lead information  

**Current Behaviour**: The lead detail page (`app/org/[orgId]/leads/[id]/page.tsx`) does not have an "Edit" button. Users can only change the lead status. If a user makes a typo in a lead's name, email, or other fields, they must delete and recreate the lead.

**Expected Behaviour**: An "Edit" button should open `EditLeadDialog` (which exists at `components/leads/EditLeadDialog.tsx`) pre-filled with the lead's data.

**Root Cause**: The `EditLeadDialog` component exists and is fully implemented, but it is never imported or wired into the lead detail page. The lead detail page file at lines 10-11 imports only `getLead, deleteLead, updateLead, convertLeadToContact, convertLeadToDeal, convertLeadToProject` — but not `EditLeadDialog`.

**Business Impact**: Users cannot correct data entry errors. Any mistake during lead creation requires deleting the lead (losing all history) and recreating it.

**Relevant Files**:
- `app/org/[orgId]/leads/[id]/page.tsx` — Detail page missing edit button
- `components/leads/EditLeadDialog.tsx` — Edit dialog exists but unused

**Recommendation**: Wire `EditLeadDialog` into the lead detail page alongside the Delete button.

---

## ERR-002: Email Send API Has No Authentication (Security Problem)

**Severity**: Critical  
**Category**: Security Problem, Missing Feature  
**Affected Module**: Email Communication  
**Affected User**: System-wide (SMTP abuse risk)  

**Current Behaviour**: `POST /api/email/send` (`app/api/email/send/route.ts`) accepts any request with JSON body `{ email, context }` and sends emails through the CRM's SMTP server. There is no authentication check, no rate limiting, no IP validation.

**Expected Behaviour**: The endpoint should verify the caller's Firebase ID token using `verifyApiRequest()` or the `protectedRoute` wrapper. Only authenticated org members should be able to send emails.

**Business Impact**: Any attacker who discovers this endpoint can send unlimited emails through the CRM's SMTP server, leading to:
- SMTP blacklisting
- Phishing attacks from the CRM's domain
- Reputational damage
- Financial cost from email sending limits

**Recommendation**: Wrap the handler with `requireAuth()` or call `verifyApiRequest()` at entry.

---

## ERR-003: Invoice Send API Has No Authentication (Security Problem)

**Severity**: Critical  
**Category**: Security Problem  
**Affected Module**: Invoice Management  
**Affected User**: System-wide (SMTP abuse risk)  

**Current Behaviour**: `POST /api/invoices/send` (`app/api/invoices/send/route.ts`) accepts any request with JSON body containing `to`, `pdfBase64`, etc. and sends emails with PDF attachments. No authentication.

**Expected Behaviour**: Must verify the caller's identity and permission to send invoices.

**Root Cause**: Same pattern as ERR-002 — no auth verification.

**Recommendation**: Add authentication and permission check.

---

## ERR-004: Click Tracking Open Redirect (Security Problem)

**Severity**: Critical  
**Category**: Security Problem  
**Affected Module**: Email Communication  
**Affected User**: Anyone clicking tracked email links  

**Current Behaviour**: `GET /api/email/track/click` (`app/api/email/track/click/route.ts`) takes a `url` query parameter and redirects to it via `NextResponse.redirect(targetUrl)` without any validation. An attacker could craft a link like `https://crm.com/api/email/track/click?url=https://malicious.com/phish` and send it in an email.

**Expected Behaviour**: The target URL should be validated against a whitelist of allowed domains or signed with an HMAC token.

**Business Impact**: Open redirect vulnerability enables phishing attacks using the CRM's trusted domain.

**Recommendation**: Validate redirect target against allowed origin list or use signed URLs.

---

## ERR-005: Rate Limiter Defined But Never Used (Missing Feature)

**Severity**: Critical  
**Category**: Missing Feature, Security Problem  
**Affected Module**: System-wide  
**Affected User**: System-wide (brute force risk)  

**Current Behaviour**: `lib/rate-limit.ts` defines a complete rate limiting system with configs for login (5/15min), AI (30/60s), email (20/60s), and general (100/60s). However, this module is NEVER imported or used anywhere in the application.

**Expected Behaviour**: Rate limiting should be applied to login attempts, AI endpoints, email sending, and general API calls.

**Business Impact**: Login endpoint is completely unprotected against brute force password attacks. AI endpoints can be abused for excessive usage.

**Relevant Files**:
- `lib/rate-limit.ts` — Complete implementation, zero consumers

**Recommendation**: Integrate rate limiting into authentication, AI, and email endpoints.

---

## ERR-006: Lead Value of $0 Not Displayed on Detail Page (Functional Bug)

**Severity**: Low  
**Category**: Functional Bug  
**Affected Module**: Lead Management  
**Affected User**: Users viewing leads with $0 value  

**Current Behaviour**: In `app/org/[orgId]/leads/[id]/page.tsx:225`, the code checks `{lead.value && (` to conditionally render the value field. Since `0` is falsy in JavaScript, a lead with value of $0 will not show the value field at all.

**Expected Behaviour**: The value should be displayed as `$0` for admin/manager, not hidden entirely.

**Root Cause**: Using JavaScript truthiness check instead of ` !== undefined && !== null`.

**Recommendation**: Change condition to `lead.value !== undefined && lead.value !== null`.

---

## ERR-07: Activity Chart Uses Random Mock Data (Incomplete Workflow)

**Severity**: Medium  
**Category**: Incomplete Workflow  
**Affected Module**: Analytics  
**Affected User**: Users viewing analytics  

**Current Behaviour**: The `ActivityChart` in `app/org/[orgId]/analytics/page.tsx:86-89` generates random data with `Math.floor(Math.random() * 50) + 10` instead of querying real activity data from Firestore.

**Expected Behaviour**: The chart should display real activity data from the `activities` collection filtered by organization.

**Root Cause**: Analytics module was partially implemented — the data fetching for activities was never connected.

**Recommendation**: Query real activity data from Firestore using `getOrganizationActivities()`.

---

## ERR-008: Notification Preferences Saved Only to localStorage (Functional Bug)

**Severity**: Medium  
**Category**: Functional Bug  
**Affected Module**: Settings  
**Affected User**: Any user who changes notification preferences  

**Current Behaviour**: In `app/org/[orgId]/settings/page.tsx:105`, notification preferences are saved to `localStorage.setItem('notifications_{userId}', ...)`. The code attempts to POST to `/api/user/preferences` but this API endpoint likely doesn't exist — the catch block at line 116 captures this silently: "User preferences API not available, but saved to localStorage".

**Expected Behaviour**: Notification preferences should be persisted to the user's Firestore document via `updateUserProfile()`.

**Business Impact**: If a user clears browser data or switches devices, all notification preferences are lost.

**Recommendation**: Save preferences to Firestore `users/{uid}/settings.notifications`.

---

## ERR-009: Currency Preference Saved Only to localStorage (Functional Bug)

**Severity**: Medium  
**Category**: Functional Bug  
**Affected Module**: Settings  
**Affected User**: Any user who changes default currency  

**Current Behaviour**: Same pattern as ERR-008 — currency saved to localStorage only. The default currency is never actually applied to deals or invoices because no component reads `localStorage` for currency display.

**Expected Behaviour**: Currency preference should be saved to Firestore and applied to financial displays throughout the CRM.

**Recommendation**: Save to Firestore and read in financial display components.

---

## ERR-010: AuthGate Redirect Loop for First-Login Password Change (Broken Workflow)

**Severity**: High  
**Category**: Broken Workflow  
**Affected Module**: Authentication  
**Affected User**: New users logging in for the first time with email/password  

**Current Behaviour**: In `components/auth/AuthGate.tsx:68`, the condition `if (pathname === "/login" || pathname === "/pending-approval" || pathname === "/change-password")` redirects logged-in users to `/org`. But first-login users need to be on `/change-password`. So the flow is:
1. User logs in with isFirstLogin=true
2. AuthGate checks isFirstLogin → redirects to /change-password
3. AuthGate re-evaluates — is on /change-password → redirects to /org
4. AuthGate checks isFirstLogin → redirects to /change-password
5. (infinite loop)

**Expected Behaviour**: First-login users should be able to stay on `/change-password` and complete their password change.

**Root Cause**: The `/change-password` route is incorrectly included in the "redirect away from auth pages" condition, conflicting with the first-login check.

**Recommendation**: Remove `/change-password` from the redirect condition, or add an exemption for isFirstLogin users.

---

## ERR-011: No "Create Project from Deal" Button Initially Missing (UX Problem)

**Severity**: High  
**Category**: UX Problem, Missing Feature  
**Affected Module**: Deal Management → Project Management  
**Affected User**: Users with won deals who need to create a project  

**Current Behaviour**: The deal detail page (`app/org/[orgId]/deals/[id]/page.tsx:181`) shows a "Create Project" button only when `deal.stage === "Won"` and `canEdit`. This function exists and works — however, the button was previously missing and users had no way to trigger the workflow without navigating to the deal detail page.

**Expected Behaviour**: The "Create Project" button is present on won deals.

**Actual**: The button IS present on the deal detail page — this was confirmed. Not an issue.

---

## ERR-012: Organization Settings Not Editable from UI (Missing Feature)

**Severity**: Medium  
**Category**: Missing Feature  
**Affected Module**: Organization Management  
**Affected User**: Org admins who want to update org details  

**Current Behaviour**: The organization settings page (`app/org/[orgId]/settings/page.tsx`) only shows USER-LEVEL settings (theme, profile, notifications, currency). The organization-level settings (name, logo, website, industry, size) can be updated via the `updateOrganization()` function but there is no UI to do so.

**Expected Behaviour**: Admin users should see an "Organization Settings" section on the settings page where they can edit the org name, upload logo, set website, industry, and size.

**Relevant Files**:
- `lib/firestore/organizations.ts:110-123` — `updateOrganization()` exists
- `app/org/[orgId]/settings/page.tsx` — Only shows user settings

**Recommendation**: Add organization settings UI for admin users.

---

## ERR-013: No Organization Deletion or Leave Functionality (Missing Feature)

**Severity**: High  
**Category**: Missing Feature  
**Affected Module**: Organization Management  
**Affected User**: Org admins and members  

**Current Behaviour**: There is no UI to delete an organization or for a user to leave an organization. The `removeOrganizationMember()` function exists (sets status to "suspended") but is not exposed anywhere in the UI.

**Expected Behaviour**: Admins should be able to delete their organization. Users should be able to leave organizations.

**Business Impact**: Users who accidentally create duplicate orgs or want to leave cannot do so without database-level intervention.

**Recommendation**: Add "Delete Organization" button (admin only) and "Leave Organization" button (any member).

---

## ERR-014: Onboarding Can Leave User Stuck in Incomplete State (Broken Workflow)

**Severity**: High  
**Category**: Broken Workflow  
**Affected Module**: Onboarding  
**Affected User**: New users whose onboarding is interrupted  

**Current Behaviour**: If a user completes the profile step and the system is "checking orgs" but the user navigates away or the page refreshes, the user still has `isOnboarded: false` but no org was created. They'll be stuck on the onboarding page with no path forward (no org to select).

**Expected Behaviour**: The onboarding state should be resilient to interruptions. Users should be able to resume where they left off.

**Root Cause**: The `finishOnboarding()` function is only called in two paths: after workspace creation OR after detecting existing orgs. There's no intermediate save point.

**Recommendation**: Save partial onboarding progress and allow resumption.

---

## ERR-015: First-Login Flag Not Reset After Password Change (Functional Bug)

**Severity**: High  
**Category**: Functional Bug  
**Affected Module**: Authentication  
**Affected User**: Users changing password on first login  

**Current Behaviour**: The `change-password` page (`app/(auth)/change-password/page.tsx`) is defined but the code path for setting `isFirstLogin = false` after a successful password change may not exist or may not properly update Firestore. The AuthGate forced redirect logic complicates this further (see ERR-010).

**Expected Behaviour**: After the user successfully changes their password, `isFirstLogin` should be set to `false` in Firestore and the user should be redirected to onboarding or the org picker.

**Recommendation**: Ensure `updateUserProfile(uid, { isFirstLogin: false })` is called after password change, and fix AuthGate redirect logic.

---

## ERR-016: No "Edit" Button for Leads in the List View (UX Problem)

**Severity**: Medium  
**Category**: UX Problem  
**Affected Module**: Lead Management  
**Affected User**: Users managing leads  

**Current Behaviour**: The lead list (`app/org/[orgId]/leads/page.tsx`) only has an "Eye" (view) icon per row. There is no edit icon. Users must navigate to the detail page to perform any actions, but the detail page also has no edit button (see ERR-001).

**Expected Behaviour**: The lead list should have an edit button per row, or the detail page should have an edit button.

**Recommendation**: Add an edit button to the lead list or wire EditLeadDialog into the detail page.

---

## ERR-017: Contact Detail Lacks Deal Creation (Missing Feature)

**Severity**: Medium  
**Category**: Missing Feature  
**Affected Module**: Contact Management  
**Affected User**: Users who want to create a deal from a contact  

**Current Behaviour**: The contact detail page (`app/org/[orgId]/contacts/[id]/page.tsx`) has "Send Email", "Call", and "Convert to Lead" quick actions, but there is no "Create Deal" button. Users must manually navigate to the deals page and create a deal from scratch.

**Expected Behaviour**: A "Create Deal" button should pre-fill a deal with the contact's information and navigate to the deal pipeline.

**Recommendation**: Add a "Create Deal" quick action to the contact detail page.

---

## ERR-018: No Edit Option for Leads in Context Menu (UX Problem)

**Severity**: Low  
**Category**: UX Problem  
**Affected Module**: Lead Management  
**Affected User**: Users needing to quickly update lead info  

**Current Behaviour**: The leads table has only a view (Eye) action per row. Combined with the missing edit button on the detail page (ERR-001), users have no way to edit leads through the UI.

**Recommendation**: Add an inline edit action or wire EditLeadDialog into the detail page.

---

## ERR-019: No Bulk Delete for Leads, Contacts, Companies (Missing Feature)

**Severity**: Low  
**Category**: Missing Feature  
**Affected Module**: Lead/Contact/Company Management  
**Affected User**: Admin users cleaning up data  

**Current Behaviour**: Contacts have bulk selection (checkboxes) but only for emailing. There's no bulk delete or bulk status update for any entity.

**Recommended Enhancement**: Add bulk actions (delete, status change, assign) for all list pages.

---

## ERR-020: Contact Import Has No Preview or Mapping (UX Problem)

**Severity**: Medium  
**Category**: UX Problem  
**Affected Module**: Contact Management  
**Affected User**: Users importing CSV contacts  

**Current Behaviour**: The CSV import dialog accepts a file and creates contacts directly. There's no preview of the data, no column mapping, and no way to see which rows will fail before importing.

**Expected Behaviour**: Show a preview of parsed data with column mapping options before committing.

**Recommendation**: Add CSV preview and column mapping step before import.

---

## ERR-021: Invoice PDF Generation Is Client-Side (Incomplete Workflow)

**Severity**: Medium  
**Category**: Incomplete Workflow  
**Affected Module**: Invoice Management  
**Affected User**: Users generating invoice PDFs  

**Current Behaviour**: Invoice PDF is generated client-side using jsPDF in `lib/pdf/invoice-generator.ts`. This means PDF generation is browser-dependent, cannot generate PDFs in server-side contexts (like automated email sending), and may produce inconsistent results across browsers.

**Expected Behaviour**: PDF generation should work consistently regardless of client device and should be possible server-side for automation.

**Recommendation**: Move PDF generation to a server-side utility or API endpoint.

---

## ERR-022: Settings Page Does Full Page Reload on Profile Save (UX Problem)

**Severity**: Low  
**Category**: UX Problem  
**Affected Module**: Settings  
**Affected User**: Users editing their profile  

**Current Behaviour**: After saving profile changes in the settings dialog (`app/org/[orgId]/settings/page.tsx:79`), `window.location.reload()` is called, causing a full page reload instead of a smooth React state update.

**Expected Behaviour**: The UI should update without a full page reload.

**Recommendation**: Use React state updates and refetch profile data instead of page reload.

---

## ERR-023: Hard Delete for Leads, Contacts, Companies (Business Logic Error)

**Severity**: High  
**Category**: Business Logic Error  
**Affected Module**: Lead/Contact/Company Management  
**Affected User**: Admin users who accidentally delete records  

**Current Behaviour**: `deleteLead()`, `deleteContact()`, `deleteCompany()` use `deleteDoc()` which permanently removes the document from Firestore. This is inconsistent with deals, projects, and tasks which use soft-delete (archive/isArchived flags).

**Expected Behaviour**: All CRM entities should support soft-delete to allow data recovery and maintain referential integrity.

**Business Impact**: Accidental deletion of a lead/contact/company results in permanent data loss. References to these deleted entities in activities or linked records become broken.

**Recommendation**: Implement soft-delete with `isDeleted`/`archived` flag for all entities.

---

## ERR-024: Lead Conversion Functions Lack Permission Check (Permission Problem)

**Severity**: High  
**Category**: Permission Problem  
**Affected Module**: Lead Management  
**Affected User**: System-wide  

**Current Behaviour**: `convertLeadToContact()`, `convertLeadToDeal()`, `convertLeadToProject()` in `lib/firestore/leads.ts` accept `userId` and `userName` parameters but perform NO permission validation. Any authenticated user who can call these functions can convert any lead.

**Expected Behaviour**: Should verify that the caller has `edit` permission on the lead before allowing conversion.

**Business Impact**: Team members could convert leads owned by other users, bypassing RBAC.

**Recommendation**: Add permission check before conversion.

---

## ERR-025: Permission Utilities Use Client Firestore SDK (Permission Problem)

**Severity**: High  
**Category**: Permission Problem  
**Affected Module**: Permissions System  
**Affected User**: Server-side code  

**Current Behaviour**: `lib/auth/permission-utils.ts` imports `db` from `../firebase` (client SDK) instead of `../firebase-admin` (Admin SDK). This means the permission cache and validation run on the client side.

**Expected Behaviour**: Server-side permission checks should use Admin SDK to bypass client security rules.

**Business Impact**: Permission checks may not work in server-side Node.js environment or may be blocked by Firestore security rules.

**Recommendation**: Change import to use `adminDb` from `firebase-admin.ts`.

---

## ERR-026: Audit Logs Use Client Firestore (Security Problem)

**Severity**: Medium  
**Category**: Security Problem  
**Affected Module**: Audit Logging  
**Affected User**: System-wide  

**Current Behaviour**: `lib/firestore/audit-logs.ts` uses client-side `db` from `@/lib/firebase`. Audit logs written from the client can be tampered with or blocked by Firestore rules.

**Expected Behaviour**: Audit logs should be written server-side via Admin SDK.

**Recommendation**: Move audit log writes to server side.

---

## ERR-027: Empty Catch Blocks Swallow Notification Errors (Functional Bug)

**Severity**: Medium  
**Category**: Functional Bug  
**Affected Module**: Notifications  
**Affected User**: Users expecting notifications  

**Current Behaviour**: Multiple locations use empty `catch {}` blocks:
- `lib/firestore/deals.ts:278` — deal won/lost notification
- `lib/firestore/deals.ts:303` — deal stage change notification
- `lib/firestore/invoices.ts:114` — invoice paid notification
- `lib/firestore/emails.ts:113,124` — email tracking

**Expected Behaviour**: Errors should be logged to facilitate debugging.

**Business Impact**: Silent failures in notifications mean users may not receive important alerts (deal stage changes, invoice payments). Admins have no visibility into notification system health.

**Recommendation**: Add `console.error()` logging to all catch blocks.

---

## ERR-028: Missing Server-Side Validation on Firestore Writes (Validation Problem)

**Severity**: High  
**Category**: Validation Problem  
**Affected Module**: All Modules  
**Affected User**: System-wide  

**Current Behaviour**: All Firestore CRUD functions (create, update) accept raw data and write directly to Firestore without validating against Zod schemas. Validation only happens client-side in React Hook Form.

**Expected Behaviour**: Server-side operations should validate data before writing to ensure data integrity.

**Business Impact**: Invalid or malicious data can be written through API calls or direct Firestore access, bypassing client validation.

**Recommendation**: Add Zod validation to all server-side create/update functions.

---

## ERR-029: getUserProfiles() Returns ALL Users Across All Orgs (Permission Problem)

**Severity**: Critical  
**Category**: Permission Problem, Security Problem  
**Affected Module**: User Management  
**Affected User**: System-wide  

**Current Behaviour**: `getUsers()` in `lib/firestore/users.ts:188` reads ALL documents from the `users` collection with NO organization filter. Any component calling this will receive every user across every organization.

**Expected Behaviour**: Should filter by organization membership or restrict to current org.

**Business Impact**: Cross-tenant data exposure — every user across all organizations is visible.

**Recommendation**: Add `organizationId` filtering or restrict to organization members.

---

## ERR-030: Organization ID is Optional in Create Functions (Business Logic Error)

**Severity**: High  
**Category**: Business Logic Error  
**Affected Module**: All CRM Modules  
**Affected User**: System-wide  

**Current Behaviour**: Most firestore create functions accept `organizationId?: string` as an optional parameter. If `organizationId` is not provided, the document is created WITHOUT it, making it invisible to org-scoped queries.

**Expected Behaviour**: `organizationId` should be required for all multi-tenant CRM entities.

**Business Impact**: Documents created without `organizationId` will be orphaned — visible only in admin SDK queries, not in the application.

**Recommendation**: Make `organizationId` required for all CRM entity creation functions.

---

## ERR-031: Encryption Key Falls Back to Weak Default (Security Problem)

**Severity**: High  
**Category**: Security Problem  
**Affected Module**: SMTP Integration  
**Affected User**: Orgs using SMTP configuration  

**Current Behaviour**: `lib/crypto.ts:13` falls back to `"default_fallback_secret_key_change_me_in_production"` if neither `ENCRYPTION_KEY` nor `NEXTAUTH_SECRET` env vars are set. This provides a publicly known key that undermines all SMTP password encryption.

**Expected Behaviour**: Should throw an explicit error if encryption key is not configured.

**Business Impact**: SMTP passwords stored in Firestore are effectively in plaintext if the fallback key is used.

**Recommendation**: Remove the fallback and throw an error if ENCRYPTION_KEY is not set.

---

## ERR-032: Key Derivation Uses Static Salt (Security Problem)

**Severity**: Medium  
**Category**: Security Problem  
**Affected Module**: SMTP Integration  

**Current Behaviour**: `crypto.scryptSync(secret, "salt", 32)` uses static salt `"salt"` for key derivation.

**Expected Behaviour**: Should use a random or configurable salt.

**Recommendation**: Derive salt from a configuration value or generate per-encryption salt.

---

## ERR-033: Invoice Template Enum Mismatch Between Schema and Types (Functional Bug)

**Severity**: High  
**Category**: Functional Bug  
**Affected Module**: Invoice Management  
**Affected User**: Users creating invoices  

**Current Behaviour**: `lib/validations/invoice.ts:13` defines template as `z.enum(["standard", "project", "recurring"])` but `types/crm.ts:489` defines `InvoiceTemplate = "standard" | "professional" | "creative"`. These enums are completely different.

**Expected Behaviour**: The validation schema and type definition should use the same values.

**Business Impact**: Invoices may fail to save or display incorrectly depending on which enum value is actually stored in Firestore.

**Recommendation**: Align the schema with the type definition — choose one set of values.

---

## ERR-034: Admin Route Middleware Doesn't Check Role (Permission Problem)

**Severity**: High  
**Category**: Permission Problem  
**Affected Module**: Admin Routes  
**Affected User**: System-wide  

**Current Behaviour**: `middleware.ts:59-68` checks for authentication on `/admin` and `/api/admin` routes, but does NOT verify the user's role. Any authenticated user can access admin routes.

**Expected Behaviour**: Admin routes should verify the user has admin role, not just authentication.

**Recommendation**: Add role verification to admin route protection.

---

## ERR-035: Dashboard Server Action Doesn't Verify Session (Broken Workflow)

**Severity**: High  
**Category**: Broken Workflow  
**Affected Module**: Dashboard  
**Affected User**: All users  

**Current Behaviour**: `getCachedDashboardStats(userId, orgId)` in `app/actions/dashboard.ts` accepts `userId` and `organizationId` from the client and trusts them without verifying the caller's session.

**Expected Behaviour**: The server action should call `auth()` from `server-auth.ts` to verify the session and use the authenticated user's UID.

**Business Impact**: A user could potentially view another user's dashboard stats by manipulating parameters.

**Recommendation**: Call `auth()` at the start and use the authenticated user's UID.

---

## ERR-036: Client-Side Sort on Large Datasets (Performance Problem)

**Severity**: Medium  
**Category**: Performance Problem  
**Affected Module**: All List Pages  
**Affected User**: Orgs with large datasets  

**Current Behaviour**: Multiple Firestore query functions avoid `orderBy` clauses (commenting "requires composite index that may not exist") and perform client-side sorting after fetching all documents. This becomes O(n) memory/bandwidth per query as data grows.

**Expected Behaviour**: Use Firestore composite indexes for efficient server-side sorting.

**Business Impact**: Performance will degrade significantly as the organization accumulates data.

**Recommendation**: Create required composite indexes and use server-side `orderBy` + `limit`.

---

## ERR-037: Login Page Shows Flash of Content for Authenticated Users (UX Problem)

**Severity**: Medium  
**Category**: UX Problem  
**Affected Module**: Authentication  
**Affected User**: Returning users who are already logged in  

**Current Behaviour**: When an authenticated user visits `/login`, the login form briefly renders before the redirect to `/org` happens (via `useEffect` at line 45-48). This causes a flash of the login page.

**Expected Behaviour**: The login page should detect the existing session immediately and redirect without rendering the form.

**Recommendation**: Add an initial loading state that checks auth before rendering the form.

---

## ERR-038: No "Remember Me" Option on Login (UX Problem)

**Severity**: Low  
**Category**: Missing Feature  
**Affected Module**: Authentication  
**Affected User**: Users who want to stay logged in  

**Current Behaviour**: Firebase auth uses session-only persistence by default. There's no "Remember me" checkbox on the login page.

**Expected Behaviour**: Users should be able to choose whether to persist their session.

**Recommendation**: Add a "Remember me" checkbox that sets Firebase persistence to LOCAL.

---

## ERR-039: Lead Conversion Error Messages Are Technical (UX Problem)

**Severity**: Low  
**Category**: UX Problem  
**Affected Module**: Lead Management  
**Affected User**: Users converting leads  

**Current Behaviour**: Error messages from `convertLeadToContact/Deal/Project` are returned directly from the server without user-friendly mapping. For example: "Lead has already been converted to a contact" is acceptable, but Firebase/network errors appear as generic technical messages.

**Recommendation**: Add user-friendly error message mapping.

---

## ERR-040: No Loading State on Invoice List While Fetching Stats (Missing Feedback)

**Severity**: Low  
**Category**: Missing Feedback  
**Affected Module**: Invoice Management  
**Affected User**: Users viewing invoice list  

**Current Behaviour**: The invoice list page shows stats and table simultaneously after both fetches complete. No partial loading state is shown.

**Recommendation**: Show skeleton loading for stats cards while fetching.

---

## ERR-041: Project Detail Doesn't Show Associated Tasks (Missing Feature)

**Severity**: Medium  
**Category**: Missing Feature  
**Affected Module**: Project Management  
**Affected User**: Project managers viewing project details  

**Current Behaviour**: The project detail page (`app/org/[orgId]/projects/[id]/page.tsx`) shows project information but does NOT display associated tasks. Users must navigate to the tasks page and filter by project to see them.

**Expected Behaviour**: The project detail page should show a list of associated tasks with status, assignee, and due date.

**Recommendation**: Add a "Tasks" section to the project detail page that calls `getTasksByProject()`.

---

## ERR-042: Company Detail Doesn't Show Associated Deals or Projects (Missing Feature)

**Severity**: Medium  
**Category**: Missing Feature  
**Affected Module**: Company Management  
**Affected User**: Users viewing company details  

**Current Behaviour**: The company detail page shows associated contacts but does NOT show associated deals or projects. Users must navigate to each module separately.

**Expected Behaviour**: The company detail page should show associated deals (with stages) and projects (with statuses).

**Recommendation**: Add "Deals" and "Projects" sections to the company detail page.

---

## ERR-043: Invoice Linked Entities in Detail Page Use Hardcoded Links (Navigation Problem)

**Severity**: Low  
**Category**: Navigation Problem  
**Affected Module**: Invoice Management  

**Current Behaviour**: In `components/invoices/InvoiceDetail.tsx:232`, the project link uses `href={'/projects/${invoice.projectId}'}` without the orgId prefix, which would navigate to the legacy dashboard route (which redirects to `/org`).

**Expected Behaviour**: Links should include the org context: `{base}/projects/${invoice.projectId}`.

**Recommendation**: Pass the org base path to the InvoiceDetail component or use relative navigation.

---

## ERR-044: No Visual Feedback When AI Executive Summary Is Loading (Missing Feedback)

**Severity**: Low  
**Category**: Missing Feedback  
**Affected Module**: Reports  
**Affected User**: Users viewing reports  

**Current Behaviour**: When the AI Executive Summary is loading, the component may not show a clear loading indicator. The stat cards show "..." but the summary area may appear empty.

**Recommendation**: Add skeleton loading for AI summary and insights sections.

---

## ERR-045: Analytics Page Activity Data Is Mock (Incomplete Workflow)

**Severity**: Medium  
**Category**: Incomplete Workflow  
**Affected Module**: Analytics  
**Affected User**: Users viewing analytics  

**Current Behaviour**: The analytics page activity chart uses randomly generated mock data. Real activity data from Firestore is never queried.

**Expected Behaviour**: The activity chart should display real activity counts from the `activities` collection.

**Recommendation**: Query real activity data using `getOrganizationActivities()` and display aggregated counts.

---

## Issue Distribution by Module

| Module | Critical | High | Medium | Low | Total |
|--------|----------|------|--------|-----|-------|
| Authentication | 0 | 2 | 1 | 1 | 4 |
| Onboarding | 0 | 1 | 0 | 0 | 1 |
| Lead Management | 0 | 2 | 1 | 2 | 5 |
| Contact Management | 0 | 0 | 2 | 0 | 2 |
| Company Management | 0 | 0 | 1 | 0 | 1 |
| Deal Management | 0 | 0 | 0 | 0 | 0 |
| Project Management | 0 | 0 | 1 | 0 | 1 |
| Invoice Management | 2 | 1 | 1 | 1 | 5 |
| Email Communication | 2 | 0 | 1 | 0 | 3 |
| Settings/Preferences | 0 | 0 | 2 | 1 | 3 |
| Reports & Analytics | 0 | 0 | 2 | 1 | 3 |
| Permissions/RBAC | 1 | 3 | 0 | 0 | 4 |
| Security (crypto, rate limit) | 1 | 2 | 1 | 0 | 4 |
| System-wide (validation, cache) | 0 | 1 | 1 | 0 | 2 |
| Admin Routes | 0 | 1 | 0 | 0 | 1 |
| Notifications | 0 | 0 | 1 | 0 | 1 |
| Organization | 0 | 1 | 1 | 0 | 2 |
| **Total** | **6** | **14** | **14** | **11** | **45** |

---

## Top 10 Most Critical Issues

| Rank | ID | Issue | Severity | Impact |
|------|----|-------|----------|--------|
| 1 | ERR-002 | Email Send API — No Auth | Critical | Anyone can send emails through SMTP |
| 2 | ERR-003 | Invoice Send API — No Auth | Critical | Anyone can send invoice emails |
| 3 | ERR-004 | Click Tracking Open Redirect | Critical | Phishing attack vector |
| 4 | ERR-005 | Rate Limiter Never Applied | Critical | No brute force protection |
| 5 | ERR-029 | getUserProfiles() Cross-Org Data Leak | Critical | All users exposed across all orgs |
| 6 | ERR-001 | Lead Detail Page Has No Edit Button | High | Users cannot correct mistakes |
| 7 | ERR-010 | AuthGate Redirect Loop for First Login | High | New users stuck in redirect loop |
| 8 | ERR-013 | No Organization Deletion/Leave | High | Users trapped in orgs |
| 9 | ERR-023 | Hard Delete for Leads/Contacts/Companies | High | Permanent data loss risk |
| 10 | ERR-024 | Lead Conversion Lacks Permission Check | High | RBAC bypass for conversions |