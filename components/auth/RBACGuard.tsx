"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { UserRole } from "@/types/crm";
import { Loader2 } from "lucide-react";

interface RBACGuardProps {
    children: React.ReactNode;
    requiredRole?: UserRole | UserRole[];
    requireApproval?: boolean;
}

export function RBACGuard({
    children,
    requiredRole,
    requireApproval = true
}: RBACGuardProps) {
    const { user, loading, hydrated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Prevent hydration issues and flash redirects
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // Don't do anything until:
        // 1. Component is mounted (prevent SSR issues)
        // 2. Auth is not loading
        // 3. Firebase has hydrated (confirmed cached state or loaded fresh)
        if (!isMounted || loading || !hydrated) {
            return;
        }

        // 1. Check Authentication
        if (!user) {
            router.push("/login");
            return;
        }

        // 2. Check Roles
        if (requiredRole) {
            const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
            if (user.role && !roles.includes(user.role)) {
                router.push("/dashboard");
                return;
            }
            if (!user.role) {
                router.push("/dashboard");
                return;
            }
        }

        // All checks passed
        setIsAuthorized(true);
    }, [user, loading, hydrated, router, pathname, requiredRole, requireApproval, isMounted]);

    // Show loading only when not mounted or actively loading
    if (!isMounted || loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // If hydrated but not authorized, show loading while redirecting
    if (hydrated && !isAuthorized) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-gray-500">Redirecting...</p>
                </div>
            </div>
        );
    }

    // Show content once authorized
    return <>{children}</>;
}
