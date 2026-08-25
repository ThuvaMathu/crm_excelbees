"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/store/ui";
import { useAuth } from "@/hooks/useAuth";
import { useOrgStore } from "@/store/org";
import { usePermission } from "@/hooks/usePermission";
import type { ModuleKey } from "@/types/crm";
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
    ChevronUp,
    ChevronDown,
    LogOut,
    ArrowLeftRight,
    Phone,
    StickyNote,
    Receipt,
    Plug,
} from "lucide-react";
import { toast } from "sonner";

interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
    // When set, the item is hidden unless the current user has `read` on this module.
    module?: ModuleKey;
}

function buildCrmNav(orgId: string): NavItem[] {
    const base = `/org/${orgId}`;
    return [
        { name: "Dashboard",  href: `${base}/dashboard`,  icon: LayoutDashboard },
        { name: "Leads",      href: `${base}/leads`,      icon: Users,       module: "leads" },
        { name: "Contacts",   href: `${base}/contacts`,   icon: Phone,       module: "contacts" },
        { name: "Companies",  href: `${base}/companies`,  icon: Building2,   module: "companies" },
        { name: "Deals",      href: `${base}/deals`,      icon: Handshake,   module: "deals" },
        { name: "Projects",   href: `${base}/projects`,   icon: FolderKanban,module: "projects" },
        { name: "Tasks",      href: `${base}/tasks`,      icon: CheckSquare, module: "tasks" },
        { name: "Notes",      href: `${base}/notes`,      icon: StickyNote },
        { name: "Quotes",     href: `${base}/quotes`,     icon: Receipt },
        { name: "Invoices",   href: `${base}/invoices`,   icon: FileText,    module: "invoices" },
        { name: "Email",      href: `${base}/emails`,     icon: Mail },
        { name: "Reports",    href: `${base}/reports`,    icon: BarChart3,   module: "reports" },
    ];
}

function buildAdminNav(orgId: string): NavItem[] {
    const base = `/org/${orgId}`;
    return [
        { name: "Team",                 href: `${base}/users`,        icon: Users },
        { name: "Integrations",         href: `${base}/integrations`, icon: Plug },
        { name: "Organization Settings",href: `${base}/settings`,     icon: Settings },
    ];
}

export function Sidebar({ orgId }: { orgId: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const { sidebarCollapsed, toggleSidebar } = useUIStore();
    const { user } = useAuth();
    const { currentOrg, currentMember } = useOrgStore();
    const { can, isManager } = usePermission();

    const crmNav  = buildCrmNav(orgId).filter((item) => !item.module || can(item.module, "read"));
    const adminNav = buildAdminNav(orgId);
    const isAdminOrManager = isManager();

    // ── Custom scroll button state ────────────────────────────────────────────
    const navRef = useRef<HTMLElement>(null);
    const [canScrollUp,   setCanScrollUp]   = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const syncScrollState = useCallback(() => {
        const el = navRef.current;
        if (!el) return;
        setCanScrollUp(el.scrollTop > 6);
        setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 6);
    }, []);

    useEffect(() => {
        const el = navRef.current;
        if (!el) return;
        syncScrollState();
        el.addEventListener("scroll", syncScrollState, { passive: true });
        const ro = new ResizeObserver(syncScrollState);
        ro.observe(el);
        return () => { el.removeEventListener("scroll", syncScrollState); ro.disconnect(); };
    }, [syncScrollState]);

    const scrollNav = (dir: "up" | "down") =>
        navRef.current?.scrollBy({ top: dir === "up" ? -140 : 140, behavior: "smooth" });

    const handleLogout = async () => {
        const { error } = await signOut();
        if (error) {
            toast.error("Failed to sign out");
        } else {
            toast.success("Signed out successfully");
            router.replace("/login");
        }
    };

    const navLink = (item: NavItem) => {
        const isActive =
            pathname === item.href ||
            (pathname?.startsWith(item.href + "/") &&
                item.href !== `/org/${orgId}/dashboard`);

        return (
            <Link
                href={item.href}
                title={sidebarCollapsed ? item.name : undefined}
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
                {/* Collapsed tooltip */}
                {sidebarCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-secondary-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                    </span>
                )}
            </Link>
        );
    };

    const sectionLabel = (label: string) =>
        !sidebarCollapsed ? (
            <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground select-none">
                {label}
            </p>
        ) : (
            <Separator className="my-2 mx-2" />
        );

    return (
        <div
            className={cn(
                "fixed left-0 top-0 z-40 h-screen transition-all duration-300 flex flex-col",
                "bg-white dark:bg-secondary-900 border-r border-gray-200 dark:border-secondary-800",
                "text-gray-900 dark:text-white",
                sidebarCollapsed ? "w-16" : "w-64"
            )}
        >
            {/* ── Logo ─────────────────────────────────────────────────── */}
            <div className="h-16 flex items-center justify-center px-4 border-b border-gray-200 dark:border-secondary-800 shrink-0">
                {!sidebarCollapsed ? (
                    <Logo width={140} height={36} />
                ) : (
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">EB</span>
                    </div>
                )}
            </div>

            {/* ── Org name + workspace switcher ────────────────────────── */}
            {currentOrg && (
                <div className={cn(
                    "border-b border-gray-200 dark:border-secondary-800 shrink-0",
                    sidebarCollapsed ? "py-2 px-1 flex justify-center" : "px-4 py-3"
                )}>
                    {!sidebarCollapsed ? (
                        <>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                                {currentOrg.name}
                            </p>
                            <Link
                                href="/org"
                                className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                                <ArrowLeftRight className="h-3 w-3" />
                                Switch workspace
                            </Link>
                        </>
                    ) : (
                        <Link
                            href="/org"
                            title="Switch workspace"
                            className="text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeftRight className="h-4 w-4" />
                        </Link>
                    )}
                </div>
            )}

            {/* ── Navigation with custom scroll buttons ────────────────── */}
            <div className="relative flex-1 min-h-0">
                {/* Scroll-up button */}
                {canScrollUp && (
                    <button
                        onClick={() => scrollNav("up")}
                        aria-label="Scroll up"
                        className={cn(
                            "absolute top-0 left-0 right-0 z-10 flex items-center justify-center h-7",
                            "bg-gradient-to-b from-white dark:from-secondary-900 to-transparent",
                            "cursor-pointer hover:opacity-80 transition-opacity"
                        )}
                    >
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                )}

                <nav
                    ref={navRef}
                    className="h-full overflow-y-auto py-2 px-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
                >
                    {/* CRM section */}
                    {sectionLabel("CRM")}
                    <ul className="space-y-0.5">
                        {crmNav.map((item) => (
                            <li key={item.name}>{navLink(item)}</li>
                        ))}
                    </ul>

                    {/* Administration section — admin + manager only */}
                    {isAdminOrManager && (
                        <>
                            {sectionLabel("Administration")}
                            <ul className="space-y-0.5">
                                {adminNav.map((item) => (
                                    <li key={item.name}>{navLink(item)}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </nav>

                {/* Scroll-down button */}
                {canScrollDown && (
                    <button
                        onClick={() => scrollNav("down")}
                        aria-label="Scroll down"
                        className={cn(
                            "absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center h-7",
                            "bg-gradient-to-t from-white dark:from-secondary-900 to-transparent",
                            "cursor-pointer hover:opacity-80 transition-opacity"
                        )}
                    >
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* ── User info ────────────────────────────────────────────── */}
            <div className="border-t border-gray-200 dark:border-secondary-800 p-4 shrink-0">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={user?.photoURL || undefined} />
                        <AvatarFallback className="bg-primary text-white text-xs">
                            {user?.displayName?.charAt(0)?.toUpperCase() || "U"}
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

            {/* ── Sign out ─────────────────────────────────────────────── */}
            <div className="border-t border-gray-200 dark:border-secondary-800 px-2 py-2 shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className={cn(
                        "w-full text-gray-600 dark:text-gray-300 hover:text-white hover:bg-red-500/20",
                        sidebarCollapsed ? "justify-center" : "justify-start"
                    )}
                    title={sidebarCollapsed ? "Sign out" : undefined}
                >
                    <LogOut className={cn("h-4 w-4 shrink-0", !sidebarCollapsed && "mr-2")} />
                    {!sidebarCollapsed && <span className="text-xs">Sign Out</span>}
                </Button>
            </div>

            {/* ── Collapse toggle ──────────────────────────────────────── */}
            <div className="border-t border-gray-200 dark:border-secondary-800 p-2 shrink-0">
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
