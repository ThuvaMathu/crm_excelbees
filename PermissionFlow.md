# Permission Flow — End-to-End Lifecycle

## 1. Current (Broken) Flow

```
Admin Login
    │
    ▼
  Organization → Team → MemberPermissionsModal
    │
    ▼
  Select target user (manager role)
    │
    ▼
  Toggle leads.read = false
    │
    ▼
  Click Save
    │
    ▼
  updateMemberPermissionsAction called
    │
    ├── 1. verifyIdToken(callerToken)                     ✅ Validates caller
    ├── 2. Get caller org member doc                      ✅ Validates admin/manager
    ├── 3. Validate restrictions (manager can't elevate)  ✅
    │
    ├── 4. WRITE to: organization_members/{orgId}_{userId}  ✅
    │      ├── role: "manager"
    │      └── permissions: { leads: { read: false, ... } }
    │
    ├── 5. Role same? → no sync to users/{uid}            ⚠️
    │      (role: "manager" didn't change)
    │
    └── 6. No clearPermissionCache called                  ❌
```

```
Manager Login (after permission update)
    │
    ▼
  AuthProvider fires onAuthStateChanged
    │
    ▼
  onSnapshot(users/{uid}) fires                              ❌ Wrong doc
    │
    ├── userData = { role: "manager", permissions: undefined }
    │
    ▼
  setUser({ ...userData, permissions: undefined })
    │
    ▼
  usePermission hook: user.permissions === undefined
    │
    ▼
  FALLBACK: ROLE_DEFAULTS["manager"]
    │
    ├── leads = { read: true, create: true, edit: true, delete: false, editAll: true }
    │         ^^^^^^^^ should be false but default is true
    │
    ▼
  Sidebar: can("leads", "read") → true                     ❌ Should be false
  Leads page: can("leads", "create") → true                ❌ Should be true (wasn't changed)
  Leads Detail: can("leads", "delete") → false             ✅ Correct (manager default = false)
```

## 2. Required (Fixed) Flow

```
Admin saves permissions
    │
    ▼
  updateMemberPermissionsAction
    │
    ├── 1. Write to organization_members/{orgId}_{userId}   ✅
    │
    ├── 2. SYNC to users/{uid}.permissions                   🔧 Fix
    │
    ├── 3. Update custom claims with permissions hash        🔧 Fix (optional)
    │
    └── 4. Return targetUserId in response                   🔧 Fix
```

```
Client receives response
    │
    ▼
  MemberPermissionsModal.onSaved()
    │
    ├── clearPermissionCache(targetUserId)                    🔧 Fix
    │
    └── Refresh user list
```

```
Target user's app session
    │
    ▼
  onSnapshot(users/{uid}) fires with new data
    │
    ├── userData = { role: "manager", permissions: { leads: { read: false, ... } } }
    │
    ▼
  usePermission: user.permissions = custom permissions       ✅ Correct
    │
    ▼
  can("leads", "read") → false                                ✅ Correct
  Sidebar hides Leads link                                    ✅ Correct
  Leads page redirects to /org                                ✅ Correct
```

## 3. Permission Cascade Points

### UI Layer (what user sees)
```
Sidebar → can(module, "read") → hides nav items
Page → RBACGuard → can(module, "read") → redirects if denied
Component → PermissionGate → can(module, action) → hides elements
Button → {can(module, "create") && <CreateButton/>}
```

### Data Layer (what user can do)
```
Client CRUD → hasPermission(userId, module, action) → blocks operation
Server Action → auth() + hasPermission() → blocks server-side
API Route → verifyApiRequest() + custom check → blocks API
```

### Firebase Layer (what attacker can do)
```
Direct Firestore read → Firestore rules → isOrgManager() → role-only check
Direct Firestore write → Firestore rules → isOrgAdmin()/isOrgManager() → role-only check
```

## 4. Permission Resolution Order

```
Current (Broken):
  user.permissions === undefined
    → ROLE_DEFAULTS[user.role] → full defaults used
    → Custom permissions IGNORED

Required (Fixed):
  user.permissions exists (custom)?
    → YES: use custom permissions
    → NO: fall back to ROLE_DEFAULTS[user.role]
```