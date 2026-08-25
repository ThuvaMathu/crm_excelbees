# CRM Test Cases — Comprehensive QA Suite

> **Project**: RCRM by ExcelBees
> **Phase**: 2 — Test Case Document
> **Basis**: Reverse-engineered architecture from source code (Phase 1 Analysis)

---

## Table of Contents

1. [Authentication Module](#1-authentication-module)
2. [Onboarding Module](#2-onboarding-module)
3. [Organization Module](#3-organization-module)
4. [Invite System](#4-invite-system)
5. [Lead Module](#5-lead-module)
6. [Contact Module](#6-contact-module)
7. [Company Module](#7-company-module)
8. [Deal Module](#8-deal-module)
9. [Project Module](#9-project-module)
10. [Task Module](#10-task-module)
11. [Invoice Module](#11-invoice-module)
12. [Email Module](#12-email-module)
13. [Notes Module](#13-notes-module)
14. [Quotes Module](#14-quotes-module)
15. [Dashboard Module](#15-dashboard-module)
16. [Reports Module](#16-reports-module)
17. [Analytics Module](#17-analytics-module)
18. [Notifications Module](#18-notifications-module)
19. [Activity Timeline Module](#19-activity-timeline-module)
20. [User & Team Management](#20-user--team-management)
21. [Profile & Settings](#21-profile--settings)
22. [Permissions & RBAC](#22-permissions--rbac)
23. [API Routes](#23-api-routes)
24. [Server Actions](#24-server-actions)
25. [Middleware](#25-middleware)
26. [UI/UX Tests](#26-uiux-tests)
27. [Security Tests](#27-security-tests)
28. [Caching & Performance](#28-caching--performance)

---

## 1. Authentication Module

### TC-AUTH-001: User Registration with Email/Password
- **Description**: Verify a new user can register with email and password
- **Preconditions**: User not authenticated, valid email not in use
- **Test Data**: `{ displayName: "John Smith", email: "john@example.com", password: "TestPass1!" }`
- **Positive Tests**:
  - Submit valid registration form → User created in Firebase Auth
  - Firestore `users/{uid}` document created with role "admin"
  - `isFirstLogin` set to `false` for email signup
  - `isOnboarded` set to `false`
  - Redirected to `/onboarding`
  - Success toast shown
- **Negative Tests**:
  - Empty display name → Validation error
  - Invalid email format → Validation error
  - Password < 8 characters → Validation error
  - Passwords don't match → Validation error
  - Email already in use → Error toast "An account with this email already exists."
- **Edge Cases**:
  - Very long display name (100+ chars) → Schema limited to 100 chars
  - Email with special characters → Validated by Zod email regex
  - Password with only numbers → Must contain uppercase, lowercase, and number
- **Priority**: Critical
- **Severity**: Critical
- **Dependencies**: Firebase Auth, Firestore users collection

### TC-AUTH-002: User Login with Email/Password
- **Description**: Verify existing user can log in with valid credentials
- **Preconditions**: User exists in Firebase Auth with email/password
- **Positive Tests**:
  - Valid email + password → Login success, redirect to `/org`
  - Successful login triggers `updateLastLogin()` → Firestore timestamp updated
  - Auth state listener detects user → AuthStore populated
- **Negative Tests**:
  - Wrong password → "Invalid email or password" error
  - Non-existent email → "Invalid email or password" error
  - Empty fields → Validation errors
  - Too many attempts → "Too many attempts. Try again later."
- **Edge Cases**:
  - Network failure → "Network error. Check your connection."
  - Very long password → Handled by Firebase
- **Priority**: Critical
- **Severity**: Critical

### TC-AUTH-003: Google OAuth Login/Signup
- **Description**: Verify Google OAuth flow works for both new and returning users
- **Preconditions**: Google OAuth configured in Firebase Console
- **Positive Tests**:
  - **New Google user**: Profile created with `role: "admin"`, `provider: "google.com"`, `isFirstLogin: false`, redirect to `/onboarding`
  - **Returning Google user**: Profile exists, login success, redirect to `/org`
  - Google popup closed by user → Silent return (no error)
- **Negative Tests**:
  - Google popup blocked → Browser console error (Firebase handles)
  - Network error during Google auth → Error toast
- **Priority**: High
- **Severity**: High

### TC-AUTH-004: Forgot Password Flow
- **Description**: Verify password reset email is sent
- **Preconditions**: User exists with email/password
- **Positive Tests**:
  - Valid email → Firebase sends password reset email
  - Success toast shown
- **Negative Tests**:
  - Non-existent email → Firebase still returns success (security best practice)
  - Invalid email format → Validation error
- **Priority**: Medium
- **Severity**: High

### TC-AUTH-005: Change Password (First Login)
- **Description**: Verify first-login users are forced to change password
- **Preconditions**: User with `isFirstLogin: true` and `provider: "password"`
- **Positive Tests**:
  - User redirected to `/change-password` on first login
  - After password change, `isFirstLogin` set to `false`
- **Negative Tests**:
  - User navigates away from `/change-password` → Redirected back
  - Same password as old → Should allow (no check in code)
- **Edge Cases**:
  - Google users (`provider: "google.com"`) skip password change even with `isFirstLogin: true`
- **Priority**: High
- **Severity**: High

### TC-AUTH-006: Auth State Hydration & Loading
- **Description**: Verify auth loading states correctly
- **Preconditions**: None
- **Positive Tests**:
  - On page load, `loading` is `true`, `hydrated` is `false`
  - After Firebase confirms auth state, `loading` becomes `false` and `hydrated` becomes `true`
  - If user exists and Firestore server data returns, loading stops
  - If Firestore only has cached data, loading stays true until server confirms
  - 5-second timeout forces render if server never responds
- **Priority**: Critical
- **Severity**: High

### TC-AUTH-007: Account Deactivated Flow
- **Description**: Verify deactivated users cannot access CRM
- **Preconditions**: User with `isActive: false` in Firestore
- **Positive Tests**:
  - AuthGate detects `isActive === false` → redirects to `/login?error=account_deactivated`
- **Priority**: High
- **Severity**: Critical

### TC-AUTH-008: Sign Out
- **Description**: Verify sign out clears session and redirects
- **Preconditions**: Authenticated user
- **Positive Tests**:
  - Sign out → Firebase auth cleared
  - AuthStore user set to null
  - Redirected to `/login`
  - Protected routes no longer accessible
- **Priority**: High
- **Severity**: High

---

## 2. Onboarding Module

### TC-ONB-001: Onboarding Step 1 — Profile
- **Description**: Verify onboarding profile step saves user details
- **Preconditions**: New user with `isOnboarded: false`, on `/onboarding` page
- **Positive Tests**:
  - Fill first name, phone, position → Save to Firestore `users/{uid}`
  - "Continue" button disabled when required fields empty
  - After save, check if user already has orgs → skip workspace step or show it
  - Profile saving spinner shown during save
- **Negative Tests**:
  - Empty first name → Form validation prevents submit
  - Empty phone → Submit blocked
  - Empty position → Submit blocked
- **Edge Cases**:
  - Pre-fill from Google display name (first/middle/last name splitting)
  - User already in an org (via invite) → Skip workspace step
- **Priority**: High
- **Severity**: High

### TC-ONB-002: Onboarding Step 2 — Workspace Creation
- **Description**: Verify workspace creation during onboarding
- **Preconditions**: Profile step completed, user not in any org, `isOnboarded: false`
- **Positive Tests**:
  - Enter org name → Slug auto-generated
  - Custom slug → Used if edited
  - Create workspace → Organization document created in Firestore
  - Admin member record created in `organization_members`
  - `isOnboarded` set to `true`
  - Redirected to `/org`
- **Negative Tests**:
  - Empty org name → Submit disabled
  - Duplicate slug → Error: "An organization with that slug already exists."
  - Back button → Returns to profile step
- **Edge Cases**:
  - 10 slug collision retries exhausted → Fallback with timestamp suffix
  - Organization creation succeeds but membership creation fails → Org deleted, error returned
- **Priority**: High
- **Severity**: High

### TC-ONB-003: Skip Onboarding for Already Onboarded Users
- **Description**: Verify already-onboarded users cannot re-enter wizard
- **Preconditions**: User with `isOnboarded: true`
- **Positive Tests**:
  - Visiting `/onboarding` → Redirected to `/org`
- **Priority**: Medium
- **Severity**: Medium

---

## 3. Organization Module

### TC-ORG-001: Organization Creation
- **Description**: Verify organization creation from org picker page
- **Preconditions**: Authenticated user
- **Positive Tests**:
  - Click "New organization" → Dialog opens
  - Fill org name + slug → Create
  - Org document created in `organizations` collection
  - Creator added as admin member in `organization_members`
  - Org appears in user org list
  - Toast "Workspace created!"
  - Redirect to org dashboard
- **Negative Tests**:
  - Empty org name → Create button disabled
  - Duplicate slug → Error toast
  - Network failure → Error toast
- **Priority**: High
- **Severity**: High

### TC-ORG-002: Org Picker Loading and Display
- **Description**: Verify org picker shows user's organizations
- **Preconditions**: Authenticated user with org memberships
- **Positive Tests**:
  - Org list loaded from `organization_members` query
  - Grid view and list view toggle
  - Search filters orgs by name
  - Empty state shown when no orgs
  - Loading spinner shown during fetch
- **Negative Tests**:
  - No orgs → "No organizations yet" with create button
  - Search with no results → "No organizations match your search"
  - 3 retry attempts on failure → Error toast after 3rd
- **Priority**: High
- **Severity**: High

### TC-ORG-003: Org Context Loading (Access Check)
- **Description**: Verify org context loading validates membership
- **Preconditions**: Authenticated user navigating to `/org/{orgId}/...`
- **Positive Tests**:
  - Org exists + user is active member → Load org + member data, show dashboard
  - Loading spinner shown during fetch
- **Negative Tests**:
  - Org not found → "This organization could not be found." error state
  - User not a member → "You do not have access to this workspace." error state
  - Member status not "active" → Access denied
  - Retry once after 1.2s if member not found on first attempt
- **Edge Cases**:
  - Direct navigation vs. store already has data → Check before fetching
  - Rapid navigation → Cancelled flag prevents stale state
- **Priority**: Critical
- **Severity**: Critical

### TC-ORG-004: Organization Settings Update
- **Description**: Verify org settings can be updated
- **Preconditions**: Authenticated user, admin/manager role in org
- **Test points**: Name, logoUrl, website, industry, size
- **Priority**: Medium
- **Severity**: Medium

### TC-ORG-005: Organization Slug Generation
- **Description**: Verify slug generation utility
- **Preconditions**: None
- **Positive Tests**:
  - `generateSlug("Excelbees Pty Ltd")` → `"excelbees-pty-ltd"`
  - Special characters removed
  - Lowercase conversion
  - Whitespace → hyphens
  - Multiple hyphens collapsed
  - Max 50 chars
- **Edge Cases**:
  - Empty string → empty string
  - Only special characters → empty string
- **Priority**: Low
- **Severity**: Low

---

## 4. Invite System

### TC-INV-001: Create Invite Link (Admin/Manager)
- **Description**: Verify admin/manager can create invite links
- **Preconditions**: Authenticated user, admin or manager in org
- **Positive Tests**:
  - `createInviteAction()` called with valid token, orgId, role
  - Caller verified as admin/manager via `verifyCallerIsOrgAdmin()`
  - Random 48-char hex token generated
  - `org_invites` document created with 7-day expiry
  - Returns token and expiry date
- **Negative Tests**:
  - Caller is "team" member → Error: "Admin or manager access required"
  - Caller not active member → Error: "You are not an active member of this organization"
  - Invalid token → Auth verification fails
- **Edge Cases**:
  - Token uniqueness (24 random bytes = 2^192 space)
- **Priority**: High
- **Severity**: High

### TC-INV-002: Verify Invite Link
- **Description**: Verify invite token validation
- **Preconditions**: Valid invite token in `org_invites`
- **Positive Tests**:
  - Active, non-expired token → Returns orgId, orgName, role, expiry
- **Negative Tests**:
  - Token not found → "Invite link not found."
  - Token already used → "This invite link has already been used."
  - Token expired → Auto-marks as expired, "This invite link has expired."
  - Expired date in past → "This invite link has expired."
- **Priority**: High
- **Severity**: High

### TC-INV-003: Accept Invite
- **Description**: Verify user can accept invite and join org
- **Preconditions**: Authenticated user, valid invite token
- **Positive Tests**:
  - Token valid + not expired + not used → Member record created in `organization_members`
  - Role from invite applied
  - Default permissions assigned (ROLE_DEFAULTS[role])
  - Invite marked as "used" with timestamp and userId
  - Returns orgId
- **Negative Tests**:
  - Already a member (active) → "You are already a member of this organization."
  - Token already used → "Invite already used."
  - Token expired → "Invite has expired."
  - Invalid token → Auth verification fails
- **Priority**: High
- **Severity**: High

### TC-INV-004: Revoke Invite
- **Description**: Verify admin can revoke invite
- **Preconditions**: Valid invite, caller is admin/manager
- **Positive Tests**:
  - Caller verified as admin → Token marked as "expired"
- **Negative Tests**:
  - Caller not admin/manager → Error thrown
- **Priority**: Medium
- **Severity**: Medium

---

## 5. Lead Module

### TC-LEAD-001: Create Lead
- **Description**: Verify lead creation with all fields
- **Preconditions**: Authenticated user, org context loaded
- **Positive Tests**:
  - Create lead with required fields (firstName, lastName, email, status, source)
  - Optional fields: phone, companyName, jobTitle, value, tags, notes
  - Lead created in Firestore `leads` collection with `organizationId`, `ownerId`, timestamps
  - Redis cache invalidated for org
  - Success response with new ID
- **Negative Tests**:
  - Missing first name → Zod validation error
  - Missing last name → Validation error
  - Invalid email → Validation error
  - Negative value → `min(0)` validation error
  - Invalid status → Zod enum validation error
  - Invalid source → Zod enum validation error
- **Edge Cases**:
  - Value as empty string → `optional().or(z.literal(""))` allows it
  - Tags as empty array → Default works
  - Very long notes → No limit in schema
- **Priority**: Critical
- **Severity**: Critical

### TC-LEAD-002: List Leads with Filters
- **Description**: Verify lead listing with filtering and caching
- **Preconditions**: Leads exist for org
- **Positive Tests**:
  - All leads returned for org
  - Filter by status → Correct subset
  - Filter by source → Correct subset
  - Filter by ownerId → Correct subset
  - Search by name, email, company, phone, jobTitle → Correct results
  - Client-side filtering after server fetch
  - Redis cache hit → Cached leads returned
  - Redis cache miss → Firestore query, cached for 5 min
- **Negative Tests**:
  - Invalid orgId → Empty array (Firestore returns empty)
  - No leads → Empty array
- **Edge Cases**:
  - Timestamp rehydration from cache (seconds + nanoseconds)
- **Priority**: Critical
- **Severity**: High

### TC-LEAD-003: Get Single Lead
- **Description**: Verify lead detail retrieval
- **Preconditions**: Lead exists
- **Positive Tests**:
  - Valid lead ID → Full lead data with all fields
- **Negative Tests**:
  - Non-existent ID → "Lead not found"
  - Invalid ID format → Firestore error handled
- **Priority**: High
- **Severity**: High

### TC-LEAD-004: Update Lead
- **Description**: Verify lead update
- **Preconditions**: Lead exists
- **Positive Tests**:
  - Update any field → Firestore updated, `updatedAt` refreshed
  - Redis cache invalidated
- **Negative Tests**:
  - Invalid data → Firestore handles, but no client-side validation on update
- **Priority**: High
- **Severity**: High

### TC-LEAD-005: Delete Lead
- **Description**: Verify lead deletion
- **Preconditions**: Lead exists
- **Positive Tests**:
  - Delete lead → Firestore document removed
  - Redis cache invalidated
- **Negative Tests**:
  - Non-existent ID → Firestore doesn't error on delete non-existent
- **Priority**: Medium
- **Severity**: High

### TC-LEAD-006: Convert Lead to Contact
- **Description**: Verify lead-to-contact conversion
- **Preconditions**: Lead exists, not already converted
- **Positive Tests**:
  - Lead data copied to new Contact (firstName, lastName, email, phone, companyName, jobTitle, notes)
  - Lead marked as `converted: true`, `convertedToContactId` set
  - Activity logged: "Lead converted to contact" on lead
  - Activity logged: "Contact created from lead conversion" on contact
  - Redis caches invalidated for both leads and contacts
- **Negative Tests**:
  - Lead already converted → "Lead has already been converted to a contact"
  - Non-existent lead → "Lead not found"
- **Priority**: High
- **Severity**: High

### TC-LEAD-007: Convert Lead to Deal
- **Description**: Verify lead-to-deal conversion
- **Preconditions**: Lead exists, no existing deal conversion
- **Positive Tests**:
  - Deal created with title, value, pipeline stage, description
  - Lead marked as `converted: true`, `convertedToDealId` set
  - Activities logged on both entities
  - Caches invalidated
- **Negative Tests**:
  - Lead already converted to deal → "Lead has already been converted to a deal"
- **Priority**: High
- **Severity**: High

### TC-LEAD-008: Convert Lead to Project
- **Description**: Verify lead-to-project conversion
- **Preconditions**: Lead exists, no existing project conversion
- **Positive Tests**:
  - Project created with name, description, status "Planning", priority "Medium"
  - Lead value → project budget
  - Lead marked as converted
  - Activities logged
  - Caches invalidated
- **Negative Tests**:
  - Lead already converted to project → Error
- **Priority**: High
- **Severity**: High

### TC-LEAD-009: Get Leads by Owner
- **Description**: Verify leads filtered by owner
- **Preconditions**: Leads assigned to different owners
- **Positive Tests**:
  - Returns only leads for specified owner
  - Ordered by createdAt desc
- **Negative Tests**:
  - Owner with no leads → Empty array
- **Priority**: Medium
- **Severity**: Medium

---

## 6. Contact Module

### TC-CONT-001: Create Contact
- **Description**: Verify contact creation
- **Preconditions**: Authenticated user, org context
- **Positive Tests**:
  - Create with required fields (firstName, lastName, email)
  - Optional fields: phone, companyId, companyName, jobTitle, notes
  - Firestore document created with orgId, ownerId, timestamps
  - Redis cache invalidated
- **Negative Tests**:
  - Missing first name → Zod validation error
  - Missing last name → Validation error
  - Invalid email → Validation error
- **Priority**: Critical
- **Severity**: Critical

### TC-CONT-002: List Contacts with Filters
- **Description**: Verify contact listing
- **Preconditions**: Contacts exist
- **Positive Tests**:
  - All contacts for org
  - Filter by companyId, ownerId
  - Search by name, email, company, phone, jobTitle
  - Redis cache (5 min) for unfiltered queries
  - Client-side sort by createdAt desc
- **Edge Cases**:
  - Timestamp rehydration from cache
- **Priority**: High
- **Severity**: High

### TC-CONT-003: CSV Import
- **Description**: Verify contact CSV import
- **Preconditions**: CSV file with contact data
- **Positive Tests**:
  - Each row creates a contact
  - Returns success count, failed count, error list
- **Negative Tests**:
  - Invalid rows → Skipped with errors logged
  - Empty CSV → Zero success
- **Priority**: Medium
- **Severity**: Medium

### TC-CONT-004: Update/Delete Contact
- **Description**: Verify contact update and delete
- **Preconditions**: Contact exists
- **Positive Tests**:
  - Update → Firestore updated, cache invalidated
  - Delete → Firestore deleted, cache invalidated
- **Priority**: High
- **Severity**: High

---

## 7. Company Module

### TC-COMP-001: Create Company
- **Description**: Verify company creation
- **Preconditions**: Authenticated user, org context
- **Positive Tests**:
  - Create with required name, optional email, domain, industry, phone, description, size, annualRevenue, notes, address fields
  - Address fields: billingStreet, billingCity, billingState, billingZipCode, billingCountry
  - Firestore document created with orgId, ownerId, timestamps
  - Redis cache invalidated
- **Negative Tests**:
  - Missing name → Zod validation error
  - Invalid email format → Validation error
  - Negative annualRevenue → `min(0)` validation
- **Priority**: Critical
- **Severity**: Critical

### TC-COMP-002: List Companies with Filters
- **Description**: Verify company listing
- **Preconditions**: Companies exist
- **Positive Tests**:
  - All companies for org
  - Filter by industry, size, ownerId
  - Search by name, domain, industry, email, phone
  - Redis cache (5 min) for unfiltered queries
- **Edge Cases**:
  - Timestamp rehydration
- **Priority**: High
- **Severity**: High

### TC-COMP-003: Get Company Contacts
- **Description**: Verify retrieval of contacts linked to company
- **Preconditions**: Contacts exist with companyId
- **Positive Tests**:
  - Returns all contacts where `companyId` matches
- **Priority**: Medium
- **Severity**: Medium

---

## 8. Deal Module

### TC-DEAL-001: Create Deal
- **Description**: Verify deal creation
- **Preconditions**: Authenticated user, org context
- **Positive Tests**:
  - Create with title, stage, value, probability
  - Optional: closeDate, contactIds, companyId, description, notes
  - `contactIds` defaulted to empty array
  - `archived` set to `false`
  - Undefined values stripped before Firestore write
  - Redis cache invalidated
- **Negative Tests**:
  - Missing title → Zod validation error
  - Negative value → `min(0)` validation
  - Probability > 100 → `max(100)` validation
  - Invalid stage → Zod enum validation
- **Edge Cases**:
  - Value of 0 → Allowed (min: 0)
  - Empty contactIds → Defaults to []
- **Priority**: Critical
- **Severity**: Critical

### TC-DEAL-002: List Deals with Filters
- **Description**: Verify deal listing with client-side filtering
- **Preconditions**: Deals exist
- **Positive Tests**:
  - All non-archived deals returned by default
  - Filter by stage, companyId, ownerId, archived status
  - Filter by minValue, maxValue
  - Search by title, companyName, description, ownerName
  - Redis cache (5 min)
- **Edge Cases**:
  - Archived deals hidden unless `archived: true` filter
- **Priority**: Critical
- **Severity**: High

### TC-DEAL-003: Kanban View (Deals by Stage)
- **Description**: Verify deals grouped by stage for Kanban
- **Preconditions**: Deals exist in various stages
- **Positive Tests**:
  - Returns `Record<DealStage, Deal[]>` with all 6 stages as keys
  - Empty stages have empty arrays
- **Priority**: Medium
- **Severity**: Medium

### TC-DEAL-004: Update Deal Stage
- **Description**: Verify stage update with notification
- **Preconditions**: Deal exists
- **Positive Tests**:
  - Stage updated in Firestore
  - If changed to "Won" or "Lost" → notification created for deal owner
  - Redis cache invalidated
- **Negative Tests**:
  - Invalid stage → Firestore error
- **Priority**: High
- **Severity**: High

### TC-DEAL-005: Deal Won/Lost Notifications
- **Description**: Verify notifications for stage changes
- **Preconditions**: Deal with ownerId set
- **Positive Tests**:
  - Stage → "Won" → `deal_won` notification created
  - Stage → "Lost" → `deal_lost` notification created
  - Stage → other → No notification
- **Edge Cases**:
  - Notification creation failure → Silently caught with empty catch block
- **Priority**: Medium
- **Severity**: Medium

### TC-DEAL-006: Archive/Unarchive Deal
- **Description**: Verify deal archival
- **Preconditions**: Deal exists
- **Positive Tests**:
  - Archive → `archived: true`, hidden from default lists
  - Unarchive → `archived: false`, visible again
  - Cache invalidated
- **Priority**: Medium
- **Severity**: Medium

### TC-DEAL-007: Create Project from Deal
- **Description**: Verify deal-to-project conversion
- **Preconditions**: Deal exists
- **Positive Tests**:
  - Project created with deal data (name, description, budget, teamMembers)
  - Deal value → project budget
  - Activities logged on both entities
  - Caches invalidated
- **Negative Tests**:
  - Deal not found → Error
- **Priority**: High
- **Severity**: High

---

## 9. Project Module

### TC-PROJ-001: Create Project
- **Description**: Verify project creation
- **Preconditions**: Authenticated user, org context
- **Positive Tests**:
  - Create with name, status, priority, startDate
  - Optional: description, endDate, financials, budget, companyId, dealId, teamMembers, tags
  - `archived: false` default
  - Data sanitized with `sanitizeData()`
  - Redis cache invalidated
- **Negative Tests**:
  - Name < 2 chars → Zod validation error
  - Invalid status → Enum validation
  - Negative budget → `min(0)` validation
- **Priority**: Critical
- **Severity**: Critical

### TC-PROJ-002: List Projects with Filters
- **Description**: Verify project listing
- **Preconditions**: Projects exist
- **Positive Tests**:
  - Non-archived shown by default
  - Filter by status, priority, companyId, dealId, ownerId
  - Filter by archived flag
  - Search by name, description, companyName
  - Date range filter (startDateFrom/startDateTo)
  - Redis cache (5 min)
- **Priority**: High
- **Severity**: High

### TC-PROJ-003: Update Project Status
- **Description**: Verify status update
- **Preconditions**: Project exists
- **Positive Tests**:
  - Status updated, cache invalidated
- **Priority**: Medium
- **Severity**: Medium

### TC-PROJ-004: Project Archive/Unarchive
- **Description**: Verify project archival
- **Preconditions**: Project exists
- **Positive Tests**:
  - Archive → `archived: true`
  - Unarchive → `archived: false`
- **Priority**: Medium
- **Severity**: Medium

---

## 10. Task Module

### TC-TASK-001: Create Task
- **Description**: Verify task creation with notification
- **Preconditions**: Authenticated user, org context
- **Positive Tests**:
  - Create with title, status, priority, type
  - Optional: description, dueDate, assigneeId, projectId, tags, associates, relatedTo
  - If assigneeId is set and different from creator → notification created
  - Data sanitized with `sanitizeData()`
  - Redis cache invalidated
- **Negative Tests**:
  - Title < 2 chars → Zod validation error
  - Invalid status → Enum validation
  - Invalid priority → Enum validation
  - Invalid type → Enum validation
- **Priority**: Critical
- **Severity**: Critical

### TC-TASK-002: List Tasks with Filters
- **Description**: Verify task listing with advanced filtering
- **Preconditions**: Tasks exist
- **Positive Tests**:
  - `isArchived` filter (default: false)
  - Filter by status, priority, type, assigneeId, projectId, ownerId
  - Search by title, description, projectName, assigneeName
  - Date range filter (dueDateFrom/dueDateTo)
  - User role filter: "all", "assigned", "created", "associated"
  - Multi-select filters: priorities[], statuses[]
  - Redis cache (5 min) for unfiltered, non-archived
- **Edge Cases**:
  - Composite index issues — client-side sort fallback
- **Priority**: Critical
- **Severity**: High

### TC-TASK-003: Archive Task (Done Only)
- **Description**: Verify only completed tasks can be archived
- **Preconditions**: Task exists
- **Positive Tests**:
  - Task with status "Done" → Archived successfully
  - `isArchived: true`, `archivedAt` set
  - Cache invalidated
- **Negative Tests**:
  - Task status NOT "Done" → "Only completed tasks (Done) can be archived"
  - Task not found → "Task not found"
- **Priority**: Medium
- **Severity**: Medium

### TC-TASK-004: Task Status Update
- **Description**: Verify status update with completion tracking
- **Preconditions**: Task exists
- **Positive Tests**:
  - Status updated
  - If status → "Done", `completedAt` timestamp set
- **Priority**: High
- **Severity**: High

### TC-TASK-005: Task Assignment Notification
- **Description**: Verify notification on task assignment
- **Preconditions**: Task created or updated with assigneeId
- **Positive Tests**:
  - `createTask()` with assigneeId → `task_assigned` notification
  - `updateTask()` with new assigneeId → `task_assigned` notification
- **Edge Cases**:
  - Assignee same as owner → No notification (condition: `assigneeId !== current.ownerId`)
- **Priority**: Medium
- **Severity**: Medium

### TC-TASK-006: Get Tasks by Project/Assignee
- **Description**: Verify filtered task queries
- **Preconditions**: Tasks linked to projects/assignees
- **Positive Tests**:
  - `getTasksByProject()` → Tasks for specific project
  - `getTasksByAssignee()` → Tasks assigned to user
- **Priority**: Medium
- **Severity**: Medium

---

## 11. Invoice Module

### TC-INV-001: Create Invoice
- **Description**: Verify invoice creation with calculations
- **Preconditions**: Authenticated user, org context, invoice settings configured
- **Positive Tests**:
  - Create with companyName, issueDate, dueDate, currency, paymentTerms, lineItems
  - Line item validation: description required, quantity ≥ 1, price ≥ 0
  - At least one line item required
  - Invoice number auto-generated if not provided
  - All financial calculations computed client-side (subtotal, tax, total)
  - Redis cache invalidated
- **Negative Tests**:
  - Missing companyName → Zod validation error
  - Invalid email format → Validation error
  - Zero line items → "At least one item is required"
  - Negative tax rate → `min(0)` validation
  - Tax rate > 100 → `max(100)` validation
  - Negative discount → `min(0)` validation
  - Invalid template → Enum validation
  - Invalid status → Enum validation
- **Edge Cases**:
  - Recurring invoice configuration
  - Invoice number generation failure → Error with specific message
- **Priority**: Critical
- **Severity**: Critical

### TC-INV-002: List Invoices with Filters
- **Description**: Verify invoice listing
- **Preconditions**: Invoices exist
- **Positive Tests**:
  - Filter by status, companyId, ownerId
  - Search by invoiceNumber, companyName, contactName, clientEmail, status
  - Sorted by createdAt desc
  - Redis cache (5 min)
- **Priority**: High
- **Severity**: High

### TC-INV-003: Update Invoice Status
- **Description**: Verify status update with notification
- **Preconditions**: Invoice exists
- **Positive Tests**:
  - Status → "Paid" with paidDate → `paidDate` timestamp set
  - Status → "Paid" and was not paid before → `invoice_paid` notification
  - Cache invalidated
- **Negative Tests**:
  - Invoice not found → Error thrown
- **Priority**: High
- **Severity**: High

### TC-INV-004: Invoice Stats
- **Description**: Verify invoice statistics
- **Preconditions**: Invoices exist in various statuses
- **Positive Tests**:
  - `totalRevenue`: Sum of all "Paid" invoice totals
  - `outstanding`: Sum of "Sent" + "Overdue" invoice totals
  - `overdueCount`: Count of "Overdue" invoices
  - `draftCount`: Count of "Draft" invoices
- **Priority**: Medium
- **Severity**: Medium

### TC-INV-005: Invoice PDF Generation
- **Description**: Verify PDF generation for invoices
- **Preconditions**: Invoice exists
- **Positive Tests**:
  - PDF generated with invoice data (line items, totals, company info)
  - PDF can be downloaded
- **Priority**: Medium
- **Severity**: Medium

### TC-INV-006: Invoice Email Send
- **Description**: Verify sending invoice via email with PDF attachment
- **Preconditions**: Invoice exists, email settings configured
- **Positive Tests**:
  - POST to `/api/invoices/send` with recipient, PDF base64
  - Email sent with PDF attachment
  - Legacy format supported (invoice + companyInfo objects)
  - Plain text body → HTML converted (newlines → `<br>`)
  - CC and BCC passed to sendEmail
- **Negative Tests**:
  - Missing recipient → "Missing required fields" error
  - Missing PDF → "Missing required fields" error
  - Missing subject and body → "Missing subject or body" error
  - Email send failure → 500 error
- **Priority**: High
- **Severity**: High

---

## 12. Email Module

### TC-EMAIL-001: Send Email with Merge Fields
- **Description**: Verify email sending with merge field resolution
- **Preconditions**: SMTP configured, contacts/deals exist
- **Positive Tests**:
  - POST to `/api/email/send` with email data + context
  - Merge fields resolved: `{{contact.firstName}}`, `{{deal.name}}`, etc.
  - Plain text version generated from HTML
  - Tracking pixel injected if `trackOpens` enabled
  - Links rewritten for click tracking if `trackClicks` enabled
  - From name formatted as "User Name via ExcelBees"
  - Reply-To set to sender's email
  - Email status updated to "sent"
  - Activity logged to CRM timeline
- **Negative Tests**:
  - No recipients → Validation error
  - No subject → Validation error
  - No body → Validation error
  - Attachments > 25MB → Validation error
  - Email send failure → Status set to "failed"
- **Priority**: High
- **Severity**: High

### TC-EMAIL-002: SMTP Configuration
- **Description**: Verify org-specific SMTP configuration
- **Preconditions**: Authenticated user, org exists
- **Positive Tests**:
  - Custom SMTP saved → Used for org emails
  - Password encrypted before storage
  - Default SMTP fallback if org config missing
- **Edge Cases**:
  - SMTP password stored as "********" → Not decrypted (already encrypted)
  - Transporter caching for Lambda (singleton pattern)
- **Priority**: Medium
- **Severity**: Medium

### TC-EMAIL-003: Track Email Open
- **Description**: Verify email open tracking via pixel
- **Preconditions**: Email sent with tracking enabled
- **Positive Tests**:
  - GET to tracking pixel URL → 1x1 transparent GIF returned
  - Email `tracking.opens` incremented
  - `tracking.lastOpenedAt` and `tracking.firstOpenedAt` set
- **Negative Tests**:
  - Invalid email ID → Silently caught (empty catch)
- **Priority**: Low
- **Severity**: Low

### TC-EMAIL-004: Track Email Click
- **Description**: Verify email click tracking via link rewrite
- **Preconditions**: Email sent with click tracking enabled
- **Positive Tests**:
  - GET to tracking click URL → Redirect to original URL
  - Email `tracking.clicks` incremented
- **Priority**: Low
- **Severity**: Low

### TC-EMAIL-005: Email Templates
- **Description**: Verify email template CRUD
- **Preconditions**: Authenticated user
- **Positive Tests**:
  - Create template with name, subject, body, category
  - List templates with category/active/createdBy filters
  - Update template fields
  - Delete template
  - Usage count tracking
- **Priority**: Medium
- **Severity**: Medium

---

## 13. Notes Module

### TC-NOTE-001: Create Note
- **Description**: Verify note creation
- **Preconditions**: Authenticated user, org context
- **Positive Tests**:
  - Create note with content (rich text)
  - Optional: relatedTo (lead/contact/deal/company/project)
  - Optional: isPinned
- **Priority**: Medium
- **Severity**: Medium

### TC-NOTE-002: List/Update/Delete Notes
- **Description**: Verify note management
- **Preconditions**: Notes exist
- **Positive Tests**:
  - List notes by related entity
  - Update note content
  - Delete note
- **Priority**: Low
- **Severity**: Low

---

## 14. Quotes Module

### TC-QUOTE-001: Create Quote
- **Description**: Verify quote creation
- **Preconditions**: Authenticated user, org context
- **Positive Tests**:
  - Create with quoteNumber, status, line items
  - Calculations: subtotal, tax, discount, total
  - Optional links to company, contact, deal
- **Priority**: Medium
- **Severity**: Medium

### TC-QUOTE-002: Quote Status Management
- **Description**: Verify quote status changes
- **Preconditions**: Quote exists
- **Positive Tests**:
  - Status transitions: Draft → Sent → Accepted/Rejected/Expired
- **Priority**: Low
- **Severity**: Low

---

## 15. Dashboard Module

### TC-DASH-001: Dashboard Stats Loading
- **Description**: Verify dashboard stats are loaded and cached
- **Preconditions**: Authenticated user, org context, data exists (leads, deals, etc.)
- **Positive Tests**:
  - `getCachedDashboardStats()` called with userId and orgId
  - Redis check for cached stats → Serve from cache if exists
  - Cache miss → Parallel Firestore queries for leads, deals, companies, projects, tasks, invoice stats
  - Stats computed correctly:
    - `totalLeads`: All leads in org
    - `activeDeals`: Deals not Won/Lost
    - `totalCompanies`: All companies in org
    - `totalRevenue`: Sum of paid invoices
    - `activeProjects`: Projects with status "Active"
    - `pendingTasks`: Tasks not "Done"
  - Task query uses `userRole: "associated"` filter
  - Upcoming tasks: Sort by dueDate (asc), limit 5
  - Results cached in Redis for 5 min
- **Negative Tests**:
  - Missing userId → Returns null
  - Redis failure → Returns null
  - No data for any entity → All zeros/empty arrays
- **Priority**: Critical
- **Severity**: High

### TC-DASH-002: Revenue Display by Role
- **Description**: Verify revenue hidden for non-admin/manager
- **Preconditions**: Dashboard loaded
- **Positive Tests**:
  - Admin/manager role → Actual revenue shown with dollar sign
  - Team role → Revenue shown as "$•••" (obfuscated)
  - Team role → Lock icon for revenue card
- **Negative Tests**:
  - Undefined role → Lock icon, obfuscated (safe fallback)
- **Priority**: Medium
- **Severity**: Medium

### TC-DASH-003: Quick Actions Visibility
- **Description**: Verify quick action visibility by role
- **Preconditions**: Dashboard loaded
- **Positive Tests**:
  - Admin/manager → "Create Invoice" action visible
  - Team role → "Create Invoice" NOT visible
- **Priority**: Low
- **Severity**: Low

---

## 16. Reports Module

### TC-REP-001: Report Generation
- **Description**: Verify reports can be generated
- **Preconditions**: Authenticated user, data exists
- **Positive Tests**:
  - Revenue forecast chart renders
  - AI executive summary generated
  - Report query input accepts custom queries
- **Priority**: Medium
- **Severity**: Medium

---

## 17. Analytics Module

### TC-ANL-001: Analytics Page
- **Description**: Verify analytics display
- **Preconditions**: Data exists
- **Positive Tests**:
  - Charts render with data (ActivityChart, PipelineChart, RevenueChart)
- **Priority**: Low
- **Severity**: Low

---

## 18. Notifications Module

### TC-NOTIF-001: Create Notification
- **Description**: Verify notification creation for all event types
- **Preconditions**: Events triggered (deal won/lost, task assigned, invoice paid)
- **Positive Tests**:
  - `createNotification()` called with correct type, userId, message
  - Notification stored with entity reference
  - `read` defaults to `false`
  - Undefined values stripped
- **Priority**: Medium
- **Severity**: Medium

### TC-NOTIF-002: List Notifications
- **Description**: Verify notification listing with unread filter
- **Preconditions**: Notifications exist for user
- **Positive Tests**:
  - All notifications for user (org-scoped)
  - Unread only filter
  - Ordered by createdAt desc, limit 50
  - Fallback if composite index missing: fetch unfiltered, sort client-side, slice 50
- **Priority**: Medium
- **Severity**: Medium

### TC-NOTIF-003: Mark as Read
- **Description**: Verify mark as read functionality
- **Preconditions**: Unread notification exists
- **Positive Tests**:
  - `markAsRead()` → `read: true`
  - `markAllAsRead()` → All unread marked read
- **Priority**: Low
- **Severity**: Low

---

## 19. Activity Timeline Module

### TC-ACT-001: Create Activity
- **Description**: Verify activity logging
- **Preconditions**: Any CRM entity operation
- **Positive Tests**:
  - Activity created with type, content, performedBy, relatedTo
  - Undefined values stripped
  - Supported types: note, email, call, log, status_change, created, updated, deleted
- **Priority**: Medium
- **Severity**: Medium

### TC-ACT-002: Get Activities by Entity
- **Description**: Verify activity retrieval
- **Preconditions**: Activities exist for entity
- **Positive Tests**:
  - `getActivities(collection, id)` → Ordered by createdAt desc, limit 50
  - `getOrganizationActivities(orgId)` → All org activities, limit 50
  - Composite index required for compound query with orderBy
- **Priority**: Medium
- **Severity**: Medium

---

## 20. User & Team Management

### TC-USER-001: Create User (Admin)
- **Description**: Verify admin can create users
- **Preconditions**: Authenticated with admin role
- **Positive Tests**:
  - User document created in `users` collection
  - Role assigned
  - `isFirstLogin` properly set based on provider
  - `isOnboarded: false` (requires wizard)
- **Negative Tests**:
  - Non-admin caller → Should be prevented (server action check)
- **Priority**: High
- **Severity**: High

### TC-USER-002: Update User Role
- **Description**: Verify role update
- **Preconditions**: User exists, caller has permission
- **Positive Tests**:
  - Role updated in Firestore
  - `updatedAt` timestamp set
- **Edge Cases**:
  - No validation on role value (must match enum)
- **Priority**: High
- **Severity**: High

### TC-USER-003: Approve/Deactivate User
- **Description**: Verify user approval and deactivation
- **Preconditions**: User exists
- **Positive Tests**:
  - `approveUser(uid, true)` → `isActive: true`
  - `approveUser(uid, false)` → `isActive: false`
- **Priority**: High
- **Severity**: High

### TC-USER-004: Delete User (Soft)
- **Description**: Verify user deletion (soft delete)
- **Preconditions**: User exists
- **Positive Tests**:
  - Status set to "inactive"
  - `deletedAt` timestamp set
  - Document NOT actually removed (soft delete)
- **Priority**: Medium
- **Severity**: Medium

### TC-USER-005: Get Users (All)
- **Description**: Verify user listing
- **Preconditions**: Users exist
- **Positive Tests**:
  - Returns all users
  - Missing displayName → Falls back to email prefix or "Unknown User"
- **Negative Tests**:
  - No users → Empty array
- **Priority**: Medium
- **Severity**: Medium

### TC-USER-006: Update User Permissions
- **Description**: Verify permission update
- **Preconditions**: User exists, admin caller
- **Positive Tests**:
  - Custom permissions stored in `users/{uid}/permissions`
  - `resetUserPermissions()` → Resets to role defaults
- **Priority**: High
- **Severity**: High

### TC-USER-007: Update Member Role
- **Description**: Verify org member role change
- **Preconditions**: Org member exists
- **Positive Tests**:
  - Role updated in `organization_members/{orgId}_{userId}`
  - Permissions auto-set to `ROLE_DEFAULTS[newRole]`
- **Priority**: High
- **Severity**: High

### TC-USER-008: Remove Member (Suspend)
- **Description**: Verify member removal (soft)
- **Preconditions**: Org member exists
- **Positive Tests**:
  - Status set to "suspended"
  - Document NOT deleted
- **Priority**: Medium
- **Severity**: Medium

---

## 21. Profile & Settings

### TC-PROF-001: Update User Profile
- **Description**: Verify profile update
- **Preconditions**: Authenticated user
- **Positive Tests**:
  - Update displayName, firstName, lastName, photoURL, phone, position
  - `lastLoginAt` updated automatically
- **Priority**: Medium
- **Severity**: Medium

### TC-PROF-002: Invoice Settings
- **Description**: Verify invoice user settings
- **Preconditions**: Authenticated user
- **Positive Tests**:
  - Get and set invoice settings (template, companyName, fromName, fromEmail, logoUrl, colorTheme, prefix, next number, payment details)
  - Settings stored in `users/{uid}/invoiceSettings`
- **Priority**: Medium
- **Severity**: Medium

---

## 22. Permissions & RBAC

### TC-PERM-001: Role-based Access (Client-side)
- **Description**: Verify PermissionGate/FeatureGate/RoleGate components
- **Preconditions**: User with specific role
- **Positive Tests**:
  - `PermissionGate` with correct permission → Children rendered
  - `PermissionGate` without permission → Fallback rendered (or null)
  - `FeatureGate` with enabled feature → Children rendered
  - `FeatureGate` with disabled feature → Fallback rendered
  - `RoleGate` with matching roles → Children rendered
  - `RoleGate` without matching role → Fallback rendered
- **Priority**: High
- **Severity**: High

### TC-PERM-002: Admin Bypass
- **Description**: Verify admin bypasses all permission checks
- **Preconditions**: User with admin role
- **Positive Tests**:
  - `can()` returns `true` for any module + action
  - `hasFeature()` returns `true` for any feature
  - `canEditAll()` returns `true` for any module
- **Priority**: High
- **Severity**: High

### TC-PERM-003: Server-side Permission Check
- **Description**: Verify server-side permission validation
- **Preconditions**: User ID with known permissions
- **Positive Tests**:
  - `hasPermission(userId, "leads", "create")` → Based on role
  - `hasPermission(userId, "reports", "delete")` → False for non-admin (admin: true, manager: false, team: false)
  - `validateTaskPermission(taskId, "update", userId)` → Checks ownership + editAll
  - `validateProjectPermission(projectId, "delete", userId)` → Admin bypass, owner allowed
  - `canEditAll(userId, "contacts")` → Based on role
- **Edge Cases**:
  - Permission cache with 5-min TTL
  - `edit` action also granted by `editAll`
- **Priority**: Critical
- **Severity**: Critical

### TC-PERM-004: Permission Cache
- **Description**: Verify permission caching behavior
- **Preconditions**: User with permissions
- **Positive Tests**:
  - First check → Firestore read, cached
  - Second check within 5 min → Cached, no Firestore read
  - After 5 min → Cache expired, Firestore read again
  - `clearPermissionCache(userId)` → Cache cleared
- **Priority**: Medium
- **Severity**: Medium

### TC-PERM-005: Permission Denial Logging
- **Description**: Verify RBAC denial audit logging
- **Preconditions**: Permission denied scenario
- **Positive Tests**:
  - `logPermissionDenial()` → Console warning + Firestore audit_logs entry
- **Priority**: Low
- **Severity**: Low

---

## 23. API Routes

### TC-API-001: Health Check
- **Description**: Verify health endpoint
- **Preconditions**: Server running
- **Positive Tests**:
  - GET `/api/health` → 200 with success response
- **Priority**: Low
- **Severity**: Low

### TC-API-002: Email Send API
- **Description**: Verify email send API auth and validation
- **Preconditions**: Server running
- **Positive Tests**:
  - POST with valid email data → 200
  - Merge fields resolved
  - Tracking applied
- **Negative Tests**:
  - POST without email data → 400 error
  - Invalid request body → 500 error
- **Note**: No auth verification on this route
- **Priority**: High
- **Severity**: Critical

### TC-API-003: Invoice Send API
- **Description**: Verify invoice email API
- **Preconditions**: Server running
- **Positive Tests**:
  - POST with to + pdfBase64 → Email sent with PDF
  - Legacy format (invoice + companyInfo) → Subject + body generated
  - Plain text body → HTML conversion
  - CC/BCC supported
- **Negative Tests**:
  - Missing fields → 400 error
  - Send failure → 500 error
- **Note**: No auth verification on this route
- **Priority**: High
- **Severity**: Critical

### TC-API-004: Protected Route Wrapper
- **Description**: Verify protectedRoute HOF functionality
- **Preconditions**: Server running
- **Positive Tests**:
  - `requireAuth(handler)` → 401 if no valid Bearer token
  - `requireAdmin(handler)` → 403 if not admin
  - `requireManager(handler)` → 403 if team member
  - Protected with permission check → 403 if missing permission
- **Priority**: High
- **Severity**: Critical

### TC-API-005: API Auth — verifyApiRequest
- **Description**: Verify API auth verification
- **Preconditions**: Server running
- **Positive Tests**:
  - Valid Bearer token → Returns user with role, permissions, isActive, isApproved
  - Deactivated user (isActive: false) → 403 "User account is deactivated"
  - Unapproved user (isApproved: false) → 403 "User account is pending approval"
  - Invalid token → 401
  - Missing header → 401 "Authorization header required"
  - Missing Bearer prefix → 401 "Invalid authorization format"
  - Non-existent user → 404 "User profile not found"
- **Priority**: Critical
- **Severity**: Critical

---

## 24. Server Actions

### TC-SA-001: Dashboard Stats Action
- **Description**: Verify server action for dashboard stats
- **Preconditions**: Server running
- **Positive Tests**:
  - `getCachedDashboardStats(userId, orgId)` called on dashboard
  - Redis cache hit → Return cached
  - Redis cache miss → Firestore queries, cache, return
  - Error → Return null (graceful degradation)
- **Priority**: High
- **Severity**: High

### TC-SA-002: Invite Actions
- **Description**: Verify invite server actions
- **Preconditions**: Server running
- **Positive Tests**:
  - All invite actions use Firebase Admin SDK
  - Token verification via `verifyCallerIsOrgAdmin()`
  - Proper error handling and status codes
- **Priority**: High
- **Severity**: High

### TC-SA-003: Admin User Actions
- **Description**: Verify server-side admin actions
- **Preconditions**: Server running
- **Positive Tests**:
  - Server auth verification via `auth()` from `server-auth.ts`
  - Token extracted from Authorization header or session cookie
  - Role-checked before admin operations
- **Priority**: High
- **Severity**: High

---

## 25. Middleware

### TC-MW-001: Legacy Route Redirection
- **Description**: Verify legacy routes redirect to /org
- **Preconditions**: Server running
- **Positive Tests**:
  - GET `/dashboard` → Redirect to `/org` (if authenticated) or `/login`
  - GET `/leads` → Redirect to `/org` or `/login`
  - GET `/contacts` → Redirect to `/org` or `/login`
  - GET `/companies` → Redirect to `/org` or `/login`
  - GET `/deals` → Redirect to `/org` or `/login`
  - GET `/projects` → Redirect to `/org` or `/login`
  - GET `/tasks` → Redirect to `/org` or `/login`
  - GET `/invoices` → Redirect to `/org` or `/login`
  - GET `/reports` → Redirect to `/org` or `/login`
  - GET `/settings` → Redirect to `/org` or `/login`
  - GET `/profile` → Redirect to `/org` or `/login`
  - GET `/users` → Redirect to `/org` or `/login`
  - GET `/analytics` → Redirect to `/org` or `/login`
  - GET `/emails` → Redirect to `/org` or `/login`
- **Priority**: Medium
- **Severity**: Medium

### TC-MW-002: Public Route Bypass
- **Description**: Verify public routes pass through middleware
- **Preconditions**: Server running
- **Positive Tests**:
  - GET `/` → No redirect
  - GET `/login` → No redirect
  - GET `/signup` → No redirect
  - GET `/register` → No redirect
  - GET `/forgot-password` → No redirect
  - GET `/about` → No redirect
  - GET `/blog` → No redirect
  - GET `/contact` → No redirect
  - GET `/invite/{token}` → No redirect
- **Priority**: Medium
- **Severity**: Medium

### TC-MW-003: Admin Route Protection
- **Description**: Verify admin routes require auth
- **Preconditions**: Server running
- **Positive Tests**:
  - GET `/admin` (without auth) → Redirect to `/login`
  - GET `/api/admin` (without auth) → Redirect to `/login`
  - GET `/api/admin/sync-claims` → NOT redirected (exempt)
- **Priority**: High
- **Severity**: High

### TC-MW-004: Static File Bypass
- **Description**: Verify static files bypass middleware
- **Preconditions**: Server running
- **Positive Tests**:
  - `_next/static/*` → Pass through
  - `_next/image/*` → Pass through
  - `favicon.ico` → Pass through
  - `*.png`, `*.jpg`, `*.ico` → Pass through
  - `/api/*` → Pass through (handled by middleware matcher exclusion)
- **Priority**: Low
- **Severity**: Low

---

## 26. UI/UX Tests

### TC-UI-001: Sidebar Navigation
- **Description**: Verify sidebar displays correct navigation items based on role
- **Preconditions**: Authenticated user, org context loaded
- **Positive Tests**:
  - All CRM nav items shown: Dashboard, Leads, Contacts, Companies, Deals, Projects, Tasks, Notes, Quotes, Invoices, Email, Reports
  - Admin/manager → Administration section shown (Team, Integrations, Settings)
  - Team role → Administration section hidden
  - Collapsible sidebar → Icons only when collapsed
  - Active route highlighted with primary color
  - Collapse/expand toggle works
  - Persists collapsed state (localStorage)
- **Priority**: High
- **Severity**: Medium

### TC-UI-002: Loading States
- **Description**: Verify loading states for all async operations
- **Preconditions**: Various data states
- **Positive Tests**:
  - Auth loading → "Initializing CRM..." spinner
  - Org context loading → "Loading workspace..." spinner
  - Dashboard loading → Large spinner
  - Data fetching → Component-specific loading states
  - 5-second auth timeout → Fallback render
- **Priority**: High
- **Severity**: Medium

### TC-UI-003: Empty States
- **Description**: Verify empty states for all data lists
- **Preconditions**: No data for module
- **Positive Tests**:
  - No orgs → "No organizations yet" with create button
  - No search results → "No organizations match your search"
  - No tasks → "No upcoming tasks" (dashboard)
  - Empty lists → Appropriate empty state messages
- **Priority**: Medium
- **Severity**: Low

### TC-UI-004: Error States
- **Description**: Verify error states
- **Preconditions**: Error conditions
- **Positive Tests**:
  - Org access denied → "Access denied" with "Back to Organizations" button
  - Org not found → "This organization could not be found."
  - Toast errors for API failures
  - `error.tsx` and `global-error.tsx` boundaries
  - `not-found.tsx` for 404 pages
- **Priority**: High
- **Severity**: Medium

### TC-UI-005: Command Palette (Search)
- **Description**: Verify command palette functionality
- **Preconditions**: Authenticated user
- **Positive Tests**:
  - Cmd+K / Ctrl+K opens search
  - Search across CRM entities
  - Navigate to results
- **Priority**: Low
- **Severity**: Low

---

## 27. Security Tests

### TC-SEC-001: Cross-Org Data Isolation
- **Description**: Verify one org cannot access another org's data
- **Preconditions**: Two orgs, user in org A not in org B
- **Positive Tests**:
  - All Firestore queries filter by `organizationId`
  - `getOrganizationMember()` returns null for non-members
  - Org layout validates membership before rendering
- **Risk**: If `organizationId` filter is missing in any query, cross-org data leak
- **Priority**: Critical
- **Severity**: Critical

### TC-SEC-002: Server Action Auth
- **Description**: Verify server actions enforce authentication
- **Preconditions**: Server running
- **Positive Tests**:
  - `server-auth.ts` verifies ID token before all server actions
  - Returns `null` session for invalid/missing tokens
  - Admin actions check role before execution
- **Priority**: Critical
- **Severity**: Critical

### TC-SEC-003: API Route Auth
- **Description**: Verify API routes enforce authentication
- **Preconditions**: Server running
- **Positive Tests**:
  - `verifyApiRequest()` checks Bearer token
  - Verifies Firebase ID token with `checkRevoked: true`
  - Checks isActive and isApproved status
  - `protectedRoute` wrapper adds role/permission/feature checks
- **Priority**: Critical
- **Severity**: Critical

### TC-SEC-004: SMTP Password Encryption
- **Description**: Verify SMTP passwords are encrypted at rest
- **Preconditions**: SMTP config saved
- **Positive Tests**:
  - Password encrypted before storing in Firestore
  - Decrypted only when creating transporter
  - "********" placeholder treated as already encrypted
- **Priority**: High
- **Severity**: High

### TC-SEC-005: Security Headers
- **Description**: Verify HTTP security headers
- **Preconditions**: Server running
- **Positive Tests**:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - No `X-Powered-By` header
- **Priority**: Medium
- **Severity**: Medium

### TC-SEC-006: Firebase Config Exposure
- **Description**: Verify Firebase client config is public-only
- **Preconditions**: Build deployed
- **Positive Tests**:
  - Only `NEXT_PUBLIC_FIREBASE_*` env vars exposed to client
  - Admin SDK credentials (FIREBASE_PRIVATE_KEY, etc.) server-only
- **Priority**: Critical
- **Severity**: Critical

### TC-SEC-007: XSS Prevention
- **Description**: Verify XSS protection in rich text fields
- **Preconditions**: Server running
- **Positive Tests**:
  - Email HTML sanitization should prevent script injection
  - Rich text editor (Tiptap) should sanitize HTML
  - Merge field resolution should not execute arbitrary code
- **Priority**: High
- **Severity**: High

---

## 28. Caching & Performance

### TC-CACHE-001: Redis Cache Invalidation
- **Description**: Verify cache invalidation on data changes
- **Preconditions**: Redis configured
- **Positive Tests**:
  - Create/update/delete lead → `leads:{orgId}:list:all` deleted
  - Create/update/delete contact → `contacts:{orgId}:list:all` deleted
  - Create/update/delete company → `companies:{orgId}:list:all` deleted
  - Create/update/delete/archive deal → `deals:{orgId}:list:all` deleted
  - Dashboard stats → `dashboard:stats:{orgId}:{userId}` deleted
- **Priority**: High
- **Severity**: High

### TC-CACHE-002: Cache TTL
- **Description**: Verify cache TTL is 5 minutes
- **Preconditions**: Redis configured
- **Positive Tests**:
  - After 5 minutes, cache key automatically expires
  - Next request after expiry → Fresh Firestore fetch
- **Priority**: Medium
- **Severity**: Medium

### TC-CACHE-003: Redis Singleton Pattern
- **Description**: Verify Redis singleton for Lambda
- **Preconditions**: Server running
- **Positive Tests**:
  - `getRedis()` returns same instance across calls
  - Client-side returns dummy (no-op) Redis
- **Priority**: Low
- **Severity**: Low

### TC-CACHE-004: Client-side Data Freshness
- **Description**: Verify Firestore onSnapshot provides real-time updates
- **Preconditions**: User profile subscribed
- **Positive Tests**:
  - Changes to `users/{uid}` reflected in real-time
  - Server data vs local cache distinction handled
  - Loading stays true until server confirms (prevents flash of stale data)
- **Priority**: Medium
- **Severity**: Medium