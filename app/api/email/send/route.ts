import { NextRequest, NextResponse } from "next/server";
import { sendEmailWithMergeFields } from "@/lib/email/email-compose-service";
import { verifyApiRequest } from "@/lib/auth/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Email, EmailContext } from "@/types/email";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiRequest(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "Unauthorized" },
        { status: auth.statusCode || 401 }
      );
    }

    const rateLimit = await checkRateLimit("email", auth.user.uid);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { email, context } = await request.json();

    // Validate request
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email data is required" },
        { status: 400 }
      );
    }
    
    const result = await sendEmailWithMergeFields(email, context);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error: any) {
    logger.error("API error", { module: "api", action: "email-send", error });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
