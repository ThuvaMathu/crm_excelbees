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
} from "lucide-react";
import { toast } from "sonner";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    // ... (omitting unchanged lines for brevity if possible, but replace_file_content needs context)
    // Actually, I will just do two chunks to be safe and accurate.

    { name: "Leads", href: "/leads", icon: Users },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Companies", href: "/companies", icon: Building2 },
    { name: "Deals", href: "/deals", icon: Handshake },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
];

const adminNavigation = [
    { name: "Users", href: "/users", icon: Users },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();
    const { user } = useAuth();

    // Debug Sidebar Visibility
    // console.log("Sidebar User State:", { uid: user?.uid, role: user?.role });

    // Ensure role is available before rendering admin menu checks
    const hasAdminAccess = user?.role === "admin" || user?.role === "manager";

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

    // Marketing Items
    const marketingItems = [
        { name: "Dashboard", href: "/marketing" },
        { name: "Competitors", href: "/marketing/competitors" },
        { name: "SEO Analyzer", href: "/marketing/seo" },
        { name: "Keyword Research", href: "/marketing/keyword" },
        { name: "Blog Writer", href: "/marketing/blog" },
        { name: "Email Campaigns", href: "/marketing/email" },
        { name: "Social Media", href: "/marketing/social" },
        { name: "Ad Copy", href: "/marketing/ads" },
        { name: "Calendar", href: "/marketing/calendar" },
        { name: "Landing Pages", href: "/marketing/landing-pages" },
        { name: "Analytics", href: "/marketing/analytics" },
    ];

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
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (pathname?.startsWith(item.href + "/") && item.href !== "/dashboard"); // Simple active check
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

                    {/* Marketing Dropdown (Custom implementation for simplicity) */}
                    <li>
                        <button
                            onClick={() => !sidebarCollapsed && setMarketingOpen(!marketingOpen)}
                            className={cn(
                                "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                                isMarketingActive
                                    ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground" // Subtle highlight for parent when child active
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
                                {marketingItems.map((subItem) => {
                                    const isSubActive = pathname === subItem.href;
                                    return (
                                        <li key={subItem.name}>
                                            <Link
                                                href={subItem.href}
                                                className={cn(
                                                    "block px-3 py-2 rounded-md text-sm transition-colors",
                                                    isSubActive
                                                        ? "text-primary font-medium bg-primary/5 dark:bg-primary/10"
                                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-secondary-800/50"
                                                )}
                                            >
                                                {subItem.name}
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </li>

                    {/* Admin/Manager Navigation */}
                    {hasAdminAccess && (
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
                    )}
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
