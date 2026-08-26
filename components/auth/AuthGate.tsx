"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
    "/login",
    "/signup",
    "/register",
    "/forgot-password",
    "/change-password",
    "/onboarding",
    "/auth/action",
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
            if (!isPublicRoute) {
                router.replace("/login");
            }
            return;
        }

        // SCENARIO 2: Account Deactivated
        if (user.isActive === false) {
            router.replace("/login?error=account_deactivated");
            return;
        }

        // SCENARIO 3: First Login - Force Password Change (email/password accounts only)
        if (user.isFirstLogin === true && user.provider !== "google.com") {
            if (pathname !== "/change-password") {
                router.replace("/change-password");
            }
            return;
        }

        // SCENARIO 4: Onboarding incomplete — collect profile before accessing CRM
        if (user.isOnboarded === false && !pathname?.startsWith("/onboarding")) {
            router.replace("/onboarding");
            return;
        }

        // Redirect logged-in users away from auth pages
        if (pathname === "/login" || pathname === "/pending-approval" || pathname === "/change-password") {
            router.replace("/org");
        }
        return;
    }, [user, loading, hydrated, pathname, router, isMounted]);

    if (!isMounted || loading || !hydrated) {
        const isPublicNow = PUBLIC_ROUTES.some(route => {
            if (route === "/") return pathname === "/";
            return pathname?.startsWith(route);
        });
        if (isPublicNow) return <>{children}</>;
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Initializing CRM...</p>
                </div>
            </div>
        );
    }

    const isPublicRoute = PUBLIC_ROUTES.some(route => {
        if (route === "/") return pathname === "/";
        return pathname?.startsWith(route);
    });

    if (!user) {
        if (!isPublicRoute) return <LoadingSpinner />;
        return <>{children}</>;
    }

    if (user.isActive === false) return <LoadingSpinner />;

    if (user.isFirstLogin === true && user.provider !== "google.com") {
        if (pathname !== "/change-password") return <LoadingSpinner />;
    }

    if (user.isOnboarded === false && !pathname?.startsWith("/onboarding")) return <LoadingSpinner />;

    if (pathname === "/pending-approval" || pathname === "/login") return <LoadingSpinner />;

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
