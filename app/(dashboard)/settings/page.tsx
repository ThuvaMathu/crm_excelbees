"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();
    const router = useRouter();
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false);
    const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState("USD");
    const [saving, setSaving] = useState(false);

    // Profile form state
    const [profileName, setProfileName] = useState(user?.displayName || "");
    const [profileEmail, setProfileEmail] = useState(user?.email || "");

    // Notification preferences state
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [taskReminders, setTaskReminders] = useState(true);
    const [weeklySummary, setWeeklySummary] = useState(false);

    const handleEditProfile = () => {
        setProfileName(user?.displayName || "");
        setProfileEmail(user?.email || "");
        setProfileDialogOpen(true);
    };

    const handleSaveProfile = async () => {
        if (!user || !profileName.trim()) {
            toast.error("Name is required");
            return;
        }

        setSaving(true);
        try {
            console.log(`[Settings] Updating profile for user ${user.uid}`);
            // Update Firebase Auth profile
            const { auth } = await import("@/lib/firebase");
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: profileName,
                });
            }

            // Optionally update user preferences in Firestore
            await fetch("/api/user/preferences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.uid,
                    preferences: { displayName: profileName }
                })
            }).catch(() => {
                // API route might not exist yet, but auth update is sufficient
                console.log("[Settings] User preferences API not available, skipping");
            });

            toast.success("Profile updated successfully");
            setProfileDialogOpen(false);

            // Refresh user info
            window.location.reload();
        } catch (error: any) {
            console.error("[Settings] Error updating profile:", error);
            toast.error(error.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleConfigureNotifications = () => {
        setNotificationsDialogOpen(true);
    };

    const handleSaveNotifications = async () => {
        if (!user) return;

        setSaving(true);
        try {
            console.log(`[Settings] Saving notification preferences for user ${user.uid}`);

            // Save to user preferences in Firestore
            const preferences = {
                emailNotifications,
                taskReminders,
                weeklySummary,
            };

            // Always save to localStorage immediately to ensure persistence
            localStorage.setItem(`notifications_${user.uid}`, JSON.stringify(preferences));

            try {
                await fetch("/api/user/preferences", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user.uid,
                        preferences: { notifications: preferences }
                    })
                });
            } catch (e) {
                console.log("[Settings] User preferences API not available, but saved to localStorage");
            }

            toast.success("Notification preferences saved");
            setNotificationsDialogOpen(false);
        } catch (error: any) {
            console.error("[Settings] Error saving notifications:", error);
            toast.error("Failed to save notification preferences");
        } finally {
            setSaving(false);
        }
    };

    const handleChangeCurrency = () => {
        setCurrencyDialogOpen(true);
    };

    const handleSaveCurrency = async () => {
        if (!user) return;

        setSaving(true);
        try {
            console.log(`[Settings] Saving currency preference for user ${user.uid}: ${selectedCurrency}`);

            // Always save to localStorage immediately to ensure persistence
            localStorage.setItem(`currency_${user.uid}`, selectedCurrency);

            try {
                await fetch("/api/user/preferences", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user.uid,
                        preferences: { currency: selectedCurrency }
                    })
                });
            } catch (e) {
                console.log("[Settings] User preferences API not available, but saved to localStorage");
            }

            toast.success(`Currency changed to ${selectedCurrency}`);
            setCurrencyDialogOpen(false);
        } catch (error: any) {
            console.error("[Settings] Error saving currency:", error);
            toast.error("Failed to save currency preference");
        } finally {
            setSaving(false);
        }
    };

    // Load saved preferences on mount and when user auth state changes
    useEffect(() => {
        if (user) {
            // Load from localStorage
            const savedCurrency = localStorage.getItem(`currency_${user.uid}`);
            if (savedCurrency) setSelectedCurrency(savedCurrency);

            const savedNotifications = localStorage.getItem(`notifications_${user.uid}`);
            if (savedNotifications) {
                try {
                    const notifs = JSON.parse(savedNotifications);
                    setEmailNotifications(notifs.emailNotifications ?? true);
                    setTaskReminders(notifs.taskReminders ?? true);
                    setWeeklySummary(notifs.weeklySummary ?? false);
                } catch (e) {
                    console.error("[Settings] Error parsing saved notifications:", e);
                }
            }
        }
    }, [user]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings"
                breadcrumbs={[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Settings" },
                ]}
                description="Manage your account settings and preferences"
            />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Appearance Settings */}
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

                {/* Account Settings */}
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

                {/* Notification Settings */}
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

                {/* Preferences */}
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
            </div>

            {/* Profile Edit Dialog */}
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
                            <Label>Display Name</Label>
                            <Input
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                placeholder="Your name"
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
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

            {/* Notifications Dialog */}
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

            {/* Currency Dialog */}
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
                                {selectedCurrency === currency && <span className="text-primary">✓</span>}
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
        </div>
    );
}
