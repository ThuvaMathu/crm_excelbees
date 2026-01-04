"use client";

import { useState } from "react";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Sparkles, Copy, Megaphone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface AdVariant {
    platform: "google" | "facebook";
    headline: string;
    description: string;
    linkDescription?: string;
}

export default function AdCopyPage() {
    const { user } = useAuth();
    const [product, setProduct] = useState("");
    const [audience, setAudience] = useState("");
    const [benefit, setBenefit] = useState("");
    const [platform, setPlatform] = useState<"google" | "facebook">("google");

    const [isGenerating, setIsGenerating] = useState(false);
    const [ads, setAds] = useState<AdVariant[]>([]);

    const handleGenerate = async () => {
        if (!product || !benefit) return toast.error("Enter product and benefit");

        setIsGenerating(true);
        setAds([]);

        try {
            const res = await fetch("/api/marketing/ads", {
                method: "POST",
                body: JSON.stringify({
                    action: "generate_ads",
                    context: { product, audience, benefit, platform },
                    userId: user?.uid,
                    workspaceId: "demo"
                })
            });
            const data = await res.json();
            const result = JSON.parse(data.content);
            setAds(result);
            toast.success("Ads Generated!");
        } catch (e) {
            toast.error("Failed to generate ads");
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
            title="Ad Copy Generator"
            description="Create high-converting campaigns for Google & Meta."
        >
            <div className="grid gap-6 md:grid-cols-2">
                {/* Input Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Campaign Details</CardTitle>
                        <CardDescription>Tell us about your offer.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Product / Service Name</Label>
                            <Input
                                placeholder="e.g. CRM Pro"
                                value={product}
                                onChange={e => setProduct(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Target Audience</Label>
                            <Input
                                placeholder="e.g. Small Business Owners"
                                value={audience}
                                onChange={e => setAudience(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Main Benefit / USP</Label>
                            <Input
                                placeholder="e.g. Save 10 hours a week"
                                value={benefit}
                                onChange={e => setBenefit(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Platform</Label>
                            <RadioGroup defaultValue="google" value={platform} onValueChange={(v: any) => setPlatform(v)} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="google" id="google" />
                                    <Label htmlFor="google">Google Ads</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="facebook" id="facebook" />
                                    <Label htmlFor="facebook">Facebook / Instagram</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleGenerate} disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate Ad Variations
                        </Button>
                    </CardFooter>
                </Card>

                {/* Results Panel */}
                <div className="space-y-4">
                    {ads.length === 0 && !isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                            <Megaphone className="h-12 w-12 mb-4 opacity-20" />
                            <p>Ad previews will appear here</p>
                        </div>
                    )}

                    {ads.map((ad, idx) => (
                        <Card key={idx} className="relative overflow-hidden">
                            {/* Google Ad Preview Style */}
                            {ad.platform === "google" && (
                                <CardContent className="pt-6 font-sans">
                                    <div className="text-xs font-bold text-green-700 mb-1">Ad · www.example.com</div>
                                    <a href="#" className="text-xl text-[#1a0dab] hover:underline block mb-1 font-medium truncate">
                                        {ad.headline}
                                    </a>
                                    <div className="text-sm text-[#4d5156]">
                                        {ad.description}
                                    </div>
                                </CardContent>
                            )}

                            {/* Facebook Ad Preview Style */}
                            {ad.platform === "facebook" && (
                                <CardContent className="pt-6 font-sans">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                        <div>
                                            <div className="text-sm font-bold">Your Page Name</div>
                                            <div className="text-xs text-gray-500">Sponsored · <span className="text-gray-400 text-[10px]">🌐</span></div>
                                        </div>
                                    </div>
                                    <div className="text-sm mb-3 whitespace-pre-wrap">{ad.description}</div>
                                    <div className="border rounded-lg bg-gray-100 h-48 flex items-center justify-center text-gray-400 mb-2">
                                        Image Placeholder
                                    </div>
                                    <div className="bg-gray-100 p-2 text-sm flex justify-between items-center rounded-b-lg border-t-0 border border-gray-200">
                                        <div>
                                            <div className="font-bold text-xs uppercase text-gray-500">example.com</div>
                                            <div className="font-bold opacity-0.9 line-clamp-1">{ad.headline}</div>
                                            <div className="text-xs text-gray-500 line-clamp-1">{ad.linkDescription}</div>
                                        </div>
                                        <Button size="sm" variant="outline" className="h-8">Learn More</Button>
                                    </div>
                                </CardContent>
                            )}

                            <div className="bg-muted/30 p-2 flex justify-end">
                                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(JSON.stringify(ad))}>
                                    <Copy className="h-4 w-4 mr-2" /> Copy Data
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </MarketingLayout>
    );
}
