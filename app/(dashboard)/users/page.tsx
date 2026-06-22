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
import { getUsers, UserProfile } from "@/lib/firestore/users";
import {
    deleteUserAction,
    setUserActiveAction,
} from "@/app/actions/admin-users";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { UserRole } from "@/types/crm";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { EditUserDialog } from "@/components/users/EditUserDialog";
import { RBACGuard, RoleGate } from "@/components/auth/RBACGuard";
import {
    MoreHorizontal,
    CheckCircle2,
    Shield,
    ShieldAlert,
    Trash2,
    Edit,
    Eye,
    EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
        const { users: fetched, error } = await getUsers();
        if (error) {
            toast.error("Failed to load users");
        } else {
            setUsers(fetched || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    /** Returns a fresh ID token for the current admin user. */
    const getToken = async (): Promise<string | null> => {
        const token = await auth.currentUser?.getIdToken(true);
        if (!token) {
            toast.error("Session expired. Please sign in again.");
        }
        return token || null;
    };

    const handleActivate = async (userId: string, targetRole: UserRole) => {
        // Only admins can activate/deactivate admins or managers
        if ((targetRole === "admin" || targetRole === "manager") && !isAdmin()) {
            toast.error("Only admins can change the status of admins or managers");
            return;
        }

        const token = await getToken();
        if (!token) return;

        const { success, error } = await setUserActiveAction(token, userId, true);
        if (success) {
            toast.success("User activated");
            fetchUsers();
        } else {
            toast.error("Failed to activate user: " + error);
        }
    };

    const handleDeactivate = async (userId: string, targetRole: UserRole) => {
        // Block managers from deactivating other admins or managers
        if ((targetRole === "admin" || targetRole === "manager") && !isAdmin()) {
            toast.error("Only admins can deactivate admins or managers");
            return;
        }

        if (!confirm("Are you sure you want to deactivate this user? They will not be able to sign in.")) {
            return;
        }

        const token = await getToken();
        if (!token) return;

        const { success, error } = await setUserActiveAction(token, userId, false);
        if (success) {
            toast.success("User deactivated");
            fetchUsers();
        } else {
            toast.error("Failed to deactivate user: " + error);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone and will permanently remove the user and their login access.`)) {
            return;
        }

        const token = await getToken();
        if (!token) return;

        const { success, error } = await deleteUserAction(token, userId);
        if (success) {
            toast.success("User deleted successfully");
            setUsers((prev) => prev.filter((u) => u.uid !== userId));
        } else {
            toast.error("Failed to delete user: " + error);
        }
    };

    // Managers see only team members; admins see all
    const filteredUsers = users.filter((u) => {
        if (currentUser?.role === "admin") return true;
        if (currentUser?.role === "manager") return u.role === "team";
        return false;
    });

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
                    action={isAdmin() ? <CreateUserDialog onUserCreated={fetchUsers} /> : undefined}
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
                                    {filteredUsers.map((u) => {
                                        const isSelf = u.uid === currentUser?.uid;
                                        // Managers cannot touch admin or manager rows
                                        const canManage =
                                            isAdmin() ||
                                            (currentUser?.role === "manager" && u.role === "team");

                                        return (
                                            <TableRow key={u.uid}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {u.displayName || u.email?.split("@")[0] || u.email}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">{u.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className={roleColors[u.role] || ""}
                                                    >
                                                        {u.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {u.isActive !== false ? (
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
                                                        {u.lastLoginAt
                                                            ? format(u.lastLoginAt.toDate(), "MMM d, yyyy h:mm a")
                                                            : "Never"}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-muted-foreground text-sm">
                                                        {u.createdAt?.toDate
                                                            ? format(u.createdAt.toDate(), "MMM d, yyyy")
                                                            : "N/A"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {canManage && !isSelf && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {/* Edit: admin only */}
                                                                {isAdmin() && (
                                                                    <DropdownMenuItem onClick={() => openEditDialog(u)}>
                                                                        <Edit className="h-4 w-4 mr-2" />
                                                                        Edit User & Permissions
                                                                    </DropdownMenuItem>
                                                                )}

                                                                <DropdownMenuSeparator />

                                                                {u.isActive !== false ? (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeactivate(u.uid, u.role)}
                                                                        className="text-amber-600 focus:text-amber-600"
                                                                    >
                                                                        <EyeOff className="h-4 w-4 mr-2" />
                                                                        Deactivate User
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleActivate(u.uid, u.role)}
                                                                        className="text-green-600 focus:text-green-600"
                                                                    >
                                                                        <Eye className="h-4 w-4 mr-2" />
                                                                        Activate User
                                                                    </DropdownMenuItem>
                                                                )}

                                                                {/* Delete: admin only */}
                                                                <RoleGate allowedRoles={["admin"]}>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            handleDeleteUser(
                                                                                u.uid,
                                                                                u.displayName || u.email
                                                                            )
                                                                        }
                                                                        className="text-red-600 focus:text-red-600"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        Delete User
                                                                    </DropdownMenuItem>
                                                                </RoleGate>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </Card>

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
