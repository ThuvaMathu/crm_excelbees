"use client";

import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ImportCSVDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

interface ParsedContact {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    companyName?: string;
    jobTitle?: string;
}

export function ImportCSVDialog({
    open,
    onOpenChange,
    onSuccess,
}: ImportCSVDialogProps) {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseCSV = (text: string): ParsedContact[] => {
        const lines = text.split("\n").filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        const contacts: ParsedContact[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",").map(v => v.trim());
            if (values.length < 3) continue; // Need at least firstName, lastName, email

            const contact: any = {};
            headers.forEach((header, index) => {
                contact[header] = values[index] || "";
            });

            // Map CSV columns to contact fields
            contacts.push({
                firstName: contact.firstname || contact["first name"] || "",
                lastName: contact.lastname || contact["last name"] || "",
                email: contact.email || "",
                phone: contact.phone || "",
                companyName: contact.companyname || contact.company || contact["company name"] || "",
                jobTitle: contact.jobtitle || contact["job title"] || "",
            });
        }

        return contacts.filter(c => c.email && c.firstName && c.lastName);
    };

    const handleFileSelect = (file: File) => {
        if (!file.name.endsWith(".csv")) {
            toast.error("Please select a CSV file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const contacts = parseCSV(text);
                if (contacts.length === 0) {
                    toast.error("No valid contacts found in CSV");
                    return;
                }
                setParsedContacts(contacts);
                toast.success(`Parsed ${contacts.length} contacts`);
            } catch (error) {
                toast.error("Failed to parse CSV file");
            }
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleImport = async () => {
        if (!user || parsedContacts.length === 0) return;

        setIsSubmitting(true);
        let successCount = 0;
        let errorCount = 0;

        try {
            const { createContact } = await import("@/lib/firestore/contacts");

            for (const contact of parsedContacts) {
                const result = await createContact(contact, user.uid);
                if (result.success) {
                    successCount++;
                } else {
                    errorCount++;
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully imported ${successCount} contacts${errorCount > 0 ? ` (${errorCount} failed)` : ""}`);
                setParsedContacts([]);
                onOpenChange(false);
                if (onSuccess) onSuccess();
            } else {
                toast.error("Failed to import contacts");
            }
        } catch (error) {
            toast.error("An error occurred during import");
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeContact = (index: number) => {
        setParsedContacts(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Contacts from CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with contact information. The file should include columns for firstName, lastName, and email.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {parsedContacts.length === 0 ? (
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                isDragging
                                    ? "border-primary bg-primary/5"
                                    : "border-muted-foreground/25 hover:border-primary/50"
                            }`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-sm font-medium mb-2">
                                Drag and drop your CSV file here
                            </p>
                            <p className="text-xs text-muted-foreground mb-4">
                                or click to browse
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Select CSV File
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelect(file);
                                }}
                            />
                            <div className="mt-4 text-xs text-muted-foreground">
                                <p className="font-medium mb-1">Expected CSV format:</p>
                                <code className="bg-muted px-2 py-1 rounded">
                                    firstName,lastName,email,phone,companyName,jobTitle
                                </code>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">
                                    {parsedContacts.length} contacts ready to import
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setParsedContacts([])}
                                >
                                    Clear All
                                </Button>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {parsedContacts.map((contact, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">
                                                {contact.firstName} {contact.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {contact.email}
                                                {contact.companyName && ` • ${contact.companyName}`}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeContact(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setParsedContacts([]);
                            onOpenChange(false);
                        }}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={parsedContacts.length === 0 || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Importing...
                            </>
                        ) : (
                            `Import ${parsedContacts.length} Contact${parsedContacts.length !== 1 ? "s" : ""}`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
