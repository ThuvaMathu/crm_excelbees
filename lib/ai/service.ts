import { GeminiService } from "./gemini";
import { AIService } from "./types";
import { aiConfig } from "./config";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

class AIServiceFactory {
  private static instance: AIService;

  static getService(): AIService {
    if (this.instance) {
      return this.instance;
    }

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing");
    }

    this.instance = new GeminiService(GEMINI_API_KEY);
    return this.instance;
  }
}

// Helper to get service and config for a specific use case
export function getAIAdapter(useCase: keyof typeof aiConfig = 'default') {
  const config = aiConfig[useCase] || aiConfig.default;
  return {
    service: AIServiceFactory.getService(),
    model: config.model,
    temperature: config.temperature
  };
}

// Default service (uses default config)
export const aiService = AIServiceFactory.getService();
