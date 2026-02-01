"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AITextarea } from "@/components/ui/ai-textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CalendarPurpose, CalendarView, CalendarVisibility, PlanType } from "@/types/calendar";

export default function NewCalendarPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        purpose: "content" as CalendarPurpose,
        description: "",
        defaultView: "monthly" as CalendarView,
        visibility: "private" as CalendarVisibility,
        color: "#2196F3",
        planTypes: ["task", "content", "meeting", "reminder", "campaign", "custom"] as PlanType[],
        startOfWeek: "monday" as "sunday" | "monday",
        workingHoursStart: "09:00",
        workingHoursEnd: "17:00",
        enableRecurring: true,
        emailReminders: true,
        inAppNotifications: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error("Calendar name is required");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/calendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user?.uid,
                    name: formData.name,
                    purpose: formData.purpose,
                    description: formData.description,
                    defaultView: formData.defaultView,
                    visibility: formData.visibility,
                    color: formData.color,
                    planTypes: formData.planTypes,
                    settings: {
                        startOfWeek: formData.startOfWeek,
                        workingHours: {
                            start: formData.workingHoursStart,
                            end: formData.workingHoursEnd,
                        },
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        enableRecurring: formData.enableRecurring,
                        defaultRecurrence: "none",
                        emailReminders: formData.emailReminders,
                        inAppNotifications: formData.inAppNotifications,
                        reminderTiming: 60,
                    },
                }),
            });

            if (!response.ok) throw new Error("Failed to create calendar");

            const data = await response.json();
            toast.success("Calendar created successfully");
            router.push(`/marketing/calendar/${data.calendar.id}`);
        } catch (error) {
            console.error("Error creating calendar:", error);
            toast.error("Failed to create calendar");
        } finally {
            setLoading(false);
        }
    };

    const togglePlanType = (type: PlanType) => {
        setFormData((prev) => ({
            ...prev,
            planTypes: prev.planTypes.includes(type)
                ? prev.planTypes.filter((t) => t !== type)
                : [...prev.planTypes, type],
        }));
    };

    const colorOptions = [
        { name: "Blue", value: "#2196F3" },
        { name: "Green", value: "#4CAF50" },
        { name: "Orange", value: "#FF9800" },
        { name: "Purple", value: "#9C27B0" },
        { name: "Red", value: "#F44336" },
        { name: "Teal", value: "#009688" },
    ];

    return (
        <MarketingLayout
            title="Create New Calendar"
            description="Set up a new calendar for your planning needs"
        >
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Calendar Name *</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Q1 Content Calendar"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        maxLength={50}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="purpose">Purpose</Label>
                                    <Select
                                        value={formData.purpose}
                                        onValueChange={(value: CalendarPurpose) =>
                                            setFormData({ ...formData, purpose: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="personal">Personal Planning</SelectItem>
                                            <SelectItem value="team">Team Planning</SelectItem>
                                            <SelectItem value="content">Content Calendar</SelectItem>
                                            <SelectItem value="campaign">Campaign Calendar</SelectItem>
                                            <SelectItem value="business">Business Operations</SelectItem>
                                            <SelectItem value="project">Project Management</SelectItem>
                                            <SelectItem value="custom">Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <AITextarea
                                        id="description"
                                        placeholder="Brief description of calendar purpose"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        maxLength={200}
                                        minWords={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Default View</Label>
                                    <RadioGroup
                                        value={formData.defaultView}
                                        onValueChange={(value: CalendarView) =>
                                            setFormData({ ...formData, defaultView: value })
                                        }
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="daily" id="daily" />
                                            <Label htmlFor="daily" className="font-normal">
                                                Daily View
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="weekly" id="weekly" />
                                            <Label htmlFor="weekly" className="font-normal">
                                                Weekly View
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="monthly" id="monthly" />
                                            <Label htmlFor="monthly" className="font-normal">
                                                Monthly View
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="agenda" id="agenda" />
                                            <Label htmlFor="agenda" className="font-normal">
                                                Agenda / List View
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="space-y-2">
                                    <Label>Visibility</Label>
                                    <RadioGroup
                                        value={formData.visibility}
                                        onValueChange={(value: CalendarVisibility) =>
                                            setFormData({ ...formData, visibility: value })
                                        }
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="private" id="private" />
                                            <Label htmlFor="private" className="font-normal">
                                                Private (Only you)
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="team" id="team" />
                                            <Label htmlFor="team" className="font-normal">
                                                Team (Your team members)
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="organization" id="organization" />
                                            <Label htmlFor="organization" className="font-normal">
                                                Organization (Everyone in org)
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="space-y-2">
                                    <Label>Calendar Color</Label>
                                    <div className="flex gap-2">
                                        {colorOptions.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                className={`w-10 h-10 rounded-full border-2 ${formData.color === color.value ? "border-primary" : "border-transparent"
                                                    }`}
                                                style={{ backgroundColor: color.value }}
                                                onClick={() => setFormData({ ...formData, color: color.value })}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Plan Types */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Plan Types Allowed</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {[
                                    { value: "task", label: "Tasks (To-dos, action items)" },
                                    { value: "content", label: "Content Plans (Blogs, social posts, etc.)" },
                                    { value: "meeting", label: "Meetings (Scheduled meetings)" },
                                    { value: "reminder", label: "Reminders (Notifications, deadlines)" },
                                    { value: "campaign", label: "Campaign Items (Marketing campaigns)" },
                                    { value: "custom", label: "Custom Events (User-defined)" },
                                ].map((type) => (
                                    <div key={type.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={type.value}
                                            checked={formData.planTypes.includes(type.value as PlanType)}
                                            onCheckedChange={() => togglePlanType(type.value as PlanType)}
                                        />
                                        <Label htmlFor={type.value} className="font-normal">
                                            {type.label}
                                        </Label>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Advanced Options */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Advanced Options</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="workingHoursStart">Working Hours Start</Label>
                                        <Input
                                            id="workingHoursStart"
                                            type="time"
                                            value={formData.workingHoursStart}
                                            onChange={(e) =>
                                                setFormData({ ...formData, workingHoursStart: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="workingHoursEnd">Working Hours End</Label>
                                        <Input
                                            id="workingHoursEnd"
                                            type="time"
                                            value={formData.workingHoursEnd}
                                            onChange={(e) =>
                                                setFormData({ ...formData, workingHoursEnd: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="enableRecurring"
                                            checked={formData.enableRecurring}
                                            onCheckedChange={(checked) =>
                                                setFormData({ ...formData, enableRecurring: checked as boolean })
                                            }
                                        />
                                        <Label htmlFor="enableRecurring" className="font-normal">
                                            Enable recurring plans
                                        </Label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="emailReminders"
                                            checked={formData.emailReminders}
                                            onCheckedChange={(checked) =>
                                                setFormData({ ...formData, emailReminders: checked as boolean })
                                            }
                                        />
                                        <Label htmlFor="emailReminders" className="font-normal">
                                            Email reminders
                                        </Label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="inAppNotifications"
                                            checked={formData.inAppNotifications}
                                            onCheckedChange={(checked) =>
                                                setFormData({ ...formData, inAppNotifications: checked as boolean })
                                            }
                                        />
                                        <Label htmlFor="inAppNotifications" className="font-normal">
                                            In-app notifications
                                        </Label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Summary Panel */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Calendar Preview</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Name:</p>
                                        <p className="font-medium">{formData.name || "Untitled Calendar"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Purpose:</p>
                                        <p className="font-medium capitalize">{formData.purpose}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Default View:</p>
                                        <p className="font-medium capitalize">{formData.defaultView}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Visibility:</p>
                                        <p className="font-medium capitalize">{formData.visibility}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Plan Types:</p>
                                        <p className="font-medium">{formData.planTypes.length} types enabled</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Notifications:</p>
                                        <p className="font-medium">
                                            {formData.emailReminders || formData.inAppNotifications
                                                ? "Enabled"
                                                : "Disabled"}
                                        </p>
                                    </div>

                                    <div className="pt-4 space-y-2">
                                        <Button type="submit" className="w-full" disabled={loading}>
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                "Create Calendar"
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => router.back()}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </form>
        </MarketingLayout>
    );
}
