"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Link as LinkIcon,
    Paperclip,
    X,
} from "lucide-react";
import { toast } from "sonner";
import "./rich-text-editor.css";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onSubmit?: () => void;
    onFileSelect?: (files: File[]) => void;
    attachments?: File[];
    onRemoveAttachment?: (index: number) => void;
    disabled?: boolean;
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = "Write something...",
    onSubmit,
    onFileSelect,
    attachments = [],
    onRemoveAttachment,
    disabled = false,
}: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-primary underline",
                },
            }),
        ],
        content: value,
        editable: !disabled,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);
        },
        onBlur: ({ editor }) => {
            // Ensure final state is captured when user leaves editor
            const html = editor.getHTML();
            onChange(html);
        },
        immediatelyRender: false,
    });

    // Sync external changes to editor (e.g., from AI Assistant or templates)
    useEffect(() => {
        if (!editor) return;

        const currentContent = editor.getHTML();
        if (value && value !== currentContent) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [value, editor]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Validate file sizes (max 10MB per file)
        const invalidFiles = files.filter((file) => file.size > 10 * 1024 * 1024);
        if (invalidFiles.length > 0) {
            toast.error("Some files exceed 10MB limit");
            return;
        }

        onFileSelect?.(files);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    const setLink = () => {
        if (!editor) return;

        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL", previousUrl);

        if (url === null) return;

        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    if (!editor) {
        return (
            <div className="min-h-[150px] border rounded-md bg-muted/50 animate-pulse" />
        );
    }

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            <div className="border rounded-md p-2 flex flex-wrap gap-1 bg-muted/30">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run() || disabled}
                    className={editor.isActive("bold") ? "bg-muted" : ""}
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run() || disabled}
                    className={editor.isActive("italic") ? "bg-muted" : ""}
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive("bulletList") ? "bg-muted" : ""}
                    disabled={disabled}
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive("orderedList") ? "bg-muted" : ""}
                    disabled={disabled}
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive("blockquote") ? "bg-muted" : ""}
                    disabled={disabled}
                >
                    <Quote className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={setLink}
                    className={editor.isActive("link") ? "bg-muted" : ""}
                    disabled={disabled}
                >
                    <LinkIcon className="h-4 w-4" />
                </Button>
                <div className="flex-1" />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().chain().focus().undo().run() || disabled}
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().chain().focus().redo().run() || disabled}
                >
                    <Redo className="h-4 w-4" />
                </Button>
            </div>

            {/* Editor */}
            <div className="border rounded-md min-h-[150px] p-3 bg-background">
                <EditorContent editor={editor} />
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
                <div className="space-y-2">
                    {attachments.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{file.name}</span>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                    ({formatFileSize(file.size)})
                                </span>
                            </div>
                            {onRemoveAttachment && !disabled && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 flex-shrink-0"
                                    onClick={() => onRemoveAttachment(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={disabled}
                    />
                    {onFileSelect && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={disabled}
                        >
                            <Paperclip className="h-4 w-4 mr-2" />
                            Attach Files
                        </Button>
                    )}
                </div>

                {onSubmit && (
                    <Button
                        type="button"
                        onClick={onSubmit}
                        disabled={disabled || (!value.trim() && attachments.length === 0)}
                        size="sm"
                    >
                        Post
                    </Button>
                )}
            </div>
        </div>
    );
}
