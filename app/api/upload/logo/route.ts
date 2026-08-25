import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    // This route previously had NO auth check at all — any caller could
    // upload arbitrary files to a flat, unscoped storage path. Now gated
    // to active org admins only, matching who's allowed to change the
    // logo (see app/org/[orgId]/settings/invoices/page.tsx).
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(idToken);

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const orgId = formData.get("orgId") as string;

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    const memberDoc = await adminDb.collection("organization_members").doc(`${orgId}_${decoded.uid}`).get();
    const member = memberDoc.data();
    if (!memberDoc.exists || member?.status !== "active" || member?.role !== "admin") {
      logger.warn("Logo upload rejected — not an org admin", { module: "storage", action: "upload-logo", metadata: { orgId, uid: decoded.uid } });
      return NextResponse.json({ error: "Only an org admin can upload the company logo" }, { status: 403 });
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 2MB" }, { status: 400 });
    }

    // This path must match storage.rules' `organizations/{orgId}/logo/{fileName}`
    // (public read, org-admin write) — a purpose-built rule for exactly
    // this that already existed. An earlier version of this route used
    // `logos/org/{orgId}/...`, which doesn't match that rule OR the
    // flat single-segment `logos/{fileName}` rule, so it fell through to
    // the security rules' deny-all catch-all: the Admin SDK upload here
    // still succeeded (Admin SDK bypasses rules entirely), but the
    // browser's later unauthenticated read of the "public" URL was
    // silently rejected — which is why the logo never rendered in the PDF.
    const timestamp = Date.now();
    const filePath = `organizations/${orgId}/logo/${timestamp}-${file.name}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = adminStorage.bucket();
    const storageFile = bucket.file(filePath);
    await storageFile.save(buffer, { metadata: { contentType: file.type } });
    // No makePublic() needed — storage.rules already grants public read on
    // this exact path (GCS ACLs are a separate mechanism from Firebase
    // Storage Security Rules and don't govern the firebasestorage.googleapis.com
    // REST endpoint used below).

    const encodedPath = encodeURIComponent(filePath);
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;

    logger.info("Logo uploaded", { module: "storage", action: "upload-logo", metadata: { orgId, filePath } });
    return NextResponse.json({ url });
  } catch (error: any) {
    logger.error("Logo upload error", { module: "storage", action: "upload-logo", error });
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
