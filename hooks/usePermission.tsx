"use client";

import { useMemo, ReactNode } from "react";
import { useAuth } from "./useAuth";
import { ROLE_DEFAULTS, UserPermissions, ModuleKey, ActionKey, FeatureKey, UserRole } from "@/types/crm";

/**
 * usePermission - Enterprise Permission Hook
 *
 * Provides granular permission checking for modules, features, and actions.
 * Resolves permissions in this order:
 * 1. User-specific custom permissions (if exists)
 * 2. Role-based defaults (fallback)
 * 3. Admin bypass (admin always has full access)
 */
export function usePermission() {
  const { user } = useAuth();

  // Get user's resolved permissions (custom or role defaults)
  const permissions = useMemo(() => {
    if (!user?.role) return null;
    return user.permissions || ROLE_DEFAULTS[user.role];
  }, [user]);

  // Check if user can perform action on a module
  const can = (
    module: ModuleKey,
    action: ActionKey = "read"
  ): boolean => {
    // Admin bypass - can do everything
    if (user?.role === "admin") return true;

    // No permissions data
    if (!permissions) return false;

    // Feature toggles don't have actions, just enabled check
    const modulePerm = permissions[module];
    if (!modulePerm) return false;

    // Handle feature toggles (marketing AI features)
    if ("enabled" in modulePerm) {
      return (modulePerm as { enabled: boolean }).enabled;
    }

    // Handle module permissions (leads, contacts, etc.)
    if (typeof modulePerm === "object" && action in modulePerm) {
      // editAll also grants edit permission
      if (action === "edit") {
        return (modulePerm as { edit: boolean; editAll: boolean }).edit ||
               (modulePerm as { editAll: boolean }).editAll;
      }
      return (modulePerm as Record<ActionKey, boolean>)[action];
    }

    return false;
  };

  // Check if user has access to a feature
  const hasFeature = (feature: FeatureKey): boolean => {
    // Admin bypass
    if (user?.role === "admin") return true;

    // No permissions data
    if (!permissions) return false;

    const featurePerm = permissions[feature];
    if (!featurePerm) return false;

    // Feature toggles just check enabled
    if ("enabled" in featurePerm) {
      return featurePerm.enabled;
    }

    return false;
  };

  // Check if user can edit all records (not just own)
  const canEditAll = (module: Extract<ModuleKey, "leads" | "contacts" | "companies" | "deals" | "projects" | "tasks" | "invoices" | "reports">): boolean => {
    if (user?.role === "admin") return true;
    if (!permissions) return false;

    const modulePerm = permissions[module];
    if (!modulePerm || typeof modulePerm !== "object") return false;

    return "editAll" in modulePerm ? (modulePerm as { editAll: boolean }).editAll : false;
  };

  // Check if user can delete records
  const canDelete = (module: Extract<ModuleKey, "leads" | "contacts" | "companies" | "deals" | "projects" | "tasks" | "invoices" | "reports">): boolean => {
    return can(module, "delete");
  };

  // Check if user has admin-level access
  const isAdmin = (): boolean => {
    return user?.role === "admin";
  };

  // Check if user is manager or admin
  const isManager = (): boolean => {
    return user?.role === "admin" || user?.role === "manager";
  };

  // Get all enabled modules for UI rendering
  const getEnabledModules = (): ModuleKey[] => {
    if (!permissions) return [];
    return Object.keys(permissions).filter(key => {
      const perm = permissions[key as ModuleKey];
      if (!perm) return false;
      // For features, check enabled
      if ("enabled" in perm) return perm.enabled;
      // For modules, check read access
      if ("read" in perm) return (perm as { read: boolean }).read;
      return false;
    }) as ModuleKey[];
  };

  // Get display label for role
  const getRoleLabel = (): string => {
    const labels: Record<UserRole, string> = {
      admin: "Administrator",
      manager: "Manager",
      team: "Team Member",
    };
    return user?.role ? labels[user.role] : "Unknown";
  };

  // HR-specific permission checks
  const canHr = (
    module: "employees" | "attendance" | "leaves" | "payroll",
    action: ActionKey = "read"
  ): boolean => {
    // Admin bypass
    if (user?.role === "admin") return true;

    // No permissions data
    if (!permissions) return false;

    const hrPerm = permissions.hr;
    if (!hrPerm) return false;

    const modulePerm = hrPerm[module];
    if (!modulePerm) return false;

    // Handle action checks
    if (action === "edit") {
      return (modulePerm as { edit: boolean; editAll: boolean }).edit ||
             (modulePerm as { editAll: boolean }).editAll;
    }
    return (modulePerm as Record<ActionKey, boolean>)[action];
  };

  const canHrEditAll = (
    module: "employees" | "attendance" | "leaves" | "payroll"
  ): boolean => {
    if (user?.role === "admin") return true;
    if (!permissions) return false;

    const hrPerm = permissions.hr;
    if (!hrPerm) return false;

    const modulePerm = hrPerm[module];
    if (!modulePerm || typeof modulePerm !== "object") return false;

    return "editAll" in modulePerm ? (modulePerm as { editAll: boolean }).editAll : false;
  };

  return {
    can,
    hasFeature,
    canEditAll,
    canDelete,
    isAdmin,
    isManager,
    getEnabledModules,
    getRoleLabel,
    canHr,
    canHrEditAll,
    permissions,
    userRole: user?.role,
  };
}

// Type guard helper for components
export function withPermission<T extends { can: (module: ModuleKey, action?: ActionKey) => boolean }>(
  Component: React.ComponentType<T>
) {
  return Component as React.ComponentType<T>;
}

// ============================================================
// COMPONENT GATES
// ============================================================

interface BaseGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface FeatureGateProps extends BaseGateProps {
  feature: FeatureKey;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const { hasFeature } = usePermission();
  if (hasFeature(feature)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}

interface PermissionGateProps extends BaseGateProps {
  module: ModuleKey;
  action?: ActionKey;
}

export function PermissionGate({ module, action = "read", children, fallback = null }: PermissionGateProps) {
  const { can } = usePermission();
  if (can(module, action)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}

interface RoleGateProps extends BaseGateProps {
  allowedRoles: UserRole[];
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { userRole } = usePermission();
  if (userRole && allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}
