"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Settings, MoreVertical, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Calendar as CalendarType } from "@/types/calendar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CalendarDashboardPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [calendars, setCalendars] = useState<CalendarType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        loadCalendars();
    }, [user]);

    const loadCalendars = async () => {
        try {
            const response = await fetch(`/api/calendar?userId=${user?.uid}`);
            if (!response.ok) throw new Error("Failed to fetch calendars");

            const data = await response.json();
            setCalendars(data.calendars);
        } catch (error) {
            console.error("Error loading calendars:", error);
            toast.error("Failed to load calendars");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCalendar = async (calendarId: string) => {
        if (!confirm("Are you sure? This will delete all plans in this calendar.")) return;

        try {
            const response = await fetch(`/api/calendar/${calendarId}?userId=${user?.uid}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete calendar");

            toast.success("Calendar deleted");
            loadCalendars();
        } catch (error) {
            console.error("Error deleting calendar:", error);
            toast.error("Failed to delete calendar");
        }
    };

    if (loading) {
        return (
            <MarketingLayout title="Calendar" description="AI-powered planning calendar">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </MarketingLayout>
        );
    }

    return (
        <MarketingLayout
            title="My Calendars"
            description="Plan and manage your work with AI assistance"
            actions={
                <div className="flex gap-2">
                    <Button onClick={() => router.push("/marketing/calendar/new")}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Calendar
                    </Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Cards Grid */}
                <div className="lg:col-span-2">
                    {calendars.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No calendars yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Create your first calendar to start planning
                                </p>
                                <Button onClick={() => router.push("/marketing/calendar/new")}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Calendar
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {calendars.map((calendar) => (
                                <Card key={calendar.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: calendar.color }}
                                                />
                                                <CardTitle className="text-lg">{calendar.name}</CardTitle>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => router.push(`/marketing/calendar/${calendar.id}`)}
                                                    >
                                                        Open
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            router.push(`/marketing/calendar/${calendar.id}/settings`)
                                                        }
                                                    >
                                                        <Settings className="h-4 w-4 mr-2" />
                                                        Settings
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => handleDeleteCalendar(calendar.id)}
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2 text-sm">
                                            <p className="text-muted-foreground">{calendar.description}</p>
                                            <div className="flex items-center justify-between pt-2">
                                                <span className="text-muted-foreground">
                                                    {calendar.activePlansCount} active plans
                                                </span>
                                                <span className="text-xs text-muted-foreground capitalize">
                                                    {calendar.defaultView} view
                                                </span>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => router.push(`/marketing/calendar/${calendar.id}`)}
                                                >
                                                    Open
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        router.push(`/marketing/calendar/${calendar.id}/settings`)
                                                    }
                                                >
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions Sidebar */}
                <div className="lg:col-span-1">
                    <div className="space-y-4 sticky top-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.push("/marketing/calendar/new")}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create New Calendar
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.push("/marketing/calendar/templates")}
                                >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Browse Templates
                                </Button>
                            </CardContent>
                        </Card>

                        {calendars.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <p className="font-medium">Today:</p>
                                            <p className="text-muted-foreground">
                                                {calendars.reduce((sum, cal) => sum + cal.activePlansCount, 0)} plans across{" "}
                                                {calendars.length} calendars
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
