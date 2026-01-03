"use client";

import { useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface LogoUploaderProps {
    value?: string;
    onChange: (url: string) => void;
}

export function LogoUploader({ value, onChange }: LogoUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | undefined>(value);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size must be less than 2MB");
            return;
        }

        setUploading(true);

        try {
            // Create FormData
            const formData = new FormData();
            formData.append("file", file);

            // Upload to your storage endpoint
            const response = await fetch("/api/upload/logo", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");

            const { url } = await response.json();
            setPreview(url);
            onChange(url);
            toast.success("Logo uploaded successfully");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload logo");
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        setPreview(undefined);
        onChange("");
    };

    return (
        <div className="space-y-3">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4">
                {preview ? (
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-lg border-2 border-muted overflow-hidden bg-muted/10">
                            <img
                                src={preview}
                                alt="Logo preview"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleRemove}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                ) : (
                    <label
                        htmlFor="logo-upload"
                        className={cn(
                            "w-32 h-32 rounded-lg border-2 border-dashed border-muted flex flex-col items-center justify-center cursor-pointer transition-colors",
                            "hover:border-primary hover:bg-primary/5",
                            uploading && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                        {uploading ? (
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                        ) : (
                            <>
                                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                                <span className="text-xs text-muted-foreground text-center px-2">
                                    Click to upload
                                </span>
                            </>
                        )}
                    </label>
                )}
                <div className="flex-1 text-sm text-muted-foreground">
                    <p>Upload your company logo</p>
                    <p className="text-xs">PNG, JPG up to 2MB</p>
                </div>
            </div>
        </div>
    );
}
