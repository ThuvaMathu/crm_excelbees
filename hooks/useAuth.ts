"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { updateLastLogin } from "@/lib/firestore/users";
import { UserRole } from "@/types/crm";
import { User as FirebaseUser } from "firebase/auth";

// Extend Firebase User with our custom properties
export interface User extends FirebaseUser {
  role?: UserRole;
}

export function useAuth() {
  const { user, setUser, setLoading, loading } = useAuthStore();

  useEffect(() => {
    // Set loading true when starting auth check
    setLoading(true);

    // Timeout fallback - if auth doesn't complete in 5 seconds, stop loading
    const timeout = setTimeout(() => {
      console.warn("Auth check timeout - setting loading to false");
      setLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout); // Clear timeout since auth state changed
      
      try {
        if (firebaseUser) {
          // User is signed in
          setUser(firebaseUser as User);

          // Update last login timestamp (wrapped in try-catch to prevent blocking)
          try {
            await updateLastLogin(firebaseUser.uid);
          } catch (error) {
            console.error("Failed to update last login:", error);
            // Continue anyway - don't block the user from accessing the dashboard
          }
        } else {
          // User is signed out
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setUser(null);
      } finally {
        // Always set loading to false
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [setUser, setLoading]);

  return { user, loading };
}
