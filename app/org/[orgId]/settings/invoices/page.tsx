"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CustomColorPicker } from "@/components/ui/CustomColorPicker";
import { LogoUploader } from "@/components/ui/LogoUploader";
import { invoiceOrgSettingsSchema, type InvoiceOrgSettingsFormData } from "@/lib/validations/invoiceSettings";
import { getOrganization, updateOrganization, updateInvoiceSettings } from "@/lib/firestore/organizations";
import { RBACGuard } from "@/components/auth/RBACGuard";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CreditCard } from "lucide-react";
import { logger } from "@/lib/logger/client";

export default function OrgInvoiceSettingsPage() {
    return (
        <RBACGuard requiredRole="admin">
            <OrgInvoiceSettingsPageContent />
        </RBACGuard>
    );
}

function OrgInvoiceSettingsPageContent() {
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    const router = useRouter();
    const base = `/org/${orgId}`;

    const [fetching, setFetching] = useState(true);
    const [saving, setSaving] = useState(false);
    const [orgName, setOrgName] = useState("");
    const [logoUrl, setLogoUrl] = useState("");
    const [savingLogo, setSavingLogo] = useState(false);

    const form = useForm<InvoiceOrgSettingsFormData>({
        resolver: zodResolver(invoiceOrgSettingsSchema) as any,
        defaultValues: {
            colorTheme: "#182347",
            invoicePrefix: "INV-",
            nextInvoiceNumber: 1,
            accountName: "",
            accountNumber: "",
            bankName: "",
            ifsc: "",
            upiId: "",
            gstin: "",
        },
    });

    useEffect(() => {
        loadSettings();
    }, [orgId]);

    const loadSettings = async () => {
        setFetching(true);
        try {
            logger.info("Fetching org invoice settings", { module: "invoices", action: "fetch-org-settings", metadata: { orgId } });
            const { org, error } = await getOrganization(orgId);
            if (error || !org) {
                toast.error("Failed to load organization");
                return;
            }
            setOrgName(org.name);
            setLogoUrl(org.logoUrl || "");
            const settings = org.invoiceSettings;
            form.reset({
                colorTheme: settings?.colorTheme || "#182347",
                invoicePrefix: settings?.invoicePrefix || "INV-",
                nextInvoiceNumber: settings?.nextInvoiceNumber || 1,
                accountName: settings?.accountName || "",
                accountNumber: settings?.accountNumber || "",
                bankName: settings?.bankName || "",
                ifsc: settings?.ifsc || "",
                upiId: settings?.upiId || "",
                gstin: settings?.gstin || "",
            });
        } catch (error) {
            logger.error("Error loading org invoice settings", { module: "invoices", action: "fetch-org-settings", metadata: { orgId }, error });
        } finally {
            setFetching(false);
        }
    };

    const onSubmit = async (data: InvoiceOrgSettingsFormData) => {
        setSaving(true);
        try {
            logger.info("Saving org invoice settings", { module: "invoices", action: "save-org-settings", metadata: { orgId } });
            const { success, error } = await updateInvoiceSettings(orgId, data);
            if (!success) {
                toast.error(error || "Failed to save settings");
                return;
            }
            toast.success("Invoice settings saved");
        } catch (error: any) {
            logger.error("Error saving org invoice settings", { module: "invoices", action: "save-org-settings", metadata: { orgId }, error });
            toast.error(error.message || "An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleLogoChange = async (url: string) => {
        setLogoUrl(url);
        setSavingLogo(true);
        try {
            const { success, error } = await updateOrganization(orgId, { logoUrl: url });
            if (!success) {
                toast.error(error || "Failed to save logo");
                return;
            }
            toast.success(url ? "Logo updated" : "Logo removed");
        } catch (error: any) {
            toast.error(error.message || "Failed to save logo");
        } finally {
            setSavingLogo(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.push(`${base}/settings`)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <PageHeader
                    title="Invoice Settings"
                    breadcrumbs={[
                        { label: "Settings", href: `${base}/settings` },
                        { label: "Invoice Settings" },
                    ]}
                    description="Configure invoice branding, numbering, and payment details for your organization."
                />
            </div>

            {fetching ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Company</CardTitle>
                            <CardDescription>
                                Every invoice always shows your organization's own name and logo — team
                                members can't override this per invoice.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Company Name</Label>
                                <Input value={orgName} disabled />
                                <p className="text-xs text-muted-foreground">
                                    Set in Organization Settings — not editable here.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <LogoUploader value={logoUrl} onChange={handleLogoChange} orgId={orgId} />
                                {savingLogo && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Loader2 className="h-3 w-3 animate-spin" /> Saving logo...
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Branding & Numbering</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="colorTheme"
                                        render={({ field }) => (
                                            <FormItem>
                                                <CustomColorPicker value={field.value} onChange={field.onChange} />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="invoicePrefix"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Invoice Number Prefix</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center gap-2">
                                                        <Input placeholder="INV-" {...field} value={field.value || ""} className="max-w-[200px]" />
                                                        <span className="text-sm text-muted-foreground">+ Sequential Number</span>
                                                    </div>
                                                </FormControl>
                                                <p className="text-xs text-muted-foreground">
                                                    Example: {field.value || "INV-"}0001, {field.value || "INV-"}0002...
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="nextInvoiceNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Next Invoice Number</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="1"
                                                        {...field}
                                                        value={field.value || 1}
                                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                                        className="max-w-[200px]"
                                                    />
                                                </FormControl>
                                                <p className="text-xs text-muted-foreground">
                                                    The next invoice created org-wide will use this number. Useful for
                                                    importing existing invoices or starting from a specific number.
                                                </p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <CreditCard className="h-4 w-4" />
                                        Payment Details
                                    </CardTitle>
                                    <CardDescription>
                                        Shown in the Payment Method section of every invoice PDF.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="accountName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Account Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Account Holder Name" {...field} value={field.value || ""} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="accountNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Account Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Bank Account Number" {...field} value={field.value || ""} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="bankName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bank Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g., Indian Bank" {...field} value={field.value || ""} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="ifsc"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel> IFSC/BSB Code</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g., IDIB000T099" {...field} value={field.value || ""} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="upiId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>UPI ID (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g., name@upi" {...field} value={field.value || ""} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="gstin"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>GSTIN (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="GST Identification Number" {...field} value={field.value || ""} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => router.push(`${base}/settings`)} disabled={saving}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Settings
                                </Button>
                            </div>
                        </form>
                    </Form>
                </>
            )}
        </div>
    );
}
