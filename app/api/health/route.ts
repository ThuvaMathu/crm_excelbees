import { NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini/client";
import { Redis } from "@upstash/redis";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; message?: string }> = {};

  // Check Firebase
  try {
    await adminDb.collection("health").doc("check").get();
    checks.firestore = { status: "ok" };
  } catch (error) {
    checks.firestore = { status: "error", message: String(error) };
  }

  // Check Redis
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    });
    await redis.ping();
    checks.redis = { status: "ok" };
  } catch (error) {
    checks.redis = { status: "error", message: String(error) };
  }

  // Check Gemini config (just check env var, don't make API call)
  const geminiClient = getGeminiClient();
  checks.gemini = {
    status: geminiClient ? "ok" : "error",
    message: geminiClient ? undefined : "GEMINI_API_KEY not configured",
  };

  // Check SMTP env vars
  checks.smtp = {
    status: process.env.SMTP_HOST ? "ok" : "error",
    message: process.env.SMTP_HOST ? undefined : "SMTP_HOST not configured",
  };

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json({
    status: allOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  });
}
