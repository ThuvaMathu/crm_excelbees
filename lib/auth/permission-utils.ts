/**
 * Permission Validation Utility
 *
 * Centralized permission checking for CRUD operations on Task/Project (and,
 * via `hasPermission`, other) modules.
 *
 * Permissions are org-scoped: the source of truth is
 * `organization_members/{organizationId}_{userId}`, kept up to date by
 * MemberPermissionsModal / updateMemberPermissionsAction. This module reads
 * that document directly rather than the global `users/{uid}` doc, which no
 * longer carries authoritative permissions.
 *
 * NOTE: This module uses the Firebase *client* SDK (`../firebase`) because
 * it is called directly from client components as well as from the
 * client-SDK-based firestore/*.ts data layer that also runs inside server
 * actions. It is therefore NOT a hard security boundary by itself — a
 * malicious client could bypass it. Real enforcement must come from
 * Firestore Security Rules. API routes and server actions that need a
 * trustworthy server-side check should use `lib/auth/api-auth.ts` (Admin
 * SDK + verified ID token) instead.
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { logger } from "@/lib/logger/client";
import type {
  UserRole,
  UserPermissions,
  ModuleKey,
  ActionKey
} from "@/types/crm";
import { ROLE_DEFAULTS } from "@/types/crm";

// Cache for user permissions to reduce Firestore reads. Keyed by
// `${organizationId}_${userId}` since permissions are org-scoped.
const permissionCache = new Map<string, { permissions: UserPermissions; role: UserRole; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get a user's org-scoped role + permissions (from organization_members), with caching.
 */
async function getUserPermissionsWithCache(userId: string, organizationId: string): Promise<{ permissions: UserPermissions; role: UserRole }> {
  const cacheKey = `${organizationId}_${userId}`;
  const cached = permissionCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return { permissions: cached.permissions, role: cached.role };
  }

  const memberSnap = await getDoc(doc(db, "organization_members", cacheKey));
  if (!memberSnap.exists() || memberSnap.data().status !== "active") {
    throw new Error(`Active organization membership not found for user ${userId} in org ${organizationId}`);
  }

  const member = memberSnap.data();
  const role: UserRole = member.role || "team";
  const permissions: UserPermissions = member.permissions || ROLE_DEFAULTS[role];

  const result = { permissions, role };
  permissionCache.set(cacheKey, { ...result, timestamp: now });
  return result;
}

/**
 * Clear permission cache for a user. Pass organizationId to clear a single
 * org's entry, or omit it to clear every cached org membership for that user.
 */
export function clearPermissionCache(userId: string, organizationId?: string): void {
  if (organizationId) {
    permissionCache.delete(`${organizationId}_${userId}`);
    return;
  }
  for (const key of permissionCache.keys()) {
    if (key.endsWith(`_${userId}`)) permissionCache.delete(key);
  }
}

/**
 * Check if user has permission for a specific action on a module, within a given org.
 */
export async function hasPermission(
  userId: string,
  organizationId: string,
  module: ModuleKey,
  action: ActionKey
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const { permissions, role } = await getUserPermissionsWithCache(userId, organizationId);

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
  } catch (error) {
    logger.warn("Permission check failed", { module: "permissions", action: "has-permission", userId, organizationId, error });
    return { allowed: false, reason: `Permission check error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Record-scoped "edit" check, mirroring the Firestore rules'
 * `canEditRecordWithPerms`: allowed if the caller has `editAll` (a blanket
 * grant, independent of role — an admin can grant it to any member), OR the
 * caller owns the record and has `edit`.
 */
export async function canEditRecord(
  userId: string,
  organizationId: string,
  module: Extract<ModuleKey, "leads" | "contacts" | "companies" | "deals" | "projects" | "tasks" | "invoices" | "reports">,
  ownerId: string | undefined
): Promise<{ allowed: boolean; reason?: string }> {
  const editAllCheck = await hasPermission(userId, organizationId, module, "editAll");
  if (editAllCheck.allowed) return editAllCheck;
  if (ownerId && ownerId === userId) {
    return hasPermission(userId, organizationId, module, "edit");
  }
  return { allowed: false, reason: `No edit permission for module: ${module}` };
}

/**
 * Validate task-specific permissions with ownership check
 */
export async function validateTaskPermission(
  taskId: string | null, // null for create operations
  action: "read" | "create" | "update" | "delete",
  userId: string,
  organizationId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // First check basic module permission
  const moduleAction: ActionKey = action === "read" ? "read" :
                                 action === "create" ? "create" :
                                 action === "update" ? "edit" : "delete";

  const moduleCheck = await hasPermission(userId, organizationId, "tasks", moduleAction);
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
    const { permissions } = await getUserPermissionsWithCache(userId, organizationId);
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
        const { role } = await getUserPermissionsWithCache(userId, organizationId);
        if (role === "admin" || isOwner) {
          return { allowed: true };
        }
        return { allowed: false, reason: "Only task owner or admin can delete tasks" };
        
      default:
        return { allowed: false, reason: `Unsupported action: ${action}` };
    }
  } catch (error) {
    logger.warn("Task permission validation failed", { module: "permissions", action: "validate-task", userId, organizationId, error });
    return { allowed: false, reason: `Validation error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Validate project-specific permissions with ownership check
 */
export async function validateProjectPermission(
  projectId: string | null, // null for create operations
  action: "read" | "create" | "update" | "delete",
  userId: string,
  organizationId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // First check basic module permission
  const moduleAction: ActionKey = action === "read" ? "read" :
                                 action === "create" ? "create" :
                                 action === "update" ? "edit" : "delete";

  const moduleCheck = await hasPermission(userId, organizationId, "projects", moduleAction);
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
    const { permissions } = await getUserPermissionsWithCache(userId, organizationId);
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
        const { role } = await getUserPermissionsWithCache(userId, organizationId);
        if (role === "admin" || isOwner) {
          return { allowed: true };
        }
        return { allowed: false, reason: "Only project owner or admin can delete projects" };
        
      default:
        return { allowed: false, reason: `Unsupported action: ${action}` };
    }
  } catch (error) {
    logger.warn("Project permission validation failed", { module: "permissions", action: "validate-project", userId, organizationId, error });
    return { allowed: false, reason: `Validation error: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Check if user can edit all records in a module (not just own)
 */
export async function canEditAll(
  userId: string,
  organizationId: string,
  module: Extract<ModuleKey, "leads" | "contacts" | "companies" | "deals" | "projects" | "tasks" | "invoices" | "reports">
): Promise<boolean> {
  try {
    const { permissions, role } = await getUserPermissionsWithCache(userId, organizationId);

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
    logger.warn("canEditAll check failed", { module: "permissions", action: "can-edit-all", userId, organizationId, error });
    return false;
  }
}

/**
 * Log permission denial to the audit_logs collection and console.
 */
export async function logPermissionDenial(
  userId: string,
  resourceType: string,
  resourceId: string | null,
  action: string,
  reason: string
): Promise<void> {
  logger.warn("Permission denied", {
    module: "permissions",
    action,
    userId,
    metadata: { resourceType, resourceId: resourceId || null, reason },
  });

  try {
    const { createAuditLog } = await import("@/lib/firestore/audit-logs");
    await createAuditLog({
      action: "permission_denied",
      performedBy: userId,
      performedByName: userId,
      targetUserId: resourceId || undefined,
      targetUserName: resourceType,
      details: { attemptedAction: action, reason },
    });
  } catch (err) {
    logger.error("Failed to write audit log", { module: "permissions", action, userId, error: err });
  }
}