"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AITextarea } from "@/components/ui/ai-textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { contactSchema, type ContactFormData } from "@/lib/validations/contact";
import { createContact } from "@/lib/firestore/contacts";
import { getCompanies } from "@/lib/firestore/companies";
import { useAuth } from "@/hooks/useAuth";
import { useOrgStore } from "@/store/org";
import type { Company } from "@/types/crm";
import { toast } from "sonner";

interface CreateContactDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateContactDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateContactDialogProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { currentOrg } = useOrgStore();
    const organizationId = currentOrg?.id;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);

    // Load companies when the dialog opens
    useEffect(() => {
        if (!open || !organizationId) return;
        getCompanies(organizationId).then(({ companies: list }) => {
            setCompanies(list ?? []);
        });
    }, [open, organizationId]);

    const form = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            companyId: "",
            companyName: "",
            jobTitle: "",
            notes: "",
        },
    });

    // Reset form when dialog closes
    useEffect(() => {
        if (!open) form.reset();
    }, [open]);

    const handleCompanyChange = (value: string) => {
        if (!value || value === "__none__") {
            form.setValue("companyId", "");
            form.setValue("companyName", "");
        } else {
            const selected = companies.find((c) => c.id === value);
            form.setValue("companyId", value);
            form.setValue("companyName", selected?.name ?? "");
        }
    };

    const onSubmit = async (data: ContactFormData) => {
        if (!user) return;
        if (!organizationId) {
            toast.error("No active organization. Please select a workspace.");
            return;
        }

        // Strip empty strings so Firestore doesn't store blank values
        const payload: ContactFormData = {
            ...data,
            phone: data.phone || undefined,
            companyId: data.companyId || undefined,
            companyName: data.companyName || undefined,
            jobTitle: data.jobTitle || undefined,
            notes: data.notes || undefined,
        };

        setIsSubmitting(true);
        const { success, id, error } = await createContact(payload, user.uid, organizationId);
        setIsSubmitting(false);

        if (success && id) {
            toast.success("Contact created successfully!");
            form.reset();
            onOpenChange(false);
            onSuccess?.();
            router.refresh();
        } else {
            toast.error(error || "Failed to create contact");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Contact</DialogTitle>
                    <DialogDescription>
                        Add a new contact to your CRM. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="john@company.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+1 (555) 123-4567" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Company selector — optional */}
                            <FormField
                                control={form.control}
                                name="companyId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company</FormLabel>
                                        <Select
                                            value={field.value || "__none__"}
                                            onValueChange={handleCompanyChange}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a company (optional)" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="__none__">
                                                    <span className="text-muted-foreground">None</span>
                                                </SelectItem>
                                                {companies.map((company) => (
                                                    <SelectItem key={company.id} value={company.id}>
                                                        {company.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="jobTitle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Job Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="CEO" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <AITextarea
                                            placeholder="Add any additional notes about this contact..."
                                            className="resize-none"
                                            rows={3}
                                            {...field}
                                            minWords={5}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-primary hover:bg-primary/90"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Contact"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
