# Permission Architecture — Reverse-Engineered

## 1. Permission Storage Model

### 1.1 Two-Permission Storage Locations

Permissions are stored in **two separate Firestore documents** — but only one is saved to, and a different one is loaded from:

| Location | Document Path | Contains | Used By |
|----------|--------------|----------|---------|
| **users** | `users/{uid}` | `role`, `permissions` (nested UserPermissions), `isActive`, `isFirstLogin`, `isOnboarded` | `AuthProvider` (reads via `onSnapshot`) |
| **organization_members** | `organization_members/{orgId}_{userId}` | `role`, `permissions` (nested UserPermissions), `status` | `updateMemberPermissionsAction` (saves to) |

### 1.2 Data Flow Diagram

```
Admin changes permissions
        │
        ▼
  MemberPermissionsModal
        │
        ▼
  updateMemberPermissionsAction (server action)
        │
        ├──▶ SAVES TO: organization_members/{orgId}_{userId}.permissions  ✅
        │
        └──▶ DOES NOT UPDATE: users/{uid}.permissions                      ❌
        │
        └──▶ (ONLY updates users/{uid}.role if role changed)               ⚠️
```

```
User logs in / refreshes
        │
        ▼
  AuthProvider (onAuthStateChanged → onSnapshot)
        │
        ├──▶ LISTENS TO: users/{uid}                                       ✅
        │       ├── reads userData.permissions → undefined (never set here)
        │       └── reads userData.role → "manager"
        │
        └──▶ NEVER LISTENS TO: organization_members/{orgId}_{userId}       ❌
```

```
UI renders
        │
        ▼
  usePermission hook → can(module, action)
        │
        ├──▶ user.role === "admin" → true (bypass)
        │
        └──▶ user.permissions → undefined (came from users/{uid})
                │
                ▼
          ROLE_DEFAULTS[user.role] → manager defaults
                │
                ▼
          leads: { read: true, create: true, edit: true, delete: false, editAll: true }  ✅ Manager sees everything
```

## 2. Architectural Root Causes

### RCA-1: Write/Read Disconnect

**Save path**: `updateMemberPermissionsAction` (admin-users.ts:370-374)
```
adminDb.collection("organization_members").doc(targetMemberId).update({
  role: data.role,
  permissions: data.permissions,   // Written here
  updatedAt: new Date(),
});
```

**Load path**: `AuthProvider` (AuthProvider.tsx:37, 74)
```
const userRef = doc(db, "users", firebaseUser.uid);   // ← different document!
...
permissions: userData.permissions,                       // ← reads from users/{uid}
```

**Severity**: CRITICAL — This is the primary root cause. Permissions set by admin are never seen by the application.

### RCA-2: No Organization-Member Listener

`AuthProvider` only subscribes to `users/{uid}` via `onSnapshot`. It never subscribes to `organization_members/{orgId}_{userId}`. When permissions change in the member document, the UI has no way to know.

### RCA-3: Fallback Masking

When `user.permissions` is `undefined` (always via the current load path), the `usePermission` hook falls back to `ROLE_DEFAULTS[user.role]` (usePermission.tsx:22). Since the role is loaded correctly from `users/{uid}`, the fallback gives the user full role-based defaults — making the permission editor's customizations completely invisible.

### RCA-4: No Permission Cache Flush After Update

The `updateMemberPermissionsAction` server action (admin-users.ts) does not return the caller's UID or target UID for cache flushing. The `clearPermissionCache()` function exists (permission-utils.ts:59) but is never called after `updateMemberPermissionsAction`.

### RCA-5: Client-Side Permission-Utils Cache

`permission-utils.ts:29-30` has a 5-minute in-memory cache:
```typescript
const permissionCache = new Map<string, { permissions: UserPermissions; role: UserRole; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```
This cache is only used by `getUserPermissionsWithCache()`, which is called by `hasPermission()`, `validateTaskPermission()`, and `validateProjectPermission()`. These functions are used in some server actions and data-layer functions. The cache means that even after permissions are updated, the data layer might return stale results for 5 minutes.

### RCA-6: Firebase Rules Ignore Custom Permissions

Firestore security rules (`firestore.rules`) use:
- `isOrgAdmin(orgId)` — checks role === "admin" in organization_members
- `isOrgManager(orgId)` — checks role === "manager" || "admin" in organization_members
- `canEditRecord(orgId)` — isOrgManager || isRecordOwner
- `canDeleteRecord(orgId)` — isOrgAdmin only

The rules do NOT check custom `permissions` from `UserPermissions`. This means:
- A team member with `leads.delete: false` in their custom permissions could still delete leads via direct Firestore access because the rules allow delete if `isOrgAdmin(orgId)` — but wait, team members aren't admins, so `canDeleteRecord` returns false. So the actual gap is:
- A team member whose admin set `invoices.read: false` could STILL read invoices by directly querying Firestore, because the rules for invoices only check `isOrgManager(orgId)`.
- There is NO rule-level enforcement of custom UserPermissions at all.

### RCA-7: Two Permission Update Entry Points

There are two ways to update user permissions:

**Entry Point A: MemberPermissionsModal**
- Uses `updateMemberPermissionsAction` (admin-users.ts:313)
- Saves to `organization_members/{orgId}_{userId}`
- Called from the team/users pages

**Entry Point B: EditUserDialog**
- Uses `updateUserAction` (admin-users.ts:407)
- Saves to `users/{uid}`
- Called from Admin Panel (separate location)

Both write to different documents. The application (AuthProvider) reads from `users/{uid}`. So only EditUserDialog's permission changes would take effect — but the actual permission editing UI (MemberPermissionsModal) writes to the wrong document.

## 3. Permission Cache Architecture

```
AuthProvider (onSnapshot) → user.permissions (from users/{uid})
        │
        ▼
  useAuth() hook → useAuthStore (Zustand, in-memory)
        │
        ▼
  usePermission() hook → useMemo → ROLE_DEFAULTS fallback
        │
        ├──▶ can() — synchronous, reads from Zustand
        ├──▶ hasFeature() — synchronous
        ├──▶ canEditAll() — synchronous
        └──▶ getEnabledModules() — synchronous
```

```
permission-utils.ts (server action / data layer calls)
        │
        ▼
  getUserPermissionsWithCache(userId) → 5-min memory cache
        │
        ├──▶ hasPermission(userId, module, action) → async
        ├──▶ validateTaskPermission(taskId, action, userId) → async
        └──▶ validateProjectPermission(projectId, action, userId) → async
```

## 4. Permission Update Lifecycle

### Current (Broken) Flow:

```
1. Admin opens MemberPermissionsModal
2. Admin toggles leads.delete = false for a manager
3. Admin clicks Save
4. updateMemberPermissionsAction called
5. ✅ Permissions written to organization_members/{orgId}_{userId}
6. role was already the same → no sync to users/{uid}
7. ❌ permissions NOT synced to users/{uid}
8. ❌ clearPermissionCache NOT called on client
9. Manager's app session still has old data from users/{uid}
10. user.permissions = undefined → falls back to ROLE_DEFAULTS
11. ❌ Manager still sees/does everything
```

## 5. UI Permission Check Points

| Component | Check Method | Data Source | Trustable? |
|-----------|-------------|-------------|-----------|
| Sidebar | `can(module, "read")` | user.permissions from Zustand | ❌ Reads from wrong doc |
| Page-level (RBACGuard) | `can(module, action)` | user.permissions from Zustand | ❌ Same issue |
| Component (PermissionGate) | `can(module, action)` | user.permissions from Zustand | ❌ Same issue |
| Button visibility | `can(module, "create")` | user.permissions from Zustand | ❌ Same issue |
| Edit button visibility | `can(module, "edit")` | user.permissions from Zustand | ❌ Same issue |
| Delete button | `currentMember?.role === "admin" || "manager"` | org store `currentMember.role` | ✅ Reads org role correctly |
| Financial hiding | `currentMember?.role === "admin" || "manager"` | org store | ✅ Reads org role correctly |

## 6. Server Action Permission Checks

| Server Action | Permission Check | Method | Correct? |
|--------------|-----------------|--------|----------|
| updateMemberPermissionsAction | Caller is admin/manager | `adminDb.collection("organization_members")` | ✅ |
| updateUserAction | Caller is admin | `verifyCallerIsAdmin` | ✅ |
| createDeal | Module-level edit | `hasPermission(userId, "leads", "edit")` | ⚠️ Uses client SDK |
| dashboard stats | Session verified | `auth()` from server-auth | ✅ |
| AI guard | Session + rate limit | `aiAccessDenied` | ✅ |

## 7. Firestore Rule Gaps

| Collection | Read Rule | Create Rule | Update Rule | Delete Rule | Custom Permission Check |
|-----------|-----------|-------------|-------------|-------------|------------------------|
| leads | org member | org member + owner | manager+ or owner | admin only | ❌ None |
| contacts | org member | org member + owner | manager+ or owner | admin only | ❌ None |
| companies | org member | org member + owner | manager+ or owner | admin only | ❌ None |
| deals | org member | org member + owner | manager+ or owner | admin only | ❌ None |
| invoices | manager+ | manager+ + owner | manager+ | admin only | ❌ None |
| projects | org member | manager+ + owner | manager+ or owner | admin or owner | ❌ None |
| tasks | org member | org member + owner | manager+ or owner/assignee | admin or owner | ❌ None |
| notes | org member | org member + owner | manager+ or owner | admin or owner | ❌ None |
| **Custom UserPermissions** | — | — | — | — | **❌ NOT ENFORCED ANYWHERE** |

The Firestore rules only check **role hierarchy** (admin > manager > team), not the granular `UserPermissions` structure. If an admin sets `leads.read: false` for a team member, the Firestore rules still allow the read because `belongsToOrg(orgId)` passes.