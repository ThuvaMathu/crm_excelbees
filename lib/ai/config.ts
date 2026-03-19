/**
 * @file config.ts
 * @description Central configuration for AI model selection and strategy.
 * This file serves as the single source of truth for switching between LLMs
 * across the entire application. It allows for quick adaptation to price changes
 * or performance requirements.
 */

// Available Providers
export type AIProvider = 'gemini';

// Available Models
export const AI_MODELS = {
  GEMINI_PRO: 'gemini-2.5-flash',
  GEMINI_LITE: 'gemini-2.5-flash-lite',
} as const;

export type AIModel = typeof AI_MODELS[keyof typeof AI_MODELS];


interface TaskConfig {
  provider: AIProvider;
  model: AIModel;
  temperature: number;
  maxTokens?: number;
}

export interface AIStrategyConfig {
  default: TaskConfig;
  email: TaskConfig;
  tasks: TaskConfig;
  leads: TaskConfig;
  deals: TaskConfig;
  copilot: TaskConfig;
}

/**
 * Global AI Configuration
 * Change 'activeModel' here to switch globally if using the default strategy.
 */
export const aiConfig: AIStrategyConfig = {
  // 1. Default Strategy
  // CHOICE: Gemini 2.5 Flash
  default: {
    provider: 'gemini',
    model: AI_MODELS.GEMINI_PRO,
    temperature: 0.7,
  },

  // 2. Email Intelligence
  // CHOICE: Gemini 2.0 Flash Lite
  email: {
    provider: 'gemini',
    model: AI_MODELS.GEMINI_LITE, 
    temperature: 0.7,
  },

  // 3. Task Management
  // CHOICE: Gemini 2.0 Flash Lite
  tasks: {
    provider: 'gemini',
    model: AI_MODELS.GEMINI_LITE,
    temperature: 0.7,
  },

  // 4. Lead Intelligence
  // CHOICE: Gemini 2.5 Flash
  leads: {
    provider: 'gemini',
    model: AI_MODELS.GEMINI_PRO,
    temperature: 0.2, // Low temp for consistent scoring
  },

  // 5. Deal Insights
  // CHOICE: Gemini 2.5 Flash
  deals: {
    provider: 'gemini',
    model: AI_MODELS.GEMINI_PRO,
    temperature: 0.4,
  },

  // 6. CRM Copilot
  // CHOICE: Gemini 2.5 Flash
  copilot: {
    provider: 'gemini',
    model: AI_MODELS.GEMINI_PRO,
    temperature: 0.5, // Balanced for creativity and accuracy
  }
};

/**
 * Helper to get config for a specific use case
 */
export function getAIConfig(useCase: keyof AIStrategyConfig = 'default'): TaskConfig {
  return aiConfig[useCase] || aiConfig.default;
}
