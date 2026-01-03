import { NextRequest, NextResponse } from "next/server";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 2MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `logos/${timestamp}-${file.name}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Firebase Storage
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    });

    // Get download URL
    const url = await getDownloadURL(storageRef);

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
