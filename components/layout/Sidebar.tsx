"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/store/ui";
import { useAuth } from "@/hooks/useAuth";
import { usePermission, FeatureGate, PermissionGate, RoleGate } from "@/hooks/usePermission";
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
    ChevronLeft,
    ChevronRight,
    LogOut,
    Zap,
    Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import type { ModuleKey, FeatureKey } from "@/types/crm";

// Basic CRM Navigation - accessible to all authenticated users
const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Leads", href: "/leads", icon: Users, permission: { module: "leads" as ModuleKey, action: "read" as const } },
    { name: "Contacts", href: "/contacts", icon: Users, permission: { module: "contacts" as ModuleKey, action: "read" as const } },
    { name: "Companies", href: "/companies", icon: Building2, permission: { module: "companies" as ModuleKey, action: "read" as const } },
    { name: "Deals", href: "/deals", icon: Handshake, permission: { module: "deals" as ModuleKey, action: "read" as const } },
    { name: "Projects", href: "/projects", icon: FolderKanban, permission: { module: "projects" as ModuleKey, action: "read" as const } },
    { name: "Tasks", href: "/tasks", icon: CheckSquare, permission: { module: "tasks" as ModuleKey, action: "read" as const } },
    { name: "Invoices", href: "/invoices", icon: FileText, permission: { module: "invoices" as ModuleKey, action: "read" as const } },
    { name: "Reports", href: "/reports", icon: BarChart3, permission: { module: "reports" as ModuleKey, action: "read" as const } },
    { name: "Settings", href: "/settings", icon: Settings },
];

// Admin/Manager Only
const adminNavigation = [
    { name: "Users", href: "/users", icon: Users },
];

// HR Navigation Items
const hrItems = [
    { name: "Employees", href: "/hr/employees" },
    { name: "Leaves", href: "/hr/leaves" },
    { name: "Payroll", href: "/hr/payroll", adminOnly: true }, // Admin-only
];

// Marketing AI Items - Feature-gated
const marketingItems = [
    { name: "Dashboard", href: "/marketing", feature: "marketingAI" as FeatureKey },
    { name: "Competitors", href: "/marketing/competitors", feature: "competitorAnalysis" as FeatureKey },
    { name: "Keyword Research", href: "/marketing/keyword", feature: "keywordResearch" as FeatureKey },
    { name: "Blog Writer", href: "/marketing/blog", feature: "blogWriter" as FeatureKey },
    { name: "Email Campaigns", href: "/marketing/email-campaigns", feature: "emailCampaigns" as FeatureKey },
    { name: "Calendar", href: "/marketing/calendar", feature: "marketingCalendar" as FeatureKey },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();
    const { user } = useAuth();
    const { isAdmin } = usePermission();

    const handleLogout = async () => {
        const { error } = await signOut();
        if (error) {
            toast.error("Failed to sign out");
        } else {
            toast.success("Signed out successfully");
            router.replace("/login");
        }
    };

    // Marketing Submenu State
    const [marketingOpen, setMarketingOpen] = useState(false);
    const isMarketingActive = pathname?.startsWith("/marketing");

    // Auto-open marketing menu if active
    useEffect(() => {
        if (isMarketingActive && !sidebarCollapsed) {
            setMarketingOpen(true);
        }
    }, [isMarketingActive, sidebarCollapsed]);

    // HR Submenu State
    const [hrOpen, setHrOpen] = useState(false);
    const isHrActive = pathname?.startsWith("/hr");

    // Auto-open HR menu if active
    useEffect(() => {
        if (isHrActive && !sidebarCollapsed) {
            setHrOpen(true);
        }
    }, [isHrActive, sidebarCollapsed]);

    // Filter navigation items based on permissions
    const visibleNavigation = navigation.filter(item => {
        if (!item.permission) return true; // Dashboard, Settings always visible
        return isAdmin(); // For now, admin sees everything - TODO: use actual permission check
    });

    // Check if any marketing features are enabled
    const hasMarketingAI = isAdmin(); // TODO: Check actual permissions

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
                {!sidebarCollapsed && (
                    <Logo width={140} height={36} className="" />
                )}
                {sidebarCollapsed && (
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">EB</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2">
                <ul className="space-y-1">
                    {visibleNavigation.map((item) => {
                        const isActive = pathname === item.href || (pathname?.startsWith(item.href + "/") && item.href !== "/dashboard");
                        return (
                            <li key={item.name}>
                                <PermissionGate
                                    module={item.permission?.module || "leads" as ModuleKey}
                                    action={item.permission?.action}
                                    fallback={null}
                                >
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
                                </PermissionGate>
                            </li>
                        );
                    })}

                    {/* Marketing Dropdown - Only show if user has any marketing features */}
                    <FeatureGate feature="marketingAI">
                        <li>
                            <button
                                onClick={() => !sidebarCollapsed && setMarketingOpen(!marketingOpen)}
                                className={cn(
                                    "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                                    isMarketingActive
                                        ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground"
                                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-800 hover:text-gray-900 dark:hover:text-white"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Zap className="h-5 w-5 flex-shrink-0 text-yellow-500" />
                                    {!sidebarCollapsed && <span className="text-sm font-medium">Marketing AI</span>}
                                </div>
                                {!sidebarCollapsed && (
                                    <ChevronRight className={cn("h-4 w-4 transition-transform", marketingOpen && "rotate-90")} />
                                )}

                                {sidebarCollapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-secondary-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                        Marketing AI
                                    </div>
                                )}
                            </button>

                            {/* Submenu */}
                            {!sidebarCollapsed && marketingOpen && (
                                <ul className="mt-1 ml-4 border-l-2 border-gray-200 dark:border-secondary-800 pl-2 space-y-1">
                                    {marketingItems.map((subItem) => (
                                        <FeatureGate key={subItem.name} feature={subItem.feature}>
                                            <li>
                                                <Link
                                                    href={subItem.href}
                                                    className={cn(
                                                        "block px-3 py-2 rounded-md text-sm transition-colors",
                                                        pathname === subItem.href
                                                            ? "text-primary font-medium bg-primary/5 dark:bg-primary/10"
                                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-secondary-800/50"
                                                    )}
                                                >
                                                    {subItem.name}
                                                </Link>
                                            </li>
                                        </FeatureGate>
                                    ))}
                                </ul>
                            )}
                        </li>
                    </FeatureGate>

                    {/* HR Dropdown - Always show for authenticated users */}
                    <li>
                        <button
                            onClick={() => !sidebarCollapsed && setHrOpen(!hrOpen)}
                            className={cn(
                                "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                                isHrActive
                                    ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-secondary-800 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Briefcase className="h-5 w-5 flex-shrink-0 text-blue-500" />
                                {!sidebarCollapsed && <span className="text-sm font-medium">HR</span>}
                            </div>
                            {!sidebarCollapsed && (
                                <ChevronRight className={cn("h-4 w-4 transition-transform", hrOpen && "rotate-90")} />
                            )}

                            {sidebarCollapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-secondary-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                    HR
                                </div>
                            )}
                        </button>

                        {/* Submenu */}
                        {!sidebarCollapsed && hrOpen && (
                            <ul className="mt-1 ml-4 border-l-2 border-gray-200 dark:border-secondary-800 pl-2 space-y-1">
                                {hrItems.filter((item) => !item.adminOnly || isAdmin()).map((subItem) => (
                                    <li key={subItem.name}>
                                        <Link
                                            href={subItem.href}
                                            className={cn(
                                                "block px-3 py-2 rounded-md text-sm transition-colors",
                                                pathname === subItem.href
                                                    ? "text-primary font-medium bg-primary/5 dark:bg-primary/10"
                                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-secondary-800/50"
                                            )}
                                        >
                                            {subItem.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>

                    {/* Admin/Manager Navigation */}
                    <RoleGate allowedRoles={["admin", "manager"]}>
                        <>
                            <div className="my-2 px-3">
                                <span className={cn("text-xs font-semibold text-gray-500 uppercase tracking-wider", sidebarCollapsed && "hidden")}>
                                    Management
                                </span>
                                {sidebarCollapsed && <Separator className="my-2" />}
                            </div>
                            {adminNavigation.map((item) => {
                                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
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

            {/* User Profile */}
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
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Logout Button */}
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

            {/* Collapse Toggle */}
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
