"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrgStore } from "@/store/org";
import { getUserOrganizations } from "@/lib/firestore/organizations";
import { signOut } from "@/lib/auth/auth-service";
import { Logo } from "@/components/ui/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Building2,
    ChevronDown,
    LogOut,
    User,
    Settings,
    CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Organization } from "@/types/crm";

// ─── Nav definitions ──────────────────────────────────────────────────────────

const MAIN_NAV = [
    { label: "Organizations", icon: Building2, id: "orgs",    href: "/org" },
] as const;

const ACCOUNT_NAV = [
    { label: "Profile",          icon: User,       id: "profile",  href: "/org/profile",  disabled: false, comingSoon: false },
    { label: "Account Settings", icon: Settings,   id: "account",  href: "/org/settings", disabled: false, comingSoon: false },
    { label: "Billing",          icon: CreditCard, id: "billing",  href: null,            disabled: true,  comingSoon: true  },
] as const;

type NavId = typeof MAIN_NAV[number]["id"] | typeof ACCOUNT_NAV[number]["id"];

function getActiveNav(pathname: string): NavId {
    if (pathname === "/org/profile") return "profile";
    if (pathname === "/org/settings") return "account";
    return "orgs";
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function OrgHubLayout({ children }: { children: React.ReactNode }) {
    const pathname   = usePathname();
    const router     = useRouter();
    const { user }   = useAuth();
    const { userOrgs, currentOrg, setCurrentOrg, setUserOrgs } = useOrgStore();

    // Ensure orgs are loaded even on direct navigation to /org/profile or /org/settings
    useEffect(() => {
        if (!user || userOrgs.length > 0) return;
        getUserOrganizations(user.uid).then(({ orgs }) => {
            if (orgs.length > 0) setUserOrgs(orgs);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]);

    const isAdmin  = user?.role === "admin" || userOrgs.some((o) => o.ownerId === user?.uid);
    const activeNav = getActiveNav(pathname);

    const userInitials = user?.displayName
        ? user.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
        : user?.email?.[0]?.toUpperCase() ?? "?";

    const handleSelectOrg = (org: Organization) => {
        setCurrentOrg(org);
        router.push(`/org/${org.id}/dashboard`);
    };

    const handleLogout = async () => {
        const { error } = await signOut();
        if (error) toast.error("Failed to sign out");
        else router.replace("/login");
    };

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">

            {/* ── Top bar ────────────────────────────────────────────────────── */}
            <header className="h-14 border-b border-border flex items-center px-4 gap-4 shrink-0 bg-background z-20">
                <Logo width={130} height={34} />

                {currentOrg && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-muted/60 transition-colors text-sm font-medium text-foreground">
                                <span className="h-5 w-5 rounded bg-primary/15 flex items-center justify-center shrink-0">
                                    <Building2 className="h-3 w-3 text-primary" />
                                </span>
                                <span className="max-w-[140px] truncate">{currentOrg.name}</span>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-semibold">
                                    FREE
                                </Badge>
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <div className="px-2 py-1.5">
                                <p className="text-xs text-muted-foreground font-medium">Switch workspace</p>
                            </div>
                            {userOrgs.map((org) => (
                                <DropdownMenuItem
                                    key={org.id}
                                    onClick={() => handleSelectOrg(org)}
                                    className="flex items-center gap-2 cursor-pointer"
                                >
                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="truncate">{org.name}</span>
                                    {org.id === currentOrg.id && (
                                        <span className="ml-auto text-primary text-xs">✓</span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                <div className="flex-1" />

                {/* User avatar menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/20 transition-all outline-none">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.photoURL ?? ""} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <div className="px-2 py-1.5">
                            <p className="text-sm font-medium truncate">{user?.displayName || "Account"}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => router.push("/org/profile")}
                            className="cursor-pointer gap-2"
                        >
                            <User className="h-4 w-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="text-destructive cursor-pointer gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            {/* ── Body ───────────────────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* Sidebar */}
                <aside className="w-52 border-r border-border flex flex-col shrink-0 bg-background/95">
                    <nav className="flex-1 py-3 px-2">

                        {/* Main nav — always visible */}
                        <div className="space-y-0.5">
                            {MAIN_NAV.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeNav === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => router.push(item.href)}
                                        className={cn(
                                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                        )}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Account — visible to all authenticated users */}
                        <div className="mt-4">
                            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground select-none">
                                Account
                            </p>
                            <div className="space-y-0.5">
                                {ACCOUNT_NAV.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeNav === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => { if (!item.disabled && item.href) router.push(item.href); }}
                                            disabled={item.disabled}
                                            title={item.comingSoon ? "Coming soon" : undefined}
                                            className={cn(
                                                "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left",
                                                item.disabled
                                                    ? "opacity-40 cursor-not-allowed text-muted-foreground"
                                                    : isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                            )}
                                        >
                                            <Icon className="h-4 w-4 shrink-0" />
                                            <span className="truncate flex-1">{item.label}</span>
                                            {item.comingSoon && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[9px] px-1 py-0 h-4 font-semibold shrink-0 leading-none"
                                                >
                                                    Soon
                                                </Badge>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </nav>

                    {/* Sign out */}
                    <div className="p-2 border-t border-border">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                            <LogOut className="h-4 w-4 shrink-0" />
                            <span>Sign out</span>
                        </button>
                    </div>
                </aside>

                {/* Page content */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
