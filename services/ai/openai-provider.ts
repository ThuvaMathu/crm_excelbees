import OpenAI from "openai";
import { AICostTracker } from "./cost-tracker";

const API_KEY = process.env.OPENAI_API_KEY;

export class OpenAIProvider {
  private openai: OpenAI;
  private defaultModel: string;

  constructor(model: string = "gpt-4o-mini") {
    // OpenAI key is optional if only using Gemini, but we wrap it in a factory later
    this.openai = new OpenAI({ 
      apiKey: API_KEY || "dummy_key", 
      dangerouslyAllowBrowser: true // if used client-side (discouraged)
    });
    this.defaultModel = model;
  }

  async generateContent(prompt: string, context: any = {}, userId: string, workspaceId: string, feature: string) {
    if (!API_KEY) throw new Error("OPENAI_API_KEY is missing");

    try {
      const response = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: "system", content: "You are a helpful AI marketing assistant." },
          { role: "user", content: `${prompt}\nContext: ${JSON.stringify(context)}` }
        ],
      });

      const text = response.choices[0]?.message?.content || "";
      
      // Track Cost
      if (response.usage) {
        await AICostTracker.trackUsage({
          provider: "openai",
          model: this.defaultModel,
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          featureUsed: feature,
          workspaceId,
          userId
        });
      }

      return text;
    } catch (error) {
      console.error("[OpenAI] Generate Error:", error);
      throw error;
    }
  }

  // Specialized method for complex strategic tasks (forces GPT-4o)
  async analyzeStrategic(prompt: string, context: any, userId: string, workspaceId: string, feature: string) {
    const originalModel = this.defaultModel;
    this.defaultModel = "gpt-4o"; // Upgrade model temporarily
    const result = await this.generateContent(prompt, context, userId, workspaceId, feature);
    this.defaultModel = originalModel; // Reset
    return result;
  }

  // Method for deep reasoning or JSON extraction
  async complexReasoning<T>(prompt: string, schema: string, context: any, userId: string, workspaceId: string, feature: string): Promise<T> {
     if (!API_KEY) throw new Error("OPENAI_API_KEY is missing");

     try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // Always use high tier for complex logic
        messages: [
          { role: "system", content: "Analyze the following and return valid JSON." },
          { role: "user", content: `${prompt}\n\nOutput JSON matching:\n${schema}\n\nContext: ${JSON.stringify(context)}` }
        ],
        response_format: { type: "json_object" }
      });

      const text = response.choices[0]?.message?.content || "{}";
      
      // Track Cost logic... (Duplicated here or refactor into helper? Helper is better but inline for speed)
       if (response.usage) {
        await AICostTracker.trackUsage({
          provider: "openai",
          model: "gpt-4o",
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          featureUsed: feature,
          workspaceId,
          userId
        });
      }

      return JSON.parse(text) as T;

     } catch (error) {
       console.error("[OpenAI] Complex Reasoning Error:", error);
       throw error;
     }
  }
}
