"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AITextarea } from "@/components/ui/ai-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AIContentResponse } from "@/types/email-campaigns";

interface AIContentGeneratorProps {
    onContentGenerated: (content: AIContentResponse) => void;
}

export function AIContentGenerator({ onContentGenerated }: AIContentGeneratorProps) {
    const [mode, setMode] = useState<"quick" | "detailed">("quick");
    const [loading, setLoading] = useState(false);

    // Quick mode
    const [quickPrompt, setQuickPrompt] = useState("");

    // Detailed mode
    const [goal, setGoal] = useState("promote");
    const [targetAudience, setTargetAudience] = useState("");
    const [tone, setTone] = useState("professional");
    const [length, setLength] = useState("standard");
    const [customInstructions, setCustomInstructions] = useState("");
    const [includeElements, setIncludeElements] = useState({
        cta: true,
        testimonials: false,
        urgency: false,
        socialProof: false,
        benefits: true,
        personalization: true,
    });

    const handleGenerate = async () => {
        if (mode === "quick" && !quickPrompt.trim()) {
            toast.error("Please describe what your email is about");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/marketing/ai/generate-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode,
                    quickPrompt: mode === "quick" ? quickPrompt : undefined,
                    goal: mode === "detailed" ? goal : undefined,
                    targetAudience: mode === "detailed" ? targetAudience : undefined,
                    tone: mode === "detailed" ? tone : undefined,
                    length: mode === "detailed" ? length : undefined,
                    includeElements: mode === "detailed" ? includeElements : undefined,
                    customInstructions: mode === "detailed" ? customInstructions : undefined,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to generate content");
            }

            const content = await response.json();
            onContentGenerated(content);
            toast.success("Content generated successfully!");
        } catch (error: any) {
            console.error("Error generating content:", error);
            toast.error(error.message || "Failed to generate content");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Mode Selection */}
            <div className="flex gap-2">
                <Button
                    variant={mode === "quick" ? "default" : "outline"}
                    onClick={() => setMode("quick")}
                    className="flex-1"
                >
                    <Sparkles className="h-4 w-4 mr-2" />
                    One-Click Generate
                </Button>
                <Button
                    variant={mode === "detailed" ? "default" : "outline"}
                    onClick={() => setMode("detailed")}
                    className="flex-1"
                >
                    Customize Options
                </Button>
            </div>

            {mode === "quick" ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Quick AI Generation</CardTitle>
                        <CardDescription>
                            Describe your email in one sentence and let AI do the rest
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="quickPrompt">What's your email about?</Label>
                            <AITextarea
                                id="quickPrompt"
                                placeholder="e.g., Announce our new AI-powered marketing platform with 30% launch discount"
                                value={quickPrompt}
                                onChange={(e) => setQuickPrompt(e.target.value)}
                                minWords={5}
                            />
                        </div>

                        <Button onClick={handleGenerate} disabled={loading} className="w-full">
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Email
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Customize AI Generation</CardTitle>
                        <CardDescription>
                            Fine-tune your email content with detailed options
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="goal">Campaign Goal</Label>
                                <Select value={goal} onValueChange={setGoal}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="promote">Promote Product/Service</SelectItem>
                                        <SelectItem value="announce">Share News/Update</SelectItem>
                                        <SelectItem value="nurture">Nurture Leads</SelectItem>
                                        <SelectItem value="event">Drive Event Registration</SelectItem>
                                        <SelectItem value="feedback">Request Feedback</SelectItem>
                                        <SelectItem value="custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tone">Tone</Label>
                                <Select value={tone} onValueChange={setTone}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="professional">Professional</SelectItem>
                                        <SelectItem value="friendly">Friendly & Casual</SelectItem>
                                        <SelectItem value="urgent">Urgent & Direct</SelectItem>
                                        <SelectItem value="formal">Formal & Corporate</SelectItem>
                                        <SelectItem value="casual">Casual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="audience">Target Audience</Label>
                            <Input
                                id="audience"
                                placeholder="e.g., Small business owners, marketers, agency owners"
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="length">Email Length</Label>
                            <Select value={length} onValueChange={setLength}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="short">Short & Sweet (100-200 words)</SelectItem>
                                    <SelectItem value="standard">Standard (200-400 words)</SelectItem>
                                    <SelectItem value="detailed">Detailed (400-600 words)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label>Include Elements</Label>
                            <div className="grid gap-3 md:grid-cols-2">
                                {Object.entries({
                                    cta: "Clear CTA Button",
                                    testimonials: "Testimonials",
                                    urgency: "Urgency/Scarcity",
                                    socialProof: "Social Proof",
                                    benefits: "Product Benefits",
                                    personalization: "Personalization Tags",
                                }).map(([key, label]) => (
                                    <div key={key} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={key}
                                            checked={includeElements[key as keyof typeof includeElements]}
                                            onCheckedChange={(checked) =>
                                                setIncludeElements({ ...includeElements, [key]: checked })
                                            }
                                        />
                                        <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                                            {label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="custom">Custom Instructions (Optional)</Label>
                            <AITextarea
                                id="custom"
                                placeholder="Any specific requirements or details to include..."
                                value={customInstructions}
                                onChange={(e) => setCustomInstructions(e.target.value)}
                                minWords={5}
                            />
                        </div>

                        <Button onClick={handleGenerate} disabled={loading} className="w-full">
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Email Content
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
