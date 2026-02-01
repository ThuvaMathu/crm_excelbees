"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarType, Plan } from "@/types/calendar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Plus, Settings, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { formatPlanDate, getPlanIcon } from "@/lib/calendar/utils";
import { AIAssistant } from "@/components/calendar/AIAssistant";
import { CalendarDayView } from "@/components/calendar/views/CalendarDayView";
import { CalendarWeekView } from "@/components/calendar/views/CalendarWeekView";

export default function CalendarViewPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const calendarId = params.calendarId as string;

    const [calendar, setCalendar] = useState<CalendarType | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<"monthly" | "weekly" | "daily" | "agenda">("monthly");
    const [showAIAssistant, setShowAIAssistant] = useState(false);

    useEffect(() => {
        if (!user || !calendarId) return;
        loadCalendar();
        loadPlans();
    }, [user, calendarId]);

    const loadCalendar = async () => {
        try {
            const response = await fetch(`/api/calendar/${calendarId}?userId=${user?.uid}`);
            if (!response.ok) throw new Error("Failed to fetch calendar");

            const data = await response.json();
            setCalendar(data.calendar);
            setView(data.calendar.defaultView || "monthly");
        } catch (error) {
            console.error("Error loading calendar:", error);
            toast.error("Failed to load calendar");
        }
    };

    const loadPlans = async () => {
        try {
            const response = await fetch(
                `/api/calendar/${calendarId}/plans?userId=${user?.uid}`
            );
            if (!response.ok) throw new Error("Failed to fetch plans");

            const data = await response.json();
            setPlans(data.plans);
        } catch (error) {
            console.error("Error loading plans:", error);
            toast.error("Failed to load plans");
        } finally {
            setLoading(false);
        }
    };

    const navigateMonth = (direction: "prev" | "next") => {
        const newDate = new Date(currentDate);

        switch (view) {
            case "monthly":
            default:
                if (direction === "prev") {
                    newDate.setMonth(newDate.getMonth() - 1);
                } else {
                    newDate.setMonth(newDate.getMonth() + 1);
                }
                break;
            case "weekly":
                if (direction === "prev") {
                    newDate.setDate(newDate.getDate() - 7);
                } else {
                    newDate.setDate(newDate.getDate() + 7);
                }
                break;
            case "daily":
                if (direction === "prev") {
                    newDate.setDate(newDate.getDate() - 1);
                } else {
                    newDate.setDate(newDate.getDate() + 1);
                }
                break;
        }

        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Get days in current month
    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days in month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    // Get plans for a specific date
    const getPlansForDate = (date: Date | null) => {
        if (!date) return [];
        return plans.filter((plan) => {
            const planDate = new Date(plan.start);
            return (
                planDate.getDate() === date.getDate() &&
                planDate.getMonth() === date.getMonth() &&
                planDate.getFullYear() === date.getFullYear()
            );
        });
    };

    if (loading) {
        return (
            <MarketingLayout title="Calendar">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </MarketingLayout>
        );
    }

    if (!calendar) {
        return (
            <MarketingLayout title="Calendar Not Found">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Calendar not found</p>
                        <Button onClick={() => router.push("/marketing/calendar")} className="mt-4">
                            Back to Calendars
                        </Button>
                    </CardContent>
                </Card>
            </MarketingLayout>
        );
    }

    const getDateLabel = () => {
        if (view === "daily") {
            return currentDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
            });
        }
        if (view === "weekly") {
            const start = new Date(currentDate);
            start.setDate(start.getDate() - start.getDay());
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
        }
        // Monthly
        return currentDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });
    };

    return (
        <MarketingLayout
            title={calendar.name}
            description={calendar.description}
            actions={
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowAIAssistant(true)}
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Assistant
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/marketing/calendar/${calendarId}/settings`)}
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                    </Button>
                    <Button onClick={() => router.push(`/marketing/calendar/${calendarId}/plan/new`)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Plan
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                {/* Navigation Bar */}
                <Card>
                    <CardContent className="py-4">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={goToToday}>
                                    Today
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <h2 className="text-lg font-semibold ml-4 min-w-[200px]">{getDateLabel()}</h2>
                            </div>

                            <div className="flex p-1 bg-muted rounded-lg">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`rounded-md ${view === "monthly" ? "bg-background shadow-sm" : ""}`}
                                    onClick={() => setView("monthly")}
                                >
                                    Month
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`rounded-md ${view === "weekly" ? "bg-background shadow-sm" : ""}`}
                                    onClick={() => setView("weekly")}
                                >
                                    Week
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`rounded-md ${view === "daily" ? "bg-background shadow-sm" : ""}`}
                                    onClick={() => setView("daily")}
                                >
                                    Day
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`rounded-md ${view === "agenda" ? "bg-background shadow-sm" : ""}`}
                                    onClick={() => setView("agenda")}
                                >
                                    Agenda
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Calendar Views */}
                {view === "monthly" && (
                    <Card>
                        <CardContent className="p-4">
                            <div className="grid grid-cols-7 gap-2">
                                {/* Day headers */}
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                    <div
                                        key={day}
                                        className="text-center text-sm font-semibold text-muted-foreground py-2"
                                    >
                                        {day}
                                    </div>
                                ))}

                                {/* Calendar days */}
                                {getDaysInMonth().map((date, index) => {
                                    const dayPlans = getPlansForDate(date);
                                    const isToday =
                                        date &&
                                        date.toDateString() === new Date().toDateString();

                                    return (
                                        <div
                                            key={index}
                                            className={`min-h-[100px] border rounded-lg p-2 ${date ? "bg-background hover:bg-accent/5 cursor-pointer" : "bg-muted"
                                                } ${isToday ? "border-primary border-2" : ""}`}
                                            onClick={() => {
                                                if (date) {
                                                    // Set current date when clicking
                                                    setCurrentDate(date);
                                                    setView("daily");
                                                }
                                            }}
                                        >
                                            {date && (
                                                <>
                                                    <div className="text-sm font-medium mb-1">{date.getDate()}</div>
                                                    <div className="space-y-1">
                                                        {dayPlans.slice(0, 3).map((plan) => (
                                                            <div
                                                                key={plan.id}
                                                                className="text-xs p-1 rounded bg-primary/10 text-primary truncate"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(
                                                                        `/marketing/calendar/${calendarId}/plan/${plan.id}`
                                                                    );
                                                                }}
                                                            >
                                                                {getPlanIcon(plan.type)} {plan.title}
                                                            </div>
                                                        ))}
                                                        {dayPlans.length > 3 && (
                                                            <div className="text-xs text-muted-foreground">
                                                                +{dayPlans.length - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {view === "weekly" && (
                    <CalendarWeekView
                        date={currentDate}
                        plans={plans}
                        calendarId={calendarId}
                    />
                )}

                {view === "daily" && (
                    <CalendarDayView
                        date={currentDate}
                        plans={plans}
                        calendarId={calendarId}
                    />
                )}

                {/* Agenda View */}
                {view === "agenda" && (
                    <Card>
                        <CardContent className="p-4">
                            {plans.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No plans scheduled
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {plans.map((plan) => (
                                        <div
                                            key={plan.id}
                                            className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                                            onClick={() =>
                                                router.push(`/marketing/calendar/${calendarId}/plan/${plan.id}`)
                                            }
                                        >
                                            <div className="text-2xl">{getPlanIcon(plan.type)}</div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{plan.title}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatPlanDate(plan.start)}
                                                </p>
                                                {plan.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {plan.description}
                                                    </p>
                                                )}
                                                <div className="flex gap-2 mt-2">
                                                    {plan.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="text-xs px-2 py-1 rounded-full bg-secondary"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-sm">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs ${plan.priority === "high"
                                                        ? "bg-red-100 text-red-700"
                                                        : plan.priority === "medium"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : "bg-green-100 text-green-700"
                                                        }`}
                                                >
                                                    {plan.priority}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* AI Assistant Modal */}
            <AIAssistant
                open={showAIAssistant}
                onOpenChange={setShowAIAssistant}
                calendarId={calendarId}
                userId={user?.uid || ""}
                onPlansGenerated={(newPlans) => {
                    setPlans([...plans, ...newPlans]);
                }}
            />
        </MarketingLayout>
    );
}
