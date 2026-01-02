"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Sparkles,
    MessageSquare,
    FileText,
    Briefcase,
    Target,
    Wand2,
    CheckCircle,
    Smile,
    Loader2,
    Undo2,
    RotateCcw,
    AlertCircle,
    Check
} from "lucide-react";
import { toast } from "sonner";
import { getActionsForContext } from "@/lib/ai/quick-actions";
import { generateText } from "@/app/actions/ai";
import type { AIAssistantEnhancedProps, QuickAction } from "@/types/ai-assistant";

// Icon mapping
const ICON_MAP: Record<string, React.ReactNode> = {
    Sparkles: <Sparkles className="h-4 w-4" />,
    MessageSquare: <MessageSquare className="h-4 w-4" />,
    FileText: <FileText className="h-4 w-4" />,
    Briefcase: <Briefcase className="h-4 w-4" />,
    Target: <Target className="h-4 w-4" />,
    Wand2: <Wand2 className="h-4 w-4" />,
    CheckCircle: <CheckCircle className="h-4 w-4" />,
    Smile: <Smile className="h-4 w-4" />,
};

export function AIAssistantEnhanced({
    context,
    currentContent,
    onGenerate,
    onUndo,
    disabled = false,
    className = "",
}: AIAssistantEnhancedProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [customPrompt, setCustomPrompt] = useState("");
    const [result, setResult] = useState<string | string[] | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const quickActions = getActionsForContext(context);

    // Helper to attempt parsing JSON response
    const parseAIResponse = (text: string): string | string[] => {
        try {
            // Remove markdown code blocks if present (common in AI responses)
            const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();

            // Attempt to parse JSON
            const parsed = JSON.parse(cleanText);

            // Validate it's an array of strings
            if (Array.isArray(parsed) && parsed.every(i => typeof i === 'string' || typeof i === 'number')) {
                return parsed.map(String);
            }
            // Fallback to text if not array
            return text;
        } catch (e) {
            // Fallback to text if parsing fails (it's likely plain text)
            return text;
        }
    };

    const handleQuickAction = async (action: QuickAction) => {
        setIsLoading(true);
        setError(null);
        setResult(null);
        setSelectedIndex(null);

        try {
            // Replace {content} placeholder with current content
            const prompt = action.prompt.replace('{content}', currentContent || 'No content yet');

            const response = await generateText(prompt);

            if (response.success && response.data) {
                const parsedResult = parseAIResponse(response.data);
                setResult(parsedResult);
                toast.success(`${action.label} completed`);
            } else {
                throw new Error(response.error || 'Failed to generate content');
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to generate content';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomPrompt = async () => {
        if (!customPrompt.trim()) {
            toast.error("Please enter a prompt");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);
        setSelectedIndex(null);

        try {
            const fullPrompt = context === 'subject'
                ? `Generate email subject lines based on: ${customPrompt}${currentContent ? `. Current context: ${currentContent}` : ''}`
                : `Generate email content based on: ${customPrompt}${currentContent ? `. Current content: ${currentContent}` : ''}`;

            // We append instruction to try to get structured data if possible, or just let the model decide
            // For custom prompts, we don't force JSON Unless we want to standardise.
            // Let's standardise if it's "Generate X" but it's hard to guess intent.
            // We'll just take the output as is, and parse it if it looks like JSON.

            const response = await generateText(fullPrompt);

            if (response.success && response.data) {
                const parsedResult = parseAIResponse(response.data);
                setResult(parsedResult);
                toast.success("Content generated");
            } else {
                throw new Error(response.error || 'Failed to generate content');
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to generate content';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUseResult = () => {
        if (!result) return;

        let contentToUse = "";

        if (Array.isArray(result)) {
            if (selectedIndex === null) {
                toast.error("Please select an option");
                return;
            }
            contentToUse = result[selectedIndex];
        } else {
            contentToUse = result;
        }

        // Clean up subject lines if needed (though JSON should be clean)
        if (context === 'subject') {
            const cleanSubject = contentToUse.replace(/^\d+\.\s*/, '').trim();
            onGenerate(cleanSubject, true);
        } else {
            onGenerate(contentToUse, true);
        }

        setIsOpen(false);
        resetState();
    };

    const handleTryAgain = () => {
        setResult(null);
        setError(null);
    };

    const resetState = () => {
        setResult(null);
        setError(null);
        setSelectedIndex(null);
        setCustomPrompt("");
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            resetState();
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className={`bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md ${className}`}
                >
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Assist
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[500px] p-0 shadow-2xl border-2 border-purple-200"
                align="start"
                side="bottom"
                sideOffset={8}
            >
                {/* Header */}
                <div className="p-4 border-b-2 border-purple-100 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-lg shadow-md">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">
                                AI Assistant - {context === 'subject' ? 'Subject' : 'Email Body'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                Powered by Google Gemini
                            </p>
                        </div>
                    </div>
                </div>

                <ScrollArea className="max-h-[500px]">
                    <div className="p-4 space-y-4">
                        {/* Quick Actions */}
                        {!result && !isLoading && (
                            <>
                                <div>
                                    <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2 block">
                                        Quick Actions
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {quickActions.map((action) => (
                                            <Button
                                                key={action.id}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleQuickAction(action)}
                                                className="justify-start h-auto py-2.5 px-3 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all text-purple-700 bg-white"
                                                title={action.description}
                                            >
                                                <span className="text-purple-600 mr-2">
                                                    {ICON_MAP[action.icon]}
                                                </span>
                                                <span className="text-xs font-medium text-left">
                                                    {action.label}
                                                </span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-slate-500 font-medium">Or</span>
                                    </div>
                                </div>

                                {/* Custom Prompt */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                        Custom Prompt
                                    </Label>
                                    <Textarea
                                        placeholder={context === 'subject'
                                            ? "Describe the subject you want to generate..."
                                            : "Describe what you want the email to say..."}
                                        value={customPrompt}
                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                        rows={3}
                                        className="resize-none border-slate-200 focus:border-purple-400 focus:ring-purple-400"
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleCustomPrompt}
                                        disabled={!customPrompt.trim()}
                                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                                    >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Generate from Prompt
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                                <p className="text-sm text-slate-600 font-medium">
                                    Generating content...
                                </p>
                            </div>
                        )}

                        {/* Error State */}
                        {error && !isLoading && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-red-900">Error</p>
                                        <p className="text-sm text-red-700 mt-1">{error}</p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTryAgain}
                                    className="mt-3 w-full"
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Try Again
                                </Button>
                            </div>
                        )}

                        {/* Result Display */}
                        {result && !isLoading && (
                            <div className="space-y-4">
                                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex justify-between items-center">
                                    <span>{Array.isArray(result) ? "Select an Option" : "Generated Content"}</span>
                                    {Array.isArray(result) && (
                                        <span className="text-[10px] font-normal text-slate-500 lowercase">Click option to select</span>
                                    )}
                                </Label>

                                {Array.isArray(result) ? (
                                    <div className="space-y-2">
                                        {result.map((item, index) => (
                                            <div
                                                key={index}
                                                onClick={() => setSelectedIndex(index)}
                                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all group relative ${selectedIndex === index
                                                    ? "border-purple-500 bg-purple-50 shadow-sm"
                                                    : "border-slate-100 bg-white hover:border-purple-200 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <div className="flex gap-3 items-start">
                                                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${selectedIndex === index ? "border-purple-600 bg-purple-600" : "border-slate-300 group-hover:border-purple-400"
                                                        }`}>
                                                        {selectedIndex === index && <Check className="h-3 w-3 text-white" />}
                                                    </div>
                                                    <p className="text-sm text-slate-800 leading-relaxed font-medium">
                                                        {item}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                                        <p className="text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
                                            {result}
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="button"
                                        onClick={handleUseResult}
                                        disabled={Array.isArray(result) && selectedIndex === null}
                                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        {Array.isArray(result) ? "Use Selected" : "Use This"}
                                    </Button>
                                    {onUndo && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                onUndo();
                                                setIsOpen(false);
                                                resetState();
                                            }}
                                            className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300"
                                        >
                                            <Undo2 className="h-4 w-4 mr-2" />
                                            Undo
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleTryAgain}
                                        className="hover:bg-slate-100"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Retry
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-3 border-t-2 border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                    <p className="text-xs text-slate-600 text-center">
                        💡 <span className="font-medium">Tip:</span> AI suggestions are starting points - feel free to edit!
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
}
