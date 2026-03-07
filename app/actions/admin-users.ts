"use server";

import { adminDb, adminAuth } from "@/lib/firebase-admin";

/**
 * Generate a secure random password
 */
function generateSecurePassword(length: number = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  const allChars = uppercase + lowercase + numbers + special;

  // Guarantee at least one character of each type
  const chars = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    special[Math.floor(Math.random() * special.length)],
  ];

  // Fill remaining positions
  for (let i = chars.length; i < length; i++) {
    chars.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Fisher-Yates shuffle — cryptographically fair, never loses characters
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

/**
 * Server action to create a new user (Admin only)
 */
export async function createUserAction(data: {
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: "admin" | "manager" | "team";
  employeeId?: string; // Optional: Link to existing employee record
  createdBy: string; // Admin UID
}) {
  try {
    // Generate temporary password
    const tempPassword = generateSecurePassword(12);

    // Create user in Firebase Auth
    const createUserPayload: {
      email: string;
      password: string;
      displayName: string;
      phoneNumber?: string;
    } = {
      email: data.email,
      password: tempPassword,
      displayName: data.displayName,
    };
    // Only include phoneNumber if it is a non-empty string — Firebase rejects undefined/empty
    if (data.phoneNumber) {
      createUserPayload.phoneNumber = data.phoneNumber;
    }

    // DIAGNOSTIC: log password metadata (never log the actual key)
    console.log("[createUserAction] payload check:", {
      email: data.email,
      displayName: data.displayName,
      passwordLength: tempPassword.length,
      passwordMeetsMin: tempPassword.length >= 6,
      hasPhone: !!createUserPayload.phoneNumber,
    });

    const userRecord = await adminAuth.createUser(createUserPayload);

    // Create user profile in Firestore
    const userDoc: any = {
      uid: userRecord.uid,
      email: data.email,
      displayName: data.displayName,
      phoneNumber: data.phoneNumber || "",
      role: data.role,
      isActive: true, // Active by default
      isFirstLogin: true, // Force password change
      status: "active",
      createdAt: new Date(),
      createdBy: data.createdBy,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
      provider: "password",
      documents: [],
      settings: {
        theme: "system",
        notifications: true,
        defaultCurrency: "USD",
      },
    };

    // Add employeeId if provided
    if (data.employeeId) {
      userDoc.employeeId = data.employeeId;
    }

    await adminDb.collection("users").doc(userRecord.uid).set(userDoc);

    // If employeeId is provided, link the employee to this user
    if (data.employeeId) {
      try {
        await adminDb.collection("employees").doc(data.employeeId).update({
          userId: userRecord.uid,
          hasCRMAccess: true,
          updatedAt: new Date(),
        });
        console.log("✅ Employee linked to user:", data.employeeId);
      } catch (linkError) {
        console.error("⚠️ Failed to link employee to user:", linkError);
        // Don't fail user creation if linking fails
      }
    }

    console.log("✅ User created successfully:", userRecord.uid);

    // Send welcome email with credentials
    try {
      const { sendAdminCreatedUserEmail } = await import("@/lib/email/email-service");
      await sendAdminCreatedUserEmail({
        email: data.email,
        userName: data.displayName,
        tempPassword,
        role: data.role,
      });
      console.log("📧 Welcome email sent to:", data.email);
    } catch (emailError) {
      console.error("⚠️ Failed to send welcome email:", emailError);
      // Don't fail user creation if email fails
    }

    return {
      success: true,
      uid: userRecord.uid,
      tempPassword,
    };
  } catch (error: any) {
    console.error("❌ Failed to create user:", {
      message: error.message,
      code: error.code,
      errorInfo: error.errorInfo,
    });
    return {
      success: false,
      error: error.message || "Failed to create user",
    };
  }
}

/**
 * Server action to reset user password (Admin only)
 */
export async function resetUserPasswordAction(uid: string) {
  try {
    // Generate new temporary password
    const tempPassword = generateSecurePassword(12);

    // Update password in Firebase Auth
    await adminAuth.updateUser(uid, {
      password: tempPassword,
    });

    // Update Firestore to mark as first login
    await adminDb.collection("users").doc(uid).update({
      isFirstLogin: true,
      updatedAt: new Date(),
    });

    console.log("✅ Password reset successfully:", uid);

    // Send password reset email
    try {
      const { sendAdminPasswordResetEmail } = await import("@/lib/email/email-service");
      const { getUserProfile } = await import("@/lib/firestore/users");
      
      const { user } = await getUserProfile(uid);
      if (user) {
        await sendAdminPasswordResetEmail({
          email: user.email,
          userName: user.displayName,
          tempPassword,
        });
        console.log("📧 Password reset email sent to:", user.email);
      }
    } catch (emailError) {
      console.error("⚠️ Failed to send password reset email:", emailError);
      // Don't fail password reset if email fails
    }

    return {
      success: true,
      tempPassword,
    };
  } catch (error: any) {
    console.error("❌ Failed to reset password:", error);
    return {
      success: false,
      error: error.message || "Failed to reset password",
    };
  }
}

/**
 * Server action to delete user (Admin only)
 */
export async function deleteUserAction(uid: string) {
  try {
    // Delete from Firebase Auth
    await adminAuth.deleteUser(uid);

    // Delete from Firestore
    await adminDb.collection("users").doc(uid).delete();

    console.log("✅ User deleted successfully:", uid);

    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to delete user:", error);
    return {
      success: false,
      error: error.message || "Failed to delete user",
    };
  }
}
