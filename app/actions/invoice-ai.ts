"use server";

import { getAIAdapter } from "@/lib/ai/service";

// Types
type RewriteType = "professional" | "friendly" | "legal" | "concise";

interface RewriteRequest {
    text: string;
    type: RewriteType;
}

interface SuggestionRequest {
    clientName?: string;
    dealName?: string;
    industry?: string;
}

export async function rewriteInvoiceText({ text, type }: RewriteRequest) {
    try {
        if (!text) return { success: false, error: "No text provided" };

        const { service, model } = getAIAdapter('copilot');

        const prompts = {
            professional: "Rewrite the following invoice note to be strictly professional, polite, and formal.",
            friendly: "Rewrite the following invoice text to be warm, friendly, and relationship-focused.",
            legal: "Rewrite the following invoice terms to be legally robust, clear, and unambiguous.",
            concise: "Rewrite the following text to be extremely concise and direct, removing padding."
        };

        const response = await service.generateText({
            prompt: `
            TASK: ${prompts[type]}
            
            INPUT TEXT:
            "${text}"
            
            OUTPUT:
            Return ONLY the rewritten text. Do not add headers or explanations.
            `,
            model: model,
            temperature: 0.3 // Low temp for more deterministic utility results
        });

        return { success: true, text: response.text.trim() };
    } catch (error: any) {
        console.error("AI Rewrite Error:", error);
        return { success: false, error: error.message };
    }
}

export async function suggestLineItems(context: SuggestionRequest) {
    try {
        const { service, model } = getAIAdapter('copilot');

        const prompt = `
        You are an intelligent billing assistant. Based on the context provided below, suggest 3-5 relevant invoice line items.
        
        CONTEXT:
        Client: ${context.clientName || "Unknown"}
        Deal/Project: ${context.dealName || "General Services"}
        Industry: ${context.industry || "General Business"}

        OUTPUT FORMAT:
        Return a valid JSON array of objects with 'description', 'price' (estimate number), and 'quantity' (default 1).
        Example: [{"description": "Web Design", "price": 1000, "quantity": 1}]
        Do NOT wrap in markdown code blocks. Just the raw JSON string.
        `;

        const response = await service.generateText({
            prompt: prompt,
            model: model,
            temperature: 0.4
        });

        // Basic clean up of response in case logic leaks markdown
        const cleanedText = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
        const items = JSON.parse(cleanedText);

        return { success: true, items };
    } catch (error: any) {
        console.error("AI Suggestion Error:", error);
        return { success: false, error: error.message };
    }
}
