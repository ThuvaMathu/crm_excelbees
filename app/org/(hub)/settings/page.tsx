"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Shield, Palette, Save } from "lucide-react";
import { toast } from "sonner";

export default function AccountSettingsPage() {
    const [notifications, setNotifications] = useState({
        email:   true,
        desktop: false,
        weekly:  true,
    });

    const toggle = (key: keyof typeof notifications) =>
        setNotifications((n) => ({ ...n, [key]: !n[key] }));

    const handleSave = () => {
        // Persist preferences via Firestore when fully implemented
        toast.success("Settings saved.");
    };

    return (
        <>
            {/* Page heading */}
            <div className="px-8 pt-8 pb-4 border-b border-border shrink-0">
                <h1 className="text-xl font-semibold text-foreground">Account Settings</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Manage your preferences and security configuration.
                </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="max-w-2xl space-y-6">

                    {/* Notifications */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm">Notifications</CardTitle>
                            </div>
                            <CardDescription className="text-xs">
                                Choose how you receive updates.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { key: "email"   as const, label: "Email notifications",  desc: "Receive updates via email" },
                                { key: "desktop" as const, label: "Desktop notifications", desc: "Browser push notifications" },
                                { key: "weekly"  as const, label: "Weekly digest",         desc: "Summary of activity every Monday" },
                            ].map(({ key, label, desc }) => (
                                <div key={key} className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm">{label}</Label>
                                        <p className="text-xs text-muted-foreground">{desc}</p>
                                    </div>
                                    <Switch
                                        checked={notifications[key]}
                                        onCheckedChange={() => toggle(key)}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Security */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm">Security</CardTitle>
                            </div>
                            <CardDescription className="text-xs">
                                Account security settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-0">
                            {[
                                { label: "Two-factor authentication", desc: "Add an extra layer of security" },
                                { label: "Active sessions",           desc: "View and manage logged-in devices" },
                            ].map(({ label, desc }, i) => (
                                <div
                                    key={label}
                                    className={`flex items-center justify-between py-3 ${i < 1 ? "border-b border-border" : ""}`}
                                >
                                    <div>
                                        <p className="text-sm font-medium">{label}</p>
                                        <p className="text-xs text-muted-foreground">{desc}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px]">Coming soon</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Appearance */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Palette className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm">Appearance</CardTitle>
                            </div>
                            <CardDescription className="text-xs">Customise your experience.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between py-1">
                                <div>
                                    <p className="text-sm font-medium">Theme</p>
                                    <p className="text-xs text-muted-foreground">Dark / Light / System</p>
                                </div>
                                <Badge variant="secondary" className="text-[10px]">Coming soon</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} size="sm" className="gap-2">
                            <Save className="h-4 w-4" />
                            Save Settings
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
