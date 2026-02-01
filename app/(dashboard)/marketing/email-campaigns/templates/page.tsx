"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { EmailTemplate } from "@/types/email-campaigns";
import { Plus, Search, FileText, Copy, Edit, Trash2, LayoutTemplate, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TemplatesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | "custom" | "system">("all");

    useEffect(() => {
        if (user) {
            loadTemplates();
        }
    }, [user]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/marketing/campaigns/templates?userId=${user?.uid}`);
            if (!response.ok) throw new Error("Failed to fetch templates");

            const data = await response.json();
            setTemplates(data.templates);
        } catch (error) {
            console.error("Error loading templates:", error);
            // toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (templateId: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;

        try {
            const response = await fetch(
                `/api/marketing/campaigns/templates/${templateId}?userId=${user?.uid}`,
                { method: "DELETE" }
            );

            if (!response.ok) throw new Error("Failed to delete template");

            toast.success("Template deleted");
            loadTemplates();
        } catch (error) {
            console.error("Error deleting template:", error);
            toast.error("Failed to delete template");
        }
    };

    const filteredTemplates = templates.filter((template) => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === "all" ||
            (activeTab === "system" && template.isSystem) ||
            (activeTab === "custom" && !template.isSystem);

        return matchesSearch && matchesTab;
    });

    return (
        <MarketingLayout
            title="Email Templates"
            description="Manage your email design templates"
            actions={
                <Button onClick={() => router.push("/marketing/email-campaigns/templates/new")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Search and Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Templates List */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList>
                        <TabsTrigger value="all">All Templates</TabsTrigger>
                        <TabsTrigger value="custom">My Templates</TabsTrigger>
                        <TabsTrigger value="system">System Gallery</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab} className="mt-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredTemplates.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                                    <p className="text-muted-foreground mb-4">
                                        {searchQuery ? "No templates found" : "No templates yet"}
                                    </p>
                                    {!searchQuery && (
                                        <Button onClick={() => router.push("/marketing/email-campaigns/templates/new")}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Your First Template
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {filteredTemplates.map((template) => (
                                    <Card key={template.id} className="group overflow-hidden hover:shadow-md transition-shadow">
                                        {template.thumbnail ? (
                                            <div className="aspect-video w-full overflow-hidden bg-muted">
                                                <img
                                                    src={template.thumbnail}
                                                    alt={template.name}
                                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-video w-full bg-muted flex items-center justify-center">
                                                <FileText className="h-10 w-10 text-muted-foreground/20" />
                                            </div>
                                        )}

                                        <CardHeader className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-base truncate" title={template.name}>
                                                        {template.name}
                                                    </CardTitle>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {template.category || "Uncategorized"}
                                                    </p>
                                                </div>
                                                {template.isSystem && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-medium">
                                                        System
                                                    </span>
                                                )}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-4 pt-0">
                                            <div className="flex items-center gap-2 mt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => router.push(`/marketing/email-campaigns/new?template=${template.id}`)}
                                                >
                                                    Use Template
                                                </Button>

                                                {!template.isSystem && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => router.push(`/marketing/email-campaigns/templates/${template.id}`)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive"
                                                            onClick={() => handleDelete(template.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </MarketingLayout>
    );
}
