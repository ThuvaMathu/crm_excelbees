"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AITextarea } from "@/components/ui/ai-textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Send, X, Paperclip, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getInvoicePDFBlob } from "@/lib/pdf/invoice-generator";
import { getUserInvoiceSettings } from "@/lib/firestore/users";
import { generateInvoiceEmailTemplate } from "@/lib/email/templates/invoice-template";
import type { Invoice } from "@/types/crm";
import { AIAssistant } from "@/components/email/AIAssistant";

interface InvoiceEmailComposeModalProps {
    invoice: Invoice;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSent?: () => void;
}

export function InvoiceEmailComposeModal({
    invoice,
    open,
    onOpenChange,
    onSent,
}: InvoiceEmailComposeModalProps) {
    const { user } = useAuth();

    //Form state
    const [to, setTo] = useState("");
    const [cc, setCc] = useState("");
    const [bcc, setBcc] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

    // Loading states
    const [loading, setLoading] = useState(false);
    const [generatingPDF, setGeneratingPDF] = useState(true);
    const [pdfAttachment, setPdfAttachment] = useState<{ blob: Blob; name: string } | null>(null);

    // Load initial data
    useEffect(() => {
        if (open && user) {
            loadEmailData();
        }
    }, [open, user, invoice]);

    const loadEmailData = async () => {
        if (!user) return;

        setGeneratingPDF(true);
        try {
            // Get user settings for company name
            const { settings } = await getUserInvoiceSettings(user.uid);
            const companyName = settings?.companyName || "Your Company";
            const fromName = settings?.fromName;

            // Generate email template
            const template = generateInvoiceEmailTemplate(invoice, companyName, fromName);

            // Set email fields
            setTo(invoice.clientEmail || "");
            setSubject(template.subject);
            setBody(template.body);
            setCc("");
            setBcc("");

            // Generate PDF attachment
            const pdfBlob = await getInvoicePDFBlob(invoice, user.uid);
            setPdfAttachment({
                blob: pdfBlob,
                name: `${invoice.invoiceNumber}.pdf`,
            });
        } catch (error) {
            console.error("Failed to load email data:", error);
            toast.error("Failed to prepare email");
        } finally {
            setGeneratingPDF(false);
        }
    };

    const handleSend = async () => {
        if (!to.trim()) {
            toast.error("Please enter a recipient email");
            return;
        }

        if (!pdfAttachment) {
            toast.error("PDF attachment is not ready");
            return;
        }

        setLoading(true);
        try {
            // Convert PDF blob to base64
            const reader = new FileReader();
            const pdfBase64 = await new Promise<string>((resolve, reject) => {
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    resolve(base64.split(",")[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(pdfAttachment.blob);
            });

            // Send email via API
            const response = await fetch("/api/invoices/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invoiceId: invoice.id,
                    to: to.split(",").map(e => e.trim()),
                    cc: cc ? cc.split(",").map(e => e.trim()) : undefined,
                    bcc: bcc ? bcc.split(",").map(e => e.trim()) : undefined,
                    subject,
                    body,
                    pdfBase64,
                    pdfName: pdfAttachment.name,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send email");
            }

            toast.success("Invoice email sent successfully!");
            onOpenChange(false);
            onSent?.();
        } catch (error) {
            console.error("Failed to send email:", error);
            toast.error("Failed to send email");
        } finally {
            setLoading(false);
        }
    };

    const handleAIRewrite = (newContent: string) => {
        setBody(newContent);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Send Invoice Email</DialogTitle>
                    <DialogDescription>
                        Compose and send your invoice to the client
                    </DialogDescription>
                </DialogHeader>

                {generatingPDF ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Preparing email and generating PDF...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* To Field */}
                        <div className="space-y-2">
                            <Label htmlFor="to">To *</Label>
                            <Input
                                id="to"
                                type="email"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                placeholder="client@example.com"
                                required
                            />
                            <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
                        </div>

                        {/* CC Field */}
                        <div className="space-y-2">
                            <Label htmlFor="cc">CC</Label>
                            <Input
                                id="cc"
                                type="email"
                                value={cc}
                                onChange={(e) => setCc(e.target.value)}
                                placeholder="colleague@example.com"
                            />
                        </div>

                        {/* BCC Field */}
                        <div className="space-y-2">
                            <Label htmlFor="bcc">BCC</Label>
                            <Input
                                id="bcc"
                                type="email"
                                value={bcc}
                                onChange={(e) => setBcc(e.target.value)}
                                placeholder="archive@example.com"
                            />
                        </div>

                        {/* Subject Field */}
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject *</Label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Invoice #..."
                                required
                            />
                        </div>

                        {/* Body Field with AI Assistant */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="body">Message *</Label>
                                <AIAssistant
                                    contextContent={body}
                                    onGenerate={(text) => handleAIRewrite(text)}
                                    contextType="compose"
                                />
                            </div>
                            <AITextarea
                                id="body"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Email message..."
                                rows={12}
                                className="font-mono text-sm"
                                required
                                minWords={5}
                            />
                        </div>

                        {/* PDF Attachment */}
                        {pdfAttachment && (
                            <Card className="p-3">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-8 w-8 text-red-500" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{pdfAttachment.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(pdfAttachment.blob.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <Badge variant="secondary">
                                        <Paperclip className="h-3 w-3 mr-1" />
                                        Attached
                                    </Badge>
                                </div>
                            </Card>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button onClick={handleSend} disabled={loading || !to || !subject || !body}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Invoice
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
