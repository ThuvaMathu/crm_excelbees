# Excelbees CRM - Multi-Tenant SaaS Migration Plan

## Version

1.1

## Author

Excelbees

## Status

Draft

---

# Executive Summary

Excelbees CRM is currently designed as a single-tenant application where collections are stored at the root level without organizational boundaries. The current application is built with Next.js (App Router) and Firebase Firestore.

This migration introduces a multi-tenant SaaS architecture that allows all customers to use a single platform while maintaining complete data isolation through Organizations.

The new architecture improves scalability, reduces infrastructure costs, simplifies onboarding, and enables self-service customer registration.

---

# Current Architecture

## Existing Model

Currently, the CRM is single-tenant with global collections:

* Next.js App Router handling routing at the root level (e.g., `/dashboard`, `/leads`).
* Firebase Firestore with global collections (`users`, `leads`, `contacts`, `companies`, `deals`, `projects`, `tasks`, `invoices`, `activities`, `emails`, `emailTemplates`, `notifications`, `audit_logs`).
* Authentication relies on Firebase Auth + Next.js Middleware.
* Role-based access control (RBAC) is enforced globally via `firestore.rules` and `types/crm.ts` (`admin`, `manager`, `team`).

### Current Routes (in `app/(dashboard)`)

```text
/analytics
/companies
/contacts
/dashboard
/deals
/emails
/invoices
/leads
/profile
/projects
/reports
/settings
/tasks
/users
```

### Current Roles

* Admin
* Manager
* Team Member

### Current Permissions Structure

Permissions are globally defined in `UserPermissions` mapping CRUD operations for each module (`leads`, `contacts`, `companies`, `deals`, `projects`, `tasks`, `invoices`, `reports`).

---

# Target Architecture

## Multi-Tenant SaaS Platform

All users access:

```text
crm.excelbees.com
```

Users can:

* Sign up
* Log in
* Create organizations
* Join organizations
* Switch organizations

Data isolation is achieved through adding an `organizationId` to all data entities.

---

# Public Website Structure

The main platform contains marketing pages (currently in `app/(landing)`).

```text
/
├── Home
├── About
├── Blog
├── Contact
├── Login
└── Signup
```

Example Routes:

```text
crm.excelbees.com/
crm.excelbees.com/about
crm.excelbees.com/blog
crm.excelbees.com/contact
crm.excelbees.com/login
crm.excelbees.com/signup
```

---

# Authentication Flow

## Step 1: Sign Up

User visits:

```text
crm.excelbees.com/signup
```

Creates account using:

* Email
* Password
* Google Authentication 

## Step 2: Login

User logs in at `crm.excelbees.com/login`. The Next.js middleware verifies the session.

## Step 3: Onboarding

If no organization exists for the user:
Display the onboarding flow where the user must create at least one organization.

---

# Organization Model

## Core Rule

Every user must belong to at least one organization. 
A single user account (Firebase UID) can belong to multiple organizations, with different roles in each.

```text
User (Firebase Auth)
  ↓
Organization Members (Mapping Table)
  ↓
Organization (SaaS Tenant)
  ↓
CRM Workspace
```

Examples:

```text
John
 └─ John's Business

Sarah
 └─ Sarah Consulting

ABC Pty Ltd
 └─ ABC Organization
```

---

# Organization Dashboard

## Route

```text
crm.excelbees.com/org
```

This becomes the global Organization Management Dashboard for users who belong to multiple tenants.

Purpose:

* View all organizations
* Create organization
* Switch organization
* Manage organization-level settings
* Manage organization-level teams
* Manage organization-level users
* Manage organization-level CRM data
* Manage organization-level analytics
* Manage organization-level integrations
* Manage organization-level AI Features
* Manage organization-level settings

---

## Organization Dashboard Sidebar

```text
Organization Dashboard
│
├── Overview
├── Organizations
├── Teams
├── Users
├── Statistics
├── Integrations
├── AI Features (Future)
├── Settings
└── Sign Out
```

---

# Organization Management

Inside:

```text
crm.excelbees.com/org
```

User can:

* View organizations
* Create organizations
* Edit organizations
* Switch organizations

Example:

```text
My Organizations

✓ Excelbees
✓ ABC Builders
✓ XYZ Marketing
```

---

# CRM Workspace Routes

Once a user selects an organization, all CRM functionality is scoped to that organization. We will update the Next.js `app/(dashboard)` to handle a dynamic route segment, e.g., `app/org/[orgId]/(dashboard)/...`.

## Updated Route Structure

```text
/org/[orgId]/analytics
/org/[orgId]/companies
/org/[orgId]/contacts
/org/[orgId]/dashboard
/org/[orgId]/deals
/org/[orgId]/emails
/org/[orgId]/invoices
/org/[orgId]/leads
/org/[orgId]/profile
/org/[orgId]/projects
/org/[orgId]/reports
/org/[orgId]/settings
/org/[orgId]/tasks
/org/[orgId]/users
```

Example:
`crm.excelbees.com/org/excelbees-inc/dashboard`

---

# Team Management & Roles

Organizations can create unlimited teams. Currently, there is no "Teams" collection, so this will be introduced to group users.

## Role Hierarchy (Scoped to Organization)

Since a user can belong to multiple orgs, roles must move from the root `users` document to the `organization_members` mapping.

### Admin
Full organization access. Can manage users, teams, and all CRM data.

### Manager
Department-level access. Can manage assigned teams and CRM data, but cannot modify global org settings or create Admins.

### Team Member
Can access assigned CRM data and tasks. Cannot manage users or settings.

---

# Database Changes (Firestore)

To migrate from the single-tenant to multi-tenant structure, the following schema updates are required:

## New Collections

### `organizations`
```text
id: string
name: string
slug: string
ownerId: string
createdAt: Timestamp
updatedAt: Timestamp
```

### `organization_members`
This replaces the global `role` and `permissions` on the `User` object.
```text
id: string
organizationId: string
userId: string
role: UserRole ("admin" | "manager" | "team")
permissions: UserPermissions
status: UserStatus
joinedAt: Timestamp
```

### `teams` (New)
```text
id: string
organizationId: string
name: string
description: string
```

## Existing Collections to Update

Every existing CRM record must be updated to contain:
```text
organizationId: string
```

This applies to:
* `leads`
* `contacts`
* `companies`
* `deals`
* `projects`
* `tasks`
* `Notes` // add new
* `Qoutes` // add new
* `invoices`
* `activities`
* `emails`
* `emailTemplates`
* `audit_logs`
* `notifications`

This guarantees data isolation. `firestore.rules` will be heavily updated to ensure a user only reads/writes data where `resource.data.organizationId` matches an organization they belong to.

---

# Migration Checklist

## Backend (Firestore & Types)

* [x] Define `Organization`, `OrganizationMember`, and `Team` types in `types/crm.ts`.
* [x] Update all existing types (`Lead`, `Contact`, `Company`, `Deal`, `Project`, etc.) to include `organizationId`.
* [x] Move `role` and `permissions` from `User` interface to `OrganizationMember`.
* [x] Rewrite `firestore.rules` to secure data by `organizationId` and validate against the `organization_members` collection.
* [x] Create a Firebase data migration script to move existing data into a default organization for current users.
* [x] Create `lib/firestore/organizations.ts` service (CRUD + member management).
* [x] Create `lib/firestore/notes.ts` service (new Notes collection).
* [x] Create `lib/firestore/quotes.ts` service (new Quotes collection).
* [x] Add `organizationId` scope to all existing Firestore services (leads, contacts, companies, deals, projects, tasks, invoices, activities, emails, notifications, email-templates).

## Frontend (Next.js)

* [x] Refactor `app/(dashboard)` to `app/org/[orgId]/(dashboard)`.
* [x] Update Next.js `middleware.ts` to validate the `[orgId]` segment against the user's allowed organizations.
* [x] Create the `crm.excelbees.com/org` dashboard to list organizations.
* [x] Create the Onboarding flow for new user registrations to create their first org.
* [x] Update all data fetching hooks/services to pass and filter by `organizationId`.
* [x] Create all CRM pages under `/org/[orgId]/` (leads, contacts, companies, deals, projects, tasks, invoices, emails, reports, analytics, settings, users, profile, notes, quotes).
* [x] Create `store/org.ts` Zustand store for org context.
* [x] Create `components/layout/OrgSidebar.tsx`.
* [ ] Create `components/org/OrgSwitcher.tsx` header dropdown (optional enhancement).

## Security

* [x] Enforce organization-level authorization in `firestore.rules`.
* [x] Prevent cross-tenant data leakage.
* [x] Ensure `organizationId` cannot be updated on existing records by malicious clients.

---

# Future Roadmap

## AI Features
* AI Assistant (Currently partially implemented via Gemini integration)
* AI Lead Scoring
* AI Task Suggestions
* AI CRM Insights

## Integrations
* Gmail (Currently integrated)
* Outlook
* Google Calendar
* Microsoft 365
* Slack
* WhatsApp
* Xero
* QuickBooks

---

# Final Architecture

```text
Platform
│
├── Users (Firebase Auth)
│
├── Organizations (SaaS Tenants)
│    │
│    ├── Teams
│    ├── Organization Members (Roles/Permissions)
│    ├── CRM Data (Leads, Contacts, Companies, Deals, Projects, Tasks, Invoices, Emails)
│    ├── Settings & Integrations
│    └── Analytics & Reports
│
└── Multi-Tenant SaaS Infrastructure (Next.js Edge + Firebase)
```

This architecture becomes the foundation for the next generation of Excelbees CRM SaaS.
