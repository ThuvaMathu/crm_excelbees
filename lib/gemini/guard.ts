import { isAIEnabled } from "./client";
import { auth } from "@/lib/auth/server-auth";
import { checkRateLimit } from "@/lib/rate-limit";

export function aiUnavailable<T>(fallback: T) {
  if (!isAIEnabled()) {
    return {
      success: false as const,
      error: "AI features are not configured. Set GEMINI_API_KEY to enable.",
      data: fallback,
    };
  }
  return null;
}

/**
 * Verifies the caller is authenticated and has not exceeded the AI rate
 * limit. AI actions are server actions invoked directly from the client, so
 * unlike API routes they have no auth/rate-limit enforcement unless each
 * action calls this explicitly.
 */
export async function aiAccessDenied<T>(fallback: T) {
  const session = await auth();
  if (!session) {
    return {
      success: false as const,
      error: "Authentication required.",
      data: fallback,
    };
  }

  const { allowed } = await checkRateLimit("ai", session.user.uid);
  if (!allowed) {
    return {
      success: false as const,
      error: "AI request limit reached. Please try again shortly.",
      data: fallback,
    };
  }

  return null;
}
