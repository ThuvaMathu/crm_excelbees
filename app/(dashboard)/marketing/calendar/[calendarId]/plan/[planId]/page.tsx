"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plan } from "@/types/calendar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Edit, Trash2, Check, ArrowLeft } from "lucide-react";
import { formatPlanDate, getPlanIcon, getPriorityColor, getStatusColor } from "@/lib/calendar/utils";
import { Checkbox } from "@/components/ui/checkbox";

export default function PlanDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const calendarId = params.calendarId as string;
    const planId = params.planId as string;

    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !planId) return;
        loadPlan();
    }, [user, planId]);

    const loadPlan = async () => {
        try {
            const response = await fetch(
                `/api/calendar/${calendarId}/plans/${planId}?userId=${user?.uid}`
            );
            if (!response.ok) throw new Error("Failed to fetch plan");

            const data = await response.json();
            setPlan(data.plan);
        } catch (error) {
            console.error("Error loading plan:", error);
            toast.error("Failed to load plan");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this plan?")) return;

        try {
            const response = await fetch(
                `/api/calendar/${calendarId}/plans/${planId}?userId=${user?.uid}`,
                { method: "DELETE" }
            );

            if (!response.ok) throw new Error("Failed to delete plan");

            toast.success("Plan deleted");
            router.push(`/marketing/calendar/${calendarId}`);
        } catch (error) {
            console.error("Error deleting plan:", error);
            toast.error("Failed to delete plan");
        }
    };

    const handleMarkComplete = async () => {
        try {
            const response = await fetch(
                `/api/calendar/${calendarId}/plans/${planId}?userId=${user?.uid}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user?.uid,
                        status: "completed",
                    }),
                }
            );

            if (!response.ok) throw new Error("Failed to update plan");

            const data = await response.json();
            setPlan(data.plan);
            toast.success("Plan marked as complete");
        } catch (error) {
            console.error("Error updating plan:", error);
            toast.error("Failed to update plan");
        }
    };

    const toggleChecklistItem = async (itemId: string) => {
        if (!plan) return;

        const updatedChecklist = plan.checklist?.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );

        try {
            const response = await fetch(
                `/api/calendar/${calendarId}/plans/${planId}?userId=${user?.uid}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user?.uid,
                        checklist: updatedChecklist,
                    }),
                }
            );

            if (!response.ok) throw new Error("Failed to update checklist");

            const data = await response.json();
            setPlan(data.plan);
        } catch (error) {
            console.error("Error updating checklist:", error);
            toast.error("Failed to update checklist");
        }
    };

    if (loading) {
        return (
            <MarketingLayout title="Plan Details">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </MarketingLayout>
        );
    }

    if (!plan) {
        return (
            <MarketingLayout title="Plan Not Found">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Plan not found</p>
                        <Button onClick={() => router.push(`/marketing/calendar/${calendarId}`)} className="mt-4">
                            Back to Calendar
                        </Button>
                    </CardContent>
                </Card>
            </MarketingLayout>
        );
    }

    const completedItems = plan.checklist?.filter((item) => item.completed).length || 0;
    const totalItems = plan.checklist?.length || 0;

    return (
        <MarketingLayout
            title={plan.title}
            description={`${getPlanIcon(plan.type)} ${plan.type.charAt(0).toUpperCase() + plan.type.slice(1)}`}
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/marketing/calendar/${calendarId}`)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Calendar
                    </Button>
                    {plan.status !== "completed" && (
                        <Button onClick={handleMarkComplete}>
                            <Check className="h-4 w-4 mr-2" />
                            Mark Complete
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">📅 Date & Time:</p>
                                <p className="font-medium">{formatPlanDate(plan.start)}</p>
                                {!plan.allDay && (
                                    <p className="text-sm text-muted-foreground">
                                        to {formatPlanDate(plan.end)}
                                    </p>
                                )}
                            </div>

                            {plan.description && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">📋 Description:</p>
                                    <p className="whitespace-pre-wrap">{plan.description}</p>
                                </div>
                            )}

                            {plan.tags.length > 0 && (
                                <div>
                                    <p className="text-sm text-muted-foreground mb-2">🏷️ Tags:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {plan.tags.map((tag) => (
                                            <span key={tag} className="px-3 py-1 bg-secondary rounded-full text-sm">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Priority:</p>
                                    <span className={`px-3 py-1 rounded-full text-sm ${getPriorityColor(plan.priority)}`}>
                                        {plan.priority.charAt(0).toUpperCase() + plan.priority.slice(1)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Status:</p>
                                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(plan.status)}`}>
                                        {plan.status.replace("_", " ").charAt(0).toUpperCase() + plan.status.slice(1).replace("_", " ")}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Checklist (for tasks) */}
                    {plan.type === "task" && plan.checklist && plan.checklist.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Checklist ({completedItems}/{totalItems} completed)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {plan.checklist.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3">
                                            <Checkbox
                                                checked={item.completed}
                                                onCheckedChange={() => toggleChecklistItem(item.id)}
                                            />
                                            <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                                                {item.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Content Details */}
                    {plan.type === "content" && plan.metadata && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Content Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {plan.metadata.contentType && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Content Type:</p>
                                        <p className="font-medium capitalize">{plan.metadata.contentType}</p>
                                    </div>
                                )}
                                {plan.metadata.platforms && plan.metadata.platforms.length > 0 && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Platforms:</p>
                                        <p className="font-medium">{plan.metadata.platforms.join(", ")}</p>
                                    </div>
                                )}
                                {plan.metadata.linkedKeyword && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Linked Keyword:</p>
                                        <p className="font-medium">{plan.metadata.linkedKeyword}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Meeting Details */}
                    {plan.type === "meeting" && plan.metadata && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Meeting Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {plan.metadata.location && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Location:</p>
                                        <p className="font-medium">{plan.metadata.location}</p>
                                    </div>
                                )}
                                {plan.metadata.attendees && plan.metadata.attendees.length > 0 && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Attendees:</p>
                                        <p className="font-medium">{plan.metadata.attendees.join(", ")}</p>
                                    </div>
                                )}
                                {plan.metadata.meetingLink && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Meeting Link:</p>
                                        <a
                                            href={plan.metadata.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline"
                                        >
                                            Join Meeting
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Activity Log */}
                    {plan.activityLog && plan.activityLog.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Activity Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {plan.activityLog.map((entry) => (
                                        <div key={entry.id} className="text-sm">
                                            <p className="font-medium">{entry.action}</p>
                                            <p className="text-muted-foreground">
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </p>
                                            {entry.details && (
                                                <p className="text-muted-foreground text-xs">{entry.details}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="space-y-4 sticky top-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {plan.status !== "completed" && (
                                    <Button variant="outline" className="w-full justify-start" onClick={handleMarkComplete}>
                                        <Check className="h-4 w-4 mr-2" />
                                        Mark Complete
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-red-600 hover:text-red-700"
                                    onClick={handleDelete}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Plan
                                </Button>
                            </CardContent>
                        </Card>

                        {plan.aiGenerated && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>AI Generated</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        This plan was generated by AI and may need review.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
