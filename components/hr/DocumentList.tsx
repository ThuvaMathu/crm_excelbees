"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    FileText,
    Download,
    Trash2,
    ExternalLink,
    FileIcon,
    FileType,
} from "lucide-react";
import { removeEmployeeDocument } from "@/lib/firestore/hr";
import { ref, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";

interface Document {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: any;
}

interface DocumentListProps {
    userId: string;
    documents: Document[];
    onRefresh: () => void;
    canDelete?: boolean;
}

export function DocumentList({ userId, documents, onRefresh, canDelete = false }: DocumentListProps) {
    const [deleting, setDeleting] = useState<string | null>(null);
    const [docToDelete, setDocToDelete] = useState<Document | null>(null);

    const handleDelete = async () => {
        if (!docToDelete) return;

        setDeleting(docToDelete.id);
        try {
            // 1. Delete from Storage
            try {
                const decodedUrl = decodeURIComponent(docToDelete.url.split("/o/")[1].split("?")[0]);
                const storageRef = ref(storage, decodedUrl);
                await deleteObject(storageRef);
            } catch (err) {
                console.warn("Could not delete from storage, might be already gone:", err);
            }

            // 2. Delete from Firestore
            const result = await removeEmployeeDocument(userId, docToDelete.id);

            if (result.success) {
                toast.success("Document deleted");
                onRefresh();
            } else {
                toast.error("Failed to remove record: " + result.error);
            }
        } catch (error: any) {
            toast.error("Error deleting document: " + error.message);
        } finally {
            setDeleting(null);
            setDocToDelete(null);
        }
    };

    const getFileIcon = (type: string) => {
        if (type.includes("pdf")) return <FileText className="h-8 w-8 text-red-500" />;
        if (type.includes("image")) return <FileIcon className="h-8 w-8 text-blue-500" />;
        if (type.includes("word") || type.includes("officedocument")) return <FileText className="h-8 w-8 text-blue-700" />;
        return <FileType className="h-8 w-8 text-gray-500" />;
    };

    if (documents.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg border-dashed">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No documents uploaded</h3>
                <p className="text-muted-foreground">Upload contracts, IDs, or other relevant files.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                    <Card key={doc.id} className="p-4 flex flex-col gap-4 relative group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {getFileIcon(doc.type)}
                                <div className="overflow-hidden">
                                    <p className="font-medium text-sm truncate" title={doc.name}>
                                        {doc.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {(doc.size / 1024 / 1024).toFixed(2)} MB •{" "}
                                        {doc.uploadedAt ? format(doc.uploadedAt.toDate(), "MMM d, yyyy") : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-auto pt-2 border-t">
                            <Button size="icon" variant="ghost" asChild title="View">
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                            <Button size="icon" variant="ghost" asChild title="Download">
                                <a href={doc.url} download={doc.name}>
                                    <Download className="h-4 w-4" />
                                </a>
                            </Button>
                            {canDelete && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => setDocToDelete(doc)}
                                    disabled={deleting === doc.id}
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            <Dialog open={!!docToDelete} onOpenChange={(open: boolean) => !open && setDocToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete the document "<strong>{docToDelete?.name}</strong>" from both storage and the employee record.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting === docToDelete?.id}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
