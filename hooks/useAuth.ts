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
  permissions?: UserPermissions;
  isFirstLogin?: boolean;
  isActive?: boolean;
  isOnboarded?: boolean;
  position?: string;
  createdBy?: string;
  passwordChangedAt?: Date;
  updatedAt?: Date;
  provider?: "password" | "google.com";
}

export function useAuth() {
  const { user, loading, hydrated } = useAuthStore();
  // No side effects here! Logic moved to AuthProvider.
  return { user, loading, hydrated };
}
