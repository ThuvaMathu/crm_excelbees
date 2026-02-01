"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Calendar, Eye, Trash2 } from "lucide-react";
import { CalendarTemplate } from "@/types/calendar";

export default function TemplatesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [preBuiltTemplates, setPreBuiltTemplates] = useState<CalendarTemplate[]>([]);
    const [customTemplates, setCustomTemplates] = useState<CalendarTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<CalendarTemplate | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (!user) return;
        loadTemplates();
    }, [user]);

    const loadTemplates = async () => {
        try {
            const response = await fetch(`/api/calendar/templates?userId=${user?.uid}`);
            if (!response.ok) throw new Error("Failed to fetch templates");

            const data = await response.json();
            setPreBuiltTemplates(data.preBuilt);
            setCustomTemplates(data.custom);
        } catch (error) {
            console.error("Error loading templates:", error);
            toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = (template: CalendarTemplate) => {
        setSelectedTemplate(template);
        setShowPreview(true);
    };

    const handleDeleteCustomTemplate = async (templateId: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;

        try {
            const response = await fetch(`/api/calendar/templates/${templateId}?userId=${user?.uid}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete template");

            toast.success("Template deleted");
            loadTemplates();
        } catch (error) {
            console.error("Error deleting template:", error);
            toast.error("Failed to delete template");
        }
    };

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            content: "📄",
            business: "💼",
            personal: "👤",
            campaign: "🎯",
            custom: "⚙️",
        };
        return icons[category] || "📅";
    };

    if (loading) {
        return (
            <MarketingLayout title="Templates">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </MarketingLayout>
        );
    }

    return (
        <MarketingLayout
            title="Calendar Templates"
            description="Browse pre-built templates or use your custom templates"
        >
            <Tabs defaultValue="prebuilt" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="prebuilt">Pre-Built Templates</TabsTrigger>
                    <TabsTrigger value="custom">
                        My Templates ({customTemplates.length})
                    </TabsTrigger>
                </TabsList>

                {/* Pre-Built Templates */}
                <TabsContent value="prebuilt" className="space-y-4">
                    {preBuiltTemplates.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No pre-built templates available</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {preBuiltTemplates.map((template) => (
                                <Card key={template.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-muted-foreground">{template.description}</p>

                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Duration:</p>
                                                <p className="font-medium">{template.duration} days</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Plans:</p>
                                                <p className="font-medium">{template.planCount} items</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-muted-foreground">Frequency:</p>
                                            <p className="text-sm font-medium">{template.frequency}</p>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => handlePreview(template)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Preview
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => {
                                                    // Navigate to calendar selection or create new calendar with template
                                                    toast.info("Template application coming soon");
                                                }}
                                            >
                                                Use Template
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Custom Templates */}
                <TabsContent value="custom" className="space-y-4">
                    {customTemplates.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No custom templates yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Create a calendar and save it as a template to reuse later
                                </p>
                                <Button onClick={() => router.push("/marketing/calendar")}>
                                    Go to Calendars
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {customTemplates.map((template) => (
                                <Card key={template.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-muted-foreground">{template.description}</p>

                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-muted-foreground">Duration:</p>
                                                <p className="font-medium">{template.duration} days</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Plans:</p>
                                                <p className="font-medium">{template.planCount} items</p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-muted-foreground">Used:</p>
                                            <p className="text-sm font-medium">{template.usedCount} times</p>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handlePreview(template)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Preview
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    toast.info("Template application coming soon");
                                                }}
                                            >
                                                Use
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDeleteCustomTemplate(template.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedTemplate && getCategoryIcon(selectedTemplate.category)}
                            {selectedTemplate?.name}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedTemplate && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Description:</p>
                                <p>{selectedTemplate.description}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Duration:</p>
                                    <p className="font-medium">{selectedTemplate.duration} days</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Plans:</p>
                                    <p className="font-medium">{selectedTemplate.planCount} items</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Frequency:</p>
                                    <p className="font-medium">{selectedTemplate.frequency}</p>
                                </div>
                            </div>

                            {selectedTemplate.plans && selectedTemplate.plans.length > 0 ? (
                                <div>
                                    <p className="text-sm font-semibold mb-2">Included Plans:</p>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {selectedTemplate.plans.map((plan, index) => (
                                            <div key={index} className="p-3 border rounded-lg">
                                                <p className="font-medium">{plan.title}</p>
                                                {plan.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {plan.description}
                                                    </p>
                                                )}
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                                                        {plan.type}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                                                        {plan.priority}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No plan details available for this template
                                </p>
                            )}

                            <div className="flex gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowPreview(false)}
                                >
                                    Close
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => {
                                        setShowPreview(false);
                                        toast.info("Template application coming soon");
                                    }}
                                >
                                    Use This Template
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </MarketingLayout>
    );
}
