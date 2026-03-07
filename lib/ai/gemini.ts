import { GoogleGenerativeAI, Schema } from "@google/generative-ai";
import { AICompletionRequest, AICompletionResponse, AIService } from "./types";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
export const geminiClient = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const genAI = async (params: {
  model: string;
  config?: any;
  contents: any[];
}) => {
  if (!geminiClient) throw new Error("Gemini API key missing");
  const modelInstance = geminiClient.getGenerativeModel({
    model: params.model,
    generationConfig: params.config,
  });
  return modelInstance.generateContent({ contents: params.contents as any });
};

export class GeminiService implements AIService {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Gemini API Key is missing");
    }
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateText(request: AICompletionRequest): Promise<AICompletionResponse> {
    try {
      const modelName = request.model || "gemini-2.5-flash"; // Default to Flash for text
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
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0,
        },
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  async generateJSON<T>(request: AICompletionRequest & { responseSchema?: Schema }): Promise<T> {
    try {
      const modelName = request.model || "gemini-2.5-flash";
      const model = this.client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: request.temperature ?? 0.1, // Low temp for structured data
          maxOutputTokens: request.maxTokens,
          responseMimeType: "application/json",
          responseSchema: request.responseSchema, // We can now pass strict schemas
        },
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: request.prompt }] }],
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
    throw new Error("Streaming not implemented for Gemini yet");
  }
}
