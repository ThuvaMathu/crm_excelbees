"use server";

import { generateText, extractJSON } from "@/lib/gemini/parse";
import { GEMINI_CONFIG } from "@/lib/gemini/config";
import { PROMPTS } from "@/lib/gemini/prompts";
import { aiUnavailable, aiAccessDenied } from "@/lib/gemini/guard";
import { logAI } from "@/lib/logger";
import type { AIResult, ReportInsight } from "@/types/gemini";

export async function generateReportInsight(
  query: string,
  context: Record<string, unknown>
): Promise<AIResult<ReportInsight>> {
  const guard = aiUnavailable<ReportInsight>({} as ReportInsight);
  if (guard) return guard;
  const accessDenied = await aiAccessDenied<ReportInsight>({} as ReportInsight);
  if (accessDenied) return accessDenied;

  const start = Date.now();

  try {
    const result = await generateText({
      prompt: PROMPTS.reportInsight(query, JSON.stringify(context, null, 2)),
      temperature: GEMINI_CONFIG.structuredAnalysis.temperature,
      jsonMode: true,
    });

    if (!result) {
      return { success: false, error: "Failed to generate insights", data: null };
    }

    const parsed = extractJSON<ReportInsight>(result);
    if (!parsed || !parsed.summary) {
      return { success: false, error: "Invalid AI response", data: null };
    }

    logAI("reportInsight", { success: true, latencyMs: Date.now() - start });
    return { success: true, data: parsed, error: null };
  } catch (error) {
    logAI("reportInsight", { success: false, latencyMs: Date.now() - start, error: String(error) });
    return { success: false, error: "Report analysis failed", data: null };
  }
}
