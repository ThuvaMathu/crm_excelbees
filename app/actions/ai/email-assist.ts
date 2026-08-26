"use server";

import { generateText, extractJSON } from "@/lib/gemini/parse";
import { GEMINI_CONFIG } from "@/lib/gemini/config";
import { PROMPTS } from "@/lib/gemini/prompts";
import { aiUnavailable, aiAccessDenied } from "@/lib/gemini/guard";
import { logAI } from "@/lib/logger";
import type { AIResult, EmailDraft } from "@/types/gemini";

export async function draftEmail(params: {
  prompt: string;
  recipientName?: string;
  companyName?: string;
  context?: string;
  tone?: "professional" | "friendly" | "urgent";
}): Promise<AIResult<EmailDraft>> {
  const guard = aiUnavailable<EmailDraft>({} as EmailDraft);
  if (guard) return guard;
  const accessDenied = await aiAccessDenied<EmailDraft>({} as EmailDraft);
  if (accessDenied) return accessDenied;

  const start = Date.now();
  const contextStr = [
    params.recipientName && `Recipient: ${params.recipientName}`,
    params.companyName && `Company: ${params.companyName}`,
    params.tone && `Desired tone: ${params.tone}`,
    params.context && `Additional context: ${params.context}`,
  ].filter(Boolean).join("\n");

  try {
    const result = await generateText({
      prompt: PROMPTS.emailDraft(params.prompt, contextStr),
      temperature: GEMINI_CONFIG.textGeneration.temperature,
      model: GEMINI_CONFIG.textGeneration.model,
      jsonMode: true,
    });

    if (!result) {
      return { success: false, error: "Failed to generate email", data: null };
    }

    const parsed = extractJSON<EmailDraft>(result);
    if (!parsed || !parsed.subject || !parsed.body) {
      return { success: false, error: "Invalid AI response format", data: null };
    }

    logAI("emailDraft", { success: true, latencyMs: Date.now() - start });
    return { success: true, data: parsed, error: null };
  } catch (error) {
    logAI("emailDraft", { success: false, latencyMs: Date.now() - start, error: String(error) });
    return { success: false, error: "Email drafting failed", data: null };
  }
}

export async function suggestSubjectLines(params: {
  body: string;
  recipientName?: string;
}): Promise<AIResult<string[]>> {
  const guard = aiUnavailable<string[]>([]);
  if (guard) return guard;
  const accessDenied = await aiAccessDenied<string[]>([]);
  if (accessDenied) return accessDenied;

  const start = Date.now();

  try {
    const result = await generateText({
      prompt: `Generate 5 concise email subject lines for this email. Return as a JSON array of strings.\n\nRecipient: ${params.recipientName || "Unknown"}\nEmail body: ${params.body.substring(0, 500)}`,
      temperature: 0.8,
      jsonMode: true,
    });

    if (!result) {
      return { success: false, error: "Failed to generate subjects", data: null };
    }

    const parsed = extractJSON<string[]>(result);
    if (!Array.isArray(parsed)) {
      return { success: false, error: "Invalid response", data: null };
    }

    logAI("subjectLines", { success: true, latencyMs: Date.now() - start });
    return { success: true, data: parsed.slice(0, 5), error: null };
  } catch (error) {
    logAI("subjectLines", { success: false, latencyMs: Date.now() - start, error: String(error) });
    return { success: false, error: "Subject generation failed", data: null };
  }
}
