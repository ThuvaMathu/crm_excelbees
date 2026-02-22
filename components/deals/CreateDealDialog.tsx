"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AITextarea } from "@/components/ui/ai-textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createDeal } from "@/lib/firestore/deals";
import { getCompanies } from "@/lib/firestore/companies";
import { getContacts } from "@/lib/firestore/contacts";
import { dealSchema, type DealFormData } from "@/lib/validations/deal";
import { useAuth } from "@/hooks/useAuth";
import type { Company, Contact, DealStage } from "@/types/crm";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

interface CreateDealDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    defaultCompanyId?: string;
}

const DEAL_STAGES: DealStage[] = [
    "Pipeline",
    "Follow Up",
    "Schedule Service",
    "Conversation",
    "Won",
    "Lost",
];

export function CreateDealDialog({
    open,
    onOpenChange,
    onSuccess,
    defaultCompanyId,
}: CreateDealDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);

    const form = useForm<DealFormData>({
        resolver: zodResolver(dealSchema),
        defaultValues: {
            title: "",
            stage: "Pipeline",
            value: 0,
            probability: 50,
            contactIds: [],
            companyId: defaultCompanyId,
            description: "",
            notes: "",
        },
    });

    useEffect(() => {
        if (open) {
            fetchCompaniesAndContacts();
        }
    }, [open]);

    const fetchCompaniesAndContacts = async () => {
        console.log("Fetching companies and contacts...");
        const [companiesResult, contactsResult] = await Promise.all([
            getCompanies(),
            getContacts(),
        ]);

        console.log("Companies result:", companiesResult);
        console.log("Contacts result:", contactsResult);

        if (companiesResult.companies) {
            setCompanies(companiesResult.companies);
            console.log("Set companies:", companiesResult.companies.length);
        }
        if (contactsResult.contacts) {
            setContacts(contactsResult.contacts);
            console.log("Set contacts:", contactsResult.contacts.length);
        }
    };

    const onSubmit = async (data: DealFormData) => {
        if (!user) {
            toast.error("You must be logged in to create a deal");
            return;
        }

        setLoading(true);

        // Get company name if companyId is provided
        let companyName: string | undefined;
        if (data.companyId) {
            const company = companies.find((c) => c.id === data.companyId);
            companyName = company?.name;
        }

        const dealData = {
            title: data.title,
            stage: data.stage,
            value: data.value,
            probability: data.probability,
            closeDate: data.closeDate ? Timestamp.fromDate(data.closeDate) : undefined,
            contactIds: data.contactIds,
            companyId: data.companyId,
            companyName,
            description: data.description,
            notes: data.notes,
        };

        const { success, error } = await createDeal(dealData, user.uid);

        setLoading(false);

        if (success) {
            toast.success("Deal created successfully!");
            form.reset();
            onOpenChange(false);
            onSuccess?.();
        } else {
            toast.error(error || "Failed to create deal");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Deal</DialogTitle>
                    <DialogDescription>
                        Add a new deal to your sales pipeline
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Deal Title *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Website Redesign Project"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="stage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stage *</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select stage" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {DEAL_STAGES.map((stage) => (
                                                    <SelectItem key={stage} value={stage}>
                                                        {stage}
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
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deal Value ($) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="10000"
                                                {...field}
                                                onChange={(e) => field.onChange(Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="probability"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Probability (%) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="50"
                                                {...field}
                                                onChange={(e) => field.onChange(Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="closeDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Expected Close Date</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                min={new Date().toISOString().split("T")[0]}
                                                {...field}
                                                value={
                                                    field.value
                                                        ? new Date(field.value).toISOString().split("T")[0]
                                                        : ""
                                                }
                                                onChange={(e) =>
                                                    field.onChange(
                                                        e.target.value ? new Date(e.target.value) : undefined
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="companyId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select company (optional)" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <AITextarea
                                            placeholder="Brief description of the deal..."
                                            rows={3}
                                            {...field}
                                            minWords={5}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes</FormLabel>
                                    <FormControl>
                                        <AITextarea
                                            placeholder="Additional notes..."
                                            rows={2}
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
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-primary hover:bg-primary/90"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Deal"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
