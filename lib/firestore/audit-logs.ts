/**
 * Audit Logs - User Management Action Tracking
 *
 * Tracks all user management actions for security audit trails.
 *
 * NOTE: This module uses the Firebase *client* SDK because it's invoked
 * from client components/hooks (e.g. permission-denial logging via
 * `lib/auth/permission-utils.ts`), which cannot import the Admin SDK.
 * Security-critical audit entries (user create/delete/role changes) are
 * written server-side with the Admin SDK directly in
 * `app/actions/admin-users.ts` (`writeAuditLog`) — that is the trustworthy
 * source of truth. Firestore Security Rules should restrict writes here to
 * a user's own uid as `performedBy` and disallow client reads/writes of
 * other users' entries.
 */

import { collection, addDoc, Timestamp, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logger } from "@/lib/logger/client";
import type { AuditLog, AuditAction } from "@/types/crm";

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: {
  action: AuditAction;
  performedBy: string;
  performedByName: string;
  targetUserId?: string;
  targetUserName?: string;
  details: Record<string, any>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const logData: Omit<AuditLog, "id"> = {
      action: params.action,
      performedBy: params.performedBy,
      performedByName: params.performedByName,
      targetUserId: params.targetUserId,
      targetUserName: params.targetUserName,
      details: params.details,
      timestamp: Timestamp.now(),
    };

    await addDoc(collection(db, "audit_logs"), logData);
    logger.debug("Audit log created", {
      module: "audit",
      action: params.action,
      userId: params.performedBy,
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to create audit log", {
      module: "audit",
      action: params.action,
      userId: params.performedBy,
      error,
    });
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Get recent audit logs for a user
 */
export async function getAuditLogsForUser(
  userId: string,
  maxResults = 50
): Promise<{ logs: AuditLog[]; error?: string }> {
  try {
    const q = query(
      collection(db, "audit_logs"),
      where("performedBy", "==", userId),
      orderBy("timestamp", "desc"),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    const logs: AuditLog[] = [];

    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() } as AuditLog);
    });

    return { logs };
  } catch (error) {
    logger.error("Failed to fetch audit logs", {
      module: "audit",
      action: "list",
      userId,
      error,
    });
    return { logs: [], error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Get all audit logs (admin only)
 */
export async function getAllAuditLogs(
  maxResults = 100
): Promise<{ logs: AuditLog[]; error?: string }> {
  try {
    const q = query(
      collection(db, "audit_logs"),
      orderBy("timestamp", "desc"),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    const logs: AuditLog[] = [];

    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() } as AuditLog);
    });

    return { logs };
  } catch (error) {
    logger.error("Failed to fetch audit logs", {
      module: "audit",
      action: "list-all",
      error,
    });
    return { logs: [], error: error instanceof Error ? error.message : String(error) };
  }
}

// Audit log helpers for common actions
export const AuditActions = {
  USER_CREATED: "user_created" as const,
  USER_DELETED: "user_deleted" as const,
  USER_DEACTIVATED: "user_deactivated" as const,
  USER_ACTIVATED: "user_activated" as const,
  ROLE_CHANGED: "role_changed" as const,
  PERMISSION_CHANGED: "permission_changed" as const,
  PERMISSION_RESET: "permission_reset" as const,
  PASSWORD_RESET: "password_reset" as const,
  LOGIN_SUCCESS: "login_success" as const,
  LOGIN_FAILED: "login_failed" as const,
};
