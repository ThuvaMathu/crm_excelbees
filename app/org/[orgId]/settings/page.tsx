"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, LogOut, Trash2 } from "lucide-react";
import { useOrgStore } from "@/store/org";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { getUserProfile, updateUserProfile } from "@/lib/firestore/users";
import { leaveOrganization, deleteOrganization, updateOrganization } from "@/lib/firestore/organizations";
import { logger } from "@/lib/logger/client";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    const router = useRouter();
    const { currentMember, currentOrg, clearOrg } = useOrgStore();
    const base = `/org/${orgId}`;
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false);
    const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState("USD");
    const [saving, setSaving] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [deletingOrg, setDeletingOrg] = useState(false);
    const { confirm, ConfirmDialog } = useConfirm();

    const [orgDialogOpen, setOrgDialogOpen] = useState(false);
    const [orgName, setOrgName] = useState("");
    const [orgWebsite, setOrgWebsite] = useState("");
    const [orgIndustry, setOrgIndustry] = useState("");
    const [orgSize, setOrgSize] = useState("");

    const [profileName, setProfileName] = useState(currentMember?.displayName || "");
    const [profileEmail, setProfileEmail] = useState(currentMember?.email || "");

    const [emailNotifications, setEmailNotifications] = useState(true);
    const [taskReminders, setTaskReminders] = useState(true);
    const [weeklySummary, setWeeklySummary] = useState(false);
    const [userSettings, setUserSettings] = useState<NonNullable<import("@/types/crm").UserProfile["settings"]>>({});

    const handleEditOrg = () => {
        setOrgName(currentOrg?.name || "");
        setOrgWebsite(currentOrg?.website || "");
        setOrgIndustry(currentOrg?.industry || "");
        setOrgSize(currentOrg?.size || "");
        setOrgDialogOpen(true);
    };

    const handleSaveOrg = async () => {
        if (!orgName.trim()) {
            toast.error("Organization name is required");
            return;
        }

        setSaving(true);
        try {
            logger.info("Updating organization", { module: "settings", action: "save", orgId });
            const { success, error } = await updateOrganization(orgId, {
                name: orgName,
                website: orgWebsite,
                industry: orgIndustry,
                size: orgSize,
            });

            if (!success) throw new Error(error || "Failed to update organization");

            toast.success("Organization updated successfully");
            setOrgDialogOpen(false);
        } catch (error: any) {
            logger.error("Error updating organization", { module: "settings", action: "save", orgId, error });
            toast.error(error.message || "Failed to update organization");
        } finally {
            setSaving(false);
        }
    };

    const handleEditProfile = () => {
        setProfileName(currentMember?.displayName || "");
        setProfileEmail(currentMember?.email || "");
        setProfileDialogOpen(true);
    };

    const handleSaveProfile = async () => {
        if (!currentMember?.userId || !profileName.trim()) {
            toast.error("Name is required");
            return;
        }

        setSaving(true);
        try {
            logger.info("Updating profile", { module: "settings", action: "save", orgId, userId: currentMember.userId });
            const { auth } = await import("@/lib/firebase");
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: profileName,
                });
            }

            await updateUserProfile(currentMember.userId, { displayName: profileName });

            toast.success("Profile updated successfully");
            setProfileDialogOpen(false);
        } catch (error: any) {
            logger.error("Error updating profile", { module: "settings", action: "save", orgId, userId: currentMember.userId, error });
            toast.error(error.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleConfigureNotifications = () => {
        setNotificationsDialogOpen(true);
    };

    const handleSaveNotifications = async () => {
        if (!currentMember?.userId) return;

        setSaving(true);
        try {
            const preferences = {
                emailNotifications,
                taskReminders,
                weeklySummary,
            };

            const { error } = await updateUserProfile(currentMember.userId, {
                settings: { ...userSettings, notifications: preferences },
            });
            if (error) throw new Error(error);

            toast.success("Notification preferences saved");
            setNotificationsDialogOpen(false);
        } catch (error: any) {
            logger.error("Error saving notifications", { module: "settings", action: "save", orgId, userId: currentMember.userId, error });
            toast.error("Failed to save notification preferences");
        } finally {
            setSaving(false);
        }
    };

    const handleChangeCurrency = () => {
        setCurrencyDialogOpen(true);
    };

    const handleSaveCurrency = async () => {
        if (!currentMember?.userId) return;

        setSaving(true);
        try {
            const { error } = await updateUserProfile(currentMember.userId, {
                settings: { ...userSettings, defaultCurrency: selectedCurrency },
            });
            if (error) throw new Error(error);

            toast.success(`Currency changed to ${selectedCurrency}`);
            setCurrencyDialogOpen(false);
        } catch (error: any) {
            logger.error("Error saving currency", { module: "settings", action: "save", orgId, userId: currentMember.userId, error });
            toast.error("Failed to save currency preference");
        } finally {
            setSaving(false);
        }
    };

    const handleLeaveOrg = async () => {
        if (!currentMember?.userId) return;
        if (!(await confirm({ title: "Leave Organization", message: `Leave "${currentOrg?.name || "this organization"}"? You will lose access unless re-invited.`, confirmLabel: "Leave", destructive: true }))) return;
        setLeaving(true);
        const { success, error } = await leaveOrganization(orgId, currentMember.userId);
        setLeaving(false);
        if (!success) {
            toast.error(error || "Failed to leave organization");
            return;
        }
        toast.success("You left the organization");
        clearOrg();
        router.push("/org");
    };

    const handleDeleteOrg = async () => {
        if (!currentMember?.userId) return;
        if (!(await confirm({ title: "Delete Organization", message: `Permanently delete "${currentOrg?.name || "this organization"}"? This cannot be undone.`, confirmLabel: "Delete", destructive: true }))) return;
        setDeletingOrg(true);
        const { success, error } = await deleteOrganization(orgId, currentMember.userId);
        setDeletingOrg(false);
        if (!success) {
            toast.error(error || "Failed to delete organization");
            return;
        }
        toast.success("Organization deleted");
        clearOrg();
        router.push("/org");
    };

    useEffect(() => {
        if (!currentMember?.userId) return;
        (async () => {
            const { user } = await getUserProfile(currentMember.userId);
            const settings = user?.settings || {};
            setUserSettings(settings);
            if (settings.defaultCurrency) setSelectedCurrency(settings.defaultCurrency);
            const notifs = settings.notifications;
            if (notifs && typeof notifs === "object") {
                setEmailNotifications(notifs.emailNotifications ?? true);
                setTaskReminders(notifs.taskReminders ?? true);
                setWeeklySummary(notifs.weeklySummary ?? false);
            }
        })();
    }, [currentMember?.userId]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings"
                breadcrumbs={[
                    { label: "Dashboard", href: `${base}/dashboard` },
                    { label: "Settings" },
                ]}
                description="Manage your account settings and preferences"
            />

            <div className="grid gap-6 md:grid-cols-2">
                {currentMember?.role === "admin" && (
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Organization Profile</CardTitle>
                            <CardDescription>
                                Manage your organization's basic details (Name, Website, Industry, Size)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Name</Label>
                                    <p className="text-sm font-medium mt-1">{currentOrg?.name}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Website</Label>
                                    <p className="text-sm font-medium mt-1">{currentOrg?.website || "—"}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Industry</Label>
                                    <p className="text-sm font-medium mt-1">{currentOrg?.industry || "—"}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Size</Label>
                                    <p className="text-sm font-medium mt-1">{currentOrg?.size || "—"}</p>
                                </div>
                            </div>
                            <Button variant="outline" className="mt-4" onClick={handleEditOrg}>
                                Edit Organization Details
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>
                            Customize how the CRM looks on your device
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Theme</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant={theme === "light" ? "default" : "outline"}
                                    onClick={() => setTheme("light")}
                                    className="justify-start"
                                >
                                    <Sun className="h-4 w-4 mr-2" />
                                    Light
                                </Button>
                                <Button
                                    variant={theme === "dark" ? "default" : "outline"}
                                    onClick={() => setTheme("dark")}
                                    className="justify-start"
                                >
                                    <Moon className="h-4 w-4 mr-2" />
                                    Dark
                                </Button>
                                <Button
                                    variant={theme === "system" ? "default" : "outline"}
                                    onClick={() => setTheme("system")}
                                    className="justify-start"
                                >
                                    <Monitor className="h-4 w-4 mr-2" />
                                    System
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Select your preferred theme or use system settings
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Account</CardTitle>
                        <CardDescription>
                            Manage your account information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Profile Settings</Label>
                            <p className="text-sm text-muted-foreground">
                                Update your profile information, email, and password
                            </p>
                            <Button variant="outline" className="w-full" onClick={handleEditProfile}>
                                Edit Profile
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>
                            Configure how you receive notifications
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive email updates about your leads and deals
                            </p>
                            <Button variant="outline" className="w-full" onClick={handleConfigureNotifications}>
                                Configure Notifications
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Preferences</CardTitle>
                        <CardDescription>
                            Customize your CRM experience
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Default Currency</Label>
                            <p className="text-sm text-muted-foreground">
                                Set your preferred currency for deals and invoices
                            </p>
                            <Button variant="outline" className="w-full" onClick={handleChangeCurrency}>
                                Change Currency
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {currentMember?.role === "admin" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Settings</CardTitle>
                            <CardDescription>
                                Branding, numbering, and payment details for invoices
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Company Logo, Color Theme & Payment Details</Label>
                                <p className="text-sm text-muted-foreground">
                                    Configure how invoices look and what payment details they show — applies
                                    to every invoice sent by anyone in your organization.
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => router.push(`${base}/settings/invoices`)}
                                >
                                    Configure Invoice Settings
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Card className="border-destructive/30">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                        Leaving or deleting an organization cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium">Leave Organization</p>
                            <p className="text-xs text-muted-foreground">
                                Remove yourself from "{currentOrg?.name || "this organization"}"
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleLeaveOrg} disabled={leaving || deletingOrg}>
                            {leaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
                            Leave
                        </Button>
                    </div>
                    {currentMember?.role === "admin" && (
                        <div className="flex items-center justify-between gap-4 pt-3 border-t border-border">
                            <div>
                                <p className="text-sm font-medium">Delete Organization</p>
                                <p className="text-xs text-muted-foreground">
                                    Permanently delete this organization and remove all members
                                </p>
                            </div>
                            <Button variant="destructive" onClick={handleDeleteOrg} disabled={leaving || deletingOrg}>
                                {deletingOrg ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Delete
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                            Update your profile information
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="settings-profile-name">Display Name</Label>
                            <Input
                                id="settings-profile-name"
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                placeholder="Your name"
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="settings-profile-email">Email</Label>
                            <Input
                                id="settings-profile-email"
                                value={profileEmail}
                                type="email"
                                placeholder="your@email.com"
                                disabled
                            />
                            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setProfileDialogOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={saving}>
                            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={notificationsDialogOpen} onOpenChange={setNotificationsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Notification Preferences</DialogTitle>
                        <DialogDescription>
                            Choose which notifications you receive
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Email Notifications</p>
                                <p className="text-sm text-muted-foreground">Receive emails about leads and deals</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={emailNotifications}
                                onChange={(e) => setEmailNotifications(e.target.checked)}
                                className="h-4 w-4"
                                disabled={saving}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Task Reminders</p>
                                <p className="text-sm text-muted-foreground">Get notified about upcoming tasks</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={taskReminders}
                                onChange={(e) => setTaskReminders(e.target.checked)}
                                className="h-4 w-4"
                                disabled={saving}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Weekly Summary</p>
                                <p className="text-sm text-muted-foreground">Receive weekly activity digest</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={weeklySummary}
                                onChange={(e) => setWeeklySummary(e.target.checked)}
                                className="h-4 w-4"
                                disabled={saving}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNotificationsDialogOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveNotifications} disabled={saving}>
                            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Preferences"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={currencyDialogOpen} onOpenChange={setCurrencyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select Currency</DialogTitle>
                        <DialogDescription>
                            Choose your preferred currency for deals and invoices
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        {["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "INR"].map((currency) => (
                            <button
                                key={currency}
                                onClick={() => !saving && setSelectedCurrency(currency)}
                                disabled={saving}
                                className={`w-full p-3 text-left border rounded-lg hover:bg-muted flex justify-between ${selectedCurrency === currency ? "border-primary bg-primary/5" : ""} ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <span>{currency}</span>
                                {selectedCurrency === currency && <span className="text-primary">&#10003;</span>}
                            </button>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCurrencyDialogOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveCurrency} disabled={saving}>
                            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Currency"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Organization Profile</DialogTitle>
                        <DialogDescription>
                            Update your organization's basic information
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="settings-org-name">Organization Name</Label>
                            <Input
                                id="settings-org-name"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                placeholder="Company Name"
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="settings-org-website">Website</Label>
                            <Input
                                id="settings-org-website"
                                value={orgWebsite}
                                onChange={(e) => setOrgWebsite(e.target.value)}
                                placeholder="https://example.com"
                                disabled={saving}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="settings-org-industry">Industry</Label>
                                <Input
                                    id="settings-org-industry"
                                    value={orgIndustry}
                                    onChange={(e) => setOrgIndustry(e.target.value)}
                                    placeholder="e.g. Software, Real Estate"
                                    disabled={saving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="settings-org-size">Size</Label>
                                <Input
                                    id="settings-org-size"
                                    value={orgSize}
                                    onChange={(e) => setOrgSize(e.target.value)}
                                    placeholder="e.g. 1-10, 11-50"
                                    disabled={saving}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOrgDialogOpen(false)} disabled={saving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveOrg} disabled={saving}>
                            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ConfirmDialog />
        </div>
    );
}
