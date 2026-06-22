"use server";

import { generateText, extractJSON } from "@/lib/gemini/parse";
import { GEMINI_CONFIG } from "@/lib/gemini/config";
import { PROMPTS } from "@/lib/gemini/prompts";
import { aiUnavailable } from "@/lib/gemini/guard";
import { logAI } from "@/lib/logger";
import type { AIResult, FollowUpSuggestion } from "@/types/gemini";
import { adminDb } from "@/lib/firebase-admin";

export async function getFollowUpSuggestions(
  userId: string
): Promise<AIResult<FollowUpSuggestion[]>> {
  const guard = aiUnavailable<FollowUpSuggestion[]>([]);
  if (guard) return guard;

  const start = Date.now();

  try {
    const [leadsSnap, dealsSnap, contactsSnap] = await Promise.all([
      adminDb.collection("leads").where("ownerId", "==", userId).get(),
      adminDb.collection("deals").where("ownerId", "==", userId).get(),
      adminDb.collection("contacts").where("ownerId", "==", userId).get(),
    ]);

    const leads = leadsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const deals = dealsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const contacts = contactsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const entities = [
      ...leads.map((l: any) => ({
        id: l.id,
        type: "lead",
        name: `${l.firstName || ""} ${l.lastName || ""}`.trim(),
        status: l.status,
        value: l.value,
        lastContactedAt: l.lastContactedAt?._seconds
          ? new Date(l.lastContactedAt._seconds * 1000).toISOString()
          : null,
        createdAt: l.createdAt?._seconds
          ? new Date(l.createdAt._seconds * 1000).toISOString()
          : null,
      })),
      ...deals
        .filter((d: any) => !d.archived && d.stage !== "Won" && d.stage !== "Lost")
        .map((d: any) => ({
          id: d.id,
          type: "deal",
          name: d.title,
          status: d.stage,
          value: d.value,
          closeDate: d.closeDate?._seconds
            ? new Date(d.closeDate._seconds * 1000).toISOString()
            : null,
          updatedAt: d.updatedAt?._seconds
            ? new Date(d.updatedAt._seconds * 1000).toISOString()
            : null,
        })),
      ...contacts
        .filter((c: any) => c.lastContactedAt)
        .map((c: any) => ({
          id: c.id,
          type: "contact",
          name: `${c.firstName || ""} ${c.lastName || ""}`.trim(),
          lastContactedAt: c.lastContactedAt?._seconds
            ? new Date(c.lastContactedAt._seconds * 1000).toISOString()
            : null,
        })),
    ];

    if (entities.length === 0) {
      return { success: true, data: [], error: null };
    }

    const result = await generateText({
      prompt: PROMPTS.followUp(JSON.stringify(entities.slice(0, 60), null, 2)),
      temperature: GEMINI_CONFIG.structuredAnalysis.temperature,
      jsonMode: true,
    });

    if (!result) {
      return { success: false, error: "Failed to generate suggestions", data: null };
    }

    const parsed = extractJSON<FollowUpSuggestion[]>(result);
    if (!Array.isArray(parsed)) {
      return { success: false, error: "Invalid AI response", data: null };
    }

    logAI("followUp", { success: true, latencyMs: Date.now() - start });
    return { success: true, data: parsed.slice(0, 8), error: null };
  } catch (error) {
    logAI("followUp", { success: false, latencyMs: Date.now() - start, error: String(error) });
    return { success: false, error: "Follow-up analysis failed", data: null };
  }
}
