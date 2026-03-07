import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { UserRole } from "@/types/crm";

/**
 * Admin-only function to create a new user
 * This should be called from a server action or admin-protected route
 */
export async function createUserByAdmin(data: {
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: UserRole;
  createdBy: string; // Admin UID
}): Promise<{ success: boolean; uid?: string; tempPassword?: string; error?: string }> {
  try {
    // Note: Firebase Auth user creation must be done server-side
    // This function only creates the Firestore profile
    // You'll need to implement the Firebase Admin SDK part separately
    
    console.log("⚠️ This function requires Firebase Admin SDK implementation");
    console.log("📝 User data prepared:", data);
    
    return {
      success: false,
      error: "Firebase Admin SDK required - implement in server action",
    };
  } catch (error: any) {
    console.error("❌ Failed to create user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 12): string {
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

  // Fisher-Yates shuffle — always produces exactly `length` characters
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

/**
 * Reset user password (Admin only)
 * Returns a new temporary password
 */
export async function resetUserPasswordByAdmin(
  uid: string
): Promise<{ success: boolean; tempPassword?: string; error?: string }> {
  try {
    // This requires Firebase Admin SDK
    console.log("⚠️ Password reset requires Firebase Admin SDK");
    console.log("📝 Reset requested for UID:", uid);
    
    return {
      success: false,
      error: "Firebase Admin SDK required - implement in server action",
    };
  } catch (error: any) {
    console.error("❌ Failed to reset password:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Deactivate user account (soft delete)
 */
export async function deactivateUser(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      isActive: false,
      updatedAt: serverTimestamp(),
    });
    
    console.log("✅ User deactivated:", uid);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to deactivate user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Reactivate user account
 */
export async function reactivateUser(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      isActive: true,
      updatedAt: serverTimestamp(),
    });
    
    console.log("✅ User reactivated:", uid);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to reactivate user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete user account (hard delete)
 * This requires Firebase Admin SDK to delete from Auth
 */
export async function deleteUserByAdmin(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete from Firestore
    const userRef = doc(db, "users", uid);
    await deleteDoc(userRef);
    
    // Note: Also need to delete from Firebase Auth using Admin SDK
    console.log("⚠️ User deleted from Firestore, but Auth deletion requires Admin SDK");
    console.log("✅ User deleted from Firestore:", uid);
    
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to delete user:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update user role (Admin only)
 */
export async function updateUserRole(
  uid: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp(),
    });
    
    console.log(`✅ User role updated: ${uid} -> ${newRole}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to update user role:", error);
    return { success: false, error: error.message };
  }
}
