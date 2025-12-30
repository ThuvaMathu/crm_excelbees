import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export type UserRole = "admin" | "manager" | "sales" | "support";
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
  status: UserStatus;
  // Timestamps
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
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
  console.log("📝 Creating user profile in Firestore for UID:", uid);
  console.log("📝 User data:", { email: data.email, displayName: data.displayName });
  
  try {
    const userRef = doc(db, "users", uid);
    console.log("📁 Firestore reference created for collection: users, document:", uid);
    
    // Check if user already exists
    console.log("🔍 Checking if user already exists...");
    const existingUser = await getDoc(userRef);
    
    if (existingUser.exists()) {
      console.log("✅ User already exists, updating lastLoginAt");
      // User already exists, just update lastLoginAt
      await setDoc(
        userRef,
        {
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log("✅ User lastLoginAt updated successfully");
      return { success: true, error: null };
    }

    console.log("📝 Creating new user profile...");
    // Create new user profile
    const userProfile: Omit<UserProfile, "uid"> = {
      email: data.email,
      displayName: data.displayName,
      firstName: data.firstName,
      lastName: data.lastName,
      photoURL: data.photoURL,
      phone: data.phone,
      employeeId: data.employeeId,
      role: data.role || "sales", // Default role
      status: "active",
      createdAt: serverTimestamp() as Timestamp,
      lastLoginAt: serverTimestamp() as Timestamp,
      documents: [],
      settings: {
        theme: "system",
        notifications: true,
        defaultCurrency: "USD",
      },
    };

    console.log("💾 Saving user profile to Firestore...");
    await setDoc(userRef, userProfile);
    console.log("✅ User profile created successfully in Firestore!");
    console.log("✅ User can be found at: Firestore → users →", uid);
    
    return { success: true, error: null };
  } catch (error: any) {
    console.error("❌ Failed to create user profile:", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
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
