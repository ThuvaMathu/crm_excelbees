import { GoogleGenerativeAI } from "@google/generative-ai";

let _client: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!_client) _client = new GoogleGenerativeAI(key);
  return _client;
}

export function isAIEnabled(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
