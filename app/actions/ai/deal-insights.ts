"use server";

import { generateText, extractJSON } from "@/lib/gemini/parse";
import { GEMINI_CONFIG } from "@/lib/gemini/config";
import { PROMPTS } from "@/lib/gemini/prompts";
import { aiUnavailable, aiAccessDenied } from "@/lib/gemini/guard";
import { logAI } from "@/lib/logger";
import type { AIResult, DealInsight } from "@/types/gemini";
import { adminDb } from "@/lib/firebase-admin";

function serializeDeal(deal: any): string {
  return JSON.stringify({
    title: deal.title,
    stage: deal.stage,
    value: deal.value,
    probability: deal.probability,
    companyName: deal.companyName,
    closeDate: deal.closeDate?._seconds
      ? new Date(deal.closeDate._seconds * 1000).toISOString()
      : deal.closeDate?.toDate?.()?.toISOString() || null,
    createdAt: deal.createdAt?._seconds
      ? new Date(deal.createdAt._seconds * 1000).toISOString()
      : deal.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: deal.updatedAt?._seconds
      ? new Date(deal.updatedAt._seconds * 1000).toISOString()
      : deal.updatedAt?.toDate?.()?.toISOString() || null,
    archived: deal.archived,
  });
}

export async function analyzeDeal(dealId: string): Promise<AIResult<DealInsight>> {
  const guard = aiUnavailable<DealInsight>({} as DealInsight);
  if (guard) return guard;
  const accessDenied = await aiAccessDenied<DealInsight>({} as DealInsight);
  if (accessDenied) return accessDenied;

  const start = Date.now();

  try {
    const dealDoc = await adminDb.collection("deals").doc(dealId).get();
    if (!dealDoc.exists) {
      return { success: false, error: "Deal not found", data: null };
    }

    const deal = { id: dealDoc.id, ...dealDoc.data() };

    const activitiesSnapshot = await adminDb
      .collection("activities")
      .where("relatedTo.id", "==", dealId)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get()
      .catch(() => ({ docs: [] as any[] }));

    const activities = activitiesSnapshot.docs
      .map((d) => d.data())
      .map((a) => `${a.type}: ${a.content?.substring(0, 200) || ""}`)
      .join("\n");

    const result = await generateText({
      prompt: PROMPTS.dealInsight(serializeDeal(deal), activities),
      temperature: GEMINI_CONFIG.structuredAnalysis.temperature,
      jsonMode: true,
    });

    if (!result) {
      return { success: false, error: "Failed to analyze deal", data: null };
    }

    const parsed = extractJSON<DealInsight>(result);
    if (!parsed || typeof parsed.winProbability !== "number") {
      return { success: false, error: "Invalid AI response", data: null };
    }

    logAI("dealInsight", { success: true, latencyMs: Date.now() - start });
    return { success: true, data: parsed, error: null };
  } catch (error) {
    logAI("dealInsight", { success: false, latencyMs: Date.now() - start, error: String(error) });
    return { success: false, error: "Deal analysis failed", data: null };
  }
}
