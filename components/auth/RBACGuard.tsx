"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { UserRole, FeatureKey, ModuleKey } from "@/types/crm";
import { ROLE_DEFAULTS } from "@/types/crm";
import { Loader2 } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";

interface RBACGuardProps {
    children: React.ReactNode;
    requiredRole?: UserRole | UserRole[];
    requireApproval?: boolean;
    requirePermission?: {
        module: ModuleKey;
        action?: "read" | "create" | "edit" | "delete";
    };
    requireFeature?: FeatureKey;
    fallback?: React.ReactNode;
}

export function RBACGuard({
    children,
    requiredRole,
    requireApproval = true,
    requirePermission,
    requireFeature,
    fallback,
}: RBACGuardProps) {
    const { user, loading, hydrated } = useAuth();
    const { can, hasFeature: checkFeature } = usePermission();
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

        // 2. Check Approval Status
        if (requireApproval && !user.isActive) {
            router.push("/pending");
            return;
        }

        // 3. Check Roles
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

        // 4. Check Module Permission
        if (requirePermission) {
            const { module, action = "read" } = requirePermission;
            if (!can(module, action)) {
                router.push("/dashboard");
                return;
            }
        }

        // 5. Check Feature Access
        if (requireFeature) {
            if (!checkFeature(requireFeature)) {
                router.push("/dashboard");
                return;
            }
        }

        // All checks passed
        setIsAuthorized(true);
    }, [user, loading, hydrated, router, pathname, requiredRole, requireApproval, requirePermission, requireFeature, isMounted, can, checkFeature]);

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

    // Show custom fallback or content
    return <>{isAuthorized ? children : (fallback || null)}</>;
}

/**
 * PermissionGate - Component-level permission check
 * Shows/hides children based on permission (no redirect)
 */
interface PermissionGateProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    module: ModuleKey;
    action?: "read" | "create" | "edit" | "delete";
}

export function PermissionGate({ children, fallback = null, module, action = "read" }: PermissionGateProps) {
    const { can } = usePermission();

    if (!can(module, action)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * FeatureGate - Component-level feature access check
 * Shows/hides children based on feature access (no redirect)
 */
interface FeatureGateProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    feature: FeatureKey;
}

export function FeatureGate({ children, fallback = null, feature }: FeatureGateProps) {
    const { hasFeature: checkFeature } = usePermission();

    if (!checkFeature(feature)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * RoleGate - Component-level role check
 * Shows/hides children based on role (no redirect)
 */
interface RoleGateProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    allowedRoles: UserRole[];
}

export function RoleGate({ children, fallback = null, allowedRoles }: RoleGateProps) {
    const { user } = useAuth();

    if (!user?.role || !allowedRoles.includes(user.role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
