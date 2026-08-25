# Security Audit — Backend, API, Firebase & Authorization

## 1. Summary

The application has **one critical architectural defect** in its permission system that undermines all other security measures. Additionally, several gaps exist in Firestore rules, server-side validation, and API protection.

## 2. Critical Permission Architecture Defect

| Issue | Severity | Status |
|-------|----------|--------|
| Permissions saved to `organization_members` but loaded from `users` (different docs) | CRITICAL | Unfixed |
| Fallback to ROLE_DEFAULTS masks all custom permissions | CRITICAL | Unfixed |
| No real-time listener on member document | CRITICAL | Unfixed |
| No cache flush after permission update | HIGH | Unfixed |

**Impact**: The entire RBAC system is non-functional. Custom permissions set by an admin are completely ignored by the application.

## 3. Firestore Rule Gaps

### 3.1 No Custom Permission Enforcement

Firestore rules only check:
- `isOrgAdmin(orgId)` — role === "admin"
- `isOrgManager(orgId)` — role === "manager" || "admin"
- `isRecordOwner()` — ownerId === auth.uid

**Missing**: Any check against the `UserPermissions` structure (read/create/edit/delete/editAll).
**Impact**: A team member with `invoices.read: false` could still read invoices via direct Firestore query because the rules only require `isOrgManager()`, which returns true for managers ONLY. Wait — `isOrgManager()` returns false for team members, so they can't access invoices at all via rules. The actual gap is different...

Let me re-analyze:

For invoices:
```
match /invoices/{invoiceId} {
  allow read: if belongsToOrg(resource.data.organizationId)
                && isOrgManager(resource.data.organizationId);
```

Team members cannot read invoices because `isOrgManager()` returns false for team role. This is correct for the ROLE defaults.
But if an admin customizes a **manager's** permissions to have `invoices.read: false`, the Firestore rules would still ALLOW access because they only check role. This is the real gap: **custom permission overrides are not enforced at the rule level**.

### 3.2 Users Collection

Rules allow `isManager()` to read all user profiles:
```
allow read: if isOwner(userId) || isManager();
```

`isManager()` reads from the user's own document, not the org member doc. This means any authenticated user with role "manager" or "admin" in their `users/{uid}` doc can read any user profile across all organizations.

### 3.3 Organizations Collection

```
allow read: if isAuthenticated();
```

Any authenticated user can read ALL organizations. While org IDs are intended to be semi-public (slug-based discovery), this allows enumerating all organizations.

### 3.4 No Rate Limiting on Writes

Firestore rules have no rate limiting. A malicious script could:
- Rapid-fire create leads/contacts/deals
- Update documents in a loop
- Execute many reads

The app-level rate limiter (`lib/rate-limit.ts`) exists but is only applied to email, login, and AI endpoints — NOT to Firestore CRUD operations.

## 4. API Route Protection

| API Route | Auth | Rate Limited | Notes |
|-----------|------|-------------|-------|
| POST /api/email/send | ✅ verifyApiRequest | ✅ checkRateLimit | Fixed |
| POST /api/invoices/send | ✅ verifyApiRequest | ✅ checkRateLimit | Fixed |
| GET /api/email/track/click | ✅ signature verification | ✅ | Fixed |
| POST /api/org/{orgId}/integrations/smtp | ✅ Bearer token | ❌ | Need check |

## 5. Server Action Protection

| Action | Auth | Permission Check | Notes |
|--------|------|-----------------|-------|
| getCachedDashboardStats | ✅ auth() | ✅ org membership | Verified |
| AI actions | ✅ aiAccessDenied | ❌ | Has auth + rate limit, no permission check |
| updateMemberPermissionsAction | ✅ verifyIdToken | ✅ admin/manager | Correct |
| updateUserAction | ✅ verifyCallerIsAdmin | ✅ admin only | Correct |

## 6. Client-Side Permission Bypass Risks

Since the UI hides buttons/dialogs but does not block:
1. Direct URL access — some pages lack RBACGuard
2. Direct Firestore access — rules only check role, not custom permissions
3. API calls — server actions lack permission checks for CRUD operations

## 7. Recommendations

1. **Fix PIR-001**: Sync permissions to `users/{uid}` in `updateMemberPermissionsAction`
2. **Fix PIR-003**: Subscribe to `organization_members/{orgId}_{userId}` in AuthProvider (or sync users doc on every permission change)
3. **Fix PIR-004**: Call `clearPermissionCache()` after permission update
4. **Fix PIR-005**: Add custom permission checks to Firestore rules
5. **Fix PIR-006**: Use Admin SDK in server-side permission checks
6. **Fix PIR-007**: Add permission checks to all create/update/delete functions
7. **Fix PIR-012**: Add RBACGuard to all pages
8. **Fix PIR-013**: Add permission checks to deal CRUD operations