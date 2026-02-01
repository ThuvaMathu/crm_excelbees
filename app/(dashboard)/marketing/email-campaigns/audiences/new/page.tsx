"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AITextarea } from "@/components/ui/ai-textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Contact } from "@/types/email-campaigns";
import { parseCSVContacts } from "@/lib/email-campaigns/utils";
import { Upload, Users, Database, FileText, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function NewAudiencePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("manual");

    const [formData, setFormData] = useState({
        name: "",
        description: "",
    });

    const [manualEmails, setManualEmails] = useState("");
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [crmContacts, setCrmContacts] = useState<Contact[]>([]);
    const [loadingCrm, setLoadingCrm] = useState(false);

    const handleLoadFromCrm = async () => {
        setLoadingCrm(true);
        try {
            const response = await fetch("/api/marketing/campaigns/audiences/crm-sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user?.uid }),
            });

            if (!response.ok) throw new Error("Failed to sync CRM contacts");

            const data = await response.json();
            setCrmContacts(data.contacts);
            toast.success(`Loaded ${data.contacts.length} contacts from CRM`);
        } catch (error) {
            console.error("Error loading CRM contacts:", error);
            toast.error("Failed to load CRM contacts");
        } finally {
            setLoadingCrm(false);
        }
    };

    const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCsvFile(file);
        toast.success(`File "${file.name}" selected`);
    };

    const handleCreate = async () => {
        if (!formData.name) {
            toast.error("Please enter an audience name");
            return;
        }

        setLoading(true);
        try {
            let contacts: Contact[] = [];

            // Parse contacts based on source
            if (activeTab === "manual" && manualEmails) {
                const emails = manualEmails.split("\n").filter((e) => e.trim());
                contacts = emails.map((email, i) => ({
                    id: `contact_${Date.now()}_${i}`,
                    email: email.trim(),
                    subscribed: true,
                    bounced: false,
                    complained: false,
                    totalOpens: 0,
                    totalClicks: 0,
                    source: "manual" as const,
                    subscribedAt: { toDate: () => new Date() } as any,
                }));
            } else if (activeTab === "csv" && csvFile) {
                const text = await csvFile.text();
                contacts = parseCSVContacts(text);
            } else if (activeTab === "crm") {
                contacts = crmContacts;
            }

            if (contacts.length === 0) {
                toast.error("No contacts to add");
                return;
            }

            const audience = {
                name: formData.name,
                description: formData.description,
                type: "static" as const,
                source: activeTab as "manual" | "csv" | "crm",
                contacts,
                contactCount: contacts.length,
                createdBy: user?.uid || "",
                createdByName: user?.displayName || user?.email || "",
            };

            const response = await fetch("/api/marketing/campaigns/audiences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user?.uid, audience }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create audience");
            }

            toast.success(`Audience created with ${contacts.length} contacts`);
            router.push("/marketing/email-campaigns/audiences");
        } catch (error: any) {
            console.error("Error creating audience:", error);
            toast.error(error.message || "Failed to create audience");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MarketingLayout
            title="Create New Audience"
            description="Build your email list or segment"
        >
            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Audience Details</CardTitle>
                        <CardDescription>Configure your audience settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Audience Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Newsletter Subscribers"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <AITextarea
                                    id="description"
                                    placeholder="Brief description of this audience"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    minWords={3}
                                />
                            </div>
                        </div>

                        {/* Contact Source */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-semibold">Add Contacts</h3>

                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="manual">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Manual
                                    </TabsTrigger>
                                    <TabsTrigger value="csv">
                                        <Upload className="h-4 w-4 mr-2" />
                                        CSV Upload
                                    </TabsTrigger>
                                    <TabsTrigger value="crm">
                                        <Database className="h-4 w-4 mr-2" />
                                        From CRM
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="manual" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="emails">Email Addresses (one per line)</Label>
                                        <AITextarea
                                            id="emails"
                                            placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com"
                                            value={manualEmails}
                                            onChange={(e) => setManualEmails(e.target.value)}
                                            minWords={100} // Disable AI for email list
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {manualEmails.split("\n").filter((e) => e.trim()).length} emails entered
                                        </p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="csv" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="csv">Upload CSV File</Label>
                                        <Input
                                            id="csv"
                                            type="file"
                                            accept=".csv"
                                            onChange={handleCsvUpload}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            CSV must contain an "email" column. Optional: firstname, lastname, company
                                        </p>
                                        {csvFile && (
                                            <p className="text-sm text-green-600">✓ File selected: {csvFile.name}</p>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="crm" className="space-y-4">
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            Import contacts from your CRM leads
                                        </p>
                                        <Button onClick={handleLoadFromCrm} disabled={loadingCrm} className="w-full">
                                            {loadingCrm ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Loading...
                                                </>
                                            ) : (
                                                <>
                                                    <Database className="h-4 w-4 mr-2" />
                                                    Load from CRM
                                                </>
                                            )}
                                        </Button>
                                        {crmContacts.length > 0 && (
                                            <p className="text-sm text-green-600">
                                                ✓ Loaded {crmContacts.length} contacts from CRM
                                            </p>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between pt-4 border-t">
                            <Button variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Create Audience
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MarketingLayout>
    );
}
