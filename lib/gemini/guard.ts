import { isAIEnabled } from "./client";

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
