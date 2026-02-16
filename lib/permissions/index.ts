// Permission & Auth System Exports
// ========================================

// Types
export type { UserRole, UserPermissions, ModulePermission, FeatureToggle, ModuleKey, FeatureKey, ActionKey, AuditAction } from "@/types/crm";

// Auth Hook
export { useAuth } from "@/hooks/useAuth";

// Permission Hook
export { usePermission, PermissionGate, FeatureGate, RoleGate } from "@/hooks/usePermission";

// RBAC Components
export { RBACGuard } from "@/components/auth/RBACGuard";

// API Auth
export * from "@/lib/auth/api-auth";
export * from "@/lib/api/protected-route";
export * from "@/lib/api/api-fetch";

// Firestore Functions
export { getUserProfile, getUsers, createUserProfile, updateUserProfile, approveUser, deleteUser, updateUserRole, updateUserPermissions, resetUserPermissions, getUserInvoiceSettings, setUserInvoiceSettings } from "@/lib/firestore/users";

// Audit Logs
export { createAuditLog, getAuditLogsForUser, getAllAuditLogs, AuditActions } from "@/lib/firestore/audit-logs";
