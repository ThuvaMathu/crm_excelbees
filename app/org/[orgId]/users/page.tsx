"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { AddMemberModal } from "@/components/team/AddMemberModal";
import { MemberPermissionsModal } from "@/components/team/MemberPermissionsModal";
import { getOrganizationMembers } from "@/lib/firestore/organizations";
import { toJsDate } from "@/lib/utils";
import { useOrgStore } from "@/store/org";
import type { OrganizationMember, UserRole } from "@/types/crm";
import {
    UserPlus,
    CheckCircle2,
    ShieldAlert,
    Users,
    MoreHorizontal,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { RBACGuard } from "@/components/auth/RBACGuard";

export default function UsersPage() {
    return (
        <RBACGuard requiredRole={["admin", "manager"]}>
            <UsersPageContent />
        </RBACGuard>
    );
}

function UsersPageContent() {
    const params = useParams<{ orgId: string }>();
    const orgId  = params.orgId;
    const { currentMember } = useOrgStore();
    const base = `/org/${orgId}`;

    const [members,            setMembers]           = useState<OrganizationMember[]>([]);
    const [loading,            setLoading]           = useState(true);
    const [addModalOpen,       setAddModalOpen]      = useState(false);
    const [permTarget,         setPermTarget]        = useState<OrganizationMember | null>(null);

    const callerRole  = (currentMember?.role ?? "team") as UserRole;
    const isAdmin     = callerRole === "admin";
    const isManager   = callerRole === "manager";
    const canManage   = isAdmin || isManager;

    const fetchMembers = async () => {
        setLoading(true);
        const { members: fetched, error } = await getOrganizationMembers(orgId);
        if (error) {
            toast.error("Failed to load members");
        } else {
            setMembers(fetched || []);
        }
        setLoading(false);
    };

    useEffect(() => { fetchMembers(); }, []);

    // Decide whether a caller can open the permissions modal for a given member.
    function canEditMember(target: OrganizationMember): boolean {
        if (!canManage) return false;
        if (target.userId === currentMember?.userId) return false; // cannot edit self
        if (isManager && (target.role === "admin" || target.role === "manager")) return false;
        return true;
    }

    const roleColors: Record<string, string> = {
        admin:   "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        manager: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        team:    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Team Management"
                breadcrumbs={[
                    { label: "Dashboard", href: `${base}/dashboard` },
                    { label: "Team" },
                ]}
                description="Manage team members, roles, and granular permissions"
                action={
                    isAdmin ? (
                        <Button
                            onClick={() => setAddModalOpen(true)}
                            className="bg-primary hover:bg-primary/90"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Team Member
                        </Button>
                    ) : undefined
                }
            />

            <Card>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : members.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No team members yet"
                        description="Add your first team member to get started."
                        action={
                            isAdmin
                                ? { label: "Add Team Member", onClick: () => setAddModalOpen(true) }
                                : undefined
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                    {canManage && <TableHead className="w-16 text-right">Control</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((m) => {
                                    const isSelf    = m.userId === currentMember?.userId;
                                    const canEditThis = canEditMember(m);

                                    return (
                                        <TableRow key={m.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {m.displayName || m.email?.split("@")[0] || m.email}
                                                        {isSelf && (
                                                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{m.email}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Badge variant="secondary" className={roleColors[m.role] || ""}>
                                                    {m.role === "team" ? "Team Member" : m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                                                </Badge>
                                            </TableCell>

                                            <TableCell>
                                                {m.status === "active" ? (
                                                    <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                                                        <CheckCircle2 className="h-4 w-4" />Active
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
                                                        <ShieldAlert className="h-4 w-4" />{m.status}
                                                    </div>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <span className="text-muted-foreground text-sm">
                                                    {(() => { const d = toJsDate(m.joinedAt); return d ? format(d, "MMM d, yyyy") : "N/A"; })()}
                                                </span>
                                            </TableCell>

                                            {canManage && (
                                                <TableCell className="text-right">
                                                    {canEditThis ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="gap-1.5 text-muted-foreground hover:text-foreground"
                                                            onClick={() => setPermTarget(m)}
                                                        >
                                                            <ShieldCheck className="h-4 w-4" />
                                                            <span className="hidden sm:inline">Edit</span>
                                                        </Button>
                                                    ) : (
                                                        /* Render empty cell to keep table aligned */
                                                        <span className="text-xs text-muted-foreground/40 pr-2">—</span>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>

            {/* RBAC legend for managers */}
            {isManager && (
                <p className="text-xs text-muted-foreground text-center">
                    As a manager, you can edit permissions for team members only. Admin and manager accounts are managed by an admin.
                </p>
            )}

            {isAdmin && (
                <AddMemberModal
                    open={addModalOpen}
                    onClose={() => setAddModalOpen(false)}
                    orgId={orgId}
                    onMemberAdded={fetchMembers}
                />
            )}

            {canManage && permTarget && (
                <MemberPermissionsModal
                    open={!!permTarget}
                    onClose={() => setPermTarget(null)}
                    member={permTarget}
                    orgId={orgId}
                    callerRole={callerRole}
                    onSaved={fetchMembers}
                />
            )}
        </div>
    );
}
