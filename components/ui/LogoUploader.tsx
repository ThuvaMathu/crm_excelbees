"use client";

import { useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { logger } from "@/lib/logger/client";

interface LogoUploaderProps {
    value?: string;
    onChange: (url: string) => void;
    /** Required to scope the upload to an org and authorize it server-side. */
    orgId: string;
}

// Matches the PDF generator's addImage() box (40mm x 20mm = 2:1 ratio, see
// lib/pdf/invoice-generator.ts) scaled up to a print-quality pixel size, so
// a logo uploaded at this size renders crisp and undistorted on invoices.
const RECOMMENDED_SIZE_TEXT = "Recommended: 480 × 240px (2:1 ratio), PNG with transparent background, max 2MB";

export function LogoUploader({ value, onChange, orgId }: LogoUploaderProps) {
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

        // Soft aspect-ratio check — logo renders in a fixed 2:1 box on the
        // PDF, so a very different ratio will look stretched. This warns
        // but never blocks the upload, since minor deviations are fine.
        try {
            const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve({ w: img.width, h: img.height });
                img.onerror = reject;
                img.src = URL.createObjectURL(file);
            });
            const ratio = dims.w / dims.h;
            if (ratio < 1.3 || ratio > 3) {
                toast.warning("This logo isn't close to the recommended 2:1 ratio — it may look stretched on invoices.");
            }
        } catch {
            // Non-critical — proceed with upload even if dimension probing fails.
        }

        setUploading(true);

        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error("Not authenticated");

            const formData = new FormData();
            formData.append("file", file);
            formData.append("orgId", orgId);

            const response = await fetch("/api/upload/logo", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(body.error || "Upload failed");
            }

            const { url } = await response.json();
            setPreview(url);
            onChange(url);
            toast.success("Logo uploaded successfully");
        } catch (error: any) {
            logger.error("Logo upload error", { module: "settings", action: "upload", error });
            toast.error(error.message || "Failed to upload logo");
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
                    <p className="text-xs">{RECOMMENDED_SIZE_TEXT}</p>
                </div>
            </div>
        </div>
    );
}
