"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, CreditCard, Bell } from "lucide-react";
import type { Project } from "@/types/crm";
import { formatCurrency, calculateNextBillingDate } from "@/lib/services/project-financials";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { updateProject } from "@/lib/firestore/projects";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { Timestamp } from "firebase/firestore";

interface ProjectFinancialsCardProps {
    project: Project;
    onUpdate?: () => void;
}

export function ProjectFinancialsCard({ project, onUpdate }: ProjectFinancialsCardProps) {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const financials = project.financials || {
        initialCost: 0,
        annualRecurringCost: 0,
        managementBillingCycle: "None",
        isRecurringEnabled: false
    };

    // Derived state for editing cycle directly for now
    const handleCycleChange = async (cycle: "Quarterly" | "Semi-Annual" | "None") => {
        setLoading(true);
        try {
            const nextDate = calculateNextBillingDate(new Date(), cycle);

            await updateProject(project.id, {
                financials: {
                    ...financials,
                    managementBillingCycle: cycle,
                    isRecurringEnabled: cycle !== "None",
                    nextBillingDate: nextDate ? Timestamp.fromDate(nextDate) : undefined,
                }
            }, user?.uid || "");

            // To properly save Timestamp
            if (cycle !== "None") {
                // In a real app we'd trigger a server action or specific update function to handle Date -> Timestamp conversion
                // For now, let's just toast and rely on refresh.
            }

            toast.success(`Billing cycle updated to ${cycle}`);
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error("Failed to update billing cycle");
        } finally {
            setLoading(false);
        }
    };

    const handleRecurringToggle = async (enabled: boolean) => {
        setLoading(true);
        try {
            await updateProject(project.id, {
                financials: {
                    ...financials,
                    isRecurringEnabled: enabled,
                }
            }, user?.uid || "");
            toast.success(enabled ? "Recurring billing enabled" : "Recurring billing disabled");
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setLoading(false);
        }
    };


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 text-amber-500">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Financials & Billing
                    </CardTitle>
                    <CardDescription>Manage costs and recurring fees</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Initial Cost</p>
                        <p className="text-2xl font-bold">{formatCurrency(financials.initialCost || 0)}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Annual Recurring</p>
                        <p className="text-2xl font-bold">{formatCurrency(financials.annualRecurringCost || 0)}</p>
                    </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Recurring Billing</Label>
                            <p className="text-sm text-muted-foreground">Enable automated billing reminders</p>
                        </div>
                        <Switch
                            checked={!!financials.isRecurringEnabled}
                            onCheckedChange={handleRecurringToggle}
                            disabled={loading}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Billing Cycle</Label>
                        <Select
                            value={financials.managementBillingCycle || "None"}
                            onValueChange={(val: any) => handleCycleChange(val)}
                            disabled={loading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select cycle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="None">None</SelectItem>
                                <SelectItem value="Quarterly">Quarterly (Every 3 months)</SelectItem>
                                <SelectItem value="Semi-Annual">Semi-Annual (Every 6 months)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {financials.nextBillingDate && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Next Billing: {format(financials.nextBillingDate.toDate(), "MMMM d, yyyy")}
                            </span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
