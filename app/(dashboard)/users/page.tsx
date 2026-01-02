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
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    getUsers,
    approveUser,
    updateUserRole,
    deleteUser,
    UserProfile
} from "@/lib/firestore/users";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/crm";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import {
    MoreHorizontal,
    CheckCircle2,
    Shield,
    Users as UsersIcon,
    ShieldAlert,
    Trash2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

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
            toast.success("User approved successfully");
            fetchUsers();
        } else {
            toast.error("Failed to approve user: " + error);
        }
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        const { success, error } = await updateUserRole(userId, newRole);
        if (success) {
            toast.success("User role updated");
            // Optimized: Update only the specific user instead of refetching all
            setUsers(prevUsers =>
                prevUsers.map(u => u.uid === userId ? { ...u, role: newRole } : u)
            );
        } else {
            toast.error("Failed to update role: " + error);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
            return;
        }

        const { success, error } = await deleteUser(userId);
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

    const canEditUser = (targetUser: UserProfile) => {
        if (currentUser?.role === 'admin') return true;
        if (currentUser?.role === 'manager') {
            return targetUser.role === 'team';
        }
        return false;
    };

    const roleColors: Record<string, string> = {
        admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        manager: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        team: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="User Management"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Users" },
                ]}
                description="Manage user access and roles"
                action={
                    currentUser?.role === "admin" ? <CreateUserDialog onUserCreated={fetchUsers} /> : undefined
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
                                    <TableHead>Joined</TableHead>
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
                                                        <DropdownMenuItem disabled>
                                                            Actions for {user.displayName}
                                                        </DropdownMenuItem>
                                                        {currentUser?.role === 'admin' && (
                                                            <>
                                                                <DropdownMenuItem onClick={() => handleRoleChange(user.uid, 'admin')}>
                                                                    Set as Admin
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleRoleChange(user.uid, 'manager')}>
                                                                    Set as Manager
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        <DropdownMenuItem onClick={() => handleRoleChange(user.uid, 'team')}>
                                                            Set as Team
                                                        </DropdownMenuItem>
                                                        {currentUser?.role === 'admin' && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteUser(user.uid, user.displayName || user.email)}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete User
                                                            </DropdownMenuItem>
                                                        )}
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
        </div>
    );
}
