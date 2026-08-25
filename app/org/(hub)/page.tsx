"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrgStore } from "@/store/org";
import { getUserOrganizations, createOrganization, generateSlug, generateUniqueOrgSlug } from "@/lib/firestore/organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Building2,
    Plus,
    ArrowRight,
    Loader2,
    Search,
    LayoutGrid,
    List,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Organization } from "@/types/crm";
import { logger } from "@/lib/logger/client";

export default function OrgPickerPage() {
    const router  = useRouter();
    const { user } = useAuth();
    const { setCurrentOrg, setUserOrgs, userOrgs, currentOrg } = useOrgStore();

    const [loading, setLoading]   = useState(true);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [search, setSearch]     = useState("");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [orgName, setOrgName]       = useState("");
    const [orgSlug, setOrgSlug]       = useState("");
    const [slugEdited, setSlugEdited] = useState(false);
    const [creating, setCreating]     = useState(false);

    useEffect(() => {
        if (!user) return;
        const load = async (attempt = 1) => {
            setLoading(true);
            const { orgs, error } = await getUserOrganizations(user.uid);
            if (error) {
                if (attempt < 3) { setTimeout(() => load(attempt + 1), 800 * attempt); return; }
                logger.error("Failed to load organizations", { module: "org", action: "fetch", userId: user.uid, error });
                toast.error("Could not load workspaces. Please refresh the page.");
                setLoading(false);
                return;
            }
            setUserOrgs(orgs);
            setLoading(false);
        };
        load();
    }, [user, setUserOrgs]);

    const handleSelectOrg = (org: Organization) => {
        setCurrentOrg(org);
        router.push(`/org/${org.id}/dashboard`);
    };

    const handleNameChange = (value: string) => {
        setOrgName(value);
        if (!slugEdited) setOrgSlug(generateSlug(value));
    };

    const handleCreate = async () => {
        if (!user || !orgName.trim()) return;
        setCreating(true);
        // Use unique slug: prefer user-edited slug, otherwise auto-generate with collision detection
        const slug = slugEdited && orgSlug.trim()
            ? orgSlug.trim()
            : await generateUniqueOrgSlug(orgName.trim());
        const { success, org, error } = await createOrganization(
            { name: orgName.trim(), slug },
            user.uid
        );
        if (!success || !org) {
            toast.error(error || "Failed to create organization.");
            setCreating(false);
            return;
        }
        setCurrentOrg(org);
        setUserOrgs([...userOrgs, org]);
        toast.success(`Workspace "${org.name}" created!`);
        setOrgName(""); setOrgSlug(""); setSlugEdited(false);
        setCreating(false);
        setDialogOpen(false);
        // Take the user into the workspace they just created, same as
        // clicking an existing org card (handleSelectOrg) — previously this
        // just closed the dialog and left them on the picker, silently
        // dropping them back at a grid that now had one more card in it.
        router.push(`/org/${org.id}/dashboard`);
    };

    const filtered = userOrgs.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            {/* Content header */}
            <div className="px-8 pt-8 pb-4 border-b border-border shrink-0">
                <div className="flex items-center justify-between mb-5">
                    <h1 className="text-xl font-semibold text-foreground">Organizations</h1>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-1.5">
                                <Plus className="h-4 w-4" />
                                New organization
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Organization</DialogTitle>
                                <DialogDescription>Create a new workspace for your team.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label htmlFor="org-name">Organization name</Label>
                                    <Input
                                        id="org-name"
                                        placeholder="e.g. Acme Corp"
                                        value={orgName}
                                        onChange={(e) => handleNameChange(e.target.value)}
                                        disabled={creating}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="org-slug">Workspace ID</Label>
                                    <Input
                                        id="org-slug"
                                        placeholder="acme-corp"
                                        value={orgSlug}
                                        onChange={(e) => { setOrgSlug(generateSlug(e.target.value)); setSlugEdited(true); }}
                                        disabled={creating}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Lowercase letters, numbers, and hyphens only.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreate} disabled={creating || !orgName}>
                                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search + view toggle */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search organizations…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-9 text-sm"
                        />
                    </div>
                    <div className="flex items-center border border-border rounded-md overflow-hidden">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn("p-2 transition-colors", viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60")}
                            aria-label="Grid view"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn("p-2 transition-colors border-l border-border", viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60")}
                            aria-label="List view"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Org list */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="h-7 w-7 animate-spin text-primary" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                            <Building2 className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">
                                {search ? "No organizations match your search" : "No organizations yet"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {search ? "Try a different name." : "Create your first workspace to get started."}
                            </p>
                        </div>
                        {!search && (
                            <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5 mt-1">
                                <Plus className="h-4 w-4" />
                                New organization
                            </Button>
                        )}
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map((org) => (
                            <OrgCard
                                key={org.id}
                                org={org}
                                isActive={org.id === currentOrg?.id}
                                onClick={() => handleSelectOrg(org)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((org) => (
                            <OrgRow
                                key={org.id}
                                org={org}
                                isActive={org.id === currentOrg?.id}
                                onClick={() => handleSelectOrg(org)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

// ─── Org card (grid view) ─────────────────────────────────────────────────────

function OrgCard({ org, isActive, onClick }: { org: Organization; isActive: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group w-full text-left rounded-lg border p-4 transition-all hover:shadow-md hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive ? "border-primary/60 bg-primary/5" : "border-border bg-card"
            )}
        >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-foreground text-sm leading-snug line-clamp-1">{org.name}</p>
                {isActive && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">Active</Badge>
                )}
            </div>
            <p className="text-xs text-muted-foreground truncate mb-3">/{org.slug}</p>
            <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium">FREE</Badge>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </div>
        </button>
    );
}

// ─── Org row (list view) ──────────────────────────────────────────────────────

function OrgRow({ org, isActive, onClick }: { org: Organization; isActive: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group w-full text-left flex items-center gap-4 px-4 py-3 rounded-lg border transition-all hover:shadow-sm hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive ? "border-primary/60 bg-primary/5" : "border-border bg-card"
            )}
        >
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{org.name}</p>
                <p className="text-xs text-muted-foreground truncate">/{org.slug}</p>
            </div>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium shrink-0">FREE</Badge>
            {isActive && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">Active</Badge>
            )}
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </button>
    );
}
