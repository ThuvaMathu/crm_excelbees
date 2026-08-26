# CRM Functional & Technical Issue Report

This document outlines all functional, UX, security, and architectural issues discovered during the complete reverse engineering of the repository.

---

## Architecture & Routing Issues

### Issue ID: ARCH-01
**Severity:** Critical
**Category:** Broken User Journey / Duplicate Process
**User Impact:** Users can get lost navigating between legacy and new dashboards, leading to fragmented data views.
**Current Behaviour:** The application maintains duplicate page structures. There is a `(dashboard)` route group at the root level alongside the multi-tenant `org/[orgId]` route group.
**Expected Behaviour:** The application should solely use the `org/[orgId]` structure for authenticated users to enforce the multi-tenant paradigm.
**Root Cause:** Incomplete migration from single-tenant to multi-tenant architecture.
**File Path:** 
`app/(dashboard)/*`
`app/org/[orgId]/*`
**Recommended Solution:** Deprecate and remove the `(dashboard)` route group entirely. Redirect any legacy links to the `org/(hub)` selector or default organization dashboard.

### Issue ID: ARCH-02
**Severity:** High
**Category:** Data Integrity Issue / Business Logic Error
**User Impact:** Global user profiles contain a `role` field that conflicts with organization-specific roles, potentially granting unintended privileges.
**Current Behaviour:** Both `UserProfile` (`users` collection) and `OrganizationMember` contain a `role` field. The Firestore rules contain a legacy helper `isManager()` which checks the global user profile.
**Expected Behaviour:** Roles should be strictly contextualized to the organization. Global `users` docs should only track authentication and global preferences.
**Root Cause:** Legacy schema still in use alongside the new multi-tenant `OrganizationMember` schema.
**File Path:** 
`types/crm.ts` (UserProfile vs OrganizationMember)
`firestore.rules` (`isManager()` helper)
**Recommended Solution:** Remove the `role` and `permissions` fields from the global `UserProfile` interface and `users` collection. Update `firestore.rules` to exclusively rely on `isOrgManager(orgId)` and remove the legacy `isManager()` check.

---

## Security & Permission Issues

### Issue ID: SEC-01
**Severity:** High
**Category:** Permission Issue
**User Impact:** Team members can delete tasks and notes they created, despite the business rules stating they should have "delete: false" permissions.
**Current Behaviour:** `firestore.rules` for `/tasks/{taskId}` allows delete if `resource.data.ownerId == request.auth.uid`. However, `types/crm.ts` `ROLE_DEFAULTS` explicitly states `team` role has `delete: false` for tasks.
**Expected Behaviour:** Team members should not be able to delete records, even if they own them, to maintain an accurate audit trail (or the business rule should be updated to match the database).
**Root Cause:** Firestore rules grant deletion rights based on ownership rather than strictly evaluating the `OrganizationMember` role permissions.
**File Path:** 
`firestore.rules` (match /tasks, match /notes)
`types/crm.ts`
**Recommended Solution:** Align `firestore.rules` with the business requirement: remove `resource.data.ownerId == request.auth.uid` from the delete conditions for tasks, notes, and projects, strictly requiring `isOrgManager()` or `isOrgAdmin()`.

### Issue ID: SEC-02
**Severity:** Medium
**Category:** Security Issue
**User Impact:** Cross-tenant metadata leakage.
**Current Behaviour:** In `firestore.rules`, the `organizations` collection is universally readable: `allow read: if isAuthenticated();`.
**Expected Behaviour:** Users should only be able to read organizations they belong to, or minimal public profiles for organizations if required for joining.
**Root Cause:** Designed to allow slug uniqueness checks and organization picker listing.
**File Path:** `firestore.rules`
**Recommended Solution:** Implement a separate `organization_public` collection for slug checks, and restrict `organizations` reads to `isMemberOf(orgId)`.

---

## Workflow & UX Issues

### Issue ID: UX-01
**Severity:** Medium
**Category:** Missing Feedback / Error Handling Issue
**User Impact:** When a user converts a lead and misses required fields for a Contact or Deal, the UI fails silently or shows a generic error.
**Current Behaviour:** The Lead Conversion flow (`UC-SALES-02`) attempts to map Lead data to Contact/Deal/Project. If `value` is missing for a Deal, the conversion may fail at the database level.
**Expected Behaviour:** The conversion dialog should present a form pre-filled with Lead data, highlighting missing required fields for the target entity before submission.
**Root Cause:** Optimistic conversion without explicit pre-validation forms.
**Recommended Solution:** Implement a multi-step modal for Lead Conversion that validates the target schema (e.g., Contact, Deal) before making the API/Firestore call.

### Issue ID: UX-02
**Severity:** Low
**Category:** UX Problem
**User Impact:** Users cannot easily discover how to manage recurring invoices.
**Current Behaviour:** Recurring invoice settings are nested within the standard invoice creation flow.
**Expected Behaviour:** There should be a dedicated view or tab for managing active recurring invoice schedules, separate from one-off invoices.
**Root Cause:** Unified `invoices` collection with `isRecurring` flag without distinct UI separation.
**File Path:** `app/org/[orgId]/invoices/page.tsx`
**Recommended Solution:** Add a "Recurring Templates" tab on the Invoices index page to list all active cron-driven invoices.

---

## Summary
The CRM architecture is currently mid-transition from a single-tenant to a robust multi-tenant system. The primary focus should be completely deprecating the root `(dashboard)` routes and the global User `role` property in favour of the `OrganizationMember` paradigm to resolve structural and security inconsistencies.