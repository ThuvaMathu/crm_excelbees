"use server";

import { generateText, extractJSON } from "@/lib/gemini/parse";
import { GEMINI_CONFIG } from "@/lib/gemini/config";
import { PROMPTS } from "@/lib/gemini/prompts";
import { aiUnavailable } from "@/lib/gemini/guard";
import { logAI } from "@/lib/logger";
import type { AIResult, MeetingSummary } from "@/types/gemini";

export async function summarizeMeeting(notes: string): Promise<AIResult<MeetingSummary>> {
  const guard = aiUnavailable<MeetingSummary>({} as MeetingSummary);
  if (guard) return guard;

  if (!notes || notes.trim().length < 10) {
    return { success: false, error: "Please provide at least a few sentences of meeting notes", data: null };
  }

  const start = Date.now();

  try {
    const result = await generateText({
      prompt: PROMPTS.meeting(notes),
      temperature: GEMINI_CONFIG.structuredAnalysis.temperature,
      jsonMode: true,
    });

    if (!result) {
      return { success: false, error: "Failed to summarize meeting", data: null };
    }

    const parsed = extractJSON<MeetingSummary>(result);
    if (!parsed || !parsed.summary) {
      return { success: false, error: "Invalid AI response", data: null };
    }

    logAI("meeting", { success: true, latencyMs: Date.now() - start });
    return { success: true, data: parsed, error: null };
  } catch (error) {
    logAI("meeting", { success: false, latencyMs: Date.now() - start, error: String(error) });
    return { success: false, error: "Meeting summarization failed", data: null };
  }
}
