"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Wand2,
    Check,
    X,
    Loader2,
    ChevronDown,
    Sparkles,
    RefreshCcw,
    Maximize2,
    Minimize2
} from "lucide-react";
import {
    motion,
    AnimatePresence,
    useAnimation
} from "framer-motion";
import { cn } from "@/lib/utils";
import { rewriteText, type RewriteOptions } from "@/app/actions/ai-rewrite";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface AITextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    minWords?: number;
    containerClassName?: string;
    onRewriteStart?: () => void;
    onRewriteEnd?: () => void;
}

const TONES = ['professional', 'casual', 'formal', 'creative'] as const;
const TYPES = ['improve', 'simplify', 'expand', 'rephrase'] as const;
const LENGTHS = ['shorter', 'same', 'longer'] as const;

export function AITextarea({
    label,
    className,
    containerClassName,
    minWords = 10,
    value,
    onChange,
    onRewriteStart,
    onRewriteEnd,
    ...props
}: AITextareaProps) {
    // State
    const [text, setText] = useState(value as string || "");
    const [rewrittenText, setRewrittenText] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    // AI Options
    const [options, setOptions] = useState<RewriteOptions>({
        tone: 'professional',
        type: 'improve',
        length: 'same'
    });

    // Word Count Logic
    const wordCount = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
    const isAIEnabled = wordCount >= minWords;

    // Handlers
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        if (onChange) onChange(e);
        // Reset rewritten text if user types
        if (rewrittenText) setRewrittenText(null);
    };

    const handleRewrite = async () => {
        if (!isAIEnabled) return;

        setIsGenerating(true);
        onRewriteStart?.();

        try {
            const result = await rewriteText(text, options);

            if (result.error) {
                toast.error(result.error);
            } else if (result.text) {
                setRewrittenText(result.text);
                toast.success("Text rewritten successfully!");
            }
        } catch (error) {
            toast.error("Something went wrong with the rewrite.");
        } finally {
            setIsGenerating(false);
            onRewriteEnd?.();
        }
    };

    const handleAccept = () => {
        if (rewrittenText) {
            setText(rewrittenText);
            // Propagate change to parent logic simulating an event
            if (onChange) {
                const event = {
                    target: { value: rewrittenText }
                } as React.ChangeEvent<HTMLTextAreaElement>;
                onChange(event);
            }
            setRewrittenText(null);
            setShowOptions(false);
        }
    };

    const handleReject = () => {
        setRewrittenText(null);
    };

    return (
        <div className={cn("space-y-2 group", containerClassName)}>
            <div className="flex items-center justify-between">
                {label && <Label>{label}</Label>}
                <div className="flex items-center gap-2">
                    <AnimatePresence>
                        {isAIEnabled && !isGenerating && !rewrittenText && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                            >
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-6 px-2 text-xs gap-1.5 font-medium transition-all hover:bg-transparent",
                                        showOptions
                                            ? "!text-purple-600 !bg-purple-50 dark:!bg-purple-900/20"
                                            : "!text-muted-foreground hover:!text-purple-600"
                                    )}
                                    onClick={() => setShowOptions(!showOptions)}
                                >
                                    <Sparkles className="h-3 w-3" />
                                    AI Rewrite
                                    <ChevronDown className={cn("h-3 w-3 transition-transform", showOptions && "rotate-180")} />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <span className={cn(
                        "text-xs transition-colors duration-300",
                        !isAIEnabled ? "text-muted-foreground" : "text-green-600 font-medium"
                    )}>
                        {wordCount} / {minWords} words
                    </span>
                </div>
            </div>

            {/* Main Container with Gradient Border Effect */}
            <div className="relative rounded-md group-focus-within:ring-1  ring-purple-500/20 dark:ring-primary-700 transition-all">
                {/* Background Gradient Animation when generating */}
                {isGenerating && (
                    <div className="absolute inset-0 -m-[1px] rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-gradient-xy opacity-50 blur-sm pointer-events-none" />
                )}

                <div className="relative bg-background rounded-md border overflow-hidden">
                    {/* Input Textarea */}
                    <Textarea
                        value={rewrittenText || text}
                        onChange={handleTextChange}
                        disabled={isGenerating || !!rewrittenText}
                        className={cn(
                            "min-h-[120px] resize-y border-0 focus:border-primary-700 rounded-none bg-transparent relative z-10",
                            className,
                            rewrittenText && "text-purple-700 dark:text-white bg-purple-50/50 dark:bg-purple-900/10 italic"
                        )}
                        {...props}
                    />

                    {/* AI Options Panel */}
                    <AnimatePresence>
                        {showOptions && !rewrittenText && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t bg-muted/30 p-3 space-y-3"
                            >
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-semibold">Tone</Label>
                                        <Select
                                            value={options.tone}
                                            onValueChange={(val: any) => setOptions(prev => ({ ...prev, tone: val }))}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TONES.map(t => (
                                                    <SelectItem key={t} value={t} className="text-xs uppercase">
                                                        {t}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-semibold">Goal</Label>
                                        <Select
                                            value={options.type}
                                            onValueChange={(val: any) => setOptions(prev => ({ ...prev, type: val }))}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TYPES.map(t => (
                                                    <SelectItem key={t} value={t} className="text-xs uppercase">
                                                        {t}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-semibold">Length</Label>
                                        <Select
                                            value={options.length}
                                            onValueChange={(val: any) => setOptions(prev => ({ ...prev, length: val }))}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LENGTHS.map(t => (
                                                    <SelectItem key={t} value={t} className="text-xs uppercase">
                                                        {t}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-1">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleRewrite}
                                        disabled={isGenerating}
                                        className="h-8 text-xs bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg shadow-purple-500/20"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                                Rewriting...
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 className="h-3 w-3 mr-2" />
                                                Generate Rewrite
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Acceptance Actions Overlay */}
                    <AnimatePresence>
                        {rewrittenText && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-3 right-3 flex items-center gap-2 z-20"
                            >
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                                    onClick={handleReject}
                                    title="Reject"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="h-8 px-3 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 border-0"
                                    onClick={handleAccept}
                                    title="Accept"
                                >
                                    <Check className="h-4 w-4 mr-1.5" />
                                    <span className="text-xs font-bold">Accept</span>
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {!isAIEnabled && text.length > 0 && (
                <p className="text-[10px] text-muted-foreground text-right italic opacity-50">
                    Type {minWords - wordCount} more words to enable AI features
                </p>
            )}
        </div>
    );
}
