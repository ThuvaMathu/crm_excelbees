"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { seedDefaultTemplates } from "@/lib/firestore/email-templates";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function SeedTemplatesPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [seeded, setSeeded] = useState(false);

    const handleSeed = async () => {
        if (!user) {
            toast.error("You must be logged in");
            return;
        }

        setLoading(true);
        try {
            await seedDefaultTemplates(user.uid);
            toast.success("Templates seeded successfully!");
            setSeeded(true);
        } catch (error: any) {
            toast.error(error.message || "Failed to seed templates");
        }
        setLoading(false);
    };

    return (
        <div className="container max-w-2xl py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Seed Email Templates</CardTitle>
                    <CardDescription>
                        Create default email templates for your CRM
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        This will create 5 default email templates:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Invoice Email - For sending invoices to clients</li>
                        <li>Quote Email - For sending quotes to prospects</li>
                        <li>Follow-up Email - For following up on deals</li>
                        <li>Payment Reminder - For reminding clients about payments</li>
                        <li>General Email - A blank template for any purpose</li>
                    </ul>

                    {seeded && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-md">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-sm font-medium">
                                Templates seeded successfully! You can now use them in the email compose modal.
                            </span>
                        </div>
                    )}

                    <Button
                        onClick={handleSeed}
                        disabled={loading || seeded}
                        className="w-full"
                    >
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {seeded ? "Templates Already Seeded" : "Seed Templates"}
                    </Button>

                    <p className="text-xs text-muted-foreground">
                        Note: This only needs to be run once. Running it multiple times will create duplicate templates.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
