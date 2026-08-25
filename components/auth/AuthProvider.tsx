"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth";
import { onAuthStateChanged, Unsubscribe } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { syncTokenToCookie } from "@/lib/auth/token-sync";
import { updateLastLogin } from "@/lib/firestore/users";
import { doc, onSnapshot } from "firebase/firestore";
import { User as CustomUser } from "@/hooks/useAuth";
import type { UserPermissions } from "@/types/crm";
import { logger } from "@/lib/logger/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setLoading, setHydrated } = useAuthStore();
    const unsubscribeDoc = useRef<Unsubscribe | null>(null);

    useEffect(() => {
        // Sync Firebase ID token to a cookie so server actions (AI features)
        // can verify the caller.
        syncTokenToCookie();

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
                        logger.warn("Server data timeout - forcing render with current state", { module: "auth" });
                        setLoading(false);
                        setHydrated(true);
                    }, 5000);

                    unsubscribeDoc.current = onSnapshot(userRef, { includeMetadataChanges: true }, async (docSnap) => {

                        const source = docSnap.metadata.fromCache ? "local cache" : "server";
                        logger.debug("Firestore user doc update", { module: "auth", userId: firebaseUser.uid, metadata: { source, exists: docSnap.exists() } });

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
                                    logger.debug("Role resolved from custom claims", { module: "auth", userId: firebaseUser.uid, metadata: { resolvedRole, source: "claims" } });
                                } else {
                                    logger.debug("Role resolved from Firestore", { module: "auth", userId: firebaseUser.uid, metadata: { resolvedRole, source: "firestore" } });
                                }
                            } catch {
                                logger.warn("Could not read token claims, falling back to Firestore role", { module: "auth", userId: firebaseUser.uid });
                            }

                            const extendedUser: CustomUser = {
                                ...firebaseUser,
                                role: resolvedRole as CustomUser["role"],
                                permissions: userData.permissions as UserPermissions | undefined,
                                isFirstLogin: userData.isFirstLogin === true,
                                // Treat missing/undefined as true so legacy users (created before
                                // the onboarding feature) are not forced through the wizard again.
                                // Only an explicit false means onboarding is incomplete.
                                isOnboarded: userData.isOnboarded !== false,
                                position: userData.position || "",
                                createdBy: userData.createdBy,
                                passwordChangedAt: userData.passwordChangedAt?.toDate(),
                                updatedAt: userData.updatedAt?.toDate(),
                                provider: userData.provider || "password",
                                isActive: userData.isActive !== false,
                            };

                            setUser(extendedUser);

                            // VITAL FIX: Avoid "Flash of Stale Cache".
                            // Only stop loading if data is from SERVER, or if we already stopped previously.
                            if (!docSnap.metadata.fromCache) {
                                logger.info("Server data received. Finalizing auth state", { module: "auth", userId: firebaseUser.uid, metadata: { source } });
                                clearTimeout(serverWaitTimeout);
                                setLoading(false);
                                setHydrated(true);
                            } else {
                                logger.debug("Cached data loaded. Waiting for server confirmation", { module: "auth", userId: firebaseUser.uid, metadata: { source } });
                                // We purposefully leave loading=true here to keep the spinner visible
                                // until server version arrives (preventing the "Pending -> Dashboard" glitch).
                            }

                        } else {
                            // Doc missing -> Unapproved / not yet provisioned
                            logger.warn("User document missing - defaulting to unapproved", { module: "auth", userId: firebaseUser.uid });
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
                        logger.error("Error fetching user profile", { module: "auth", action: "fetch", userId: firebaseUser.uid, error });
                        clearTimeout(serverWaitTimeout);
                        // Fallback on error
                        setUser(null);
                        setLoading(false);
                        setHydrated(true);
                    });

                    // Update last login in background
                    updateLastLogin(firebaseUser.uid).catch((err) =>
                        logger.error("Error updating last login", { module: "auth", action: "update", userId: firebaseUser.uid, error: err })
                    );

                } else {
                    //2. No Auth -> Cleanup and Reset
                    if (unsubscribeDoc.current) {
                        unsubscribeDoc.current();
                        unsubscribeDoc.current = null;
                    }
                    logger.info("No user logged in", { module: "auth" });
                    setUser(null);
                    setLoading(false);
                    setHydrated(true);
                }
            } catch (error) {
                logger.error("Auth state change error", { module: "auth", action: "init", error });
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
