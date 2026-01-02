import { NextRequest, NextResponse } from "next/server";
import { trackEmailClick } from "@/lib/firestore/emails";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const emailId = searchParams.get("id");
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return new NextResponse("Missing URL", { status: 400 });
    }

    // Always redirect to the target URL, even if tracking fails
    // We want to ensure the user experience is not disrupted
    
    if (emailId) {
      // Track the click asynchronously
      trackEmailClick(emailId).catch((err) => 
        console.error(`Failed to track click for email ${emailId}:`, err)
      );
    }

    // Use 307 Temporary Redirect to preserve method and body if any
    // though for email links it's usually GET
    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error("Click tracking error:", error);
    // Try to recover by redirecting if we have the URL
    const targetUrl = request.nextUrl.searchParams.get("url");
    if (targetUrl) {
      return NextResponse.redirect(targetUrl);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
