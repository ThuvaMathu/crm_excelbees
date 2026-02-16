/**
 * AI Provider Factory - Centralized AI provider routing
 *
 * Routes AI tasks to appropriate providers:
 * - Keyword strategy → Gemini Flash (embeddings) / Gemini Pro (analysis)
 * - Keyword clustering → Gemini Flash (embeddings) / Gemini (labeling)
 * - Other tasks → Existing logic (GPT-4o, OpenAI)
 */

import { GeminiProvider } from "./gemini-provider";

export type TaskComplexity = "routine" | "creative" | "complex";

export interface AIRequestOptions {
  feature: string;
  complexity?: TaskComplexity;
  userId: string;
  workspaceId: string;
  useCache?: boolean;
  ttl?: number; // Cache TTL in seconds
}

export class AIProviderFactory {
  private static gemini = new GeminiProvider();
  private static geminiFlash = new GeminiProvider(); // Flash for embeddings

  /**
   * Get the appropriate provider for a task
   */
  static getProvider(feature: string, complexity?: TaskComplexity) {
    // Keyword tasks use Gemini Flash for embeddings and complex analysis
    if (feature === "keyword-strategy" || feature === "keyword-clustering") {
      return this.geminiFlash;
    }
    // Default for other AI tasks
    return this.gemini;
  }

  /**
   * Generate AI content
   */
  static async generate(prompt: string, context: any, options: AIRequestOptions): Promise<string> {
    const { feature, complexity = "routine", userId, workspaceId, useCache = true, ttl = 86400 } = options;

    // 2. Route Request
    const result = await this.routeRequest(prompt, context, {
      feature,
      complexity,
      userId,
      workspaceId,
    });

    return result;
  }

  /**
   * Route request to appropriate provider
   */
  private static async routeRequest(
    prompt: string,
    context: any,
    options: AIRequestOptions
  ): Promise<string> {
    const { feature, complexity } = options;

    try {
      switch (feature) {
        case "keyword-strategy":
          // Use Gemini Flash for strategy analysis
          return await this.geminiFlash.generateContent(
            prompt, 
            context, 
            options.userId, 
            options.workspaceId, 
            feature
          );
        case "keyword-clustering":
          // Use Gemini Flash for embeddings (needed for clustering)
          return await this.geminiFlash.generateContent(
            prompt, 
            context, 
            options.userId, 
            options.workspaceId, 
            feature
          );
        case "keyword-embeddings":
          // Use Gemini Flash for embeddings
          return await this.geminiFlash.generateContent(
            prompt, 
            context, 
            options.userId, 
            options.workspaceId, 
            feature
          );
        default:
          // Default routing
          return await this.gemini.generateContent(
            prompt, 
            context, 
            options.userId, 
            options.workspaceId, 
            feature
          );
      }
    } catch (error) {
      console.error(`[AI Factory] Error for ${feature}:`, error);

      // Fallback to Gemini Pro if Flash fails
      if (feature === "keyword-strategy" || feature === "keyword-clustering") {
        try {
          return await this.gemini.generateContent(
            prompt, 
            context, 
            options.userId, 
            options.workspaceId, 
            feature
          );
        } catch (fallbackError) {
          console.warn(`[AI Factory] Flash fallback failed for ${feature}:`, fallbackError);
          throw error;
        }
      }

      throw error;
    }
  }

  /**
   * Extract JSON from AI response
   */
  static async extractJson<T>(prompt: string, context: any, options: AIRequestOptions): Promise<T> {
    const response = await this.generate(prompt, context, options);
    try {
        const jsonStart = response.indexOf("{");
        const jsonEnd = response.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonStr = response.substring(jsonStart, jsonEnd + 1);
            return JSON.parse(jsonStr) as T;
        }
        throw new Error("No JSON found in response");
    } catch (error) {
       console.error("JSON Extraction Failed", error);
       throw error;
    }
  }

  /**
   * Extract structured data with schema
   */
  static async extractData<T>(
    prompt: string,
    schema: string,
    context: any,
    options: AIRequestOptions
  ): Promise<T | null> {
    const response = await this.generate(`
Generate a JSON response following this schema:
${schema}

Data: ${JSON.stringify(context || {})}

Respond with ONLY the JSON, no explanation text.
`, context, {
      ...options,
      // config: { // Removed invalid config property
      //   responseMimeType: "application/json",
      //   temperature: 0.3,
      // },
    });

    // The generate method now returns a string directly, not an object with .response?.text()
    if (!response) {
      return null;
    }

    try {
      return JSON.parse(response);
    } catch {
      return null;
    }
  }
}
