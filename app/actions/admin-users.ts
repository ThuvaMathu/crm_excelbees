"use server";

import { adminDb, adminAuth } from "@/lib/firebase-admin";
import type { UserRole, UserPermissions } from "@/types/crm";
import { ROLE_DEFAULTS } from "@/types/crm";

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
  } catch {
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
      phoneNumber: data.phoneNumber || "",
      role: data.role,
      isActive: true,
      isApproved: isPreApproved,
      isFirstLogin: true,
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

    console.log("✅ User created:", userRecord.uid, "role:", data.role);

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
      console.error("⚠️ Welcome email failed (non-fatal):", emailError);
    }

    return { success: true, uid: userRecord.uid, tempPassword };
  } catch (error: any) {
    console.error("❌ createUserAction failed:", error.message);
    return { success: false, error: error.message || "Failed to create user" };
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

    console.log("✅ User updated:", data.targetUid, "by admin:", callerUid);
    return { success: true };
  } catch (error: any) {
    console.error("❌ updateUserAction failed:", error.message);
    return { success: false, error: error.message || "Failed to update user" };
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

    console.log("✅ Password reset for:", uid);

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
      console.error("⚠️ Password reset email failed (non-fatal):", emailError);
    }

    return { success: true, tempPassword };
  } catch (error: any) {
    console.error("❌ resetUserPasswordAction failed:", error.message);
    return {
      success: false,
      error: error.message || "Failed to reset password",
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

    console.log("✅ User deleted:", uid);
    return { success: true };
  } catch (error: any) {
    console.error("❌ deleteUserAction failed:", error.message);
    return { success: false, error: error.message || "Failed to delete user" };
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
  } catch (error: any) {
    console.error("❌ setUserActiveAction failed:", error.message);
    return {
      success: false,
      error: error.message || "Failed to update user status",
    };
  }
}
