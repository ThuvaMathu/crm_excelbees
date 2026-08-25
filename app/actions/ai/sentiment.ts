"use server";

import { generateText, extractJSON } from "@/lib/gemini/parse";
import { GEMINI_CONFIG } from "@/lib/gemini/config";
import { PROMPTS } from "@/lib/gemini/prompts";
import { aiUnavailable, aiAccessDenied } from "@/lib/gemini/guard";
import { logAI } from "@/lib/logger";
import type { AIResult, SentimentAnalysis } from "@/types/gemini";
import { adminDb } from "@/lib/firebase-admin";

export async function analyzeCommunication(
  entityType: "lead" | "contact" | "company",
  entityId: string
): Promise<AIResult<SentimentAnalysis>> {
  const guard = aiUnavailable<SentimentAnalysis>({} as SentimentAnalysis);
  if (guard) return guard;
  const accessDenied = await aiAccessDenied<SentimentAnalysis>({} as SentimentAnalysis);
  if (accessDenied) return accessDenied;

  const start = Date.now();

  try {
    const collectionMap = { lead: "leads", contact: "contacts", company: "companies" };
    const collection = collectionMap[entityType];

    const activitiesSnapshot = await adminDb
      .collection("activities")
      .where("relatedTo.id", "==", entityId)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get()
      .catch(() => ({ docs: [] as any[] }));

    const activities = activitiesSnapshot.docs
      .map((d) => d.data())
      .map((a) => `[${a.type}] ${a.content || a.description || ""}`)
      .join("\n");

    if (!activities.trim()) {
      return {
        success: true,
        data: {
          sentiment: "neutral",
          score: 0,
          keyTopics: [],
          summary: "No communication history found yet.",
          actionItems: [],
        },
        error: null,
      };
    }

    const result = await generateText({
      prompt: PROMPTS.sentiment(activities),
      temperature: GEMINI_CONFIG.structuredAnalysis.temperature,
      jsonMode: true,
    });

    if (!result) {
      return { success: false, error: "Failed to analyze communications", data: null };
    }

    const parsed = extractJSON<SentimentAnalysis>(result);
    if (!parsed || typeof parsed.score !== "number") {
      return { success: false, error: "Invalid AI response", data: null };
    }

    logAI("sentiment", { success: true, latencyMs: Date.now() - start });
    return { success: true, data: parsed, error: null };
  } catch (error) {
    logAI("sentiment", { success: false, latencyMs: Date.now() - start, error: String(error) });
    return { success: false, error: "Sentiment analysis failed", data: null };
  }
}
