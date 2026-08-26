"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useOrgStore } from "@/store/org";
import { getUserOrganizations } from "@/lib/firestore/organizations";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, Check } from "lucide-react";
import { logger } from "@/lib/logger/client";

export function OrgSwitcher() {
    const router = useRouter();
    const params = useParams<{ orgId: string }>();
    const currentOrgId = params?.orgId;
    const { currentOrg, setCurrentOrg, setCurrentMember, currentMember } = useOrgStore();
    const [open, setOpen] = useState(false);
    const [userOrgs, setUserOrgs] = useState<Array<{ id: string; name: string; slug: string; logoUrl?: string }>>([]);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (open && userOrgs.length === 0) {
            loadOrgs();
        }
    }, [open]);

    const loadOrgs = async () => {
        setLoading(true);
        try {
            const { orgs, error } = await getUserOrganizations(currentOrg?.ownerId || "");
            if (!error && orgs) {
                setUserOrgs(orgs.map(o => ({ id: o.id, name: o.name, slug: o.slug, logoUrl: o.logoUrl })));
            }
        } catch (e) {
            logger.error("Failed to load orgs", { module: "org", action: "fetch", error: e });
        } finally {
            setLoading(false);
        }
    };

    const switchOrg = (orgId: string) => {
        if (orgId === currentOrgId) {
            setOpen(false);
            return;
        }
        setOpen(false);
        router.push(`/org/${orgId}/dashboard`);
    };

    return (
        <div className="relative" ref={ref}>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-2 h-8 hover:bg-gray-100 dark:hover:bg-secondary-800"
            >
                <Avatar className="h-6 w-6">
                    <AvatarImage src={currentOrg?.logoUrl || undefined} />
                    <AvatarFallback className="bg-primary text-white text-[10px]">
                        {currentOrg?.name?.charAt(0) || "O"}
                    </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium truncate max-w-[120px]">
                    {currentOrg?.name || "Select Org"}
                </span>
                <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
            </Button>

            {open && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-secondary-900 border border-gray-200 dark:border-secondary-800 rounded-lg shadow-lg z-50">
                    <div className="p-2 border-b border-gray-200 dark:border-secondary-800">
                        <p className="text-xs font-semibold text-muted-foreground px-2">Switch Workspace</p>
                    </div>
                    <div className="p-1 max-h-64 overflow-y-auto">
                        {loading ? (
                            <div className="px-2 py-3 text-center">
                                <p className="text-xs text-muted-foreground animate-pulse">Loading...</p>
                            </div>
                        ) : userOrgs.length === 0 ? (
                            <div className="px-2 py-3 text-center">
                                <p className="text-xs text-muted-foreground">No organizations found</p>
                            </div>
                        ) : (
                            userOrgs.map((org) => (
                                <button
                                    key={org.id}
                                    onClick={() => switchOrg(org.id)}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-2 py-2 rounded-md text-left text-sm hover:bg-gray-100 dark:hover:bg-secondary-800 transition-colors",
                                        org.id === currentOrgId && "bg-primary/5 text-primary font-medium"
                                    )}
                                >
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={org.logoUrl} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                            {org.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="flex-1 truncate">{org.name}</span>
                                    {org.id === currentOrgId && (
                                        <Check className="h-3 w-3 text-primary" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                    <div className="p-1 border-t border-gray-200 dark:border-secondary-800">
                        <button
                            onClick={() => {
                                setOpen(false);
                                router.push("/org");
                            }}
                            className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-left text-xs text-muted-foreground hover:bg-gray-100 dark:hover:bg-secondary-800 transition-colors"
                        >
                            <ArrowLeftRight className="h-3 w-3" />
                            Manage organizations
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
