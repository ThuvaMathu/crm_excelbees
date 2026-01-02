import { NextRequest, NextResponse } from "next/server";
import { trackEmailOpen } from "@/lib/firestore/emails";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return new NextResponse("Missing ID", { status: 400 });
    }

    // Track the open asynchronously
    // We don't await this to ensure fast response time for the image
    trackEmailOpen(id).catch((err) => 
      console.error(`Failed to track open for email ${id}:`, err)
    );

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
    console.error("Tracking error:", error);
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
