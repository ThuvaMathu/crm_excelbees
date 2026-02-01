"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PenTool, Eye, Trash2, Clock, FileText, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Blog {
    id: string;
    title: string;
    status: string;
    actualWordCount: number;
    seoScore: number;
    createdAt: Date;
    updatedAt: Date;
}

export default function BlogWriterPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const loadBlogs = async () => {
            try {
                const response = await fetch(`/api/blog-writer/library?userId=${user.uid}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error("Fetch library failed:", response.status, errorData);
                    throw new Error(errorData.details || errorData.error || "Failed to fetch blogs");
                }

                const data = await response.json();
                setBlogs(data.blogs || []);
            } catch (error: any) {
                console.error("Error loading blogs:", error);
                toast.error(error.message || "Failed to load blogs");
            } finally {
                setLoading(false);
            }
        };

        loadBlogs();
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this blog?")) return;

        try {
            const response = await fetch(`/api/blog-writer/${id}?userId=${user?.uid}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Failed to delete");

            setBlogs(blogs.filter((b) => b.id !== id));
            toast.success("Blog deleted");
        } catch (error) {
            toast.error("Failed to delete blog");
        }
    };

    if (loading) {
        return (
            <MarketingLayout title="AI Blog Writer">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading blogs...</p>
                    </div>
                </div>
            </MarketingLayout>
        );
    }

    return (
        <MarketingLayout
            title="AI Blog Writer"
            description="Create SEO-optimized blog posts with AI assistance"
            actions={
                <Button onClick={() => router.push("/marketing/blog/new/select-keywords")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Blog
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Blogs
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{blogs.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Drafts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {blogs.filter((b) => b.status === "draft").length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                In Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {blogs.filter((b) => b.status === "in_progress").length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Complete
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {blogs.filter((b) => b.status === "complete").length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Blog List */}
                {blogs.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No blogs yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Create your first AI-powered blog post
                            </p>
                            <Button onClick={() => router.push("/marketing/blog/new/select-keywords")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create New Blog
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {blogs.map((blog) => (
                            <Card key={blog.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="flex items-center gap-2">
                                                {blog.title}
                                                <Badge
                                                    variant={
                                                        blog.status === "complete"
                                                            ? "default"
                                                            : blog.status === "in_progress"
                                                                ? "secondary"
                                                                : "outline"
                                                    }
                                                >
                                                    {blog.status}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription className="mt-2">
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(blog.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <FileText className="h-3 w-3" />
                                                        {blog.actualWordCount} words
                                                    </span>
                                                    {blog.seoScore > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            SEO: {blog.seoScore}/100
                                                        </span>
                                                    )}
                                                </div>
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    if (blog.status === "draft") {
                                                        router.push(`/marketing/blog/${blog.id}/outline`);
                                                    } else {
                                                        router.push(`/marketing/blog/${blog.id}/edit`);
                                                    }
                                                }}
                                            >
                                                <PenTool className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                            {blog.status !== "draft" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/marketing/blog/${blog.id}/preview`)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Preview
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(blog.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </MarketingLayout>
    );
}
