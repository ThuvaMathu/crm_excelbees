"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrgStore } from "@/store/org";
import { getOrganization, getOrganizationMember } from "@/lib/firestore/organizations";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { OrganizationMember } from "@/types/crm";
import { Sidebar } from "@/components/layout/OrgSidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { CommandPalette } from "@/components/search/CommandPalette";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger/client";

type LoadState = "loading" | "ready" | "error";

function OrgDashboardShell({ children }: { children: React.ReactNode }) {
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    const router = useRouter();
    const { user } = useAuth();
    const { currentOrg, setCurrentOrg, currentMember, setCurrentMember } = useOrgStore();
    const { sidebarCollapsed } = useUIStore();

    const [loadState, setLoadState] = useState<LoadState>(
        currentOrg?.id === orgId && currentMember ? "ready" : "loading"
    );
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const fetchingRef = useRef(false);
    const unsubscribeMemberRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (currentOrg?.id === orgId && currentMember) {
            setLoadState("ready");
        }

        if (!user?.uid) return;
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        let cancelled = false;

        // Real-time listener on the member doc — permission/role changes made by an
        // admin (MemberPermissionsModal) are reflected immediately without a page
        // refresh, instead of the previous one-shot getOrganizationMember() fetch.
        const subscribeToMember = () => {
            const memberRef = doc(db, "organization_members", `${orgId}_${user.uid}`);
            unsubscribeMemberRef.current = onSnapshot(
                memberRef,
                (snap) => {
                    if (cancelled) return;
                    if (!snap.exists() || snap.data().status !== "active") {
                        setErrorMsg("You do not have access to this workspace.");
                        setLoadState("error");
                        return;
                    }
                    setCurrentMember({ id: snap.id, ...snap.data() } as OrganizationMember);
                    setLoadState("ready");
                },
                (error) => {
                    if (cancelled) return;
                    logger.error("Error listening to org member doc", { module: "org", action: "subscribe", orgId, userId: user.uid, error });
                    setErrorMsg("You do not have access to this workspace.");
                    setLoadState("error");
                }
            );
        };

        const loadOrgContext = async (attempt = 1) => {
            const { org, error: orgError } = await getOrganization(orgId);
            if (cancelled) return;

            if (orgError || !org) {
                if (!cancelled) {
                    setErrorMsg("This organization could not be found.");
                    setLoadState("error");
                    fetchingRef.current = false;
                }
                return;
            }

            const { member, error: memberError } = await getOrganizationMember(orgId, user.uid);
            if (cancelled) return;

            if (!member || member.status !== "active") {
                if (attempt === 1) {
                    setTimeout(() => loadOrgContext(2), 1200);
                    return;
                }
                if (!cancelled) {
                    setErrorMsg(memberError || "You do not have access to this workspace.");
                    setLoadState("error");
                    fetchingRef.current = false;
                }
                return;
            }

            if (!cancelled) {
                setCurrentOrg(org);
                setCurrentMember(member);
                setLoadState("ready");
                subscribeToMember();
            }
        };

        loadOrgContext();

        return () => {
            cancelled = true;
            fetchingRef.current = false;
            if (unsubscribeMemberRef.current) {
                unsubscribeMemberRef.current();
                unsubscribeMemberRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid, orgId]);

    if (loadState === "error") {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                    <p className="text-base font-semibold text-foreground">Access denied</p>
                    <p className="text-sm text-muted-foreground">{errorMsg}</p>
                    <Button variant="outline" onClick={() => router.replace("/org")}>
                        Back to Organizations
                    </Button>
                </div>
            </div>
        );
    }

    if (loadState === "loading" || !currentOrg || currentOrg.id !== orgId || !currentMember) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading workspace…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <CommandPalette />
            <div className="hidden md:block">
                <Sidebar orgId={orgId} />
            </div>
            <div className={cn(
                "min-h-screen transition-all duration-300",
                sidebarCollapsed ? "md:pl-16" : "md:pl-64"
            )}>
                <div className="sticky top-0 z-30 flex items-center gap-2 px-4 md:px-0">
                    <div className="md:hidden">
                        <MobileNav />
                    </div>
                    <div className="flex-1">
                        <Header />
                    </div>
                </div>
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}

// No AuthProvider or AuthGate here — app/org/layout.tsx already wraps the
// entire /org/** tree with a single AuthProvider + AuthGate. Adding them
// again here would call setLoading(true) on the shared Zustand store, causing
// the outer AuthGate to re-render and show "Initializing CRM…" indefinitely.
export default function OrgDashboardLayout({ children }: { children: React.ReactNode }) {
    return <OrgDashboardShell>{children}</OrgDashboardShell>;
}
