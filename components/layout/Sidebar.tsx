"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/store/ui";
import { useAuth } from "@/hooks/useAuth";
import { usePermission, RoleGate } from "@/hooks/usePermission";
import { signOut } from "@/lib/auth/auth-service";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Building2,
    Handshake,
    FolderKanban,
    CheckSquare,
    FileText,
    BarChart3,
    Settings,
    Mail,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from "lucide-react";
import { toast } from "sonner";
import type { ModuleKey, ActionKey } from "@/types/crm";

// Items without a `permission` are always visible to all authenticated users.
// Items with `permission` are gated by the user's module permissions.
const navigation: Array<{
    name: string;
    href: string;
    icon: React.ElementType;
    permission?: { module: ModuleKey; action: ActionKey };
}> = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Leads",     href: "/leads",     icon: Users,        permission: { module: "leads",     action: "read" } },
    { name: "Contacts",  href: "/contacts",  icon: Users,        permission: { module: "contacts",  action: "read" } },
    { name: "Companies", href: "/companies", icon: Building2,    permission: { module: "companies", action: "read" } },
    { name: "Deals",     href: "/deals",     icon: Handshake,    permission: { module: "deals",     action: "read" } },
    { name: "Projects",  href: "/projects",  icon: FolderKanban, permission: { module: "projects",  action: "read" } },
    { name: "Tasks",     href: "/tasks",     icon: CheckSquare,  permission: { module: "tasks",     action: "read" } },
    { name: "Invoices",  href: "/invoices",  icon: FileText,     permission: { module: "invoices",  action: "read" } },
    { name: "Reports",   href: "/reports",   icon: BarChart3,    permission: { module: "reports",   action: "read" } },
    { name: "Email",     href: "/emails",    icon: Mail },
    { name: "Settings",  href: "/settings",  icon: Settings },
];

const adminNavigation = [
    { name: "Users", href: "/users", icon: Users },
];

export function Sidebar() {
    const pathname  = usePathname();
    const router    = useRouter();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();
    const { user }  = useAuth();
    const { can }   = usePermission();

    const handleLogout = async () => {
        const { error } = await signOut();
        if (error) {
            toast.error("Failed to sign out");
        } else {
            toast.success("Signed out successfully");
            router.replace("/login");
        }
    };

    // Filter: items without a permission requirement always show;
    // items WITH a permission are shown only when the user has that permission.
    const visibleNavigation = navigation.filter(item =>
        !item.permission || can(item.permission.module, item.permission.action)
    );

    const navLink = (item: (typeof navigation)[number]) => {
        const isActive =
            pathname === item.href ||
            (pathname?.startsWith(item.href + "/") && item.href !== "/dashboard");

        return (
            <Link
                href={item.href}
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                    isActive
                        ? "bg-primary text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-800 hover:text-gray-900 dark:hover:text-white"
                )}
            >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                )}
                {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-secondary-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                    </div>
                )}
            </Link>
        );
    };

    return (
        <div
            className={cn(
                "fixed left-0 top-0 z-40 h-screen transition-all duration-300 flex flex-col",
                "bg-white dark:bg-secondary-900 border-r border-gray-200 dark:border-secondary-800",
                "text-gray-900 dark:text-white",
                sidebarCollapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200 dark:border-secondary-800">
                {!sidebarCollapsed ? (
                    <Logo width={140} height={36} />
                ) : (
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">EB</span>
                    </div>
                )}
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-4 px-2">
                <ul className="space-y-1">
                    {visibleNavigation.map(item => (
                        <li key={item.name}>{navLink(item)}</li>
                    ))}

                    {/* Admin / Manager section */}
                    <RoleGate allowedRoles={["admin", "manager"]}>
                        <>
                            <div className="my-2 px-3">
                                <span className={cn(
                                    "text-xs font-semibold text-gray-500 uppercase tracking-wider",
                                    sidebarCollapsed && "hidden"
                                )}>
                                    Management
                                </span>
                                {sidebarCollapsed && <Separator className="my-2" />}
                            </div>
                            {adminNavigation.map(item => {
                                const isActive =
                                    pathname === item.href ||
                                    pathname?.startsWith(item.href + "/");
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                                                isActive
                                                    ? "bg-primary text-white"
                                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-800 hover:text-gray-900 dark:hover:text-white"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5 flex-shrink-0" />
                                            {!sidebarCollapsed && (
                                                <span className="text-sm font-medium">{item.name}</span>
                                            )}
                                            {sidebarCollapsed && (
                                                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-secondary-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                                    {item.name}
                                                </div>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </>
                    </RoleGate>
                </ul>
            </nav>

            {/* User info */}
            <div className="border-t border-gray-200 dark:border-secondary-800 p-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={user?.photoURL || undefined} />
                        <AvatarFallback className="bg-primary text-white text-xs">
                            {user?.displayName?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>
                    {!sidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
                                {user?.displayName || "User"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user?.email}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sign out */}
            <div className="border-t border-gray-200 dark:border-secondary-800 px-2 py-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className={cn(
                        "w-full text-gray-600 dark:text-gray-300 hover:text-white hover:bg-red-600/20 hover:border-red-600/50",
                        sidebarCollapsed ? "justify-center" : "justify-start"
                    )}
                >
                    <LogOut className={cn("h-4 w-4", !sidebarCollapsed && "mr-2")} />
                    {!sidebarCollapsed && <span className="text-xs">Sign Out</span>}
                </Button>
            </div>

            {/* Collapse toggle */}
            <div className="border-t border-gray-200 dark:border-secondary-800 p-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="w-full justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-secondary-800"
                >
                    {sidebarCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            <span className="text-xs">Collapse</span>
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
