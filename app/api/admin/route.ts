import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  
  try {
    // 1. Extract Token from Header (or cookies)
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Missing/invalid token", { module: "api", action: "auth", metadata: { ip } });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];

    // 2. Verify Session/Token via Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // 3. Verify Custom Claims/Role
    if (decodedToken.role !== "admin") {
      logger.warn("User attempted admin access", { module: "api", action: "auth", userId: decodedToken.uid });
      return NextResponse.json({ error: "Forbidden: Insufficient privileges" }, { status: 403 });
    }

    // 4. Success Logging & Response
    logger.info("Admin access granted", { module: "api", action: "auth", userId: decodedToken.uid, metadata: { email: decodedToken.email } });
    
    return NextResponse.json({
      success: true,
      message: "Welcome to the Admin Dashboard",
      data: { uid: decodedToken.uid, email: decodedToken.email }
    }, { status: 200 });

  } catch (error: any) {
    logger.error("Failed token verification", { module: "api", action: "auth", error });
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}
