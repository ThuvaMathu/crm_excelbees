import OpenAI from "openai";
import { AICompletionRequest, AICompletionResponse, AIService } from "./types";

export class OpenAIService implements AIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("OpenAI API Key is missing");
    }
    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: false, // Enforce server-side use
    });
  }

  async generateText(request: AICompletionRequest): Promise<AICompletionResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        messages: [{ role: "user", content: request.prompt }],
        model: request.model || "gpt-4",
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stop: request.stopSequences,
      });

      return {
        text: completion.choices[0].message.content || "",
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw error;
    }
  }

  async generateJSON<T>(request: AICompletionRequest): Promise<T> {
     try {
      const completion = await this.client.chat.completions.create({
        messages: [{ role: "user", content: request.prompt }],
        model: "gpt-4-turbo-preview", // Supports JSON mode well
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const text = completion.choices[0].message.content || "{}";
      return JSON.parse(text) as T;
    } catch (error) {
      console.error("OpenAI JSON Error:", error);
      throw error;
    }
  }

  async streamText(request: AICompletionRequest): Promise<ReadableStream<Uint8Array>> {
     throw new Error("Streaming not implemented for OpenAI yet");
  }
}
