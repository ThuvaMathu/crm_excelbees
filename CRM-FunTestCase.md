# CRM Functional Test Cases — Business Workflow Validation

> **Project**: RCRM by ExcelBees  
> **Focus**: Validating business functionality from the user's perspective  
> **Method**: Reverse-engineered from page components, dialogs, and workflows  

---

## Table of Contents

1. [Registration & Onboarding](#1-registration--onboarding)
2. [Authentication & Session Management](#2-authentication--session-management)
3. [Organization Management](#3-organization-management)
4. [Team Invitation & Management](#4-team-invitation--management)
5. [Lead Management](#5-lead-management)
6. [Contact Management](#6-contact-management)
7. [Company Management](#7-company-management)
8. [Deal Pipeline (Kanban)](#8-deal-pipeline-kanban)
9. [Project Management](#9-project-management)
10. [Task Management](#10-task-management)
11. [Invoice Management](#11-invoice-management)
12. [Quotes / Proposals](#12-quotes--proposals)
13. [Email Communication](#13-email-communication)
14. [Notes](#14-notes)
15. [Dashboard](#15-dashboard)
16. [Settings & Profile](#16-settings--profile)
17. [Lead Conversion Workflow](#17-lead-conversion-workflow)
18. [Deal-to-Project Workflow](#18-deal-to-project-workflow)
19. [SMTP Integration](#19-smtp-integration)
20. [AI Features](#20-ai-features)

---

## 1. Registration & Onboarding

### FT-REG-001: Self-registration via email
- **User Story**: As a new visitor, I want to create an account so I can use the CRM.
- **Workflow**: Visit `/signup` → Enter name, email, password → Submit → Firebase Auth creates user → Firestore user doc created with `role: admin` → Redirected to `/onboarding`
- **Validation Points**:
  - Name, email, password fields are present and validated
  - "Create Account" button triggers account creation
  - Password must be at least 8 characters
  - Password must contain uppercase, lowercase, and number
  - Passwords must match with confirm password
  - If email already exists → "An account with this email already exists" error
  - Success toast "Account created! Let's set up your workspace."
  - User is redirected to `/onboarding`
- **Related Test**: FT-ONB-001, FT-ONB-002

### FT-REG-002: Registration via Google OAuth
- **User Story**: As a new visitor, I want to sign up using Google so I don't need to remember another password.
- **Workflow**: Click "Continue with Google" → Google popup → New user → Firestore doc created with `role: admin` → Redirect to `/onboarding`
- **Validation Points**:
  - Google button present and clickable
  - Google popup appears
  - Returning user (already has account) → "Welcome back!" → Redirect to `/org`
  - New user → Redirect to `/onboarding`
  - Popup dismissed by user → Silent return (no error)
- **Related Test**: FT-ONB-001, FT-ONB-002

### FT-ONB-001: Onboarding — Profile Step
- **User Story**: As a new user, I want to set up my profile so my team knows who I am.
- **Workflow**: Arrive at `/onboarding` → Step 1 "Your Profile" → Fill first name, last name, phone, position → Click "Continue"
- **Validation Points**:
  - First Name, Last Name, Phone, Position fields present
  - First Name, Phone, Position are required (marked with *)
  - "Continue" button disabled until all required fields filled
  - Loading spinner during save
  - After save → if user has no orgs → shows workspace step; if user already has orgs → skips to `/org`
  - Pre-fills from Google display name if available

### FT-ONB-002: Onboarding — Workspace Step
- **User Story**: As a new user, I want to create my organization so I can start managing my CRM.
- **Workflow**: Step 2 "Your Workspace" → Enter organization name → Slug auto-generated → Click "Create Workspace"
- **Validation Points**:
  - Organization Name field required
  - Workspace URL (slug) auto-generated from name
  - Slug can be manually edited
  - Slug format: lowercase letters, numbers, hyphens only
  - "Back" button returns to profile step
  - "Create Workspace" button disabled when org name empty
  - Loading state during creation
  - If slug collision → error shown
  - On success → `isOnboarded: true` → Redirect to `/org`

### FT-ONB-003: Skip onboarding for already-onboarded users
- **User Story**: As an existing user, I should not be forced through onboarding again.
- **Workflow**: Visit `/onboarding` when `isOnboarded: true` → Redirect to `/org`
- **Validation Points**:
  - Already-onboarded user cannot access onboarding page
  - Redirect happens after hydration

---

## 2. Authentication & Session Management

### FT-AUTH-001: Login with email/password
- **User Story**: As a registered user, I want to log in so I can access my CRM.
- **Workflow**: Visit `/login` → Enter email + password → Click "Sign In"
- **Validation Points**:
  - Email and password fields present
  - "Forgot password?" link present
  - "Sign In" button triggers authentication
  - Invalid credentials → "Invalid email or password" error
  - Too many attempts → "Too many attempts. Try again later."
  - Network error → "Network error. Check your connection."
  - Success → "Welcome back!" toast → Redirect to `/org`
  - "Create account" link present for new users
  - "Back to Home" link present

### FT-AUTH-002: Login with Google
- **User Story**: As a user, I want to log in with Google.
- **Workflow**: Click "Continue with Google" → Google popup → Authenticated
- **Validation Points**:
  - Returning user → "Welcome back!" → Redirect to `/org`
  - New user → Redirect to `/onboarding`

### FT-AUTH-003: First Login Password Change
- **User Story**: As a user logging in for the first time with an email/password account, I want to be forced to change my password.
- **Workflow**: User with `isFirstLogin: true` and `provider: "password"` → Redirected to `/change-password` before accessing dashboard
- **Validation Points**:
  - User cannot navigate away from `/change-password`
  - Google users skip this flow even if `isFirstLogin: true`

### FT-AUTH-004: Account Deactivation
- **User Story**: As a user with a deactivated account, I should be prevented from accessing the CRM.
- **Workflow**: User with `isActive: false` → Redirected to `/login?error=account_deactivated`
- **Validation Points**:
  - Deactivated user cannot access any protected route
  - Appropriate error message shown

### FT-AUTH-005: Sign out
- **User Story**: As an authenticated user, I want to sign out securely.
- **Workflow**: Click "Sign Out" → Firebase auth cleared → Redirect to `/login`
- **Validation Points**:
  - Sign out button visible in sidebar and org hub dropdown
  - After sign out, user cannot access protected routes
  - Redirect to `/login`

### FT-AUTH-006: Forgot Password
- **User Story**: As a user who forgot my password, I want to reset it.
- **Workflow**: Click "Forgot password?" → Enter email → Firebase sends password reset email
- **Validation Points**:
  - Email field with validation
  - Success toast shown (even if email doesn't exist — security best practice)

---

## 3. Organization Management

### FT-ORG-001: Create Organization from Org Picker
- **User Story**: As an authenticated user, I want to create a new organization.
- **Workflow**: Navigate to `/org` → Click "New organization" → Dialog opens → Enter org name + slug → Create
- **Validation Points**:
  - "New organization" button visible
  - Dialog with org name and slug fields
  - Slug auto-generated from name
  - Slug can be manually edited
  - "Create" button disabled when name empty
  - Loading state during creation
  - Success toast "Workspace created!"
  - New org appears in the org list
  - Redirected to org dashboard
  - Error toast on duplicate slug

### FT-ORG-002: Switch Between Organizations
- **User Story**: As a user belonging to multiple orgs, I want to switch between them.
- **Workflow**: Click workspace switcher in sidebar → Select different org → Navigate to that org's dashboard
- **Validation Points**:
  - Workspace switcher shows current org name
  - Dropdown lists all user's orgs
  - Current org marked with checkmark
  - Selecting different org navigates to `/org/{orgId}/dashboard`

### FT-ORG-003: Org Picker — List and Search
- **User Story**: As a user, I want to see all my organizations and search through them.
- **Workflow**: Navigate to `/org` → View orgs in grid or list view → Search by name
- **Validation Points**:
  - Grid and list view toggle works
  - Search filters orgs by name
  - Empty state when no orgs → "No organizations yet" with create button
  - Search with no results → "No organizations match your search"
  - Loading spinner during fetch
  - Each org card shows name, slug, plan badge

### FT-ORG-004: Access Denied for Non-Members
- **User Story**: As a user, I should not be able to access an organization I'm not a member of.
- **Workflow**: Navigate to `/org/{orgId}/dashboard` where user is not a member → "You do not have access to this workspace." error
- **Validation Points**:
  - Error message displayed
  - "Back to Organizations" button present
  - Non-existent org → "This organization could not be found."

---

## 4. Team Invitation & Management

### FT-TEAM-001: Invite Team Member via Link
- **User Story**: As an admin, I want to generate an invite link so my team members can join the organization.
- **Workflow**: Navigate to `/org/{orgId}/users` → Click "Add Team Member" → Generate invite link
- **Validation Points**:
  - "Add Team Member" button only visible to admin
  - Invite link generated with role selection
  - Link has 7-day expiry
  - Link is copyable

### FT-TEAM-002: Accept Invite via Link
- **User Story**: As a user receiving an invite, I want to accept it and join the organization.
- **Workflow**: Open invite link → If not authenticated → Sign in or create account → Accept invite → Become member
- **Validation Points**:
  - Invite verification page shows org name, role, expiry
  - Invalid/expired/used invite → "Invite Invalid" error
  - New user signing up via invite gets `role: team` (not admin)
  - Existing user accepting → Added to org with specified role
  - Already a member → "You are already a member" → Redirect to org
  - Success → "You're in!" → Redirect to `/org`

### FT-TEAM-003: View Team Members
- **User Story**: As an admin/manager, I want to see all members of my organization.
- **Workflow**: Navigate to `/org/{orgId}/users` → View member list
- **Validation Points**:
  - Table shows name, email, role, status, join date
  - Admin/manager can see "Edit" button for editable members
  - Team members cannot see the users page? (sidebar only shows for admin/manager)
  - Current user marked with "(you)"
  - Empty state when no members

### FT-TEAM-004: Edit Member Role & Permissions
- **User Story**: As an admin, I want to change a team member's role or permissions.
- **Workflow**: Click "Edit" on a member → Change role or permissions → Save
- **Validation Points**:
  - Admin can edit any member except themselves
  - Manager can only edit team members (not admins or other managers)
  - Role change updates member's permissions to role defaults
  - Granular permission editing available

### FT-TEAM-005: Remove Team Member
- **User Story**: As an admin, I want to remove a team member from the organization.
- **Workflow**: Click "Edit" → Remove member → Member status set to "suspended"
- **Validation Points**:
  - Member is soft-deleted (status: suspended)
  - Member no longer appears in active members list

---

## 5. Lead Management

### FT-LEAD-001: Create a Lead
- **User Story**: As a sales user, I want to add a new lead to track a potential sale.
- **Workflow**: Navigate to `/org/{orgId}/leads` → Click "Add Lead" → Dialog opens → Fill form → Submit
- **Validation Points**:
  - "Add Lead" button visible in header
  - Dialog with fields: First Name*, Last Name*, Email*, Phone, Company, Job Title, Status*, Source*, Value, Notes
  - Required fields marked with *
  - Status defaults to "New", Source defaults to "Website"
  - Form validation prevents submission with missing required fields
  - Success toast "Lead created successfully!"
  - Dialog closes and lead list refreshes
  - New lead appears in the list on the first page (sorted by newest first)

### FT-LEAD-002: View Lead List
- **User Story**: As a user, I want to see all my leads in a table.
- **Workflow**: Navigate to `/org/{orgId}/leads`
- **Validation Points**:
  - Table shows: Name, Email, Company, Status, Source, Value, Created, Actions
  - Pagination (10 per page) with Previous/Next buttons
  - "Showing X to Y of Z leads" indicator
  - Search by name, email, company, phone, job title
  - Filter by Status (New, Contacted, Follow Up, Qualified, Lost)
  - Filter by Source (Website, Referral, Ads, Cold Call, Other)
  - Empty state: "No leads found" with create button
  - Loading spinner during fetch
  - Financial values hidden for team role (shown as "$•••")

### FT-LEAD-003: View Lead Detail
- **User Story**: As a user, I want to see full details of a lead.
- **Workflow**: Click "Eye" icon on a lead → Navigate to `/org/{orgId}/leads/{id}`
- **Validation Points**:
  - Shows: Email, Phone, Company, Job Title, Source, Value, Last Contacted, Notes, Tags
  - AI Score section (if available)
  - Status badge displayed
  - Record details: Created, Updated, Owner
  - Update Status dropdown (if user has edit permission)
  - Convert Lead section (if not already converted)
  - Delete button (admin/manager only)
  - "Back to Leads" button

### FT-LEAD-004: Update Lead Status
- **User Story**: As a user, I want to update a lead's status as I progress through the sales process.
- **Workflow**: On lead detail page → Select new status from dropdown
- **Validation Points**:
  - Status options: New, Contacted, Follow Up, Qualified, Lost
  - Status updates immediately
  - Success toast "Status updated"
  - Only editable by admin, manager, or owner

### FT-LEAD-005: Delete a Lead
- **User Story**: As an admin/manager, I want to delete a lead that is no longer relevant.
- **Workflow**: On lead detail page → Click "Delete" → Confirm dialog → Lead deleted
- **Validation Points**:
  - Delete button only visible to admin/manager
  - Confirmation dialog: "Delete this lead? This action cannot be undone."
  - On confirm → Lead permanently deleted (hard delete)
  - Redirected to leads list
  - Success toast "Lead deleted"

### FT-LEAD-006: Convert Lead to Contact
- **User Story**: As a user, I want to convert a qualified lead into a contact.
- **Workflow**: On lead detail page → Click "Convert to Contact" → Confirm → Contact created
- **Validation Points**:
  - "Convert to Contact" button visible if lead not already converted
  - Confirmation dialog
  - Contact created with lead's firstName, lastName, email, phone, company, jobTitle, notes
  - Lead marked as converted
  - "Already converted" banner shown on lead
  - View contact link navigates to the new contact
  - Success toast "Lead converted to contact"

### FT-LEAD-007: Convert Lead to Deal
- **User Story**: As a user, I want to convert a promising lead directly into a deal.
- **Workflow**: Click "Convert to Deal" → Confirm → Deal created in Pipeline stage
- **Validation Points**:
  - Deal created with title from lead's company name, value from lead's value
  - Lead marked as converted
  - View deal link navigates to the new deal
  - Success toast "Lead converted to deal"

### FT-LEAD-008: Convert Lead to Project
- **User Story**: As a user, I want to convert a lead directly into a project.
- **Workflow**: Click "Convert to Project" → Confirm → Project created
- **Validation Points**:
  - Project created with status "Planning", priority "Medium"
  - Lead value becomes project budget
  - Lead marked as converted
  - View project link navigates to the new project
  - Success toast "Lead converted to project"

### FT-LEAD-009: Converted Lead State
- **User Story**: As a user viewing a converted lead, I want to see what it was converted to.
- **Validation Points**:
  - Green banner: "This lead has been converted."
  - Clickable links to the converted entity (contact/deal/project)
  - Convert buttons replaced with "Lead already converted" message
  - Attempting to convert again → Error "Lead has already been converted..."

---

## 6. Contact Management

### FT-CONT-001: Create a Contact
- **User Story**: As a user, I want to add a contact to my CRM.
- **Workflow**: Navigate to `/org/{orgId}/contacts` → Click "Add Contact" → Fill form → Submit
- **Validation Points**:
  - Fields: First Name*, Last Name*, Email*, Phone, Company, Job Title, Notes
  - Success toast "Contact created successfully!"
  - Contact appears in list

### FT-CONT-002: View Contact List
- **User Story**: As a user, I want to see all my contacts.
- **Workflow**: Navigate to `/org/{orgId}/contacts`
- **Validation Points**:
  - Table: Name, Email, Phone, Company, Job Title, Created, Actions
  - Checkbox selection for bulk operations
  - Search by name, email, company, phone, job title
  - Pagination (10 per page)
  - Empty state with create button
  - "Import CSV" button for bulk import
  - "Email (N)" button when contacts selected for bulk email

### FT-CONT-003: Import Contacts from CSV
- **User Story**: As a user, I want to import contacts from a CSV file.
- **Workflow**: Click "Import CSV" → Upload CSV file → Parse and create contacts
- **Validation Points**:
  - File upload dialog
  - CSV rows parsed and contacts created
  - Success/failure counts reported
  - Invalid rows skipped with errors

### FT-CONT-004: Bulk Email Contacts
- **User Story**: As a user, I want to email multiple contacts at once.
- **Workflow**: Select contacts via checkboxes → Click "Email (N)" → Email compose modal opens with selected contacts
- **Validation Points**:
  - "Email (N)" button only appears when contacts selected
  - Email compose modal pre-filled with selected contacts
  - Bulk send works

---

## 7. Company Management

### FT-COMP-001: Create a Company
- **User Story**: As a user, I want to add a company/business account.
- **Workflow**: Navigate to `/org/{orgId}/companies` → Click "Add Company" → Fill form → Submit
- **Validation Points**:
  - Fields: Company Name*, Email, Domain, Industry, Phone, Description, Size, Annual Revenue, Notes, Address
  - Success toast
  - Company appears in list

### FT-COMP-002: View Company List
- **User Story**: As a user, I want to see all companies.
- **Workflow**: Navigate to `/org/{orgId}/companies`
- **Validation Points**:
  - Table: Name, Domain, Industry, Size, Revenue, Created, Actions
  - Search by name, domain, industry, email, phone
  - Pagination (10 per page)
  - Empty state with create button
  - Revenue hidden for team role

---

## 8. Deal Pipeline (Kanban)

### FT-DEAL-001: Create a Deal
- **User Story**: As a sales user, I want to create a deal to track an opportunity.
- **Workflow**: Navigate to `/org/{orgId}/deals` → Click "Add Deal" → Fill form → Submit
- **Validation Points**:
  - Fields: Title*, Stage*, Value*, Probability*, Close Date, Contacts, Company, Description, Notes
  - Stage defaults to "Pipeline"
  - Success toast
  - Deal appears in the Kanban board under the correct stage

### FT-DEAL-002: Kanban Board Display
- **User Story**: As a user, I want to see my deals organized by stage on a Kanban board.
- **Workflow**: Navigate to `/org/{orgId}/deals`
- **Validation Points**:
  - 6 columns: Pipeline, Follow Up, Schedule Service, Conversation, Won, Lost
  - Each column shows deal count and total value
  - Deal cards show: title, value, probability, company name
  - Value hidden for team role
  - Scrollable columns
  - Loading spinner during fetch

### FT-DEAL-003: Drag and Drop to Change Stage
- **User Story**: As a user, I want to drag a deal from one stage to another.
- **Workflow**: Drag deal card → Drop on target stage column → Stage updated
- **Validation Points**:
  - Deal cards are draggable (cursor: grab)
  - Drag overlay shows the deal card
  - Drop updates the stage immediately (optimistic UI)
  - Success toast "Deal moved to {stage}"
  - If no permission → "You don't have permission to move this deal"
  - Value filter and search filter work alongside Kanban

### FT-DEAL-004: View Deal Detail
- **User Story**: As a user, I want to see full details of a deal.
- **Workflow**: Click on a deal card → Navigate to `/org/{orgId}/deals/{id}`
- **Validation Points**:
  - Shows: Title, Value, Probability, Stage, Close Date, Contacts, Company, Description, Notes
  - Stage can be updated from detail page
  - Archive/Delete buttons for admin/manager
  - Back to Deals button

### FT-DEAL-005: Update Deal Stage from Detail
- **User Story**: As a user, I want to update a deal's stage from the detail page.
- **Workflow**: Select new stage from dropdown → Stage updated
- **Validation Points**:
  - Stage dropdown with all 6 options
  - Success toast
  - If stage changed to "Won" or "Lost" → notification sent to deal owner

### FT-DEAL-006: Archive a Deal
- **User Story**: As an admin/manager, I want to archive a deal instead of deleting it.
- **Workflow**: On deal detail → Click "Archive" → Deal archived
- **Validation Points**:
  - Archived deal hidden from default Kanban view
  - Can be unarchived

### FT-DEAL-007: Delete a Deal
- **User Story**: As an admin/manager, I want to permanently delete a deal.
- **Workflow**: Click "Delete" → Confirm → Deal deleted
- **Validation Points**:
  - Confirmation dialog
  - Hard delete from Firestore
  - Redirect to deals list

### FT-DEAL-008: Filter and Search Deals
- **User Story**: As a user, I want to filter deals by stage, value range, and search text.
- **Workflow**: Use search bar, stage filter, value filter on Kanban page
- **Validation Points**:
  - Search by title, company, description
  - Filter by stage (all or specific stage)
  - Filter by value range: Under $10k, $10k-$50k, $50k-$100k, $100k+
  - Value filter only visible to admin/manager
  - Active filter count shown
  - "Clear" button resets all filters

---

## 9. Project Management

### FT-PROJ-001: Create a Project
- **User Story**: As a user, I want to create a project to manage work for a client.
- **Workflow**: Navigate to `/org/{orgId}/projects` → Click "New Project" → Fill form → Submit
- **Validation Points**:
  - Fields: Name*, Description, Status, Priority, Start Date*, End Date, Financials, Budget, Company, Deal, Team Members
  - Success toast
  - Project appears in the project list

### FT-PROJ-002: View Project List
- **User Story**: As a user, I want to see all my projects.
- **Workflow**: Navigate to `/org/{orgId}/projects`
- **Validation Points**:
  - Cards showing: Name, Description, Status, Priority, Start/End Date, Company, Budget, Team size
  - Archived projects toggle
  - Status badges with colors: Planning (blue), Active (green), On Hold (yellow), Completed (gray), Cancelled (red)
  - Priority labels with colors
  - Budget hidden for team role
  - Empty state with create button

### FT-PROJ-003: View Active vs Archived Projects
- **User Story**: As a user, I want to toggle between active and archived projects.
- **Workflow**: Click "View Archived" → Shows archived projects → Click "View Active" → Back to active projects
- **Validation Points**:
  - Toggle button text changes between "View Archived" and "View Active"
  - Archived projects marked with "Archived" badge

### FT-PROJ-004: Project Detail
- **User Story**: As a user, I want to see full project details.
- **Workflow**: Click on a project card → Navigate to `/org/{orgId}/projects/{id}`
- **Validation Points**:
  - Shows all project fields, financials, team members, tasks
  - Status can be updated
  - Progress tracking

---

## 10. Task Management

### FT-TASK-001: Create a Task
- **User Story**: As a user, I want to create a task to track work items.
- **Workflow**: Navigate to `/org/{orgId}/tasks` → Click "New Task" → Fill form → Submit
- **Validation Points**:
  - Fields: Title*, Description, Status, Priority, Type, Due Date, Assignee, Project, Tags
  - Status defaults to "To Do"
  - Success toast
  - Task appears in the task board
  - If assignee different from creator → notification sent to assignee

### FT-TASK-002: View Task Board
- **User Story**: As a user, I want to see all tasks organized by status.
- **Workflow**: Navigate to `/org/{orgId}/tasks`
- **Validation Points**:
  - 4 columns: To Do, In Progress, Review, Done
  - Each column shows task count
  - Task cards: title, type badge, priority, due date, project, assignee
  - Calendar view toggle
  - List view toggle (default)
  - Empty state with create button

### FT-TASK-003: Task Detail Sheet
- **User Story**: As a user, I want to view and edit a task's details.
- **Workflow**: Click on a task card → Slide-out sheet opens with task details
- **Validation Points**:
  - Sheet shows all task fields
  - Status, priority, assignee can be updated
  - Changes auto-saved

### FT-TASK-004: AI Priority for Tasks
- **User Story**: As a user, I want AI to prioritize my tasks.
- **Workflow**: Click "AI Priority" button → AI analyzes tasks → Tasks sorted by priority with reasoning
- **Validation Points**:
  - "AI Priority" button toggles between normal and AI-sorted view
  - AI-sorted view shows suggested priority and reasoning for each task
  - Loading state during AI analysis

### FT-TASK-005: Task Filters
- **User Story**: As a user, I want to filter tasks by various criteria.
- **Workflow**: Use filter bar → Select user role, date range, priorities, statuses
- **Validation Points**:
  - Filter by user role: all, assigned, created, associated
  - Filter by date range (due date)
  - Multi-select filter by priority
  - Multi-select filter by status
  - "Clear Filters" button

### FT-TASK-006: View Archived Tasks
- **User Story**: As a user, I want to see archived (completed) tasks.
- **Workflow**: Click "View Archived" → Archived tasks dialog opens
- **Validation Points**:
  - Only tasks with status "Done" can be archived
  - Archived tasks shown in separate dialog

### FT-TASK-007: Calendar View
- **User Story**: As a user, I want to see my tasks on a calendar.
- **Workflow**: Toggle to "Calendar" view → Tasks shown on calendar by due date
- **Validation Points**:
  - Calendar view shows tasks on their due dates
  - Clicking a task on calendar opens its detail sheet

---

## 11. Invoice Management

### FT-INV-001: Create Invoice (Draft)
- **User Story**: As an admin/manager, I want to create an invoice for a client.
- **Workflow**: Navigate to `/org/{orgId}/invoices` → Click "New Invoice" → Fill Details tab → Fill Line Items tab → Fill Settings tab → Click "Save Draft"
- **Validation Points**:
  - "New Invoice" button only visible to admin/manager (or role with invoice permissions)
  - Three tabs: Details, Line Items, Settings
  - **Details tab**: Invoice number, Client name*, Client email, Billing/shipping address, Issue date*, Due date*, Payment terms, Currency, Links to Deal/Project
  - **Line Items tab**: Description*, Quantity*, Price*, Total (auto-calc), Tax rate, Add/remove line items
  - **Settings tab**: Notes, Terms, Recurring settings
  - **Bottom bar**: Live subtotal, tax rate input, discount input, total (auto-calculated)
  - Subtotal = sum of (qty × price)
  - Tax Amount = subtotal × (taxRate / 100)
  - Total = subtotal + taxAmount - discount
  - Invoice number auto-generated server-side
  - "Save Draft" saves with status "Draft"
  - Success toast "Invoice created successfully!"
  - Redirected to invoice detail page

### FT-INV-002: Create and Send Invoice
- **User Story**: As an admin/manager, I want to create an invoice and send it to the client immediately.
- **Workflow**: Fill invoice form → Click "Create & Send" → Invoice created with status "Sent" → Email sent with PDF
- **Validation Points**:
  - "Create & Send" button creates invoice and sends email
  - Invoice status set to "Sent" (not "Draft")
  - PDF generated and attached to email
  - Email sent to client email address
  - If email fails → Warning toast "Invoice created but email failed"
  - Success toast "Invoice created and sent successfully!"

### FT-INV-003: View Invoice List
- **User Story**: As a user, I want to see all invoices.
- **Workflow**: Navigate to `/org/{orgId}/invoices`
- **Validation Points**:
  - **Stats cards**: Total Revenue, Outstanding, Overdue count, Draft count
  - Revenue and Outstanding hidden for team role
  - Table: Invoice #, Client, Issue Date, Due Date, Amount, Status
  - Status badges: Draft (gray), Sent (blue), Paid (green), Overdue (red), Cancelled (gray)
  - Amount hidden for team role
  - Empty state with create button (only for admin/manager)
  - "Settings" button for invoice configuration

### FT-INV-004: Invoice Settings
- **User Story**: As a user, I want to configure my invoice defaults.
- **Workflow**: Click "Settings" → Modal opens → Configure template, company info, prefix, payment details
- **Validation Points**:
  - Settings modal with invoice configuration options
  - Template selection (standard, professional, creative)
  - Company name, from name, from email
  - Logo upload
  - Color theme
  - Invoice prefix and next number
  - Bank account details, UPI, GSTIN

### FT-INV-005: View Invoice Detail
- **User Story**: As a user, I want to see full invoice details.
- **Workflow**: Click an invoice → Navigate to `/org/{orgId}/invoices/{id}`
- **Validation Points**:
  - Shows invoice number, status, client info, line items, calculations
  - Download PDF button
  - Send email button
  - Status update: Mark as Sent, Paid, Overdue, Cancelled

### FT-INV-006: Update Invoice Status
- **User Story**: As a user, I want to update an invoice's status.
- **Workflow**: On invoice detail → Change status → Status updated
- **Validation Points**:
  - Status options: Draft, Sent, Paid, Overdue, Cancelled
  - Marking as "Paid" → Enter paid date
  - If status changed to "Paid" → Notification sent to invoice owner
  - Success toast

---

## 12. Quotes / Proposals

### FT-QUOTE-001: Create a Proposal
- **User Story**: As an admin/manager, I want to create a professional proposal/quote.
- **Workflow**: Navigate to `/org/{orgId}/quotes` → Click "New Proposal" → Multi-step dialog → Fill client details → Fill scope & pricing → Fill terms → Create
- **Validation Points**:
  - "New Proposal" button only visible to admin/manager
  - **Step 1 — Client & Details**: Company name, Contact name, Contact email, Issue date, Valid until, Executive Summary (AI-assisted)
  - **Step 2 — Scope & Pricing**: Line items (description, qty, unit price, tax%), subtotal, tax, discount, total (auto-calculated), Internal notes
  - **Step 3 — Terms & Summary**: Payment terms, Proposal summary
  - Quote number auto-generated
  - Live calculations throughout
  - AI textarea for executive summary and terms
  - Success toast "Proposal created"
  - Proposal appears in the list

### FT-QUOTE-002: View Proposal List
- **User Story**: As a user, I want to see all proposals.
- **Workflow**: Navigate to `/org/{orgId}/quotes`
- **Validation Points**:
  - **Stats cards**: Total Proposals, Accepted Value, Awaiting Response, Win Rate
  - Table: Proposal #, Client, Status, Value, Issue Date, Expiry
  - Status badges: Draft, Sent, Accepted, Rejected, Expired
  - Search by proposal number, company, contact
  - Filter by status
  - Pagination
  - Empty state with create button

### FT-QUOTE-003: Edit/Delete Proposal
- **User Story**: As an admin/manager, I want to edit or delete a proposal.
- **Workflow**: Click "Edit" on a proposal → Update fields → Save
- **Validation Points**:
  - Edit button in dropdown menu
  - Delete button in dropdown menu with confirmation
  - Success toasts

---

## 13. Email Communication

### FT-EMAIL-001: Send Email from Contacts
- **User Story**: As a user, I want to send an email to a contact.
- **Workflow**: From contacts list → Select contact(s) → Click "Email (N)" → Compose modal → Send
- **Validation Points**:
  - Email compose modal opens with recipients pre-filled
  - Fields: To, CC, BCC, Subject, Body (rich text editor), Attachments
  - Template selector
  - Merge field dropdown
  - AI email assistant (assist, rewrite, sentiment)
  - Tracking options: track opens, track clicks
  - Schedule send option
  - Save draft option
  - Send button triggers email sending

### FT-EMAIL-002: Email from Deal/Contact/Company Context
- **User Story**: As a user, I want to send an email related to a specific CRM entity.
- **Workflow**: From any entity detail page → Open email compose → Context pre-filled
- **Validation Points**: Context includes entity-specific merge fields

### FT-EMAIL-003: Email Templates
- **User Story**: As a user, I want to use email templates for consistency.
- **Workflow**: In email compose → Click "Templates" → Select a template → Content pre-filled
- **Validation Points**:
  - Templates available by category
  - Template content fills subject and body
  - Merge fields resolved in templates

---

## 14. Notes

### FT-NOTE-001: Create a Note
- **User Story**: As a user, I want to capture quick notes.
- **Workflow**: Navigate to `/org/{orgId}/notes` → Click "Add Note" → Dialog → Write content → Create
- **Validation Points**:
  - "Add Note" button visible
  - Dialog with textarea
  - "Create" button disabled when empty
  - Success toast "Note created"
  - Note appears in the notes grid

### FT-NOTE-002: Pin/Unpin Notes
- **User Story**: As a user, I want to pin important notes.
- **Workflow**: Click "Pin" on a note → Note moves to pinned section
- **Validation Points**:
  - Pinned notes shown in separate "Pinned" section at top
  - Unpin moves note back to "All Notes" section
  - Pinned notes have a highlighted border

### FT-NOTE-003: Edit/Delete Notes
- **User Story**: As a user, I want to edit or delete my notes.
- **Workflow**: Click "..." menu → Edit or Delete
- **Validation Points**:
  - Edit opens dialog with existing content
  - Delete with confirmation
  - Only owner or admin can manage a note

---

## 15. Dashboard

### FT-DASH-001: Dashboard Overview
- **User Story**: As a user, I want to see a summary of my CRM data.
- **Workflow**: Navigate to `/org/{orgId}/dashboard`
- **Validation Points**:
  - Welcome message with user's name
  - Quick stats cards: Total Leads, Active Deals, Companies, Revenue, Active Projects, Pending Tasks
  - Each card links to its respective module
  - Revenue hidden for team role (shown as "$•••" with lock icon)
  - AI Smart Follow-ups section
  - Upcoming Tasks section (next 5 tasks sorted by due date)
  - Quick Actions: Add Lead, Create Deal, New Project, Create Invoice (admin/manager only)
  - Loading spinner during data fetch

### FT-DASH-002: Dashboard — Smart Follow-ups
- **User Story**: As a user, I want AI-powered follow-up suggestions.
- **Workflow**: Dashboard loads → Smart Follow-ups component shows suggestions
- **Validation Points**:
  - Component shows AI-generated follow-up suggestions
  - Based on pending tasks, stale leads, etc.

### FT-DASH-003: Dashboard — Upcoming Tasks
- **User Story**: As a user, I want to see my upcoming tasks on the dashboard.
- **Validation Points**:
  - Shows up to 5 tasks sorted by due date (ascending)
  - Task title, priority badge, due date
  - Overdue tasks highlighted in red
  - Due today tasks highlighted in orange
  - "View All Tasks" link navigates to tasks page

---

## 16. Settings & Profile

### FT-SETT-001: Appearance Settings
- **User Story**: As a user, I want to switch between light and dark themes.
- **Workflow**: Navigate to `/org/{orgId}/settings` → Click "Light" or "Dark" or "System"
- **Validation Points**:
  - Theme buttons: Light, Dark, System
  - Theme changes immediately
  - System option follows OS preference

### FT-SETT-002: Edit Profile
- **User Story**: As a user, I want to update my display name.
- **Workflow**: Click "Edit Profile" → Update name → Save
- **Validation Points**:
  - Display name editable
  - Email is read-only
  - Success toast "Profile updated successfully"

### FT-SETT-003: Notification Preferences
- **User Story**: As a user, I want to configure my notification preferences.
- **Workflow**: Click "Configure Notifications" → Toggle email notifications, task reminders, weekly summary → Save
- **Validation Points**:
  - Preferences saved to localStorage
  - API fallback attempt to save server-side

### FT-SETT-004: Default Currency
- **User Story**: As a user, I want to set my default currency.
- **Workflow**: Click "Change Currency" → Select from list → Save
- **Validation Points**:
  - Currency options: USD, EUR, GBP, CAD, AUD, JPY, CHF, INR
  - Saved to localStorage
  - Selection shown with checkmark

---

## 17. Lead Conversion Workflow

### FT-CONV-001: Full Lead-to-Contact-to-Deal-to-Project Flow
- **User Story**: As a user, I want to follow a lead through the complete lifecycle.
- **Workflow**: 
  1. Create lead (New)
  2. Contact lead (status → Contacted)
  3. Follow up (status → Follow Up)
  4. Qualify lead (status → Qualified)
  5. Convert lead to Contact
  6. Create Deal from lead
  7. Move deal through stages: Pipeline → Follow Up → Schedule Service → Conversation → Won
  8. Create Project from Won deal
  9. Add tasks to project
  10. Complete project
- **Validation Points**:
  - Each step is possible from the UI
  - Data is preserved across conversions
  - Activities logged at each step
  - Redirection to the new entity after conversion

---

## 18. Deal-to-Project Workflow

### FT-DP-001: Create Project from Won Deal
- **User Story**: As a user, I want to create a project from a won deal.
- **Workflow**: Deal marked as "Won" → Navigate to deal detail → Create Project → Project created with deal data
- **Validation Points**:
  - Project name: "Project: {deal title}"
  - Project budget: deal value
  - Project references the deal
  - Activities logged on both entities

---

## 19. SMTP Integration

### FT-SMTP-001: Configure Custom SMTP
- **User Story**: As an admin, I want to configure custom email sending for my organization.
- **Workflow**: Navigate to `/org/{orgId}/integrations/smtp` → Select provider or custom → Fill host, port, user, password → Save
- **Validation Points**:
  - Provider presets: Gmail, Outlook, Yahoo, Zoho, Custom
  - Presets auto-fill host and port
  - SSL/TLS toggle
  - App password field with security note
  - "Save Configuration" button
  - Success/error toast
  - Redirect to integrations page

### FT-SMTP-002: View Existing SMTP Config
- **User Story**: As an admin, I want to see my existing SMTP configuration.
- **Workflow**: Navigate to SMTP settings → Existing config loaded
- **Validation Points**:
  - Existing host, port, user, provider loaded
  - Password masked

---

## 20. AI Features

### FT-AI-001: AI Textarea for Notes
- **User Story**: As a user, I want AI assistance when writing notes and content.
- **Workflow**: In any AI textarea → Type content → AI suggestions appear
- **Validation Points**:
  - AI textarea present in lead notes, quote executive summary, quote terms
  - Context-aware suggestions based on the module

### FT-AI-002: AI Email Assistant
- **User Story**: As a user, I want AI to help compose, rewrite, and analyze email sentiment.
- **Workflow**: In email compose → Open AI assistant → Use assist, rewrite, or sentiment features
- **Validation Points**:
  - AI Assist: Generates email content based on context
  - AI Rewrite: Rewrites existing text
  - AI Sentiment: Analyzes email tone

### FT-AI-003: AI Task Priority
- **User Story**: As a user, I want AI to prioritize my tasks.
- **Workflow**: On tasks page → Click "AI Priority" → Tasks sorted by AI priority
- **Validation Points**:
  - AI analyzes tasks and assigns priority suggestions
  - Each task shows suggested priority and reasoning
  - Toggle between normal and AI-sorted view

### FT-AI-004: AI Lead Scoring
- **User Story**: As a user, I want AI to score my leads.
- **Workflow**: On lead detail → AI Score section shows score and reasoning
- **Validation Points**:
  - AI qualification score (0-100) displayed
  - Progress bar visualization
  - AI reasoning points listed

### FT-AI-005: AI Deal Insights
- **User Story**: As a user, I want AI insights on my deals.
- **Workflow**: From deals → AI analysis available
- **Validation Points**:
  - AI-generated insights on deal progression

### FT-AI-006: AI Report Insights
- **User Story**: As a user, I want AI-generated executive summaries for reports.
- **Workflow**: Navigate to reports → AI Executive Summary component
- **Validation Points**:
  - AI generates summary of CRM data
  - Revenue forecast visualization