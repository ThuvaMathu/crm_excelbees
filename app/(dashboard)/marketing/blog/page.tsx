"use client";

import { useState } from "react";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { MarketingFeatureCard } from "@/components/marketing/shared/MarketingFeatureCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, FileText, CheckCircle2, ChevronRight, PenTool } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface BlogOutline {
    title: string;
    headings: string[];
    keywords: string[];
}

export default function BlogWriterPage() {
    const { user } = useAuth();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form Data
    const [topic, setTopic] = useState("");
    const [tone, setTone] = useState("professional");
    const [outline, setOutline] = useState<BlogOutline | null>(null);
    const [draft, setDraft] = useState("");

    // Step 1: Generate Outline
    const handleGenerateOutline = async () => {
        if (!topic) return toast.error("Enter a topic");
        setIsLoading(true);
        try {
            const res = await fetch("/api/marketing/blog", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "generate_outline",
                    prompt: "ignored",
                    context: { topic, tone },
                    userId: user?.uid,
                    workspaceId: "demo"
                })
            });
            const data = await res.json();
            const result = JSON.parse(data.content);
            setOutline(result);
            setStep(2);
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate outline");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Generate Draft
    const handleGenerateDraft = async () => {
        if (!outline) return;
        setIsLoading(true);
        try {
            // In a real app, we'd allow editing the outline here before sending
            const res = await fetch("/api/marketing/blog", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "generate_draft",
                    prompt: "ignored",
                    context: { outline, tone },
                    userId: user?.uid,
                    workspaceId: "demo"
                })
            });
            const data = await res.json();
            setDraft(data.content); // Markdown content
            setStep(3);
        } catch (e) {
            console.error(e);
            toast.error("Failed to write draft");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MarketingLayout
            title="AI Blog Writer"
            description="Create SEO-optimized articles in minutes."
        >
            <div className="max-w-4xl mx-auto">
                {/* Progress Indicators */}
                <div className="flex justify-between mb-8 max-w-sm mx-auto">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 
                                ${step >= s ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-muted"}`}
                            >
                                {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
                            </div>
                            <span className="text-xs mt-1 text-muted-foreground">
                                {s === 1 ? "Topic" : s === 2 ? "Outline" : "Draft"}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Step 1: Input */}
                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>What should we write about?</CardTitle>
                            <CardDescription>Tell us your topic and we'll create an outline.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Blog Topic / Title Idea</Label>
                                <Input
                                    placeholder="e.g. The Future of AI in Marketing"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tone of Voice</Label>
                                <Select value={tone} onValueChange={setTone}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="professional">Professional</SelectItem>
                                        <SelectItem value="casual">Casual & Friendly</SelectItem>
                                        <SelectItem value="authoritative">Authoritative</SelectItem>
                                        <SelectItem value="funny">Humorous</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button onClick={handleGenerateOutline} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generate Outline
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {/* Step 2: Outline */}
                {step === 2 && outline && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Review Outline</CardTitle>
                            <CardDescription>Generated for "{topic}". You can proceed or go back.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 border rounded-lg bg-muted/50">
                                <h3 className="text-xl font-bold mb-4 text-primary">{outline.title}</h3>
                                <div className="space-y-2">
                                    <Label className="uppercase text-xs font-bold text-muted-foreground">Keywords</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {outline.keywords.map(k => (
                                            <span key={k} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">{k}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2 mt-4">
                                    <Label className="uppercase text-xs font-bold text-muted-foreground">Sections</Label>
                                    <ul className="list-decimal pl-5 space-y-1">
                                        {outline.headings.map(h => <li key={h} className="text-sm">{h}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                            <Button onClick={handleGenerateDraft} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                                        Writing Magic...
                                    </>
                                ) : (
                                    <>
                                        <PenTool className="mr-2 h-4 w-4" />
                                        Write Full Article
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {/* Step 3: Draft Output */}
                {step === 3 && (
                    <Card className="h-[75vh] flex flex-col">
                        <CardHeader>
                            <CardTitle>Your Draft is Ready!</CardTitle>
                            <CardDescription>Review the content below. You can copy or save it.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto border-t border-b bg-muted/10 p-6">
                            <article className="prose dark:prose-invert max-w-none">
                                <ReactMarkdown>{draft}</ReactMarkdown>
                            </article>
                        </CardContent>
                        <CardFooter className="flex justify-between py-4">
                            <Button variant="outline" onClick={() => setStep(2)}>Back to Outline</Button>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => {
                                    navigator.clipboard.writeText(draft);
                                    toast.success("Copied to clipboard");
                                }}>
                                    Copy Text
                                </Button>
                                <Button onClick={() => toast.success("Saved to Content Calendar!")}>
                                    Save to Calendar
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </MarketingLayout>
    );
}
