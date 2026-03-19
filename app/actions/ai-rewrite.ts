"use server";

import { getAIAdapter } from "@/lib/ai/service";

export type RewriteOptions = {
    tone: 'professional' | 'casual' | 'formal' | 'creative';
    type: 'improve' | 'simplify' | 'expand' | 'rephrase';
    length: 'shorter' | 'same' | 'longer';
};

export type RewriteResult = {
    text: string | null;
    error?: string;
};

export async function rewriteText(text: string, options: RewriteOptions): Promise<RewriteResult> {
    try {
        if (!text || text.trim().length === 0) {
            return { text: null, error: "Input text cannot be empty" };
        }

        const { service, model, temperature } = getAIAdapter('default');

        // Construct a focused prompt for the AI
        const prompt = `
        You are an elite text editing assistant. Your task is to rewrite the provided text according to specific constraints.
        
        INPUT TEXT:
        "${text}"

        CONSTRAINTS:
        - Tone: ${options.tone}
        - Objective: ${options.type}
        - Length adjustment: ${options.length}

        INSTRUCTIONS:
        1. Maintain the core meaning and facts of the original text.
        2. Adjust the length ONLY if requested (shorter/longer).
        3. Do not add introductory or concluding remarks (e.g. "Here is the rewritten text:").
        4. Output ONLY the rewritten text.
        
        REWRITTEN TEXT:
        `;

        const response = await service.generateText({ prompt, model, temperature });

        if (!response || !response.text) {
            return { text: null, error: "Failed to generate text" };
        }

        return { text: response.text.trim() };

    } catch (error: any) {
        console.error("AI Rewrite Error:", error);
        return { text: null, error: error.message || "An unexpected error occurred." };
    }
}
