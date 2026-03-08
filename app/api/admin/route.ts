import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  
  try {
    // 1. Extract Token from Header (or cookies)
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn(`[AUTH FAIL] Missing/Invalid token from IP: ${ip}`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];

    // 2. Verify Session/Token via Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // 3. Verify Custom Claims/Role
    if (decodedToken.role !== "admin") {
      console.warn(`[AUTH FORBIDDEN] User ${decodedToken.uid} attempted admin access.`);
      return NextResponse.json({ error: "Forbidden: Insufficient privileges" }, { status: 403 });
    }

    // 4. Success Logging & Response
    console.info(`[AUTH SUCCESS] Admin access granted to ${decodedToken.email}`);
    
    return NextResponse.json({
      success: true,
      message: "Welcome to the Admin Dashboard",
      data: { uid: decodedToken.uid, email: decodedToken.email }
    }, { status: 200 });

  } catch (error: any) {
    console.error(`[AUTH ERROR] Failed token verification: ${error.message}`);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}
