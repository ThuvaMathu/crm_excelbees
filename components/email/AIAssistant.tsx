import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Wand2, SpellCheck, PenLine, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateText } from "@/app/actions/ai";
import { generateEmailDraft, analyzeEmail } from "@/app/actions/ai_email";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface AIAssistantProps {
    onGenerate: (text: string, type: "subject" | "content") => void;
    contextContent?: string; // Content to improve or reply to
    contextType?: "compose" | "reply";
}

export function AIAssistant({ onGenerate, contextContent, contextType = "compose" }: AIAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [result, setResult] = useState<string | null>(null);
    const [tone, setTone] = useState("professional");

    const handleGenerate = async (type: string, customPrompt?: string) => {
        setLoading(true);
        setResult(null);

        try {
            let data: { success: boolean, data?: any, error?: string };

            if (type === "reply") {
                // Uses specialized email drafter
                data = await generateEmailDraft(customPrompt || "", contextContent || "", tone);
            } else if (type === "subject") {
                // Generate subjects
                const subjectPrompt = `Generate 5 professional email subject lines based on this content:\n\n${contextContent}\n\nReturn only the subject lines, numbered 1-5.`;
                data = await generateText(subjectPrompt);
            } else {
                // Generic text generation (improve, grammar)
                let textPrompt = customPrompt || "";
                if (type === "improve") {
                    textPrompt = `Rewrite the following email content to be more professional, clear, and concise:\n\n${contextContent}`;
                }
                data = await generateText(textPrompt);
            }

            if (data.success) {
                if (type === "reply") {
                    // For now, just taking the body. In future, could Handle subject update too.
                    setResult(data.data.body);
                } else {
                    setResult(data.data);
                }
            } else {
                toast.error(`AI Error: ${data.error}`);
            }
        } catch (error) {
            toast.error("Failed to connect to AI service");
        } finally {
            setLoading(false);
        }
    };

    const actions = [
        {
            id: "improve",
            label: "Improve Writing",
            icon: Wand2,
            onClick: () => handleGenerate("improve"),
            condition: !!contextContent,
            desc: "Make it more professional and clear"
        },
        {
            id: "subject",
            label: "Generate Subjects",
            icon: PenLine,
            onClick: () => handleGenerate("subject"),
            condition: true, // Always available
            desc: "Get 5 subject line ideas"
        },
        {
            id: "grammar",
            label: "Fix Grammar",
            icon: SpellCheck,
            onClick: () => handleGenerate("grammar", "Fix grammar and spelling only:\n\n" + contextContent),
            condition: !!contextContent,
            desc: "Correct errors without changing tone"
        },
        {
            id: "reply",
            label: "Draft Reply",
            icon: MessageSquare,
            onClick: () => handleGenerate("reply", prompt), // Uses custom prompt input
            condition: contextType === "reply",
            desc: "Generate a response based on instructions"
        },
        {
            id: "analyze",
            label: "Analyze Sentiment",
            icon: MessageSquare,
            onClick: async () => {
                if (!contextContent) return;
                setLoading(true);
                setResult(null);
                try {
                    const { success, data } = await analyzeEmail(contextContent);
                    if (success && data) {
                        setResult(`Sentiment: ${data.sentiment}\n\nSummary: ${data.summary}\n\nKey Points:\n${data.keyPoints.map(p => `- ${p}`).join('\n')}\n\nAction Items:\n${data.actionItems.map(i => `- ${i}`).join('\n')}`);
                    }
                } catch (e) {
                    toast.error("Analysis failed");
                } finally {
                    setLoading(false);
                }
            },
            condition: !!contextContent && contextType === 'reply',
            desc: "Extract action items and sentiment"
        }
    ];

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                    <Sparkles className="h-4 w-4" />
                    AI Assist
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="start">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <h4 className="font-semibold text-purple-900">AI Assistant</h4>
                    </div>
                    <p className="text-xs text-purple-700">
                        Powered by Google Gemini
                    </p>
                </div>

                <ScrollArea className="h-[400px] p-4">
                    {!result ? (
                        <div className="space-y-2">
                            {contextType === 'reply' && (
                                <div className="mb-4">
                                    <Label className="text-xs font-medium text-slate-700">Reply Instructions</Label>
                                    <div className="flex gap-2 mb-2 mt-1">
                                        <Select value={tone} onValueChange={setTone}>
                                            <SelectTrigger className="h-8 text-xs w-[120px]">
                                                <SelectValue placeholder="Tone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="professional">Professional</SelectItem>
                                                <SelectItem value="friendly">Friendly</SelectItem>
                                                <SelectItem value="urgent">Urgent</SelectItem>
                                                <SelectItem value="apologetic">Apologetic</SelectItem>
                                                <SelectItem value="persuasive">Persuasive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Textarea
                                        placeholder="E.g. Agree to the meeting on Tuesday..."
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="h-20 text-xs resize-none"
                                    />
                                    <Button
                                        size="sm"
                                        className="w-full mt-2 bg-purple-600 hover:bg-purple-700"
                                        onClick={() => actions.find(a => a.id === 'reply')?.onClick()}
                                        disabled={loading || !prompt}
                                    >
                                        {loading && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                                        Generate Draft
                                    </Button>
                                </div>
                            )}

                            <div className="space-y-1">
                                <Label className="text-xs text-slate-600 font-medium mb-2 block">Quick Actions</Label>
                                {actions.filter(a => a.condition && a.id !== 'reply').map((action) => (
                                    <Button
                                        key={action.id}
                                        variant="ghost"
                                        className="w-full justify-start h-auto py-3 px-3 text-left hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all"
                                        onClick={action.onClick}
                                        disabled={loading}
                                    >
                                        <div className="bg-purple-100 p-2 rounded-lg mr-3">
                                            <action.icon className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm text-slate-900">{action.label}</div>
                                            <div className="text-xs text-slate-500">{action.desc}</div>
                                        </div>
                                        {loading && <Loader2 className="h-3 w-3 ml-auto animate-spin text-purple-600" />}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-lg text-sm whitespace-pre-wrap border border-slate-200 text-slate-900 leading-relaxed max-h-[280px] overflow-y-auto">
                                {result}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                    onClick={() => {
                                        onGenerate(result, result.includes("1.") ? "subject" : "content");
                                        setIsOpen(false);
                                    }}
                                >
                                    Use This
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-slate-300"
                                    onClick={() => setResult(null)}
                                >
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
