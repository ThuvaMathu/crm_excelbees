"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Save, Download, Trash2, Archive } from "lucide-react";
import { Calendar as CalendarType, CalendarView, CalendarVisibility } from "@/types/calendar";

export default function CalendarSettingsPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const calendarId = params.calendarId as string;

    const [calendar, setCalendar] = useState<CalendarType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        defaultView: "monthly" as CalendarView,
        visibility: "private" as CalendarVisibility,
        color: "#2196F3",
        startOfWeek: "monday" as "sunday" | "monday",
        workingHoursStart: "09:00",
        workingHoursEnd: "17:00",
        enableRecurring: true,
        emailReminders: true,
        inAppNotifications: true,
    });

    // PDF export color theme
    const [pdfTheme, setPdfTheme] = useState({
        primary: "#2196F3",
        secondary: "#64B5F6",
        accent: "#1976D2",
        background: "#FFFFFF",
        text: "#000000",
    });

    useEffect(() => {
        if (!user || !calendarId) return;
        loadCalendar();
    }, [user, calendarId]);

    const loadCalendar = async () => {
        try {
            const response = await fetch(`/api/calendar/${calendarId}?userId=${user?.uid}`);
            if (!response.ok) throw new Error("Failed to fetch calendar");

            const data = await response.json();
            setCalendar(data.calendar);

            // Populate form
            setFormData({
                name: data.calendar.name,
                description: data.calendar.description || "",
                defaultView: data.calendar.defaultView,
                visibility: data.calendar.visibility,
                color: data.calendar.color,
                startOfWeek: data.calendar.settings.startOfWeek,
                workingHoursStart: data.calendar.settings.workingHours.start,
                workingHoursEnd: data.calendar.settings.workingHours.end,
                enableRecurring: data.calendar.settings.enableRecurring,
                emailReminders: data.calendar.settings.emailReminders,
                inAppNotifications: data.calendar.settings.inAppNotifications,
            });

            setPdfTheme({
                primary: data.calendar.color,
                secondary: data.calendar.color,
                accent: data.calendar.color,
                background: "#FFFFFF",
                text: "#000000",
            });
        } catch (error) {
            console.error("Error loading calendar:", error);
            toast.error("Failed to load calendar");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);

        try {
            const response = await fetch(`/api/calendar/${calendarId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user?.uid,
                    name: formData.name,
                    description: formData.description,
                    defaultView: formData.defaultView,
                    visibility: formData.visibility,
                    color: formData.color,
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

            if (!response.ok) throw new Error("Failed to update calendar");

            toast.success("Settings saved");
            loadCalendar();
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleExport = async (format: "ics" | "csv" | "json" | "pdf") => {
        setExporting(true);

        try {
            const response = await fetch("/api/calendar/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    format,
                    calendarId,
                    userId: user?.uid,
                    pdfOptions: format === "pdf" ? { colorTheme: pdfTheme } : undefined,
                }),
            });

            if (!response.ok) throw new Error("Failed to export calendar");

            const data = await response.json();

            if (format === "pdf") {
                try {
                    // Dynamic import needs to handle both default and named exports
                    const jsPDFModule = await import("jspdf");
                    // @ts-ignore - Handle different import scenarios
                    const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF || jsPDFModule;

                    if (!jsPDF) throw new Error("Could not load PDF library");

                    const doc = new jsPDF();

                    // Validate data
                    if (!data.calendar) throw new Error("No calendar data found");
                    const { calendar, plans = [], pdfOptions } = data;

                    const theme = pdfOptions?.colorTheme || {
                        primary: "#2196F3",
                        secondary: "#64B5F6",
                        accent: "#1976D2",
                        background: "#FFFFFF",
                        text: "#000000",
                    };

                    console.log("Generating PDF for:", calendar.name, "Plans:", plans.length);

                    // Header background
                    doc.setFillColor(theme.primary);
                    doc.rect(0, 0, 210, 40, "F");

                    // Calendar Title
                    doc.setTextColor("#FFFFFF");
                    doc.setFontSize(24);
                    doc.text(calendar.name || "My Calendar", 20, 25);

                    // Date generated
                    doc.setFontSize(10);
                    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);

                    let yPos = 50;

                    if (!plans || plans.length === 0) {
                        doc.setTextColor(0, 0, 0);
                        doc.setFontSize(12);
                        doc.text("No plans scheduled for this calendar.", 20, 60);
                    } else {
                        // Group plans by date
                        const groupedPlans: Record<string, typeof plans> = {};
                        plans.forEach((plan: any) => {
                            if (!plan.start) return;
                            const date = new Date(plan.start).toLocaleDateString();
                            if (!groupedPlans[date]) groupedPlans[date] = [];
                            groupedPlans[date].push(plan);
                        });

                        // Loop through dates
                        Object.keys(groupedPlans).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).forEach((date) => {
                            // Check for page break
                            if (yPos > 270) {
                                doc.addPage();
                                yPos = 20;
                            }

                            // Date Header
                            doc.setFillColor(theme.secondary);
                            // Ensure valid color, fallback to blue if needed
                            try { doc.rect(20, yPos, 170, 8, "F"); } catch { doc.setFillColor("#64B5F6"); doc.rect(20, yPos, 170, 8, "F"); }

                            doc.setTextColor("#FFFFFF");
                            doc.setFontSize(12);
                            doc.setFont("helvetica", "bold");
                            doc.text(new Date(date).toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }), 25, yPos + 6);

                            yPos += 15;

                            // Plans for this date
                            groupedPlans[date].forEach((plan: any) => {
                                if (yPos > 280) {
                                    doc.addPage();
                                    yPos = 20;
                                }

                                doc.setTextColor(theme.text);
                                doc.setFont("helvetica", "bold");
                                doc.setFontSize(11);
                                doc.text(plan.title || "Untitled Plan", 25, yPos);

                                const timeStr = new Date(plan.start).toLocaleTimeString(undefined, {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });

                                doc.setFont("helvetica", "normal");
                                doc.setFontSize(10);
                                doc.setTextColor(theme.accent);
                                doc.text(timeStr, 170, yPos, { align: "right" });

                                yPos += 6;

                                if (plan.description) {
                                    doc.setTextColor("#666666");
                                    doc.setFontSize(9);
                                    // Use smaller width for text wrapping to be safe
                                    const splitDesc = doc.splitTextToSize(plan.description, 150);
                                    doc.text(splitDesc, 25, yPos);
                                    yPos += (splitDesc.length * 4) + 4;
                                } else {
                                    yPos += 4;
                                }

                                // Draw separator line
                                doc.setDrawColor("#EEEEEE");
                                doc.line(25, yPos, 190, yPos);
                                yPos += 6;
                            });

                            yPos += 5;
                        });
                    }

                    doc.save(`${(calendar.name || "calendar").replace(/\s+/g, "_")}.pdf`);
                    toast.success("PDF Downloaded");
                } catch (pdfError) {
                    console.error("PDF Generation Error:", pdfError);
                    toast.error("Failed to generate PDF file. Please try CSV export.");
                }
            } else {
                // Download file
                const blob = new Blob([data.content], { type: data.contentType });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = data.filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success(`Exported as ${format.toUpperCase()}`);
            }
        } catch (error) {
            console.error("Error exporting calendar:", error);
            toast.error("Failed to export calendar");
        } finally {
            setExporting(false);
        }
    };

    const handleArchive = async () => {
        if (!confirm("Archive this calendar? You can restore it later.")) return;

        try {
            const response = await fetch(`/api/calendar/${calendarId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user?.uid,
                    isArchived: true,
                }),
            });

            if (!response.ok) throw new Error("Failed to archive calendar");

            toast.success("Calendar archived");
            router.push("/marketing/calendar");
        } catch (error) {
            console.error("Error archiving calendar:", error);
            toast.error("Failed to archive calendar");
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete this calendar and ALL plans? This cannot be undone!")) return;

        try {
            const response = await fetch(`/api/calendar/${calendarId}?userId=${user?.uid}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete calendar");

            toast.success("Calendar deleted");
            router.push("/marketing/calendar");
        } catch (error) {
            console.error("Error deleting calendar:", error);
            toast.error("Failed to delete calendar");
        }
    };

    const colorOptions = [
        { name: "Blue", value: "#2196F3" },
        { name: "Green", value: "#4CAF50" },
        { name: "Orange", value: "#FF9800" },
        { name: "Purple", value: "#9C27B0" },
        { name: "Red", value: "#F44336" },
        { name: "Teal", value: "#009688" },
    ];

    if (loading) {
        return (
            <MarketingLayout title="Settings">
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

    return (
        <MarketingLayout
            title={`${calendar.name} - Settings`}
            description="Manage calendar settings and preferences"
        >
            <Tabs defaultValue="general" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations & Export</TabsTrigger>
                    <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Calendar Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    maxLength={50}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <AITextarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    maxLength={200}
                                    minWords={3}
                                />
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

                    <Card>
                        <CardHeader>
                            <CardTitle>View Settings</CardTitle>
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
                                <Label>Start of Week</Label>
                                <RadioGroup
                                    value={formData.startOfWeek}
                                    onValueChange={(value: "sunday" | "monday") =>
                                        setFormData({ ...formData, startOfWeek: value })
                                    }
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="sunday" id="sunday" />
                                        <Label htmlFor="sunday" className="font-normal">
                                            Sunday
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="monday" id="monday" />
                                        <Label htmlFor="monday" className="font-normal">
                                            Monday
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Working Hours</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="workingHoursStart">Start Time</Label>
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
                                    <Label htmlFor="workingHoursEnd">End Time</Label>
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
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
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Settings
                                </>
                            )}
                        </Button>
                    </div>
                </TabsContent>

                {/* Integrations & Export */}
                <TabsContent value="integrations" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Export Calendar</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Export your calendar in various formats for use in other applications or for backup.
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => handleExport("ics")}
                                    disabled={exporting}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download .ICS (iCal)
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleExport("csv")}
                                    disabled={exporting}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download .CSV
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleExport("json")}
                                    disabled={exporting}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download JSON
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleExport("pdf")}
                                    disabled={exporting}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>PDF Export Color Theme</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Customize the color theme for your PDF exports
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pdfPrimary">Primary Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="pdfPrimary"
                                            type="color"
                                            value={pdfTheme.primary}
                                            onChange={(e) => setPdfTheme({ ...pdfTheme, primary: e.target.value })}
                                            className="w-20 h-10"
                                        />
                                        <Input
                                            type="text"
                                            value={pdfTheme.primary}
                                            onChange={(e) => setPdfTheme({ ...pdfTheme, primary: e.target.value })}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pdfSecondary">Secondary Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="pdfSecondary"
                                            type="color"
                                            value={pdfTheme.secondary}
                                            onChange={(e) => setPdfTheme({ ...pdfTheme, secondary: e.target.value })}
                                            className="w-20 h-10"
                                        />
                                        <Input
                                            type="text"
                                            value={pdfTheme.secondary}
                                            onChange={(e) => setPdfTheme({ ...pdfTheme, secondary: e.target.value })}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pdfAccent">Accent Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="pdfAccent"
                                            type="color"
                                            value={pdfTheme.accent}
                                            onChange={(e) => setPdfTheme({ ...pdfTheme, accent: e.target.value })}
                                            className="w-20 h-10"
                                        />
                                        <Input
                                            type="text"
                                            value={pdfTheme.accent}
                                            onChange={(e) => setPdfTheme({ ...pdfTheme, accent: e.target.value })}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pdfText">Text Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="pdfText"
                                            type="color"
                                            value={pdfTheme.text}
                                            onChange={(e) => setPdfTheme({ ...pdfTheme, text: e.target.value })}
                                            className="w-20 h-10"
                                        />
                                        <Input
                                            type="text"
                                            value={pdfTheme.text}
                                            onChange={(e) => setPdfTheme({ ...pdfTheme, text: e.target.value })}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setPdfTheme({
                                            primary: formData.color,
                                            secondary: formData.color,
                                            accent: formData.color,
                                            background: "#FFFFFF",
                                            text: "#000000",
                                        })
                                    }
                                >
                                    Reset to Calendar Color
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Danger Zone */}
                <TabsContent value="danger" className="space-y-6">
                    <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle className="text-red-600">Danger Zone</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="font-medium">Archive Calendar</h4>
                                <p className="text-sm text-muted-foreground">
                                    Archive this calendar to hide it from your main view. You can restore it later.
                                </p>
                                <Button variant="outline" onClick={handleArchive}>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive Calendar
                                </Button>
                            </div>

                            <div className="pt-4 border-t space-y-2">
                                <h4 className="font-medium text-red-600">Delete Calendar</h4>
                                <p className="text-sm text-muted-foreground">
                                    Permanently delete this calendar and all associated plans. This action cannot be
                                    undone.
                                </p>
                                <Button variant="destructive" onClick={handleDelete}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Calendar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </MarketingLayout>
    );
}
