"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Sparkles, Calendar, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Plan } from "@/types/calendar";
import { formatPlanDate, getPlanIcon } from "@/lib/calendar/utils";

interface AIAssistantProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    calendarId: string;
    userId: string;
    onPlansGenerated: (plans: Plan[]) => void;
}

type Step = "start" | "timeRange" | "configure" | "generating" | "review";

export function AIAssistant({
    open,
    onOpenChange,
    calendarId,
    userId,
    onPlansGenerated,
}: AIAssistantProps) {
    const [step, setStep] = useState<Step>("start");
    const [loading, setLoading] = useState(false);

    // Form data
    const [timeRange, setTimeRange] = useState({
        start: "",
        end: "",
    });
    const [purpose, setPurpose] = useState<"content" | "business" | "campaign" | "productivity" | "mixed">("content");
    const [frequency, setFrequency] = useState<"daily" | "weekdays" | "3x_week" | "2x_week">("weekdays");
    const [distribution, setDistribution] = useState({
        tasks: 40,
        content: 30,
        meetings: 20,
        other: 10,
    });
    const [businessContext, setBusinessContext] = useState({
        industry: "",
        goal: "growth" as "growth" | "consistency" | "launch" | "efficiency",
    });

    const [generatedPlans, setGeneratedPlans] = useState<Plan[]>([]);

    const handleQuickStart = (template: "30day" | "weekly" | "launch") => {
        const today = new Date();
        const start = today.toISOString().split("T")[0];

        let end: Date;
        let freq: typeof frequency;
        let purp: typeof purpose;

        switch (template) {
            case "30day":
                end = new Date(today);
                end.setDate(end.getDate() + 30);
                freq = "3x_week";
                purp = "content";
                break;
            case "weekly":
                end = new Date(today);
                end.setDate(end.getDate() + 7);
                freq = "weekdays";
                purp = "business";
                break;
            case "launch":
                end = new Date(today);
                end.setDate(end.getDate() + 60);
                freq = "daily";
                purp = "campaign";
                break;
        }

        setTimeRange({
            start,
            end: end.toISOString().split("T")[0],
        });
        setFrequency(freq);
        setPurpose(purp);
        setStep("configure");
    };

    const handleGenerate = async () => {
        if (!timeRange.start || !timeRange.end) {
            toast.error("Please select a time range");
            return;
        }

        setStep("generating");
        setLoading(true);

        try {
            const response = await fetch("/api/calendar/ai-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    calendarId,
                    userId,
                    timeRange: {
                        start: new Date(timeRange.start),
                        end: new Date(timeRange.end),
                    },
                    purpose,
                    frequency,
                    distribution,
                    businessContext: businessContext.industry
                        ? businessContext
                        : undefined,
                }),
            });

            if (!response.ok) throw new Error("Failed to generate plans");

            const data = await response.json();
            setGeneratedPlans(data.plans);
            setStep("review");
            toast.success(`Generated ${data.plans.length} plans`);
        } catch (error) {
            console.error("Error generating plans:", error);
            toast.error("Failed to generate plans");
            setStep("configure");
        } finally {
            setLoading(false);
        }
    };

    const handleApplyPlans = async () => {
        setLoading(true);

        try {
            // Create all plans
            const promises = generatedPlans.map((plan) =>
                fetch(`/api/calendar/${calendarId}/plans`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId,
                        ...plan,
                    }),
                })
            );

            await Promise.all(promises);

            toast.success(`${generatedPlans.length} plans added to calendar`);
            onPlansGenerated(generatedPlans);
            handleClose();
        } catch (error) {
            console.error("Error applying plans:", error);
            toast.error("Failed to apply plans");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep("start");
        setGeneratedPlans([]);
        onOpenChange(false);
    };

    const updateDistribution = (key: keyof typeof distribution, value: number) => {
        const newDist = { ...distribution, [key]: value };
        const total = Object.values(newDist).reduce((sum, val) => sum + val, 0);

        if (total <= 100) {
            setDistribution(newDist);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Planning Assistant
                    </DialogTitle>
                </DialogHeader>

                {/* Step 1: Start */}
                {step === "start" && (
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            Let AI help you create a comprehensive plan for your calendar.
                        </p>

                        <div className="space-y-3">
                            <h3 className="font-semibold">Quick Start Templates</h3>

                            <Card className="cursor-pointer hover:border-primary" onClick={() => handleQuickStart("30day")}>
                                <CardContent className="p-4">
                                    <h4 className="font-medium">📅 30-Day Content Calendar</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Perfect for consistent content creation. 3x per week.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="cursor-pointer hover:border-primary" onClick={() => handleQuickStart("weekly")}>
                                <CardContent className="p-4">
                                    <h4 className="font-medium">💼 Weekly Business Operations</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Standard weekly tasks and meetings. Weekdays only.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="cursor-pointer hover:border-primary" onClick={() => handleQuickStart("launch")}>
                                <CardContent className="p-4">
                                    <h4 className="font-medium">🎯 Product Launch Campaign</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Complete 60-day campaign calendar. Daily activities.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="pt-4 border-t">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setStep("timeRange")}
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Custom Plan Builder
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Time Range */}
                {step === "timeRange" && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">Select Time Range</h3>
                            <p className="text-sm text-muted-foreground">
                                Choose the period for your plan
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={timeRange.start}
                                    onChange={(e) => setTimeRange({ ...timeRange, start: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={timeRange.end}
                                    onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })}
                                />
                            </div>
                        </div>

                        {timeRange.start && timeRange.end && (
                            <p className="text-sm text-muted-foreground">
                                Duration: {Math.ceil((new Date(timeRange.end).getTime() - new Date(timeRange.start).getTime()) / (1000 * 60 * 60 * 24))} days
                            </p>
                        )}

                        <div className="flex gap-2 pt-4">
                            <Button variant="outline" onClick={() => setStep("start")}>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={() => setStep("configure")}
                                disabled={!timeRange.start || !timeRange.end}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 3: Configure */}
                {step === "configure" && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">Configure Your Plan</h3>
                            <p className="text-sm text-muted-foreground">
                                Customize the plan to fit your needs
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="purpose">Purpose</Label>
                            <Select value={purpose} onValueChange={(v: any) => setPurpose(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="content">Content Creation</SelectItem>
                                    <SelectItem value="business">Business Operations</SelectItem>
                                    <SelectItem value="campaign">Marketing Campaign</SelectItem>
                                    <SelectItem value="productivity">Productivity & Tasks</SelectItem>
                                    <SelectItem value="mixed">Mixed Activities</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="frequency">Frequency</Label>
                            <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Every Day</SelectItem>
                                    <SelectItem value="weekdays">Weekdays Only</SelectItem>
                                    <SelectItem value="3x_week">3 Times per Week</SelectItem>
                                    <SelectItem value="2x_week">2 Times per Week</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label>Plan Distribution (%)</Label>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Tasks: {distribution.tasks}%</span>
                                    <Slider
                                        value={[distribution.tasks]}
                                        onValueChange={([v]) => updateDistribution("tasks", v)}
                                        max={100}
                                        step={5}
                                        className="w-2/3"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Content: {distribution.content}%</span>
                                    <Slider
                                        value={[distribution.content]}
                                        onValueChange={([v]) => updateDistribution("content", v)}
                                        max={100}
                                        step={5}
                                        className="w-2/3"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Meetings: {distribution.meetings}%</span>
                                    <Slider
                                        value={[distribution.meetings]}
                                        onValueChange={([v]) => updateDistribution("meetings", v)}
                                        max={100}
                                        step={5}
                                        className="w-2/3"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Other: {distribution.other}%</span>
                                    <Slider
                                        value={[distribution.other]}
                                        onValueChange={([v]) => updateDistribution("other", v)}
                                        max={100}
                                        step={5}
                                        className="w-2/3"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Total: {Object.values(distribution).reduce((sum, val) => sum + val, 0)}%
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry (Optional)</Label>
                            <Input
                                id="industry"
                                placeholder="e.g., Technology, Marketing, E-commerce"
                                value={businessContext.industry}
                                onChange={(e) => setBusinessContext({ ...businessContext, industry: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button variant="outline" onClick={() => setStep("timeRange")}>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <Button className="flex-1" onClick={handleGenerate}>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate Plans
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Generating */}
                {step === "generating" && (
                    <div className="py-12 text-center space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                        <div>
                            <h3 className="font-semibold">Generating Your Plans...</h3>
                            <p className="text-sm text-muted-foreground">
                                AI is creating a customized plan for you
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 5: Review */}
                {step === "review" && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">Review Generated Plans</h3>
                            <p className="text-sm text-muted-foreground">
                                {generatedPlans.length} plans created. Review and apply to your calendar.
                            </p>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto space-y-2">
                            {generatedPlans.map((plan, index) => (
                                <Card key={index}>
                                    <CardContent className="p-3">
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl">{getPlanIcon(plan.type)}</div>
                                            <div className="flex-1">
                                                <h4 className="font-medium">{plan.title}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {formatPlanDate(plan.start, false)}
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
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full ${plan.priority === "high"
                                                    ? "bg-red-100 text-red-700"
                                                    : plan.priority === "medium"
                                                        ? "bg-yellow-100 text-yellow-700"
                                                        : "bg-green-100 text-green-700"
                                                    }`}
                                            >
                                                {plan.priority}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button variant="outline" onClick={() => setStep("configure")}>
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Regenerate
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleApplyPlans}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Applying...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Apply to Calendar
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
