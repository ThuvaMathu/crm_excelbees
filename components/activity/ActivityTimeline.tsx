"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
    StickyNote,
    Mail,
    Phone,
    RefreshCw,
    Plus,
    Edit,
    Trash2,
    FileText,
    Paperclip,
    Download,
    Sparkles,
} from "lucide-react";
import { createActivity, deleteActivity, type Activity } from "@/lib/firestore/activities";
import { uploadFiles, type UploadedFile } from "@/lib/storage/upload";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { MeetingSummarizer } from "@/components/shared/MeetingSummarizer";

interface ActivityTimelineProps {
    entityCollection: string;
    entityId: string;
    activities: Activity[];
    onActivityAdded?: () => void;
    canEdit?: boolean;
}

export function ActivityTimeline({
    entityCollection,
    entityId,
    activities,
    onActivityAdded,
    canEdit = true,
}: ActivityTimelineProps) {
    const { user } = useAuth();
    const [noteContent, setNoteContent] = useState("");
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddNote = async () => {
        if ((!noteContent.trim() || noteContent === "<p><br></p>") && attachments.length === 0) {
            toast.error("Please add some content or attachments");
            return;
        }
        if (!user) return;

        setIsSubmitting(true);

        try {
            // Upload files if any
            let uploadedFiles: UploadedFile[] = [];
            if (attachments.length > 0) {
                const { success, files, error } = await uploadFiles(attachments);
                if (!success) {
                    toast.error(error || "Failed to upload files");
                    setIsSubmitting(false);
                    return;
                }
                uploadedFiles = files;
            }

            // Create activity
            const { success, error } = await createActivity({
                type: "note",
                content: noteContent,
                performedBy: user.uid,
                performedByName: user.displayName || user.email || "Unknown",
                relatedTo: {
                    collection: entityCollection,
                    id: entityId,
                },
                attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined,
            });

            if (success) {
                toast.success("Note added successfully");
                setNoteContent("");
                setAttachments([]);
                onActivityAdded?.();
            } else {
                toast.error(error || "Failed to add note");
            }
        } catch (error) {
            console.error("Error adding note:", error);
            toast.error("An unexpected error occurred");
        }

        setIsSubmitting(false);
    };

    const handleDeleteActivity = async (activityId: string) => {
        if (!confirm("Are you sure you want to delete this activity?")) return;

        const { success, error } = await deleteActivity(activityId);

        if (success) {
            toast.success("Activity deleted");
            onActivityAdded?.();
        } else {
            toast.error(error || "Failed to delete activity");
        }
    };

    const handleFileSelect = (files: File[]) => {
        setAttachments((prev) => [...prev, ...files]);
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const getActivityIcon = (type: string) => {
        const icons: Record<string, React.ReactElement> = {
            note: <StickyNote className="h-4 w-4 text-blue-500" />,
            email: <Mail className="h-4 w-4 text-green-500" />,
            call: <Phone className="h-4 w-4 text-orange-500" />,
            status_change: <RefreshCw className="h-4 w-4 text-purple-500" />,
            created: <Plus className="h-4 w-4 text-gray-500" />,
            updated: <Edit className="h-4 w-4 text-gray-500" />,
            log: <FileText className="h-4 w-4 text-gray-500" />,
        };
        return icons[type] || <FileText className="h-4 w-4 text-gray-500" />;
    };

    const getActivityColor = (type: string) => {
        const colors: Record<string, string> = {
            note: "border-blue-500",
            email: "border-green-500",
            call: "border-orange-500",
            status_change: "border-purple-500",
            created: "border-gray-500",
            updated: "border-gray-500",
            log: "border-gray-500",
        };
        return colors[type] || "border-gray-500";
    };

    return (
        <div className="space-y-6">
            {/* Rich Text Editor for Adding Notes */}
            {canEdit && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex justify-end mb-2">
                            <MeetingSummarizer
                                onActionItem={(task) => {
                                    setNoteContent(task);
                                    toast.info("Action item added to notes. Save to create activity.");
                                }}
                                trigger={
                                    <Button variant="outline" size="sm">
                                        <Sparkles className="h-4 w-4 mr-1.5 text-primary" />
                                        Summarize Meeting
                                    </Button>
                                }
                            />
                        </div>
                        <RichTextEditor
                            value={noteContent}
                            onChange={setNoteContent}
                            placeholder="Add a note with rich formatting..."
                            onSubmit={handleAddNote}
                            onFileSelect={handleFileSelect}
                            attachments={attachments}
                            onRemoveAttachment={handleRemoveAttachment}
                            disabled={isSubmitting}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Timeline */}
            <div className="space-y-4">
                {activities.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                            <p className="text-sm text-muted-foreground">No activity yet</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Add your first note to get started
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    activities.map((activity, index) => (
                        <div key={activity.id} className="flex gap-4">
                            {/* Icon Column */}
                            <div className="flex flex-col items-center">
                                <div className={`p-2 rounded-full bg-background border-2 ${getActivityColor(activity.type)}`}>
                                    {getActivityIcon(activity.type)}
                                </div>
                                {index < activities.length - 1 && (
                                    <div className="w-0.5 flex-1 bg-border mt-2" />
                                )}
                            </div>

                            {/* Content Column */}
                            <Card className="flex-1">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback className="text-xs">
                                                        {activity.performedByName?.charAt(0) || "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium">
                                                    {activity.performedByName || "Unknown User"}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(activity.createdAt.toDate(), { addSuffix: true })}
                                                </span>
                                            </div>

                                            {/* Rich Content */}
                                            <div
                                                className="text-sm mt-2 prose prose-sm max-w-none dark:prose-invert"
                                                dangerouslySetInnerHTML={{ __html: activity.content }}
                                            />

                                            {/* Attachments */}
                                            {activity.attachments && activity.attachments.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {activity.attachments.map((file, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={file.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm hover:bg-muted/80 transition-colors"
                                                        >
                                                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                            <span className="flex-1 truncate">{file.name}</span>
                                                            <Download className="h-4 w-4 text-muted-foreground" />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Metadata */}
                                            {activity.metadata && (
                                                <div className="mt-2 text-xs text-muted-foreground">
                                                    {activity.metadata.field && (
                                                        <span>
                                                            Changed <strong>{activity.metadata.field}</strong>
                                                            {activity.metadata.oldValue && activity.metadata.newValue && (
                                                                <>
                                                                    {" "}from <strong>{activity.metadata.oldValue}</strong> to{" "}
                                                                    <strong>{activity.metadata.newValue}</strong>
                                                                </>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {canEdit && user?.uid === activity.performedBy && activity.type === "note" && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleDeleteActivity(activity.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
