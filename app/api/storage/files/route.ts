import { NextRequest, NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const path = searchParams.get("path") || "attachments"; 
    // Default to attachments, or maybe a general 'media' folder?
    // User might want to see all their uploads.
    
    if (!userId) {
       return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    const bucket = adminStorage.bucket();
    const prefix = `${path}/${userId}/`; 
    
    // List files
    const [files] = await bucket.getFiles({ prefix });

    const fileList = (await Promise.all(
        files.map(async (file) => {
            try {
                const [metadata] = await file.getMetadata();
                const encodedPath = encodeURIComponent(file.name);
                const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

                return {
                    name: file.name.split('/').pop(),
                    fullPath: file.name,
                    contentType: metadata.contentType,
                    size: metadata.size,
                    updated: metadata.updated,
                    url: publicUrl
                };
            } catch (err) {
                logger.warn("Skipping file, failed to get metadata", { module: "storage", action: "list", metadata: { fileName: file.name } });
                return null;
            }
        })
    )).filter(Boolean);
    
    // Filter out directory placeholders if any
    const images = fileList.filter((f): f is NonNullable<typeof f> => f != null && !!f.contentType?.startsWith('image/'));

    return NextResponse.json({ success: true, files: images });

  } catch (error: any) {
    logger.error("Storage list error", { module: "storage", action: "list", error });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
