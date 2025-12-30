"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { onAuthStateChanged } from "@/lib/auth/auth-service";
import { getUserProfile, updateLastLogin } from "@/lib/firestore/users";

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

    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      clearTimeout(timeout); // Clear timeout since auth state changed
      
      try {
        if (firebaseUser) {
          // User is signed in
          setUser(firebaseUser);

          // Update last login timestamp (wrapped in try-catch to prevent blocking)
          try {
            await updateLastLogin(firebaseUser.uid);
          } catch (error) {
            console.error("Failed to update last login:", error);
            // Continue anyway - don't block the user from accessing the dashboard
          }

          // Optionally fetch full user profile from Firestore
          // const { user: profile } = await getUserProfile(firebaseUser.uid);
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
