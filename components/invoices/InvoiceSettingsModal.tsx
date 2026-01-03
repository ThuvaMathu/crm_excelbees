"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomColorPicker } from "@/components/ui/CustomColorPicker";
import { LogoUploader } from "@/components/ui/LogoUploader";
import { invoiceUserSettingsSchema, type InvoiceUserSettingsFormData } from "@/lib/validations/invoiceSettings";
import { getUserInvoiceSettings, setUserInvoiceSettings } from "@/lib/firestore/users";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Settings } from "lucide-react";

interface InvoiceSettingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InvoiceSettingsModal({ open, onOpenChange }: InvoiceSettingsModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const form = useForm<InvoiceUserSettingsFormData>({
        resolver: zodResolver(invoiceUserSettingsSchema) as any,
        defaultValues: {
            template: "standard",
            companyName: "",
            fromName: "",
            fromEmail: "",
            logoUrl: "",
            colorTheme: "#3B82F6", // Default blue
            invoicePrefix: "INV-",
            nextInvoiceNumber: 1,
        },
    });

    // Load existing settings
    useEffect(() => {
        if (open && user) {
            loadSettings();
        }
    }, [open, user]);

    const loadSettings = async () => {
        if (!user) return;

        setFetching(true);
        try {
            const { settings, error } = await getUserInvoiceSettings(user.uid);

            if (error) {
                console.error("Failed to load settings:", error);
                return;
            }

            if (settings) {
                form.reset({
                    ...settings,
                    // Ensure these fields have defaults if missing (for backward compatibility)
                    invoicePrefix: settings.invoicePrefix || "INV-",
                    nextInvoiceNumber: settings.nextInvoiceNumber || 1,
                });
            } else {
                // Set defaults from user profile
                form.reset({
                    template: "standard",
                    companyName: "",
                    fromName: user.displayName || "",
                    fromEmail: user.email || "",
                    logoUrl: "",
                    colorTheme: "#3B82F6", // Default blue
                    invoicePrefix: "INV-",
                    nextInvoiceNumber: 1,
                });
            }
        } catch (error) {
            console.error("Error loading settings:", error);
        } finally {
            setFetching(false);
        }
    };

    const onSubmit = async (data: InvoiceUserSettingsFormData) => {
        console.log("📝 Invoice Settings Form Submitted:", data);

        if (!user) {
            console.error("❌ No user found");
            return;
        }

        setLoading(true);
        try {
            console.log("💾 Saving settings for user:", user.uid);
            const { success, error } = await setUserInvoiceSettings(user.uid, data);

            if (error) {
                console.error("❌ Save failed:", error);
                toast.error("Failed to save settings");
                return;
            }

            console.log("✅ Settings saved successfully");
            toast.success("Invoice settings saved successfully");
            onOpenChange(false);
        } catch (error) {
            console.error("💥 Error saving settings:", error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Invoice Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure your default invoice settings. These will be used when generating PDFs.
                    </DialogDescription>
                </DialogHeader>

                {fetching ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(
                                onSubmit,
                                (errors) => {
                                    console.error("❌ Form Validation Errors:", errors);
                                    toast.error("Please check all required fields");
                                }
                            )}
                            className="space-y-6"
                        >
                            {/* Template Selection */}
                            <FormField
                                control={form.control}
                                name="template"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Invoice Template</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="standard">Standard - Clean and minimal</SelectItem>
                                                <SelectItem value="professional">Professional - Corporate style</SelectItem>
                                                <SelectItem value="creative">Creative - Modern design</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Company Name */}
                            <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Acme Corp" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* From Name */}
                            <FormField
                                control={form.control}
                                name="fromName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>From Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* From Email */}
                            <FormField
                                control={form.control}
                                name="fromEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>From Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="john@acme.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Logo Upload */}
                            <FormField
                                control={form.control}
                                name="logoUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <LogoUploader value={field.value} onChange={field.onChange} />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Invoice Prefix */}
                            <FormField
                                control={form.control}
                                name="invoicePrefix"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Invoice Number Prefix</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    placeholder="INV-"
                                                    {...field}
                                                    value={field.value || ""}
                                                    className="max-w-[200px]"
                                                />
                                                <span className="text-sm text-muted-foreground">+ Sequential Number</span>
                                            </div>
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">
                                            Example: {field.value || "INV-"}001, {field.value || "INV-"}002, {field.value || "INV-"}003...
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Color Theme */}
                            <FormField
                                control={form.control}
                                name="colorTheme"
                                render={({ field }) => (
                                    <FormItem>
                                        <CustomColorPicker
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Settings
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
