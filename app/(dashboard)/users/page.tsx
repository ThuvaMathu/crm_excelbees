"use client";

import { useState, useEffect } from "react";
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
import {
    getUsers,
    approveUser,
    updateUserRole,
    UserProfile
} from "@/lib/firestore/users";
import { deleteUserAction } from "@/app/actions/admin-users";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { UserRole, AuditAction } from "@/types/crm";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { EditUserDialog } from "@/components/users/EditUserDialog";
import { RBACGuard, RoleGate } from "@/components/auth/RBACGuard";
import {
    MoreHorizontal,
    CheckCircle2,
    Shield,
    Users as UsersIcon,
    ShieldAlert,
    Trash2,
    Edit,
    UserPlus,
    Eye,
    EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { createAuditLog, AuditActions } from "@/lib/firestore/audit-logs";

type EditingUser = UserProfile & { originalRole?: UserRole };

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const { isAdmin } = usePermission();

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        const { users: fetchedUsers, error } = await getUsers();
        if (error) {
            toast.error("Failed to load users");
        } else {
            setUsers(fetchedUsers || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleApprove = async (userId: string) => {
        const { success, error } = await approveUser(userId, true);
        if (success) {
            toast.success("User activated successfully");
            await logAudit("user_activated", userId);
            fetchUsers();
        } else {
            toast.error("Failed to activate user: " + error);
        }
    };

    const handleDeactivate = async (userId: string) => {
        if (!confirm("Are you sure you want to deactivate this user? They will not be able to sign in.")) {
            return;
        }

        const { success, error } = await approveUser(userId, false);
        if (success) {
            toast.success("User deactivated");
            await logAudit("user_deactivated", userId);
            fetchUsers();
        } else {
            toast.error("Failed to deactivate user: " + error);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone and will permanently remove the user and their login access.`)) {
            return;
        }

        const { success, error } = await deleteUserAction(userId);
        if (success) {
            toast.success("User deleted successfully");
            setUsers(prevUsers => prevUsers.filter(u => u.uid !== userId));
        } else {
            toast.error("Failed to delete user: " + error);
        }
    };

    // Filter users based on RBAC
    const filteredUsers = users.filter(u => {
        if (currentUser?.role === 'admin') return true;
        if (currentUser?.role === 'manager') {
            // Managers see only Team members
            return u.role === 'team';
        }
        return false;
    });

    const logAudit = async (action: AuditAction, targetUserId: string) => {
        if (!currentUser) return;
        await createAuditLog({
            action,
            performedBy: currentUser.uid,
            performedByName: currentUser.displayName || currentUser.email || "",
            targetUserId,
            targetUserName: users.find(u => u.uid === targetUserId)?.displayName || targetUserId,
            details: {},
        });
    };

    const openEditDialog = (user: UserProfile) => {
        setEditingUser(user);
        setEditDialogOpen(true);
    };



    const roleColors: Record<string, string> = {
        admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        manager: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        team: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    };

    return (
        <RBACGuard requiredRole={["admin", "manager"]}>
            <div className="space-y-6">
                <PageHeader
                    title="User Management"
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Users" },
                    ]}
                    description="Manage user access, roles, and permissions"
                    action={
                        isAdmin() ? <CreateUserDialog onUserCreated={fetchUsers} /> : undefined
                    }
                />

                <Card>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.uid}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {user.displayName || user.email?.split('@')[0] || user.email}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={roleColors[user.role] || ""}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.isActive !== false ? (
                                                    <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Active
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
                                                        <ShieldAlert className="h-4 w-4" />
                                                        Deactivated
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-muted-foreground text-sm">
                                                    {user.lastLoginAt ? format(user.lastLoginAt.toDate(), "MMM d, yyyy h:mm a") : "Never"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-muted-foreground text-sm">
                                                    {user.createdAt?.toDate ? format(user.createdAt.toDate(), "MMM d, yyyy") : "N/A"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit User & Permissions
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator />

                                                            {user.isActive !== false ? (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDeactivate(user.uid)}
                                                                    className="text-amber-600 focus:text-amber-600"
                                                                >
                                                                    <EyeOff className="h-4 w-4 mr-2" />
                                                                    Deactivate User
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleApprove(user.uid)}
                                                                    className="text-green-600 focus:text-green-600"
                                                                >
                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                    Activate User
                                                                </DropdownMenuItem>
                                                            )}

                                                            <RoleGate allowedRoles={["admin"]}>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDeleteUser(user.uid, user.displayName || user.email)}
                                                                    className="text-red-600 focus:text-red-600"
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete User
                                                                </DropdownMenuItem>
                                                            </RoleGate>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </Card>

                {/* Edit User Dialog with Permissions */}
                {editingUser && (
                    <EditUserDialog
                        user={editingUser}
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                        onUserUpdated={() => {
                            fetchUsers();
                            setEditingUser(null);
                        }}
                    />
                )}
            </div>
        </RBACGuard>
    );
}
