"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/shared/MarketingLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, ChevronRight, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function SelectKeywordsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("import");

    // Import from keyword research
    const [researches, setResearches] = useState<any[]>([]);
    const [selectedResearch, setSelectedResearch] = useState<string | null>(null);
    const [keywords, setKeywords] = useState<any[]>([]);
    const [primaryKeyword, setPrimaryKeyword] = useState<string>("");
    const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);

    // Manual entry
    const [manualTopic, setManualTopic] = useState("");
    const [manualKeywords, setManualKeywords] = useState("");

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user || activeTab !== "import") return;

        const loadResearches = async () => {
            try {
                console.log(`Fetching researches for user: ${user.uid}`);
                const response = await fetch(`/api/keyword/researches?userId=${user.uid}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error("Fetch researches failed:", response.status, errorData);
                    throw new Error(errorData.error || `Failed to fetch researches (${response.status})`);
                }

                const data = await response.json();
                setResearches(data.researches || []);
            } catch (error: any) {
                console.error("Error loading researches:", error);
                toast.error(error.message || "Failed to load history");
            }
        };

        loadResearches();
    }, [user, activeTab]);

    const loadKeywords = async (researchId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/keyword/research/${researchId}?userId=${user?.uid}`);
            if (!response.ok) throw new Error("Failed to fetch keywords");

            const data = await response.json();
            setKeywords(data.keywords || []);
            setSelectedResearch(researchId);
        } catch (error) {
            toast.error("Failed to load keywords");
        } finally {
            setLoading(false);
        }
    };

    const handlePrimarySelect = (keyword: string) => {
        setPrimaryKeyword(keyword);
        // Remove from secondary if selected
        setSecondaryKeywords(secondaryKeywords.filter(k => k !== keyword));
    };

    const handleSecondaryToggle = (keyword: string) => {
        if (keyword === primaryKeyword) return; // Can't select primary as secondary

        if (secondaryKeywords.includes(keyword)) {
            setSecondaryKeywords(secondaryKeywords.filter(k => k !== keyword));
        } else if (secondaryKeywords.length < 10) {
            setSecondaryKeywords([...secondaryKeywords, keyword]);
        } else {
            toast.error("Maximum 10 secondary keywords allowed");
        }
    };

    const handleContinue = () => {
        if (activeTab === "import") {
            if (!primaryKeyword) {
                toast.error("Please select a primary keyword");
                return;
            }

            // Store in sessionStorage for next page
            sessionStorage.setItem("blog_primary_keyword", primaryKeyword);
            sessionStorage.setItem("blog_secondary_keywords", JSON.stringify(secondaryKeywords));
            sessionStorage.setItem("blog_keyword_research_id", selectedResearch || "");

            router.push("/marketing/blog/new/configure");
        } else {
            if (!manualTopic) {
                toast.error("Please enter a topic");
                return;
            }

            const keywords = manualKeywords.split(",").map(k => k.trim()).filter(Boolean);

            sessionStorage.setItem("blog_primary_keyword", manualTopic);
            sessionStorage.setItem("blog_secondary_keywords", JSON.stringify(keywords));
            sessionStorage.setItem("blog_keyword_research_id", "");

            router.push("/marketing/blog/new/configure");
        }
    };

    return (
        <MarketingLayout
            title="Select Keywords"
            description="Choose keywords for your blog post"
        >
            <div className="max-w-4xl mx-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="import">Import from Research</TabsTrigger>
                        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    </TabsList>

                    {/* Import from Keyword Research */}
                    <TabsContent value="import" className="space-y-6">
                        {!selectedResearch ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Select Keyword Research</CardTitle>
                                    <CardDescription>
                                        Choose from your previous keyword research results
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {researches.length === 0 ? (
                                        <div className="text-center py-8">
                                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground mb-4">
                                                No keyword research found
                                            </p>
                                            <Button onClick={() => router.push("/marketing/keyword/new")}>
                                                Create Keyword Research
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {researches.map((research, index) => (
                                                <div
                                                    key={research.id || index}
                                                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                                    onClick={() => loadKeywords(research.id)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="font-semibold">{research.businessWebsite}</h3>
                                                            <p className="text-sm text-muted-foreground">
                                                                {new Date(research.createdAt).toLocaleDateString()} • {research.requestedKeywordCount} keywords
                                                            </p>
                                                        </div>
                                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Select Keywords</CardTitle>
                                    <CardDescription>
                                        Choose 1 primary keyword and up to 10 secondary keywords
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Selected Keywords Panel */}
                                    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                        <div>
                                            <Label className="text-xs font-bold uppercase text-muted-foreground">
                                                Primary Keyword
                                            </Label>
                                            <p className="text-lg font-semibold">
                                                {primaryKeyword || "Not selected"}
                                            </p>
                                        </div>
                                        <div>
                                            <Label className="text-xs font-bold uppercase text-muted-foreground">
                                                Secondary Keywords ({secondaryKeywords.length}/10)
                                            </Label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {secondaryKeywords.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground">None selected</p>
                                                ) : (
                                                    secondaryKeywords.map((kw) => (
                                                        <span
                                                            key={kw}
                                                            className="px-2 py-1 bg-primary/10 text-primary rounded text-sm"
                                                        >
                                                            {kw}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Keywords Table */}
                                    <div className="border rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-muted">
                                                <tr>
                                                    <th className="text-left p-3 text-sm font-medium">Primary</th>
                                                    <th className="text-left p-3 text-sm font-medium">Secondary</th>
                                                    <th className="text-left p-3 text-sm font-medium">Keyword</th>
                                                    <th className="text-left p-3 text-sm font-medium">Volume</th>
                                                    <th className="text-left p-3 text-sm font-medium">Difficulty</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {keywords.slice(0, 50).map((keyword, index) => (
                                                    <tr key={keyword.id || index} className="border-t hover:bg-muted/30">
                                                        <td className="p-3">
                                                            <RadioGroup
                                                                value={primaryKeyword}
                                                                onValueChange={handlePrimarySelect}
                                                            >
                                                                <RadioGroupItem
                                                                    value={keyword.primaryKeyword}
                                                                    id={`primary-${keyword.id}`}
                                                                />
                                                            </RadioGroup>
                                                        </td>
                                                        <td className="p-3">
                                                            <Checkbox
                                                                checked={secondaryKeywords.includes(keyword.primaryKeyword)}
                                                                onCheckedChange={() => handleSecondaryToggle(keyword.primaryKeyword)}
                                                                disabled={keyword.primaryKeyword === primaryKeyword}
                                                            />
                                                        </td>
                                                        <td className="p-3 font-medium">{keyword.primaryKeyword}</td>
                                                        <td className="p-3 text-sm text-muted-foreground">
                                                            {keyword.searchVolume?.toLocaleString() || "N/A"}
                                                        </td>
                                                        <td className="p-3">
                                                            <span
                                                                className={`px-2 py-1 rounded text-xs ${keyword.difficulty === "low"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : keyword.difficulty === "medium"
                                                                        ? "bg-yellow-100 text-yellow-700"
                                                                        : "bg-red-100 text-red-700"
                                                                    }`}
                                                            >
                                                                {keyword.difficulty}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex justify-between">
                                        <Button variant="outline" onClick={() => setSelectedResearch(null)}>
                                            Back to Research List
                                        </Button>
                                        <Button onClick={handleContinue} disabled={!primaryKeyword}>
                                            Continue to Configuration
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Manual Entry */}
                    <TabsContent value="manual">
                        <Card>
                            <CardHeader>
                                <CardTitle>Enter Topic Manually</CardTitle>
                                <CardDescription>
                                    Start from scratch with your own topic and keywords
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="topic">Blog Topic / Title Idea *</Label>
                                    <Input
                                        id="topic"
                                        placeholder="e.g., The Ultimate Guide to Content Marketing"
                                        value={manualTopic}
                                        onChange={(e) => setManualTopic(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        This will be used as the primary keyword
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="keywords">
                                        Secondary Keywords (Optional)
                                    </Label>
                                    <Input
                                        id="keywords"
                                        placeholder="keyword1, keyword2, keyword3"
                                        value={manualKeywords}
                                        onChange={(e) => setManualKeywords(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Separate multiple keywords with commas (max 10)
                                    </p>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleContinue} disabled={!manualTopic}>
                                        Continue to Configuration
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </MarketingLayout>
    );
}
