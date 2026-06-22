"use server";

import { generateText, extractJSON } from "@/lib/gemini/parse";
import { GEMINI_CONFIG } from "@/lib/gemini/config";
import { PROMPTS } from "@/lib/gemini/prompts";
import { aiUnavailable } from "@/lib/gemini/guard";
import { logAI } from "@/lib/logger";
import type { AIResult, LeadScore } from "@/types/gemini";
import { getLead } from "@/lib/firestore/leads";
import { updateLead } from "@/lib/firestore/leads";

function serializeLead(lead: any): string {
  return JSON.stringify({
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    companyName: lead.companyName,
    jobTitle: lead.jobTitle,
    status: lead.status,
    source: lead.source,
    value: lead.value,
    lastContactedAt: lead.lastContactedAt?.toDate?.()?.toISOString() || null,
    notes: lead.notes,
    createdAt: lead.createdAt?.toDate?.()?.toISOString() || null,
  });
}

export async function scoreLead(leadId: string): Promise<AIResult<LeadScore>> {
  const guard = aiUnavailable<LeadScore>({} as LeadScore);
  if (guard) return guard;

  const start = Date.now();

  try {
    const lead = await getLead(leadId);
    if (!lead) {
      return { success: false, error: "Lead not found", data: null };
    }

    const leadJson = serializeLead(lead);
    const result = await generateText({
      prompt: PROMPTS.leadScore(leadJson),
      temperature: GEMINI_CONFIG.structuredAnalysis.temperature,
      jsonMode: true,
    });

    if (!result) {
      return { success: false, error: "Failed to analyze lead", data: null };
    }

    const parsed = extractJSON<LeadScore>(result);
    if (!parsed || typeof parsed.score !== "number") {
      return { success: false, error: "Invalid AI response", data: null };
    }

    await updateLead(leadId, {
      aiScore: parsed.score,
      aiReasoning: parsed.reasoning,
      aiLastUpdated: new Date() as any,
    } as any).catch(() => {});

    logAI("leadScore", { success: true, latencyMs: Date.now() - start });
    return { success: true, data: parsed, error: null };
  } catch (error) {
    logAI("leadScore", { success: false, latencyMs: Date.now() - start, error: String(error) });
    return { success: false, error: "Lead analysis failed", data: null };
  }
}
