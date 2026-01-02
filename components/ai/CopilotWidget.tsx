"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    MessageCircle,
    X,
    Send,
    Bot,
    User,
    Sparkles,
    Database,
    Globe,
    Minimize2,
    Maximize2,
    Trash2,
    Copy,
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage, ChatMode } from "@/types/ai";
import { chatWithCopilot } from "@/app/actions/ai_chat";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export function CopilotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<ChatMode>("crm");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: inputValue,
            mode: mode,
            timestamp: Date.now()
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputValue("");
        setIsLoading(true);

        try {
            const { success, data, error } = await chatWithCopilot(messages, userMsg.content, mode);

            if (success && data) {
                setMessages((prev) => [...prev, data]);
            } else {
                toast.error(error || "Failed to get response");
            }
        } catch (err) {
            toast.error("Failed to connect to Copilot");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleClearChat = () => {
        setMessages([]);
        toast.success("Chat cleared");
    };

    const handleCopyMessage = (content: string, id: string) => {
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (!isOpen) {
        return (
            <Button
                className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl z-50 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 transition-all hover:scale-110 border-2 border-white/20"
                onClick={() => setIsOpen(true)}
            >
                <div className="relative">
                    <Bot className="h-8 w-8 text-white drop-shadow-lg" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                </div>
            </Button>
        );
    }

    return (
        <Card className={cn(
            "fixed bottom-6 right-6 shadow-2xl z-50 transition-all duration-300 flex flex-col overflow-hidden border-2 border-purple-100/50",
            isMinimized ? "w-80 h-16" : "w-[420px] h-[650px]"
        )}>
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">CRM Copilot</span>
                        <span className="text-[10px] text-purple-100">AI-Powered Assistant</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {messages.length > 0 && !isMinimized && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-white/80 hover:bg-white/20 hover:text-white"
                            onClick={handleClearChat}
                            title="Clear chat"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/80 hover:bg-white/20 hover:text-white"
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/80 hover:bg-white/20 hover:text-white"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Mode Selector with Enhanced Design */}
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 flex gap-2 shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "flex-1 text-xs justify-center h-9 font-medium transition-all",
                                mode === "crm"
                                    ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md hover:from-purple-700 hover:to-violet-700"
                                    : "text-slate-600 hover:bg-white/70 hover:text-purple-700"
                            )}
                            onClick={() => setMode("crm")}
                        >
                            <Database className="h-3.5 w-3.5 mr-1.5" />
                            CRM Pilot
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "flex-1 text-xs justify-center h-9 font-medium transition-all",
                                mode === "general"
                                    ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-md hover:from-purple-700 hover:to-violet-700"
                                    : "text-slate-600 hover:bg-white/70 hover:text-purple-700"
                            )}
                            onClick={() => setMode("general")}
                        >
                            <Globe className="h-3.5 w-3.5 mr-1.5" />
                            General
                        </Button>
                    </div>

                    {/* Messages Area with Better Contrast */}
                    <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-slate-50 to-white" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center py-12 px-4">
                                    <div className="bg-gradient-to-br from-purple-100 to-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                        <Sparkles className="h-8 w-8 text-purple-600" />
                                    </div>
                                    <h3 className="font-semibold text-slate-800 mb-2 text-lg">How can I assist you?</h3>
                                    <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                                        Ask about leads, deals, tasks, or get help with your CRM.
                                    </p>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {[
                                            { q: "Summarize my leads", icon: Database },
                                            { q: "Draft a cold email", icon: Sparkles },
                                            { q: "Show recent deals", icon: Database }
                                        ].map(({ q, icon: Icon }) => (
                                            <Button
                                                key={q}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs bg-white h-auto py-3 justify-start text-slate-700 hover:text-purple-700 hover:bg-purple-50 hover:border-purple-300 border-slate-200 shadow-sm transition-all"
                                                onClick={() => {
                                                    setInputValue(q);
                                                    handleSendMessage();
                                                }}
                                            >
                                                <Icon className="h-3.5 w-3.5 mr-2 text-purple-600" />
                                                {q}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex gap-3 text-sm mb-4 group",
                                        msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md",
                                        msg.role === "user"
                                            ? "bg-gradient-to-br from-purple-600 to-violet-600 text-white"
                                            : "bg-gradient-to-br from-white to-slate-50 border-2 border-purple-100 text-purple-600"
                                    )}>
                                        {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </div>
                                    <div className="flex flex-col gap-1 max-w-[80%]">
                                        <div className={cn(
                                            "p-3.5 rounded-2xl shadow-md relative",
                                            msg.role === "user"
                                                ? "bg-gradient-to-br from-purple-600 to-violet-600 text-white rounded-br-sm"
                                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                                        )}>
                                            {msg.role === 'assistant' ? (
                                                <div className="prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="leading-relaxed">{msg.content}</p>
                                            )}

                                            {msg.role === 'assistant' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute -right-2 -top-2 h-6 w-6 bg-white border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50"
                                                    onClick={() => handleCopyMessage(msg.content, msg.id)}
                                                >
                                                    {copiedId === msg.id ? (
                                                        <Check className="h-3 w-3 text-green-600" />
                                                    ) : (
                                                        <Copy className="h-3 w-3 text-slate-600" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                        {msg.role === 'assistant' && msg.mode === 'crm' && (
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-2">
                                                <Database className="h-3 w-3" />
                                                <span>CRM Grounded Response</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white to-slate-50 border-2 border-purple-100 flex items-center justify-center shrink-0 shadow-md">
                                        <Bot className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-bl-sm shadow-md flex items-center gap-2 h-12">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Input Area with Modern Design */}
                    <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                        <div className="relative">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={mode === 'crm' ? "Ask about your CRM data..." : "Ask me anything..."}
                                className="pr-12 h-11 text-slate-900 bg-slate-50 border-slate-300 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500 rounded-xl"
                                disabled={isLoading}
                            />
                            <Button
                                size="sm"
                                className="absolute right-1.5 top-1.5 h-8 w-8 p-0 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-lg shadow-md transition-all"
                                onClick={handleSendMessage}
                                disabled={isLoading || !inputValue.trim()}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="text-[10px] text-center text-slate-400 mt-2.5">
                            Powered by Gemini 1.5 Pro • AI can make mistakes
                        </div>
                    </div>
                </>
            )}
        </Card>
    );
}

