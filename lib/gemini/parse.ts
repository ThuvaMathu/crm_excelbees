import { getGeminiClient } from "./client";
import { GEMINI_CONFIG } from "./config";

interface GenerateOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  model?: string;
  jsonMode?: boolean;
}

export async function generateText(opts: GenerateOptions): Promise<string | null> {
  const client = getGeminiClient();
  if (!client) return null;

  const model = client.getGenerativeModel({
    model: opts.model || GEMINI_CONFIG.textGeneration.model,
    generationConfig: {
      temperature: opts.temperature ?? GEMINI_CONFIG.textGeneration.temperature,
      maxOutputTokens: GEMINI_CONFIG.textGeneration.maxOutputTokens,
      ...(opts.jsonMode ? { responseMimeType: "application/json" as const } : {}),
    },
  });

  const fullPrompt = opts.systemInstruction
    ? `${opts.systemInstruction}\n\n${opts.prompt}`
    : opts.prompt;

  try {
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (error) {
    console.error("[Gemini] Generation failed:", error);
    return null;
  }
}

export function extractJSON<T>(text: string): T | null {
  if (!text) return null;

  let cleaned = text.trim();

  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.substring(start, end + 1)) as T;
      } catch {
        const arrStart = cleaned.indexOf("[");
        const arrEnd = cleaned.lastIndexOf("]");
        if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
          try {
            return JSON.parse(cleaned.substring(arrStart, arrEnd + 1)) as T;
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }
}
