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

export type UserRole = "admin" | "manager" | "team";
export type UserStatus = "active" | "inactive";

export interface UserDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: Timestamp;
}

export interface UserProfile {
  uid: string;
  email: string;
  // Name fields
  displayName: string; // Full name for display
  firstName?: string;
  lastName?: string;
  // Profile
  photoURL?: string;
  phone?: string;
  employeeId?: string;
  // Role & Status
  role: UserRole;
  isFirstLogin: boolean; // Force password change on first login
  isActive: boolean; // Soft delete flag (account deactivation)
  status: UserStatus;
  // Timestamps
  createdAt: Timestamp;
  createdBy: string; // Admin UID who created this user
  lastLoginAt: Timestamp;
  passwordChangedAt?: Timestamp; // Track password changes
  updatedAt?: Timestamp; // Last profile update
  // Auth Provider
  provider: "password" | "google.com"; // Authentication method
  // Documents
  documents?: UserDocument[];
  // Settings
  settings?: {
    theme?: "light" | "dark" | "system";
    notifications?: boolean;
    defaultCurrency?: string;
  };
}

// Create user profile in Firestore
// Create or Update user profile in Firestore
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
      // EXISTING USER: Only update non-destructive fields
      // ----------------------------------------------------------------
      const userData = existingUser.data();
      console.log(`✅ User exists (Role: ${userData.role}, Active: ${userData.isActive})`);

      // 1. Always update last login
      const updates: any = {
          lastLoginAt: serverTimestamp(),
      };

      // 2. Sync profile fields if they are better/newer (optional, but good for Google Auth)
      // Only update displayName if it's currently "Unknown" or missing
      if (!userData.displayName && data.displayName) {
          updates.displayName = data.displayName;
      }
      if (!userData.photoURL && data.photoURL) {
          updates.photoURL = data.photoURL;
      }

      // 3. BACKFILL SAFETY: Only set admin fields if they represent a corruption state (missing)
      // NEVER overwrite existing values, even if they are false/team
      if (userData.role === undefined || userData.role === null) {
          console.warn("⚠️ Data integrity fix: Backfilling missing ROLE to 'team'");
          updates.role = "team";
      }


      // 4. Ensure createdAt exists
      if (!userData.createdAt) {
          updates.createdAt = serverTimestamp();
      }

      await setDoc(userRef, updates, { merge: true });
      console.log("✅ User profile synced (updates only)");
      return { success: true, error: null };
    }

    // ----------------------------------------------------------------
    // NEW USER: Full creation
    // ----------------------------------------------------------------
    console.log("🆕 Creating NEW user profile...");
    
    // Explicitly define the new user object to ensure strict schema enforcement
    const newUserProfile: Omit<UserProfile, "uid"> = {
      email: data.email,
      displayName: data.displayName || data.email.split('@')[0],
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      photoURL: data.photoURL || "",
      phone: data.phone || "",
      employeeId: data.employeeId || "",
      
      // Critical Security Fields - Set Default
      role: data.role || "team", 
      isFirstLogin: true, // Force password change on first login
      isActive: true, // Active by default
      status: "active",
      
      // Verification Timestamps
      createdAt: serverTimestamp() as Timestamp,
      createdBy: "self_registration", // Will be admin UID for admin-created users
      lastLoginAt: serverTimestamp() as Timestamp,
      passwordChangedAt: undefined,
      updatedAt: serverTimestamp() as Timestamp,
      
      // Auth Provider
      provider: "password", // Default to password, will be updated for Google
      
      documents: [],
      settings: {
        theme: "system",
        notifications: true,
        defaultCurrency: "USD",
      },
    };

    await setDoc(userRef, newUserProfile);
    console.log("✅ New user profile created explicitly:", uid);
    
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
