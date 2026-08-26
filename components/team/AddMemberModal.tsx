"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createTeamMemberForOrgAction } from "@/app/actions/admin-users";
import { createInviteAction } from "@/app/actions/invite-actions";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Copy, Check, UserPlus, Link2 } from "lucide-react";
import QRCode from "react-qr-code";

interface AddMemberModalProps {
    open: boolean;
    onClose: () => void;
    orgId: string;
    onMemberAdded: () => void;
}

type InviteRole = "team" | "manager";

const roleLabels: Record<InviteRole, string> = {
    team:    "Team Member",
    manager: "Manager",
};

export function AddMemberModal({ open, onClose, orgId, onMemberAdded }: AddMemberModalProps) {
    // ── Create Member tab state ──────────────────────────────────────────────
    const [name,    setName]    = useState("");
    const [email,   setEmail]   = useState("");
    const [phone,   setPhone]   = useState("");
    const [role,    setRole]    = useState<InviteRole>("team");
    const [creating, setCreating] = useState(false);

    // ── Invite Link tab state ────────────────────────────────────────────────
    const [inviteRole,     setInviteRole]     = useState<InviteRole>("team");
    const [generating,     setGenerating]     = useState(false);
    const [inviteToken,    setInviteToken]    = useState<string | null>(null);
    const [inviteExpiry,   setInviteExpiry]   = useState<string | null>(null);
    const [copied,         setCopied]         = useState(false);

    const inviteUrl = inviteToken
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inviteToken}`
        : null;

    // ── Helpers ──────────────────────────────────────────────────────────────

    function reset() {
        setName(""); setEmail(""); setPhone(""); setRole("team");
        setInviteRole("team");
        setInviteToken(null); setInviteExpiry(null); setCopied(false);
    }

    function handleClose() {
        reset();
        onClose();
    }

    async function getCallerToken(): Promise<string | null> {
        try {
            return await auth.currentUser?.getIdToken(true) ?? null;
        } catch {
            return null;
        }
    }

    // ── Create Member submit ─────────────────────────────────────────────────

    async function handleCreateMember(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return;

        const callerToken = await getCallerToken();
        if (!callerToken) { toast.error("Authentication required."); return; }

        setCreating(true);
        const result = await createTeamMemberForOrgAction({
            callerToken,
            organizationId: orgId,
            email:          email.trim(),
            displayName:    name.trim(),
            phoneNumber:    phone.trim() || undefined,
            role,
        });
        setCreating(false);

        if (result.success) {
            toast.success(`${name.trim()} has been added to your team. Login credentials were emailed to them.`);
            onMemberAdded();
            handleClose();
        } else {
            toast.error(result.error ?? "Failed to create team member.");
        }
    }

    // ── Generate invite link ─────────────────────────────────────────────────

    async function handleGenerateInvite() {
        const callerToken = await getCallerToken();
        if (!callerToken) { toast.error("Authentication required."); return; }

        setGenerating(true);
        const result = await createInviteAction({
            callerToken,
            organizationId: orgId,
            role:           inviteRole,
        });
        setGenerating(false);

        if (result.success && result.token) {
            setInviteToken(result.token);
            setInviteExpiry(result.expiresAt ?? null);
        } else {
            toast.error(result.error ?? "Failed to generate invite link.");
        }
    }

    async function handleCopy() {
        if (!inviteUrl) return;
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="create" className="mt-2">
                    <TabsList className="w-full">
                        <TabsTrigger value="create"  className="flex-1 gap-2">
                            <UserPlus className="h-4 w-4" />
                            Create Member
                        </TabsTrigger>
                        <TabsTrigger value="invite" className="flex-1 gap-2">
                            <Link2 className="h-4 w-4" />
                            Invite Link
                        </TabsTrigger>
                    </TabsList>

                    {/* ── Tab 1: Create Member ── */}
                    <TabsContent value="create" className="mt-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Creates a Firebase account immediately. Login credentials are emailed to the new member.
                        </p>

                        <form onSubmit={handleCreateMember} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="member-name">Full Name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="member-name"
                                    placeholder="Jane Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="member-email">Email Address <span className="text-destructive">*</span></Label>
                                <Input
                                    id="member-email"
                                    type="email"
                                    placeholder="jane@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="member-phone">Phone Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                                <Input
                                    id="member-phone"
                                    type="tel"
                                    placeholder="+1 555 000 0000"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="member-role">Role</Label>
                                <Select value={role} onValueChange={(v) => setRole(v as InviteRole)}>
                                    <SelectTrigger id="member-role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="team">Team Member</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                                <Button type="submit" disabled={creating || !name.trim() || !email.trim()}>
                                    {creating && <LoadingSpinner size="sm" className="mr-2" />}
                                    {creating ? "Creating…" : "Create Member"}
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    {/* ── Tab 2: Invite Link ── */}
                    <TabsContent value="invite" className="mt-4 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Generate a link (valid for 7 days) that anyone can use to join this workspace.
                        </p>

                        {!inviteToken ? (
                            <>
                                <div className="space-y-1.5">
                                    <Label htmlFor="invite-role">Role for invited member</Label>
                                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as InviteRole)}>
                                        <SelectTrigger id="invite-role">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="team">Team Member</SelectItem>
                                            <SelectItem value="manager">Manager</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                                    <Button onClick={handleGenerateInvite} disabled={generating}>
                                        {generating && <LoadingSpinner size="sm" className="mr-2" />}
                                        {generating ? "Generating…" : "Generate Invite Link"}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                {/* QR Code */}
                                <div className="flex justify-center p-4 bg-white rounded-lg border">
                                    <QRCode value={inviteUrl!} size={180} />
                                </div>

                                {/* URL + copy */}
                                <div className="space-y-1.5">
                                    <Label>Invite Link</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={inviteUrl!}
                                            readOnly
                                            className="text-xs font-mono bg-muted"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleCopy}
                                            title={copied ? "Copied!" : "Copy link"}
                                        >
                                            {copied
                                                ? <Check className="h-4 w-4 text-green-600" />
                                                : <Copy className="h-4 w-4" />
                                            }
                                        </Button>
                                    </div>
                                </div>

                                {/* Meta */}
                                <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground space-y-0.5">
                                    <p>Role: <span className="font-medium text-foreground">{roleLabels[inviteRole]}</span></p>
                                    {inviteExpiry && (
                                        <p>Expires: <span className="font-medium text-foreground">
                                            {new Date(inviteExpiry).toLocaleDateString(undefined, { dateStyle: "medium" })}
                                        </span></p>
                                    )}
                                    <p className="pt-1 text-amber-600 dark:text-amber-400">
                                        Anyone with this link can join as a {roleLabels[inviteRole].toLowerCase()}. Share carefully.
                                    </p>
                                </div>

                                <div className="flex justify-between gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => { setInviteToken(null); setInviteExpiry(null); setCopied(false); }}
                                    >
                                        Generate New
                                    </Button>
                                    <Button onClick={handleClose}>Done</Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
