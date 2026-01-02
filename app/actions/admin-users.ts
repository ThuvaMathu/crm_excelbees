"use server";

import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase-admin";

/**
 * Generate a secure random password
 */
function generateSecurePassword(length: number = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  
  const allChars = uppercase + lowercase + numbers + special;
  let password = "";
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Server action to create a new user (Admin only)
 */
export async function createUserAction(data: {
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: "admin" | "manager" | "team";
  createdBy: string; // Admin UID
}) {
  try {
    // Generate temporary password
    const tempPassword = generateSecurePassword(12);

    // Create user in Firebase Auth
    const userRecord = await getAuth().createUser({
      email: data.email,
      password: tempPassword,
      displayName: data.displayName,
      phoneNumber: data.phoneNumber,
    });

    // Create user profile in Firestore
    await adminDb.collection("users").doc(userRecord.uid).set({
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
    });

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
    console.error("❌ Failed to create user:", error);
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
    await getAuth().updateUser(uid, {
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
    await getAuth().deleteUser(uid);

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
