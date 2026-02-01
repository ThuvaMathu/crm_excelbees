"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Copy, FileText, Eye, PenTool } from "lucide-react";
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
import "./preview.css";

export default function PreviewPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const blogId = params.blogId as string;

    const [blog, setBlog] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        if (!user || !blogId) return;

        const loadBlog = async () => {
            try {
                const response = await fetch(`/api/blog-writer/${blogId}?userId=${user.uid}`);
                if (!response.ok) throw new Error("Failed to fetch blog");

                const data = await response.json();
                setBlog(data.blog);
            } catch (error) {
                console.error("Error loading blog:", error);
                toast.error("Failed to load blog");
            } finally {
                setLoading(false);
            }
        };

        loadBlog();
    }, [user, blogId]);

    const handleExport = async (format: "markdown" | "html" | "pdf" | "txt") => {
        if (!user || !blog) return;

        setExporting(true);
        try {
            if (format === "pdf") {
                const { default: jsPDF } = await import("jspdf");
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();
                const margin = 20;
                const maxWidth = pageWidth - 2 * margin;
                let yPosition = 20;

                // Title
                doc.setFontSize(20);
                doc.setFont("helvetica", "bold");
                const titleLines = doc.splitTextToSize(blog.title, maxWidth);
                doc.text(titleLines, margin, yPosition);
                yPosition += titleLines.length * 10 + 10;

                // Meta info
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text(`Primary Keyword: ${blog.primaryKeyword}`, margin, yPosition);
                yPosition += 6;
                if (blog.secondaryKeywords?.length) {
                    doc.text(`Secondary Keywords: ${blog.secondaryKeywords.join(", ")}`, margin, yPosition);
                    yPosition += 6;
                }
                yPosition += 10;

                // Content (strip HTML)
                doc.setFontSize(11);
                const plainContent = blog.content
                    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n\n$1\n")
                    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n$1\n")
                    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n")
                    .replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n")
                    .replace(/<[^>]*>/g, "")
                    .replace(/&nbsp;/g, " ")
                    .replace(/&amp;/g, "&")
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">");

                const contentLines = doc.splitTextToSize(plainContent, maxWidth);

                contentLines.forEach((line: string) => {
                    if (yPosition > 280) {
                        doc.addPage();
                        yPosition = 20;
                    }
                    doc.text(line, margin, yPosition);
                    yPosition += 6;
                });

                doc.save(`${blog.slug}.pdf`);
                toast.success("Exported as PDF");
            } else {
                const response = await fetch("/api/blog-writer/export", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        blogId,
                        format,
                        userId: user.uid,
                    }),
                });

                if (!response.ok) throw new Error("Failed to export");

                const data = await response.json();

                // Download text file (markdown, html, txt)
                const blob = new Blob([data.content], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = data.filename;
                link.click();
                URL.revokeObjectURL(url);

                toast.success(`Exported as ${format.toUpperCase()}`);
            }
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export");
        } finally {
            setExporting(false);
        }
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    if (loading) {
        return (
            <MarketingLayout title="Preview Blog">
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
            title="Preview Blog"
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
                            <BreadcrumbPage className="max-w-[200px] truncate block">
                                {blog.title}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Preview</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            }
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/marketing/blog/${blogId}/edit`)}>
                        <PenTool className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Preview */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardContent className="p-8">
                            <article className="prose dark:prose-invert max-w-none">
                                <h1>{blog.title}</h1>
                                <p className="lead">{blog.description}</p>
                                <div
                                    dangerouslySetInnerHTML={{ __html: blog.content }}
                                />
                            </article>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="space-y-6 sticky top-6">
                        {/* Export Options */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Export</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => handleExport("markdown")}
                                    disabled={exporting}
                                >
                                    {exporting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Export as Markdown
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => handleExport("html")}
                                    disabled={exporting}
                                >
                                    {exporting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Export as HTML
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => handleExport("txt")}
                                    disabled={exporting}
                                >
                                    {exporting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Export as TXT
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => handleExport("pdf")}
                                    disabled={exporting}
                                >
                                    {exporting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Export as PDF
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Copy Individual Elements */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Copy Elements</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => handleCopy(blog.title, "Title")}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Title
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => handleCopy(blog.description, "Meta Description")}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Meta Description
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => handleCopy(blog.content, "Content")}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Content (HTML)
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => handleCopy(blog.tags.join(", "), "Tags")}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Tags
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() =>
                                        handleCopy(
                                            `${blog.primaryKeyword}, ${blog.secondaryKeywords.join(", ")}`,
                                            "Keywords"
                                        )
                                    }
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Keywords
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Content Analysis */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Content Analysis</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Word Count:</span>
                                    <span className="font-semibold">{blog.actualWordCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Reading Time:</span>
                                    <span className="font-semibold">{blog.actualReadingTime} min</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">SEO Score:</span>
                                    <span className="font-semibold">{blog.seoScore}/100</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Readability:</span>
                                    <span className="font-semibold">{blog.readabilityScore}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Keyword Density:</span>
                                    <span className="font-semibold">{blog.keywordDensity.toFixed(1)}%</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pre-Publish Checklist */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Pre-Publish Checklist</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span>{blog.keywordUsage.primary.inTitle ? "✓" : "✗"}</span>
                                    <span className="text-muted-foreground">Keyword in title</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>{blog.description.length >= 150 && blog.description.length <= 160 ? "✓" : "✗"}</span>
                                    <span className="text-muted-foreground">Meta description (150-160 chars)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>{blog.keywordUsage.primary.inFirstParagraph ? "✓" : "✗"}</span>
                                    <span className="text-muted-foreground">Keyword in first paragraph</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>{blog.seoScore >= 70 ? "✓" : "✗"}</span>
                                    <span className="text-muted-foreground">SEO score {">"}= 70</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>{blog.readabilityScore >= 60 ? "✓" : "✗"}</span>
                                    <span className="text-muted-foreground">Readability score {">"}= 60</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
