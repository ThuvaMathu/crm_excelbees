"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth";
import { onAuthStateChanged, Unsubscribe } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { updateLastLogin } from "@/lib/firestore/users";
import { doc, onSnapshot } from "firebase/firestore";
import { User as CustomUser } from "@/hooks/useAuth";
import type { UserPermissions } from "@/types/crm";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setLoading, setHydrated } = useAuthStore();
    const unsubscribeDoc = useRef<Unsubscribe | null>(null);

    useEffect(() => {
        // STRICT ASYNC FLOW:
        //1. Start Loading
        setLoading(true);

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    //2. Auth Found -> Wait for Firestore (Do NOT set loading=false yet)

                    // Cleanup previous listener if any
                    if (unsubscribeDoc.current) {
                        unsubscribeDoc.current();
                        unsubscribeDoc.current = null;
                    }

                    const userRef = doc(db, "users", firebaseUser.uid);

                    // Safety timeout: If server never responds (offline), force load after 5s
                    const serverWaitTimeout = setTimeout(() => {
                        console.warn("⚠️ Server data timeout - forcing render with current state");
                        setLoading(false);
                        setHydrated(true);
                    }, 5000);

                    unsubscribeDoc.current = onSnapshot(userRef, { includeMetadataChanges: true }, async (docSnap) => {

                        const source = docSnap.metadata.fromCache ? "local cache" : "server";
                        console.log(`🔥 Firestore Update (${source}):`, docSnap.exists() ? "Exists" : "Missing");

                        if (docSnap.exists()) {
                            const userData = docSnap.data();

                            // --- ROLE RESOLUTION (Priority Order) ---
                            // 1st: Custom Claims (server-side, cannot be spoofed by client)
                            // 2nd: Firestore document role field (fallback)
                            let resolvedRole = userData.role || "team";
                            try {
                                // Force-refresh to get the latest claims after role updates
                                const tokenResult = await firebaseUser.getIdTokenResult(false);
                                if (tokenResult.claims.role) {
                                    resolvedRole = tokenResult.claims.role as string;
                                    console.log(`🔑 Role resolved from Custom Claims: ${resolvedRole}`);
                                } else {
                                    console.log(`📄 Role resolved from Firestore: ${resolvedRole}`);
                                }
                            } catch {
                                console.warn("⚠️ Could not read token claims, falling back to Firestore role.");
                            }

                            const extendedUser: CustomUser = {
                                ...firebaseUser,
                                role: resolvedRole as CustomUser["role"],
                                permissions: userData.permissions as UserPermissions | undefined,
                                isFirstLogin: userData.isFirstLogin === true,
                                createdBy: userData.createdBy,
                                passwordChangedAt: userData.passwordChangedAt?.toDate(),
                                updatedAt: userData.updatedAt?.toDate(),
                                provider: userData.provider || "password",
                                isActive: userData.isActive,
                            };

                            setUser(extendedUser);

                            // VITAL FIX: Avoid "Flash of Stale Cache".
                            // Only stop loading if data is from SERVER, or if we already stopped previously.
                            if (!docSnap.metadata.fromCache) {
                                console.log("✅ Server data received. Finalizing auth state.");
                                clearTimeout(serverWaitTimeout);
                                setLoading(false);
                                setHydrated(true);
                            } else {
                                console.log("⏳ Cached data loaded. Waiting for server confirmation...");
                                // We purposefully leave loading=true here to keep the spinner visible
                                // until server version arrives (preventing the "Pending -> Dashboard" glitch).
                            }

                        } else {
                            // Doc missing -> Unapproved / not yet provisioned
                            console.warn("⚠️ User document missing - defaulting to unapproved");
                            const extendedUser: CustomUser = {
                                ...firebaseUser,
                                role: "team",
                                isActive: false, // Enforce inactive for un-provisioned users
                                isFirstLogin: true,
                            };
                            setUser(extendedUser);

                            // For missing docs, we can probably accept cache or server
                            if (!docSnap.metadata.fromCache) {
                                clearTimeout(serverWaitTimeout);
                                setLoading(false);
                                setHydrated(true);
                            }
                        }
                    }, (error) => {
                        console.error("Error fetching user profile:", error);
                        clearTimeout(serverWaitTimeout);
                        // Fallback on error
                        setUser(null);
                        setLoading(false);
                        setHydrated(true);
                    });

                    // Update last login in background
                    updateLastLogin(firebaseUser.uid).catch(console.error);

                } else {
                    //2. No Auth -> Cleanup and Reset
                    if (unsubscribeDoc.current) {
                        unsubscribeDoc.current();
                        unsubscribeDoc.current = null;
                    }
                    console.log("❌ No user logged in");
                    setUser(null);
                    setLoading(false);
                    setHydrated(true);
                }
            } catch (error) {
                console.error("Auth state change error:", error);
                setUser(null);
                setLoading(false);
                setHydrated(true);
            }
        });

        return () => {
            if (unsubscribeDoc.current) {
                unsubscribeDoc.current();
            }
            unsubscribe();
        };
    }, [setUser, setLoading, setHydrated]);

    return <>{children}</>;
}
