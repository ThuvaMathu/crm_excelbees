import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { AICostTracker } from "./cost-tracker";

const API_KEY = process.env.GEMINI_API_KEY || "";

export class GeminiProvider {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private modelName: string;

  constructor(modelName: string = "gemini-2.0-flash") {
    if (!API_KEY) throw new Error("GEMINI_API_KEY is missing");
    this.genAI = new GoogleGenerativeAI(API_KEY);
    this.modelName = modelName;
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  async generateContent(prompt: string, context: any = {}, userId: string, workspaceId: string, feature: string) {
    try {
      const result = await this.model.generateContent([
        prompt,
        JSON.stringify(context)
      ]);
      const response = await result.response;
      const text = response.text();

      // Track Cost
      const usage = result.response.usageMetadata;
      if (usage) {
        await AICostTracker.trackUsage({
          provider: "gemini",
          model: this.modelName,
          inputTokens: usage.promptTokenCount,
          outputTokens: usage.candidatesTokenCount,
          featureUsed: feature,
          workspaceId,
          userId
        });
      }

      return text;
    } catch (error) {
      console.error("[Gemini] Generate Error:", error);
      throw error;
    }
  }

  async extractData<T>(prompt: string, schema: string, context: any, userId: string, workspaceId: string, feature: string): Promise<T> {
    const jsonPrompt = `${prompt}
    
    Output must be valid JSON matching this schema:
    ${schema}
    
    Return ONLY raw JSON, no markdown blocks.`;

    const text = await this.generateContent(jsonPrompt, context, userId, workspaceId, feature);

    try {
      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson) as T;
    } catch (e) {
      console.error("[Gemini] JSON Parse Error:", e, text);
      throw new Error("Failed to parse AI response as JSON");
    }
  }
}
