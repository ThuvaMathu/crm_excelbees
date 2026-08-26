"use server";

import { generateText, extractJSON } from "@/lib/gemini/parse";
import { GEMINI_CONFIG } from "@/lib/gemini/config";
import { PROMPTS } from "@/lib/gemini/prompts";
import { aiUnavailable, aiAccessDenied } from "@/lib/gemini/guard";
import { logAI } from "@/lib/logger";
import type { AIResult, RewriteOptions } from "@/types/gemini";

export async function rewriteText(
  text: string,
  options: RewriteOptions
): Promise<AIResult<{ text: string | null }>> {
  const guard = aiUnavailable<{ text: string | null }>({ text: null });
  if (guard) return guard;
  const accessDenied = await aiAccessDenied<{ text: string | null }>({ text: null });
  if (accessDenied) return accessDenied;

  if (!text || text.trim().length === 0) {
    return { success: false, error: "Input text cannot be empty", data: null };
  }

  const start = Date.now();

  try {
    const result = await generateText({
      prompt: PROMPTS.emailRewrite(text, options.tone, options.goal, options.length),
      temperature: GEMINI_CONFIG.textGeneration.temperature,
      model: GEMINI_CONFIG.textGeneration.model,
    });

    if (!result) {
      logAI("rewrite", { success: false, error: "No response" });
      return { success: false, error: "Failed to rewrite text", data: null };
    }

    logAI("rewrite", { success: true, latencyMs: Date.now() - start });
    return { success: true, data: { text: result.trim() }, error: null };
  } catch (error) {
    logAI("rewrite", { success: false, latencyMs: Date.now() - start, error: String(error) });
    return { success: false, error: "Rewrite failed", data: null };
  }
}
