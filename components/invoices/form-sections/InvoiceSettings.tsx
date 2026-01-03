"use client";

import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AITextarea } from "@/components/ui/ai-textarea";

export function InvoiceSettings() {
    const form = useFormContext();
    const isRecurring = form.watch("isRecurring");

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notes & Terms (AI Enabled) */}
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <AITextarea
                                label="Customer Notes"
                                minWords={3}
                                placeholder="Thank you for your business..."
                                {...field}
                            />
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="terms"
                        render={({ field }) => (
                            <AITextarea
                                label="Terms & Conditions"
                                minWords={5}
                                placeholder="Payment due within 30 days..."
                                {...field}
                            />
                        )}
                    />
                </div>

                {/* Recurring Settings */}
                <Card className={isRecurring ? "border-primary/50 bg-primary/5 dark:bg-primary/10" : "dark:bg-slate-900/50"}>
                    <CardHeader className="pb-2 px-4 pt-4">
                        <FormField
                            control={form.control}
                            name="isRecurring"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm bg-card">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Recurring Invoice</FormLabel>
                                        <FormDescription>
                                            Enable to automatically generate on a schedule
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardHeader>
                    <CardContent>
                        {isRecurring ? (
                            <div className="space-y-4 pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="recurring.frequency"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Frequency</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value || "monthly"}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="weekly">Weekly</SelectItem>
                                                        <SelectItem value="monthly">Monthly</SelectItem>
                                                        <SelectItem value="quarterly">Quarterly</SelectItem>
                                                        <SelectItem value="yearly">Yearly</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="recurring.interval"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Interval (e.g. every 2 months)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min="1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="recurring.startDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Start Date</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="date"
                                                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                                        onChange={(e) => field.onChange(new Date(e.target.value))}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="recurring.endDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>End Date (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="date"
                                                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground py-4">
                                Enable this to automatically generate invoices on a schedule.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
