import { NextRequest, NextResponse } from "next/server";
import { trackEmailOpen } from "@/lib/firestore/emails";
import { verifySignedValue } from "@/lib/crypto";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sig = request.nextUrl.searchParams.get("sig");

    if (!id) {
      return new NextResponse("Missing ID", { status: 400 });
    }

    // Only track opens for pixel URLs we actually generated (signed at
    // send time) — the raw Firestore doc ID alone shouldn't be sufficient
    // to mutate another email's tracking counters.
    if (sig && verifySignedValue(`open:${id}`, sig)) {
      // Track the open asynchronously
      // We don't await this to ensure fast response time for the image
      trackEmailOpen(id).catch((err) =>
        logger.error("Failed to track open", { module: "email", action: "track-open", metadata: { emailId: id }, error: err })
      );
    }

    // Return a 1x1 transparent GIF
    // This is the standard "tracking pixel"
    const transparentGif = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );

    return new NextResponse(transparentGif, {
      headers: {
        "Content-Type": "image/gif",
        "Content-Length": transparentGif.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
      status: 200,
    });
  } catch (error) {
    logger.error("Tracking error", { module: "email", action: "track-open", error });
    // Even on error, return the image so the user doesn't see a broken image icon
    const transparentGif = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    return new NextResponse(transparentGif, { 
      headers: { "Content-Type": "image/gif" },
      status: 200 
    });
  }
}
