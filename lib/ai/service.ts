import { GeminiService } from "./gemini";
import { AIService, AIProvider } from "./types";
import { aiConfig } from "./config";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

class AIServiceFactory {
  private static instances: Map<AIProvider, AIService> = new Map();

  static getService(provider: AIProvider): AIService {
    if (this.instances.has(provider)) {
      return this.instances.get(provider)!;
    }

    let service: AIService;

    if (provider === "gemini") {
      if (!GEMINI_API_KEY) {
        throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is missing");
      }
      service = new GeminiService(GEMINI_API_KEY);
    } else {
      throw new Error(`Unsupported AI Provider: ${provider}. Only gemini is supported.`);
    }

    this.instances.set(provider, service);
    return service;
  }
}

// Helper to get service and config for a specific use case
export function getAIAdapter(useCase: keyof typeof aiConfig = 'default') {
  const config = aiConfig[useCase] || aiConfig.default;
  return {
    service: AIServiceFactory.getService("gemini"), // Force gemini
    model: config.model,
    temperature: config.temperature
  };
}

// Default service (uses default config)
export const aiService = AIServiceFactory.getService("gemini");
