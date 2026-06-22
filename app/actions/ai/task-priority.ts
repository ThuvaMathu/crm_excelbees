"use server";

import { generateText, extractJSON } from "@/lib/gemini/parse";
import { GEMINI_CONFIG } from "@/lib/gemini/config";
import { PROMPTS } from "@/lib/gemini/prompts";
import { aiUnavailable } from "@/lib/gemini/guard";
import { logAI } from "@/lib/logger";
import type { AIResult, TaskPrioritySuggestion } from "@/types/gemini";
import { getTasks } from "@/lib/firestore/tasks";

export async function prioritizeTasks(userId: string): Promise<AIResult<TaskPrioritySuggestion[]>> {
  const guard = aiUnavailable<TaskPrioritySuggestion[]>([]);
  if (guard) return guard;

  const start = Date.now();

  try {
    const { tasks = [] } = await getTasks({ isArchived: false });

    const pending = tasks.filter((t: any) => t.status !== "Done");

    if (pending.length === 0) {
      return { success: true, data: [], error: null };
    }

    const tasksForAI = pending.map((t: any) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate?.toDate?.()?.toISOString() || null,
      projectName: t.projectName,
      relatedTo: t.relatedTo,
    }));

    const result = await generateText({
      prompt: PROMPTS.taskPriority(JSON.stringify(tasksForAI.slice(0, 50))),
      temperature: GEMINI_CONFIG.structuredAnalysis.temperature,
      jsonMode: true,
    });

    if (!result) {
      return { success: false, error: "Failed to prioritize tasks", data: null };
    }

    const parsed = extractJSON<TaskPrioritySuggestion[]>(result);
    if (!Array.isArray(parsed)) {
      return { success: false, error: "Invalid AI response", data: null };
    }

    logAI("taskPriority", { success: true, latencyMs: Date.now() - start });
    return { success: true, data: parsed, error: null };
  } catch (error) {
    logAI("taskPriority", { success: false, latencyMs: Date.now() - start, error: String(error) });
    return { success: false, error: "Task prioritization failed", data: null };
  }
}
