# Missing Permission Implementation — Checklist

## 1. AuthProvider — Reads from Wrong Document

- [ ] **PIR-001** `AuthProvider.tsx:37` reads from `users/{uid}` but should read from `organization_members/{orgId}_{userId}` (or sync both)
- [ ] **PIR-003** No real-time listener on `organization_members` doc

## 2. Server Action — Save Path Doesn't Sync to Load Path

- [ ] **PIR-001** `updateMemberPermissionsAction` (admin-users.ts:370-374) saves to `organization_members` but NOT to `users`
- [ ] **PIR-004** `clearPermissionCache()` not called after permission update
- [ ] **PIR-004** `updateMemberPermissionsAction` doesn't return userId for cache flushing

## 3. Firestore Rules — No Custom Permission Enforcement

- [ ] **PIR-005** No rule checks custom `UserPermissions` structure anywhere
- [ ] All collections: rules only check role (admin/manager/owner), not `read/create/edit/delete/editAll` flags

## 4. Server-Side Permission Checks

- [ ] **PIR-006** `permission-utils.ts` uses client SDK instead of Admin SDK
- [ ] **PIR-007** `createLead()` has no permission check
- [ ] **PIR-013** `createDeal()` has no permission check
- [ ] **PIR-007** `createContact()` has no permission check
- [ ] **PIR-007** `createCompany()` has no permission check
- [ ] `createProject()` has no permission check
- [ ] `createTask()` has no permission check
- [ ] `createInvoice()` has no permission check
- [ ] `updateLead()` has no permission check
- [ ] `updateContact()` has no permission check
- [ ] `updateCompany()` has no permission check
- [ ] `updateDeal()` has no permission check
- [ ] `updateDealStage()` has no permission check
- [ ] `deleteLead()` has no permission check
- [ ] `deleteContact()` has no permission check
- [ ] `deleteCompany()` has no permission check

## 5. Page-Level Guards (RBACGuard)

- [ ] Dashboard page — has RBACGuard?
- [ ] Leads list — missing RBACGuard?
- [ ] Lead detail — missing RBACGuard?
- [ ] Contacts list — missing RBACGuard?
- [ ] Contact detail — missing RBACGuard?
- [ ] Deals page — missing RBACGuard?
- [ ] Deal detail — missing RBACGuard?
- [ ] Invoices — has RBACGuard with reports permission?
- [ ] Projects — missing RBACGuard?
- [ ] Tasks — missing RBACGuard?
- [ ] Reports — missing RBACGuard?
- [ ] Email — missing RBACGuard?
- [ ] Settings — missing RBACGuard?
- [ ] Users/Team page — has RBACGuard for admin?

## 6. Component-Level Permissions

- [ ] Create button for each module — not all use PermissionGate
- [ ] Edit button for each module — many use role checks instead of can()
- [ ] Delete button — many use role checks instead of can()
- [ ] Bulk actions — not permission-gated
- [ ] Import — not permission-gated
- [ ] Export — not permission-gated
- [ ] Quick actions — not consistently permission-gated

## 7. Financial Hiding

- [ ] Lead value — uses `currentMember?.role` check, not `can()`
- [ ] Deal value — uses `currentMember?.role` check, not `can()`
- [ ] Invoice amounts — uses `currentMember?.role` check, not `can()`
- [ ] Project budget — uses `currentMember?.role` check, not `can()`

## 8. Server Action Permission Enforcement

- [ ] Dashboard stats — ✅ has session verification
- [ ] AI actions — ✅ has auth + rate limit
- [ ] Lead conversion — ⚠️ uses client-SDK permission check
- [ ] Deal stage update — no permission check
- [ ] Project archive — no permission check
- [ ] Task status update — no permission check