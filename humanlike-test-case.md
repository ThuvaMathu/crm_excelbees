# Human-Like End-to-End Test Cases — RCRM by ExcelBees

> One instruction per line. No code. No selectors. No implementation details.
> AI Browser Agent must execute line-by-line like a human.

---

## Table of Contents

1. [Authentication & Session](#1-authentication--session)
2. [Registration & Onboarding](#2-registration--onboarding)
3. [Organization Management](#3-organization-management)
4. [Invite System](#4-invite-system)
5. [Team & User Management](#5-team--user-management)
6. [Lead Management](#6-lead-management)
7. [Contact Management](#7-contact-management)
8. [Company Management](#8-company-management)
9. [Deal Pipeline (Kanban)](#9-deal-pipeline-kanban)
10. [Project Management](#10-project-management)
11. [Task Management](#11-task-management)
12. [Invoice Management](#12-invoice-management)
13. [Quotes & Proposals](#13-quotes--proposals)
14. [Email Communication](#14-email-communication)
15. [Notes](#15-notes)
16. [Dashboard](#16-dashboard)
17. [Reports & Analytics](#17-reports--analytics)
18. [Settings & Profile](#18-settings--profile)
19. [Integrations](#19-integrations)
20. [AI Features](#20-ai-features)
21. [Permissions & RBAC](#21-permissions--rbac)
22. [Navigation & Browser Behavior](#22-navigation--browser-behavior)
23. [Validation & Edge Cases](#23-validation--edge-cases)
24. [Security](#24-security)
25. [Error Recovery](#25-error-recovery)
26. [Human Behavior & Mistakes](#26-human-behavior--mistakes)
27. [Known Bug Regression Tests](#27-known-bug-regression-tests)
28. [Cross-Organization Isolation](#28-cross-organization-isolation)
29. [Activity Timeline](#29-activity-timeline)
30. [Notifications](#30-notifications)
31. [Command Palette Search](#31-command-palette-search)

---

## 1. Authentication & Session

### 1.1 Login with Email and Password

Open browser
Navigate to CRM login page
Wait for page to load
Verify logo is visible
Verify "Sign In" button is visible
Verify "Forgot password?" link is visible
Verify "Create account" link is visible
Verify "Continue with Google" button is visible
Verify "Back to Home" link is visible
Enter valid email address in email field
Enter valid password in password field
Click "Sign In" button
Wait for redirect
Verify "Welcome back!" toast notification appears
Verify URL contains /org
Take Screenshot
Generate Report

### 1.2 Login with Invalid Credentials

Navigate to login page
Enter invalid email format
Verify inline validation error appears
Enter correct email format
Enter wrong password
Click "Sign In" button
Verify "Invalid email or password" error message appears
Take Screenshot
Generate Report

### 1.3 Login with Non-Existent Email

Navigate to login page
Enter email that does not exist
Enter any password
Click "Sign In" button
Verify "Invalid email or password" error message appears
Take Screenshot
Generate Report

### 1.4 Login with Empty Fields

Navigate to login page
Leave email field empty
Leave password field empty
Click "Sign In" button
Verify validation error appears for email field
Verify validation error appears for password field
Take Screenshot
Generate Report

### 1.5 Login with Google OAuth

Navigate to login page
Click "Continue with Google" button
Wait for Google popup to appear
Select a Google account
Wait for authentication to complete
Verify redirect to /org or /onboarding
Take Screenshot
Generate Report

### 1.6 Login with Google when Popup Blocked

Navigate to login page
Click "Continue with Google" button
Deny popup when browser requests permission
Verify no error toast appears
Verify user remains on login page
Take Screenshot
Generate Report

### 1.7 Login with Google as New User

Click "Continue with Google" button
Select a Google account that has never signed up
Wait for account creation
Verify "Account created! Let's set up your workspace." toast appears
Verify redirect to /onboarding
Take Screenshot
Generate Report

### 1.8 Login with Google as Returning User

Click "Continue with Google" button
Select a Google account that already has an account
Wait for login
Verify "Welcome back!" toast appears
Verify redirect to /org
Take Screenshot
Generate Report

### 1.9 Too Many Login Attempts

Navigate to login page
Enter a valid email
Enter wrong password repeatedly more than 5 times
After 5 failed attempts, try again
Verify "Too many attempts. Try again later." error message appears
Take Screenshot
Generate Report

### 1.10 Network Error During Login

Disconnect internet connection
Navigate to login page
Enter valid email and password
Click "Sign In" button
Verify "Network error. Check your connection." error message appears
Reconnect internet connection
Take Screenshot
Generate Report

### 1.11 Already Authenticated User Visiting Login

Log in as valid user
Navigate to /login URL directly
Verify redirect to /org immediately
Verify login form is not shown
Take Screenshot
Generate Report

### 1.12 Session Persistence Across Tabs

Log in as valid user
Open a new browser tab
Navigate to /org URL in the new tab
Verify user is still authenticated
Verify no login prompt appears
Take Screenshot
Generate Report

### 1.13 Session Expiry

Log in as valid user
Wait for Firebase session to expire
Perform any action on a protected page
Verify redirect to login page
Take Screenshot
Generate Report

### 1.14 Logout

Log in as valid user
Click user avatar in sidebar
Click "Sign Out" option
Verify Firebase auth session cleared
Verify redirect to /login page
Try to navigate to /org
Verify redirect back to /login
Take Screenshot
Generate Report

### 1.15 Logout and Use Back Button

Log in as valid user
Sign out
Click browser back button
Verify user is not re-authenticated
Verify login page is shown
Take Screenshot
Generate Report

### 1.16 Forgot Password Flow

Navigate to login page
Click "Forgot password?" link
Verify redirect to forgot password page
Enter a registered email address
Click "Send Reset Link" button
Verify success toast appears regardless of email existence
Verify redirect to login page
Take Screenshot
Generate Report

### 1.17 Forgot Password with Invalid Email

Navigate to forgot password page
Enter an invalid email format
Verify validation error appears
Take Screenshot
Generate Report

### 1.18 First Login Password Change

Create a new user with email and password provider with isFirstLogin flag set to true
Log in as that user
Verify redirect to /change-password page
Verify user cannot navigate to /org
Enter new password meeting requirements
Enter confirm password matching new password
Click "Change Password" button
Verify redirect to /onboarding or /org
Verify isFirstLogin flag is set to false
Take Screenshot
Generate Report

### 1.19 First Login Password Change with Mismatched Passwords

Log in as first-login user
Navigate to change password page
Enter new password
Enter different password in confirm field
Click "Change Password" button
Verify validation error about password mismatch
Take Screenshot
Generate Report

### 1.20 Account Deactivated User

Deactivate a user account in Firestore
Log in as that user
Verify redirect to /login with account_deactivated error message
Verify user cannot access any protected route
Take Screenshot
Generate Report

### 1.21 Auth Loading State

Log out completely
Clear browser cache
Reload the application
Verify "Initializing CRM..." spinner appears during auth check
Wait for auth check to complete
Verify spinner disappears after check
Take Screenshot
Generate Report

---

## 2. Registration & Onboarding

### 2.1 Register with Email and Password

Navigate to signup page
Enter full name (minimum 2 characters)
Enter valid email not in use
Enter password with at least 8 characters, uppercase, lowercase, and number
Enter matching confirm password
Click "Create Account" button
Wait for account creation
Verify "Account created! Let's set up your workspace." toast appears
Verify redirect to /onboarding
Take Screenshot
Generate Report

### 2.2 Register with Email Already in Use

Navigate to signup page
Enter name
Enter email that already has an account
Enter password
Enter confirm password
Click "Create Account" button
Verify "An account with this email already exists." error message appears
Take Screenshot
Generate Report

### 2.3 Register with Weak Password

Navigate to signup page
Enter name
Enter valid email
Enter password shorter than 8 characters
Enter matching confirm password
Click "Create Account" button
Verify validation error about password length
Try password without uppercase letter
Verify validation error about uppercase requirement
Try password without lowercase letter
Verify validation error about lowercase requirement
Try password without number
Verify validation error about number requirement
Take Screenshot
Generate Report

### 2.4 Register with Password Mismatch

Navigate to signup page
Enter name
Enter valid email
Enter valid password
Enter different password in confirm field
Click "Create Account" button
Verify validation error about passwords not matching
Take Screenshot
Generate Report

### 2.5 Register with Google

Navigate to signup page
Click "Continue with Google" button
Select a Google account
Verify account created for new users
Verify redirect to /onboarding
Take Screenshot
Generate Report

### 2.6 Register with Empty Name

Navigate to signup page
Leave name field empty
Enter valid email and password
Click "Create Account" button
Verify validation error for name field
Take Screenshot
Generate Report

### 2.7 Onboarding — Profile Step

Complete registration as a new user
Wait for redirect to /onboarding
Verify Step 1 "Your Profile" is shown
Verify First Name field is visible
Verify Last Name field is visible
Verify Phone Number field is visible
Verify Job Title field is visible
Verify "Continue" button is disabled initially
Enter First Name
Enter Phone Number
Enter Job Title
Verify "Continue" button becomes enabled
Click "Continue" button
Wait for profile save
Verify profile step completes
Take Screenshot
Generate Report

### 2.8 Onboarding — Google User Pre-filled Profile

Register with Google as a new user
Wait for onboarding
Verify First Name is pre-filled from Google display name
Verify Last Name is pre-filled from Google display name
Take Screenshot
Generate Report

### 2.9 Onboarding — Skip Profile with Empty Required Fields

Reach onboarding profile step
Leave First Name empty
Enter Phone and Position
Click "Continue" button
Verify button remains disabled or validation error appears
Take Screenshot
Generate Report

### 2.10 Onboarding — Workspace Creation

Complete profile step on onboarding
Verify Step 2 "Your Workspace" is shown
Enter Organization Name
Verify workspace URL slug is auto-generated from name
Manually edit the slug
Click "Create Workspace" button
Wait for creation
Verify org document created in Firestore
Verify admin membership created
Verify isOnboarded set to true
Verify redirect to /org
Take Screenshot
Generate Report

### 2.11 Onboarding — Empty Organization Name

Reach workspace step in onboarding
Leave Organization Name empty
Click "Create Workspace" button
Verify button is disabled
Take Screenshot
Generate Report

### 2.12 Onboarding — Duplicate Slug

Reach workspace step
Enter organization name that generates a duplicate slug
Click "Create Workspace" button
Verify error about duplicate slug appears
Take Screenshot
Generate Report

### 2.13 Onboarding — Back Button from Workspace Step

Reach workspace step in onboarding
Click "Back" button
Verify return to profile step
Verify profile data is preserved
Take Screenshot
Generate Report

### 2.14 Onboarding — User Already in Org Skips Workspace

Ensure user belongs to at least one organization
Set isOnboarded to false for that user
Log in as that user
Navigate to /onboarding
Complete profile step
Verify workspace step is skipped because user already has orgs
Verify isOnboarded set to true
Verify redirect to /org
Take Screenshot
Generate Report

### 2.15 Onboarding Interrupted Mid-Way

Begin onboarding as new user
Complete profile step
Close browser tab before creating workspace
Open new tab and log in again
Verify redirect to /onboarding
Verify user can continue from profile step or workspace step
Take Screenshot
Generate Report

### 2.16 Already Onboarded User Cannot Access Onboarding

Log in as an already onboarded user
Navigate to /onboarding URL directly
Verify redirect to /org
Take Screenshot
Generate Report

---

## 3. Organization Management

### 3.1 View Org Picker

Log in as a user belonging to at least one organization
Wait for /org page to load
Verify organization list is displayed
Verify each org shows name and slug
Verify "FREE" plan badge is visible
Verify "New organization" button is visible
Take Screenshot
Generate Report

### 3.2 Org Picker — No Organizations

Log in as a new user with no organizations
Navigate to /org
Verify "No organizations yet" empty state message
Verify "Create Organization" button is visible
Take Screenshot
Generate Report

### 3.3 Org Picker — Grid and List View Toggle

Navigate to /org with multiple organizations
Verify grid view is default
Click list view toggle
Verify list view is displayed
Click grid view toggle
Verify grid view is restored
Take Screenshot
Generate Report

### 3.4 Org Picker — Search Organizations

Navigate to /org with multiple organizations
Type an organization name in search bar
Verify list filters to matching organizations
Clear search
Verify all organizations shown again
Search for a name that doesn't match any org
Verify "No organizations match your search" message
Take Screenshot
Generate Report

### 3.5 Org Picker — Loading State

Log out
Clear cache
Log in and navigate to /org
Verify loading spinner is shown during fetch
Wait for data to load
Verify spinner disappears
Take Screenshot
Generate Report

### 3.6 Create Organization from Org Picker

Navigate to /org
Click "New organization" button
Verify dialog opens with Organization Name and Workspace URL fields
Enter organization name
Verify slug auto-generates
Edit slug manually
Click "Create" button
Wait for creation
Verify "Workspace created!" toast notification
Verify new org appears in org list
Verify redirect to new org dashboard
Take Screenshot
Generate Report

### 3.7 Create Organization with Empty Name

Navigate to /org
Click "New organization" button
Leave organization name empty
Verify "Create" button is disabled
Take Screenshot
Generate Report

### 3.8 Create Organization with Duplicate Slug

Create an organization with a specific slug
Create another organization
Try to use the same slug
Verify error toast about duplicate slug
Take Screenshot
Generate Report

### 3.9 Switch Between Organizations

Log in as user belonging to multiple organizations
Click workspace switcher in sidebar
Verify dropdown lists all user's organizations
Verify current org is marked with checkmark
Select a different organization
Verify navigation to that org's dashboard
Verify sidebar updates with new org's context
Take Screenshot
Generate Report

### 3.10 Access Denied for Non-Member

Log in as a user
Navigate to /org/{orgId}/dashboard where user is not a member
Verify "You do not have access to this workspace." error message
Verify "Back to Organizations" button is present
Click "Back to Organizations" button
Verify redirect to /org
Take Screenshot
Generate Report

### 3.11 Non-Existent Organization

Navigate to /org/{nonExistentOrgId}/dashboard
Verify "This organization could not be found." error message
Verify "Back to Organizations" button is present
Take Screenshot
Generate Report

### 3.12 Organization Settings Page (User-Level)

Navigate to /org/{orgId}/settings
Verify Appearance section with Light/Dark/System theme buttons
Verify Account section with Edit Profile button
Verify Notifications section with toggle options
Verify Preferences section with currency selector
Take Screenshot
Generate Report

### 3.13 Organization Settings — Theme Switching

Navigate to org settings
Click "Dark" theme button
Verify UI switches to dark mode
Click "Light" theme button
Verify UI switches to light mode
Click "System" theme button
Verify UI follows OS preference
Refresh page
Verify theme preference is persisted
Take Screenshot
Generate Report

### 3.14 Organization Settings — Currency Selection

Navigate to org settings
Click "Change Currency" button
Select USD from currency list
Verify selection shown with checkmark
Refresh page
Verify USD is still selected
Take Screenshot
Generate Report

### 3.15 Organization Settings — Notification Preferences

Navigate to org settings
Toggle email notifications off
Refresh page
Verify preference is persisted in localStorage
Take Screenshot
Generate Report

### 3.16 Organization Settings — Edit Profile

Navigate to org settings
Click "Edit Profile" button
Verify dialog opens
Verify name is editable
Verify email is read-only
Update display name
Click "Save" button
Verify "Profile updated successfully" toast
Verify window reloads
Take Screenshot
Generate Report

---

## 4. Invite System

### 4.1 Create Invite Link as Admin

Log in as admin of an organization
Navigate to /org/{orgId}/users
Click "Add Team Member" button
Select "Generate Invite Link" option
Select role (team or manager)
Click "Generate" button
Verify invite link is generated
Verify link is copyable
Verify expiry date is shown (7 days)
Take Screenshot
Generate Report

### 4.2 Create Invite Link as Team Member

Log in as team member
Navigate to /org/{orgId}/users
Verify "Add Team Member" button is not visible
Take Screenshot
Generate Report

### 4.3 Accept Invite as New User

Copy invite link from admin
Open incognito/private browser window
Navigate to invite link
Verify invite page shows organization name, role, and expiry
Verify "Accept Invite" button is visible
Click "Accept Invite"
If not authenticated, sign up or log in
Complete authentication
Verify "You're in!" success message
Verify redirect to /org
Verify new organization appears in org list
Navigate to that organization's dashboard
Verify user has the specified role
Take Screenshot
Generate Report

### 4.4 Accept Invite as Existing User

Generate an invite link as admin
Log in as a different existing user
Navigate to invite link
Verify invite details are shown
Click "Accept Invite"
Verify user is added to organization with specified role
Verify success message
Take Screenshot
Generate Report

### 4.5 Accept Invite Already Member

Generate an invite link
Log in as a user who is already a member of that organization
Navigate to invite link
Verify "You are already a member of this organization." message
Verify redirect to org dashboard
Take Screenshot
Generate Report

### 4.6 Accept Expired Invite

Create an invite link with a past expiry date
Navigate to invite link
Verify "This invite link has expired." error message
Take Screenshot
Generate Report

### 4.7 Accept Used Invite

Create an invite link
Accept the invite as a user
Try to accept the same invite link again
Verify "This invite link has already been used." error message
Take Screenshot
Generate Report

### 4.8 Accept Invalid Invite Token

Navigate to /invite/InvalidToken123
Verify "Invite link not found." error message
Take Screenshot
Generate Report

### 4.9 Invite with Admin Role

Create invite link as admin
Verify role options are "team" and "manager" only
Verify "admin" role is not available for invites
Take Screenshot
Generate Report

### 4.10 Invite Link Auto-Expires After 7 Days

Create invite link
Verify expiryDate is set to 7 days from creation
Take Screenshot
Generate Report

---

## 5. Team & User Management

### 5.1 View Team Members as Admin

Log in as admin
Navigate to /org/{orgId}/users
Verify member table is displayed
Verify table shows name, email, role, status, join date
Verify current user is marked with "(you)"
Verify "Edit" button is visible for each member
Verify "Add Team Member" button is visible
Take Screenshot
Generate Report

### 5.2 View Team Members as Team Member

Log in as team member
Verify sidebar does not show Team / Users link
Navigate directly to /org/{orgId}/users
Verify access denied or redirect
Take Screenshot
Generate Report

### 5.3 Edit Member Role as Admin

Navigate to team management
Click "Edit" on a team member
Verify Member Permissions modal opens
Change role from "team" to "manager"
Click "Save" button
Verify success toast
Verify member's role updates in the table
Take Screenshot
Generate Report

### 5.4 Edit Member Permissions Granularly

Navigate to team management
Click "Edit" on a team member
In the permissions section, toggle various permissions
Set leads.read to false
Set leads.create to true
Set deals.editAll to true
Click "Save" button
Verify success toast
Take Screenshot
Generate Report

### 5.5 Admin Cannot Edit Self

Navigate to team management
Click "Edit" on own user (current admin)
Verify save is prevented or restricted
Take Screenshot
Generate Report

### 5.6 Manager Can Only Edit Team Members

Log in as manager
Navigate to team management
Click "Edit" on a team member
Verify modal opens and is editable
Click "Edit" on an admin or another manager
Verify modal shows restricted or edit is not allowed
Take Screenshot
Generate Report

### 5.7 Manager Cannot Elevate Role to Admin

Log in as manager
Edit a team member
Try to change role to "admin"
Verify admin role option is not available
Take Screenshot
Generate Report

### 5.8 Manager Cannot Enable User Management

Log in as manager
Edit a team member's permissions
Verify "User Management" feature toggle is not visible or disabled
Take Screenshot
Generate Report

### 5.9 Reset Permissions to Defaults

Edit a team member's permissions
Toggle some permissions off
Click "Reset to defaults" button
Verify permissions revert to role defaults
Click "Save"
Verify changes applied
Take Screenshot
Generate Report

### 5.10 Remove Team Member (Suspend)

Navigate to team management as admin
Click "Edit" on a team member
Click "Remove Member" option
Confirm removal
Verify member status changes to "suspended"
Verify member no longer appears in active members list
Take Screenshot
Generate Report

### 5.11 Suspended Member Cannot Access Org

Log out
Try to log in as the suspended member
Navigate to org dashboard
Verify access denied to org
Take Screenshot
Generate Report

### 5.12 Permission Changes Reflect in Real-Time

Log in as admin on one browser
Log in as a team member on another browser
As admin, edit the team member's permissions
Remove leads.read permission
Save changes
On the team member's browser, observe the sidebar
Verify Leads link disappears from sidebar without page refresh
Take Screenshot
Generate Report

---

## 6. Lead Management

### 6.1 Create a Lead

Log in as a user with lead create permission
Navigate to /org/{orgId}/leads
Click "Add Lead" button
Verify dialog opens
Enter First Name
Enter Last Name
Enter Email
Select Status as "New"
Select Source as "Website"
Enter Optional Company Name
Enter Optional Estimated Value
Click "Create" button
Verify "Lead created successfully!" toast notification
Verify dialog closes
Verify lead list refreshes
Verify new lead appears at the top of the list
Take Screenshot
Generate Report

### 6.2 Create Lead with Required Fields Only

Navigate to leads page
Click "Add Lead"
Enter only required fields: First Name, Last Name, Email, Status, Source
Click "Create" button
Verify lead created successfully
Take Screenshot
Generate Report

### 6.3 Create Lead with Missing Required Fields

Click "Add Lead"
Leave First Name empty
Leave Last Name empty
Leave Email empty
Click "Create" button
Verify validation errors on required fields
Take Screenshot
Generate Report

### 6.4 Create Lead with Invalid Email

Click "Add Lead"
Enter invalid email format
Click "Create" button
Verify validation error on email field
Take Screenshot
Generate Report

### 6.5 Create Lead with Negative Value

Click "Add Lead"
Enter negative number in Value field
Click "Create" button
Verify validation error or value is rejected
Take Screenshot
Generate Report

### 6.6 View Lead List

Navigate to /org/{orgId}/leads
Verify table shows: Name, Email, Company, Status badge, Source, Value, Created date, Actions
Verify pagination controls are present
Verify "Showing X to Y of Z leads" indicator
Verify search bar is present
Verify Status filter dropdown is present
Verify Source filter dropdown is present
Take Screenshot
Generate Report

### 6.7 Lead List — Empty State

Navigate to leads page in an org with no leads
Verify "No leads found" empty state message
Verify "Add Lead" button is visible in empty state
Take Screenshot
Generate Report

### 6.8 Lead List — Search by Name

Navigate to leads page with multiple leads
Type a lead's first name in search bar
Click Search button
Verify table filters to matching leads
Clear search
Verify all leads shown again
Take Screenshot
Generate Report

### 6.9 Lead List — Filter by Status

Navigate to leads page
Select "Qualified" from Status filter
Verify only qualified leads are shown
Select "All"
Verify all leads shown again
Take Screenshot
Generate Report

### 6.10 Lead List — Filter by Source

Navigate to leads page
Select "Referral" from Source filter
Verify only referral leads are shown
Select "All"
Verify all leads shown again
Take Screenshot
Generate Report

### 6.11 Lead List — Pagination

Create more than 10 leads
Navigate to leads page
Verify first page shows 10 leads
Click "Next" button
Verify page 2 shows remaining leads
Click "Previous" button
Verify return to page 1
Verify "Showing X to Y of Z leads" indicator updates
Take Screenshot
Generate Report

### 6.12 Lead List — Value Hidden for Team Role

Log in as team member
Navigate to leads page
Verify Value column shows "$•••" for all leads
Take Screenshot
Generate Report

### 6.13 Lead List — Value Visible for Admin/Manager

Log in as admin or manager
Navigate to leads page
Verify actual dollar values are visible in Value column
Take Screenshot
Generate Report

### 6.14 View Lead Detail

Navigate to leads page
Click "Eye" icon on a lead
Verify redirect to /org/{orgId}/leads/{id}
Verify Lead Information card shows: Email (mailto link), Phone, Company, Job Title, Source, Value
Verify Status badge is displayed
Verify Record Details shows: Created date, Updated date, Owner
Verify "Back to Leads" button is present
Take Screenshot
Generate Report

### 6.15 Update Lead Status

Navigate to lead detail page
Find "Update Status" dropdown
Select "Contacted" status
Verify status updates immediately
Verify success toast "Status updated"
Take Screenshot
Generate Report

### 6.16 Lead Detail — No Edit Button (Known Issue)

Navigate to lead detail page
Verify there is NO "Edit" button for editing lead name, email, phone, etc.
Verify only status can be changed
Take Screenshot
Generate Report

### 6.17 Convert Lead to Contact

Navigate to lead detail page for a non-converted lead
Click "Convert to Contact" button
Verify confirmation dialog appears
Confirm conversion
Verify "Lead converted to contact" success toast
Verify redirect to new contact page
Verify contact fields are pre-filled from lead data
Take Screenshot
Generate Report

### 6.18 Convert Lead to Deal

Navigate to lead detail page for a non-converted lead
Click "Convert to Deal" button
Confirm conversion
Verify "Lead converted to deal" success toast
Verify redirect to new deal page
Verify deal is created in Pipeline stage
Verify deal value matches lead value
Take Screenshot
Generate Report

### 6.19 Convert Lead to Project

Navigate to lead detail page for a non-converted lead
Click "Convert to Project" button
Confirm conversion
Verify "Lead converted to project" success toast
Verify redirect to new project page
Verify project status is "Planning"
Verify project budget matches lead value
Take Screenshot
Generate Report

### 6.20 Converted Lead Shows Already Converted Banner

Convert a lead to a contact
Navigate back to the lead detail page
Verify green banner: "This lead has been converted."
Verify clickable link to the converted contact
Verify convert buttons are replaced with "Lead already converted" message
Take Screenshot
Generate Report

### 6.21 Attempt to Convert Already Converted Lead

Navigate to already converted lead detail page
Try to click any convert button
Verify buttons are not visible or show "Lead already converted"
Take Screenshot
Generate Report

### 6.22 Delete Lead as Admin

Navigate to lead detail page as admin
Click "Delete" button
Verify confirmation dialog: "Delete this lead? This action cannot be undone."
Confirm deletion
Verify redirect to leads list
Verify "Lead deleted" success toast
Verify lead no longer appears in list
Take Screenshot
Generate Report

### 6.23 Delete Lead as Team Member

Log in as team member
Navigate to lead detail page
Verify Delete button is NOT visible
Take Screenshot
Generate Report

### 6.24 Lead Detail — Value $0 Not Displayed (Known Bug)

Create a lead with value set to 0
Navigate to that lead's detail page
Verify the value field is NOT hidden (value $0 should display)
If value field is missing, this is a known bug
Take Screenshot
Generate Report

### 6.25 Lead AI Score Display (If Available)

Navigate to a lead detail page
Verify AI Score card appears (if aiScore exists)
Verify score out of 100 is displayed
Verify progress bar visualization
Verify reasoning bullets are listed
Take Screenshot
Generate Report

---

## 7. Contact Management

### 7.1 Create a Contact

Navigate to /org/{orgId}/contacts
Click "Add Contact" button
Verify dialog opens
Enter First Name
Enter Last Name
Enter Email
Click "Create" button
Verify "Contact created successfully!" toast
Verify contact appears in list
Take Screenshot
Generate Report

### 7.2 Create Contact with All Fields

Click "Add Contact"
Enter First Name, Last Name, Email
Enter Phone
Select or Enter Company
Enter Job Title
Enter Notes
Click "Create" button
Verify contact created with all fields
Take Screenshot
Generate Report

### 7.3 Create Contact with Missing Required Fields

Click "Add Contact"
Leave First Name empty
Leave Last Name empty
Leave Email empty
Click "Create" button
Verify validation errors on required fields
Take Screenshot
Generate Report

### 7.4 View Contact List

Navigate to /org/{orgId}/contacts
Verify table shows: Name, Email, Phone, Company, Job Title, Created, Actions
Verify checkboxes for bulk selection are present
Verify "Import CSV" button is present
Verify "Add Contact" button is present
Verify search bar is present
Verify pagination is present
Take Screenshot
Generate Report

### 7.5 Contact List — Search

Navigate to contacts page
Type a contact name in search bar
Click Search
Verify matching contacts are shown
Clear search
Verify all contacts shown
Take Screenshot
Generate Report

### 7.6 Contact List — Empty State

Navigate to contacts page in an org with no contacts
Verify "No contacts found" empty state with create button
Take Screenshot
Generate Report

### 7.7 View Contact Detail

Click "Eye" icon on a contact
Verify redirect to /org/{orgId}/contacts/{id}
Verify Contact Information card: Email (mailto link), Phone (tel link), Company, Job Title
Verify Edit button is visible if user has edit permission
Verify Delete button is visible if user has delete permission
Verify Quick Actions: Send Email, Call, Convert to Lead
Verify Record Details: Created, Updated, Owner
Verify "Back to Contacts" button
Take Screenshot
Generate Report

### 7.8 Edit Contact

Navigate to contact detail page
Click "Edit" button
Verify EditContactDialog opens with pre-filled data
Update First Name
Click "Save"
Verify success toast
Verify updated name is displayed
Take Screenshot
Generate Report

### 7.9 Delete Contact

Navigate to contact detail page
Click "Delete" button
Confirm deletion
Verify success toast
Verify redirect to contacts list
Verify contact no longer appears
Take Screenshot
Generate Report

### 7.10 Convert Contact to Lead

Navigate to contact detail page
Click "Convert to Lead" button
Confirm conversion
Verify redirect to new lead detail page
Verify lead status is "New"
Verify lead source is "Other"
Take Screenshot
Generate Report

### 7.11 Import Contacts from CSV

Navigate to contacts page
Click "Import CSV" button
Select a CSV file with contact data
Click "Upload" button
Wait for import to complete
Verify success/failure counts are reported
Verify new contacts appear in list
Take Screenshot
Generate Report

### 7.12 Import CSV with Invalid Rows

Prepare CSV with some valid and some invalid rows
Import the CSV
Verify valid rows are created
Verify invalid rows are skipped with error messages
Take Screenshot
Generate Report

### 7.13 Bulk Email Contacts

Navigate to contacts page
Select multiple contacts using checkboxes
Verify "Email (N)" button appears with count
Click "Email (N)" button
Verify email compose modal opens
Verify selected contacts are pre-filled as recipients
Take Screenshot
Generate Report

### 7.14 Contact Detail — No Deal Creation Option

Navigate to contact detail page
Verify there is NO "Create Deal" quick action
Take Screenshot
Generate Report

---

## 8. Company Management

### 8.1 Create a Company

Navigate to /org/{orgId}/companies
Click "Add Company" button
Enter Company Name
Click "Create" button
Verify "Company created successfully!" toast
Verify company appears in list
Take Screenshot
Generate Report

### 8.2 Create Company with All Fields

Click "Add Company"
Enter Company Name, Email, Domain, Industry, Phone, Description
Select Company Size
Enter Annual Revenue
Enter Notes
Enter Billing Address fields
Click "Create" button
Verify company created with all fields
Take Screenshot
Generate Report

### 8.3 Create Company with Missing Name

Click "Add Company"
Leave Company Name empty
Click "Create" button
Verify validation error on name field
Take Screenshot
Generate Report

### 8.4 View Company List

Navigate to /org/{orgId}/companies
Verify table shows: Name, Domain, Industry, Size, Revenue, Created, Actions
Verify search bar is present
Verify "Add Company" button is present
Verify pagination is present
Take Screenshot
Generate Report

### 8.5 Company List — Revenue Hidden for Team

Log in as team member
Navigate to companies page
Verify Revenue column shows "$•••"
Take Screenshot
Generate Report

### 8.6 View Company Detail

Click "Eye" icon on a company
Verify Company Information card: Domain (external link), Email, Phone, Industry, Size, Revenue
Verify Description card
Verify Addresses card (billing + shipping)
Verify Associated Contacts card (linked contacts)
Verify Record Details: Created, Updated, Owner
Verify Edit and Delete buttons based on permissions
Take Screenshot
Generate Report

### 8.7 Edit Company

Navigate to company detail page
Click "Edit" button
Update company name
Click "Save"
Verify success toast
Verify updated name
Take Screenshot
Generate Report

### 8.8 Delete Company

Navigate to company detail page
Click "Delete" button
Confirm deletion
Verify success toast
Verify redirect to company list
Take Screenshot
Generate Report

### 8.9 Company Detail — Associated Contacts

Navigate to company detail page with associated contacts
Verify contacts are listed under "Associated Contacts"
Click a contact name
Verify navigation to that contact's detail page
Take Screenshot
Generate Report

---

## 9. Deal Pipeline (Kanban)

### 9.1 Create a Deal

Navigate to /org/{orgId}/deals
Click "Add Deal" button
Enter Title
Enter Value
Enter Probability (default 50)
Click "Create" button
Verify "Deal created successfully!" toast
Verify deal appears in Kanban board under Pipeline stage
Take Screenshot
Generate Report

### 9.2 Create Deal with All Fields

Click "Add Deal"
Enter Title, Stage, Value, Probability
Select Expected Close Date
Select a Company
Enter Description
Enter Notes
Click "Create" button
Verify deal created with all fields
Take Screenshot
Generate Report

### 9.3 Create Deal with Missing Required Fields

Click "Add Deal"
Leave Title empty
Leave Value empty
Click "Create" button
Verify validation errors on required fields
Take Screenshot
Generate Report

### 9.4 View Kanban Board

Navigate to /org/{orgId}/deals
Verify 6 columns: Pipeline, Follow Up, Schedule Service, Conversation, Won, Lost
Verify each column shows stage name and deal count
Verify each deal card shows: title, value, probability, company name
Verify search bar is present
Verify filter toggle is present
Take Screenshot
Generate Report

### 9.5 Kanban — Empty Stage

Navigate to deals page with no deals in specific stages
Verify empty stages still exist with stage header and count (0)
Take Screenshot
Generate Report

### 9.6 Drag and Drop Deal to Different Stage

Drag a deal card from Pipeline column
Drop it on Follow Up column
Verify deal moves to Follow Up stage
Verify success toast "Deal moved to Follow Up"
Verify column counts update
Take Screenshot
Generate Report

### 9.7 Drag and Drop Without Permission

Log in as user without edit permission on deals
Navigate to Kanban board
Attempt to drag a deal card
Verify card is NOT draggable or lock icon is shown
Verify permission denied message
Take Screenshot
Generate Report

### 9.8 View Deal Detail

Click on a deal card
Verify redirect to /org/{orgId}/deals/{id}
Verify Deal Overview card: Value, Probability, Company, Expected Close
Verify Stage badge is displayed
Verify Edit button based on permission
Verify Delete/Archive buttons based on permission
Verify "Back to Deals" button
Take Screenshot
Generate Report

### 9.9 Update Deal Stage from Detail Page

Navigate to deal detail page
Find Pipeline Stage dropdown
Select "Follow Up"
Verify stage updates immediately
Verify success toast
Take Screenshot
Generate Report

### 9.10 Deal Won Notification

Change a deal stage to "Won"
Verify notification is created for deal owner
Verify "Deal moved to Won" success toast
Verify "Create Project" button appears on deal detail (if canEdit)
Take Screenshot
Generate Report

### 9.11 Deal Lost Notification

Change a deal stage to "Lost"
Verify notification is created for deal owner
Take Screenshot
Generate Report

### 9.12 Archive a Deal

Navigate to deal detail page
Click "Archive" button
Confirm archival
Verify success toast
Verify deal is hidden from default Kanban view
Take Screenshot
Generate Report

### 9.13 Delete a Deal

Navigate to deal detail page
Click "Delete" button
Verify confirmation dialog
Confirm deletion
Verify success toast
Verify redirect to deals list
Take Screenshot
Generate Report

### 9.14 Filter Deals by Stage

Navigate to Kanban board
Select a specific stage from filter
Verify only deals in that stage are shown
Clear filter
Verify all stages shown again
Take Screenshot
Generate Report

### 9.15 Filter Deals by Value Range

Log in as admin/manager
Navigate to Kanban board
Select a value range filter (e.g., Under $10k)
Verify only deals within that value range are shown
Clear filter
Take Screenshot
Generate Report

### 9.16 Value Filter Hidden for Team

Log in as team member
Navigate to Kanban board
Verify value range filter is NOT visible
Take Screenshot
Generate Report

### 9.17 Search Deals

Navigate to Kanban board
Type a deal title in search bar
Press Enter
Verify only matching deals are shown
Clear search
Take Screenshot
Generate Report

### 9.18 Create Project from Won Deal

Navigate to a deal with stage "Won"
Click "Create Project" button
Confirm creation
Verify "Project created from deal" success toast
Verify redirect to new project page
Verify project name is "Project: {deal title}"
Verify project budget matches deal value
Take Screenshot
Generate Report

### 9.19 Edit Deal

Navigate to deal detail page
Click "Edit" button
Update deal title and value
Click "Save"
Verify success toast
Verify updated values are displayed
Take Screenshot
Generate Report

---

## 10. Project Management

### 10.1 Create a Project

Navigate to /org/{orgId}/projects
Click "New Project" button
Enter Project Name
Select Status
Select Priority
Select Start Date
Click "Create" button
Verify "Project created successfully!" toast
Verify project appears in list
Take Screenshot
Generate Report

### 10.2 Create Project with All Fields

Click "New Project"
Enter Name, Description, Status, Priority
Enter Start Date and End Date
Enter Budget
Select Company, Deal, Team Members
Click "Create" button
Verify project created with all fields
Take Screenshot
Generate Report

### 10.3 Create Project with Missing Name

Click "New Project"
Leave Name empty
Click "Create" button
Verify validation error on name field
Take Screenshot
Generate Report

### 10.4 View Project List

Navigate to /org/{orgId}/projects
Verify cards grid shows: Name, Description, Status badge, Priority label, Start/End date, Company, Budget, Team size
Verify "View Archived" toggle is present
Verify "New Project" button is present based on permission
Verify empty state with create button when no projects
Take Screenshot
Generate Report

### 10.5 Project List — Status Badges

Verify projects show correct color badges: Planning (blue), Active (green), On Hold (yellow), Completed (gray), Cancelled (red)
Take Screenshot
Generate Report

### 10.6 Project List — Budget Hidden for Team

Log in as team member
Navigate to projects page
Verify Budget is hidden or shown as "$•••"
Take Screenshot
Generate Report

### 10.7 Toggle Archived Projects

Navigate to projects page
Click "View Archived" toggle
Verify archived projects shown with "Archived" badge
Click "View Active" toggle
Verify active projects shown again
Take Screenshot
Generate Report

### 10.8 View Project Detail

Click on a project card
Verify redirect to /org/{orgId}/projects/{id}
Verify Project Details card: Start Date, End Date, Company, Team Members, Budget
Verify Status and Priority badges
Verify Description card
Verify Edit and Delete buttons based on permissions
Verify "Back to Projects" button
Take Screenshot
Generate Report

### 10.9 Update Project Status

Navigate to project detail page
Change project status
Verify status updates
Verify success toast
Take Screenshot
Generate Report

### 10.10 Edit Project

Navigate to project detail page
Click "Edit" button
Update project name
Click "Save"
Verify success toast
Verify updated name
Take Screenshot
Generate Report

### 10.11 Archive a Project

Navigate to project detail page
Click "Archive" button
Verify project archived
Verify success toast
Verify redirect to projects list
Take Screenshot
Generate Report

### 10.12 Delete a Project

Navigate to project detail page
Click "Delete" button
Confirm deletion
Verify success toast
Verify redirect to projects list
Take Screenshot
Generate Report

---

## 11. Task Management

### 11.1 Create a Task

Navigate to /org/{orgId}/tasks
Click "New Task" button
Enter Title
Click "Create" button
Verify "Task created successfully!" toast
Verify task appears in task board under To Do column
Take Screenshot
Generate Report

### 11.2 Create Task with All Fields

Click "New Task"
Enter Title, Description
Select Status, Priority, Type
Select Due Date
Select Assignee
Select Project
Enter Tags
Click "Create" button
Verify task created with all fields
Take Screenshot
Generate Report

### 11.3 Create Task with Missing Title

Click "New Task"
Leave Title empty
Click "Create" button
Verify validation error on title field
Take Screenshot
Generate Report

### 11.4 View Task Board (List View)

Navigate to /org/{orgId}/tasks
Verify 4 columns: To Do, In Progress, Review, Done
Verify each column shows task count
Verify task cards show: Title, Type badge, Priority, Due date, Project, Assignee
Verify "New Task" button is present
Verify "AI Priority" button is present
Verify "View Archived" button is present
Verify List/Calendar view toggle is present
Take Screenshot
Generate Report

### 11.5 View Task Board (Calendar View)

Navigate to tasks page
Toggle to "Calendar" view
Verify tasks shown on calendar by due date
Click a task on calendar
Verify task detail sheet opens
Take Screenshot
Generate Report

### 11.6 Task Detail Sheet

Click on a task card
Verify slide-out sheet opens with task details
Verify status, priority, assignee can be updated
Verify changes auto-save
Close the sheet
Take Screenshot
Generate Report

### 11.7 Filter Tasks by User Role

Navigate to tasks page
Use filter: user role = "assigned"
Verify only tasks assigned to current user are shown
Change to "created"
Verify only tasks created by current user are shown
Change to "all"
Verify all tasks are shown
Take Screenshot
Generate Report

### 11.8 Filter Tasks by Date Range

Navigate to tasks page
Set a date range filter for due date
Click "Apply" button
Verify only tasks within date range are shown
Click "Clear Filters" button
Verify all tasks shown again
Take Screenshot
Generate Report

### 11.9 Filter Tasks by Priority and Status

Navigate to tasks page
Select multiple priorities
Select multiple statuses
Click "Apply" button
Verify tasks matching all selected filters are shown
Take Screenshot
Generate Report

### 11.10 AI Task Priority Sort

Navigate to tasks page with multiple tasks
Click "AI Priority" button
Verify tasks reorder by AI-suggested priority
Verify each task shows AI priority badge and reasoning
Click "AI Priority" again to toggle off
Verify tasks return to normal order
Take Screenshot
Generate Report

### 11.11 View Archived Tasks

Click "View Archived" button
Verify dialog opens with archived tasks
Verify only tasks with status "Done" can be archived
Click a task to view detail
Close dialog
Take Screenshot
Generate Report

### 11.12 Archive a Task

Change a task status to "Done"
Click "Archive" on that task
Verify task is archived
Verify success toast
Verify task no longer appears in active board
Take Screenshot
Generate Report

### 11.13 Attempt to Archive Non-Done Task

Attempt to archive a task that is not in "Done" status
Verify error message: "Only completed tasks (Done) can be archived"
Take Screenshot
Generate Report

### 11.14 Task Assignment Notification

Create a task with an assignee different from the creator
Verify notification is created for the assignee
Take Screenshot
Generate Report

### 11.15 Update Task Status

Open a task detail sheet
Change status from "To Do" to "In Progress"
Verify status updates
Change to "Done"
Verify completedAt timestamp is set
Take Screenshot
Generate Report

---

## 12. Invoice Management

### 12.1 Create Invoice as Draft

Log in as admin or manager
Navigate to /org/{orgId}/invoices
Click "New Invoice" button
Verify redirect to invoice create page
On Details tab, enter Client Name and Client Email
Select Issue Date and Due Date
Select Payment Terms
Switch to Line Items tab
Add a line item with Description, Quantity, Price
Verify total auto-calculates
Switch to Settings tab
Enter optional Notes and Terms
Switch back to Details tab
Click "Save Draft" button
Verify "Invoice created successfully!" toast
Verify redirect to invoice detail page
Verify invoice status is "Draft"
Take Screenshot
Generate Report

### 12.2 Create and Send Invoice

Navigate to create invoice page
Fill in Details tab with client info
Add line items
Click "Create & Send" button
Verify invoice created with status "Sent"
Verify email sent to client with PDF attachment
Verify success toast "Invoice created and sent successfully!"
Take Screenshot
Generate Report

### 12.3 Create Invoice with No Line Items

Navigate to create invoice page
Fill client info
Do NOT add any line items
Try to save
Verify error "At least one item is required"
Take Screenshot
Generate Report

### 12.4 Create Invoice with Empty Client Name

Navigate to create invoice page
Leave Client Name empty
Fill all other fields
Try to save
Verify validation error on client name
Take Screenshot
Generate Report

### 12.5 Invoice Auto-Calculations

Create an invoice with specific quantities and prices
Verify subtotal = sum of (qty x price)
Enter tax rate
Verify tax amount = subtotal x (taxRate / 100)
Enter discount
Verify total = subtotal + tax - discount
Take Screenshot
Generate Report

### 12.6 New Invoice Button Not Visible for Team

Log in as team member
Navigate to invoices page
Verify "New Invoice" button is NOT visible
Take Screenshot
Generate Report

### 12.7 View Invoice List

Navigate to /org/{orgId}/invoices
Verify stats cards: Total Revenue, Outstanding, Overdue Count, Draft Count
Verify table shows: Invoice #, Client, Issue Date, Due Date, Amount, Status badge
Verify status badges: Draft (gray), Sent (blue), Paid (green), Overdue (red), Cancelled (gray)
Verify "Settings" button is present for admin/manager
Take Screenshot
Generate Report

### 12.8 Invoice List — Revenue Hidden for Team

Log in as team member
Navigate to invoices page
Verify Total Revenue and Outstanding stats show "$•••"
Verify Amount column shows "$•••"
Take Screenshot
Generate Report

### 12.9 Invoice List — Empty State

Navigate to invoices page in an org with no invoices
Verify empty state message
Verify create button is visible based on permission
Take Screenshot
Generate Report

### 12.10 View Invoice Detail

Click on an invoice in the list
Verify invoice number and status badge
Verify Invoice Details: Issue Date, Due Date, Payment Terms, Currency
Verify Line Items table with Description, Qty, Price, Total
Verify Totals: Subtotal, Tax, Discount, Total
Verify Client sidebar: Company, Contact, Email, Billing Address
Verify PDF download button
Verify Email button
Verify Mark Paid button
Verify Edit button for draft invoices
Take Screenshot
Generate Report

### 12.11 Download Invoice PDF

Navigate to invoice detail page
Click "PDF" or "Download PDF" button
Verify PDF file is downloaded
Open PDF
Verify invoice data is displayed correctly: line items, totals, company info
Take Screenshot
Generate Report

### 12.12 Mark Invoice as Paid

Navigate to invoice detail page
Click "Mark Paid" button
Enter paid date if prompted
Verify status changes to "Paid"
Verify success toast
Verify notification sent to invoice owner
Take Screenshot
Generate Report

### 12.13 Send Invoice via Email from Detail

Navigate to invoice detail page
Click "Email" button
Verify InvoiceEmailComposeModal opens
Verify invoice PDF is attached
Click "Send" button
Verify email sent
If invoice was Draft, verify status changes to "Sent"
Take Screenshot
Generate Report

### 12.14 Edit Invoice

Navigate to invoice detail page for a Draft invoice
Click "Edit" button
Verify redirect to edit page
Update client name or line items
Click "Save" button
Verify success toast
Verify updated values on detail page
Take Screenshot
Generate Report

### 12.15 Invoice Settings

Navigate to invoices page
Click "Settings" button
Verify modal opens
Select a template
Enter Company Name and From Email
Upload a logo
Set Invoice Prefix and Next Number
Enter Bank Account details
Click "Save" button
Verify settings are saved
Take Screenshot
Generate Report

### 12.16 Invoice Number Auto-Generation

Create a new invoice
Verify invoice number is auto-generated
Note the invoice number
Create another invoice
Verify next invoice number is sequential
Take Screenshot
Generate Report

### 12.17 Invoice Status Transition: Sent to Overdue

Mark an invoice as "Sent"
Wait for due date to pass or manually update status
Verify invoice status changes to "Overdue"
Take Screenshot
Generate Report

### 12.18 Invoice Status: Cancel

Navigate to invoice detail page
Change status to "Cancelled"
Verify status updates
Verify success toast
Take Screenshot
Generate Report

---

## 13. Quotes & Proposals

### 13.1 Create a Proposal

Log in as admin or manager
Navigate to /org/{orgId}/quotes
Click "New Proposal" button
Verify multi-step dialog opens
Step 1: Enter Company Name, Contact Name, Issue Date, Valid Until
Click "Next" or proceed to Step 2
Step 2: Add line items with Description, Qty, Price, Tax %
Verify subtotal, tax, total auto-calculated
Click "Next" or proceed to Step 3
Step 3: Enter Payment Terms, review summary
Click "Create" button
Verify "Proposal created" success toast
Verify proposal appears in list
Take Screenshot
Generate Report

### 13.2 View Proposal List

Navigate to /org/{orgId}/quotes
Verify stats cards: Total Proposals, Accepted Value, Awaiting Response, Win Rate
Verify table: Proposal #, Client, Status badge, Value, Issue Date, Expiry
Verify status badges: Draft, Sent, Accepted, Rejected, Expired
Verify search bar and status filter
Verify pagination
Take Screenshot
Generate Report

### 13.3 Edit Proposal

Navigate to proposals list
Click "Edit" on a proposal
Update fields
Save
Verify success toast
Take Screenshot
Generate Report

### 13.4 Delete Proposal

Navigate to proposals list
Click "Delete" on a proposal
Confirm deletion
Verify success toast
Verify proposal removed from list
Take Screenshot
Generate Report

### 13.5 New Proposal Button Not Visible for Team

Log in as team member
Navigate to quotes page
Verify "New Proposal" button is not visible
Take Screenshot
Generate Report

---

## 14. Email Communication

### 14.1 Send Email from Contacts

Navigate to contacts page
Select one or more contacts
Click "Email (N)" button
Verify EmailComposeModal opens with recipients pre-filled
Enter Subject
Enter Body (using rich text editor)
Click "Send" button
Verify email is sent
Verify success message
Take Screenshot
Generate Report

### 14.2 Send Email with Merge Fields

Open email compose modal
Click "Insert Merge Field" dropdown
Select a merge field (e.g., contact.firstName)
Verify merge field token is inserted in body
Send the email
Verify merge field is resolved in the sent email
Take Screenshot
Generate Report

### 14.3 Use Email Template

Open email compose modal
Click "Templates" selector
Select an existing template
Verify subject and body are pre-filled with template content
Take Screenshot
Generate Report

### 14.4 Send Email with CC and BCC

Open email compose modal
Toggle CC field open
Enter CC recipient
Toggle BCC field open
Enter BCC recipient
Send email
Verify CC and BCC are included
Take Screenshot
Generate Report

### 14.5 Send Email with Attachments

Open email compose modal
Click attachment button
Select a file to attach
Verify attachment is listed
Send email
Verify attachment is included
Take Screenshot
Generate Report

### 14.6 Send Email with Large Attachments

Open email compose modal
Attach files exceeding total 25MB
Verify validation error about attachment size
Take Screenshot
Generate Report

### 14.7 Send Email with Empty Subject

Open email compose modal
Enter recipient
Leave subject empty
Enter body
Try to send
Verify validation error: subject is required
Take Screenshot
Generate Report

### 14.8 Send Email with Empty Body

Open email compose modal
Enter recipient and subject
Leave body empty
Try to send
Verify validation error: body is required
Take Screenshot
Generate Report

### 14.9 Save Email as Draft

Open email compose modal
Enter recipient, subject, body
Click "Save Draft" button
Verify email is saved as draft
Close modal
Navigate to email page
Open Drafts tab
Verify draft email appears
Take Screenshot
Generate Report

### 14.10 Send Draft Email

Navigate to email page
Open Drafts tab
Click "Send Now" on a draft
Verify email is sent
Verify draft removed from drafts
Take Screenshot
Generate Report

### 14.11 View Sent Emails

Navigate to /org/{orgId}/emails
Verify Sent tab shows sent emails with subject, To, date, status
Verify status badges
Verify action buttons (View, Delete)
Take Screenshot
Generate Report

### 14.12 Email Tracking — Opens

Send an email with "Track Opens" enabled
Open the sent email
Wait for tracking pixel to load
Verify email tracking shows open event
Take Screenshot
Generate Report

### 14.13 Email Tracking — Clicks

Send an email with "Track Clicks" enabled with a link
Click the link in the sent email
Verify click is tracked
Verify redirect to the original URL
Take Screenshot
Generate Report

### 14.14 Create Email Template

Navigate to email page
Open Templates tab
Click "New Template" button
Enter template name
Enter subject
Enter body (rich text)
Toggle Shared on/off
Click "Save" button
Verify template appears in list
Take Screenshot
Generate Report

### 14.15 Edit Email Template

Navigate to Templates tab
Click "Edit" on a template
Update fields
Save
Verify changes are saved
Take Screenshot
Generate Report

### 14.16 Delete Email Template

Navigate to Templates tab
Click "Delete" on a template
Confirm deletion
Verify template removed
Take Screenshot
Generate Report

### 14.17 AI Email Assist — Draft

Open email compose modal
Click AI Assistant button
Enter a prompt describing the email you want to write
Select tone (professional/friendly/urgent)
Click "Generate" button
Wait for AI to generate
Verify subject and body are populated with AI-generated content
Take Screenshot
Generate Report

### 14.18 AI Email Assist — Rewrite

Open email compose modal with existing body text
Click "Rewrite" button
Select a tone
Click "Rewrite" button
Wait for AI to rewrite
Verify text is rewritten in the selected tone
Take Screenshot
Generate Report

### 14.19 AI Email Assist — Sentiment Analysis

Open email compose modal with existing body text
Click "Sentiment" button
Wait for AI to analyze
Verify sentiment result is shown (positive/neutral/negative/mixed)
Take Screenshot
Generate Report

---

## 15. Notes

### 15.1 Create a Note

Navigate to /org/{orgId}/notes
Click "Add Note" button
Enter note content
Click "Create" button
Verify "Note created" success toast
Verify note appears in notes grid
Take Screenshot
Generate Report

### 15.2 Create Note with Empty Content

Click "Add Note" button
Leave content empty
Verify "Create" button is disabled
Take Screenshot
Generate Report

### 15.3 Pin a Note

Navigate to notes page
Click "Pin" icon on a note
Verify note moves to Pinned section at top
Verify pinned note has highlighted border
Take Screenshot
Generate Report

### 15.4 Unpin a Note

Navigate to Pinned section
Click "Unpin" on a pinned note
Verify note moves back to All Notes section
Take Screenshot
Generate Report

### 15.5 Edit a Note

Click "..." menu on a note
Select "Edit"
Verify dialog opens with existing content
Update content
Click "Save"
Verify note is updated
Take Screenshot
Generate Report

### 15.6 Delete a Note

Click "..." menu on a note
Select "Delete"
Confirm deletion
Verify note is removed
Verify success toast
Take Screenshot
Generate Report

### 15.7 Notes Search

Navigate to notes page with multiple notes
Type in search bar
Verify notes filter by content
Clear search
Verify all notes shown
Take Screenshot
Generate Report

---

## 16. Dashboard

### 16.1 View Dashboard

Log in as a user with data
Navigate to /org/{orgId}/dashboard
Verify Welcome message with user's name
Verify Quick Stats grid: Total Leads, Active Deals, Companies, Revenue, Active Projects, Pending Tasks
Verify each stat card links to its respective module
Verify AI Smart Follow-ups section
Verify Upcoming Tasks section (next 5 tasks sorted by due date)
Verify Quick Actions section
Take Screenshot
Generate Report

### 16.2 Dashboard — Revenue Hidden for Team

Log in as team member
Navigate to dashboard
Verify Revenue stat card shows "$•••" with lock icon
Take Screenshot
Generate Report

### 16.3 Dashboard — Revenue Visible for Admin/Manager

Log in as admin or manager
Navigate to dashboard
Verify Revenue stat card shows actual dollar amount
Take Screenshot
Generate Report

### 26.18 Dashboard — Create Invoice Hidden for Team

Log in as team member
Navigate to dashboard
Verify Quick Actions does NOT show "Create Invoice"
Take Screenshot
Generate Report

### 16.5 Dashboard — Create Invoice Visible for Admin/Manager

Log in as admin or manager
Navigate to dashboard
Verify Quick Actions shows "Create Invoice"
Take Screenshot
Generate Report

### 16.6 Dashboard — Upcoming Tasks Display

Navigate to dashboard with tasks assigned to you
Verify Upcoming Tasks section shows up to 5 tasks
Verify tasks are sorted by due date (ascending)
Verify overdue tasks are highlighted in red
Verify due today tasks are highlighted in orange
Verify "View All Tasks" link navigates to tasks page
Take Screenshot
Generate Report

### 16.7 Dashboard — Empty State for Tasks

Navigate to dashboard with no pending tasks
Verify Upcoming Tasks section shows "No upcoming tasks" or empty state
Take Screenshot
Generate Report

### 16.8 Dashboard — Loading State

Clear cache
Navigate to dashboard
Verify loading spinner is shown during data fetch
Wait for data load
Verify spinner disappears
Take Screenshot
Generate Report

### 16.9 Dashboard — Smart Follow-ups

Navigate to dashboard
Verify Smart Follow-ups component shows AI-generated suggestions
Verify suggestions are based on pending tasks, stale leads, etc.
Take Screenshot
Generate Report

### 16.10 Dashboard — Stats Link Navigation

Click on Total Leads stat card
Verify navigation to leads page
Click browser back button
Click on Active Deals stat card
Verify navigation to deals page
Take Screenshot
Generate Report

---

## 17. Reports & Analytics

### 17.1 View Reports Page

Log in as admin or manager
Navigate to /org/{orgId}/reports
Verify AI Executive Summary section
Verify Report Query Input
Verify Overview tab: Total Revenue, Active Pipeline, Total Leads, Churn Risk
Verify Revenue Forecast chart
Verify Recent Insights section
Take Screenshot
Generate Report

### 17.2 Reports — Team Role Access

Log in as team member
Navigate to /org/{orgId}/reports
Verify access is denied or restricted
Take Screenshot
Generate Report

### 17.3 Reports — Sales & Forecast Tab

Navigate to reports as admin/manager
Click "Sales & Forecast" tab
Verify Revenue Forecast chart is displayed
Take Screenshot
Generate Report

### 17.4 Reports — Leads Intelligence Tab

Navigate to reports
Click "Leads Intelligence" tab
Verify Total Leads, At Risk, Healthy Rate
Verify Scoring Matrix
Verify AI Recommendations
Take Screenshot
Generate Report

### 17.5 Reports — AI Executive Summary

Navigate to reports page
Wait for AI executive summary to load
Verify summary text is displayed
Verify insights list (positive/negative/warning)
Verify recommendations list
Take Screenshot
Generate Report

### 17.6 Reports — CSV Export

Navigate to reports page
Click "Export" or "Download CSV" button
Verify CSV file is downloaded
Open CSV
Verify monthly metrics and summary data
Take Screenshot
Generate Report

### 17.7 View Analytics Page

Log in as admin or manager
Navigate to /org/{orgId}/analytics
Verify RevenueChart (last 6 months)
Verify PipelineChart (deal count by stage)
Verify ActivityChart
Take Screenshot
Generate Report

### 17.8 Analytics — Team Role Access

Log in as team member
Navigate to /org/{orgId}/analytics
Verify "Financial Analytics Restricted" message
Take Screenshot
Generate Report

---

## 18. Settings & Profile

### 18.1 View Profile Page

Navigate to /org/{orgId}/profile
Verify Profile Picture section with avatar
Verify Personal Information: First Name, Last Name, Display Name, Email (read-only), Phone
Verify Account Info: Role, Status, Member Since
Verify "Save Changes" button
Take Screenshot
Generate Report

### 18.2 Update Profile Picture

Navigate to profile page
Click "Upload Photo" button
Select an image file under 5MB
Verify image uploads
Verify avatar updates
Take Screenshot
Generate Report

### 18.3 Upload Profile Picture Exceeding Limit

Navigate to profile page
Try to upload an image larger than 5MB
Verify validation error about file size
Take Screenshot
Generate Report

### 18.4 Update Personal Information

Navigate to profile page
Update First Name and Last Name
Enter Phone number
Click "Save Changes"
Verify "Profile updated successfully" toast
Verify fields reflect new values
Take Screenshot
Generate Report

### 18.5 Profile — Email is Read-Only

Navigate to profile page
Verify email field is not editable
Take Screenshot
Generate Report

### 18.6 Theme Settings

Navigate to /org/{orgId}/settings
Verify Appearance section
Click "Dark" theme
Verify UI switches to dark mode
Click "Light" theme
Verify UI switches to light mode
Take Screenshot
Generate Report

### 18.7 Notification Preferences

Navigate to settings
Under Notifications, toggle settings on/off
Verify preferences saved
Take Screenshot
Generate Report

### 18.8 Default Currency Setting

Navigate to settings
Click "Change Currency"
Select AUD
Verify selection saved
Take Screenshot
Generate Report

---

## 19. Integrations

### 19.1 View Integrations Page

Log in as admin or manager
Navigate to /org/{orgId}/integrations
Verify Email (SMTP) integration with "Configure" button
Verify Coming Soon sections: Google Calendar, Slack, Webhooks, etc.
Take Screenshot
Generate Report

### 19.2 Configure SMTP as Admin

Navigate to integrations page
Click "Configure" on Email (SMTP)
Verify redirect to SMTP configuration page
Select "Gmail" from provider dropdown
Verify host and port auto-fill
Enter email address
Enter app password
Click "Save Configuration" button
Verify "SMTP configuration saved" success toast
Verify redirect to integrations page
Take Screenshot
Generate Report

### 19.3 Configure Custom SMTP

Navigate to SMTP settings
Select "Custom SMTP" provider
Enter SMTP Host
Enter Port
Toggle Secure connection
Enter Email Address
Enter Password
Click "Save Configuration"
Verify success toast
Take Screenshot
Generate Report

### 19.4 View Existing SMTP Config

Navigate to SMTP settings when config already exists
Verify host and port are loaded
Verify provider is shown
Verify password is masked
Take Screenshot
Generate Report

### 19.5 SMTP — Manager Cannot Access

Log in as manager
Navigate to /org/{orgId}/integrations/smtp
Verify access is denied or page redirects
Take Screenshot
Generate Report

---

## 20. AI Features

### 20.1 AI Textarea — Rewrite

Navigate to any form with an AI textarea (e.g., lead notes)
Type some text
Select "AI Rewrite" option
Select tone: professional
Click "Generate Rewrite" button
Wait for AI to process
Verify rewritten text is shown
Click "Accept" to apply
Take Screenshot
Generate Report

### 20.2 AI Textarea — Expand Text

Open AI textarea
Type a short note
Select "AI Rewrite" with length set to "longer"
Generate
Verify text is expanded
Take Screenshot
Generate Report

### 20.3 AI Lead Scoring

Navigate to a lead detail page
Click "Analyze" or "AI Score" button
Wait for AI to score
Verify score (0-100) is displayed
Verify tier (hot/warm/cold) is shown
Verify reasoning bullets are listed
Verify suggested actions are shown
Take Screenshot
Generate Report

### 20.4 AI Deal Insights

Navigate to a deal detail page
Click "AI Insights" or "Analyze" button
Wait for AI analysis
Verify win probability is shown
Verify risk level badge
Verify key factors list
Verify recommended next step
Take Screenshot
Generate Report

### 20.5 AI Smart Follow-ups on Dashboard

Navigate to dashboard
Wait for Smart Follow-ups section to load
Verify AI-generated follow-up suggestions
Verify each suggestion has: entity name, type badge, urgency, suggested action
Click a suggestion
Verify navigation to that entity's detail page
Take Screenshot
Generate Report

### 20.6 AI Task Priority

Navigate to tasks page with multiple tasks
Click "AI Priority" button
Verify tasks reorder by AI priority
Verify each task shows priority badge with reasoning
Toggle off AI Priority
Verify tasks return to normal order
Take Screenshot
Generate Report

### 20.7 AI Report Insights

Navigate to reports page
Wait for AI Executive Summary to generate
Verify summary text
Verify insights with color-coded badges (positive/negative/warning)
Verify recommendations list
Take Screenshot
Generate Report

### 20.8 AI Meeting Summarizer

Open Meeting Summarizer modal
Paste meeting notes or transcript
Click "Summarize" button
Wait for AI to process
Verify structured summary is displayed
Verify key points are listed
Verify action items are shown
Click "Create Task" on an action item
Verify CreateTaskDialog opens with pre-filled data
Take Screenshot
Generate Report

### 20.9 AI Communication Sentiment

Navigate to a contact or lead detail page
Click "Analyze Sentiment" or "Relationship Health"
Wait for AI analysis
Verify sentiment gauge (positive/neutral/negative/mixed)
Verify key topics discussed
Verify summary paragraph
Verify action items
Take Screenshot
Generate Report

### 20.10 AI Feature Disabled for Team

Log in as team member
Navigate to any AI feature
Verify AI buttons are hidden or show "AI not configured"
Take Screenshot
Generate Report

---

## 21. Permissions & RBAC

### 21.1 Admin Sees All Menu Items

Log in as admin
Open sidebar
Verify all CRM modules are visible: Dashboard, Leads, Contacts, Companies, Deals, Projects, Tasks, Notes, Quotes, Invoices, Email, Reports
Verify Administration section is visible: Team, Integrations, Settings
Take Screenshot
Generate Report

### 21.2 Manager Sees Most Menu Items

Log in as manager
Open sidebar
Verify all CRM modules are visible
Verify Administration section shows: Team, Integrations, Settings
Take Screenshot
Generate Report

### 21.3 Team Role Sees Limited Menu Items

Log in as team member
Open sidebar
Verify Invoices is NOT visible in sidebar
Verify Reports is NOT visible in sidebar
Verify Administration section is NOT visible
Take Screenshot
Generate Report

### 21.4 Team Cannot Access Invoices via Direct URL

Log in as team member
Navigate directly to /org/{orgId}/invoices
Verify access is denied or page redirects
Take Screenshot
Generate Report

### 21.5 Team Cannot Access Reports via Direct URL

Log in as team member
Navigate directly to /org/{orgId}/reports
Verify access is denied or page redirects
Take Screenshot
Generate Report

### 21.6 Team Cannot Access Users via Direct URL

Log in as team member
Navigate directly to /org/{orgId}/users
Verify access is denied or page redirects
Take Screenshot
Generate Report

### 21.7 Manager Cannot Access SMTP Settings via Direct URL

Log in as manager
Navigate directly to /org/{orgId}/integrations/smtp
Verify access is denied
Take Screenshot
Generate Report

### 21.8 Team Cannot Delete Records

Log in as team member
Navigate to any record detail (lead, contact, etc.)
Verify Delete button is NOT visible
Take Screenshot
Generate Report

### 21.9 Team Can Create Leads, Contacts, Companies, Deals, Tasks

Log in as team member
Navigate to leads page
Verify "Add Lead" button is visible
Navigate to contacts page
Verify "Add Contact" button is visible
Navigate to companies page
Verify "Add Company" button is visible
Navigate to deals page
Verify "Add Deal" button is visible
Navigate to tasks page
Verify "New Task" button is visible
Take Screenshot
Generate Report

### 21.10 Team Cannot Create Invoices or Projects

Log in as team member
Navigate to invoices page
Verify "New Invoice" button is NOT visible
Navigate to projects page
Verify "New Project" button is NOT visible
Take Screenshot
Generate Report

### 21.11 Team Can Edit Own Records

Log in as team member
Navigate to a lead owned by the user
Verify Edit or status change options are available
Navigate to a lead owned by another user
Verify Edit or status change options are NOT available
Take Screenshot
Generate Report

### 21.12 Admin Bypasses All Permission Checks

Log in as admin
Verify can access all modules
Verify can create, edit, delete all records
Verify can access users page, settings, integrations
Take Screenshot
Generate Report

### 21.13 Permission Gate — Component Visibility

Create a scenario where a specific permission is denied
Navigate to that page
Verify the corresponding button or section is hidden
Take Screenshot
Generate Report

### 21.14 Custom Permissions Applied via MemberPermissionsModal

Log in as admin
Navigate to team management
Edit a team member's permissions
Set deals.create to false
Save
Log in as that team member
Navigate to deals page
Verify "Add Deal" button is NOT visible
Take Screenshot
Generate Report

### 21.15 Custom Permissions — Grant EditAll to Team Member

Log in as admin
Edit a team member's permissions
Set leads.editAll to true
Save
Log in as that team member
Navigate to a lead owned by another user
Verify Edit options are now available
Take Screenshot
Generate Report

---

## 22. Navigation & Browser Behavior

### 22.1 Browser Refresh on Dashboard

Log in and navigate to dashboard
Press F5 or click browser Refresh
Verify page reloads
Verify user stays authenticated
Verify dashboard data loads correctly
Take Screenshot
Generate Report

### 22.2 Browser Back and Forward

Navigate from dashboard to leads page
Click browser Back button
Verify navigation back to dashboard
Click browser Forward button
Verify navigation forward to leads page
Take Screenshot
Generate Report

### 22.3 Open Link in New Tab

On contacts page, right-click "Eye" icon on a contact
Select "Open in new tab"
Verify contact detail opens in new tab
Verify user is still authenticated in new tab
Take Screenshot
Generate Report

### 22.4 Multiple Tabs Same Session

Log in on Tab 1
Open Tab 2 and navigate to same CRM
Verify both tabs share the same session
Perform an action on Tab 1 (e.g., create a lead)
Switch to Tab 2
Verify the action is reflected (lead appears after refresh)
Take Screenshot
Generate Report

### 22.5 Window Resize

Open CRM on a desktop browser
Resize browser to tablet width
Verify sidebar collapses or switches to mobile nav
Resize to mobile width
Verify mobile navigation is shown
Resize back to desktop
Verify sidebar returns
Take Screenshot
Generate Report

### 22.6 Collapsible Sidebar

Click sidebar collapse toggle
Verify sidebar collapses to icon-only mode
Verify collapsed state persists on page refresh
Click expand toggle
Verify sidebar expands fully
Take Screenshot
Generate Report

### 22.7 Mobile Navigation

Resize browser to mobile width
Verify sidebar is hidden
Verify hamburger menu or mobile nav button appears
Click mobile nav button
Verify slide-out sheet opens with navigation links
Click a nav link
Verify navigation occurs
Verify sheet closes
Take Screenshot
Generate Report

### 22.8 Direct URL Access to Protected Route

Log out completely
Navigate directly to /org/{orgId}/dashboard
Verify redirect to /login
Take Screenshot
Generate Report

### 22.9 Legacy Route Redirect

Log in
Navigate to /leads (legacy route)
Verify redirect to /org (org picker)
Take Screenshot
Generate Report

### 22.10 Bookmark a CRM Page

Navigate to a specific lead detail page
Bookmark the URL
Log out
Open the bookmark
Verify redirect to login
Log in
Verify redirect to the bookmarked page (or org picker)
Take Screenshot
Generate Report

### 22.11 Deep Link Navigation

Copy the URL of a specific deal
Log out
Paste URL in browser
Verify redirect to login
Log in
Verify navigation to the deal detail page (or org picker followed by redirect)
Take Screenshot
Generate Report

---

## 23. Validation & Edge Cases

### 23.1 Maximum Field Length

Navigate to lead creation
Enter a very long first name (100+ characters)
Verify schema accepts or rejects as defined
Take Screenshot
Generate Report

### 23.2 Special Characters in Fields

Create a lead with special characters in name: O'Brien, Müller
Verify special characters are saved and displayed correctly
Take Screenshot
Generate Report

### 23.3 Emoji in Notes

Create a note with emoji characters
Verify emoji is saved and displayed correctly
Take Screenshot
Generate Report

### 23.4 Unicode Characters

Create a contact with Japanese or Arabic characters
Verify characters are saved and displayed correctly
Take Screenshot
Generate Report

### 23.5 Whitespace in Required Fields

Create a lead with only spaces in First Name
Verify validation catches empty whitespace
Take Screenshot
Generate Report

### 23.6 XSS Attempt in Text Fields

Create a lead with script tags in notes: <script>alert('xss')</script>
Navigate to the lead detail page
Verify script does not execute
Verify HTML is escaped or sanitized
Take Screenshot
Generate Report

### 23.7 SQL Injection Attempt

Enter SQL injection text in search bar: ' OR 1=1 --
Verify search works normally without exposing data
Take Screenshot
Generate Report

### 23.8 Duplicate Email on Lead Creation

Create a lead with a specific email
Create another lead with the same email
Verify both leads are created (no unique constraint on email)
Take Screenshot
Generate Report

### 23.9 Boundary Value — Deal Probability

Create a deal with probability 0
Verify save succeeds
Create a deal with probability 100
Verify save succeeds
Create a deal with probability -1
Verify validation error
Create a deal with probability 101
Verify validation error
Take Screenshot
Generate Report

### 23.10 Boundary Value — Lead Value

Create a lead with value 0
Verify save succeeds
Create a lead with negative value
Verify validation error
Take Screenshot
Generate Report

### 23.11 Empty Tags Array

Create a lead without tags
Verify lead is created successfully
Verify tags field defaults to empty array
Take Screenshot
Generate Report

### 23.12 Invoice with Very Long Client Name

Create an invoice with a very long client name (200+ characters)
Verify invoice is created
Verify display is not broken on invoice list
Take Screenshot
Generate Report

### 23.13 Date Validation — Due Date Before Issue Date

Create an invoice with due date before issue date
Verify invoice is created (system may allow this)
Take Screenshot
Generate Report

### 23.14 Deal with Multiple Contacts

Create a deal and select multiple contacts
Save
Verify deal shows multiple contacts
Take Screenshot
Generate Report

### 23.15 Project with Multiple Team Members

Create a project and add multiple team members
Save
Verify project shows team members
Take Screenshot
Generate Report

---

## 24. Security

### 24.1 Cross-Org Data Isolation

Log in as a member of Org A
Navigate to Org A's dashboard
Verify only Org A's data is shown
Try to access /org/{orgBId}/dashboard where Org B exists and user is not a member
Verify "You do not have access" error
Take Screenshot
Generate Report

### 24.2 Direct Firestore Access Attempt

Open browser console
Try to read Firestore documents directly using client SDK
Verify Firestore security rules block unauthorized access
Take Screenshot
Generate Report

### 24.3 API Unauthenticated Access

Open browser DevTools Network tab
Make a POST request to /api/email/send without any auth token
Verify request is rejected (401 or 403)
Take Screenshot
Generate Report

### 24.4 API Unauthenticated Invoice Send

Make a POST request to /api/invoices/send without auth token
Verify request is rejected
Take Screenshot
Generate Report

### 24.5 Open Redirect Check

Make a GET request to /api/email/track/click with a malicious url parameter
Verify request is rejected or URL is validated
Take Screenshot
Generate Report

### 24.6 User Cannot Elevate Own Role

Log in as team member
Try to modify own role in browser DevTools
Verify Firestore rules prevent role self-elevation
Take Screenshot
Generate Report

### 24.7 View User Profile Data Exposure

Log in as a user
Navigate to a page that calls getUsers()
Verify only appropriate user data is exposed
Verify sensitive fields are not visible
Take Screenshot
Generate Report

### 24.8 Session Cookie Security

Log in and inspect the session cookie
Verify cookie has Secure and HttpOnly flags
Take Screenshot
Generate Report

### 24.9 Brute Force Protection

Attempt to log in with wrong password repeatedly (more than 5 times)
Verify rate limiting kicks in
Verify "Too many attempts" error
Take Screenshot
Generate Report

### 24.10 Security Headers

Inspect response headers of any page
Verify X-Frame-Options: DENY is present
Verify X-Content-Type-Options: nosniff is present
Verify Strict-Transport-Security header is present
Verify Referrer-Policy header is present
Take Screenshot
Generate Report

---

## 25. Error Recovery

### 25.1 Network Failure During Lead Creation

Start creating a lead
Disconnect internet before clicking "Create"
Click "Create" button
Verify appropriate error message or toast
Reconnect internet
Retry creating the same lead
Verify lead is created successfully
Take Screenshot
Generate Report

### 25.2 Server Error on Save

Attempt to save data when server is unavailable
Verify error toast appears with user-friendly message
Verify no data loss occurs
Take Screenshot
Generate Report

### 25.3 Page Refresh During Form Fill

Start filling a create lead form with data
Refresh the page
Verify form data is lost (expected behavior)
Navigate back to leads page
Verify previous state is maintained
Take Screenshot
Generate Report

### 25.4 Concurrent Edit Conflict

Open the same lead in two browser tabs
Edit and save the lead in Tab 1
Edit and save the same lead in Tab 2
Verify the last write wins or conflict handling appears
Take Screenshot
Generate Report

### 25.5 Firebase Offline Mode

Disconnect internet
Navigate to a previously loaded page
Verify cached data is shown (if offline persistence enabled)
Verify UI indicates offline status
Reconnect
Verify real-time updates resume
Take Screenshot
Generate Report

### 25.6 Error Boundary Catch

Trigger a rendering error on a page
Verify error.tsx or global-error.tsx catches it
Verify user-friendly error message is shown
Verify recovery option (retry or go back) is available
Take Screenshot
Generate Report

### 25.7 404 Page

Navigate to a non-existent route
Verify not-found.tsx renders with friendly message
Verify navigation back to home is available
Take Screenshot
Generate Report

---

## 26. Human Behavior & Mistakes

### 26.1 Double-Click Submit Button

Navigate to lead creation
Fill form completely
Double-click "Create" button rapidly
Verify lead is created only once
Verify no duplicate lead
Take Screenshot
Generate Report

### 26.2 Submit Empty Form

Open lead creation dialog
Without filling any fields, click "Create" button
Verify validation errors appear on all required fields
Take Screenshot
Generate Report

### 26.3 Close Dialog Without Saving

Open create lead dialog
Fill some fields
Click outside dialog or press Escape
Verify dialog closes
Verify no lead was created
Take Screenshot
Generate Report

### 26.4 Paste Invalid Values

Copy and paste non-numeric text into the Value field
Verify validation catches invalid input
Take Screenshot
Generate Report

### 26.5 Rapid Navigation Changes

Click sidebar links quickly without waiting for pages to load
Verify each navigation completes correctly
Verify no errors from stale state
Take Screenshot
Generate Report

### 26.6 Browser Tab Switch During Load

Navigate to a slow-loading page
Switch to another browser tab
Switch back
Verify page has loaded correctly
Take Screenshot
Generate Report

### 26.7 Use Browser Zoom

Zoom browser to 150%
Verify UI does not break
Verify all elements remain accessible
Zoom browser to 75%
Verify UI does not break
Reset zoom to 100%
Take Screenshot
Generate Report

### 26.8 Submit Form and Immediately Navigate Away

Fill lead creation form
Click "Create" and immediately click sidebar link
Verify lead is created (server-side operation completes)
Navigate back to leads page
Verify lead appears in list
Take Screenshot
Generate Report

### 26.9 Wrong File Type Upload

On profile page, try to upload a non-image file (PDF, .exe)
Verify validation rejects the file type
Take Screenshot
Generate Report

### 26.10 Extremely Large Input

Copy a very long string (10000+ characters) into a notes field
Submit the form
Verify the field handles large input gracefully
Take Screenshot
Generate Report

### 26.11 Create Record and Immediately Delete

Create a lead
Immediately navigate to lead detail
Delete the lead
Verify lead is deleted successfully
Take Screenshot
Generate Report

### 26.12 Attempt Actions on Loading Spinner

Navigate to a page that is still loading
Try to click buttons or links before the spinner disappears
Verify no unintended actions occur
Take Screenshot
Generate Report

### 26.13 Logout While Creating Record

Start filling a create lead form
Open another tab and log out
Return to the first tab
Try to submit the form
Verify the operation fails or redirects to login
Take Screenshot
Generate Report

---

## 27. Known Bug Regression Tests

### 27.1 ERR-001 Regression: Lead Detail Has No Edit Button

Navigate to lead detail page
Verify there is no way to edit lead name, email, phone from the detail page
Confirm the EditLeadDialog exists but is not wired
Take Screenshot
Generate Report

### 27.2 ERR-002 Regression: Email Send API Auth

Make an unauthenticated POST to /api/email/send
Verify request is rejected
Take Screenshot
Generate Report

### 27.3 ERR-004 Regression: Open Redirect in Click Tracking

Attempt to use the click tracking endpoint with a malicious URL
Verify redirect is blocked or URL is validated
Take Screenshot
Generate Report

### 27.4 ERR-005 Regression: Rate Limiter Applied

Make rapid repeated requests to login endpoint
Verify rate limiting kicks in after threshold
Take Screenshot
Generate Report

### 27.5 ERR-006 Regression: Lead Value $0 Display

Create a lead with value set to 0
Navigate to lead detail page
Verify value is shown as "$0" and not hidden due to falsy check
Take Screenshot
Generate Report

### 27.6 ERR-010 Regression: AuthGate Redirect Loop

Create a user with isFirstLogin set to true
Log in as that user
Verify user is taken to /change-password
Complete password change
Verify user proceeds to onboarding or org without redirect loop
Take Screenshot
Generate Report

### 27.7 ERR-013 Regression: Organization Deletion Available

Navigate to org settings as admin
Verify there is UI to delete or leave organization (or confirm it's still missing)
Take Screenshot
Generate Report

### 27.8 ERR-023 Regression: Hard Delete Prevention

Delete a lead
Verify the lead is hard-deleted (document removed, not soft-deleted)
Take Screenshot
Generate Report

### 27.9 ERR-024 Regression: Lead Conversion Permission Check

Log in as team member
Try to convert a lead owned by another user
Verify permission check prevents the conversion
Take Screenshot
Generate Report

### 27.10 ERR-029 Regression: Cross-Org User Exposure

Call getUsers() or view user list
Verify only users from current org are shown, not all users across all orgs
Take Screenshot
Generate Report

### 27.11 ERR-033 Regression: Invoice Template Enum Consistency

Create an invoice and verify template field
Verify the stored template value matches either the schema or type definition
Take Screenshot
Generate Report

### 27.12 ERR-035 Regression: Dashboard Server Action Session Check

Intercept the dashboard stats server action
Verify it validates the caller's session before returning data
Take Screenshot
Generate Report

### 27.13 PIR-001 Regression: Permission Save/Load Document Mismatch

As admin, modify a team member's permissions via MemberPermissionsModal
Log in as that team member
Verify the custom permission changes are reflected (not masked by ROLE_DEFAULTS)
Take Screenshot
Generate Report

### 27.14 PIR-003 Regression: Real-Time Permission Updates

As admin on one browser, change a team member's permissions
On the team member's browser (another window), observe in real-time
Verify sidebar and UI update without page refresh
Take Screenshot
Generate Report

### 27.15 SEC-01 Regression: Team Member Cannot Delete Own Tasks

Log in as team member
Navigate to a task owned by this user
Try to delete the task
Verify delete is blocked
Take Screenshot
Generate Report

---

## 28. Cross-Organization Isolation

### 28.1 Data Isolation Between Orgs

Log in as a member of Org A
Create a lead in Org A
Switch to Org B
Navigate to leads page
Verify Org A's lead is NOT visible in Org B
Take Screenshot
Generate Report

### 28.2 User Belongs to Multiple Orgs

Log in as a user belonging to both Org A and Org B
Switch between orgs
Verify different data is shown for each org
Take Screenshot
Generate Report

### 28.3 Member Removed from Org

As admin, remove a member from an organization
Log in as that member
Navigate to that organization
Verify access is denied
Verify user's other orgs are still accessible
Take Screenshot
Generate Report

---

## 29. Activity Timeline

### 29.1 Activity Logged on Lead Creation

Create a new lead
Navigate to lead detail page
Scroll to activity timeline
Verify activity "Lead created" is logged
Take Screenshot
Generate Report

### 29.2 Activity Logged on Status Change

Change a lead's status
Check activity timeline
Verify status change activity is logged
Take Screenshot
Generate Report

### 29.3 Activity Logged on Lead Conversion

Convert a lead to a contact
Check activity timeline on lead
Verify "Lead converted to contact" activity is logged
Check activity timeline on the new contact
Verify "Contact created from lead conversion" activity is logged
Take Screenshot
Generate Report

### 29.4 Activity Logged on Deal Stage Change

Change a deal stage
Check activity timeline on the deal
Verify stage change activity is logged
Take Screenshot
Generate Report

### 29.5 View Organization Activities

Navigate to a page with organization-wide activity feed
Verify activities from all members are shown
Verify activities are ordered by date (newest first)
Take Screenshot
Generate Report

---

## 30. Notifications

### 30.1 Notification on Deal Won

Change a deal stage to "Won"
Verify notification is created for the deal owner
Take Screenshot
Generate Report

### 30.2 Notification on Deal Lost

Change a deal stage to "Lost"
Verify notification is created for the deal owner
Take Screenshot
Generate Report

### 30.3 Notification on Task Assignment

Create a task with an assignee different from the creator
Verify notification sent to the assignee
Take Screenshot
Generate Report

### 30.4 Notification on Invoice Paid

Mark an invoice as "Paid"
Verify notification sent to the invoice owner
Take Screenshot
Generate Report

### 30.5 View Notifications

Click notification bell in header
Verify notification list appears
Verify notifications show type, message, and time
Take Screenshot
Generate Report

### 30.6 Mark Notification as Read

Click a notification
Verify it is marked as read
Verify unread count decreases
Take Screenshot
Generate Report

### 30.7 Mark All Notifications as Read

Open notification list
Click "Mark all as read"
Verify all notifications are marked read
Verify badge count goes to zero
Take Screenshot
Generate Report

---

## 31. Command Palette Search

### 31.1 Open Command Palette

Press Cmd+K (Mac) or Ctrl+K (Windows/Linux)
Verify command palette/dialog opens
Take Screenshot
Generate Report

### 31.2 Search CRM Records

Open command palette
Type a lead name
Verify matching results appear
Click a result
Verify navigation to that record
Take Screenshot
Generate Report

### 31.3 AI Natural Language Search (If Enabled)

Open command palette
Toggle to AI Search mode
Type a natural language query like "deals worth over 10k in follow up"
Wait for AI to parse
Verify structured results appear
Click a result
Verify navigation
Take Screenshot
Generate Report

### 31.4 Close Command Palette

Open command palette
Press Escape
Verify palette closes
Take Screenshot
Generate Report