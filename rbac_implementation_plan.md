# RBAC Implementation Plan - Task and Project Modules

## Overview
This document outlines the step-by-step technical implementation plan to fix the critical RBAC security vulnerabilities identified in the audit report. The plan follows a layered security approach: database rules → backend validation → frontend enforcement.

## Implementation Phases

### Phase 1: Foundation - Update Role Defaults (P0)
**Objective:** Correct the base permission templates for all roles.

#### 1.1 Update ROLE_DEFAULTS in types/crm.ts
```typescript
// Current incorrect configuration (simplified):
manager: {
  tasks: { read: true, create: true, edit: true, delete: true, editAll: true },
  projects: { read: true, create: true, edit: true, delete: true, editAll: true },
},
team: {
  tasks: { read: true, create: true, edit: true, delete: false, editAll: false },
  projects: { read: true, create: false, edit: false, delete: false, editAll: false },
}

// Required configuration:
manager: {
  tasks: { read: true, create: false, edit: true, delete: false, editAll: true },
  projects: { read: true, create: false, edit: true, delete: false, editAll: true },
},
team: {
  tasks: { read: true, create: false, edit: false, delete: false, editAll: false },
  projects: { read: true, create: false, edit: false, delete: false, editAll: false },
}
```

**Files to Modify:**
- [`types/crm.ts`](types/crm.ts:64-159) - Update `ROLE_DEFAULTS` object

**Validation:**
- Verify role permissions reflect required matrix
- Test that existing user permissions (custom overrides) are preserved

### Phase 2: Database Security - Firestore Rules (P0)
**Objective:** Implement granular, role-based security at the database level.

#### 2.1 Create Helper Functions in firestore.rules
```javascript
// Add to helper functions section
function canCreateTask() {
  return isAdmin() || 
         (isApproved() && getUserData().role == 'team' && 
          getUserData().permissions?.tasks?.create == true);
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

// Similar functions for projects
```

#### 2.2 Implement Task Collection Rules
```javascript
match /tasks/{taskId} {
  // Read: All approved users can read
  allow read: if isAuthenticated() && isApproved();
  
  // Create: Admin or users with create permission
  allow create: if isAuthenticated() && isApproved() && 
                 (isAdmin() || 
                  getUserData().permissions?.tasks?.create == true);
  
  // Update: Admin, manager with edit permission, or owner
  allow update: if isAuthenticated() && isApproved() && 
                 (isAdmin() ||
                  (isManager() && getUserData().permissions?.tasks?.edit == true) ||
                  resource.data.ownerId == request.auth.uid);
  
  // Delete: Admin or owner only
  allow delete: if isAuthenticated() && isApproved() && 
                 (isAdmin() || resource.data.ownerId == request.auth.uid);
}
```

#### 2.3 Implement Project Collection Rules
```javascript
match /projects/{projectId} {
  // Read: All approved users can read
  allow read: if isAuthenticated() && isApproved();
  
  // Create: Admin only (managers cannot create)
  allow create: if isAuthenticated() && isApproved() && isAdmin();
  
  // Update: Admin, manager with edit permission, or owner
  allow update: if isAuthenticated() && isApproved() && 
                 (isAdmin() ||
                  (isManager() && getUserData().permissions?.projects?.edit == true) ||
                  resource.data.ownerId == request.auth.uid);
  
  // Delete: Admin or owner only
  allow delete: if isAuthenticated() && isApproved() && 
                 (isAdmin() || resource.data.ownerId == request.auth.uid);
}
```

**Files to Modify:**
- [`firestore.rules`](firestore.rules) - Replace lines 109-115 with detailed rules

**Validation:**
- Deploy and test rules with Firebase Emulator
- Verify each role can only perform allowed operations
- Test edge cases (non-existent documents, malformed data)

### Phase 3: Backend Validation - CRUD Functions (P0)
**Objective:** Add permission checks to all backend CRUD operations.

#### 3.1 Create Permission Validation Utility
```typescript
// lib/auth/permission-utils.ts
import { getAuth } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { ROLE_DEFAULTS } from "@/types/crm";

export async function validateTaskPermission(
  taskId: string, 
  action: 'read' | 'create' | 'update' | 'delete',
  currentUserId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Implementation details...
}

export async function validateProjectPermission(
  projectId: string,
  action: 'read' | 'create' | 'update' | 'delete', 
  currentUserId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Implementation details...
}
```

#### 3.2 Update Task CRUD Functions
**Modify `createTask` in [`lib/firestore/tasks.ts`](lib/firestore/tasks.ts:114):**
```typescript
export async function createTask(data: TaskInput, userId: string): Promise<...> {
  // Check if user has create permission
  const { allowed, reason } = await validateTaskPermission(null, 'create', userId);
  if (!allowed) {
    return { success: false, id: null, error: reason || "Permission denied" };
  }
  // Rest of existing logic...
}
```

**Modify `updateTask` in [`lib/firestore/tasks.ts`](lib/firestore/tasks.ts:361):**
```typescript
export async function updateTask(id: string, data: Partial<TaskInput>, currentUserId?: string): Promise<...> {
  if (!currentUserId) {
    return { success: false, error: "User ID required for permission check" };
  }
  
  const { allowed, reason } = await validateTaskPermission(id, 'update', currentUserId);
  if (!allowed) {
    return { success: false, error: reason || "Permission denied" };
  }
  // Rest of existing logic...
}
```

**Modify `deleteTask` in [`lib/firestore/tasks.ts`](lib/firestore/tasks.ts:460):**
```typescript
export async function deleteTask(id: string, currentUserId?: string): Promise<...> {
  if (!currentUserId) {
    return { success: false, error: "User ID required for permission check" };
  }
  
  const { allowed, reason } = await validateTaskPermission(id, 'delete', currentUserId);
  if (!allowed) {
    return { success: false, error: reason || "Permission denied" };
  }
  // Rest of existing logic...
}
```

#### 3.3 Update Project CRUD Functions
Apply similar modifications to:
- [`lib/firestore/projects.ts`](lib/firestore/projects.ts:23) - `createProject`
- [`lib/firestore/projects.ts`](lib/firestore/projects.ts:262) - `updateProject`  
- [`lib/firestore/projects.ts`](lib/firestore/projects.ts:328) - `deleteProject`

**Files to Modify:**
- Create: `lib/auth/permission-utils.ts`
- Update: `lib/firestore/tasks.ts`
- Update: `lib/firestore/projects.ts`

**Validation:**
- Unit tests for permission validation logic
- Integration tests with mock users/roles
- Verify API endpoints reject unauthorized requests

### Phase 4: Frontend Consistency - Component Updates (P1)
**Objective:** Ensure all frontend components use consistent permission checks.

#### 4.1 Standardize on usePermission Hook
Update all components to use the existing `usePermission` hook instead of ad-hoc role checks.

**Current (incorrect) in [`components/tasks/TaskDetailSheet.tsx`](components/tasks/TaskDetailSheet.tsx:181):**
```typescript
const canEdit = user?.role === "admin" ||
    user?.role === "manager" ||
    task?.assigneeId === user?.uid ||
    task?.ownerId === user?.uid;

const canDelete = user?.role === "admin" || user?.role === "manager";
```

**Updated (correct):**
```typescript
const { can, canEditAll, canDelete: canDeletePermission } = usePermission();
const isOwner = task?.ownerId === user?.uid;
const isAssignee = task?.assigneeId === user?.uid;

// Can edit if: has edit permission AND (is owner/assignee OR has editAll)
const canEdit = can("tasks", "edit") && 
                (isOwner || isAssignee || canEditAll("tasks"));

// Can delete if: has delete permission AND (is owner OR is admin)
const canDelete = canDeletePermission("tasks") && 
                  (isOwner || user?.role === "admin");
```

#### 4.2 Update All Task/Project Components
Apply similar updates to:
- [`components/tasks/CreateTaskDialog.tsx`](components/tasks/CreateTaskDialog.tsx) - Check `can("tasks", "create")`
- [`components/projects/CreateProjectDialog.tsx`](components/projects/CreateProjectDialog.tsx) - Check `can("projects", "create")`
- [`components/projects/EditProjectDialog.tsx`](components/projects/EditProjectDialog.tsx) - Check edit permissions
- [`components/projects/ProjectStatusControl.tsx`](components/projects/ProjectStatusControl.tsx) - Already has `canEdit` prop

#### 4.3 Add Permission-Based UI Controls
Ensure buttons, forms, and actions are disabled/hidden based on permissions:
- Hide "Create Project" button for non-admins
- Disable edit/delete buttons for unauthorized users
- Show "Read Only" indicators for team members

**Files to Modify:**
- [`components/tasks/TaskDetailSheet.tsx`](components/tasks/TaskDetailSheet.tsx)
- [`components/tasks/CreateTaskDialog.tsx`](components/tasks/CreateTaskDialog.tsx)
- [`components/projects/CreateProjectDialog.tsx`](components/projects/CreateProjectDialog.tsx)
- [`components/projects/EditProjectDialog.tsx`](components/projects/EditProjectDialog.tsx)
- Any other task/project UI components

**Validation:**
- Manual UI testing with different user roles
- Verify buttons appear/disappear correctly
- Test that disabled operations show appropriate error messages

### Phase 5: Testing & Validation (P1)
**Objective:** Comprehensive testing of the RBAC implementation.

#### 5.1 Test Matrix
Create test cases for each role and operation:

| Test Case | Admin | Manager | Team Member | Creator (Non-Owner) |
|-----------|-------|---------|-------------|---------------------|
| Create Task | ✅ | ❌ | ❌ | ❌ |
| Read Task | ✅ | ✅ | ✅ | ✅ |
| Update Own Task | ✅ | ✅ | ❌ | ✅ |
| Update Other's Task | ✅ | ✅ | ❌ | ❌ |
| Delete Own Task | ✅ | ❌ | ❌ | ✅ |
| Delete Other's Task | ✅ | ❌ | ❌ | ❌ |
| Create Project | ✅ | ❌ | ❌ | ❌ |
| Update Project | ✅ | ✅ | ❌ | ✅ (if owner) |

#### 5.2 Automated Tests
```typescript
// Example test for task permissions
describe("Task RBAC", () => {
  it("should allow admin to delete any task", async () => {
    // Test implementation
  });
  
  it("should prevent manager from deleting tasks", async () => {
    // Test implementation  
  });
  
  it("should prevent team member from editing tasks", async () => {
    // Test implementation
  });
});
```

#### 5.3 Security Penetration Testing
- Attempt to bypass frontend controls via direct API calls
- Test Firestore rules with various user scenarios
- Verify error messages don't leak sensitive information

### Phase 6: Monitoring & Logging (P2)
**Objective:** Add observability for permission-related events.

#### 6.1 Audit Logging
```typescript
// Add to permission validation functions
async function validateTaskPermission(...) {
  // After validation
  await logAuditEvent({
    userId: currentUserId,
    action,
    resourceType: "task",
    resourceId: taskId,
    allowed,
    timestamp: new Date().toISOString()
  });
}
```

#### 6.2 Error Monitoring
- Log permission denials for security analysis
- Alert on suspicious patterns (multiple denials, privilege escalation attempts)

## Implementation Timeline

### Week 1: Critical Fixes (P0)
- Day 1-2: Update `ROLE_DEFAULTS` and deploy
- Day 3-4: Implement Firestore security rules
- Day 5: Update backend CRUD functions with permission checks

### Week 2: Frontend & Testing (P1)
- Day 6-7: Update frontend components
- Day 8-9: Create comprehensive test suite
- Day 10: Security testing and validation

### Week 3: Polish & Monitoring (P2)
- Day 11-12: Add audit logging
- Day 13: Performance optimization
- Day 14: Final security review and deployment

## Rollback Plan
1. Keep backup of original `firestore.rules`
2. Version control all changes
3. Feature flag for new permission logic (optional)
4. Immediate rollback if:
   - Users report being locked out of critical functions
   - Performance degradation observed
   - Security rules cause Firebase errors

## Success Metrics
- **Security:** Zero permission bypass vulnerabilities
- **Usability:** Correct UI behavior for all roles
- **Performance:** < 100ms added latency for permission checks
- **Coverage:** 100% of task/project operations protected

## Dependencies
1. Firebase Admin SDK access for user role lookup
2. Updated user profiles with role/permission data
3. Development environment with test users for each role
4. Firebase Emulator for rules testing

## Risk Mitigation
- **Risk:** Breaking existing functionality
  - **Mitigation:** Comprehensive test suite, gradual rollout
- **Risk:** Performance impact
  - **Mitigation:** Cache user permissions, optimize Firestore queries
- **Risk:** User confusion from changed permissions
  - **Mitigation:** Clear release notes, user training if needed

## Approval Required
- [ ] Security Team Review
- [ ] Product Owner Sign-off  
- [ ] QA Test Plan Approval
- [ ] Deployment Schedule Confirmation

---

*Implementation plan v1.0 - Generated from RBAC Audit Report*