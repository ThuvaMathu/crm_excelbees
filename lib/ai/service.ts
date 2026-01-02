import { GeminiService } from "./gemini";
import { OpenAIService } from "./openai";
import { AIService, AIProvider } from "./types";
import { aiConfig } from "./config";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

class AIServiceFactory {
  private static instances: Map<AIProvider, AIService> = new Map();

  static getService(provider: AIProvider): AIService {
    if (this.instances.has(provider)) {
        return this.instances.get(provider)!;
    }

    let service: AIService;

    if (provider === "gemini") {
      if (!GEMINI_API_KEY) {
        // Fallback or error
        throw new Error("GEMINI_API_KEY is missing");
      }
      service = new GeminiService(GEMINI_API_KEY);
    } else if (provider === "openai") {
       if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing");
       service = new OpenAIService(OPENAI_API_KEY);
    } else {
        throw new Error(`Unsupported AI Provider: ${provider}`);
    }
    
    this.instances.set(provider, service);
    return service;
  }
}

// Helper to get service and config for a specific use case
export function getAIAdapter(useCase: keyof typeof aiConfig = 'default') {
    const config = aiConfig[useCase] || aiConfig.default;
    return {
        service: AIServiceFactory.getService(config.provider),
        model: config.model,
        temperature: config.temperature
    };
}

// Default service (uses default config)
export const aiService = AIServiceFactory.getService(aiConfig.default.provider);
