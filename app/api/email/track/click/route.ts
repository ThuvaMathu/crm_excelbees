import { NextRequest, NextResponse } from "next/server";
import { trackEmailClick } from "@/lib/firestore/emails";
import { verifySignedValue } from "@/lib/crypto";
import { logger } from "@/lib/logger";

function isSafeRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const emailId = searchParams.get("id");
    const targetUrl = searchParams.get("url");
    const sig = searchParams.get("sig");

    if (!targetUrl) {
      return new NextResponse("Missing URL", { status: 400 });
    }

    // Only allow redirecting to URLs we generated ourselves (signed at
    // link-rewrite time) and only to http(s) targets, to prevent this
    // endpoint from being used as an open redirect / phishing vector.
    if (!emailId || !sig || !verifySignedValue(`${emailId}:${targetUrl}`, sig)) {
      return new NextResponse("Invalid or missing signature", { status: 400 });
    }

    if (!isSafeRedirectUrl(targetUrl)) {
      return new NextResponse("Unsupported URL scheme", { status: 400 });
    }

    // Track the click asynchronously
    trackEmailClick(emailId).catch((err) =>
      logger.error("Failed to track click", { module: "email", action: "track-click", metadata: { emailId }, error: err })
    );

    return NextResponse.redirect(targetUrl);
  } catch (error) {
    logger.error("Click tracking error", { module: "email", action: "track-click", error });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
