"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, UserCog, Shield, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { UserRole, UserPermissions, ModuleKey } from "@/types/crm";
import { ROLE_DEFAULTS } from "@/types/crm";
import { updateUserProfile } from "@/lib/firestore/users";
import { createAuditLog, AuditActions } from "@/lib/firestore/audit-logs";

interface EditUserDialogProps {
    user: {
        uid: string;
        displayName: string;
        email: string;
        role: UserRole;
        isActive?: boolean;
        permissions?: UserPermissions;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUserUpdated: () => void;
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
    const { user: currentUser } = useAuth();
    const { isAdmin } = usePermission();

    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"profile" | "permissions">("profile");

    // Form state
    const [formData, setFormData] = useState({
        displayName: user.displayName || "",
        email: user.email || "",
        role: user.role || "team",
        isActive: user.isActive !== false,
    });

    // Permission state - use custom or role defaults
    const [permissions, setPermissions] = useState<UserPermissions>(
        user.permissions || ROLE_DEFAULTS[user.role || "team"]
    );

    // Update form data when user prop changes
    useEffect(() => {
        setFormData({
            displayName: user.displayName || "",
            email: user.email || "",
            role: user.role || "team",
            isActive: user.isActive !== false,
        });
        setPermissions(user.permissions || ROLE_DEFAULTS[user.role || "team"]);
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !isAdmin()) {
            toast.error("You don't have permission to edit users");
            return;
        }

        setLoading(true);

        try {
            // Update user profile
            const { success, error } = await updateUserProfile(user.uid, {
                displayName: formData.displayName,
                role: formData.role,
                isActive: formData.isActive,
                permissions,
            });

            if (success) {
                // Log audit
                await createAuditLog({
                    action: formData.role !== user.role ? AuditActions.ROLE_CHANGED : AuditActions.PERMISSION_CHANGED,
                    performedBy: currentUser.uid,
                    performedByName: currentUser.displayName || currentUser.email || "",
                    targetUserId: user.uid,
                    targetUserName: user.displayName || user.email,
                    details: {
                        oldRole: user.role,
                        newRole: formData.role,
                        oldPermissions: user.permissions,
                        newPermissions: permissions,
                    },
                });

                toast.success("User updated successfully!");
                onUserUpdated();
                onOpenChange(false);
            } else {
                toast.error(error || "Failed to update user");
            }
        } catch (error: any) {
            console.error("Error updating user:", error);
            toast.error("Failed to update user");
        } finally {
            setLoading(false);
        }
    };

    const resetToDefaults = () => {
        const defaults = ROLE_DEFAULTS[formData.role];
        if (defaults) {
            setPermissions(defaults);
            toast.success("Reset to role defaults");
        }
    };

    const canEditField = (field: string): boolean => {
        // Can't edit own role/status
        if (currentUser?.uid === user.uid) return false;
        return isAdmin();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <UserCog className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                                Manage user profile, role, and permissions. Changes take effect immediately.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === "profile"
                                ? "border-b-2 border-primary text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab("permissions")}
                        className={`px-6 py-3 font-medium transition-colors ${activeTab === "permissions"
                                ? "border-b-2 border-primary text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Permissions
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6">
                    {activeTab === "profile" ? (
                        <div className="space-y-6">
                            {/* User Info Card */}
                            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Profile Information
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="displayName">Full Name</Label>
                                        <Input
                                            id="displayName"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            disabled={!canEditField("displayName")}
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            className="bg-muted"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Email cannot be changed
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select
                                            value={formData.role}
                                            onValueChange={(value: UserRole) => {
                                                setFormData({ ...formData, role: value });
                                                // Reset permissions to new role defaults
                                                setPermissions(ROLE_DEFAULTS[value]);
                                            }}
                                            disabled={!canEditField("role")}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="team">Team Member</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="admin">Administrator</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="isActive">Account Status</Label>
                                        <div className="flex items-center gap-3 mt-3">
                                            <Switch
                                                id="isActive"
                                                checked={formData.isActive}
                                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                                disabled={!canEditField("isActive")}
                                            />
                                            <span className="text-sm">
                                                {formData.isActive ? (
                                                    <span className="text-green-600 font-medium">Active</span>
                                                ) : (
                                                    <span className="text-red-600 font-medium">Deactivated</span>
                                                )}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Deactivated users cannot sign in
                                        </p>
                                    </div>
                                </div>

                                {/* Current Role Badge */}
                                <div className="flex items-center justify-between pt-2">
                                    <Badge
                                        variant="outline"
                                        className={
                                            formData.role === "admin"
                                                ? "border-red-500 text-red-700"
                                                : formData.role === "manager"
                                                    ? "border-purple-500 text-purple-700"
                                                    : "border-blue-500 text-blue-700"
                                        }
                                    >
                                        Current Role: {formData.role.toUpperCase()}
                                    </Badge>
                                    {user.uid === currentUser?.uid && (
                                        <p className="text-xs text-amber-600 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            You cannot edit your own account
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Permissions Tab */
                        <PermissionEditor
                            permissions={permissions}
                            onChange={setPermissions}
                            canEdit={canEditField("permissions")}
                        />
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        {activeTab === "permissions" && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={resetToDefaults}
                                disabled={loading || !canEditField("permissions")}
                            >
                                Reset to Defaults
                            </Button>
                        )}
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/**
 * PermissionEditor Component
 */
interface PermissionEditorProps {
    permissions: UserPermissions;
    onChange: (permissions: UserPermissions) => void;
    canEdit: boolean;
}

function PermissionEditor({ permissions, onChange, canEdit }: PermissionEditorProps) {
    const updateModule = (module: keyof UserPermissions, key: string, value: boolean) => {
        if (!canEdit) return;
        onChange({
            ...permissions,
            [module]: {
                ...permissions[module],
                [key]: value,
            },
        });
    };

    const updateFeature = (feature: keyof UserPermissions, value: boolean) => {
        if (!canEdit) return;
        onChange({
            ...permissions,
            [feature]: { enabled: value },
        });
    };

    const modules: Array<{ key: keyof UserPermissions; label: string; description: string }> = [
        { key: "leads", label: "Leads", description: "Manage leads and prospects" },
        { key: "contacts", label: "Contacts", description: "Contact management" },
        { key: "companies", label: "Companies", description: "Company profiles" },
        { key: "deals", label: "Deals", description: "Pipeline deals" },
        { key: "projects", label: "Projects", description: "Project management" },
        { key: "tasks", label: "Tasks", description: "Task tracking" },
        { key: "invoices", label: "Invoices", description: "Billing & invoices" },
        { key: "reports", label: "Reports", description: "Analytics & reports" },
    ];

    const features: Array<{ key: keyof UserPermissions; label: string; icon: string }> = [
        { key: "marketingAI", label: "Marketing AI", icon: "🤖" },
        { key: "competitorAnalysis", label: "Competitor Analysis", icon: "🎯" },
        { key: "keywordResearch", label: "Keyword Research", icon: "🔍" },
        { key: "blogWriter", label: "Blog Writer", icon: "✍️" },
        { key: "emailCampaigns", label: "Email Campaigns", icon: "📧" },
        { key: "marketingCalendar", label: "Marketing Calendar", icon: "📅" },
        { key: "seoAnalyzer", label: "SEO Analyzer", icon: "📊" },
        { key: "aiCopilot", label: "AI Copilot", icon: "🤝" },
    ];

    return (
        <div className="space-y-6">
            {/* CRM Module Permissions */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    CRM Module Permissions
                </h3>
                <p className="text-sm text-muted-foreground">
                    Configure what this user can do in each CRM module
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {modules.map((module) => {
                        const perm = permissions[module.key] as import("@/types/crm").ModulePermission;
                        if (!perm || typeof perm !== "object") return null;

                        return (
                            <div
                                key={module.key}
                                className="border rounded-lg p-4 space-y-3 bg-card"
                            >
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold">{module.label}</h4>
                                    <Switch
                                        checked={perm.read}
                                        onCheckedChange={(v) => updateModule(module.key, "read", v)}
                                        disabled={!canEdit}
                                        className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">{module.description}</p>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={perm.create}
                                            onChange={(e) => updateModule(module.key, "create", e.target.checked)}
                                            disabled={!canEdit}
                                            className="rounded"
                                        />
                                        <span>Create</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={perm.edit}
                                            onChange={(e) => updateModule(module.key, "edit", e.target.checked)}
                                            disabled={!canEdit}
                                            className="rounded"
                                        />
                                        <span>Edit Own</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={perm.editAll || false}
                                            onChange={(e) => updateModule(module.key, "editAll", e.target.checked)}
                                            disabled={!canEdit}
                                            className="rounded"
                                        />
                                        <span>Edit All</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={perm.delete || false}
                                            onChange={(e) => updateModule(module.key, "delete", e.target.checked)}
                                            disabled={!canEdit}
                                            className="rounded"
                                        />
                                        <span>Delete</span>
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Premium Feature Access */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    Premium Features Access
                </h3>
                <p className="text-sm text-muted-foreground">
                    Enable/disable access to premium Marketing AI features
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {features.map((feature) => {
                        const feat = permissions[feature.key] as import("@/types/crm").FeatureToggle;
                        if (!feat) return null;

                        const isEnabled = typeof feat === "object" ? feat.enabled : false;

                        return (
                            <div
                                key={feature.key}
                                className={`border rounded-lg p-4 flex items-center justify-between transition-colors ${isEnabled
                                        ? "border-primary bg-primary/5"
                                        : "border-muted bg-muted/30 opacity-60"
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{feature.icon}</span>
                                    <span className="text-sm font-medium">{feature.label}</span>
                                </div>
                                <Switch
                                    checked={isEnabled}
                                    onCheckedChange={(v) => updateFeature(feature.key, v)}
                                    disabled={!canEdit}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {!canEdit && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-semibold">Read-only mode</p>
                        <p>You don't have permission to modify user settings. Changes you make here won't be saved.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
