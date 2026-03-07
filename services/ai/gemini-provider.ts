import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is missing in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export const geminiPro = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
export const geminiFlash = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Helper to execute a prompt against a Gemini model with a strict JSON schema.
 */
export async function generateJSON<T>(
  model: "pro" | "flash",
  systemInstruction: string,
  prompt: string,
  responseSchema: Schema
): Promise<T> {
  const selectedModel = model === "pro" ? geminiPro : geminiFlash;

  // We have to instantiate a new model instance if we want to pass specific generation configs like schema
  // We re-use the underlying genAI instance
  const configuredModel = genAI.getGenerativeModel({
    model: selectedModel.model,
    systemInstruction,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.4, // Match our existing OpenAI default
    },
  });

  const result = await configuredModel.generateContent(prompt);
  const responseText = result.response.text();

  if (!responseText) {
    throw new Error("No response from AI");
  }

  return JSON.parse(responseText) as T;
}

/**
 * Helper to execute a prompt against a Gemini model yielding standard text.
 */
export async function generateText(
  model: "pro" | "flash",
  systemInstruction: string,
  prompt: string,
  maxOutputTokens?: number
): Promise<string> {
  const selectedModel = model === "pro" ? geminiPro : geminiFlash;

  const configuredModel = genAI.getGenerativeModel({
    model: selectedModel.model,
    systemInstruction,
    generationConfig: {
      temperature: 0.7, // Slightly higher for standard text generation
      maxOutputTokens,
    },
  });

  const result = await configuredModel.generateContent(prompt);
  const responseText = result.response.text();

  if (!responseText) {
    throw new Error("No response from AI");
  }

  return responseText;
}

export class GeminiProvider {
  async generateContent(prompt: string, context: any, userId: string, workspaceId: string, feature: string): Promise<string> {
    const model = (feature === "keyword-strategy" || feature === "keyword-clustering" || feature === "keyword-embeddings") ? "flash" : "pro";
    const fullPrompt = context ? `Context: ${typeof context === 'string' ? context : JSON.stringify(context)}\n\nPrompt: ${prompt}` : prompt;
    return generateText(model, "You are a helpful AI assistant.", fullPrompt);
  }
}
