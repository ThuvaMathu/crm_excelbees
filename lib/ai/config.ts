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
// Justification:
// - gemini-pro: Balanced performance/cost. Good default.
// - gemini-2.0-flash-lite: Extremely low cost ($0.075/1M input), fast, decent reasoning. Best for bulk tasks.
// - gemini-2.0-flash: Higher performance for complex tasks.
export type AIModel =
  | 'gemini-pro'
  | 'gemini-2.0-flash-lite'
  | 'gemini-2.0-flash'


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
  // Use Gemini 1.5 Flash as the workhorse.
  // WHY: Unbeatable price ($0.075/1M tokens) and speed.
  default: {
    provider: 'gemini',
    model: 'gemini-2.0-flash-lite',
    temperature: 0.7,
  },

  // 2. Email Intelligence
  // Tasks: Drafting, Replying, Tone adjustment.
  // CHOICE: Gemini 1.5 Flash
  // WHY: Sufficient for standard business communication. Fast for UI interaction.
  email: {
    provider: 'gemini',
    model: 'gemini-2.0-flash-lite', 
    temperature: 0.7,
  },

  // 3. Task Management
  // Tasks: Breaking down projects, suggesting subtasks, generating descriptions.
  // CHOICE: Gemini 1.5 Flash
  // WHY: Tasks are often operational and need speed.
  tasks: {
    provider: 'gemini',
    model: 'gemini-2.0-flash-lite',
    temperature: 0.7,
  },

  // 4. Lead Intelligence
  // Tasks: Lead Scoring, Enrichment, Qualification.
  // CHOICE: Gemini 1.5 Pro (or GPT-4o)
  // WHY: Requires deeper reasoning to analyze company data and probability.
  leads: {
    provider: 'gemini',
    // model: 'gemini-2.0-flash-lite', // Good for simple scoring
    model: 'gemini-2.0-flash', // Better for complex qualification
    temperature: 0.2, // Low temp for consistent scoring
  },

  // 5. Deal Insights
  // Tasks: Win probability, Forecasting, Negotiation advice.
  // CHOICE: Gemini 1.5 Pro
  // WHY: High intelligence required for financial predictions.
  deals: {
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    temperature: 0.4,
  },

  // 6. CRM Copilot
  // Tasks: Complex natural language queries, reasoning, and context management.
  // CHOICE: Gemini 1.5 Pro
  // WHY: Needs best reasoning to understand dual-mode intent and synthesized context.
  copilot: {
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    temperature: 0.5, // Balanced for creativity and accuracy
  }
};

/**
 * Helper to get config for a specific use case
 */
export function getAIConfig(useCase: keyof AIStrategyConfig = 'default'): TaskConfig {
  return aiConfig[useCase] || aiConfig.default;
}
