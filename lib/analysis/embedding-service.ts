/**
 * Gemini Embedding Service
 *
 * Wrapper around Gemini for generating embeddings.
 * Optimized for batch processing of keywords.
 */

import { genAI } from "@/lib/ai/gemini";

export interface EmbeddingConfig {
  model?: "models/embedding-001" | "text-embedding-004";
  }

/**
 * Generate a single embedding
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const result = await genAI({
      model: "models/embedding-001",
      config: {
        responseMimeType: "application/json",
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate an embedding vector for: the following text: ${text}

Return only a JSON array of numbers representing the embedding vector. No explanation text.`,
            }
          ],
        },
      ],
    });

    if (!result.response?.text()) {
      return null;
    }

    const parsed = JSON.parse(result.response.text());
    return parsed?.embedding || null;
  } catch (error) {
    console.error("Embedding generation error:", error);
    return null;
  }
}

/**
 * Generate embeddings for multiple texts (batching for efficiency)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await Promise.all(
      batch.map(text => generateEmbedding(text))
    );

    const validEmbeddings = embeddings.filter(e => e !== null) as number[][];
    allEmbeddings.push(...validEmbeddings);
  }

  return allEmbeddings;
}

/**
 * Generate embeddings for keywords (with search intent for better context)
 */
export async function generateKeywordEmbeddings(keywords: string[]): Promise<number[][]> {
  // Include search intent in the embedding for better semantic clustering
  const enrichedTexts = keywords.map(k => `${k} - informational search intent for SEO and content`);

  return generateEmbeddings(enrichedTexts);
}
