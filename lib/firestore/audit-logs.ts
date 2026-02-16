/**
 * Audit Logs - User Management Action Tracking
 *
 * Tracks all user management actions for security audit trails.
 */

import { collection, addDoc, Timestamp, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
    console.log(`📝 Audit log created: ${params.action} by ${params.performedByName}`);

    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to create audit log:", error);
    return { success: false, error: error.message };
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
  } catch (error: any) {
    console.error("❌ Failed to fetch audit logs:", error);
    return { logs: [], error: error.message };
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
  } catch (error: any) {
    console.error("❌ Failed to fetch audit logs:", error);
    return { logs: [], error: error.message };
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
