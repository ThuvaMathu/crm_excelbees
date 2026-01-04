"use client";

import { useState } from "react";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Sparkles, Copy, Linkedin, Twitter, Instagram } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface SocialPost {
    platform: "linkedin" | "twitter" | "instagram";
    content: string;
    hashtags: string[];
}

export default function SocialMediaPage() {
    const { user } = useAuth();
    const [topic, setTopic] = useState("");
    const [tone, setTone] = useState("professional");
    const [platforms, setPlatforms] = useState<string[]>(["linkedin", "twitter"]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [posts, setPosts] = useState<SocialPost[]>([]);

    const togglePlatform = (p: string) => {
        setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    };

    const handleGenerate = async () => {
        if (!topic) return toast.error("Enter a topic or URL");
        if (platforms.length === 0) return toast.error("Select at least one platform");

        setIsGenerating(true);
        setPosts([]);

        try {
            const res = await fetch("/api/marketing/social", {
                method: "POST",
                body: JSON.stringify({
                    action: "generate_posts",
                    context: { topic, platforms, tone },
                    userId: user?.uid,
                    workspaceId: "demo"
                })
            });
            const data = await res.json();
            const result = JSON.parse(data.content);
            setPosts(result);
            toast.success("Posts Generated!");
        } catch (e) {
            toast.error("Failed to generate posts");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return (
        <MarketingLayout
            title="Social Media Manager"
            description="Create multi-platform content from a single prompt."
        >
            <div className="grid gap-6 md:grid-cols-2">
                {/* Input Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Content Generator</CardTitle>
                        <CardDescription>What are we posting about today?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Topic or URL</Label>
                            <Textarea
                                placeholder="Paste a link to your new blog post or describe an announcement..."
                                className="h-32"
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Tone</Label>
                            <Select value={tone} onValueChange={setTone}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="witty">Witty / Fun</SelectItem>
                                    <SelectItem value="promotional">Promotional</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Platforms</Label>
                            <div className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="linkedin" checked={platforms.includes("linkedin")} onCheckedChange={() => togglePlatform("linkedin")} />
                                    <Label htmlFor="linkedin" className="cursor-pointer">LinkedIn</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="twitter" checked={platforms.includes("twitter")} onCheckedChange={() => togglePlatform("twitter")} />
                                    <Label htmlFor="twitter" className="cursor-pointer">Twitter</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="instagram" checked={platforms.includes("instagram")} onCheckedChange={() => togglePlatform("instagram")} />
                                    <Label htmlFor="instagram" className="cursor-pointer">Instagram</Label>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate Posts
                        </Button>
                    </CardFooter>
                </Card>

                {/* Results Panel */}
                <div className="space-y-4">
                    {posts.length === 0 && !isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                            <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                            <p>Generated posts will appear here</p>
                        </div>
                    )}

                    {posts.map((post) => (
                        <Card key={post.platform} className="relative">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    {post.platform === "linkedin" && <Linkedin className="h-4 w-4 text-blue-600" />}
                                    {post.platform === "twitter" && <Twitter className="h-4 w-4 text-sky-500" />}
                                    {post.platform === "instagram" && <Instagram className="h-4 w-4 text-pink-600" />}
                                    <span className="capitalize">{post.platform}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-3">
                                <p className="whitespace-pre-wrap">{post.content}</p>
                                <div className="flex flex-wrap gap-1">
                                    {post.hashtags.map(tag => (
                                        <span key={tag} className="text-blue-500 hover:underline cursor-pointer text-xs">{tag}</span>
                                    ))}
                                </div>
                            </CardContent>
                            <div className="absolute top-4 right-4">
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(`${post.content}\n\n${post.hashtags.join(" ")}`)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </MarketingLayout>
    );
}
