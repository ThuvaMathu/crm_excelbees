"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PlanType, Priority, PlanStatus } from "@/types/calendar";
import { AITextarea } from "@/components/ui/ai-textarea";

export default function NewPlanPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const calendarId = params.calendarId as string;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "task" as PlanType,
        startDate: "",
        startTime: "09:00",
        endDate: "",
        endTime: "10:00",
        allDay: false,
        priority: "medium" as Priority,
        status: "planned" as PlanStatus,
        tags: [] as string[],
        tagInput: "",
        // Task-specific
        checklist: [] as { text: string; completed: boolean }[],
        checklistInput: "",
        // Content-specific
        contentType: "blog" as "blog" | "social" | "email" | "video" | "other",
        platforms: [] as string[],
        // Meeting-specific
        location: "",
        attendees: "",
        meetingLink: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.startDate || !formData.endDate) {
            toast.error("Title and dates are required");
            return;
        }

        setLoading(true);

        try {
            // Combine date and time
            const start = new Date(`${formData.startDate}T${formData.startTime}`);
            const end = new Date(`${formData.endDate}T${formData.endTime}`);

            const metadata: any = {};
            if (formData.type === "content") {
                metadata.contentType = formData.contentType;
                metadata.platforms = formData.platforms;
            } else if (formData.type === "meeting") {
                metadata.location = formData.location;
                metadata.attendees = formData.attendees.split(",").map((a) => a.trim());
                metadata.meetingLink = formData.meetingLink;
            }

            const response = await fetch(`/api/calendar/${calendarId}/plans`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user?.uid,
                    title: formData.title,
                    description: formData.description,
                    type: formData.type,
                    start: start.toISOString(),
                    end: end.toISOString(),
                    allDay: formData.allDay,
                    priority: formData.priority,
                    status: formData.status,
                    tags: formData.tags,
                    checklist: formData.checklist.map((item, index) => ({
                        id: `item_${index}`,
                        text: item.text,
                        completed: item.completed,
                        createdAt: new Date(),
                    })),
                    metadata,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || "Failed to create plan");
            }

            const data = await response.json();
            toast.success("Plan created successfully");
            router.push(`/marketing/calendar/${calendarId}/plan/${data.plan.id}`);
        } catch (error) {
            console.error("Error creating plan:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create plan");
        } finally {
            setLoading(false);
        }
    };

    const addTag = () => {
        if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...formData.tags, formData.tagInput.trim()],
                tagInput: "",
            });
        }
    };

    const removeTag = (tag: string) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter((t) => t !== tag),
        });
    };

    const addChecklistItem = () => {
        if (formData.checklistInput.trim()) {
            setFormData({
                ...formData,
                checklist: [...formData.checklist, { text: formData.checklistInput.trim(), completed: false }],
                checklistInput: "",
            });
        }
    };

    const removeChecklistItem = (index: number) => {
        setFormData({
            ...formData,
            checklist: formData.checklist.filter((_, i) => i !== index),
        });
    };

    return (
        <MarketingLayout title="Create New Plan" description="Add a new plan to your calendar">
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Plan Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Plan Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value: PlanType) => setFormData({ ...formData, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="task">📝 Task</SelectItem>
                                            <SelectItem value="content">📄 Content</SelectItem>
                                            <SelectItem value="meeting">💼 Meeting</SelectItem>
                                            <SelectItem value="reminder">🔔 Reminder</SelectItem>
                                            <SelectItem value="campaign">🎯 Campaign</SelectItem>
                                            <SelectItem value="custom">⚙️ Custom</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g., Write blog post on AI trends"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        maxLength={100}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <AITextarea
                                        id="description"
                                        placeholder="Additional details about this plan"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                        minWords={3}
                                    />

                                </div>
                            </CardContent>
                        </Card>

                        {/* Date & Time */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Schedule</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="allDay"
                                        checked={formData.allDay}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, allDay: checked as boolean })
                                        }
                                    />
                                    <Label htmlFor="allDay" className="font-normal">
                                        All day event
                                    </Label>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Start Date *</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    {!formData.allDay && (
                                        <div className="space-y-2">
                                            <Label htmlFor="startTime">Start Time</Label>
                                            <Input
                                                id="startTime"
                                                type="time"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">End Date *</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    {!formData.allDay && (
                                        <div className="space-y-2">
                                            <Label htmlFor="endTime">End Time</Label>
                                            <Input
                                                id="endTime"
                                                type="time"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Priority & Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Priority & Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="priority">Priority</Label>
                                        <Select
                                            value={formData.priority}
                                            onValueChange={(value: Priority) =>
                                                setFormData({ ...formData, priority: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="urgent">Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value: PlanStatus) =>
                                                setFormData({ ...formData, status: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="planned">Planned</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="skipped">Skipped</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tags */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tags</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add tag (e.g., #blog, #urgent)"
                                        value={formData.tagInput}
                                        onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addTag();
                                            }
                                        }}
                                    />
                                    <Button type="button" onClick={addTag}>
                                        Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-3 py-1 bg-secondary rounded-full text-sm flex items-center gap-2"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Type-Specific Fields */}
                        {formData.type === "task" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Checklist</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add checklist item"
                                            value={formData.checklistInput}
                                            onChange={(e) =>
                                                setFormData({ ...formData, checklistInput: e.target.value })
                                            }
                                            onKeyPress={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addChecklistItem();
                                                }
                                            }}
                                        />
                                        <Button type="button" onClick={addChecklistItem}>
                                            Add
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {formData.checklist.map((item, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Checkbox checked={item.completed} disabled />
                                                <span className="flex-1">{item.text}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeChecklistItem(index)}
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {formData.type === "content" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Content Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="contentType">Content Type</Label>
                                        <Select
                                            value={formData.contentType}
                                            onValueChange={(value: any) =>
                                                setFormData({ ...formData, contentType: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="blog">Blog Post</SelectItem>
                                                <SelectItem value="social">Social Media</SelectItem>
                                                <SelectItem value="email">Email</SelectItem>
                                                <SelectItem value="video">Video</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {formData.type === "meeting" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Meeting Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="location">Location</Label>
                                        <Input
                                            id="location"
                                            placeholder="e.g., Conference Room A or Zoom"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="attendees">Attendees (comma-separated)</Label>
                                        <Input
                                            id="attendees"
                                            placeholder="e.g., john@example.com, jane@example.com"
                                            value={formData.attendees}
                                            onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="meetingLink">Meeting Link</Label>
                                        <Input
                                            id="meetingLink"
                                            type="url"
                                            placeholder="https://zoom.us/j/..."
                                            value={formData.meetingLink}
                                            onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Summary Panel */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Plan Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Type:</p>
                                        <p className="font-medium capitalize">{formData.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Title:</p>
                                        <p className="font-medium">{formData.title || "Untitled"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Priority:</p>
                                        <p className="font-medium capitalize">{formData.priority}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Status:</p>
                                        <p className="font-medium capitalize">{formData.status.replace("_", " ")}</p>
                                    </div>
                                    {formData.tags.length > 0 && (
                                        <div>
                                            <p className="text-muted-foreground">Tags:</p>
                                            <p className="font-medium">{formData.tags.length} tags</p>
                                        </div>
                                    )}

                                    <div className="pt-4 space-y-2">
                                        <Button type="submit" className="w-full" disabled={loading}>
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                "Create Plan"
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
