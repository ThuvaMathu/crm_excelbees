"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, FileText, CheckCircle2, ClipboardList, Gavel, Plus } from "lucide-react";
import { summarizeMeeting } from "@/app/actions/ai/meeting";
import type { MeetingSummary } from "@/types/gemini";
import { toast } from "sonner";

interface MeetingSummarizerProps {
    trigger?: React.ReactNode;
    onActionItem?: (task: string) => void;
}

export function MeetingSummarizer({ trigger, onActionItem }: MeetingSummarizerProps) {
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<MeetingSummary | null>(null);

    const handleSummarize = async () => {
        if (!notes.trim() || notes.trim().length < 10) {
            toast.error("Please paste at least a few sentences");
            return;
        }

        setLoading(true);
        try {
            const result = await summarizeMeeting(notes);
            if (result.success && result.data) {
                setSummary(result.data);
                toast.success("Meeting summarized!");
            } else {
                toast.error(result.error || "Failed to summarize");
            }
        } catch {
            toast.error("Something went wrong");
        }
        setLoading(false);
    };

    const handleClose = () => {
        setOpen(false);
        setNotes("");
        setSummary(null);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) handleClose(); }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Sparkles className="h-4 w-4 mr-2 text-primary" />
                        Summarize Meeting
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Meeting Summarizer
                    </DialogTitle>
                </DialogHeader>

                {!summary && (
                    <div className="space-y-3">
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Paste your raw meeting notes or transcript here..."
                            className="min-h-[200px] text-sm"
                        />
                        <Button onClick={handleSummarize} disabled={loading} className="w-full">
                            {loading ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Summarizing...</>
                            ) : (
                                <><Sparkles className="h-4 w-4 mr-2" /> Summarize Meeting</>
                            )}
                        </Button>
                    </div>
                )}

                {summary && (
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-semibold">Summary</h4>
                                </div>
                                <p className="text-sm text-muted-foreground">{summary.summary}</p>
                            </CardContent>
                        </Card>

                        {summary.keyPoints.length > 0 && (
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ClipboardList className="h-4 w-4 text-primary" />
                                        <h4 className="text-sm font-semibold">Key Points</h4>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {summary.keyPoints.map((point, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <span className="text-primary font-medium shrink-0">{i + 1}.</span>
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {summary.actionItems.length > 0 && (
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                        <h4 className="text-sm font-semibold">Action Items</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {summary.actionItems.map((item, i) => (
                                            <div key={i} className="flex items-start justify-between gap-2 p-2 border rounded">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">{item.task}</p>
                                                    {item.assignee && (
                                                        <p className="text-xs text-muted-foreground">Assigned to: {item.assignee}</p>
                                                    )}
                                                    {item.dueDate && (
                                                        <p className="text-xs text-muted-foreground">Due: {item.dueDate}</p>
                                                    )}
                                                </div>
                                                {onActionItem && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-xs shrink-0"
                                                        onClick={() => onActionItem(item.task)}
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Task
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {summary.decisions.length > 0 && (
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Gavel className="h-4 w-4 text-primary" />
                                        <h4 className="text-sm font-semibold">Decisions Made</h4>
                                    </div>
                                    <ul className="space-y-1.5">
                                        {summary.decisions.map((decision, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                                                <span>{decision}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        <Button variant="outline" onClick={() => setSummary(null)} className="w-full">
                            Summarize Another Meeting
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
