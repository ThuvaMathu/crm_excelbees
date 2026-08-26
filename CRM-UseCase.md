# CRM — Complete Business Specification (Reverse-Engineered)

> **Document**: CRM-UseCase.md  
> **Purpose**: Complete business specification reverse-engineered from the repository  
> **Scope**: Every module, page, workflow, user journey, entity relationship, and business rule  
> **Last Updated**: Permission system overhaul — real-time org-scoped permissions, granular per-user overrides enforced in Firestore Rules + UI + data layer, RBACGuard on every CRM page (see §2 for the current architecture)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [User Types & Permissions](#2-user-types--permissions)
3. [Authentication & Account Management](#3-authentication--account-management)
4. [Onboarding Journey](#4-onboarding-journey)
5. [Organization Management](#5-organization-management)
6. [Dashboard](#6-dashboard)
7. [Lead Management](#7-lead-management)
8. [Contact Management](#8-contact-management)
9. [Company Management](#9-company-management)
10. [Deal Pipeline (Kanban)](#10-deal-pipeline-kanban)
11. [Project Management](#11-project-management)
12. [Task Management](#12-task-management)
13. [Invoice Management](#13-invoice-management)
14. [Quotes & Proposals](#14-quotes--proposals)
15. [Email Communication](#15-email-communication)
16. [Notes](#16-notes)
17. [Settings & Profile](#17-settings--profile)
18. [Integrations](#18-integrations)
19. [Reports & Analytics](#19-reports--analytics)
20. [AI Features](#20-ai-features)
21. [Entity Relationships](#21-entity-relationships)
22. [Navigation Map](#22-navigation-map)

---

## 1. System Overview

### 1.1 Application Identity
- **Name**: RCRM by ExcelBees
- **Tagline**: Custom CRM for Australian Businesses
- **Brand Colors**: Amber (#F59E0B) primary, Enterprise Midnight Blue (#0A1628) secondary
- **Target Market**: Australian SMBs (Small/Medium Businesses)

### 1.2 Technology Architecture
- **Frontend**: Next.js 16 App Router, React 19, TypeScript 5.7
- **UI Components**: shadcn/ui (Radix Primitives) + Tailwind CSS 3.4
- **State Management**: Zustand 5 with persist middleware
- **Database**: Firebase Firestore (NoSQL document DB)
- **Authentication**: Firebase Auth (email/password + Google OAuth)
- **Server Actions**: Next.js Server Actions (Firebase Admin SDK)
- **API Routes**: Next.js API routes (Firebase Admin SDK for protected operations)
- **Caching**: Upstash Redis (5-min TTL for list queries, dashboard stats)
- **File Storage**: Firebase Storage (profile images, attachments)
- **Email**: Nodemailer with SMTP (default Zoho, custom per org)
- **AI**: Google Gemini AI (text generation, analysis, scoring)
- **PDF Generation**: jsPDF + jspdf-autotable (client-side)
- **Charts**: Recharts
- **Rich Text**: Tiptap (ProseMirror-based)

### 1.3 Multi-Tenancy Model
- **Tenant Isolation**: Organization-scoped (`organizationId` field on all CRM entities)
- **Membership**: `organization_members` collection linking users to orgs with roles
- **User Cross-Org**: One user can belong to multiple organizations
- **Data Isolation**: All Firestore queries filter by `organizationId`

### 1.4 Primary Navigation (Org-Scoped)
```
/org/{orgId}/dashboard   → Dashboard overview
/org/{orgId}/leads        → Lead management
/org/{orgId}/contacts     → Contact management
/org/{orgId}/companies    → Company management
/org/{orgId}/deals        → Deal pipeline (Kanban)
/org/{orgId}/projects     → Project management
/org/{orgId}/tasks        → Task management
/org/{orgId}/notes        → Notes
/org/{orgId}/quotes       → Proposals/Quotes
/org/{orgId}/invoices     → Invoice management
/org/{orgId}/emails       → Email history & templates
/org/{orgId}/reports      → Reports & AI intelligence
/org/{orgId}/users        → Team management (admin/manager only)
/org/{orgId}/integrations → Integrations & SMTP config
/org/{orgId}/settings     → User settings & preferences
/org/{orgId}/profile      → User profile
```

---

## 2. User Types & Permissions

### 2.1 Actor Types

| Actor | Description | First Access |
|-------|-------------|-------------|
| **Visitor** | Unauthenticated user browsing landing pages | `/`, `/about`, `/blog`, `/contact` |
| **Self-Signup User** | User who creates account via email or Google | `/signup` → `/onboarding` → `/org` |
| **Invited User** | User who joins via invite link | `/invite/{token}` → auth → `/org` |
| **Org Admin** | Creator or assigned admin of an organization | Full access |
| **Org Manager** | Manager role with elevated permissions | CRUD except delete, user management disabled |
| **Team Member** | Standard user with restricted permissions | Read most, create own, no delete, no financials |

### 2.2 Role Permission Matrix (Defaults)

These are the **default** permissions seeded onto a member when they're added to an org (`ROLE_DEFAULTS` in `types/crm.ts`). They are a starting template, not a hard ceiling — see §2.3.

| Module | Admin | Manager | Team |
|--------|-------|---------|------|
| Leads | Full CRUD + editAll | CRUD (no delete) + editAll | Create own, Read all, Edit own, No delete |
| Contacts | Full CRUD + editAll | CRUD (no delete) + editAll | Create own, Read all, Edit own, No delete |
| Companies | Full CRUD + editAll | CRUD (no delete) + editAll | Create own, Read all, Edit own, No delete |
| Deals | Full CRUD + editAll | CRUD (no delete) + editAll | Create own, Read all, Edit own, No delete |
| Projects | Full CRUD + editAll | CRUD (no delete) + editAll | Read only, No create/edit/delete |
| Tasks | Full CRUD + editAll | CRUD (no delete) + editAll | Create own, Read all, Edit own, No delete |
| Invoices | Full CRUD + editAll | CRUD (no delete) + editAll | **No access** |
| Reports | Read, Create, Edit, No Delete | Read only (no create/edit/delete) | **No access** |
| AI Assistant | Enabled | Enabled | **Disabled** (admin can enable per user) |
| User Management | Enabled | **Disabled** | **Disabled** |

### 2.3 Permission Architecture (Source of Truth & Enforcement)

**Source of truth**: `organization_members/{orgId}_{userId}.permissions` — a full `UserPermissions` object (one `{read, create, edit, delete, editAll}` block per module, plus `aiAssistant`/`userManagement` feature toggles). Seeded from `ROLE_DEFAULTS[role]` when a member is added; from then on it is **independent of role** and can be freely customized per-user by an admin.

**Custom overrides are first-class, not an edge case**: `MemberPermissionsModal` (Team page) lets an admin toggle *any* flag for *any* role — e.g. grant a "team" member `leads.editAll` or `deals.delete` without promoting them to manager/admin, or revoke a manager's `invoices.create`. Wherever permissions are checked, the stored flag is authoritative:
- `editAll` is a **blanket "any record" grant**, independent of role tier — it is *not* additionally gated by "must be manager+". A team member with a custom `editAll: true` override can edit any record in that module.
- `delete` is a **flat, module-wide capability** (the type model has no "delete own" vs "delete all" distinction) — governed purely by the flag, with no implicit role floor beyond whatever `ROLE_DEFAULTS` seeded.
- `edit` (without `editAll`) only applies to records the user owns (`ownerId === uid`).
- **Admin bypass**: role `admin` always passes every check, regardless of what's stored in `permissions` (belt-and-braces; admins are also always seeded with all flags `true`).

**Enforced at three layers, all reading the same data**:
1. **Firestore Security Rules** (`firestore.rules`) — the real, unbypassable boundary. Every CRM collection's `create`/`read`/`update`/`delete` rules check `organization_members.permissions[module][action]` directly (helper: `hasCustomPermission`), layered on top of org-membership and (for `edit`) ownership.
2. **UI (`usePermission()` hook, `hooks/usePermission.tsx`)** — resolves role/permissions from `currentMember` in the org store (kept **real-time** via an `onSnapshot` listener on `organization_members/{orgId}_{uid}` in `app/org/[orgId]/layout.tsx`, so an admin's permission change is reflected immediately, no refresh needed). Every page under `/org/{orgId}/...` is wrapped in `RBACGuard` with a `requirePermission={{module, action}}` (or `requiredRole` for admin/manager-only pages like Team and SMTP settings), and every Create/Edit/Delete button and financial-value mask (`can()`, `canEditAll()`, `canDelete()`, `isManager()`) is gated the same way — not by ad-hoc `role === "admin"` checks.
3. **Data layer** (`lib/firestore/*.ts`) — every `create`/`update`/`delete` function checks the caller's permission (via `hasPermission()` / `canEditRecord()` in `lib/auth/permission-utils.ts`) *before* writing, returning a clear `{success:false, error:"..."}` instead of letting a disallowed write bounce off Firestore Rules with a raw `permission-denied`. This is a UX layer, not the security boundary — the rules are.

**Special cases**:
- **Tasks**: the `assigneeId` is also an authorization signal — an assignee can always update their own assigned task (status, etc.) regardless of `edit`/`editAll`, matching the rules and the UI.
- **`quotes`, `notes`, `emails`, `activities`**: not part of the `UserPermissions` module set (no per-user override exists) — access is role-hierarchy only (`isOrgManager`/owner), unchanged.
- **Financial Hiding**: revenue/deal-value/invoice-amount fields are obfuscated as "$•••" based on `isManager()` (resolved role, real-time) — this is a display convenience, not itself a distinct permission flag.

### 2.4 Key Business Rules
- **Soft Delete**: Deals, projects, tasks use archive/isArchived pattern; leads, contacts, companies are hard-deleted
- **Task Archive**: Only "Done" tasks can be archived
- **Invoice Status Flow**: Draft → Sent → Paid (or Overdue/Cancelled)
- **Lead Status Flow**: New → Contacted → Follow Up → Qualified → Lost
- **Deal Stage Flow**: Pipeline → Follow Up → Schedule Service → Conversation → Won/Lost
- **Project Statuses**: Planning, Development, Active, On Hold, Completed, Management, Cancelled
- **Financial Obfuscation**: Team role sees "$•••" for all financial values
- **First Login**: Email/password users must change password on first login
- **Onboarding**: New users must complete onboarding wizard before accessing CRM

---

## 3. Authentication & Account Management

### 3.1 Registration (Email/Password)

**Navigation Path**: Landing → `/signup`
**Entry Point**: `app/(auth)/signup/page.tsx`

#### Use Case: User creates account with email/password

**Preconditions**: Visitor on signup page, no existing session

**Step-by-Step**:
1. User navigates to `/signup`
2. Page displays: logo, "Back to Login" link, Google OAuth button, email form, "Terms" and "Privacy Policy" links
3. User fills: Full Name (min 2 chars), Email (valid email), Password (min 8 chars, must contain uppercase + lowercase + number), Confirm Password
4. User clicks "Create Account"
5. Frontend validates with Zod schema (passwords must match, all constraints)
6. Firebase Auth creates user via `createUserWithEmailAndPassword`
7. Firebase profile updated with display name
8. `createUserProfile()` creates Firestore document in `users/{uid}` with:
   - `role: "admin"` (self-registered users always get admin)
   - `isFirstLogin: false` (email user chose own password)
   - `isOnboarded: false` (must complete onboarding)
   - `isActive: true`
   - `provider: "password"`
   - `createdBy: uid` (self-created)
9. Success toast: "Account created! Let's set up your workspace."
10. Redirect to `/onboarding`

**Failure scenarios**:
- Email already in use → Error: "An account with this email already exists."
- Validation errors → Inline form messages
- Network error → Generic error toast

**Records created**: `users/{uid}` (Firestore), Firebase Auth User

**Next actions**: Onboarding wizard (profile + workspace creation)

---

### 3.2 Registration (Google OAuth)

**Navigation Path**: `/signup` → Google button
**Entry Point**: `app/(auth)/signup/page.tsx`

#### Use Case: User signs up with Google

**Step-by-Step**:
1. User clicks "Continue with Google"
2. Google OAuth popup appears (via Firebase `signInWithPopup`)
3. User selects Google account and authorizes
4. If `isNewUser` is true:
   - `createUserProfile()` creates Firestore doc with `role: "admin"`, `provider: "google.com"`, `photoURL`
   - Toast: "Account created! Let's set up your workspace."
   - Redirect to `/onboarding`
5. If returning user:
   - Toast: "Welcome back!"
   - Redirect to `/org`
6. If popup dismissed: Silent return (no action)

**Records created**: Same as email registration for new users

**Next actions**: Onboarding (new users) or Org picker (returning users)

---

### 3.3 Login (Email/Password)

**Navigation Path**: Landing → `/login`
**Entry Point**: `app/(auth)/login/page.tsx`

#### Use Case: Returning user signs in

**Preconditions**: User has existing account

**Step-by-Step**:
1. User navigates to `/login`
2. Page shows: logo, "Back to Home", Google button, email/password form, "Forgot password?" link, "Create account" link
3. User enters email + password
4. Validation with Zod `loginSchema` (email required + valid, password required + min 6)
5. `signInWithEmail()` calls Firebase `signInWithEmailAndPassword`
6. If success: `analytics.loginSuccess()` logged, toast "Welcome back!", redirect to `/org`
7. If error: User-friendly error message
   - `user-not-found` / `wrong-password` / `invalid-credential` → "Invalid email or password"
   - `too-many-requests` → "Too many attempts. Try again later."
   - `network-request-failed` → "Network error. Check your connection."
8. AuthProvider detects auth state → subscribes to `users/{uid}` Firestore listener
9. AuthGate validates: isActive? isFirstLogin? isOnboarded?

**Edge Cases**:
- Already authenticated user visiting `/login` → Redirect to `/org` (useEffect in LoginPage)
- Session persistence: Firebase default (session-only, no "Remember me" option)

**Records updated**: `users/{uid}/lastLoginAt` via `updateLastLogin()`

**Next actions**: AuthGate checks → org picker, change password, or onboarding

---

### 3.4 Login (Google OAuth)

**Navigation Path**: `/login` → Google button
**Entry Point**: `app/(auth)/login/page.tsx`

#### Use Case: Returning/new user signs in with Google

**Step-by-Step**: Same as signup Google flow but without the isNewUser distinction for signup path
- isNewUser → redirect to `/onboarding` (same as signup)
- Existing → redirect to `/org`

---

### 3.5 Forgot Password

**Navigation Path**: `/login` → "Forgot password?" → `/forgot-password`
**Entry Point**: `app/(auth)/forgot-password/page.tsx`

#### Use Case: User requests password reset

**Step-by-Step**:
1. User clicks "Forgot password?" link
2. Navigates to `/forgot-password`
3. Enters email address
4. `sendPasswordReset()` calls Firebase `sendPasswordResetEmail`
5. Success toast (regardless of whether email exists — security best practice)
6. Redirect to `/login`

---

### 3.6 Auth State Lifecycle

**AuthProvider** (`components/auth/AuthProvider.tsx`):

**Startup**:
1. `loading = true`, `hydrated = false`
2. Firebase `onAuthStateChanged` fires
3. If user exists → subscribe to `users/{uid}` Firestore `onSnapshot`
4. 5-second server timeout fallback for offline scenarios
5. On server data arrival → `loading = false`, `hydrated = true`
6. If only cached data → wait for server (prevents stale cache flash)
7. If no user → `user = null`, `loading = false`, `hydrated = true`

**Real-time Updates**:
- Firestore `onSnapshot` on `users/{uid}` keeps the global profile in sync (identity/onboarding fields only)
- Role resolved from custom claims (priority) or Firestore `role` field (fallback)
- User object extended with: `role`, `permissions`, `isFirstLogin`, `isOnboarded`, `isActive`, `position`, `provider`
- **Important**: `users/{uid}.role`/`.permissions` are a global fallback only, used outside any org context (e.g. `/org` picker). Once inside `/org/{orgId}/...`, the **org-scoped** `organization_members/{orgId}_{uid}` document — kept live via its own `onSnapshot` in the org layout — is the actual source of truth for role and permissions (see §2.3). The two documents are separate; `MemberPermissionsModal` writes only to `organization_members`.

**AuthGate Guard Logic** (`components/auth/AuthGate.tsx`):
1. Not hydated + loading → Show "Initializing CRM..." spinner (unless public route)
2. No user + public route → Render children
3. No user + protected route → Redirect to `/login`
4. `isActive === false` → Redirect to `/login?error=account_deactivated`
5. `isFirstLogin === true` + not Google provider → Redirect to `/change-password`
6. `isOnboarded === false` + not on `/onboarding` → Redirect to `/onboarding`
7. On auth pages + logged in → Redirect to `/org`

---

### 3.7 Sign Out

**Triggers**: Sidebar "Sign Out" button, Org Hub dropdown "Sign out"

**Step-by-Step**:
1. User clicks "Sign Out"
2. `signOut()` calls Firebase `signOut`
3. AuthStore cleared (`user = null`, `hydrated = false`)
4. Redirect to `/login`
5. On error: "Failed to sign out" toast

---

## 4. Onboarding Journey

### 4.1 Complete Onboarding Flow

**Navigation Path**: `/signup` → `/onboarding` → `/org`

**Entry Point**: `app/onboarding/page.tsx`

#### Use Case: First-time user completes onboarding

**Step 1: Profile** (`step === "profile"`)
- Required fields: First Name, Phone Number, Job Title
- Optional: Last Name
- Pre-filled from Google display name (if available)
- On submit: `updateUserProfile()` saves to Firestore
- Then checks `getUserOrganizations()` — if user already has orgs (via invite), skip workspace step

**Step 2: Workspace** (`step === "workspace"`)
- Enter Organization Name (required)
- Workspace URL (slug) auto-generated from name; can be manually edited
- Slug format: lowercase, numbers, hyphens, max 50 chars
- Click "Create Workspace"
- `createOrganization()` creates Firestore org document + admin membership
- Slug collision detection (10 retries with random suffix)
- On success: `setCurrentOrg(org)`, `finishOnboarding()`

**finishOnboarding()**:
- `updateUserProfile(uid, { isOnboarded: true })`
- Redirect to `/org`

**Guard**: If already onboarded (`isOnboarded === true`) → redirect to `/org`
**Guard**: If not authenticated → redirect to `/login`

---

## 5. Organization Management

### 5.1 Modules

| Page | Route | Purpose |
|------|-------|---------|
| Org Picker | `/org` | List and select organizations |
| Org Hub Profile | `/org/profile` | Account-level profile (global) |
| Org Hub Settings | `/org/settings` | Account-level settings |
| Org Dashboard | `/org/{orgId}/dashboard` | Org-specific CRM home |
| Org Settings | `/org/{orgId}/settings` | Org member settings |

### 5.2 Org Picker

**Navigation Path**: `/login` → `/org`
**Entry Point**: `app/org/(hub)/page.tsx`

#### Use Case: User selects an organization

**Step-by-Step**:
1. Page loads → `getUserOrganizations(user.uid)` fetches user's org memberships
2. Shows orgs in grid (default) or list view
3. Each org card shows: name, slug, "FREE" plan badge
4. Search filters by org name
5. Click org → `setCurrentOrg(org)` → navigate to `/org/{orgId}/dashboard`

**Empty state**: "No organizations yet" with create button
**Retry logic**: 3 attempts with backoff on load failure

#### Use Case: Create new organization from picker

1. Click "New organization" button
2. Dialog opens with Organization Name + Workspace URL (slug) fields
3. Slug auto-generated from name
4. Click "Create"
5. `createOrganization()` → creates org doc + auto-adds creator as admin member
6. If membership creation fails → org deleted, error returned
7. Success: "Workspace created!" toast, org added to list, redirected to org dashboard

### 5.3 Org Dashboard Layout

**Layout**: `app/org/[orgId]/layout.tsx`

**Context Loading**:
1. Check if `currentOrg.id === orgId` and `currentMember` exists in store
2. If not → fetch org (one-shot) + member (one-shot, for the initial provisioning-delay retry) from Firestore
3. If org not found → "This organization could not be found."
4. If member not found or status not "active" → "You do not have access to this workspace."
5. Retry once (1.2s delay) if member not found on first attempt
6. Cancelled flag prevents stale state on rapid navigation
7. **Once ready**, the member fetch is replaced by a live `onSnapshot` listener on `organization_members/{orgId}_{uid}` for the remainder of the session — `currentMember` (role + permissions) stays in sync in real time, so a permission change made by an admin via `MemberPermissionsModal` takes effect immediately without a page refresh. The listener is torn down on unmount / org switch.

**Sidebar Navigation** (CRM section):
- Dashboard, Leads, Contacts, Companies, Deals, Projects, Tasks, Notes, Quotes, Invoices, Email, Reports
- Each module link (except Dashboard/Notes/Quotes/Email, which have no per-user permission entry) is individually hidden unless `can(module, "read")` is true for the current user — so e.g. Invoices/Reports disappear for a Team member by default, and any module an admin has explicitly hidden for a specific user disappears too.

**Sidebar Navigation** (Administration section — visible when `isManager()`):
- Team, Integrations, Organization Settings
- The Team page itself is further gated by `RBACGuard requiredRole={["admin","manager"]}`; the SMTP integration page by `RBACGuard requiredRole="admin"`.

**Bottom section**:
- User avatar + name/email + Sign Out + Collapse toggle

**Collapsible sidebar**: Persists collapsed state via Zustand persist middleware (localStorage)

---

## 6. Dashboard

### 6.1 Dashboard Page

**Navigation**: `/org/{orgId}/dashboard`
**Entry Point**: `app/org/[orgId]/dashboard/page.tsx`

#### Use Case: User views CRM overview

**Data Loading**:
1. `getCachedDashboardStats(userId, orgId)` called on mount
2. Checks Redis cache first
3. Cache miss → parallel Firestore queries:
   - `getLeads(orgId)` → totalLeads
   - `getDeals(orgId)` → filter non-Won/Lost → activeDeals
   - `getCompanies(orgId)` → totalCompanies
   - `getProjects(orgId)` → filter "Active" → activeProjects
   - `getTasks(orgId, { userRole: "associated" })` → filter non-Done → pendingTasks, upcomingTasks (next 5)
   - `getInvoiceStats(orgId)` → totalRevenue
4. Results cached in Redis for 5 minutes

**Displayed Components**:

1. **Welcome Header**: "Welcome back, {firstName}!" + org name
2. **Quick Stats Grid** (3 columns):
   - Total Leads → links to `/leads`
   - Active Deals → links to `/deals`
   - Companies → links to `/companies`
   - Revenue → links to `/invoices` (hidden for team: "$•••" with lock icon)
   - Active Projects → links to `/projects`
   - Pending Tasks → links to `/tasks`
3. **AI Smart Follow-ups**: `SmartFollowUps` component (AI-driven suggestions)
4. **Upcoming Tasks**: Next 5 tasks sorted by due date, with overdue (red), due today (orange), and upcoming styling
5. **Quick Actions**: Add Lead, Create Deal, New Project, Create Invoice (admin/manager only)

---

## 7. Lead Management

### 7.1 Lead List

**Navigation**: Sidebar → Leads → `/org/{orgId}/leads`
**Entry Point**: `app/org/[orgId]/leads/page.tsx`

#### Use Case: User views all leads

**Page Structure**:
- PageHeader with "Add Lead" button
- Search bar (by name, email, company, phone, jobTitle) + Search button
- Status filter dropdown (All, New, Contacted, Follow Up, Qualified, Lost)
- Source filter dropdown (All, Website, Referral, Ads, Cold Call, Other)
- Table: Name, Email, Company, Status (badge), Source, Value, Created date, Actions (Eye icon)
- Value hidden as "$•••" for team role
- Pagination: 10 per page, Previous/Next, "Showing X to Y of Z leads"

**Data Flow**:
- `getLeads(orgId, filters, { pageSize, page })`
- Filters applied client-side after fetching
- Results cached in Redis (5 min TTL) for unfiltered queries
- Cache invalidated on create/update/delete

**Interactions**:
- Click "Eye" → navigates to lead detail `/org/{orgId}/leads/{id}`
- Click "Add Lead" → opens `CreateLeadDialog`
- Filter/Search change → resets to page 1
- Refresh key mechanism ensures new leads appear

### 7.2 Create Lead

**Trigger**: "Add Lead" button
**Component**: `components/leads/CreateLeadDialog.tsx`

**Form Fields**:
- First Name* (text)
- Last Name* (text)
- Email* (email)
- Phone (tel)
- Company Name (text)
- Job Title (text)
- Status* (select: New, Contacted, Follow Up, Qualified, Lost) — default "New"
- Source* (select: Website, Referral, Ads, Cold Call, Other) — default "Website"
- Estimated Value ($) (number, optional)
- Notes (AI textarea, 3 rows)

**Business Rules**:
- Required fields marked with * and validated via Zod schema
- Value converted from string to number before saving
- `organizationId` set from current org context
- `ownerId` set to current user
- Redis cache invalidated for org
- Dashboard stats cache invalidated

**Success**: "Lead created successfully!" toast → dialog closes → list refreshes → new lead visible (sorted by createdAt desc, page 1)

### 7.3 Lead Detail

**Navigation**: Click "Eye" icon on lead → `/org/{orgId}/leads/{id}`
**Entry Point**: `app/org/[orgId]/leads/[id]/page.tsx`

#### Use Case: User views and manages a single lead

**Page Structure**:
- PageHeader: `{firstName} {lastName}` with breadcrumbs (Dashboard → Leads → Lead)
- Status badge + Delete button (admin/manager only)
- Main column (2/3 width):
  - **Lead Information** card: Email (mailto link), Phone (tel link), Company, Job Title, Source, Value, Last Contacted
  - **Notes** card (if notes exist)
  - **Tags** card (if tags exist)
  - **AI Score** card (if aiScore exists): score out of 100, progress bar, reasoning bullets
- Sidebar (1/3 width):
  - **Update Status** (if canEdit): dropdown (New, Contacted, Follow Up, Qualified, Lost)
  - **Record Details**: Created date, Updated date, Owner name
  - **Convert Lead** section (if not converted and canEdit):
    - Convert to Contact button
    - Convert to Deal button
    - Convert to Project button
  - **Already Converted** section (if converted): links to converted entity
  - "Back to Leads" button

**Business Rules**:
- `canEdit`: `canEditAll("leads")` (blanket grant, any role with the flag) OR (record owner AND `can("leads","edit")`)
- `canDelete`: `canDelete("leads")` — the module's `delete` flag, admin-bypassed
- Value hidden unless `isManager()`
- If converted → conversion buttons hidden, replaced by "Already converted" banner
- Converted lead shows green banner with links to contact/deal/project
- Page itself requires `RBACGuard requirePermission={{module:"leads", action:"read"}}`

**Available Actions After Viewing**:
1. **Update Status**: Change lead status → propagates immediately
2. **Convert to Contact**: Creates contact from lead data; lead marked converted; redirect to contact
3. **Convert to Deal**: Creates deal in Pipeline; lead marked converted; redirect to deal
4. **Convert to Project**: Creates project in Planning; lead value → budget; redirect to project
5. **Delete**: Confirmation dialog → hard delete → redirect to leads list

**NOT available from this page**: Edit lead details (name, email, phone, etc.). The `EditLeadDialog` component exists but is NOT wired into this page. Users cannot edit lead details; only status can be changed.

### 7.4 Lead Conversion Detail

**Convert to Contact** (`convertLeadToContact`):
1. Validates lead not already converted
2. Creates contact with: firstName, lastName, email, phone, companyName, jobTitle, notes
3. Marks lead: `converted: true`, `convertedToContactId`, `convertedAt`
4. Creates activity on both lead and contact
5. Invalidates Redis caches for both leads and contacts

**Convert to Deal** (`convertLeadToDeal`):
1. Validates lead not already converted to deal
2. Creates deal with: title = "{companyName}'s Deal" or "{lastName}'s Deal", value = lead.value, stage = "Pipeline", probability = 10
3. Marks lead: `converted: true`, `convertedToDealId`
4. Creates activities
5. Invalidates Redis caches

**Convert to Project** (`convertLeadToProject`):
1. Validates lead not already converted to project
2. Creates project with: name = "Project for {companyName}", status = "Planning", priority = "Medium", budget = lead.value
3. Marks lead: `converted: true`, `convertedToProjectId`
4. Creates activities
5. Invalidates Redis caches

---

## 8. Contact Management

### 8.1 Contact List

**Navigation**: Sidebar → Contacts → `/org/{orgId}/contacts`
**Entry Point**: `app/org/[orgId]/contacts/page.tsx`

#### Use Case: User views all contacts

**Page Structure**:
- PageHeader with "Import CSV", "Email (N)" (when selected), "Add Contact" buttons
- Search bar (by name, email, company, phone, jobTitle)
- Table with checkboxes: select-all + per-row
- Table columns: Name, Email, Phone, Company, Job Title, Created date, Actions (Eye)
- Pagination: 10 per page
- Email compose modal for bulk emailing selected contacts
- Create contact dialog
- Import CSV dialog
- EditContactDialog on detail page

**Data Flow**:
- `getContacts(orgId, filters)` — search + pagination via client-side slice
- Redis cache for unfiltered queries

### 8.2 Create Contact

**Trigger**: "Add Contact" button
**Component**: `components/contacts/CreateContactDialog.tsx`

**Form Fields**: First Name*, Last Name*, Email*, Phone, Company, Job Title, Notes
**Validation**: Zod schema (required name + email, valid email)

### 8.3 Contact Detail

**Navigation**: Click Eye → `/org/{orgId}/contacts/{id}`
**Entry Point**: `app/org/[orgId]/contacts/[id]/page.tsx`

#### Use Case: User views and manages a single contact

**Page Structure**:
- PageHeader: `{firstName} {lastName}` with Edit (if `canEditAll("contacts")` OR owner+`edit`) and Delete (if `canDelete("contacts")`) buttons
- **Contact Information** card: Email, Phone, Company, Job Title, Last Contacted
- **Notes** card (if notes exist)
- **Record Details** sidebar: Created, Updated, Owner
- **Quick Actions** sidebar: Send Email (mailto:), Call (tel:), Convert to Lead (if canEdit)
- "Back to Contacts" button
- Page itself requires `RBACGuard requirePermission={{module:"contacts", action:"read"}}`

**Convert to Lead**: Creates a new lead from contact data with status "New", source "Other"

### 8.4 Import CSV

**Trigger**: "Import CSV" button
**Component**: `components/contacts/ImportCSVDialog.tsx`

**Flow**: Upload CSV file → Parse → Create contacts in batch → Show success/failure counts

---

## 9. Company Management

### 9.1 Company List

**Navigation**: Sidebar → Companies → `/org/{orgId}/companies`
**Entry Point**: `app/org/[orgId]/companies/page.tsx`

**Page Structure**:
- PageHeader with "Add Company" button
- Search bar
- Table: Name, Domain, Industry, Size, Annual Revenue, Created, Actions (Eye)
- Value hidden for team role
- Pagination: 10 per page

### 9.2 Create Company

**Trigger**: "Add Company" button
**Component**: `components/companies/CreateCompanyDialog.tsx`

**Form Fields**: Name*, Email, Domain, Industry, Phone, Description, Size (select), Annual Revenue, Notes, Billing/Shipping Address fields

### 9.3 Company Detail

**Navigation**: Click Eye → `/org/{orgId}/companies/{id}`
**Entry Point**: `app/org/[orgId]/companies/[id]/page.tsx`

#### Use Case: User views a company with its contacts

**Page Structure**:
- Edit (if `canEditAll("companies")` OR owner+`edit`) + Delete (if `canDelete("companies")`) buttons
- **Company Information** card: Domain (external link), Email, Phone, Industry, Size, Annual Revenue (hidden unless `isManager()`)
- **Description** card
- **Notes** card
- **Addresses** card (billing + shipping)
- **Associated Contacts** card: linked contacts list (avatar, name, job title) — links to contact detail
- **Record Details** sidebar: Created, Updated, Owner
- Page itself requires `RBACGuard requirePermission={{module:"companies", action:"read"}}`

---

## 10. Deal Pipeline (Kanban)

### 10.1 Deal Kanban Board

**Navigation**: Sidebar → Deals → `/org/{orgId}/deals`
**Entry Point**: `app/org/[orgId]/deals/page.tsx`

#### Use Case: User manages deals through pipeline stages

**Page Structure**:
- PageHeader with "Add Deal" button
- Search bar + filter toggle (SlidersHorizontal icon)
- Active filter count + "Clear" button
- Stage filter (all stages)
- Value filter (admin/manager only): Under $10k, $10k-$50k, $50k-$100k, $100k+
- Kanban board with 6 columns:
  - **Pipeline** (blue), **Follow Up** (purple), **Schedule Service** (amber)
  - **Conversation** (cyan), **Won** (green), **Lost** (red)
- Each column shows: stage name, deal count, total value (hidden for team)
- Each card shows: title, value, probability, company name
- Cards are draggable (drag-and-drop via dnd-kit)
- Non-editable deals show lock icon

**Data Flow**:
- `getDealsByStage(orgId)` — fetches all deals, groups by stage
- Drag-and-drop: optimistic UI update → `updateDealStage()` call
- Won/Lost stage change → notification created for deal owner

**Permissions**:
- `canEditAll("deals")` grants dragging/moving any card (blanket grant, not itself gated by role — a team member can have this if an admin sets it)
- Otherwise: only the record owner, and only if they have `edit`, can drag their own card
- Page itself requires `RBACGuard requirePermission={{module:"deals", action:"read"}}`; "Add Deal" button requires `can("deals","create")`

### 10.2 Create Deal

**Trigger**: "Add Deal" button
**Component**: `components/deals/CreateDealDialog.tsx`

**Form Fields**:
- Title* (text)
- Stage* (select) — default "Pipeline"
- Value* ($) (number)
- Probability* (%) (number 0-100) — default 50
- Expected Close Date (date picker)
- Company (select from existing companies, optional)
- Description (AI textarea with deal context)
- Notes (AI textarea with deal context)

**Business Rules**:
- If company selected → companyName auto-resolved from companies list
- `contactIds` defaulted to empty array
- `archived` defaulted to false

### 10.3 Deal Detail

**Navigation**: Click card → `/org/{orgId}/deals/{id}`
**Entry Point**: `app/org/[orgId]/deals/[id]/page.tsx`

#### Use Case: User views and manages a single deal

**Page Structure**:
- PageHeader: deal title + stage badge + Edit (if `canEditAll("deals")` OR owner+`edit`), Create Project (if Won), Archive, Delete (if `canDelete("deals")`) buttons
- **Deal Overview** card: Value, Probability, Company, Expected Close (values hidden unless `isManager()`)
- **Description** card (if exists)
- **Notes** card (if exists)
- **Pipeline Stage** sidebar dropdown (if canEdit)
- **Record Details** sidebar: Created, Updated, Owner
- "Back to Deals" button
- Page itself requires `RBACGuard requirePermission={{module:"deals", action:"read"}}`

**Available Actions**:
1. **Edit Deal**: Opens `EditDealDialog` — edit title, stage, value, probability, close date, company, description, notes
2. **Change Stage**: Dropdown updates stage immediately
3. **Create Project** (if Won): Creates project from deal data via `createProjectFromDeal`
4. **Archive**: Soft delete (archived flag)
5. **Delete**: Hard delete with confirmation

**Create Project from Deal** (`createProjectFromDeal`):
- Project name: "Project: {deal.title}"
- Budget: deal value
- Status: "Planning", Priority: "Medium"
- Links: `dealId`, `companyId`, `companyName`
- Activities logged on both deal and project

---

## 11. Project Management

### 11.1 Project List

**Navigation**: Sidebar → Projects → `/org/{orgId}/projects`
**Entry Point**: `app/org/[orgId]/projects/page.tsx`

**Page Structure**:
- PageHeader with "View Archived" toggle and "New Project" button (button shown only if `can("projects","create")`)
- Cards grid: Name, Description, Status badge, Priority label, Start/End date, Company, Budget (hidden unless `isManager()`), Team size
- Status badges: Planning (blue), Active (green), On Hold (yellow), Completed (gray), Cancelled (red)
- Archived toggle shows archived projects with "Archived" badge
- Page itself requires `RBACGuard requirePermission={{module:"projects", action:"read"}}`

**Data Flow**:
- `getProjects(orgId, showArchived ? { archived: true } : undefined)`
- Redis cache

### 11.2 Create Project

**Trigger**: "New Project" button
**Component**: `components/projects/CreateProjectDialog.tsx`

**Form Fields**: Name*, Description, Status, Priority, Start Date*, End Date, Financials (initialCost, annualRecurringCost, billingCycle), Budget, Company, Deal, Team Members

### 11.3 Project Detail

**Navigation**: Click card → `/org/{orgId}/projects/{id}`
**Entry Point**: `app/org/[orgId]/projects/[id]/page.tsx`

**Page Structure**:
- Edit (if `canEditAll("projects")` OR owner+`edit`) + Delete (if `canDelete("projects")`) buttons
- Status + Priority badges
- Progress bar with percentage
- **Project Details** card: Start Date, End Date, Company, Team Members, Budget (hidden unless `isManager()`)
- **Description** card
- **Tags** card
- **Record Details** sidebar
- Page itself requires `RBACGuard requirePermission={{module:"projects", action:"read"}}`

---

## 12. Task Management

### 12.1 Task Board

**Navigation**: Sidebar → Tasks → `/org/{orgId}/tasks`
**Entry Point**: `app/org/[orgId]/tasks/page.tsx`

#### Use Case: User manages tasks

**Page Structure**:
- PageHeader with AI Priority, View Archived, New Task buttons
- List/Calendar view toggle
- Filter bar: user role filter, date range, priority multi-select, status multi-select, Clear + Apply buttons
- **List View**: 4 columns — To Do, In Progress, Review, Done (or custom if filters set)
- **Calendar View**: Tasks displayed on calendar by due date (via `TaskCalendar`)
- Each task card: title, type badge, priority, due date, project name, assignee
- AI-sorted view: tasks sorted by AI priority suggestion with reasoning

**Data Flow**:
- `getTasks(orgId, filters)` — isArchived: false by default
- Filters: userRole, dateRange, priorities, statuses

**Permissions**:
- Page requires `RBACGuard requirePermission={{module:"tasks", action:"read"}}`; "New Task" requires `can("tasks","create")`
- A task can be moved/edited by: the assignee (always, regardless of edit flags — assignment is itself the authorization signal), OR anyone with `canEditAll("tasks")`, OR the owner if they have `can("tasks","edit")`

### 12.2 Create Task

**Trigger**: "New Task" button
**Component**: `components/tasks/CreateTaskDialog.tsx`

**Form Fields**: Title*, Description, Status, Priority, Type, Due Date, Assignee, Project, Tags

**Business Rules**:
- If assigneeId set and different from creator → `task_assigned` notification created

### 12.3 Task Detail Sheet

**Trigger**: Click task card
**Component**: `components/tasks/TaskDetailSheet.tsx`

**Flow**: Slide-out sheet with task details and inline editing
**Available Actions**: Update status, priority, assignee, view details

### 12.4 Task Calendar

**Trigger**: Calendar view toggle
**Component**: `components/tasks/TaskCalendar.tsx`

**Flow**: Tasks shown on calendar by due date, click to open detail sheet

### 12.5 Archived Tasks

**Trigger**: "View Archived" button
**Component**: `components/tasks/ArchivedTasksDialog.tsx`

**Flow**: Dialog showing archived (completed) tasks, can select to view detail

### 12.6 AI Task Priority

**Trigger**: "AI Priority" button
**Flow**: Calls `prioritizeTasks()` → returns sorted tasks with AI-reasoned priorities → toggles display mode

---

## 13. Invoice Management

### 13.1 Invoice List

**Navigation**: Sidebar → Invoices → `/org/{orgId}/invoices`
**Entry Point**: `app/org/[orgId]/invoices/page.tsx`

#### Use Case: User views all invoices

**Page Structure**:
- PageHeader: "Settings" button (shown if `isManager()`) + "New Invoice" button (shown if `can("invoices","create")`)
- Stats cards: Total Revenue, Outstanding, Overdue, Drafts (financials hidden unless `isManager()`)
- Invoice table: Invoice # (clickable link), Client, Issue Date, Due Date, Amount, Status badge
- Status badges: Draft (gray), Sent (blue), Paid (green), Overdue (red), Cancelled (gray)
- Empty state with create button (shown if `can("invoices","create")`)
- Page itself requires `RBACGuard requirePermission={{module:"invoices", action:"read"}}` — team's default `invoices.read` is `false`, so the module is invisible to Team by default

### 13.2 Create Invoice

**Navigation**: "New Invoice" button → `/org/{orgId}/invoices/create`
**Entry Point**: `app/org/[orgId]/invoices/create/page.tsx`

#### Use Case: User with `invoices.create` creates invoice

**Guard**: page requires `RBACGuard requirePermission={{module:"invoices", action:"create"}}`

**3-Tab Form** (via `InvoiceForm` component):

**Tab 1 — Details** (`InvoiceBasicInfo`):
- Invoice Number (auto-generated server-side)
- Client Name* + Client Email
- Billing/Shipping Address
- Issue Date*, Due Date* (default 30 days)
- Payment Terms (Due on Receipt, Net 15/30/60, Custom)
- Currency (USD default)
- Links to Deal/Project (optional, via URL params)

**Tab 2 — Line Items** (`InvoiceLineItems`):
- Dynamic rows: Description*, Quantity*, Price*, Total (auto-calc), Tax Rate (optional)
- Add/remove rows
- Live calculations: subtotal, tax, discount, total

**Tab 3 — Settings** (`InvoiceSettings`):
- Notes, Terms & Conditions
- Recurring settings (toggle + frequency/interval/dates)

**Bottom Action Bar**:
- Live totals: Subtotal, Tax % input, Discount $ input, Total
- "Save Draft" button (status: Draft)
- "Create & Send" button (status: Sent + email with PDF)

**On Create**:
1. `createInvoice()` saves to Firestore
2. Activity logged: "Invoice {number} created"
3. If "Create & Send": PDF generated client-side via jsPDF, base64-encoded, sent via POST to `/api/invoices/send`
4. Redirect to invoice detail page

### 13.3 Invoice Detail

**Navigation**: Click invoice → `/org/{orgId}/invoices/{id}`
**Entry Point**: `app/org/[orgId]/invoices/[id]/page.tsx`

#### Use Case: User views and manages a single invoice

**Page Structure**:
- Invoice number + status badge + "View Only" tag (when the user lacks `invoices.edit`)
- Action buttons: PDF (download), Email (send), Mark Paid, Edit (shown if `can("invoices","edit")`)
- **Invoice Details** card: Issue Date, Due Date, Payment Terms, Currency
- Line items table: Description, Qty, Price, Total
- Totals: Subtotal, Tax, Discount, Total
- **Notes & Terms** card
- **Client** sidebar: Company, Contact, Email, Billing Address
- **Related To** sidebar: Project, Deal links
- Page itself requires `RBACGuard requirePermission={{module:"invoices", action:"read"}}`; Edit page requires `requirePermission={{module:"invoices", action:"edit"}}`

**Mark as Paid**: Sets status to Paid with timestamp; triggers `invoice_paid` notification

**Email Invoice**: Opens `InvoiceEmailComposeModal` → sends email with PDF attachment → if Draft → auto-updates status to Sent

### 13.4 Invoice Settings

**Trigger**: "Settings" button on invoice list
**Component**: `components/invoices/InvoiceSettingsModal.tsx`

**Settings**: Template (standard/professional/creative), Company Name, From Name/Email, Logo, Color Theme, Invoice Prefix, Next Number, Bank Details (account name, number, bank, IFSC, UPI, GSTIN)

### 13.5 Invoice Edit

**Navigation**: "Edit Invoice" button (Draft invoices only) → `/org/{orgId}/invoices/{id}/edit`

**Flow**: Same `InvoiceForm` component in edit mode, pre-filled with existing invoice data

---

## 14. Quotes & Proposals

### 14.1 Proposal List

**Navigation**: Sidebar → Quotes → `/org/{orgId}/quotes`
**Entry Point**: `app/org/[orgId]/quotes/page.tsx`

#### Use Case: User views all proposals

**Page Structure**:
- Stats cards: Total Proposals, Accepted Value, Awaiting Response, Win Rate
- Search + Status filter
- Table: Proposal # (monospace), Client, Status badge, Value, Issue Date, Expiry
- Status badges: Draft (gray), Sent (blue), Accepted (green), Rejected (red), Expired (orange)
- Dropdown menu per row: Edit, Delete
- Pagination

### 14.2 Create/Edit Proposal

**Trigger**: "New Proposal" button or Edit dropdown
**Component**: All inline in `app/org/[orgId]/quotes/page.tsx`

**Multi-Step Dialog**:

**Step 1 — Client & Details**:
- Company Name*, Contact Name, Contact Email, Issue Date*, Valid Until
- Executive Summary (AI textarea with context)

**Step 2 — Scope & Pricing**:
- Line items grid: Description, Qty, Price ($), Tax %, Total (auto-calc)
- Add/remove line items
- Subtotal, Tax, Discount, Total (live calc)
- Internal Notes (AI textarea)

**Step 3 — Terms & Summary**:
- Payment Terms (AI textarea)
- Proposal summary card: number, client, dates, line items count, total value

**On Save**: Creates/updates Firestore quote document; Redis cache invalidated
**Quote Number**: Auto-generated as `QT-{sequential}`

---

## 15. Email Communication

### 15.1 Email History & Templates

**Navigation**: Sidebar → Email → `/org/{orgId}/emails`
**Entry Point**: `app/org/[orgId]/emails/page.tsx`

**3 Tabs**:

**Sent Tab**: List of sent emails with status badges, subject, To, date, actions (View, Delete)

**Drafts Tab**: List of draft emails with same display + "Send Now" action

**Templates Tab**: List of email templates with name, category, usage count, Shared/Inactive badges; actions: Use, Edit, Delete

**Template Editor**: Create/edit templates with name, description, subject, body (rich text), shared toggle

### 15.2 Email Compose Modal

**Component**: `components/email/EmailComposeModal.tsx`

#### Use Case: User composes and sends email

**Form**: To (recipient input with validation), CC/BCC (toggle), Subject, Body (rich text via Tiptap), Attachments (file upload)
**Options**: Track Opens, Track Clicks, Schedule Send (date picker)
**Features**:
- Template selector (pre-fills subject/body)
- Merge field dropdown (contact, company, deal fields)
- AI Email Assistant (assist, rewrite, sentiment)
- Save Draft
- Send

**Business Rules**:
- At least one recipient required
- Subject max 200 chars
- Attachments max 25MB total
- Sending calls POST `/api/email/send` (UNAUTHENTICATED)
- Email status tracked: draft → sending → sent/failed

---

## 16. Notes

### 16.1 Notes List

**Navigation**: Sidebar → Notes → `/org/{orgId}/notes`
**Entry Point**: `app/org/[orgId]/notes/page.tsx`

**Page Structure**:
- Search bar + "Add Note" button
- Pinned section (pinned notes with primary ring)
- All Notes section (grid of cards)
- Each note card: content (truncated 6 lines), author, date, pin/edit/delete menu
- Only owner or admin can manage a note

### 16.2 Create/Edit Note

**Dialog**: Textarea, Create/Update button
**Actions**: Pin/Unpin, Edit, Delete

---

## 17. Settings & Profile

### 17.1 User Settings

**Navigation**: Sidebar → Organization Settings → `/org/{orgId}/settings`
**Entry Point**: `app/org/[orgId]/settings/page.tsx`

**Sections**:
1. **Appearance**: Theme selection (Light/Dark/System) via next-themes
2. **Account**: Edit Profile button → dialog (name editable, email read-only, calls Firebase updateProfile + API fallback)
3. **Notifications**: Configure preferences (email notifications, task reminders, weekly summary) — saved to localStorage
4. **Preferences**: Default currency selection (USD/EUR/GBP/CAD/AUD/JPY/CHF/INR) — saved to localStorage

### 17.2 User Profile

**Navigation**: Sidebar → Profile (or Org Hub Profile) → `/org/{orgId}/profile`
**Entry Point**: `app/org/[orgId]/profile/page.tsx`

**Sections**:
1. **Profile Picture**: Avatar + Upload Photo button (5MB max, Firebase Storage)
2. **Personal Information**: First Name, Last Name, Display Name, Email (read-only), Phone → Save Changes
3. **Account Info**: Role, Status, Member Since

---

## 18. Integrations

### 18.1 Integrations Page

**Navigation**: Sidebar → Integrations → `/org/{orgId}/integrations`
**Entry Point**: `app/org/[orgId]/integrations/page.tsx`

**Available Integration**: Email (SMTP) — "Configure" button navigates to SMTP settings

**Coming Soon**: Google Calendar, Slack, Webhooks, Google Analytics, Custom API, WhatsApp Business

### 18.2 SMTP Configuration

**Navigation**: Integrations → SMTP → `/org/{orgId}/integrations/smtp`
**Entry Point**: `app/org/[orgId]/integrations/smtp/page.tsx`

#### Use Case: Admin configures custom email sending

**Guard**: page requires `RBACGuard requiredRole="admin"` (managers cannot reach this page; enforced by the same rule that scopes `organizations` document updates to org admins)

**Form Fields**:
- Email Provider (select: Gmail, Outlook, Yahoo, Zoho, Custom SMTP)
- Presets auto-fill host/port
- SMTP Host*
- Port*
- Secure connection checkbox (SSL/TLS)
- Email Address*
- App Password*

**Save Flow**:
1. POST to `/api/org/{orgId}/integrations/smtp` with Bearer token
2. Password encrypted via AES-256-GCM before storage
3. Success: "SMTP configuration saved" → redirect to integrations page

---

## 19. Reports & Analytics

### 19.1 Reports Page

**Navigation**: Sidebar → Reports → `/org/{orgId}/reports`
**Entry Point**: `app/org/[orgId]/reports/page.tsx`

#### Use Case: User views business intelligence

**Page Structure**:
- Report Query Input (AI-powered query)
- AI Executive Summary (summary text, insights list, recommendations)
- **3 Tabs**:
  - **Overview**: Total Revenue, Active Pipeline, Total Leads, Churn Risk count; Revenue Forecast chart; Recent Insights
  - **Sales & Forecast** (admin/manager only): Revenue Forecast chart
  - **Leads Intelligence**: Total Leads, At Risk, Healthy Rate; Scoring matrix; AI Recommendations

**Data Source**:
- Parallel fetch: `getDeals(orgId)`, `getLeads(orgId)`, `getInvoices(orgId)`
- Monthly metrics computed client-side
- Churn risk: leads with status "Lost" OR last contacted > 30 days ago

**Guard**: page requires `RBACGuard requirePermission={{module:"reports", action:"read"}}`; "Sales & Forecast" tab rendered only when `isManager()`

**Export**: CSV download with monthly metrics and summary

### 19.2 Analytics Page

**Navigation**: `/org/{orgId}/analytics` (separate page from reports)
**Entry Point**: `app/org/[orgId]/analytics/page.tsx`

**Charts** (rendered when `isManager()`):
- **RevenueChart**: Last 6 months revenue from Won deals
- **PipelineChart**: Deal count + value by stage
- **ActivityChart**: Mock data for activity distribution

**Team role**: Restricted message "Financial Analytics Restricted"
**Guard**: page requires `RBACGuard requirePermission={{module:"reports", action:"read"}}`

---

## 20. AI Features

### 20.1 AI Textarea (`AITextarea`)
- Context-aware text generation in: Lead notes, deal descriptions, quote executive summary, quote terms
- Context data passed based on the module

### 20.2 AI Email Assistant
- Assist: Generate email content
- Rewrite: Rewrite existing text
- Sentiment: Analyze tone

### 20.3 AI Deal Insights
- Server action: `ai/deal-insights.ts`

### 20.4 AI Lead Intelligence
- Server action: `ai/lead-intelligence.ts`

### 20.5 AI Report Insights
- Server action: `ai/report-insights.ts`
- Generates summary, insights (positive/negative/warning), and recommendations

### 20.6 AI Task Priority
- Server action: `ai/task-priority.ts`
- Analyzes tasks and returns priority suggestions with reasoning

### 20.7 AI Smart Search
- Server action: `ai/smart-search.ts`

### 20.8 AI Follow-up
- Server action: `ai/follow-up.ts`
- Component: `SmartFollowUps` on dashboard

### 20.9 AI Meeting Sumarizer
- Component: `MeetingSummarizer`

---

## 21. Entity Relationships

### 21.1 Core Entity Relationship Diagram

```
Organization (1) ──< (N) OrganizationMember
OrganizationMember (N) ──> (1) User

Organization (1) ──< (N) Lead
Organization (1) ──< (N) Contact
Organization (1) ──< (N) Company
Organization (1) ──< (N) Deal
Organization (1) ──< (N) Project
Organization (1) ──< (N) Task
Organization (1) ──< (N) Invoice
Organization (1) ──< (N) Note
Organization (1) ──< (N) Quote

Lead (1) ──> (1) Contact    (conversion)
Lead (1) ──> (1) Deal       (conversion)
Lead (1) ──> (1) Project    (conversion)
Contact (1) ──> (1) Lead    (reverse conversion)

Deal (1) ──< (N) Project    (dealId)
Deal (1) ──> (1) Company    (companyId)
Deal (N) ──< (N) Contact    (contactIds array)

Company (1) ──< (N) Contact (companyId)
Company (1) ──< (N) Deal    (companyId)
Company (1) ──< (N) Project (companyId)

Project (1) ──< (N) Task    (projectId)
Project (1) ──> (1) Deal    (dealId)

Invoice (1) ──> (1) Company (companyId)
Invoice (1) ──> (1) Deal    (dealId) 
Invoice (1) ──> (1) Project (projectId)

Note (1) ──> (1) Lead/Contact/Deal/Company/Project (relatedTo)

Activity (1) ──> (1) Lead/Contact/Deal/Company/Project (relatedTo)

Notification (1) ──> (1) User

Quote (1) ──> (1) Company (companyId)
Quote (1) ──> (1) Deal    (dealId)
```

### 21.2 Business Conversions

```
Lead → Contact: Preserves name, email, phone, company, job title, notes
Lead → Deal: Uses lead value as deal value, creates in Pipeline stage
Lead → Project: Uses lead value as budget, creates in Planning status
Contact → Lead: Creates new lead with "New" status, "Other" source
Deal → Project: Uses deal value as budget, links via dealId
```

---

## 22. Navigation Map

### 22.1 Complete Route Map

```
/                                       → Landing page
/about                                  → About page
/blog                                   → Blog listing
/blog/[slug]                            → Blog article
/contact                                → Contact page

/login                                  → Login page
/signup                                 → Signup page
/forgot-password                        → Forgot password
/change-password                        → Change password (first login)

/onboarding                             → Onboarding wizard

/invite/[token]                         → Invite acceptance

/org                                    → Org picker (AuthProvider + AuthGate)
/org/profile                            → Account profile
/org/settings                           → Account settings

/org/{orgId}/dashboard                  → Dashboard

/org/{orgId}/leads                      → Lead list
/org/{orgId}/leads/{id}                 → Lead detail

/org/{orgId}/contacts                   → Contact list
/org/{orgId}/contacts/{id}              → Contact detail

/org/{orgId}/companies                  → Company list
/org/{orgId}/companies/{id}             → Company detail

/org/{orgId}/deals                      → Deal Kanban board
/org/{orgId}/deals/{id}                 → Deal detail
/org/{orgId}/deals/kanban               → (legacy kanban route)

/org/{orgId}/projects                   → Project list
/org/{orgId}/projects/{id}              → Project detail

/org/{orgId}/tasks                      → Task board

/org/{orgId}/notes                      → Notes

/org/{orgId}/quotes                     → Proposals/Quotes

/org/{orgId}/invoices                   → Invoice list
/org/{orgId}/invoices/create            → Create invoice
/org/{orgId}/invoices/{id}              → Invoice detail
/org/{orgId}/invoices/{id}/edit         → Edit invoice

/org/{orgId}/emails                     → Email history + templates

/org/{orgId}/reports                    → Reports & AI intelligence

/org/{orgId}/analytics                  → Charts & analytics

/org/{orgId}/users                      → Team management

/org/{orgId}/integrations               → Integrations marketplace
/org/{orgId}/integrations/smtp          → SMTP configuration

/org/{orgId}/settings                   → User settings
/org/{orgId}/profile                    → User profile

# Legacy routes (redirect to /org):
/dashboard, /leads, /contacts, /companies, /deals
/projects, /tasks, /invoices, /reports, /settings
/profile, /users, /analytics, /emails
```

### 22.2 User Journey Map (Lead-to-Completion)

```
Registration → Onboarding → Org Picker → Dashboard
                                                      ↓
Lead List → Create Lead → Lead Detail → Convert to Contact
                                    ↓                        ↓
                              Convert to Deal         Contact Detail
                                    ↓                        ↓
                         Deal Kanban Board → Drag Stage     Send Email
                                    ↓               Convert to Lead
                              Deal Detail
                                    ↓
                              Stage: Won
                                    ↓
                         Create Project (button)
                                    ↓
                         Project Detail
                                    ↓
                         Create Tasks → Task Board
                                    ↓
                         Complete Tasks → Project Completion
                                    ↓
                         Create Invoice → Send Invoice → Payment
```

### 22.3 Navigation Flows for Each Module

**Lead**:
- List → Create dialog (inline) → List refreshes
- List → Detail → Update Status / Convert / Delete → Redirect to List

**Contact**:
- List → Create dialog (inline) → List refreshes
- List → Detail → Edit / Delete → Redirect to List
- List → Select → Bulk Email → Compose modal

**Company**:
- List → Create dialog (inline) → List refreshes
- List → Detail → Edit / Delete → Redirect to List
- Detail → Linked contacts → Navigate to contact detail

**Deal**:
- List → Create dialog (inline) → Kanban refreshes
- Kanban → Drag card → Stage update
- Kanban → Click card → Detail → Edit / Archive / Delete / Create Project

**Project**:
- List → Create dialog (inline) → List refreshes (prepended)
- List → Detail → Edit / Delete

**Task**:
- Board → Create dialog (inline) → Board refreshes
- Board → Click card → Detail sheet → Edit
- Board → AI Priority toggle → AI-sorted view

**Invoice**:
- List → Settings modal (inline)
- List → Create (navigate to form) → Redirect to detail
- Detail → Download PDF / Email / Mark Paid / Edit

**Quote**:
- List → Search + Filter
- Create/Edit → Multi-step dialog → List refreshes

**Email**:
- All → Compose modal
- Drafts → Edit → Send
- Templates → Create/Edit → Use → Compose