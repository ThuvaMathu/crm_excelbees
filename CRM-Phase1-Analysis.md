# CRM Architecture Analysis — Phase 1

## Executive Summary

This document provides a comprehensive architectural analysis of the CRM project (RCRM by ExcelBees), reverse-engineered from the source code. It covers all aspects of the system including framework, routing, authentication, authorization, database, business modules, user workflows, APIs, and security.

---

## 1. Technology Stack

| Layer | Technology | Details |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Latest version with server actions |
| **Language** | TypeScript 5.7 | Strict mode enabled |
| **UI Library** | React 19 | Client components for dashboard |
| **Styling** | Tailwind CSS 3.4 + shadcn/ui | Radix UI primitives |
| **State Management** | Zustand 5 | Persist middleware for UI/Org |
| **Forms** | React Hook Form 7 + Zod 4 | Zod for validation |
| **Backend DB** | Firebase Firestore | NoSQL document database |
| **Auth** | Firebase Auth + Firebase Admin | Email/password + Google OAuth |
| **Cache** | Upstash Redis | Server-side caching layer |
| **AI** | Google Gemini AI | OpenAI-compatible integration |
| **Email** | Nodemailer | SMTP (Zoho default, custom per org) |
| **Rich Text** | Tiptap (ProseMirror) | Email composition |
| **Charts** | Recharts | Analytics & reports |
| **Calendar** | react-big-calendar | Task/project calendar |
| **PDF** | jsPDF + jspdf-autotable | Invoice PDF generation |
| **Drag & Drop** | dnd-kit | Kanban board for deals |
| **Animation** | Framer Motion | UI transitions |
| **Toast** | Sonner | User notifications |
| **Font** | Inter (Google Fonts) | Latin subset, swap display |

---

## 2. Folder Structure

```
crm-excelbees/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (no org context)
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── change-password/
│   ├── (dashboard)/              # Legacy dashboard routes (redirects to /org)
│   │   ├── dashboard/
│   │   ├── analytics/
│   │   ├── companies/
│   │   ├── contacts/
│   │   ├── deals/
│   │   ├── emails/
│   │   ├── invoices/
│   │   ├── leads/
│   │   ├── profile/
│   │   ├── projects/
│   │   ├── reports/
│   │   ├── settings/
│   │   ├── tasks/
│   │   ├── users/
│   │   └── layout.tsx
│   ├── (landing)/                # Public marketing pages
│   │   ├── about/
│   │   ├── blog/
│   │   └── contact/
│   ├── org/                      # Multi-tenant org routes (primary architecture)
│   │   ├── layout.tsx            # AuthProvider + AuthGate wrapper
│   │   ├── (hub)/                # Org picker, profile, account settings
│   │   │   ├── page.tsx          # Org picker
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   └── [orgId]/              # Org-scoped CRM routes
│   │       ├── layout.tsx        # Org context loader + sidebar
│   │       ├── dashboard/
│   │       ├── analytics/
│   │       ├── companies/
│   │       ├── contacts/
│   │       ├── deals/
│   │       ├── emails/
│   │       ├── integrations/
│   │       ├── invoices/
│   │       ├── leads/
│   │       ├── notes/
│   │       ├── profile/
│   │       ├── projects/
│   │       ├── quotes/
│   │       ├── reports/
│   │       ├── settings/
│   │       ├── tasks/
│   │       └── users/
│   ├── api/                      # API routes
│   │   ├── admin/
│   │   ├── calendar/
│   │   ├── cron/
│   │   ├── email/
│   │   ├── invoices/
│   │   ├── org/
│   │   ├── storage/
│   │   ├── upload/
│   │   └── health/
│   ├── actions/                  # Server Actions
│   │   ├── admin-users.ts
│   │   ├── dashboard.ts
│   │   ├── invite-actions.ts
│   │   └── ai/                   # AI-powered actions
│   ├── invite/[token]/
│   ├── onboarding/
│   ├── layout.tsx                # Root layout (ThemeProvider + Toaster)
│   ├── page.tsx                  # Landing page
│   ├── error.tsx
│   ├── global-error.tsx
│   └── not-found.tsx
├── components/                   # Shared components
│   ├── auth/                     # AuthProvider, AuthGate, RBACGuard
│   ├── ui/                       # shadcn/ui primitives
│   ├── layout/                   # Sidebar, Header, MobileNav, OrgSidebar
│   ├── leads/                    # Lead-specific components
│   ├── contacts/                 # Contact-specific components
│   ├── companies/                # Company-specific components
│   ├── deals/                    # Deal-specific components
│   ├── projects/                 # Project-specific components
│   ├── tasks/                    # Task-specific components
│   ├── invoices/                 # Invoice-specific components
│   ├── email/                    # Email-specific components
│   ├── reports/                  # Report-specific components
│   ├── calendar/                 # Calendar components
│   ├── charts/                   # Chart components
│   ├── dashboard/                # Dashboard widgets
│   ├── landing/                  # Landing page sections
│   ├── notifications/
│   ├── org/
│   ├── search/
│   ├── shared/                   # EmptyState, PageHeader, etc.
│   ├── skeletons/
│   ├── team/
│   ├── users/
│   └── activity/
├── lib/
│   ├── auth/                     # Auth services (client + server + api)
│   ├── firestore/                # Firestore CRUD operations
│   ├── email/                    # Email service + templates
│   ├── validations/              # Zod validation schemas
│   ├── gemini/                   # Gemini AI integration
│   ├── pdf/                      # PDF generation
│   ├── storage/                  # File upload/storage
│   ├── permissions/              # Permission utilities
│   ├── api/                      # API utilities
│   ├── constants/                # Static content (blog, features)
│   ├── services/                 # Business services
│   ├── calendar/                 # Calendar utilities
│   ├── firebase.ts               # Client Firebase init
│   ├── firebase-admin.ts         # Server Firebase Admin init
│   ├── redis.ts                  # Upstash Redis singleton
│   ├── utils.ts                  # Tailwind class merging
│   ├── rate-limit.ts             # Rate limiting
│   ├── crypto.ts                 # Encryption utilities
│   ├── analytics.ts              # Client-side analytics
│   └── environment.ts            # Environment helpers
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Auth state hook
│   ├── usePermission.tsx         # Permission checking hook
│   └── use-toast.ts              # Toast hook
├── store/                        # Zustand stores
│   ├── auth.ts                   # Auth state (in-memory only)
│   ├── org.ts                    # Org state (persisted)
│   └── ui.ts                     # UI state (persisted)
├── types/                        # TypeScript type definitions
│   ├── crm.ts                    # All CRM entity types
│   ├── email.ts                  # Email types
│   ├── calendar.ts               # Calendar types
│   └── gemini.ts                 # Gemini AI types
├── middleware.ts                 # Next.js middleware
├── config/site.ts                # Site configuration
└── scripts/                      # Build/deploy scripts
```

---

## 3. App Router Architecture

### Route Groups

The application uses three route groups and a standalone org route:

1. **`(auth)`** — Authentication pages (login, signup, forgot-password, change-password)
   - Wraps with `AuthProvider` only (no `AuthGate`)
   - Layout: `app/(auth)/layout.tsx`

2. **`(landing)`** — Public marketing pages (about, blog, contact)
   - No auth wrapper (pure layout pass-through)
   - Layout: `app/(landing)/layout.tsx`

3. **`(dashboard)`** — Legacy routes (redirected to `/org` via middleware)
   - Wraps with `AuthProvider` + `AuthGate`
   - All pages redirect to `/org` via middleware

4. **`/org/**`** — Primary multi-tenant routes
   - `/org/layout.tsx` - Wraps with `AuthProvider` + `AuthGate`
   - `/org/(hub)/` — Org picker, profile, account settings
   - `/org/[orgId]/` — Org-scoped CRM routes
   - `/org/[orgId]/layout.tsx` — Loads org context, sidebar, header

5. **`/onboarding`** — Onboarding wizard (AuthProvider wrapped internally)
6. **`/invite/[token]`** — Invite acceptance page

### Layout Hierarchy

```
RootLayout (ThemeProvider + Toaster)
├── (landing) — No auth
├── (auth) — AuthProvider
│   ├── /login
│   ├── /signup
│   ├── /forgot-password
│   └── /change-password
├── (dashboard) — AuthProvider + AuthGate (legacy, redirects to /org)
│   ├── /dashboard
│   ├── /leads
│   └── ...
├── /onboarding — page.tsx (self-wraps AuthProvider)
├── /invite/[token] — page.tsx (self-wraps AuthProvider)
└── /org — AuthProvider + AuthGate (primary)
    ├── (hub) — Org picker layout
    │   ├── /org (org picker)
    │   ├── /org/profile
    │   └── /org/settings
    └── [orgId] — Org workspace layout
        ├── /org/[orgId]/dashboard
        ├── /org/[orgId]/leads
        └── ...
```

---

## 4. Authentication System

### 4.1 Firebase Client Auth

- **Location**: `lib/firebase.ts`
- Firebase client SDK initialized with env vars (`NEXT_PUBLIC_FIREBASE_*`)
- Services: `auth`, `db` (Firestore), `storage`

### 4.2 Firebase Admin SDK

- **Location**: `lib/firebase-admin.ts`
- Singleton pattern for Lambda compatibility
- Service: `adminAuth`, `adminDb`, `adminStorage`
- Uses service account credentials from env vars (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)

### 4.3 Auth Service (Client)

- **Location**: `lib/auth/auth-service.ts`
- Functions:
  - `signInWithEmail(email, password)` — Email/password sign-in
  - `signUpWithEmail(email, password, displayName)` — Registration
  - `signInWithGoogle()` — Google OAuth popup
  - `signOut()` — Firebase sign-out
  - `sendPasswordReset(email)` — Firebase password reset email
  - `onAuthStateChanged(callback)` — Firebase auth state listener

### 4.4 Auth Provider

- **Location**: `components/auth/AuthProvider.tsx`
- Wraps children with Firebase auth state listener
- On auth change:
  1. Listens via `onAuthStateChanged`
  2. Subscribes to Firestore `users/{uid}` via `onSnapshot` (real-time)
  3. Resolves role from custom claims (priority) or Firestore (fallback)
  4. Uses 5-second server timeout as safety fallback
  5. Updates `useAuthStore` with user data
- Auth Flow:
  1. Start loading (`setLoading(true)`)
  2. Firebase auth listener fires
  3. If user exists → subscribe to Firestore user doc
  4. Wait for server data (not cached) before setting loading=false
  5. If user doesn't exist → clear state, stop loading

### 4.5 Auth Gate

- **Location**: `components/auth/AuthGate.tsx`
- Guards protected routes, redirects:
  - Unauthenticated → `/login`
  - Deactivated (`isActive === false`) → `/login?error=account_deactivated`
  - First login (`isFirstLogin === true` and not Google) → `/change-password`
  - Onboarding incomplete (`isOnboarded === false`) → `/onboarding`
  - Already logged in on auth pages → `/org`
- Public routes: `/login`, `/signup`, `/register`, `/forgot-password`, `/change-password`, `/onboarding`, `/auth/action`, `/`

### 4.6 Server Auth

- **Location**: `lib/auth/server-auth.ts`
- Used by Server Actions
- Extracts token from `Authorization` header or `session`/`token` cookies
- Verifies with Firebase Admin `verifyIdToken()`
- Fetches user role from Firestore `users/{uid}`
- Returns `SessionUser` or `null`

### 4.7 API Auth

- **Location**: `lib/auth/api-auth.ts`
- Used by API routes
- `verifyApiRequest(request)` — Extracts Bearer token, verifies with Admin SDK, checks user active/approved status
- `hasPermission(user, module, action)` — Check module permission (admin bypass)
- `hasFeature(user, feature)` — Check feature toggle
- `hasRole(user, roles)` — Check role membership

### 4.8 Protected Route Wrapper

- **Location**: `lib/api/protected-route.ts`
- `protectedRoute(handler, config)` — HOF wrapping API routes with auth, role, permission, feature checks
- `requireAuth(handler)` — Just auth required
- `requireAdmin(handler)` — Admin only
- `requireManager(handler)` — Admin or manager only

---

## 5. Authorization System

### 5.1 Roles

Three-tier role system: `admin` > `manager` > `team`

### 5.2 Permissions

Granular module permissions (CRUD + editAll):

| Module | Permission Type |
|--------|----------------|
| `leads` | ModulePermission (read, create, edit, delete, editAll) |
| `contacts` | ModulePermission |
| `companies` | ModulePermission |
| `deals` | ModulePermission |
| `projects` | ModulePermission |
| `tasks` | ModulePermission |
| `invoices` | ModulePermission |
| `reports` | ModulePermission |
| `aiAssistant` | FeatureToggle (enabled/disabled) |
| `userManagement` | FeatureToggle |

### 5.3 Role Defaults

- **Admin**: Full access to all modules (CRUD + editAll), AI enabled, user management enabled
- **Manager**: Full CRUD (except delete) + editAll for CRM modules, AI enabled, no user management
- **Team**: Read all, create/edit own records, no delete, no invoices, no reports, no AI, no user management

### 5.4 Permission Resolution Order

1. User-specific custom permissions (if defined)
2. Role-based defaults (fallback)
3. Admin bypass (admin always has full access)

### 5.5 Permission Components

- `PermissionGate` — Shows/hides children based on module+action permission
- `FeatureGate` — Shows/hides children based on feature toggle
- `RoleGate` — Shows/hides children based on role
- `RBACGuard` — Full guard with redirect, checks role + permission + feature

### 5.6 Server-side Permission Utils

- **Location**: `lib/permissions/index.ts` (exports), `lib/auth/permission-utils.ts`
- `hasPermission(userId, module, action)` — Cached (5-min TTL) permission check
- `validateTaskPermission(taskId, action, userId)` — Task-specific ownership check
- `validateProjectPermission(projectId, action, userId)` — Project-specific ownership check
- `canEditAll(userId, module)` — Check editAll capability
- `logPermissionDenial(...)` — Logs to audit trail

---

## 6. Database Architecture (Firestore)

### 6.1 Collections

| Collection | Document ID | Description |
|-----------|------------|-------------|
| `users` | Firebase UID | User profiles with role, permissions, settings |
| `organizations` | Auto-generated | Multi-tenant organizations |
| `organization_members` | `{orgId}_{userId}` | Membership records with role + permissions |
| `leads` | Auto-generated | Sales leads |
| `contacts` | Auto-generated | Contact records |
| `companies` | Auto-generated | Company records |
| `deals` | Auto-generated | Deal/opportunity records |
| `projects` | Auto-generated | Project records |
| `tasks` | Auto-generated | Task records |
| `invoices` | Auto-generated | Invoice records |
| `emails` | Auto-generated | Email records |
| `emailTemplates` | Auto-generated | Email templates |
| `activities` | Auto-generated | Activity timeline entries |
| `notifications` | Auto-generated | User notifications |
| `audit_logs` | Auto-generated | Audit trail entries |
| `notes` | Auto-generated | Rich text notes |
| `quotes` | Auto-generated | Quote/proposal records |
| `org_invites` | Token (48-char hex) | Organization invite links |

### 6.2 Key Entity Relationships

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

Company (1) ──< (N) Contact
Company (1) ──< (N) Deal
Company (1) ──< (N) Project

Deal (1) ──< (N) Project (dealId)
Lead (1) ──> (1) Contact (conversion)
Lead (1) ──> (1) Deal (conversion)
Lead (1) ──> (1) Project (conversion)

Project (1) ──< (N) Task (projectId)
```

### 6.3 Organization Schema

```typescript
interface Organization {
  id: string;           // Auto-generated
  name: string;         // Display name
  slug: string;         // URL-safe identifier (unique)
  ownerId: string;      // Firebase UID of creator
  logoUrl?: string;
  website?: string;
  industry?: string;
  size?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  smtpConfig?: SMTPConfig; // Custom SMTP settings
}
```

### 6.4 OrganizationMember Schema

```typescript
interface OrganizationMember {
  id: string;                   // `${orgId}_${userId}`
  organizationId: string;
  userId: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role: UserRole;               // "admin" | "manager" | "team"
  permissions?: UserPermissions; // Custom permissions (optional)
  status: OrgMemberStatus;      // "active" | "invited" | "suspended"
  joinedAt: Timestamp;
  updatedAt?: Timestamp;
}
```

### 6.5 Lead Schema

```typescript
interface Lead {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  status: "New" | "Contacted" | "Follow Up" | "Qualified" | "Lost";
  source: "Website" | "Referral" | "Ads" | "Cold Call" | "Other";
  value?: number;
  ownerId: string;
  ownerName?: string;
  tags: string[];
  notes?: string;
  aiScore?: number;           // AI qualification score
  aiReasoning?: string[];     // AI qualification reasoning
  aiLastUpdated?: Timestamp;
  lastContactedAt?: Timestamp;
  converted?: boolean;
  convertedToContactId?: string;
  convertedToDealId?: string;
  convertedToProjectId?: string;
  convertedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 6.6 Deal Schema

```typescript
interface Deal {
  id: string;
  organizationId: string;
  title: string;
  stage: "Pipeline" | "Follow Up" | "Schedule Service" | "Conversation" | "Won" | "Lost";
  value: number;
  probability: number;      // 0-100
  closeDate?: Timestamp;
  contactIds: string[];
  companyId?: string;
  companyName?: string;
  ownerId: string;
  ownerName?: string;
  description?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archived?: boolean;
}
```

### 6.7 Task Schema

```typescript
interface Task {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  type: "To Do" | "Call" | "Email" | "Meeting";
  status: "To Do" | "In Progress" | "Review" | "Done";
  priority: "Low" | "Medium" | "High" | "Urgent";
  projectId?: string;
  projectName?: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: Timestamp;
  startDate?: Timestamp;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  ownerId: string;
  ownerName?: string;
  relatedTo?: { type: string; id: string; name: string };
  associates?: string[];
  isArchived?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}
```

### 6.8 Invoice Schema

```typescript
interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  status: "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled";
  template: InvoiceTemplate;
  companyId?: string;
  companyName?: string;
  contactId?: string;
  contactName?: string;
  clientEmail?: string;
  billingAddress?: string;
  shippingAddress?: string;
  dealId?: string;
  projectId?: string;
  issueDate: Timestamp;
  dueDate: Timestamp;
  paidDate?: Timestamp;
  paymentTerms: PaymentTerms;
  currency: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  discount: number;
  total: number;
  notes?: string;
  terms?: string;
  isRecurring?: boolean;
  recurring?: RecurringSettings;
  ownerId: string;
  ownerName?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sentAt?: Timestamp;
  auditTrail?: AuditEntry[];
}
```

---

## 7. State Management (Zustand)

### 7.1 Auth Store (`store/auth.ts`)

- **In-memory only** (no persistence)
- State: `user`, `loading`, `hydrated`
- Actions: `setUser`, `setLoading`, `setHydrated`, `logout`

### 7.2 Org Store (`store/org.ts`)

- **Persisted** (localStorage: `excelbees-org`)
- Partial persistence: only `currentOrg`
- State: `currentOrg`, `currentMember`, `userOrgs`, `loading`
- Actions: `setCurrentOrg`, `setCurrentMember`, `setUserOrgs`, `setLoading`, `clearOrg`
- Selectors: `useCurrentOrg`, `useOrgRole`, `useOrgPermissions`

### 7.3 UI Store (`store/ui.ts`)

- **Persisted** (localStorage: `ui-storage`)
- Partial persistence: only `sidebarCollapsed`
- State: `sidebarCollapsed`, `isSearchOpen`
- Actions: `toggleSidebar`, `setSidebarCollapsed`, `toggleSearch`, `setSearchOpen`

---

## 8. Middleware (`middleware.ts`)

Next.js Edge Middleware for route protection:

1. **Public paths** (no auth required): `/`, `/login`, `/signup`, `/register`, `/forgot-password`, `/about`, `/blog`, `/contact`, `/invite`
2. **Org paths** (`/org/**`): Protected but handled client-side by AuthGate
3. **Legacy dashboard paths** (`/dashboard`, `/leads`, `/contacts`, etc.):
   - Checks for `Authorization` header or `session` cookie
   - If authenticated → redirect to `/org` (org picker)
   - If not → redirect to `/login`
4. **Admin routes** (`/admin`, `/api/admin`): Requires auth (except `/api/admin/sync-claims`)

**Matcher pattern**: All routes except API, static files, images, favicon, and public files.

---

## 9. API Architecture

### 9.1 REST API Routes

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| GET | `/api/health` | Health check | None |
| POST | `/api/admin` | Admin operations | Required |
| POST | `/api/admin/sync-claims` | Sync custom claims | Not required |
| GET/POST | `/api/calendar` | Calendar events | Required |
| GET | `/api/calendar/export` | Calendar export | Required |
| GET/POST | `/api/calendar/templates` | Calendar templates | Required |
| GET/PUT/DELETE | `/api/calendar/[calendarId]` | Calendar CRUD | Required |
| GET/POST | `/api/calendar/[calendarId]/plans` | Plan management | Required |
| PUT/DELETE | `/api/calendar/[calendarId]/plans/[planId]` | Plan CRUD | Required |
| GET | `/api/cron/process-scheduled` | Process scheduled emails | Internal |
| GET | `/api/cron/projects` | Project cron jobs | Internal |
| POST | `/api/email/send` | Send email | Required |
| GET | `/api/email/track/click` | Track email click | Public (tracking) |
| GET | `/api/email/track/open/[id]` | Track email open | Public (tracking pixel) |
| POST | `/api/invoices/send` | Send invoice email | Required |
| POST | `/api/org/[orgId]/integrations/smtp` | Save SMTP config | Required |
| POST | `/api/storage/files` | Upload files | Required |
| POST | `/api/upload/logo` | Upload organization logo | Required |

### 9.2 Server Actions

| Action | Purpose | Auth |
|--------|---------|------|
| `app/actions/admin-users.ts` | Admin user management | Server auth |
| `app/actions/dashboard.ts` | Dashboard stats with Redis caching | Server auth |
| `app/actions/invite-actions.ts` | Invite CRUD | Server auth |
| `app/actions/ai/deal-insights.ts` | AI deal analysis | Server auth |
| `app/actions/ai/email-assist.ts` | AI email composition | Server auth |
| `app/actions/ai/follow-up.ts` | AI follow-up suggestions | Server auth |
| `app/actions/ai/generate.ts` | AI content generation | Server auth |
| `app/actions/ai/lead-intelligence.ts` | AI lead scoring | Server auth |
| `app/actions/ai/meeting.ts` | AI meeting summarization | Server auth |
| `app/actions/ai/report-insights.ts` | AI report insights | Server auth |
| `app/actions/ai/rewrite.ts` | AI text rewriting | Server auth |
| `app/actions/ai/sentiment.ts` | AI sentiment analysis | Server auth |
| `app/actions/ai/smart-search.ts` | AI-powered search | Server auth |
| `app/actions/ai/task-priority.ts` | AI task prioritization | Server auth |

---

## 10. Business Modules Deep Dive

### 10.1 Authentication Module

- **Signup**: Email/password (Firebase Auth) + auto-create user profile (Firestore) with `admin` role for first user
- **Login**: Email/password or Google OAuth with profile sync
- **Password Reset**: Firebase built-in email reset
- **Change Password**: First-login forced password change flow
- **User Profile Creation**: On first Google login or email signup, `createUserProfile` is called to create the Firestore document
- **Role Assignment**: New users get `admin` role on signup (self-registration); Google users also get `admin`

### 10.2 Organization Module

- **Create Organization**: Slug-based with collision detection (10 attempts), auto-adds creator as admin member
- **Org Picker**: Lists all organizations user belongs to (via `organization_members`)
- **Org Context Loading**: Fetches org + member record, validates active membership
- **Membership Management**: Add, update role/permissions, remove (suspend)
- **Invite System**: Admin creates invite link → user accepts → member record created

### 10.3 Lead Module

- **CRUD**: Create, list (with filters), read, update, delete
- **Conversion**: Lead → Contact, Lead → Deal, Lead → Project
- **AI Integration**: AI scoring, reasoning, lead intelligence
- **Status Flow**: New → Contacted → Follow Up → Qualified → Lost
- **Sources**: Website, Referral, Ads, Cold Call, Other

### 10.4 Contact Module

- **CRUD**: Create, list (with filters), read, update, delete
- **Import**: CSV import via PapaParse
- **Company Association**: Optional companyId linking
- **Activities**: Timeline of interactions

### 10.5 Company Module

- **CRUD**: Create, list (with filters), read, update, delete
- **Billing/Shipping Address**: Structured address fields
- **Contact Association**: Get contacts by company

### 10.6 Deal Module

- **CRUD**: Create, list (Kanban + table), read, update, delete
- **Stage Management**: Pipeline → Follow Up → Schedule Service → Conversation → Won/Lost
- **Stage Change Notifications**: Won/Lost triggers notification to deal owner
- **Archive/Unarchive**: Soft delete mechanism
- **Project Creation**: Deal → Project conversion

### 10.7 Project Module

- **CRUD**: Create, list (with filters), read, update, delete
- **Status Flow**: Planning → Development → Active → On Hold → Completed → Management → Cancelled
- **Priority**: Low, Medium, High, Critical
- **Financials**: Initial cost, annual recurring cost, billing cycle
- **Recurring Billing**: Quarterly/Semi-Annual/None with next billing date
- **Notification Settings**: Email notifications for billing
- **Progress Tracking**: 0-100 percentage

### 10.8 Task Module

- **CRUD**: Create, list (with filters), read, update, delete
- **Types**: To Do, Call, Email, Meeting
- **Status Flow**: To Do → In Progress → Review → Done
- **Archiving**: Only completed (Done) tasks can be archived
- **Assignment**: Notifications on assign
- **User Filtering**: all, assigned, created, associated roles

### 10.9 Invoice Module

- **CRUD**: Create, list (with filters), read, update, delete
- **Status Flow**: Draft → Sent → Paid → Overdue → Cancelled
- **Line Items**: Description, quantity, price, tax rate, total
- **Calculations**: Subtotal, tax amount, discount, total
- **Payment Tracking**: Paid date, payment terms
- **Recurring Invoices**: Weekly/monthly/quarterly/yearly with interval
- **PDF Generation**: jsPDF-based invoice PDF
- **Email Delivery**: Send invoice via email with PDF attachment
- **Invoice Number**: Auto-generated with configurable prefix
- **Deal/Project Linking**: Optional association
- **Audit Trail**: Track changes to invoices

### 10.10 Email Module

- **Composition**: Rich text editor (Tiptap/ProseMirror)
- **Merge Fields**: Contact, company, deal, invoice data injection
- **Templates**: Pre-built and custom templates
- **Tracking**: Open tracking (pixel), click tracking (link rewriting)
- **Scheduling**: Future email sending (Firebase scheduled triggers)
- **SMTP**: Default (Zoho) or org-specific custom SMTP
- **Recipients**: To, CC, BCC with validation

### 10.11 Notes Module

- Rich text notes with markdown support
- Associated to leads, contacts, deals, companies, projects
- Pinning support

### 10.12 Quotes Module

- Quote creation with line items
- Status: Draft → Sent → Accepted → Rejected → Expired
- Similar structure to invoices

### 10.13 Reports Module

- Revenue forecasting (Recharts)
- AI-powered executive summaries
- Custom report queries
- Pipeline analysis

### 10.14 Analytics Module

- Dashboard with quick stats
- AI Smart Follow-ups widget
- Upcoming tasks display
- Revenue/outstanding/draft invoice statistics

### 10.15 Notifications Module

- In-app notifications: deal_won, deal_lost, task_assigned, task_due, invoice_paid, invoice_overdue, project_completed, mention
- Real-time via Firestore listener
- Unread count tracking
- Mark as read / mark all as read

### 10.16 Activity Timeline

- Activities logged for: created, updated, deleted, status_change, email, note, call, log
- Related to any entity (lead, contact, deal, company, project, invoice)
- Organization-scoped feed

### 10.17 Integrations Module

- SMTP configuration per organization
- Google Gemini AI integration

### 10.18 Admin Module

- User management (create, approve, deactivate, delete)
- Role management (assign roles)
- Permission management (customize per-user permissions)
- Audit logs (permission changes, role changes, login attempts)

---

## 11. Critical User Workflows

### Workflow 1: Signup → Onboarding → First Org

1. User visits `/signup`
2. Creates account via email/password or Google OAuth
3. Firebase Auth creates user
4. `createUserProfile()` called → Firestore `users/{uid}` created with `role: "admin"`
5. Redirected to `/onboarding`
6. Step 1: Profile (name, phone, position) → saved to Firestore
7. Step 2: Workspace (org name, slug) → `createOrganization()` + admin member auto-added
8. `isOnboarded: true` set on user profile
9. Redirected to `/org` (org picker)
10. User sees their org → selects it → `/org/{orgId}/dashboard`

### Workflow 2: Login → Org Picker → Dashboard

1. User visits `/login`
2. Signs in (email/password or Google)
3. `AuthProvider` detects user → fetches Firestore user doc → resolves role from claims
4. `AuthGate` checks: authenticated? active? first login? onboarded?
5. Redirected to `/org`
6. Org picker loads user's organizations from `organization_members`
7. User selects org → `/org/{orgId}/dashboard`
8. `/org/[orgId]/layout.tsx` loads org + member record
9. Dashboard fetches cached stats (leads, deals, companies, revenue, projects, tasks)

### Workflow 3: Invite → Accept → Team Member

1. Admin goes to org `/users` page
2. Admin creates invite link → `createInviteAction()` generates token, stores in `org_invites`
3. Invite link shared with user (out of band)
4. User opens `/invite/{token}`
5. `verifyInviteAction()` checks validity
6. If not authenticated → redirect to login/signup
7. After auth → `acceptInviteAction()`:
   - Verifies invite not expired/used
   - Creates organization_member record with specified role
   - Marks invite as used
8. Redirected to org dashboard

### Workflow 4: Lead → Contact/Deal/Project Conversion

1. Create lead via dialog or import
2. View lead detail
3. Click "Convert" → choose target (Contact, Deal, or Project)
4. `convertLeadToContact()` / `convertLeadToDeal()` / `convertLeadToProject()`:
   - Reads lead data
   - Creates target entity with relevant fields
   - Marks lead as converted (prevents re-conversion)
   - Logs activities for both entities
   - Invalidates Redis caches

### Workflow 5: Deal → Project (Post-Sale)

1. Deal marked as "Won"
2. From deal detail, create project
3. `createProjectFromDeal()`:
   - Reads deal data
   - Creates project with deal reference
   - Logs activities
   - Invalidates caches

### Workflow 6: Task Assignment → Notification → Completion

1. Task created with `assigneeId` 
2. `createTask()` sends notification to assignee
3. Assignee sees notification → visits task
4. Task status updated to Done
5. Task archived (if admin/owner marks it)

### Workflow 7: Invoice Creation → Send → Payment

1. Create invoice with line items
2. Calculations auto-computed (subtotal, tax, total)
3. Saved as "Draft"
4. Send invoice → generates PDF → emails to client
5. Status updated to "Sent"
6. Client pays → status updated to "Paid" (manual)
7. If overdue → status auto-sets (manual check)

---

## 12. Caching Strategy

### Redis (Upstash)

Used for server-side caching with TTL-based invalidation:

| Cache Key Pattern | TTL | Trigger for Invalidation |
|-------------------|-----|------------------------|
| `leads:{orgId}:list:all` | 5 min | Create/update/delete lead |
| `contacts:{orgId}:list:all` | 5 min | Create/update/delete contact |
| `companies:{orgId}:list:all` | 5 min | Create/update/delete company |
| `deals:{orgId}:list:all` | 5 min | Create/update/delete/archive deal |
| `projects:{orgId}:list:all` | 5 min | Create/update/delete/archive project |
| `tasks:{orgId}:list:all` | 5 min | Create/update/delete/archive task |
| `invoices:{orgId}:list:all` | 5 min | Create/update/delete invoice |
| `dashboard:stats:{orgId}:{userId}` | 5 min | Any CRM data change |

### Client-side (Firestore onSnapshot)

Real-time listeners subscribed for:
- User profile (`users/{uid}`)
- Enables reactive UI updates

---

## 13. Security Architecture

### 13.1 Multi-tenancy

- All CRM entities scoped by `organizationId` field
- `organizationId` set on creation, used as filter in queries

### 13.2 Authentication Layers

1. **Middleware (Edge)**: Checks cookies/headers for protected routes
2. **Client-side (AuthGate)**: Redirects based on auth state + user properties
3. **Server Actions (`server-auth.ts`)**: Verifies Firebase ID token + fetches role
4. **API Routes (`api-auth.ts`)**: Verifies Bearer token + checks active/approved status
5. **Protected Route Wrapper**: Composable auth/permission/role checks

### 13.3 Authorization Checks

- **Server-side**: `permission-utils.ts` validates module+action against user role/permissions
- **Ownership-based**: Task/Project operations check ownership (ownerId)
- **Client-side**: `usePermission` hook + `PermissionGate`/`FeatureGate`/`RoleGate` components

### 13.4 HTTP Security Headers

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `poweredByHeader: false`

---

## 14. Rate Limiting

- **Location**: `lib/rate-limit.ts`
- Available but not observed to be applied in any current route

---

## 15. Notable Architectural Decisions

1. **Dual Routing (Legacy + Org)**: The `(dashboard)` route group is legacy and all routes redirect to `/org`. The primary architecture uses `/org/{orgId}/` path structure.

2. **Client-side Auth Guard**: Unlike traditional Next.js patterns that rely heavily on middleware, this app uses client-side `AuthGate` for route protection with Firestore real-time listeners for profile data.

3. **Redis + Firestore**: The app uses a hybrid caching strategy — Firestore for real-time data and Redis for server-side caching of aggregate/list queries.

4. **Admin on Self-Registration**: New users (both email and Google) are auto-assigned `admin` role, which is unusual for a multi-tenant app where the first user of each org gets admin.

5. **Server Actions + API Routes**: The app uses both Next.js Server Actions (for CRM operations) and traditional API routes (for email, storage, calendar, admin operations).

6. **Invite-based Team Growth**: Team members join via shareable invite links rather than direct email invitations from the platform.