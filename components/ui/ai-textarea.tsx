"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Check, X, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { rewriteText } from "@/app/actions/ai/rewrite";
import { toast } from "sonner";
import type { RewriteOptions } from "@/types/gemini";

interface AITextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    containerClassName?: string;
    minWords?: number;
}

export function AITextarea({
    label,
    className,
    containerClassName,
    minWords,
    value,
    onChange,
    ...props
}: AITextareaProps) {
    const [showRewrite, setShowRewrite] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rewritten, setRewritten] = useState<string | null>(null);
    const [tone, setTone] = useState<RewriteOptions["tone"]>("professional");
    const [goal, setGoal] = useState<RewriteOptions["goal"]>("improve");
    const [length, setLength] = useState<RewriteOptions["length"]>("same");

    const textValue = (value as string) || "";
    const hasEnoughText = textValue.trim().split(/\s+/).length >= 5;

    const handleRewrite = async () => {
        setLoading(true);
        try {
            const result = await rewriteText(textValue, { tone, goal, length });
            if (result.success && result.data?.text) {
                setRewritten(result.data.text);
            } else {
                toast.error(result.error || "Rewrite failed");
            }
        } catch {
            toast.error("Something went wrong");
        }
        setLoading(false);
    };

    const acceptRewrite = () => {
        if (rewritten && onChange) {
            const syntheticEvent = {
                target: { value: rewritten },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(syntheticEvent);
        }
        setRewritten(null);
        setShowRewrite(false);
        toast.success("Text updated");
    };

    const rejectRewrite = () => {
        setRewritten(null);
    };

    const wordCount = textValue.trim() ? textValue.trim().split(/\s+/).length : 0;

    return (
        <div className={cn("space-y-2", containerClassName)}>
            <div className="flex items-center justify-between">
                {label && <Label>{label}</Label>}
                <div className="flex items-center gap-2">
                    {wordCount > 0 && (
                        <span className="text-xs text-muted-foreground">{wordCount} words</span>
                    )}
                    {hasEnoughText && (
                        <Popover open={showRewrite} onOpenChange={setShowRewrite}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    type="button"
                                >
                                    <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" />
                                    AI Rewrite
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" align="end">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Wand2 className="h-4 w-4 text-primary" />
                                        <h4 className="text-sm font-semibold">AI Rewrite</h4>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <Label className="text-xs mb-1 block">Tone</Label>
                                            <Select value={tone} onValueChange={(v) => setTone(v as any)}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="professional">Professional</SelectItem>
                                                    <SelectItem value="casual">Casual</SelectItem>
                                                    <SelectItem value="formal">Formal</SelectItem>
                                                    <SelectItem value="creative">Creative</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-xs mb-1 block">Goal</Label>
                                            <Select value={goal} onValueChange={(v) => setGoal(v as any)}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="improve">Improve</SelectItem>
                                                    <SelectItem value="simplify">Simplify</SelectItem>
                                                    <SelectItem value="expand">Expand</SelectItem>
                                                    <SelectItem value="rephrase">Rephrase</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-xs mb-1 block">Length</Label>
                                            <Select value={length} onValueChange={(v) => setLength(v as any)}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="shorter">Shorter</SelectItem>
                                                    <SelectItem value="same">Same</SelectItem>
                                                    <SelectItem value="longer">Longer</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleRewrite}
                                        disabled={loading}
                                        className="w-full"
                                        size="sm"
                                    >
                                        {loading ? (
                                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Rewriting...</>
                                        ) : (
                                            <><Sparkles className="h-4 w-4 mr-2" /> Generate Rewrite</>
                                        )}
                                    </Button>

                                    {rewritten && (
                                        <div className="space-y-2 pt-2 border-t">
                                            <div className="p-2 rounded border bg-muted/50 text-sm max-h-32 overflow-y-auto">
                                                {rewritten}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={acceptRewrite}
                                                    size="sm"
                                                    className="flex-1"
                                                >
                                                    <Check className="h-4 w-4 mr-1" /> Accept
                                                </Button>
                                                <Button
                                                    onClick={rejectRewrite}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                >
                                                    <X className="h-4 w-4 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>

            <Textarea
                value={value}
                onChange={onChange}
                className={cn("min-h-[120px] resize-y", className)}
                {...props}
            />
        </div>
    );
}
