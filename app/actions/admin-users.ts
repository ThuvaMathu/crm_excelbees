"use server";

import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import type { UserRole, UserPermissions } from "@/types/crm";
import { ROLE_DEFAULTS } from "@/types/crm";
import { clearPermissionCache } from "@/lib/auth/permission-utils";

// ============================================================================
// INTERNAL AUTH HELPERS
// ============================================================================

/**
 * Verifies that the caller's Firebase ID token belongs to an admin user.
 * Uses the Admin SDK (server-side only) — cannot be spoofed by the client.
 * Returns the verified caller UID or throws with an error message.
 */
async function verifyCallerIsAdmin(
  callerToken: string
): Promise<{ callerUid: string }> {
  if (!callerToken) {
    throw new Error("Authentication required");
  }

  let decoded: { uid: string };
  try {
    decoded = await adminAuth.verifyIdToken(callerToken, true);
  } catch (err) {
    logger.warn("verifyCallerIsAdmin: token verification failed", {
      module: "admin",
      action: "verify-admin",
      error: err,
    });
    throw new Error("Invalid or expired authentication token");
  }

  const callerDoc = await adminDb.collection("users").doc(decoded.uid).get();
  const callerRole = callerDoc.data()?.role;

  if (callerRole !== "admin") {
    throw new Error("Admin access required");
  }

  return { callerUid: decoded.uid };
}

/**
 * Counts the number of active admin accounts.
 * Used to prevent deleting the last admin.
 */
async function countAdmins(): Promise<number> {
  const snap = await adminDb
    .collection("users")
    .where("role", "==", "admin")
    .get();
  return snap.size;
}

/**
 * Writes an entry to the audit_logs collection.
 */
async function writeAuditLog(entry: {
  action: string;
  performedBy: string;
  targetUid?: string;
  details: Record<string, unknown>;
}) {
  await adminDb.collection("audit_logs").add({
    ...entry,
    createdAt: new Date(),
  });
}

// ============================================================================
// GENERATE SECURE PASSWORD
// ============================================================================

function generateSecurePassword(length: number = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + special;

  const chars = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  for (let i = chars.length; i < length; i++) {
    chars.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

// ============================================================================
// CREATE USER (Admin only)
// ============================================================================

export async function createUserAction(data: {
  callerToken: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: UserRole;
}) {
  try {
    const { callerUid } = await verifyCallerIsAdmin(data.callerToken);

    const tempPassword = generateSecurePassword(12);

    const createPayload: {
      email: string;
      password: string;
      displayName: string;
      phoneNumber?: string;
    } = {
      email: data.email,
      password: tempPassword,
      displayName: data.displayName,
    };
    if (data.phoneNumber) {
      createPayload.phoneNumber = data.phoneNumber;
    }

    const userRecord = await adminAuth.createUser(createPayload);

    // Set custom claims immediately so AuthProvider resolves the correct role
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: data.role });

    // Admins and managers are pre-approved; team members need explicit approval
    const isPreApproved = data.role === "admin" || data.role === "manager";

    const userDoc = {
      uid: userRecord.uid,
      email: data.email,
      displayName: data.displayName,
      firstName: "",
      lastName: "",
      phoneNumber: data.phoneNumber || "",
      phone: data.phoneNumber || "",
      position: "",
      role: data.role,
      isActive: true,
      isApproved: isPreApproved,
      isFirstLogin: true,
      isOnboarded: false,
      status: "active",
      createdAt: new Date(),
      createdBy: callerUid,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
      provider: "password",
      documents: [],
      permissions: ROLE_DEFAULTS[data.role],
      settings: {
        theme: "system",
        notifications: true,
        defaultCurrency: "USD",
      },
    };

    await adminDb.collection("users").doc(userRecord.uid).set(userDoc);

    await writeAuditLog({
      action: "user_created",
      performedBy: callerUid,
      targetUid: userRecord.uid,
      details: { email: data.email, role: data.role },
    });

    logger.info("User created", {
      module: "admin",
      action: "create-user",
      userId: callerUid,
      metadata: { targetUid: userRecord.uid, role: data.role },
    });

    try {
      const { sendAdminCreatedUserEmail } = await import(
        "@/lib/email/email-service"
      );
      await sendAdminCreatedUserEmail({
        email: data.email,
        userName: data.displayName,
        tempPassword,
        role: data.role,
      });
    } catch (emailError) {
      logger.warn("Welcome email failed (non-fatal)", {
        module: "admin",
        action: "create-user",
        userId: callerUid,
        error: emailError,
      });
    }

    return { success: true, uid: userRecord.uid, tempPassword };
  } catch (error) {
    logger.error("createUserAction failed", {
      module: "admin",
      action: "create-user",
      error,
    });
    return { success: false, error: error instanceof Error ? error.message : "Failed to create user" };
  }
}

// ============================================================================
// CREATE TEAM MEMBER FOR ORG — creates user + adds org membership in one step
// ============================================================================

export async function createTeamMemberForOrgAction(data: {
  callerToken: string;
  organizationId: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: "team" | "manager";
}): Promise<{ success: boolean; uid?: string; error?: string }> {
  try {
    // 1. Verify caller is an admin or manager of this specific org
    let decoded: { uid: string };
    try {
      decoded = await adminAuth.verifyIdToken(data.callerToken, true);
    } catch (err) {
      logger.warn("createTeamMemberForOrgAction: token verification failed", {
        module: "admin",
        action: "create-team-member",
        error: err,
      });
      throw new Error("Invalid or expired authentication token");
    }

    const callerMemberId  = `${data.organizationId}_${decoded.uid}`;
    const callerMemberDoc = await adminDb.collection("organization_members").doc(callerMemberId).get();
    if (!callerMemberDoc.exists || callerMemberDoc.data()?.status !== "active") {
      throw new Error("You are not an active member of this organization");
    }
    const callerRole = callerMemberDoc.data()?.role;
    if (callerRole !== "admin" && callerRole !== "manager") {
      throw new Error("Admin or manager access required");
    }
    const callerUid = decoded.uid;

    // 2. Create Firebase Auth account
    const tempPassword = generateSecurePassword(12);
    const createPayload: { email: string; password: string; displayName: string; phoneNumber?: string } = {
      email: data.email,
      password: tempPassword,
      displayName: data.displayName,
    };
    if (data.phoneNumber) createPayload.phoneNumber = data.phoneNumber;

    const userRecord = await adminAuth.createUser(createPayload);
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: data.role });

    // 3. Write users doc
    await adminDb.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: data.email,
      displayName: data.displayName,
      firstName: "",
      lastName: "",
      phoneNumber: data.phoneNumber || "",
      phone: data.phoneNumber || "",
      position: "",
      role: data.role,
      isActive: true,
      isApproved: true,
      isFirstLogin: true,
      isOnboarded: false,
      status: "active",
      createdAt: new Date(),
      createdBy: callerUid,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
      provider: "password",
      documents: [],
      permissions: ROLE_DEFAULTS[data.role],
      settings: { theme: "system", notifications: true, defaultCurrency: "USD" },
    });

    // 4. Write org membership
    const memberId = `${data.organizationId}_${userRecord.uid}`;
    await adminDb.collection("organization_members").doc(memberId).set({
      organizationId: data.organizationId,
      userId: userRecord.uid,
      role: data.role,
      permissions: ROLE_DEFAULTS[data.role],
      status: "active",
      joinedAt: new Date(),
      updatedAt: new Date(),
      displayName: data.displayName,
      email: data.email,
      ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
    });

    await writeAuditLog({
      action: "team_member_created",
      performedBy: callerUid,
      targetUid: userRecord.uid,
      details: { email: data.email, role: data.role, organizationId: data.organizationId },
    });

    // 5. Send welcome email (non-fatal)
    try {
      const { sendAdminCreatedUserEmail } = await import("@/lib/email/email-service");
      await sendAdminCreatedUserEmail({
        email: data.email,
        userName: data.displayName,
        tempPassword,
        role: data.role,
      });
    } catch (emailError) {
      logger.warn("Welcome email failed (non-fatal)", {
        module: "admin",
        action: "create-team-member",
        userId: callerUid,
        error: emailError,
      });
    }

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    logger.error("createTeamMemberForOrgAction failed", {
      module: "admin",
      action: "create-team-member",
      error,
    });
    return { success: false, error: error instanceof Error ? error.message : "Failed to create team member" };
  }
}

// ============================================================================
// UPDATE MEMBER PERMISSIONS (Admin or Manager of the org)
// RBAC: managers cannot elevate targets to admin/manager, cannot enable userManagement
// ============================================================================

export async function updateMemberPermissionsAction(data: {
  callerToken: string;
  organizationId: string;
  targetUserId: string;
  role: UserRole;
  permissions: UserPermissions;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify caller identity
    let decoded: { uid: string };
    try {
      decoded = await adminAuth.verifyIdToken(data.callerToken, true);
    } catch (err) {
      logger.warn("updateMemberPermissionsAction: token verification failed", {
        module: "admin",
        action: "update-permissions",
        error: err,
      });
      throw new Error("Invalid or expired authentication token");
    }

    // Caller must be active admin or manager in this org
    const callerMemberId  = `${data.organizationId}_${decoded.uid}`;
    const callerMemberDoc = await adminDb.collection("organization_members").doc(callerMemberId).get();
    if (!callerMemberDoc.exists || callerMemberDoc.data()?.status !== "active") {
      throw new Error("You are not an active member of this organization");
    }
    const callerRole = callerMemberDoc.data()?.role as UserRole;
    if (callerRole !== "admin" && callerRole !== "manager") {
      throw new Error("Admin or manager access required");
    }

    // Cannot edit yourself
    if (decoded.uid === data.targetUserId) {
      throw new Error("You cannot edit your own permissions");
    }

    // Fetch the target's current membership
    const targetMemberId  = `${data.organizationId}_${data.targetUserId}`;
    const targetMemberDoc = await adminDb.collection("organization_members").doc(targetMemberId).get();
    if (!targetMemberDoc.exists) {
      throw new Error("Target user is not a member of this organization");
    }
    const targetCurrentRole = targetMemberDoc.data()?.role as UserRole;

    // Manager-specific restrictions
    if (callerRole === "manager") {
      // Managers cannot touch admins or other managers
      if (targetCurrentRole === "admin" || targetCurrentRole === "manager") {
        throw new Error("Managers cannot edit admin or manager permissions");
      }
      // Managers cannot elevate anyone to admin or manager
      if (data.role === "admin" || data.role === "manager") {
        throw new Error("Managers cannot assign the admin or manager role");
      }
      // Managers cannot enable userManagement
      if (data.permissions.userManagement?.enabled) {
        throw new Error("Managers cannot grant user management access");
      }
    }

    // Write updated role + permissions
    await adminDb.collection("organization_members").doc(targetMemberId).update({
      role:        data.role,
      permissions: data.permissions,
      updatedAt:   new Date(),
    });

    // If role changed, update global users doc too (keeps claims consistent)
    if (targetCurrentRole !== data.role) {
      await adminDb.collection("users").doc(data.targetUserId).update({
        role:      data.role,
        updatedAt: new Date(),
      });
      await adminAuth.setCustomUserClaims(data.targetUserId, { role: data.role });
    }

    // Flush the in-memory permission cache so subsequent server-side
    // hasPermission() checks for this user don't serve stale data.
    clearPermissionCache(data.targetUserId);

    await writeAuditLog({
      action: "permission_changed",
      performedBy: decoded.uid,
      targetUid:   data.targetUserId,
      details: {
        organizationId: data.organizationId,
        newRole:        data.role,
        prevRole:       targetCurrentRole,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error("updateMemberPermissionsAction failed", {
      module: "admin",
      action: "update-permissions",
      error,
    });
    return { success: false, error: error instanceof Error ? error.message : "Failed to update permissions" };
  }
}

// ============================================================================
// UPDATE USER (Admin only) — role, permissions, isActive, displayName
// ============================================================================

export async function updateUserAction(data: {
  callerToken: string;
  targetUid: string;
  updates: {
    displayName?: string;
    role?: UserRole;
    isActive?: boolean;
    permissions?: UserPermissions;
  };
}) {
  try {
    const { callerUid } = await verifyCallerIsAdmin(data.callerToken);

    if (callerUid === data.targetUid && data.updates.role !== undefined) {
      throw new Error("Admins cannot change their own role");
    }

    const targetDoc = await adminDb
      .collection("users")
      .doc(data.targetUid)
      .get();
    if (!targetDoc.exists) {
      throw new Error("Target user not found");
    }

    const before = targetDoc.data()!;
    const patch: Record<string, unknown> = { updatedAt: new Date() };

    if (data.updates.displayName !== undefined) {
      patch.displayName = data.updates.displayName;
    }
    if (data.updates.role !== undefined) {
      patch.role = data.updates.role;
      // Keep isApproved consistent: admins and managers are always approved
      patch.isApproved =
        data.updates.role === "admin" || data.updates.role === "manager";
    }
    if (data.updates.isActive !== undefined) {
      patch.isActive = data.updates.isActive;
    }
    if (data.updates.permissions !== undefined) {
      patch.permissions = data.updates.permissions;
    }

    await adminDb.collection("users").doc(data.targetUid).update(patch);

    // Sync custom claims whenever the role changes
    if (data.updates.role !== undefined) {
      await adminAuth.setCustomUserClaims(data.targetUid, {
        role: data.updates.role,
      });
      // Force token refresh on next sign-in by revoking existing refresh tokens
      await adminAuth.revokeRefreshTokens(data.targetUid);
    }

    await writeAuditLog({
      action:
        data.updates.role !== undefined
          ? "role_changed"
          : data.updates.permissions !== undefined
          ? "permissions_changed"
          : "user_updated",
      performedBy: callerUid,
      targetUid: data.targetUid,
      details: {
        before: {
          role: before.role,
          isActive: before.isActive,
          displayName: before.displayName,
        },
        after: data.updates,
      },
    });

    logger.info("User updated", {
      module: "admin",
      action: "update-user",
      userId: callerUid,
      metadata: { targetUid: data.targetUid },
    });
    return { success: true };
  } catch (error) {
    logger.error("updateUserAction failed", {
      module: "admin",
      action: "update-user",
      error,
    });
    return { success: false, error: error instanceof Error ? error.message : "Failed to update user" };
  }
}

// ============================================================================
// RESET PASSWORD (Admin only)
// ============================================================================

export async function resetUserPasswordAction(
  callerToken: string,
  uid: string
) {
  try {
    const { callerUid } = await verifyCallerIsAdmin(callerToken);

    const tempPassword = generateSecurePassword(12);

    await adminAuth.updateUser(uid, { password: tempPassword });
    await adminDb.collection("users").doc(uid).update({
      isFirstLogin: true,
      updatedAt: new Date(),
    });

    await writeAuditLog({
      action: "password_reset",
      performedBy: callerUid,
      targetUid: uid,
      details: {},
    });

    logger.info("Password reset for user", {
      module: "admin",
      action: "reset-password",
      userId: callerUid,
      metadata: { targetUid: uid },
    });

    try {
      const { sendAdminPasswordResetEmail } = await import(
        "@/lib/email/email-service"
      );
      const userDoc = await adminDb.collection("users").doc(uid).get();
      const userData = userDoc.data();
      if (userData) {
        await sendAdminPasswordResetEmail({
          email: userData.email,
          userName: userData.displayName,
          tempPassword,
        });
      }
    } catch (emailError) {
      logger.warn("Password reset email failed (non-fatal)", {
        module: "admin",
        action: "reset-password",
        userId: callerUid,
        error: emailError,
      });
    }

    return { success: true, tempPassword };
  } catch (error) {
    logger.error("resetUserPasswordAction failed", {
      module: "admin",
      action: "reset-password",
      error,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reset password",
    };
  }
}

// ============================================================================
// DELETE USER (Admin only) — prevents deleting the last admin
// ============================================================================

export async function deleteUserAction(callerToken: string, uid: string) {
  try {
    const { callerUid } = await verifyCallerIsAdmin(callerToken);

    if (callerUid === uid) {
      throw new Error("Admins cannot delete their own account");
    }

    const targetDoc = await adminDb.collection("users").doc(uid).get();
    if (!targetDoc.exists) {
      throw new Error("User not found");
    }

    const targetRole = targetDoc.data()?.role;

    if (targetRole === "admin") {
      const adminCount = await countAdmins();
      if (adminCount <= 1) {
        throw new Error("Cannot delete the last admin account");
      }
    }

    await adminAuth.deleteUser(uid);
    await adminDb.collection("users").doc(uid).delete();

    await writeAuditLog({
      action: "user_deleted",
      performedBy: callerUid,
      targetUid: uid,
      details: { deletedRole: targetRole },
    });

    logger.info("User deleted", {
      module: "admin",
      action: "delete-user",
      userId: callerUid,
      metadata: { targetUid: uid, deletedRole: targetRole },
    });
    return { success: true };
  } catch (error) {
    logger.error("deleteUserAction failed", {
      module: "admin",
      action: "delete-user",
      error,
    });
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete user" };
  }
}

// ============================================================================
// ACTIVATE / DEACTIVATE USER (Admin only for admins/managers; manager for team)
// ============================================================================

export async function setUserActiveAction(
  callerToken: string,
  targetUid: string,
  isActive: boolean
) {
  try {
    const { callerUid } = await verifyCallerIsAdmin(callerToken);

    if (callerUid === targetUid) {
      throw new Error("Cannot change your own active status");
    }

    await adminDb.collection("users").doc(targetUid).update({
      isActive,
      updatedAt: new Date(),
    });

    await writeAuditLog({
      action: isActive ? "user_activated" : "user_deactivated",
      performedBy: callerUid,
      targetUid,
      details: {},
    });

    return { success: true };
  } catch (error) {
    logger.error("setUserActiveAction failed", {
      module: "admin",
      action: "set-user-active",
      error,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user status",
    };
  }
}
