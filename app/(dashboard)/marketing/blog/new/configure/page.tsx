"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BlogConfiguration, PRESET_TEMPLATES } from "@/types/blog-writer";

export default function ConfigurePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Get keywords from session storage
    const [primaryKeyword, setPrimaryKeyword] = useState("");
    const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);

    useEffect(() => {
        const primary = sessionStorage.getItem("blog_primary_keyword");
        const secondary = sessionStorage.getItem("blog_secondary_keywords");

        if (!primary) {
            router.push("/marketing/blog/new/select-keywords");
            return;
        }

        setPrimaryKeyword(primary);
        setSecondaryKeywords(secondary ? JSON.parse(secondary) : []);
    }, [router]);

    // Configuration state
    const [config, setConfig] = useState<BlogConfiguration>({
        // Section 1: Content Length & Format
        readingTime: 8,
        wordCount: 2000,
        contentDepth: "detailed",

        // Section 2: Writing Style & Tone
        tone: "conversational",
        formalityLevel: 5,
        pronounUse: "second",
        technicalLevel: "intermediate",

        // Section 3: Audience & Intent
        targetAudience: "General audience",
        readerKnowledge: "some",
        primaryGoal: "educate",
        readerIntent: "informational",

        // Section 4: Content Structure & Elements
        introStyle: "hook_problem",
        contentElements: ["toc", "faq"],
        paragraphStructure: "standard",
        listUsage: "balanced",

        // Section 5: SEO Optimization
        keywordOptimization: "optimized",
        keywordDensity: 1.5,
        internalLinking: true,
        externalLinkingStrategy: "moderate",
        metaDescriptionOptimization: ["include_keyword", "include_cta"],

        // Section 6: CTAs
        ctaFrequency: "multiple",
        ctaType: ["newsletter"],
        ctaTone: "direct",

        // Section 7: Formatting & Readability
        targetReadabilityScore: 65,
        sentenceLength: "varied",
        headingFrequency: "standard",
        formattingElements: ["bold", "italics"],

        // Section 8: Research & Citations
        researchDepth: "moderate",
        citationStyle: "inline",
        sourcePreference: ["industry", "research"],

        // Section 9: Visual Content
        imageDensity: "standard",
        imageTypes: ["featured", "section"],
        generateAIPrompts: true,

        // Section 10: Advanced Options
        contentFreshness: "evergreen",
        geographicFocus: "global",
        industryJargon: "use_sparingly",
        contentOriginality: "unique_angle",
        voicePersonality: [],
    });

    const updateConfig = (updates: Partial<BlogConfiguration>) => {
        setConfig({ ...config, ...updates });
    };

    const loadPreset = (presetKey: string) => {
        const preset = PRESET_TEMPLATES[presetKey];
        if (preset) {
            setConfig({ ...config, ...preset });
            toast.success("Template loaded");
        }
    };

    const handleGenerateOutline = async () => {
        if (!user) {
            toast.error("Please log in");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/blog-writer/generate-outline", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    primaryKeyword,
                    secondaryKeywords,
                    configuration: config,
                    userId: user.uid,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || "Failed to generate outline");
            }

            const data = await response.json();

            // Store blogId and navigate to outline page
            router.push(`/marketing/blog/${data.blogId}/outline`);
        } catch (error: any) {
            console.error("Error:", error);
            toast.error(error.message || "Failed to generate outline");
        } finally {
            setLoading(false);
        }
    };

    return (
        <MarketingLayout
            title="Configure Blog Post"
            description="Customize your blog post settings"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Configuration */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Preset Templates */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Start Templates</CardTitle>
                            <CardDescription>Load a preset configuration</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Select onValueChange={loadPreset}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a template..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="quick_news">Quick News Article (3-4 min)</SelectItem>
                                    <SelectItem value="standard_blog">Standard Blog Post (7-9 min) ⭐</SelectItem>
                                    <SelectItem value="ultimate_guide">Ultimate Guide (15+ min)</SelectItem>
                                    <SelectItem value="how_to_tutorial">How-To Tutorial (8-10 min)</SelectItem>
                                    <SelectItem value="listicle">Listicle (5-7 min)</SelectItem>
                                    <SelectItem value="comparison">Comparison Post (10-12 min)</SelectItem>
                                    <SelectItem value="thought_leadership">Thought Leadership (12-15 min)</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Section 1: Content Length */}
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Content Length & Format</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Reading Time: {config.readingTime} minutes</Label>
                                <Slider
                                    value={[config.readingTime]}
                                    onValueChange={([value]) => {
                                        updateConfig({
                                            readingTime: value,
                                            wordCount: value * 250,
                                        });
                                    }}
                                    min={3}
                                    max={20}
                                    step={1}
                                />
                                <p className="text-sm text-muted-foreground">
                                    ~{config.wordCount} words
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Content Depth</Label>
                                <RadioGroup
                                    value={config.contentDepth}
                                    onValueChange={(value: any) => updateConfig({ contentDepth: value })}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="overview" id="overview" />
                                        <Label htmlFor="overview" className="font-normal cursor-pointer">
                                            Overview (High-level, broad coverage)
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="detailed" id="detailed" />
                                        <Label htmlFor="detailed" className="font-normal cursor-pointer">
                                            Detailed (Comprehensive with examples)
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="expert" id="expert" />
                                        <Label htmlFor="expert" className="font-normal cursor-pointer">
                                            Expert (Deep dive with technical details)
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 2: Writing Style */}
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Writing Style & Tone</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tone of Voice</Label>
                                <Select
                                    value={config.tone}
                                    onValueChange={(value: any) => updateConfig({ tone: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="professional">Professional</SelectItem>
                                        <SelectItem value="conversational">Conversational</SelectItem>
                                        <SelectItem value="educational">Educational</SelectItem>
                                        <SelectItem value="persuasive">Persuasive</SelectItem>
                                        <SelectItem value="storytelling">Storytelling</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Formality Level: {config.formalityLevel}/10</Label>
                                <Slider
                                    value={[config.formalityLevel]}
                                    onValueChange={([value]) => updateConfig({ formalityLevel: value })}
                                    min={1}
                                    max={10}
                                    step={1}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Technical Level</Label>
                                <RadioGroup
                                    value={config.technicalLevel}
                                    onValueChange={(value: any) => updateConfig({ technicalLevel: value })}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="beginner" id="beginner" />
                                        <Label htmlFor="beginner" className="font-normal cursor-pointer">
                                            Beginner (Simple language)
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="intermediate" id="intermediate" />
                                        <Label htmlFor="intermediate" className="font-normal cursor-pointer">
                                            Intermediate
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="advanced" id="advanced" />
                                        <Label htmlFor="advanced" className="font-normal cursor-pointer">
                                            Advanced (Technical)
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 3: Audience */}
                    <Card>
                        <CardHeader>
                            <CardTitle>3. Audience & Intent</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Target Audience</Label>
                                <Input
                                    value={config.targetAudience}
                                    onChange={(e) => updateConfig({ targetAudience: e.target.value })}
                                    placeholder="e.g., Small business owners aged 30-50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Primary Goal</Label>
                                <Select
                                    value={config.primaryGoal}
                                    onValueChange={(value: any) => updateConfig({ primaryGoal: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="educate">Educate & Inform</SelectItem>
                                        <SelectItem value="generate_leads">Generate Leads</SelectItem>
                                        <SelectItem value="drive_sales">Drive Sales</SelectItem>
                                        <SelectItem value="build_authority">Build Authority</SelectItem>
                                        <SelectItem value="answer_questions">Answer Questions</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 4: Content Structure */}
                    <Card>
                        <CardHeader>
                            <CardTitle>4. Content Structure & Elements</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Content Elements to Include</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: "toc", label: "Table of Contents" },
                                        { value: "faq", label: "FAQ Section" },
                                        { value: "steps", label: "Step-by-Step Instructions" },
                                        { value: "comparison", label: "Comparison Tables" },
                                        { value: "case_studies", label: "Case Studies" },
                                        { value: "statistics", label: "Statistics & Data" },
                                        { value: "examples", label: "Examples" },
                                        { value: "checklist", label: "Actionable Checklist" },
                                    ].map((element) => (
                                        <div key={element.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={element.value}
                                                checked={config.contentElements.includes(element.value)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        updateConfig({
                                                            contentElements: [...config.contentElements, element.value],
                                                        });
                                                    } else {
                                                        updateConfig({
                                                            contentElements: config.contentElements.filter(
                                                                (e) => e !== element.value
                                                            ),
                                                        });
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={element.value} className="font-normal cursor-pointer">
                                                {element.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 5: SEO */}
                    <Card>
                        <CardHeader>
                            <CardTitle>5. SEO Optimization</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Keyword Optimization Level</Label>
                                <RadioGroup
                                    value={config.keywordOptimization}
                                    onValueChange={(value: any) => updateConfig({ keywordOptimization: value })}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="natural" id="natural" />
                                        <Label htmlFor="natural" className="font-normal cursor-pointer">
                                            Natural (Keywords used organically)
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="optimized" id="optimized" />
                                        <Label htmlFor="optimized" className="font-normal cursor-pointer">
                                            Optimized (Strategic placement, 1-2% density)
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="aggressive" id="aggressive" />
                                        <Label htmlFor="aggressive" className="font-normal cursor-pointer">
                                            Aggressive (Maximum SEO, 2-3% density)
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="internal-linking"
                                    checked={config.internalLinking}
                                    onCheckedChange={(checked) =>
                                        updateConfig({ internalLinking: checked as boolean })
                                    }
                                />
                                <Label htmlFor="internal-linking" className="font-normal cursor-pointer">
                                    Include internal link suggestions
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 6: CTAs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>6. Calls-to-Action</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>CTA Frequency</Label>
                                <RadioGroup
                                    value={config.ctaFrequency}
                                    onValueChange={(value: any) => updateConfig({ ctaFrequency: value })}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="none" id="none" />
                                        <Label htmlFor="none" className="font-normal cursor-pointer">
                                            No CTAs
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="single" id="single" />
                                        <Label htmlFor="single" className="font-normal cursor-pointer">
                                            Single CTA (at end)
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="multiple" id="multiple" />
                                        <Label htmlFor="multiple" className="font-normal cursor-pointer">
                                            Multiple CTAs (mid-content + end)
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {config.ctaFrequency !== "none" && (
                                <div className="space-y-2">
                                    <Label>CTA Types</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { value: "newsletter", label: "Newsletter" },
                                            { value: "download", label: "Download Resource" },
                                            { value: "consultation", label: "Book Consultation" },
                                            { value: "trial", label: "Try Product/Service" },
                                        ].map((cta) => (
                                            <div key={cta.value} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={cta.value}
                                                    checked={config.ctaType.includes(cta.value)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            updateConfig({
                                                                ctaType: [...config.ctaType, cta.value],
                                                            });
                                                        } else {
                                                            updateConfig({
                                                                ctaType: config.ctaType.filter((t) => t !== cta.value),
                                                            });
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={cta.value} className="font-normal cursor-pointer">
                                                    {cta.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Section 9: Visual Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>9. Visual Content</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Image Density</Label>
                                <Select
                                    value={config.imageDensity}
                                    onValueChange={(value: any) => updateConfig({ imageDensity: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="minimal">Minimal (1-2 images)</SelectItem>
                                        <SelectItem value="standard">Standard (1 per 500 words)</SelectItem>
                                        <SelectItem value="rich">Rich (1 per 300 words)</SelectItem>
                                        <SelectItem value="very_rich">Very Rich (1 per 200 words)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="ai-prompts"
                                    checked={config.generateAIPrompts}
                                    onCheckedChange={(checked) =>
                                        updateConfig({ generateAIPrompts: checked as boolean })
                                    }
                                />
                                <Label htmlFor="ai-prompts" className="font-normal cursor-pointer">
                                    Generate AI image prompts
                                </Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Generate Button */}
                    <div className="flex justify-end">
                        <Button onClick={handleGenerateOutline} disabled={loading} size="lg">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating Outline...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate Outline
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Live Summary Panel */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>Configuration Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <p className="font-semibold mb-1">📝 Content Specs:</p>
                                <ul className="space-y-1 text-muted-foreground">
                                    <li>• Reading Time: {config.readingTime} minutes</li>
                                    <li>• Word Count: ~{config.wordCount} words</li>
                                    <li>• Depth: {config.contentDepth}</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-semibold mb-1">✍️ Writing Style:</p>
                                <ul className="space-y-1 text-muted-foreground">
                                    <li>• Tone: {config.tone}</li>
                                    <li>• Formality: {config.formalityLevel}/10</li>
                                    <li>• Technical: {config.technicalLevel}</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-semibold mb-1">🎯 Audience & Goal:</p>
                                <ul className="space-y-1 text-muted-foreground">
                                    <li>• Target: {config.targetAudience}</li>
                                    <li>• Goal: {config.primaryGoal}</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-semibold mb-1">📊 Structure:</p>
                                <ul className="space-y-1 text-muted-foreground">
                                    <li>• Elements: {config.contentElements.length} selected</li>
                                    <li>• CTAs: {config.ctaFrequency}</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-semibold mb-1">🔍 SEO:</p>
                                <ul className="space-y-1 text-muted-foreground">
                                    <li>• Optimization: {config.keywordOptimization}</li>
                                    <li>• Internal Links: {config.internalLinking ? "Yes" : "No"}</li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-semibold mb-1">🖼️ Visuals:</p>
                                <ul className="space-y-1 text-muted-foreground">
                                    <li>• Density: {config.imageDensity}</li>
                                    <li>• AI Prompts: {config.generateAIPrompts ? "Yes" : "No"}</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MarketingLayout>
    );
}
