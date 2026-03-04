import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import type { UserProfile, UserRole, UserStatus } from "@/types/crm";
export type { UserProfile, UserRole, UserStatus };
import type { UserPermissions } from "@/types/crm";
import { ROLE_DEFAULTS } from "@/types/crm";

export interface UserDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: Timestamp;
}

// UserProfile imported from types/crm

/**
 * Creates a full user profile in Firestore upon ADMIN-CREATED user provisioning.
 * This should ONLY be called from the backend (Admin-managed user creation).
 * It must NEVER be called during login.
 */
export async function createUserProfile(
  uid: string,
  data: {
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    photoURL?: string;
    phone?: string;
    employeeId?: string;
    role?: UserRole;
  }
) {
  console.log("📝 User Profile Sync for UID:", uid);
  
  try {
    const userRef = doc(db, "users", uid);
    const existingUser = await getDoc(userRef);
    
    if (existingUser.exists()) {
      // ----------------------------------------------------------------
      // EXISTING USER: Only update safe, non-destructive fields.
      // We NEVER touch: role, isActive, isApproved, permissions.
      // ----------------------------------------------------------------
      const userData = existingUser.data();
      console.log(`✅ User exists (Role: ${userData.role}). Updating safe fields only.`);

      const updates: Record<string, unknown> = {
        lastLoginAt: serverTimestamp(),
      };

      // Sync profile display fields only if currently missing
      if (!userData.displayName && data.displayName) {
        updates.displayName = data.displayName;
      }
      if (!userData.photoURL && data.photoURL) {
        updates.photoURL = data.photoURL;
      }
      // Ensure createdAt exists (silent backfill, does not touch role)
      if (!userData.createdAt) {
        updates.createdAt = serverTimestamp();
      }

      // SAFETY: never include role, isActive, isApproved, or permissions in updates.
      await setDoc(userRef, updates, { merge: true });
      console.log("✅ User profile synced (safe fields only)");
      return { success: true, error: null };
    }

    // ----------------------------------------------------------------
    // NEW USER: Full creation. Only called by Admin-managed flows.
    // ----------------------------------------------------------------
    console.log("🆕 Creating NEW user profile...");
    
    const newUserProfile: Omit<UserProfile, "uid"> = {
      email: data.email,
      displayName: data.displayName || data.email.split('@')[0],
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      photoURL: data.photoURL || "",
      phone: data.phone || "",
      employeeId: data.employeeId || "",
      
      // Critical Security Fields — role MUST be explicitly passed in
      role: data.role || "team", 
      isFirstLogin: true,
      isActive: true,
      status: "active",
      
      createdAt: serverTimestamp() as Timestamp,
      createdBy: "admin_created",
      lastLoginAt: serverTimestamp() as Timestamp,
      passwordChangedAt: undefined,
      updatedAt: serverTimestamp() as Timestamp,
      
      provider: "password",
      
      documents: [],
      settings: {
        theme: "system",
        notifications: true,
        defaultCurrency: "USD",
      },
    };

    await setDoc(userRef, newUserProfile);
    console.log("✅ New user profile created:", uid);
    
    return { success: true, error: null };
  } catch (error: any) {
    console.error("❌ Failed to sync user profile:", error);
    return { success: false, error: error.message };
  }
}


// Get user profile
export async function getUserProfile(uid: string) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return {
        user: { uid, ...userSnap.data() } as UserProfile,
        error: null,
      };
    } else {
      return { user: null, error: "User profile not found" };
    }
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

// Update user profile
export async function updateUserProfile(
  uid: string,
  data: Partial<Omit<UserProfile, "uid" | "createdAt">>
) {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...data,
      lastLoginAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update last login timestamp
export async function updateLastLogin(uid: string) {
  try {
    const userRef = doc(db, "users", uid);
    // Use setDoc with merge to create the document if it doesn't exist
    await setDoc(
      userRef,
      {
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get all users (for assignee lists)
export async function getUsers(): Promise<{ users: UserProfile[] | null; error: string | null }> {
    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                ...data,
                // Fallback for missing displayName
                displayName: data.displayName || data.email?.split('@')[0] || "Unknown User"
            } as UserProfile;
        });
        return { users, error: null };
    } catch (error: any) {
        return { users: [] as UserProfile[], error: error.message };
    }
}

// Approve User (Admin/Manager)
export async function approveUser(uid: string, approved: boolean = true) {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            isActive: approved,
            updatedAt: serverTimestamp(),
        });
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Update User Role (Admin/Manager)
export async function updateUserRole(uid: string, role: UserRole) {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            role,
            updatedAt: serverTimestamp(),
        });
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Delete User (Admin only)
export async function deleteUser(uid: string) {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            status: "inactive",
            deletedAt: serverTimestamp(),
        });
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Get User Invoice Settings
export async function getUserInvoiceSettings(uid: string) {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            return {
                settings: userData.invoiceSettings || null,
                error: null,
            };
        } else {
            return { settings: null, error: "User not found" };
        }
    } catch (error: any) {
        return { settings: null, error: error.message };
    }
}

// Update User Permissions (Admin only)
export async function updateUserPermissions(
  uid: string,
  permissions: UserPermissions
): Promise<{ success: boolean; error: string | null }> {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      permissions,
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Reset User Permissions to Role Defaults
export async function resetUserPermissions(
  uid: string,
  role: UserRole
): Promise<{ success: boolean; error: string | null }> {
  try {
    const defaults = ROLE_DEFAULTS[role];
    if (!defaults) {
      return { success: false, error: "Invalid role" };
    }

    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      permissions: defaults,
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Set User Invoice Settings
export async function setUserInvoiceSettings(uid: string, settings: any) {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            invoiceSettings: settings,
            updatedAt: serverTimestamp(),
        });
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
