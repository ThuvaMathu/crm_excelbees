import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  collection,
  getDocs,
  query,
  where,
  documentId,
} from "firebase/firestore";
import { db } from "../firebase";
import type { UserProfile, UserRole, UserStatus } from "@/types/crm";
export type { UserProfile, UserRole, UserStatus };
import type { UserPermissions } from "@/types/crm";
import { ROLE_DEFAULTS } from "@/types/crm";
import { logger } from "@/lib/logger/client";

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
    role?: UserRole;
    provider?: "password" | "google.com";
    isFirstLogin?: boolean;
  }
) {
  try {
    const userRef = doc(db, "users", uid);
    const existingUser = await getDoc(userRef);
    
    if (existingUser.exists()) {
      // ----------------------------------------------------------------
      // EXISTING USER: Only update safe, non-destructive fields.
      // We NEVER touch: role, isActive, isApproved, permissions.
      // ----------------------------------------------------------------
      const userData = existingUser.data();
      logger.debug("User exists, updating safe fields only", { module: "users", action: "sync-profile", metadata: { uid, role: userData.role } });

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
      logger.debug("User profile synced", { module: "users", action: "sync-profile", metadata: { uid } });
      return { success: true, error: null };
    }

    // ----------------------------------------------------------------
    // NEW USER: Full creation. Only called by Admin-managed flows.
    // ----------------------------------------------------------------
    
    const newUserProfile: Omit<UserProfile, "uid"> = {
      email: data.email,
      displayName: data.displayName || data.email.split('@')[0],
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      photoURL: data.photoURL || "",
      phone: data.phone || "",
      position: "",

      // Critical Security Fields — role MUST be explicitly passed in
      role: data.role || "team",
      // Google users never need to change password; email self-signup does on first login
      isFirstLogin: data.isFirstLogin !== undefined
        ? data.isFirstLogin
        : data.provider !== "google.com",
      isActive: true,
      isOnboarded: false,  // Always requires onboarding wizard on first login
      status: "active",

      createdAt: serverTimestamp() as Timestamp,
      createdBy: uid, // self-created
      lastLoginAt: serverTimestamp() as Timestamp,
      passwordChangedAt: undefined,
      updatedAt: serverTimestamp() as Timestamp,

      provider: data.provider || "password",

      documents: [],
      settings: {
        theme: "system",
        notifications: true,
        defaultCurrency: "USD",
      },
    };

    await setDoc(userRef, newUserProfile);
    logger.debug("New user profile created", { module: "users", action: "sync-profile", metadata: { uid } });
    
    return { success: true, error: null };
  } catch (error: any) {
    logger.error("Failed to sync user profile", { module: "users", action: "sync-profile", metadata: { uid }, error });
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

// Get users for assignee lists, scoped to the given organization's active
// members. Without an organizationId, no users are returned — this
// function used to read the entire `users` collection unfiltered, which
// leaked every user across every organization in this multi-tenant system.
export async function getUsers(organizationId?: string): Promise<{ users: UserProfile[] | null; error: string | null }> {
    try {
        if (!organizationId) {
            return { users: [], error: null };
        }

        const membersQuery = query(
            collection(db, "organization_members"),
            where("organizationId", "==", organizationId),
            where("status", "==", "active")
        );
        const membersSnap = await getDocs(membersQuery);
        const userIds = Array.from(
            new Set(membersSnap.docs.map((d) => d.data().userId as string).filter(Boolean))
        );

        if (userIds.length === 0) {
            return { users: [], error: null };
        }

        // Firestore "in" queries are limited to 30 values per query.
        const chunks: string[][] = [];
        for (let i = 0; i < userIds.length; i += 30) {
            chunks.push(userIds.slice(i, i + 30));
        }

        const usersRef = collection(db, "users");
        const chunkResults = await Promise.all(
            chunks.map((chunk) => getDocs(query(usersRef, where(documentId(), "in", chunk))))
        );

        const users = chunkResults.flatMap((snapshot) =>
            snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                return {
                    uid: docSnap.id,
                    ...data,
                    // Fallback for missing displayName
                    displayName: data.displayName || data.email?.split('@')[0] || "Unknown User"
                } as UserProfile;
            })
        );

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

