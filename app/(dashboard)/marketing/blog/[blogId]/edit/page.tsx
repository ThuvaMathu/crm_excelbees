"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Eye, Save, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BlogPost } from "@/types/blog-writer";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
    countWords,
    calculateReadabilityScore,
    calculateSEOScore,
    analyzeKeywordUsage,
} from "@/lib/blog-writer/utils";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function EditPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const blogId = params.blogId as string;

    const [blog, setBlog] = useState<BlogPost | null>(null);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [aiAction, setAiAction] = useState<string | null>(null);

    // Live metrics computed from current content
    const liveMetrics = useMemo(() => {
        if (!content || !blog) return null;
        const wordCount = countWords(content);
        const readability = calculateReadabilityScore(content);
        const seo = calculateSEOScore(
            content,
            blog.title || "",
            blog.description || "",
            blog.primaryKeyword || "",
            blog.secondaryKeywords || [],
            blog.configuration
        );
        const kwUsage = analyzeKeywordUsage(
            content,
            blog.title || "",
            blog.primaryKeyword || "",
            blog.secondaryKeywords || []
        );
        return { wordCount, readability, seo, kwUsage };
    }, [content, blog]);

    useEffect(() => {
        if (!user || !blogId) return;

        const loadBlog = async () => {
            try {
                const response = await fetch(`/api/blog-writer/${blogId}?userId=${user.uid}`);
                if (!response.ok) throw new Error("Failed to fetch blog");

                const data = await response.json();
                setBlog(data.blog);
                setContent(data.blog.content || "");
            } catch (error) {
                console.error("Error loading blog:", error);
                toast.error("Failed to load blog");
            } finally {
                setLoading(false);
            }
        };

        loadBlog();
    }, [user, blogId]);

    const handleSave = async () => {
        if (!user || !blog) return;

        setSaving(true);
        try {
            const response = await fetch(`/api/blog-writer/${blogId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: user.uid,
                    updates: {
                        content,
                        status: "in_progress",
                    },
                }),
            });

            if (!response.ok) throw new Error("Failed to save");

            toast.success("Saved successfully");
        } catch (error) {
            toast.error("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleAIAssist = async (action: string, mode: "generate" | "improve") => {
        if (!user) return;

        setAiAction(action);
        try {
            const response = await fetch("/api/blog-writer/ai-assist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    blogId,
                    action,
                    selection: content,
                    context: "",
                    userId: user.uid,
                    mode,
                }),
            });

            if (!response.ok) throw new Error("Failed to generate");

            const data = await response.json();

            // API returns the full modified content for both modes:
            // - generate: original + new
            // - improve: improved version (replacement)
            setContent(data.generatedContent);

            toast.success("Content updated");
        } catch (error) {
            toast.error("Failed to generate content");
        } finally {
            setAiAction(null);
        }
    };

    if (loading) {
        return (
            <MarketingLayout title="Edit Blog">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </MarketingLayout>
        );
    }

    if (!blog) {
        return (
            <MarketingLayout title="Blog Not Found">
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">Blog not found</p>
                    </CardContent>
                </Card>
            </MarketingLayout>
        );
    }

    return (
        <MarketingLayout
            title="Edit Blog"
            description={blog.title}
            breadcrumb={
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/marketing/blog">Blog</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href={`/marketing/blog/${blogId}/preview`} className="max-w-[200px] truncate block">
                                {blog.title}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Edit</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            }
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                            </>
                        )}
                    </Button>
                    <Button onClick={() => router.push(`/marketing/blog/${blogId}/preview`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                    </Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Editor */}
                <div className="lg:col-span-2">
                    <Card className="h-[calc(100vh-200px)]">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Content Editor</CardTitle>
                                <div className="flex gap-2 text-sm text-muted-foreground">
                                    <span>{liveMetrics?.wordCount ?? blog.actualWordCount} words</span>
                                    <span>•</span>
                                    <span>SEO: {liveMetrics?.seo?.toFixed(0) ?? blog.seoScore}/100</span>
                                    <span>•</span>
                                    <span>Readability: {liveMetrics?.readability?.toFixed(0) ?? blog.readabilityScore}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[calc(100%-80px)] flex flex-col">
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                className="h-full flex flex-col"
                                editorClassName="flex-1 overflow-y-auto"
                                placeholder="Start writing or use AI assistance..."
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* AI Assistant Panel */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>AI Assistant</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="generate">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="generate">Generate</TabsTrigger>
                                    <TabsTrigger value="improve">Improve</TabsTrigger>
                                </TabsList>

                                <TabsContent value="generate" className="space-y-2">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => handleAIAssist("continue", "generate")}
                                        disabled={!!aiAction}
                                    >
                                        {aiAction === "continue" ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="mr-2 h-4 w-4" />
                                        )}
                                        Continue Writing
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => handleAIAssist("add_examples", "generate")}
                                        disabled={!!aiAction}
                                    >
                                        {aiAction === "add_examples" ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="mr-2 h-4 w-4" />
                                        )}
                                        Add Examples
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => handleAIAssist("add_statistics", "generate")}
                                        disabled={!!aiAction}
                                    >
                                        {aiAction === "add_statistics" ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="mr-2 h-4 w-4" />
                                        )}
                                        Add Statistics
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => handleAIAssist("add_faq", "generate")}
                                        disabled={!!aiAction}
                                    >
                                        {aiAction === "add_faq" ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="mr-2 h-4 w-4" />
                                        )}
                                        Add FAQ Section
                                    </Button>
                                </TabsContent>

                                <TabsContent value="improve" className="space-y-2">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => handleAIAssist("improve_readability", "improve")}
                                        disabled={!!aiAction}
                                    >
                                        {aiAction === "improve_readability" ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="mr-2 h-4 w-4" />
                                        )}
                                        Improve Readability
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => handleAIAssist("make_engaging", "improve")}
                                        disabled={!!aiAction}
                                    >
                                        {aiAction === "make_engaging" ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="mr-2 h-4 w-4" />
                                        )}
                                        Make More Engaging
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => handleAIAssist("seo_optimize", "improve")}
                                        disabled={!!aiAction}
                                    >
                                        {aiAction === "seo_optimize" ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="mr-2 h-4 w-4" />
                                        )}
                                        SEO Optimize
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => handleAIAssist("add_ctas", "improve")}
                                        disabled={!!aiAction}
                                    >
                                        {aiAction === "add_ctas" ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="mr-2 h-4 w-4" />
                                        )}
                                        Add CTAs
                                    </Button>
                                </TabsContent>
                            </Tabs>

                            {/* SEO Analysis */}
                            <div className="mt-6 space-y-3">
                                <h3 className="font-semibold text-sm">SEO Analysis</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Primary Keyword:</span>
                                        <span className="font-medium">
                                            {liveMetrics?.kwUsage?.primary?.count ?? blog.keywordUsage.primary.count} uses
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Density:</span>
                                        <span className="font-medium">
                                            {(liveMetrics?.kwUsage?.primary?.density ?? blog.keywordUsage.primary.density).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">In Title:</span>
                                        <span className="font-medium">
                                            {(liveMetrics?.kwUsage?.primary?.inTitle ?? blog.keywordUsage.primary.inTitle) ? "✓" : "✗"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">In First Para:</span>
                                        <span className="font-medium">
                                            {(liveMetrics?.kwUsage?.primary?.inFirstParagraph ?? blog.keywordUsage.primary.inFirstParagraph) ? "✓" : "✗"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MarketingLayout>
    );
}
