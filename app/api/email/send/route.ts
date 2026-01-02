import { NextRequest, NextResponse } from "next/server";
import { sendEmailWithMergeFields } from "@/lib/email/email-compose-service";
import type { Email, EmailContext } from "@/types/email";

export async function POST(request: NextRequest) {
  try {
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
    console.error("❌ API Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
