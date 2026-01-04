import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface AICostRecord {
  provider: "gemini" | "openai" | "anthropic";
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  featureUsed: string; // e.g., "blog-writer", "seo-audit"
  workspaceId: string;
  userId: string;
}

// Pricing Rates (Approximate - should be configurable)
const PRICING = {
  "gemini-1.5-flash": { input: 0.075 / 1000000, output: 0.30 / 1000000 },
  "gemini-1.5-pro": { input: 3.50 / 1000000, output: 10.50 / 1000000 },
  "gpt-4o": { input: 5.00 / 1000000, output: 15.00 / 1000000 },
  "gpt-4o-mini": { input: 0.15 / 1000000, output: 0.60 / 1000000 },
};

export const AI_USAGE_COLLECTION = "ai_usage_logs";

export class AICostTracker {
  static async trackUsage(record: Omit<AICostRecord, "totalCost">) {
    const cost = this.calculateCost(record.provider, record.model, record.inputTokens, record.outputTokens);
    
    try {
      await addDoc(collection(db, AI_USAGE_COLLECTION), {
        ...record,
        totalCost: cost,
        timestamp: serverTimestamp()
      });
      // console.log(`[AI Cost] tracked: $${cost.toFixed(6)} for ${record.featureUsed}`);
    } catch (error) {
      console.error("[AI Cost] Failed to log usage:", error);
    }
  }

  private static calculateCost(provider: string, model: string, input: number, output: number): number {
    // Normalize model name if needed
    const pricing = PRICING[model as keyof typeof PRICING];
    if (!pricing) return 0; // Unknown model
    return (input * pricing.input) + (output * pricing.output);
  }
}
