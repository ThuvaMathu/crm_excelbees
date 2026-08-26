"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportQueryInputProps {
    onQuery: (query: string) => void;
    isLoading?: boolean;
}

const COMMON_QUERIES = [
    "Show me lost deals last month by owner",
    "Compare revenue Q3 vs Q4",
    "Top lead sources by conversion rate"
];

export function ReportQueryInput({ onQuery, isLoading }: ReportQueryInputProps) {
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onQuery(query);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-4">
            <form onSubmit={handleSubmit} className="relative group">
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg opacity-20 transition-opacity duration-300 blur-md",
                    isFocused ? "opacity-40" : "opacity-20"
                )}></div>
                <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-lg border shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-1 focus-within:ring-indigo-500">
                    <div className="pl-4 flex items-center justify-center">
                        <Sparkles className={cn(
                            "h-4 w-4 transition-colors",
                            isFocused ? "text-indigo-500" : "text-muted-foreground"
                        )} />
                    </div>
                    <Input
                        placeholder="Ask AI to generate a report (e.g., 'Show revenue trends...')"
                        className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-12"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    <div className="pr-2">
                        <Button
                            type="button" // Changed to button to prevent form submission on Enter for now if needed, or keep 'submit'
                            size="sm"
                            variant={query.trim() ? "default" : "ghost"}
                            className={cn(
                                "h-8 transition-all",
                                query.trim() ? "bg-indigo-600 hover:bg-indigo-700" : "text-muted-foreground hover:bg-transparent"
                            )}
                            disabled={!query.trim() || isLoading}
                            onClick={() => query.trim() && onQuery(query)}
                        >
                            {isLoading ? (
                                <span className="animate-spin">⌛</span>
                            ) : (
                                <ArrowRight className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </form>

            <div className="flex flex-wrap gap-2 justify-center">
                {COMMON_QUERIES.map((q) => (
                    <button
                        key={q}
                        onClick={() => {
                            setQuery(q);
                            // Optional: auto-submit or just fill
                        }}
                        className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-100"
                    >
                        {q}
                    </button>
                ))}
            </div>
        </div>
    );
}
