"use client";

import { useState } from "react";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Zap, MousePointer, Layout, Globe, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuditResult {
    url: string;
    loadTime: number;
    status: number;
    title: string;
    description: string;
    analysis: {
        score: number;
        usability: string[];
        conversion: string[];
        performance: string[];
    };
}

export default function LandingPageAnalyzer() {
    const { user } = useAuth();
    const [domain, setDomain] = useState("");
    const [pages, setPages] = useState<string[]>([]);
    const [selectedPage, setSelectedPage] = useState("");
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [audit, setAudit] = useState<AuditResult | null>(null);

    // Step 1: Discover Pages via Sitemap
    const handleDiscover = async () => {
        if (!domain) return toast.error("Enter a domain");
        setIsDiscovering(true);
        setPages([]);
        try {
            const res = await fetch("/api/marketing/landing_page", {
                method: "POST",
                body: JSON.stringify({
                    action: "discover",
                    context: { domain },
                    userId: user?.uid,
                    workspaceId: "demo"
                })
            });
            const data = await res.json();
            const result = JSON.parse(data.content);
            setPages(result);
            if (result.length > 0) {
                toast.success(`Found ${result.length} pages`);
                setSelectedPage(result[0]); // Default to first
            } else {
                toast.warning("No sitemap found, using root URL.");
                setPages([domain.startsWith("http") ? domain : `https://${domain}`]);
                setSelectedPage(domain.startsWith("http") ? domain : `https://${domain}`);
            }
        } catch (e) {
            toast.error("Failed to discover pages");
        } finally {
            setIsDiscovering(false);
        }
    };

    // Step 2: Analyze Specific Page
    const handleAnalyze = async () => {
        if (!selectedPage) return;
        setIsAnalyzing(true);
        setAudit(null);
        try {
            const res = await fetch("/api/marketing/landing_page", {
                method: "POST",
                body: JSON.stringify({
                    action: "analyze_page",
                    context: { url: selectedPage },
                    userId: user?.uid,
                    workspaceId: "demo"
                })
            });
            const data = await res.json();
            const result = JSON.parse(data.content);
            setAudit(result);
            toast.success("Audit Complete");
        } catch (e) {
            toast.error("Failed to analyze page");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <MarketingLayout
            title="Landing Page Optimizer"
            description="Audit your pages for conversion, performance, and SEO."
        >
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Page Discovery</CardTitle>
                        <CardDescription>Enter your domain to find pages relative to your `sitemap.xml`.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="example.com"
                                value={domain}
                                onChange={e => setDomain(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleDiscover()}
                            />
                        </div>
                        <Button onClick={handleDiscover} disabled={isDiscovering}>
                            {isDiscovering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Fetch Sitemap
                        </Button>
                    </CardContent>

                    {pages.length > 0 && (
                        <CardContent className="border-t pt-4">
                            <Label>Select Page to Audit</Label>
                            <div className="flex gap-4 mt-2">
                                <Select value={selectedPage} onValueChange={setSelectedPage}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pages.map(p => (
                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                                    Run Audit
                                </Button>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {audit && (
                    <div className="grid gap-6 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-4">
                        {/* Summary Card */}
                        <Card className="md:col-span-1 border-l-4 border-l-primary">
                            <CardHeader>
                                <CardTitle>Audit Score</CardTitle>
                                <CardDescription>Overall Conversion Health</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center">
                                <div className="text-5xl font-bold mb-2 text-primary">{audit.analysis.score}</div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                    <Badge variant={audit.loadTime < 800 ? "default" : "destructive"}>
                                        {audit.loadTime}ms Load
                                    </Badge>
                                    <Badge variant="outline">Status {audit.status}</Badge>
                                </div>
                                <p className="text-center text-sm text-muted-foreground">{audit.title}</p>
                            </CardContent>
                        </Card>

                        {/* Detailed Tabs */}
                        <Card className="md:col-span-2">
                            <CardContent className="pt-6">
                                <Tabs defaultValue="conversion">
                                    <TabsList className="mb-4">
                                        <TabsTrigger value="conversion">Conversion</TabsTrigger>
                                        <TabsTrigger value="usability">Usability</TabsTrigger>
                                        <TabsTrigger value="performance">Performance</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="conversion" className="space-y-4">
                                        <div className="flex items-center gap-2 font-medium text-green-600 mb-2">
                                            <MousePointer className="h-5 w-5" /> CRO Opportunities
                                        </div>
                                        <ul className="space-y-2">
                                            {audit.analysis.conversion.map((item, i) => (
                                                <li key={i} className="flex gap-2 text-sm">
                                                    <span className="text-primary font-bold">{i + 1}.</span> {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </TabsContent>

                                    <TabsContent value="usability" className="space-y-4">
                                        <div className="flex items-center gap-2 font-medium text-blue-600 mb-2">
                                            <Layout className="h-5 w-5" /> UX & Accessibility
                                        </div>
                                        <ul className="space-y-2">
                                            {audit.analysis.usability.map((item, i) => (
                                                <li key={i} className="flex gap-2 text-sm">
                                                    <span className="text-primary font-bold">{i + 1}.</span> {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </TabsContent>

                                    <TabsContent value="performance" className="space-y-4">
                                        <div className="flex items-center gap-2 font-medium text-orange-600 mb-2">
                                            <Zap className="h-5 w-5" /> Speed & Tech
                                        </div>
                                        <ul className="space-y-2">
                                            {audit.analysis.performance.map((item, i) => (
                                                <li key={i} className="flex gap-2 text-sm">
                                                    <span className="text-primary font-bold">{i + 1}.</span> {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </MarketingLayout>
    );
}
