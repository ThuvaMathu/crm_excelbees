"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Sparkles, Loader2, Check, X, Wand2, RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { rewriteText } from "@/app/actions/ai/rewrite";
import { generateContent } from "@/app/actions/ai/generate";
import { toast } from "sonner";
import type { RewriteOptions, GenerateOptions, AITone, AIPreset } from "@/types/gemini";

const TONES: { value: AITone; label: string }[] = [
    { value: "professional", label: "Professional" },
    { value: "formal",       label: "Formal" },
    { value: "friendly",     label: "Friendly" },
    { value: "casual",       label: "Casual" },
    { value: "persuasive",   label: "Persuasive" },
    { value: "concise",      label: "Concise" },
];

const PRESETS: { value: AIPreset; label: string }[] = [
    { value: "summary",      label: "Summary" },
    { value: "details",      label: "Details" },
    { value: "key_points",   label: "Key Points" },
    { value: "introduction", label: "Introduction" },
    { value: "overview",     label: "Overview" },
    { value: "custom",       label: "Custom" },
];

interface AITextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    containerClassName?: string;
    minWords?: number;
    /** Context data pulled from surrounding form fields for auto-write */
    context?: Record<string, string>;
}

export function AITextarea({
    label,
    className,
    containerClassName,
    minWords,
    value,
    onChange,
    context,
    ...props
}: AITextareaProps) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<"generate" | "rewrite">("generate");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    // Generate options
    const [preset, setPreset] = useState<AIPreset>("summary");
    const [customPrompt, setCustomPrompt] = useState("");
    const [genTone, setGenTone] = useState<AITone>("professional");
    const [genLength, setGenLength] = useState<GenerateOptions["length"]>("medium");
    const [useContext, setUseContext] = useState(true);

    // Rewrite options
    const [rwTone, setRwTone] = useState<AITone>("professional");
    const [rwGoal, setRwGoal] = useState<RewriteOptions["goal"]>("improve");
    const [rwLength, setRwLength] = useState<RewriteOptions["length"]>("same");

    const textValue = (value as string) || "";
    const hasText = textValue.trim().length > 0;
    const hasContext = context && Object.keys(context).filter(k => context[k]).length > 0;
    const wordCount = hasText ? textValue.trim().split(/\s+/).length : 0;

    const handleGenerate = async () => {
        if (preset === "custom" && !customPrompt.trim()) {
            toast.error("Enter a custom instruction");
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const opts: GenerateOptions = {
                preset,
                customPrompt: preset === "custom" ? customPrompt : undefined,
                tone: genTone,
                length: genLength,
                context: (hasContext && useContext) ? context : undefined,
                existingText: hasText ? textValue : undefined,
            };
            const res = await generateContent(opts);
            if (res.success && res.data?.text) {
                setResult(res.data.text);
            } else {
                toast.error(res.error || "Generation failed");
            }
        } catch {
            toast.error("Something went wrong");
        }
        setLoading(false);
    };

    const handleRewrite = async () => {
        if (!hasText) {
            toast.error("Nothing to rewrite — switch to Generate");
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const res = await rewriteText(textValue, { tone: rwTone, goal: rwGoal, length: rwLength });
            if (res.success && res.data?.text) {
                setResult(res.data.text);
            } else {
                toast.error(res.error || "Rewrite failed");
            }
        } catch {
            toast.error("Something went wrong");
        }
        setLoading(false);
    };

    const accept = () => {
        if (result && onChange) {
            onChange({ target: { value: result } } as React.ChangeEvent<HTMLTextAreaElement>);
        }
        setResult(null);
        setOpen(false);
        toast.success("Text updated");
    };

    const reject = () => setResult(null);

    return (
        <div className={cn("space-y-2", containerClassName)}>
            <div className="flex items-center justify-between">
                {label && <Label>{label}</Label>}
                <div className="flex items-center gap-2">
                    {wordCount > 0 && (
                        <span className="text-xs text-muted-foreground">{wordCount} words</span>
                    )}
                    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setResult(null); }}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" type="button">
                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                AI Write
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-[400px] p-0" align="end">
                            {/* Header */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
                                <Wand2 className="h-4 w-4 text-primary shrink-0" />
                                <span className="text-sm font-semibold">AI Writing Assistant</span>
                            </div>

                            {/* Mode tabs */}
                            <div className="flex border-b">
                                <button
                                    type="button"
                                    onClick={() => { setMode("generate"); setResult(null); }}
                                    className={cn(
                                        "flex-1 py-2 text-xs font-medium transition-colors",
                                        mode === "generate"
                                            ? "text-primary border-b-2 border-primary bg-primary/5"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    Generate New
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setMode("rewrite"); setResult(null); }}
                                    className={cn(
                                        "flex-1 py-2 text-xs font-medium transition-colors",
                                        !hasText && "opacity-40 cursor-not-allowed",
                                        mode === "rewrite"
                                            ? "text-primary border-b-2 border-primary bg-primary/5"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                    disabled={!hasText}
                                    title={!hasText ? "Add text first to use rewrite" : undefined}
                                >
                                    Rewrite Existing
                                </button>
                            </div>

                            <div className="p-4 space-y-4">
                                {mode === "generate" ? (
                                    <>
                                        {/* Presets */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">What to write</Label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {PRESETS.map((p) => (
                                                    <button
                                                        key={p.value}
                                                        type="button"
                                                        onClick={() => setPreset(p.value)}
                                                        className={cn(
                                                            "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                                                            preset === p.value
                                                                ? "bg-primary text-primary-foreground border-primary"
                                                                : "bg-background border-input hover:border-primary/50 text-foreground"
                                                        )}
                                                    >
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Custom instruction */}
                                        {preset === "custom" && (
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">Your instruction</Label>
                                                <Input
                                                    value={customPrompt}
                                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                                    placeholder="e.g. Write a 3-sentence executive summary…"
                                                    className="h-8 text-xs"
                                                />
                                            </div>
                                        )}

                                        {/* Tone + Length */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">Tone</Label>
                                                <Select value={genTone} onValueChange={(v) => setGenTone(v as AITone)}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TONES.map((t) => (
                                                            <SelectItem key={t.value} value={t.value} className="text-xs">
                                                                {t.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">Length</Label>
                                                <Select value={genLength} onValueChange={(v) => setGenLength(v as GenerateOptions["length"])}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="short"  className="text-xs">Short (~75 words)</SelectItem>
                                                        <SelectItem value="medium" className="text-xs">Medium (~200 words)</SelectItem>
                                                        <SelectItem value="long"   className="text-xs">Long (~400 words)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Context toggle */}
                                        {hasContext && (
                                            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium">Use form data as context</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setUseContext((v) => !v)}
                                                        className={cn(
                                                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                                                            useContext ? "bg-primary" : "bg-input"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                                                            useContext ? "translate-x-4" : "translate-x-0.5"
                                                        )} />
                                                    </button>
                                                </div>
                                                {useContext && (
                                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                                        {Object.entries(context!)
                                                            .filter(([, v]) => v)
                                                            .map(([k, v]) => `${k}: ${v}`)
                                                            .join(" · ")}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <Button
                                            onClick={handleGenerate}
                                            disabled={loading}
                                            className="w-full"
                                            size="sm"
                                        >
                                            {loading ? (
                                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
                                            ) : (
                                                <><Sparkles className="h-4 w-4 mr-2" /> Generate</>
                                            )}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {/* Rewrite mode */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">Tone</Label>
                                                <Select value={rwTone} onValueChange={(v) => setRwTone(v as AITone)}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TONES.map((t) => (
                                                            <SelectItem key={t.value} value={t.value} className="text-xs">
                                                                {t.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">Goal</Label>
                                                <Select value={rwGoal} onValueChange={(v) => setRwGoal(v as RewriteOptions["goal"])}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="improve"  className="text-xs">Improve</SelectItem>
                                                        <SelectItem value="simplify" className="text-xs">Simplify</SelectItem>
                                                        <SelectItem value="expand"   className="text-xs">Expand</SelectItem>
                                                        <SelectItem value="rephrase" className="text-xs">Rephrase</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">Length</Label>
                                                <Select value={rwLength} onValueChange={(v) => setRwLength(v as RewriteOptions["length"])}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="shorter" className="text-xs">Shorter</SelectItem>
                                                        <SelectItem value="same"    className="text-xs">Same</SelectItem>
                                                        <SelectItem value="longer"  className="text-xs">Longer</SelectItem>
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
                                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Rewriting…</>
                                            ) : (
                                                <><RefreshCw className="h-4 w-4 mr-2" /> Rewrite</>
                                            )}
                                        </Button>
                                    </>
                                )}

                                {/* Preview */}
                                {result && (
                                    <div className="space-y-2 pt-1 border-t">
                                        <Label className="text-xs text-muted-foreground">Preview</Label>
                                        <div className="p-3 rounded-md border bg-muted/40 text-xs leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                                            {result}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={accept} size="sm" className="flex-1">
                                                <Check className="h-3.5 w-3.5 mr-1" /> Accept
                                            </Button>
                                            <Button onClick={reject} variant="outline" size="sm" className="flex-1">
                                                <X className="h-3.5 w-3.5 mr-1" /> Reject
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
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
