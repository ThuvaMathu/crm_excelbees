"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BlogPost } from "@/types/blog-writer";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function OutlinePage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const blogId = params.blogId as string;

    const [blog, setBlog] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (!user || !blogId) return;

        const loadBlog = async () => {
            try {
                console.log(`Fetching blog: ${blogId} for user: ${user.uid}`);
                const response = await fetch(`/api/blog-writer/${blogId}?userId=${user.uid}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error("Fetch failed:", response.status, response.statusText, errorData);
                    throw new Error(errorData.error || `Failed to fetch blog (${response.status})`);
                }

                const data = await response.json();
                setBlog(data.blog);
            } catch (error: any) {
                console.error("Error loading blog:", error);
                toast.error(error.message || "Failed to load blog");
            } finally {
                setLoading(false);
            }
        };

        loadBlog();
    }, [user, blogId]);

    const handleGenerateContent = async () => {
        if (!blog || !user) return;

        setGenerating(true);
        try {
            const response = await fetch("/api/blog-writer/generate-content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    blogId,
                    outline: blog.outline,
                    configuration: blog.configuration,
                    userId: user.uid,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || "Failed to generate content");
            }

            toast.success("Content generated successfully!");
            router.push(`/marketing/blog/${blogId}/edit`);
        } catch (error: any) {
            console.error("Error:", error);
            toast.error(error.message || "Failed to generate content");
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <MarketingLayout title="Blog Outline">
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
                        <Button className="mt-4" onClick={() => router.push("/marketing/blog")}>
                            Back to Blogs
                        </Button>
                    </CardContent>
                </Card>
            </MarketingLayout>
        );
    }

    const { outline } = blog;

    return (
        <MarketingLayout
            title="Review Outline"
            description={`Outline for "${blog.title}"`}
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
                            <BreadcrumbPage className="max-w-[200px] truncate block">
                                {blog.title}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Outline</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            }
            actions={
                <Button onClick={handleGenerateContent} disabled={generating}>
                    {generating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Content...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Full Content
                        </>
                    )}
                </Button>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Outline */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">{outline.workingTitle}</CardTitle>
                            <CardDescription>{outline.metaDescription}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Keywords */}
                            <div>
                                <h3 className="font-semibold mb-2">Keywords</h3>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                                        {blog.primaryKeyword}
                                    </span>
                                    {blog.secondaryKeywords.map((kw) => (
                                        <span
                                            key={kw}
                                            className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                                        >
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Sections */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Content Structure</h3>
                                {outline.sections.map((section, idx) => (
                                    <Card key={idx}>
                                        <CardHeader>
                                            <CardTitle className="text-lg">{section.heading}</CardTitle>
                                            <CardDescription>{section.purpose}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {section.subheadings && section.subheadings.length > 0 && (
                                                <div className="space-y-3">
                                                    {section.subheadings.map((sub, subIdx) => (
                                                        <div key={subIdx} className="pl-4 border-l-2 border-muted">
                                                            <h4 className="font-medium">{sub.heading}</h4>
                                                            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                                {sub.keyPoints.map((point, pointIdx) => (
                                                                    <li key={pointIdx}>• {point}</li>
                                                                ))}
                                                            </ul>
                                                            {sub.imageNeeded && (
                                                                <p className="mt-2 text-xs text-muted-foreground">
                                                                    📷 Image: {sub.imageDescription}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="mt-3 text-sm text-muted-foreground">
                                                ~{section.estimatedWordCount} words
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* CTAs */}
                            {outline.ctaPlacement && outline.ctaPlacement.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2">Call-to-Actions</h3>
                                    <div className="space-y-2">
                                        {outline.ctaPlacement.map((cta, idx) => (
                                            <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                                                <p className="font-medium">{cta.location}</p>
                                                <p className="text-muted-foreground">
                                                    {cta.type}: {cta.suggestedText}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Strategy Panel */}
                <div className="lg:col-span-1">
                    <div className="space-y-6 sticky top-6">
                        {/* SEO Strategy */}
                        <Card>
                            <CardHeader>
                                <CardTitle>SEO Strategy</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="font-semibold mb-1">Primary Keyword Placement:</p>
                                    <ul className="space-y-1 text-muted-foreground">
                                        {outline.seoStrategy.primaryKeywordPlacement.map((place, idx) => (
                                            <li key={idx}>• {place}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-semibold mb-1">Target Density:</p>
                                    <p className="text-muted-foreground">
                                        {outline.seoStrategy.targetKeywordDensity}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Estimated Metrics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Estimated Metrics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Word Count:</span>
                                    <span className="font-semibold">
                                        ~{outline.estimatedMetrics.totalWordCount}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Reading Time:</span>
                                    <span className="font-semibold">
                                        {outline.estimatedMetrics.readingTime} min
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Headings:</span>
                                    <span className="font-semibold">
                                        {outline.estimatedMetrics.numberOfHeadings}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Images:</span>
                                    <span className="font-semibold">
                                        {outline.estimatedMetrics.numberOfImages}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">CTAs:</span>
                                    <span className="font-semibold">
                                        {outline.estimatedMetrics.numberOfCTAs}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Content Strategy */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Content Strategy</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <p>{outline.contentStrategy}</p>
                                <div className="mt-3 pt-3 border-t">
                                    <p className="font-semibold text-foreground mb-1">Unique Angle:</p>
                                    <p>{outline.uniqueAngle}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
