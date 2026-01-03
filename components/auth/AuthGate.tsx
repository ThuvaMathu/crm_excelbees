"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
    "/login",
    "/register",
    "/forgot-password",
    "/change-password", // First-time password change
    "/auth/action", // Firebase email action handlers
    "/" // Landing page is public
];

export function AuthGate({ children }: { children: React.ReactNode }) {
    const { user, loading, hydrated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // 1. Wait for hydration/mounting
        if (!isMounted || loading || !hydrated) return;

        const isPublicRoute = PUBLIC_ROUTES.some(route => {
            if (route === "/") return pathname === "/";
            return pathname?.startsWith(route);
        });

        // SCENARIO 1: Not Logged In
        if (!user) {
            // Redirect to login if on protected route OR root path
            if (!isPublicRoute) {
                console.log("🔒 Route: Not logged in -> Redirecting to Login");
                router.replace("/login");
            }
            return;
        }

        // SCENARIO 2: Account Deactivated
        if (user.isActive === false) {
            console.log("🔒 Route: Account deactivated -> Signing out");
            // Sign out will be handled by AuthProvider
            router.replace("/login?error=account_deactivated");
            return;
        }

        // SCENARIO 3: First Login - Force Password Change
        if (user.isFirstLogin === true) {
            if (pathname !== "/change-password") {
                console.log("🔒 Route: First login -> Redirecting to Change Password");
                router.replace("/change-password");
            }
            return;
        }


        // Redirect login or pending page to dashboard
        if (pathname === "/login" || pathname === "/pending-approval" || pathname === "/change-password") {
            console.log("🔒 Route: User approved -> Redirecting to Dashboard");
            router.replace("/dashboard");
        }
        return;
    }, [user, loading, hydrated, pathname, router, isMounted]);

    // Debug logging
    console.log("🔒 AuthGate State:", { isMounted, loading, hydrated, hasUser: !!user, pathname });

    // Loading State
    // Show loading spinner ONLY if:
    // 1. Not hydrated/mounted yet
    // 2. Loading state is true
    // AND we are not on a public route (optional: public routes can render instantly if we want, but checking auth state first is safer to prevent flashing login form if already logged in)

    // Better UX: 
    // If we are waiting for auth (loading/!hydrated):
    // - If on public route: Maybe show content (login form)? But if they are actually logged in, they will see login form then flash to dashboard.
    // ----------------------------------------------------------------
    // 1. GLOBAL LOADING STATE (The "Wait for Decision" Phase)
    // ----------------------------------------------------------------
    // If not mounted or still loading auth state, show a full-screen spinner.
    // We explicitly wait for 'loading' to be false, which now means Firestore is completely done.
    if (!isMounted || loading || !hydrated) {
        console.log("⚠️ SHOWING LOADING SCREEN:", {
            notMounted: !isMounted,
            stillLoading: loading,
            notHydrated: !hydrated
        });
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Initializing CRM...</p>
                </div>
            </div>
        );
    }

    console.log("✅ PASSED LOADING CHECK - Rendering content");

    const isPublicRoute = PUBLIC_ROUTES.some(route => {
        if (route === "/") return pathname === "/";
        return pathname?.startsWith(route);
    });

    // ----------------------------------------------------------------
    // 2. FINAL DECISION ROUTING (No Intermediate States)
    // ----------------------------------------------------------------

    // Scenario 1: NOT LOGGED IN
    if (!user) {
        console.log("🔴 AuthGate Scenario 1: NOT LOGGED IN");
        // If trying to access protected route -> Redirect to Login
        if (!isPublicRoute) {
            console.log("  → Showing loading spinner (redirecting)");
            return <LoadingSpinner />; // Block content while redirecting
        }
        // Public route -> Allow
        console.log("  → Rendering children (public route)");
        return <>{children}</>;
    }

    // Scenario 2: Account Deactivated
    if (user.isActive === false) {
        console.log("🟠 AuthGate Scenario 2: ACCOUNT DEACTIVATED");
        console.log("  → Showing loading spinner (redirecting to login)");
        return <LoadingSpinner />;
    }

    // Scenario 3: LOGGED IN and ACTIVE
    console.log("🟢 AuthGate Scenario 3: LOGGED IN and ACTIVE", { pathname });
    // If on pending page or login page -> Dashboard
    if (pathname === "/pending-approval" || pathname === "/login") {
        console.log("  → Showing loading spinner (redirecting to dashboard)");
        return <LoadingSpinner />; // Block content while redirecting
    }

    // Allow access to everything else (Dashboard, Leads, etc)
    console.log("  → Rendering children for approved user on", pathname);
    console.log("  → Children type:", typeof children, children);
    return <>{children}</>;
}

// Helper for consistent spinner
function LoadingSpinner() {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}
