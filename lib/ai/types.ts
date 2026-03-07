export interface AICompletionRequest {
  prompt: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  model?: string;
}

export interface AICompletionResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIService {
  generateText(request: AICompletionRequest): Promise<AICompletionResponse>;
  generateJSON<T>(request: AICompletionRequest): Promise<T>;
  streamText(request: AICompletionRequest): Promise<ReadableStream<Uint8Array>>;
}

export type AIProvider = 'gemini';

export interface AIConfig {
    provider: AIProvider;
    apiKey: string;
}
