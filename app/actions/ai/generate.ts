"use server";

import { generateText } from "@/lib/gemini/parse";
import { GEMINI_CONFIG } from "@/lib/gemini/config";
import { PROMPTS } from "@/lib/gemini/prompts";
import { aiUnavailable, aiAccessDenied } from "@/lib/gemini/guard";
import { logAI } from "@/lib/logger";
import type { AIResult, GenerateOptions } from "@/types/gemini";

const PRESET_INSTRUCTIONS: Record<string, string> = {
  summary: "Write a concise summary",
  details: "Write a detailed description with all relevant information",
  key_points: "Write a list of key points and highlights",
  introduction: "Write a professional introduction",
  overview: "Write a high-level overview",
};

export async function generateContent(
  options: GenerateOptions
): Promise<AIResult<{ text: string | null }>> {
  const guard = aiUnavailable<{ text: string | null }>({ text: null });
  if (guard) return guard;
  const accessDenied = await aiAccessDenied<{ text: string | null }>({ text: null });
  if (accessDenied) return accessDenied;

  const instruction =
    options.preset === "custom"
      ? options.customPrompt || "Write professional content"
      : PRESET_INSTRUCTIONS[options.preset] || "Write professional content";

  const start = Date.now();

  try {
    const result = await generateText({
      prompt: PROMPTS.contentGenerate(
        instruction,
        options.tone,
        options.length,
        options.context,
        options.existingText
      ),
      temperature: GEMINI_CONFIG.textGeneration.temperature,
      model: GEMINI_CONFIG.textGeneration.model,
    });

    if (!result) {
      logAI("generate", { success: false, error: "No response" });
      return { success: false, error: "Failed to generate content", data: null };
    }

    logAI("generate", { success: true, latencyMs: Date.now() - start });
    return { success: true, data: { text: result.trim() }, error: null };
  } catch (error) {
    logAI("generate", { success: false, latencyMs: Date.now() - start, error: String(error) });
    return { success: false, error: "Content generation failed", data: null };
  }
}
