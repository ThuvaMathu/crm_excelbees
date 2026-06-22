"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { draftEmail, suggestSubjectLines } from "@/app/actions/ai/email-assist";
import { toast } from "sonner";

interface AIEmailAssistantProps {
    recipientName?: string;
    companyName?: string;
    context?: string;
    onDraft: (subject: string, body: string) => void;
    currentBody?: string;
}

const QUICK_ACTIONS = [
    { label: "Follow-up email", prompt: "Write a follow-up email to check in on the status" },
    { label: "Schedule meeting", prompt: "Write an email to schedule a meeting" },
    { label: "Send proposal", prompt: "Write an email introducing a proposal" },
    { label: "Thank you", prompt: "Write a thank you email for their time" },
];

export function AIEmailAssistant({
    recipientName,
    companyName,
    context,
    onDraft,
    currentBody,
}: AIEmailAssistantProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [tone, setTone] = useState<"professional" | "friendly" | "urgent">("professional");
    const [subjects, setSubjects] = useState<string[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error("Describe what you want to say");
            return;
        }

        setLoading(true);
        try {
            const result = await draftEmail({
                prompt,
                recipientName,
                companyName,
                context,
                tone,
            });

            if (result.success && result.data) {
                onDraft(result.data.subject, result.data.body);
                toast.success("AI draft generated!");
                setOpen(false);
                setPrompt("");
            } else {
                toast.error(result.error || "Failed to generate email");
            }
        } catch {
            toast.error("Something went wrong");
        }
        setLoading(false);
    };

    const handleSuggestSubjects = async () => {
        if (!currentBody) {
            toast.error("Write some email body first");
            return;
        }

        setLoadingSubjects(true);
        try {
            const result = await suggestSubjectLines({
                body: currentBody,
                recipientName,
            });

            if (result.success && result.data) {
                setSubjects(result.data);
            } else {
                toast.error(result.error || "Failed to generate subjects");
            }
        } catch {
            toast.error("Something went wrong");
        }
        setLoadingSubjects(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" type="button">
                    <Sparkles className="h-4 w-4 mr-1.5 text-primary" />
                    AI Assistant
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-4" align="start">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h4 className="text-sm font-semibold">AI Email Assistant</h4>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        {QUICK_ACTIONS.map((action) => (
                            <Button
                                key={action.label}
                                variant="secondary"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setPrompt(action.prompt)}
                            >
                                {action.label}
                            </Button>
                        ))}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">What do you want to say?</Label>
                        <Textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., Follow up on last week's proposal..."
                            className="min-h-[80px] text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">Tone:</Label>
                        <Select value={tone} onValueChange={(v) => setTone(v as any)}>
                            <SelectTrigger className="h-8 text-xs flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="friendly">Friendly</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className="w-full"
                        size="sm"
                    >
                        {loading ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                        ) : (
                            <><Wand2 className="h-4 w-4 mr-2" /> Generate Email</>
                        )}
                    </Button>

                    {currentBody && (
                        <div className="pt-2 border-t">
                            <Button
                                onClick={handleSuggestSubjects}
                                disabled={loadingSubjects}
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs"
                            >
                                {loadingSubjects ? (
                                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Thinking...</>
                                ) : (
                                    <><Sparkles className="h-3 w-3 mr-1" /> Suggest Subject Lines</>
                                )}
                            </Button>
                            {subjects.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {subjects.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                onDraft(s, currentBody);
                                                setOpen(false);
                                            }}
                                            className="w-full text-left p-2 text-xs rounded border hover:bg-accent transition-colors"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
