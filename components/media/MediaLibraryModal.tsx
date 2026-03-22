import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Image as ImageIcon, FileIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface MediaLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string, alt: string) => void;
}

interface StorageFile {
    name: string;
    url: string;
    contentType: string;
    size: number;
}

export function MediaLibraryModal({ isOpen, onClose, onSelect }: MediaLibraryModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<StorageFile[]>([]);

    useEffect(() => {
        if (isOpen && user) {
            loadFiles();
        }
    }, [isOpen, user]);

    const loadFiles = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/storage/files?userId=${user?.uid}`);
            const data = await response.json();
            if (data.success) {
                setFiles(data.files);
            } else {
                toast.error("Failed to load images");
            }
        } catch (error) {
            toast.error("Error loading library");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Media Library</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : files.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No images found in your storage.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {files.map((file) => (
                                <div
                                    key={file.url}
                                    className="group relative border rounded-lg overflow-hidden cursor-pointer hover:ring-2 ring-primary aspect-square"
                                    onClick={() => {
                                        onSelect(file.url, file.name);
                                        onClose();
                                    }}
                                >
                                    <img
                                        src={file.url}
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                            const target = e.currentTarget;
                                            target.style.display = "none";
                                            const parent = target.parentElement;
                                            if (parent && !parent.querySelector('.fallback-icon')) {
                                                const fallback = document.createElement("div");
                                                fallback.className = "fallback-icon w-full h-full flex items-center justify-center bg-muted text-muted-foreground";
                                                fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                                parent.insertBefore(fallback, parent.firstChild);
                                            }
                                        }}
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                                        {file.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
