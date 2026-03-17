/**
 * Permission Validation Utility
 * 
 * Centralized permission checking for backend CRUD operations.
 * Provides server-side validation of user permissions for Task and Project modules.
 * 
 * IMPORTANT: This is for backend/server-side validation only.
 * Frontend should use the `usePermission` hook for UI controls.
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getUserProfile } from "../firestore/users";
import type { 
  UserRole, 
  UserPermissions, 
  ModuleKey,
  ActionKey 
} from "@/types/crm";
import { ROLE_DEFAULTS } from "@/types/crm";

// Cache for user permissions to reduce Firestore reads
const permissionCache = new Map<string, { permissions: UserPermissions; role: UserRole; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get user permissions with caching
 */
async function getUserPermissionsWithCache(userId: string): Promise<{ permissions: UserPermissions; role: UserRole }> {
  const cached = permissionCache.get(userId);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return { permissions: cached.permissions, role: cached.role };
  }
  
  const { user: userProfile, error } = await getUserProfile(userId);
  if (!userProfile || error) {
    throw new Error(`User profile not found for ID: ${userId}: ${error}`);
  }
  
  const permissions = userProfile.permissions || ROLE_DEFAULTS[userProfile.role];
  const result = { permissions, role: userProfile.role };
  
  permissionCache.set(userId, { ...result, timestamp: now });
  return result;
}

/**
 * Clear permission cache for a user (call when permissions change)
 */
export function clearPermissionCache(userId: string): void {
  permissionCache.delete(userId);
}

/**
 * Check if user has permission for a specific action on a module
 */
export async function hasPermission(
  userId: string,
  module: ModuleKey,
  action: ActionKey
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const { permissions, role } = await getUserPermissionsWithCache(userId);
    
    // Admin bypass - can do everything
    if (role === "admin") {
      return { allowed: true };
    }
    
    const modulePerm = permissions[module];
    if (!modulePerm) {
      return { allowed: false, reason: `No permissions defined for module: ${module}` };
    }
    
    // Handle feature toggles (marketing AI features)
    if ("enabled" in modulePerm) {
      const enabled = (modulePerm as { enabled: boolean }).enabled;
      return { allowed: enabled, reason: enabled ? undefined : `Feature ${module} is disabled` };
    }
    
    // Handle module permissions (leads, contacts, tasks, etc.)
    if (typeof modulePerm === "object" && action in modulePerm) {
      // Special handling for edit permission (editAll also grants edit)
      if (action === "edit") {
        const editPerm = (modulePerm as { edit: boolean; editAll: boolean }).edit;
        const editAllPerm = (modulePerm as { editAll: boolean }).editAll;
        const allowed = editPerm || editAllPerm;
        return { 
          allowed, 
          reason: allowed ? undefined : `No edit permission for module: ${module}` 
        };
      }
      
      const allowed = (modulePerm as Record<ActionKey, boolean>)[action];
      return { 
        allowed, 
        reason: allowed ? undefined : `No ${action} permission for module: ${module}` 
      };
    }
    
    return { allowed: false, reason: `Action ${action} not defined for module: ${module}` };
  } catch (error: any) {
    console.error("❌ Permission check failed:", error.message);
    return { allowed: false, reason: `Permission check error: ${error.message}` };
  }
}

/**
 * Validate task-specific permissions with ownership check
 */
export async function validateTaskPermission(
  taskId: string | null, // null for create operations
  action: "read" | "create" | "update" | "delete",
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // First check basic module permission
  const moduleAction: ActionKey = action === "read" ? "read" : 
                                 action === "create" ? "create" :
                                 action === "update" ? "edit" : "delete";
  
  const moduleCheck = await hasPermission(userId, "tasks", moduleAction);
  if (!moduleCheck.allowed) {
    return moduleCheck;
  }
  
  // For create operations, no ownership check needed
  if (action === "create") {
    return { allowed: true };
  }
  
  // For read/update/delete, we need the task document to check ownership
  if (!taskId) {
    return { allowed: false, reason: "Task ID required for ownership check" };
  }
  
  try {
    const taskDoc = await getDoc(doc(db, "tasks", taskId));
    if (!taskDoc.exists()) {
      return { allowed: false, reason: "Task not found" };
    }
    
    const task = taskDoc.data();
    const taskOwnerId = task.ownerId;
    const isOwner = taskOwnerId === userId;
    
    // Get user permissions for editAll check
    const { permissions } = await getUserPermissionsWithCache(userId);
    const tasksPerm = permissions.tasks;
    const canEditAll = typeof tasksPerm === "object" && "editAll" in tasksPerm 
      ? (tasksPerm as { editAll: boolean }).editAll 
      : false;
    
    // Permission logic based on action
    switch (action) {
      case "read":
        // All authenticated users can read (handled by Firestore rules)
        return { allowed: true };
        
      case "update":
        // Can update if: is owner OR has editAll permission
        if (isOwner || canEditAll) {
          return { allowed: true };
        }
        return { allowed: false, reason: "Not authorized to update this task" };
        
      case "delete":
        // Can delete if: is owner OR is admin (admin check already done in hasPermission)
        // For non-admins, need to check ownership
        const { role } = await getUserPermissionsWithCache(userId);
        if (role === "admin" || isOwner) {
          return { allowed: true };
        }
        return { allowed: false, reason: "Only task owner or admin can delete tasks" };
        
      default:
        return { allowed: false, reason: `Unsupported action: ${action}` };
    }
  } catch (error: any) {
    console.error("❌ Task permission validation failed:", error.message);
    return { allowed: false, reason: `Validation error: ${error.message}` };
  }
}

/**
 * Validate project-specific permissions with ownership check
 */
export async function validateProjectPermission(
  projectId: string | null, // null for create operations
  action: "read" | "create" | "update" | "delete",
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // First check basic module permission
  const moduleAction: ActionKey = action === "read" ? "read" : 
                                 action === "create" ? "create" :
                                 action === "update" ? "edit" : "delete";
  
  const moduleCheck = await hasPermission(userId, "projects", moduleAction);
  if (!moduleCheck.allowed) {
    return moduleCheck;
  }
  
  // For create operations, no ownership check needed
  if (action === "create") {
    return { allowed: true };
  }
  
  // For read/update/delete, we need the project document to check ownership
  if (!projectId) {
    return { allowed: false, reason: "Project ID required for ownership check" };
  }
  
  try {
    const projectDoc = await getDoc(doc(db, "projects", projectId));
    if (!projectDoc.exists()) {
      return { allowed: false, reason: "Project not found" };
    }
    
    const project = projectDoc.data();
    const projectOwnerId = project.ownerId;
    const isOwner = projectOwnerId === userId;
    
    // Get user permissions for editAll check
    const { permissions } = await getUserPermissionsWithCache(userId);
    const projectsPerm = permissions.projects;
    const canEditAll = typeof projectsPerm === "object" && "editAll" in projectsPerm 
      ? (projectsPerm as { editAll: boolean }).editAll 
      : false;
    
    // Permission logic based on action
    switch (action) {
      case "read":
        // All authenticated users can read (handled by Firestore rules)
        return { allowed: true };
        
      case "update":
        // Can update if: is owner OR has editAll permission
        if (isOwner || canEditAll) {
          return { allowed: true };
        }
        return { allowed: false, reason: "Not authorized to update this project" };
        
      case "delete":
        // Can delete if: is owner OR is admin (admin check already done in hasPermission)
        // For non-admins, need to check ownership
        const { role } = await getUserPermissionsWithCache(userId);
        if (role === "admin" || isOwner) {
          return { allowed: true };
        }
        return { allowed: false, reason: "Only project owner or admin can delete projects" };
        
      default:
        return { allowed: false, reason: `Unsupported action: ${action}` };
    }
  } catch (error: any) {
    console.error("❌ Project permission validation failed:", error.message);
    return { allowed: false, reason: `Validation error: ${error.message}` };
  }
}

/**
 * Check if user can edit all records in a module (not just own)
 */
export async function canEditAll(
  userId: string,
  module: Extract<ModuleKey, "leads" | "contacts" | "companies" | "deals" | "projects" | "tasks" | "invoices" | "reports">
): Promise<boolean> {
  try {
    const { permissions, role } = await getUserPermissionsWithCache(userId);
    
    // Admin can edit all
    if (role === "admin") {
      return true;
    }
    
    const modulePerm = permissions[module];
    if (!modulePerm || typeof modulePerm !== "object") {
      return false;
    }
    
    return "editAll" in modulePerm ? (modulePerm as { editAll: boolean }).editAll : false;
  } catch (error) {
    console.error("❌ canEditAll check failed:", error);
    return false;
  }
}

/**
 * Log permission denial for audit purposes
 */
export async function logPermissionDenial(
  userId: string,
  resourceType: string,
  resourceId: string | null,
  action: string,
  reason: string
): Promise<void> {
  // In a production system, this would write to an audit log
  console.warn(`[RBAC DENIED] User ${userId} attempted ${action} on ${resourceType} ${resourceId || '(create)'}: ${reason}`);
  
  // TODO: Integrate with audit log system
  // await createAuditLog({
  //   userId,
  //   action: "permission_denied",
  //   resourceType,
  //   resourceId,
  //   details: { reason, attemptedAction: action },
  //   timestamp: new Date().toISOString()
  // });
}