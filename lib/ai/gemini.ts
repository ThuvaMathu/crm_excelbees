import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { AICompletionRequest, AICompletionResponse, AIService } from "./types";
import { AI_MODELS } from "@/lib/ai/config";

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
    this.model = this.client.getGenerativeModel({ model: AI_MODELS.GEMINI_PRO });
  }

  async generateText(request: AICompletionRequest): Promise<AICompletionResponse> {
    const defaultModel = AI_MODELS.GEMINI_PRO;
    const fallbackModel = AI_MODELS.GEMINI_LITE;
    let modelName = request.model || defaultModel;

    try {
      return await this._generateTextWithModel(modelName, request);
    } catch (error: any) {
      if (error?.status === 429 && modelName !== fallbackModel) {
        console.warn(`[AI Service] Rate limit hit for ${modelName}. Falling back to ${fallbackModel}...`);
        try {
          return await this._generateTextWithModel(fallbackModel, request);
        } catch (fallbackError: any) {
          console.error(`[AI Service] Fallback also failed:`, fallbackError);
          throw this._formatMapError(fallbackError);
        }
      }
      throw this._formatMapError(error);
    }
  }

  private async _generateTextWithModel(modelName: string, request: AICompletionRequest): Promise<AICompletionResponse> {
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
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }

  async generateJSON<T>(request: AICompletionRequest): Promise<T> {
    const defaultModel = AI_MODELS.GEMINI_PRO;
    const fallbackModel = AI_MODELS.GEMINI_LITE;
    let modelName = request.model || defaultModel;

    try {
      return await this._generateJSONWithModel<T>(modelName, request);
    } catch (error: any) {
      if (error?.status === 429 && modelName !== fallbackModel) {
        console.warn(`[AI Service] Rate limit hit for ${modelName} in JSON mode. Falling back to ${fallbackModel}...`);
        try {
          return await this._generateJSONWithModel<T>(fallbackModel, request);
        } catch (fallbackError: any) {
          console.error(`[AI Service] Fallback also failed:`, fallbackError);
          throw this._formatMapError(fallbackError);
        }
      }
      throw this._formatMapError(error);
    }
  }

  private async _generateJSONWithModel<T>(modelName: string, request: AICompletionRequest): Promise<T> {
    const jsonPrompt = `${request.prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. Do not include markdown code blocks.`;
    const model = this.client.getGenerativeModel({ model: modelName });

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: jsonPrompt }] }],
        generationConfig: {
            temperature: 0.1, // Low temp for structured data
            maxOutputTokens: request.maxTokens,
            responseMimeType: "application/json",
        },
    });

    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text) as T;
  }

  private _formatMapError(error: any): Error {
    if (error?.status === 429) {
      return new Error("AI service is currently experiencing high demand. Please try again in a few seconds.");
    }
    return error;
  }

  async streamText(request: AICompletionRequest): Promise<ReadableStream<Uint8Array>> {
     throw new Error("Streaming not implemented for Gemini yet");
  }
}
