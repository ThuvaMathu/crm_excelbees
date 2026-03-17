# RBAC Implementation - Files Requiring Modification

## Summary
This document lists all files that require modification to implement proper Role-Based Access Control (RBAC) for Task and Project modules, based on the audit findings.

## Files by Priority

### P0 - Critical Security Fixes (Immediate)

#### 1. Firestore Security Rules
**File:** [`firestore.rules`](firestore.rules)
**Lines:** 109-115 (current task/project rules)
**Changes Required:**
- Replace permissive `allow read, write` with granular rules
- Add helper functions for role-based permission checking
- Implement separate create/read/update/delete rules
- Add ownership validation (ownerId checks)

#### 2. Role Default Configuration
**File:** [`types/crm.ts`](types/crm.ts)
**Lines:** 64-159 (ROLE_DEFAULTS object)
**Changes Required:**
- Update `manager` permissions: `create: false, delete: false` for tasks and projects
- Update `team` permissions: `create: false, edit: false` for tasks
- Ensure `editAll: true` for manager (can edit all items)
- Ensure `editAll: false` for team (can only read)

#### 3. Backend Permission Validation (New File)
**File:** `lib/auth/permission-utils.ts` (to be created)
**Purpose:** Centralized permission validation logic
**Functions to Implement:**
- `validateTaskPermission(taskId, action, userId)`
- `validateProjectPermission(projectId, action, userId)`
- `getUserPermissions(userId)`
- Permission caching mechanism

#### 4. Task CRUD Functions
**File:** [`lib/firestore/tasks.ts`](lib/firestore/tasks.ts)
**Functions to Modify:**
- `createTask` (line 114): Add permission check using `validateTaskPermission(null, 'create', userId)`
- `updateTask` (line 361): Add `currentUserId` parameter and permission check
- `deleteTask` (line 460): Add `currentUserId` parameter and permission check
- `archiveTask` (line 24): Add permission check (should follow update rules)
- `unarchiveTask` (line 81): Add permission check

#### 5. Project CRUD Functions
**File:** [`lib/firestore/projects.ts`](lib/firestore/projects.ts)
**Functions to Modify:**
- `createProject` (line 23): Add permission check
- `updateProject` (line 262): Add `currentUserId` parameter and permission check
- `deleteProject` (line 328): Add `currentUserId` parameter and permission check
- `archiveProject` (line 67): Add permission check
- `unarchiveProject` (line 82): Add permission check

### P1 - Frontend Consistency (Within 1 Week)

#### 6. Task Detail Component
**File:** [`components/tasks/TaskDetailSheet.tsx`](components/tasks/TaskDetailSheet.tsx)
**Lines:** 181-187 (current permission logic)
**Changes Required:**
- Replace ad-hoc role checks with `usePermission` hook
- Fix logic: Managers should NOT be able to delete
- Team members should be read-only (no edit even if assignee/owner)
- Add proper `canEditAll` check for managers
- Update UI to show "Read Only" for team members

#### 7. Task Creation Component
**File:** [`components/tasks/CreateTaskDialog.tsx`](components/tasks/CreateTaskDialog.tsx)
**Changes Required:**
- Add permission check at component level: `can("tasks", "create")`
- Hide/disable dialog trigger button for unauthorized users
- Show appropriate error message if permission denied

#### 8. Project Creation Component
**File:** [`components/projects/CreateProjectDialog.tsx`](components/projects/CreateProjectDialog.tsx)
**Changes Required:**
- Add permission check: `can("projects", "create")`
- Only admins should see/create projects (managers cannot create)
- Update UI to reflect permission-based visibility

#### 9. Project Edit Component
**File:** [`components/projects/EditProjectDialog.tsx`](components/projects/EditProjectDialog.tsx)
**Changes Required:**
- Add permission check: `can("projects", "edit")` with ownership validation
- Use `canEditAll` to determine if manager can edit any project
- Disable form fields for read-only users

#### 10. Project Status Control
**File:** [`components/projects/ProjectStatusControl.tsx`](components/projects/ProjectStatusControl.tsx)
**Lines:** Already has `canEdit` prop (line 14-15)
**Changes Required:**
- Ensure parent components pass correct `canEdit` value
- Verify logic aligns with new permission rules

#### 11. Task List/Table Components
**Files to Check:**
- Any task listing components that show edit/delete buttons
- Project listing components with action buttons
**Changes Required:**
- Hide action buttons based on user permissions
- Add permission checks before rendering action menus

### P2 - Additional Components & Utilities (Within 2 Weeks)

#### 12. Permission Hook Enhancement
**File:** [`hooks/usePermission.tsx`](hooks/usePermission.tsx)
**Changes Required:**
- Add `canCreate(module)` helper function
- Add `canUpdate(module, resourceOwnerId)` for ownership checks
- Add `canDelete(module, resourceOwnerId)` helper
- Consider adding caching for better performance

#### 13. Audit Logging
**File:** `lib/firestore/audit-logs.ts` (may need enhancement)
**Changes Required:**
- Log permission denials for security monitoring
- Log successful sensitive operations (delete, etc.)
- Add user context (role, permissions) to audit logs

#### 14. API Route Protection
**Files:** Any API routes that interact with tasks/projects
**Note:** Currently uses client-side Firestore, but if API routes are added:
- Add authentication middleware
- Add permission validation similar to backend functions

#### 15. Test Files
**Files to Create/Update:**
- `__tests__/auth/permission-utils.test.ts`
- `__tests__/firestore/tasks-permissions.test.ts`
- `__tests__/firestore/projects-permissions.test.ts`
- `__tests__/components/tasks/TaskDetailSheet.permissions.test.tsx`

## File Modification Details

### 1. firestore.rules - Detailed Changes
```javascript
// CURRENT (lines 109-115):
match /projects/{projectId} {
  allow read, write: if isAuthenticated() && isApproved();
}
match /tasks/{taskId} {
  allow read, write: if isAuthenticated() && isApproved();
}

// PROPOSED:
// Add helper functions near top (after existing helpers):
function canCreateTask() {
  return isAdmin() || 
         (isApproved() && getUserData().permissions?.tasks?.create == true);
}

function canUpdateTask(taskOwnerId) {
  return isAdmin() ||
         (isManager() && getUserData().permissions?.tasks?.edit == true) ||
         (isOwner(taskOwnerId) && isApproved());
}

function canDeleteTask(taskOwnerId) {
  return isAdmin() ||
         (isOwner(taskOwnerId) && isApproved());
}

// Update task rules:
match /tasks/{taskId} {
  allow read: if isAuthenticated() && isApproved();
  allow create: if isAuthenticated() && isApproved() && 
                 (isAdmin() || getUserData().permissions?.tasks?.create == true);
  allow update: if isAuthenticated() && isApproved() && 
                 (isAdmin() ||
                  (isManager() && getUserData().permissions?.tasks?.edit == true) ||
                  resource.data.ownerId == request.auth.uid);
  allow delete: if isAuthenticated() && isApproved() && 
                 (isAdmin() || resource.data.ownerId == request.auth.uid);
}

// Similar for projects...
```

### 2. types/crm.ts - Detailed Changes
```typescript
// CURRENT manager permissions (lines 97-128):
manager: {
  // CRM Core - Read All, Edit All (except delete some)
  leads: { read: true, create: true, edit: true, delete: true, editAll: true },
  contacts: { read: true, create: true, edit: true, delete: true, editAll: true },
  companies: { read: true, create: true, edit: true, delete: true, editAll: true },
  deals: { read: true, create: true, edit: true, delete: true, editAll: true },
  projects: { read: true, create: true, edit: true, delete: true, editAll: true },
  tasks: { read: true, create: true, edit: true, delete: false, editAll: false }, // Note: delete: false but create: true
  // ...
}

// PROPOSED changes:
manager: {
  // CRM Core - Read All, Edit All, No Create/Delete
  leads: { read: true, create: false, edit: true, delete: false, editAll: true },
  contacts: { read: true, create: false, edit: true, delete: false, editAll: true },
  companies: { read: true, create: false, edit: true, delete: false, editAll: true },
  deals: { read: true, create: false, edit: true, delete: false, editAll: true },
  projects: { read: true, create: false, edit: true, delete: false, editAll: true },
  tasks: { read: true, create: false, edit: true, delete: false, editAll: true }, // Changed: create: false, editAll: true
  // ...
}

// CURRENT team permissions (lines 129-159):
team: {
  // CRM Core - Own Records Only
  leads: { read: true, create: true, edit: true, delete: false, editAll: false },
  contacts: { read: true, create: true, edit: true, delete: false, editAll: false },
  companies: { read: true, create: false, edit: false, delete: false, editAll: false },
  deals: { read: true, create: true, edit: true, delete: false, editAll: false },
  projects: { read: true, create: false, edit: false, delete: false, editAll: false },
  tasks: { read: true, create: true, edit: true, delete: false, editAll: false }, // Note: create: true, edit: true
  // ...
}

// PROPOSED changes:
team: {
  // CRM Core - Read Only
  leads: { read: true, create: false, edit: false, delete: false, editAll: false },
  contacts: { read: true, create: false, edit: false, delete: false, editAll: false },
  companies: { read: true, create: false, edit: false, delete: false, editAll: false },
  deals: { read: true, create: false, edit: false, delete: false, editAll: false },
  projects: { read: true, create: false, edit: false, delete: false, editAll: false },
  tasks: { read: true, create: false, edit: false, delete: false, editAll: false }, // Changed: create: false, edit: false
  // ...
}
```

### 3. TaskDetailSheet.tsx - Detailed Changes
```typescript
// CURRENT (lines 181-187):
const canEdit = user?.role === "admin" ||
    user?.role === "manager" ||
    task?.assigneeId === user?.uid ||
    task?.ownerId === user?.uid;

const canDelete = user?.role === "admin" || user?.role === "manager";

// PROPOSED:
const { can, canEditAll, canDelete: canDeletePermission } = usePermission();
const isOwner = task?.ownerId === user?.uid;
const isAssignee = task?.assigneeId === user?.uid;

// Can edit if: has edit permission AND (is owner/assignee OR has editAll)
const canEdit = can("tasks", "edit") && 
                (isOwner || isAssignee || canEditAll("tasks"));

// Can delete if: has delete permission AND (is owner OR is admin)
const canDelete = canDeletePermission("tasks") && 
                  (isOwner || user?.role === "admin");

// Can create is handled at dialog level
```

## Implementation Order

1. **Phase 1 (Day 1-2):** Update `types/crm.ts` → Test role changes don't break existing functionality
2. **Phase 2 (Day 3-4):** Create `lib/auth/permission-utils.ts` → Update backend CRUD functions
3. **Phase 3 (Day 5):** Update `firestore.rules` → Test with Firebase Emulator
4. **Phase 4 (Day 6-7):** Update frontend components starting with `TaskDetailSheet.tsx`
5. **Phase 5 (Day 8-10):** Update remaining components → Comprehensive testing

## Testing Checklist

For each modified file:
- [ ] Unit tests pass
- [ ] Integration tests with different user roles
- [ ] Firestore rules tested with emulator
- [ ] UI behaves correctly (buttons show/hide appropriately)
- [ ] Error messages are user-friendly
- [ ] No performance regression

## Rollback Instructions

If issues arise, revert in this order:
1. Revert `firestore.rules` to original
2. Revert backend function signatures (remove `currentUserId` params if causing issues)
3. Revert frontend components to use simple role checks temporarily
4. Keep `types/crm.ts` changes as they're non-breaking

## Dependencies Between Files

```
types/crm.ts (ROLE_DEFAULTS)
        ↓
hooks/usePermission.tsx (reads defaults)
        ↓
components/* (use the hook)
        ↓
lib/auth/permission-utils.ts (validates)
        ↓
lib/firestore/*.ts (CRUD functions)
        ↓
firestore.rules (final enforcement)
```

## Notes

1. **Backward Compatibility:** Existing users with custom permissions should be preserved
2. **Performance:** Permission checks should be cached where possible
3. **Error Handling:** Permission denials should log but not expose internal details
4. **User Experience:** Unauthorized actions should show clear, helpful messages

---

*Last Updated: 2026-03-17*  
*Based on RBAC Audit Report v1.0*