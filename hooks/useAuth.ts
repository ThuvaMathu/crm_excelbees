"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { updateLastLogin } from "@/lib/firestore/users";
import { UserRole, UserPermissions } from "@/types/crm";
import { doc, onSnapshot } from "firebase/firestore";

// Custom User Interface
export interface User extends FirebaseUser {
  role?: UserRole;
  permissions?: UserPermissions; // NEW: Granular permissions
  isFirstLogin?: boolean; // Force password change on first login
  isActive?: boolean; // Account activation status
  createdBy?: string; // Admin UID who created this user
  passwordChangedAt?: Date; // Last password change timestamp
  updatedAt?: Date; // Last profile update
  provider?: "password" | "google.com"; // Auth provider
}

export function useAuth() {
  const { user, loading, hydrated } = useAuthStore();
  // No side effects here! Logic moved to AuthProvider.
  return { user, loading, hydrated };
}
