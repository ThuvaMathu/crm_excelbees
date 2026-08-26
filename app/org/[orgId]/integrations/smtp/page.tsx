"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { RBACGuard } from "@/components/auth/RBACGuard";
import { logger } from "@/lib/logger/client";

export default function SmtpSettingsPage() {
    return (
        <RBACGuard requiredRole="admin">
            <SmtpSettingsPageContent />
        </RBACGuard>
    );
}

function SmtpSettingsPageContent() {
    const params = useParams<{ orgId: string }>();
    const router = useRouter();
    const orgId = params.orgId;
    const base = `/org/${orgId}`;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [provider, setProvider] = useState("custom");
    const [host, setHost] = useState("");
    const [port, setPort] = useState("465");
    const [secure, setSecure] = useState(true);
    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [passRevealed, setPassRevealed] = useState(false);
    const [revealing, setRevealing] = useState(false);
    // The password field holds an unsaved local edit as soon as the user
    // types in it — once that happens "reveal" no longer makes sense (there
    // is nothing saved to fetch that matches what's on screen).
    const [passDirty, setPassDirty] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                if (!auth.currentUser) return;
                const token = await auth.currentUser.getIdToken();
                const res = await fetch(`/api/org/${orgId}/integrations/smtp`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    if (data.smtpConfig) {
                        setProvider(data.smtpConfig.provider || "custom");
                        setHost(data.smtpConfig.host || "");
                        setPort(data.smtpConfig.port?.toString() || "465");
                        setSecure(data.smtpConfig.secure ?? true);
                        setUser(data.smtpConfig.user || "");
                        setPass(data.smtpConfig.pass || "");
                    }
                }
            } catch (error) {
                logger.error("Failed to load SMTP config", { module: "settings", action: "fetch", orgId, error });
                toast.error("Failed to load SMTP configuration");
            } finally {
                setLoading(false);
            }
        };
        
        // Firebase auth takes a moment to initialize
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchConfig();
            }
        });
        
        return () => unsubscribe();
    }, [orgId]);

    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProvider = e.target.value;
        setProvider(newProvider);
        
        switch (newProvider) {
            case "gmail":
                setHost("smtp.gmail.com");
                setPort("465");
                setSecure(true);
                break;
            case "yahoo":
                setHost("smtp.mail.yahoo.com");
                setPort("465");
                setSecure(true);
                break;
            case "zoho":
                setHost("smtppro.zoho.com");
                setPort("465");
                setSecure(true);
                break;
            case "outlook":
                setHost("smtp.office365.com");
                setPort("587");
                setSecure(false);
                break;
            default:
                break;
        }
    };

    const handleTogglePass = async () => {
        // Already showing the real value (or the field is an unsaved local
        // edit, which is never masked) — a plain visibility toggle is fine.
        if (showPass || passDirty || passRevealed || !pass) {
            setShowPass((v) => !v);
            return;
        }

        // First reveal of a saved, masked ("********") password: fetch the
        // decrypted value from the server on this explicit user action
        // rather than ever sending it on the routine page-load GET.
        setRevealing(true);
        try {
            if (!auth.currentUser) throw new Error("Not authenticated");
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`/api/org/${orgId}/integrations/smtp?reveal=true`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `Server returned ${res.status}`);
            }
            const data = await res.json();
            if (data.smtpConfig?.pass) {
                setPass(data.smtpConfig.pass);
                setPassRevealed(true);
                setShowPass(true);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to reveal password");
        } finally {
            setRevealing(false);
        }
    };

    const handleSave = async () => {
        if (!host || !port || !user) {
            toast.error("Please fill in all required fields");
            return;
        }
        
        setSaving(true);
        try {
            if (!auth.currentUser) throw new Error("Not authenticated");
            const token = await auth.currentUser.getIdToken();
            
            const res = await fetch(`/api/org/${orgId}/integrations/smtp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    provider,
                    host,
                    port: parseInt(port),
                    secure,
                    user,
                    pass
                })
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `Server returned ${res.status}`);
            }

            toast.success("SMTP configuration saved");
            router.push(`${base}/integrations`);
        } catch (error: any) {
            logger.error("Failed to save SMTP config", { module: "settings", action: "save", orgId, error });
            toast.error(error.message || "Failed to save configuration");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.push(`${base}/integrations`)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <PageHeader
                    title="Email (SMTP) Configuration"
                    breadcrumbs={[
                        { label: "Integrations", href: `${base}/integrations` },
                        { label: "SMTP Settings" },
                    ]}
                    description="Configure your email provider to send outgoing emails from the CRM."
                />
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>SMTP Settings</CardTitle>
                        <CardDescription>
                            Connect your email account securely using an App Password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="provider">Email Provider</Label>
                            <select 
                                id="provider" 
                                value={provider}
                                onChange={handleProviderChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="gmail">Gmail</option>
                                <option value="outlook">Outlook / Office 365</option>
                                <option value="yahoo">Yahoo</option>
                                <option value="zoho">Zoho Mail</option>
                                <option value="custom">Custom SMTP Server</option>
                            </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="host">SMTP Host</Label>
                                <Input 
                                    id="host" 
                                    value={host}
                                    onChange={(e) => setHost(e.target.value)}
                                    placeholder="smtp.example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="port">Port</Label>
                                <Input 
                                    id="port" 
                                    type="number"
                                    value={port}
                                    onChange={(e) => setPort(e.target.value)}
                                    placeholder="465 or 587"
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <input 
                                type="checkbox"
                                id="secure"
                                checked={secure}
                                onChange={(e) => setSecure(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="secure" className="font-normal">
                                Use secure connection (SSL/TLS)
                            </Label>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="user">Email Address</Label>
                            <Input 
                                id="user" 
                                type="email"
                                value={user}
                                onChange={(e) => setUser(e.target.value)}
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pass">App Password</Label>
                            <div className="relative">
                                <Input
                                    id="pass"
                                    type={showPass ? "text" : "password"}
                                    value={pass}
                                    onChange={(e) => {
                                        setPass(e.target.value);
                                        setPassDirty(true);
                                        setPassRevealed(false);
                                    }}
                                    placeholder="Enter App Password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                                    onClick={handleTogglePass}
                                    disabled={revealing}
                                    aria-label={showPass ? "Hide password" : "Show password"}
                                >
                                    {revealing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : showPass ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                For security reasons, please generate and use an App Password rather than your standard account password.
                            </p>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => router.push(`${base}/integrations`)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save Configuration"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
