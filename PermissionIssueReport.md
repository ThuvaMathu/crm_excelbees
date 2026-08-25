# Permission Issue Report — Complete Bug Register

## Critical Issues

### PIR-001: Permission Save/Load Document Mismatch

**Severity**: CRITICAL  
**Category**: Architectural Defect  
**Affected**: Entire Permission System  

**Description**: When an admin modifies a user's permissions via `MemberPermissionsModal`, the `updateMemberPermissionsAction` server action saves permissions to `organization_members/{orgId}_{userId}`. However, the `AuthProvider` reads permissions from `users/{uid}`. These are different documents. The permissions set by the admin are never loaded by the application.

**Save Location**: `app/actions/admin-users.ts:370-374`
```typescript
await adminDb.collection("organization_members").doc(targetMemberId).update({
  role: data.role,
  permissions: data.permissions,
  updatedAt: new Date(),
});
```

**Load Location**: `components/auth/AuthProvider.tsx:37,74`
```typescript
const userRef = doc(db, "users", firebaseUser.uid);  // different doc!
...
permissions: userData.permissions;
```

**Root Cause**: The `updateMemberPermissionsAction` only syncs the `role` to `users/{uid}` when the role changes (admin-users.ts:377-383). It never syncs the `permissions` field:
```typescript
if (targetCurrentRole !== data.role) {
  await adminDb.collection("users").doc(data.targetUserId).update({
    role: data.role,
    updatedAt: new Date(),
  });
  await adminAuth.setCustomUserClaims(data.targetUserId, { role: data.role });
}
```
Note: `permissions` is NOT included in this sync.

**Reproduction**:
1. Login as admin → Team → MemberPermissionsModal
2. Set a user's `leads.read: false`
3. Save
4. Login as that user → Leads still visible in sidebar and page

---

### PIR-002: Fallback to ROLE_DEFAULTS Masks Permission Issues

**Severity**: CRITICAL  
**Category**: Architectural Defect  
**Affected**: usePermission hook, all UI components  

**Description**: When `user.permissions` is `undefined` (which it always is via the current AuthProvider implementation), the `usePermission` hook falls back to `ROLE_DEFAULTS[user.role]`. This provides full role-based defaults, completely ignoring any custom permissions set by an admin.

**Location**: `hooks/usePermission.tsx:20-23`
```typescript
const permissions = useMemo(() => {
    if (!user?.role) return null;
    return user.permissions || ROLE_DEFAULTS[user.role];  // fallback masks missing data
}, [user]);
```

**Impact**: Even if the storage disconnect (PIR-001) was fixed, this fallback logic would still mask the issue. A user with no permissions field would get full access.

**Reproduction**: Any user with `user.permissions = undefined` gets ROLE_DEFAULTS.

---

### PIR-003: No Organization-Member Firestore Listener

**Severity**: CRITICAL  
**Category**: Architectural Defect  
**Affected**: AuthProvider, Real-time Permission Updates  

**Description**: `AuthProvider` only subscribes to `users/{uid}` via `onSnapshot`. It does not subscribe to `organization_members/{orgId}_{userId}`. When permissions change in the member document, the UI has no real-time update mechanism.

**Location**: `components/auth/AuthProvider.tsx:37`
```typescript
const userRef = doc(db, "users", firebaseUser.uid);  // only this doc
...
unsubscribeDoc.current = onSnapshot(userRef, ...);     // only this snapshot
```

**Impact**: Even after the storage disconnect is fixed, permission changes would only take effect after a full page refresh. Real-time updates would not work.

---

### PIR-004: No Permission Cache Flush After Update

**Severity**: HIGH  
**Category**: Data Freshness  
**Affected**: permission-utils.ts cache  

**Description**: `clearPermissionCache(userId)` exists in `permission-utils.ts:59` but is never called after `updateMemberPermissionsAction`. The 5-minute in-memory cache means stale permissions persist.

**Locations**:
- `lib/auth/permission-utils.ts:29-30` — cache definition
- `lib/auth/permission-utils.ts:59-61` — clear function exists but unused in save path
- `app/actions/admin-users.ts:313-400` — save path never calls clearPermissionCache

**Impact**: After fix of storage disconnect, users would still see stale permissions for up to 5 minutes.

---

### PIR-005: Firebase Rules Ignore Custom UserPermissions Entirely

**Severity**: HIGH  
**Category**: Security — Missing Enforcement  
**Affected**: firestore.rules  

**Description**: Firestore security rules only check role hierarchy via `isOrgAdmin()`, `isOrgManager()`, and `isRecordOwner()`. They never check the granular `UserPermissions` structure (e.g., `read`, `create`, `edit`, `delete`, `editAll`).

**Location**: `firestore.rules:36-87`

**Example**: A team member with `invoices.read: false` in their custom permissions can still query the `invoices` collection directly from the browser console because the rules only check `isOrgManager()` (a role-level check), not the custom permission.

**Impact**: A malicious user who discovers this can bypass the UI permission editor and access/modify data directly.

---

### PIR-006: Server-Side Permission Checks Use Client SDK

**Severity**: HIGH  
**Category**: Security — Trust Boundary  
**Affected**: lib/firestore CRUD functions  

**Description**: The `hasPermission()` function in `permission-utils.ts` uses the Firebase **client** SDK (`../firebase`), not the Admin SDK. When called from server actions or API routes, it runs on the server but uses client credentials that may not have sufficient Firestore access.

**Location**: `lib/auth/permission-utils.ts:17-18`
```typescript
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";  // ← client SDK
```

**Impact**: Server-side permission checks are not reliable. The comment in the file even acknowledges this:
> "It is therefore NOT a hard security boundary by itself — a malicious client could bypass it."

---

### PIR-007: No Backend Permission Validation on Create Operations

**Severity**: HIGH  
**Category**: Missing Authorization  
**Affected**: Firestore CRUD functions  

**Description**: Create functions like `createLead()`, `createContact()`, `createCompany()` in the firestore data layer do not check permissions. They accept data, validate schema (Zod), and write directly. Permission checks only happen in the UI.

**Example** (`lib/firestore/leads.ts:19-40`):
```typescript
export async function createLead(data: LeadInput, userId: string, organizationId?: string) {
  try {
    const parsed = leadSchema.safeParse(data);  // schema validation only
    // NO permission check here
```

**Contrast**: Lead conversion functions DO have permission checks (leads.ts:160-164) via `hasPermission()`.

---

### PIR-008: Two Different Permission Update UIs Write to Different Locations

**Severity**: HIGH  
**Category**: Design Inconsistency  
**Affected**: EditUserDialog vs MemberPermissionsModal  

**Description**: There are two ways to edit user permissions:
1. **MemberPermissionsModal** (from Team page) → saves to `organization_members/{orgId}_{userId}` via `updateMemberPermissionsAction`
2. **EditUserDialog** (from Admin Panel) → saves to `users/{uid}` via `updateUserAction`

Only the Admin Panel dialog (EditUserDialog) saves to the document that AuthProvider reads from.

**Locations**:
- EditUserDialog: `components/users/EditUserDialog.tsx:101` → calls `updateUserAction`
- MemberPermissionsModal: `components/team/MemberPermissionsModal.tsx:112` → calls `updateMemberPermissionsAction`

---

### PIR-009: permission-utils.hasPermission Returns Admin Bypass for Non-Admin Users

**Severity**: MEDIUM  
**Category**: Logic Error  
**Affected**: `lib/auth/permission-utils.ts:75-77`

**Description**: The `hasPermission()` function has an admin bypass that returns `{ allowed: true }` for admin role. This is correct. However, the function uses the 5-minute cached permission data which may be stale.

**Location**: `lib/auth/permission-utils.ts:74-77`

---

### PIR-010: RBACGuard's Permission Check Uses Zustand (Stale Data Possible)

**Severity**: MEDIUM  
**Category**: Data Freshness  
**Affected**: `components/auth/RBACGuard.tsx:81-87`

**Description**: `RBACGuard` uses `can(module, action)` from `usePermission()`, which reads from the Zustand store. The Zustand store is updated via `onSnapshot` on `users/{uid}` — the wrong document for permissions. Even after fixing the storage disconnect, the Zustand store doesn't persist across page refreshes until `onSnapshot` fires again.

**Impact**: Page-level protection is unreliable. A user could access a restricted page during the brief window between navigation and snapshot response.

---

### PIR-011: No Permission Flush on Session Refresh / Login

**Severity**: MEDIUM  
**Category**: Data Freshness  

**Description**: When a user logs out and back in, the in-memory permission cache (`permission-utils.ts:29`) is cleared because it's memory-only. However, the Zustand store's snapshot listener re-reads from `users/{uid}` which still has old/stale permissions.

**Impact**: Even after permissions are updated, the user must wait for the `onSnapshot` to fire, or the snapshot listener may already be active serving cached Firestore data.

---

### PIR-012: Direct URL Access Bypass on Some Pages

**Severity**: MEDIUM  
**Category**: Navigation Security  

**Description**: While `RBACGuard` is used on some pages, not all pages have it. A user can type `/org/{orgId}/invoices` in the URL even if their role is "team" (which has `invoices.read: false`). The sidebar might not show the link, but the URL is still accessible if typed directly.

**Verification**: Check each page's root layout/component for RBACGuard usage.

---

### PIR-013: Team Role Can Create Deals Via API

**Severity**: HIGH  
**Category**: Security  
**Affected**: `lib/firestore/deals.ts:40-77`

**Description**: `createDeal()` has no permission check. A team member could create a deal even though `ROLE_DEFAULTS` shows `invoices: { read: false, create: false }` for team members.

---

## Medium Issues

### PIR-014: CurrentMember Role Used Inconsistently

Some components check `currentMember?.role` from the org store, while others check `user.role` from the auth store. These could theoretically differ.

### PIR-015: No Permission Audit Trail

When permissions are denied, `logPermissionDenial()` exists but is only called in a few places.

### PIR-016: Manager Can Bypass Own Restrictions via Direct URL

Managers have `reports: { read: true, create: false, edit: false, delete: false }`. The create/edit buttons might be hidden, but direct API access is not blocked.

---

## Permission Bypass Test Results

| Test | Method | Result |
|------|--------|--------|
| Direct URL to leads | `/org/{orgId}/leads` | ✅ Blocked (sidebar redirects? need to verify page level) |
| Direct URL to invoices | `/org/{orgId}/invoices` for team member | ❌ NOT blocked if URL typed directly — Firestore rules still allow reads |
| Direct Firestore mutation | Browser console `db.collection("leads").add(...)` | ❌ Blocked by Firestore rules (ownerIsCurrentUser check) |
| Direct Firestore reads of other org | Change orgId in query | ❌ Blocked by belongsToOrg check |
| API route bypass | POST to `/api/email/send` | ✅ Fixed (has auth now) |
| Stale token replay | Use old ID token | ❌ Blocked by verifyIdToken |
| Editing org_members directly | `db.collection("organization_members").doc(...).update(...)` | ❌ Blocked by rules (admin only) |