"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Upload, X, FileText, CheckCircle2 } from "lucide-react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { addEmployeeDocument } from "@/lib/firestore/hr";
import { toast } from "sonner";

interface DocumentUploadProps {
    userId: string;
    onSuccess: () => void;
}

export function DocumentUpload({ userId, onSuccess }: DocumentUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > 20 * 1024 * 1024) {
                toast.error("File size exceeds 20MB limit");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file || !userId) return;

        setUploading(true);
        setProgress(0);

        try {
            const fileName = `${Date.now()}_${file.name}`;
            const storageRef = ref(storage, `documents/${userId}/${fileName}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(p);
                },
                (error) => {
                    console.error("Upload error:", error);
                    toast.error("Failed to upload to storage: " + error.message);
                    setUploading(false);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    // Save metadata to Firestore
                    const result = await addEmployeeDocument(userId, {
                        name: file.name,
                        url: downloadURL,
                        type: file.type,
                        size: file.size,
                    });

                    if (result.success) {
                        toast.success("Document uploaded successfully");
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        onSuccess();
                    } else {
                        toast.error("Failed to save document info: " + result.error);
                    }
                    setUploading(false);
                }
            );
        } catch (error: any) {
            toast.error("Upload failed: " + error.message);
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="flex flex-col gap-2">
                <Label htmlFor="doc-upload" className="text-sm font-medium">
                    Upload New Document
                </Label>
                <div className="flex items-center gap-2">
                    <Input
                        id="doc-upload"
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="flex-1"
                        disabled={uploading}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    {file && !uploading && (
                        <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    Max size: 20MB. Accepted: PDF, Word, Images.
                </p>
            </div>

            {file && (
                <div className="flex items-center justify-between p-2 bg-background rounded border text-sm">
                    <div className="flex items-center gap-2 truncate">
                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                    </div>
                    <Button
                        size="sm"
                        onClick={handleUpload}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                            <Upload className="h-4 w-4 mr-2" />
                        )}
                        {uploading ? `Uploading ${progress.toFixed(0)}%` : "Upload"}
                    </Button>
                </div>
            )}
        </div>
    );
}
