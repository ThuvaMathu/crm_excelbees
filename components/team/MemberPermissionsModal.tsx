"use client";

import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { updateMemberPermissionsAction } from "@/app/actions/admin-users";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { RotateCcw, ShieldCheck } from "lucide-react";
import type { OrganizationMember, UserPermissions, UserRole, ModulePermission } from "@/types/crm";
import { ROLE_DEFAULTS } from "@/types/crm";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    open:        boolean;
    onClose:     () => void;
    member:      OrganizationMember;
    orgId:       string;
    callerRole:  UserRole;  // the logged-in user's role in this org
    onSaved:     () => void;
}

const CRM_MODULES = [
    { key: "leads",     label: "Leads" },
    { key: "contacts",  label: "Contacts" },
    { key: "companies", label: "Companies" },
    { key: "deals",     label: "Deals" },
    { key: "projects",  label: "Projects" },
    { key: "tasks",     label: "Tasks" },
    { key: "invoices",  label: "Invoices" },
    { key: "reports",   label: "Reports" },
] as const;

const ACTIONS: { key: keyof ModulePermission; label: string; title: string }[] = [
    { key: "read",    label: "Read",     title: "View records" },
    { key: "create",  label: "Create",   title: "Add new records" },
    { key: "edit",    label: "Edit",     title: "Edit own records" },
    { key: "delete",  label: "Delete",   title: "Delete own records" },
    { key: "editAll", label: "Edit All", title: "Edit any member's records" },
];

function deepClone<T>(obj: T): T { return JSON.parse(JSON.stringify(obj)); }

// ─── Component ────────────────────────────────────────────────────────────────

export function MemberPermissionsModal({ open, onClose, member, orgId, callerRole, onSaved }: Props) {
    const [selectedRole, setSelectedRole] = useState<UserRole>(member.role);
    const [perms,        setPerms]        = useState<UserPermissions>(() =>
        deepClone(member.permissions ?? ROLE_DEFAULTS[member.role])
    );
    const [saving, setSaving] = useState(false);

    // Sync when member prop changes (e.g. modal re-opened for different member)
    useEffect(() => {
        setSelectedRole(member.role);
        setPerms(deepClone(member.permissions ?? ROLE_DEFAULTS[member.role]));
    }, [member.userId, open]);

    const isCallerAdmin   = callerRole === "admin";
    const isCallerManager = callerRole === "manager";

    // Roles available in the selector
    const availableRoles: UserRole[] = isCallerAdmin ? ["admin", "manager", "team"] : ["team"];

    // Managers cannot see/edit userManagement or aiAssistant (admin-tier features)
    const showUserMgmt   = isCallerAdmin;
    const showAiAssist   = true;

    // ── Handlers ──────────────────────────────────────────────────────────────

    function handleRoleChange(newRole: UserRole) {
        setSelectedRole(newRole);
        // Auto-fill with defaults for the new role (user can then customize)
        setPerms(deepClone(ROLE_DEFAULTS[newRole]));
    }

    function handleModuleToggle(moduleKey: string, actionKey: keyof ModulePermission, value: boolean) {
        setPerms((prev) => ({
            ...prev,
            [moduleKey]: { ...(prev as any)[moduleKey], [actionKey]: value },
        }));
    }

    function handleFeatureToggle(featureKey: "aiAssistant" | "userManagement", value: boolean) {
        setPerms((prev) => ({ ...prev, [featureKey]: { enabled: value } }));
    }

    function handleResetDefaults() {
        setPerms(deepClone(ROLE_DEFAULTS[selectedRole]));
    }

    async function handleSave() {
        const callerToken = await auth.currentUser?.getIdToken(true);
        if (!callerToken) { toast.error("Authentication required"); return; }

        setSaving(true);
        const result = await updateMemberPermissionsAction({
            callerToken,
            organizationId: orgId,
            targetUserId:   member.userId,
            role:           selectedRole,
            permissions:    perms,
        });
        setSaving(false);

        if (result.success) {
            toast.success(`Permissions updated for ${member.displayName || member.email}`);
            onSaved();
            onClose();
        } else {
            toast.error(result.error ?? "Failed to update permissions");
        }
    }

    // ── Role badge colours ─────────────────────────────────────────────────────

    const roleBadge: Record<UserRole, string> = {
        admin:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
        manager: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
        team:    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Manage Permissions
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {member.displayName || member.email}
                        {member.email && member.displayName && (
                            <span className="ml-1 opacity-60">({member.email})</span>
                        )}
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-5 pr-1">

                    {/* ── Role selector ───────────────────────────────────── */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Role</h3>
                        <div className="flex items-center gap-3">
                            {isCallerAdmin ? (
                                <Select value={selectedRole} onValueChange={(v) => handleRoleChange(v as UserRole)}>
                                    <SelectTrigger className="w-44">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                        <SelectItem value="team">Team Member</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                /* Managers see the current role as read-only */
                                <Badge className={cn("text-sm px-3 py-1", roleBadge[selectedRole])}>
                                    {selectedRole === "team" ? "Team Member" : selectedRole}
                                </Badge>
                            )}
                            {isCallerManager && (
                                <p className="text-xs text-muted-foreground">
                                    Managers can only manage team members
                                </p>
                            )}
                        </div>
                    </section>

                    {/* ── CRM Module Permissions ──────────────────────────── */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">CRM Modules</h3>
                        <div className="rounded-md border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50">
                                            <th className="text-left px-3 py-2 font-medium text-muted-foreground w-32">Module</th>
                                            {ACTIONS.map((a) => (
                                                <th key={a.key} className="px-3 py-2 font-medium text-center text-muted-foreground" title={a.title}>
                                                    {a.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {CRM_MODULES.map((mod, i) => {
                                            const modPerms = (perms as any)[mod.key] as ModulePermission;
                                            return (
                                                <tr key={mod.key} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                                                    <td className="px-3 py-2 font-medium text-sm">{mod.label}</td>
                                                    {ACTIONS.map((action) => (
                                                        <td key={action.key} className="px-3 py-2 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!modPerms?.[action.key]}
                                                                onChange={(e) =>
                                                                    handleModuleToggle(mod.key, action.key, e.target.checked)
                                                                }
                                                                className="h-4 w-4 rounded border-gray-300 text-primary accent-primary cursor-pointer"
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* ── Features ────────────────────────────────────────── */}
                    <section className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Features</h3>
                        <div className="rounded-md border divide-y divide-border">
                            <FeatureRow
                                label="AI Assistant"
                                description="Access to the Gemini-powered AI assistant"
                                enabled={!!perms.aiAssistant?.enabled}
                                onChange={(v) => handleFeatureToggle("aiAssistant", v)}
                            />
                            {showUserMgmt && (
                                <FeatureRow
                                    label="User Management"
                                    description="Access to team management and permissions"
                                    enabled={!!perms.userManagement?.enabled}
                                    onChange={(v) => handleFeatureToggle("userManagement", v)}
                                    adminOnly
                                />
                            )}
                        </div>
                    </section>

                </div>

                <DialogFooter className="flex items-center gap-2 pt-4 border-t mt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetDefaults}
                        className="mr-auto gap-1.5 text-muted-foreground"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset to defaults
                    </Button>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <LoadingSpinner size="sm" className="mr-2" />}
                        {saving ? "Saving…" : "Save Permissions"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Feature row sub-component ────────────────────────────────────────────────

function FeatureRow({
    label, description, enabled, onChange, adminOnly = false,
}: {
    label:       string;
    description: string;
    enabled:     boolean;
    onChange:    (v: boolean) => void;
    adminOnly?:  boolean;
}) {
    return (
        <div className="flex items-center justify-between px-4 py-3">
            <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{label}</span>
                    {adminOnly && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 h-4 font-semibold">
                            Admin
                        </Badge>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch checked={enabled} onCheckedChange={onChange} />
        </div>
    );
}
