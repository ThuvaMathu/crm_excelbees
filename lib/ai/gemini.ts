import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { AICompletionRequest, AICompletionResponse, AIService } from "./types";

const API_KEY = process.env.GEMINI_API_KEY || "";
export const geminiClient = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Simple genAI function for agentic keyword research
 */
export async function genAI(options: {
  model: string;
  config?: {
    responseMimeType?: string;
    temperature?: number;
  };
  contents: Array<{
    role: string;
    parts: Array<{ text: string }>;
  }>;
}) {
  if (!geminiClient) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const model = geminiClient.getGenerativeModel({
    model: options.model,
    generationConfig: options.config,
  });

  const result = await model.generateContent({
    contents: options.contents,
  });

  return result;
}

export class GeminiService implements AIService {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Gemini API Key is missing");
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ model: "gemini-pro" });
  }

  async generateText(request: AICompletionRequest): Promise<AICompletionResponse> {
    try {
      const modelName = request.model || "gemini-2.0-flash"; // Default to Flash if not specified
      const model = this.client.getGenerativeModel({ model: modelName });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: request.prompt }] }],
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens,
          stopSequences: request.stopSequences,
        },
      });

      const response = await result.response;
      const text = response.text();

      return {
        text,
        // Gemini doesn't always return token usage in the simple response
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  async generateJSON<T>(request: AICompletionRequest): Promise<T> {
    try {
        const jsonPrompt = `${request.prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. Do not include markdown code blocks.`;
        
        const modelName = request.model || "gemini-2.0-flash";
        const model = this.client.getGenerativeModel({ model: modelName });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: jsonPrompt }] }],
            generationConfig: {
                temperature: 0.1, // Low temp for structured data
                maxOutputTokens: request.maxTokens,
                responseMimeType: "application/json", // Gemini 1.5 supports native JSON enforcement
            },
        });

        const response = await result.response;
        const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(text) as T;
    } catch (error) {
        console.error("Gemini JSON Error:", error);
        throw error;
    }
  }

  async streamText(request: AICompletionRequest): Promise<ReadableStream<Uint8Array>> {
     // Basic streaming implementation wrapper
     // In a real Next.js App Router context, you might return the iterator directly or use AI SDK
     throw new Error("Streaming not implemented for Gemini yet");
  }
}
