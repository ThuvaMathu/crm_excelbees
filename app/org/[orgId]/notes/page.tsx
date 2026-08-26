"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getNotes, createNote, updateNote, deleteNote, toggleNotePin } from "@/lib/firestore/notes";
import { toJsDate } from "@/lib/utils";
import { useOrgStore } from "@/store/org";
import { useAuthStore } from "@/store/auth";
import type { Note } from "@/types/crm";
import { Plus, Search, StickyNote, MoreHorizontal, Pin, PinOff, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { logger } from "@/lib/logger/client";

export default function NotesPage() {
    const params = useParams<{ orgId: string }>();
    const orgId = params.orgId;
    const { currentMember } = useOrgStore();
    const { user } = useAuthStore();
    const base = `/org/${orgId}`;

    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [content, setContent] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchNotes = async () => {
        setLoading(true);
        const { notes: fetched, error } = await getNotes(orgId, searchQuery ? { search: searchQuery } : undefined);
        if (error) logger.error("Notes load error", { module: "notes", action: "fetch", orgId, error });
        setNotes(fetched ?? []);
        setLoading(false);
    };

    useEffect(() => { fetchNotes(); }, [orgId]);

    const handleSearch = () => fetchNotes();

    const openCreate = () => {
        setEditingNote(null);
        setContent("");
        setDialogOpen(true);
    };

    const openEdit = (note: Note) => {
        setEditingNote(note);
        setContent(note.content);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!content.trim()) return;
        setSaving(true);
        if (editingNote) {
            const { error } = await updateNote(editingNote.id, { content }, orgId);
            if (error) toast.error("Failed to update note");
            else { toast.success("Note updated"); fetchNotes(); setDialogOpen(false); }
        } else {
            const { error } = await createNote(
                { content: content.trim() },
                user?.uid || "",
                user?.displayName || user?.email || "",
                orgId
            );
            if (error) toast.error("Failed to create note");
            else { toast.success("Note created"); fetchNotes(); setDialogOpen(false); }
        }
        setSaving(false);
    };

    const handleDelete = async (noteId: string) => {
        const { error } = await deleteNote(noteId, orgId);
        if (error) toast.error("Failed to delete note");
        else { toast.success("Note deleted"); fetchNotes(); }
    };

    const handleTogglePin = async (note: Note) => {
        const { error } = await toggleNotePin(note.id, !note.isPinned, orgId);
        if (error) toast.error("Failed to update note");
        else fetchNotes();
    };

    const pinnedNotes = notes.filter((n) => n.isPinned);
    const unpinnedNotes = notes.filter((n) => !n.isPinned);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Notes"
                breadcrumbs={[{ label: "Dashboard", href: `${base}/dashboard` }, { label: "Notes" }]}
                description="Capture quick notes and memos for your team"
                action={
                    <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />Add Note
                    </Button>
                }
            />

            <Card className="p-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={handleSearch} variant="secondary">Search</Button>
                </div>
            </Card>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <LoadingSpinner size="lg" />
                </div>
            ) : notes.length === 0 ? (
                <EmptyState
                    icon={StickyNote}
                    title="No notes yet"
                    description="Start capturing ideas and memos for your team."
                    action={{ label: "Create Note", onClick: openCreate }}
                />
            ) : (
                <div className="space-y-6">
                    {pinnedNotes.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pinned</p>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {pinnedNotes.map((note) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        onEdit={openEdit}
                                        onDelete={handleDelete}
                                        onTogglePin={handleTogglePin}
                                        canManage={note.ownerId === user?.uid || currentMember?.role === "admin"}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    {unpinnedNotes.length > 0 && (
                        <div>
                            {pinnedNotes.length > 0 && (
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">All Notes</p>
                            )}
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {unpinnedNotes.map((note) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        onEdit={openEdit}
                                        onDelete={handleDelete}
                                        onTogglePin={handleTogglePin}
                                        canManage={note.ownerId === user?.uid || currentMember?.role === "admin"}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingNote ? "Edit Note" : "New Note"}</DialogTitle>
                    </DialogHeader>
                    <Textarea
                        placeholder="Write your note here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={8}
                        className="resize-none"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving || !content.trim()}>
                            {saving ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                            {editingNote ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function NoteCard({
    note,
    onEdit,
    onDelete,
    onTogglePin,
    canManage,
}: {
    note: Note;
    onEdit: (n: Note) => void;
    onDelete: (id: string) => void;
    onTogglePin: (n: Note) => void;
    canManage: boolean;
}) {
    return (
        <Card className={`relative group ${note.isPinned ? "ring-1 ring-primary/40" : ""}`}>
            <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    {note.isPinned && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                    <span className="text-xs text-muted-foreground truncate">
                        {note.ownerName || "Unknown"}
                    </span>
                </div>
                {canManage && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onTogglePin(note)}>
                                {note.isPinned ? (
                                    <><PinOff className="h-4 w-4 mr-2" />Unpin</>
                                ) : (
                                    <><Pin className="h-4 w-4 mr-2" />Pin</>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(note)}>
                                <Pencil className="h-4 w-4 mr-2" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onDelete(note.id)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardHeader>
            <CardContent>
                <p className="text-sm whitespace-pre-wrap line-clamp-6">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-3">
                    {(() => {
                        const d = toJsDate(note.updatedAt) ?? toJsDate(note.createdAt);
                        return d ? format(d, "MMM d, yyyy") : "-";
                    })()}
                </p>
            </CardContent>
        </Card>
    );
}
