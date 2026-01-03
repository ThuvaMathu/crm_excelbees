"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAIConfig } from "@/lib/ai/config";

const API_KEY = process.env.GEMINI_API_KEY;

export interface AIReportResponse {
    summary: string;
    insights: {
        type: "positive" | "negative" | "warning";
        text: string;
    }[];
}

export async function generateReportInsight(
    query: string,
    context: any // Passed from client
): Promise<AIReportResponse> {
    
    // 1. Fallback if no API key
    if (!API_KEY) {
        console.warn("⚠️ No GEMINI_API_KEY found. Using simulated response.");
        await new Promise(r => setTimeout(r, 1500)); // Simulate latency
        return {
            summary: "I've analyzed the data (Simulated Mode - No API Key). Revenue is tracking well against targets.",
            insights: [
                { type: "warning", text: "Configure GEMINI_API_KEY to see real AI insights." },
                { type: "positive", text: "Data integration is working correctly." }
            ]
        };
    }

    try {
        // Use the centralized config for "copilot" (reports are similar to copilot)
        const config = getAIConfig('copilot');

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: config.model,
            generationConfig: {
                temperature: config.temperature,
                maxOutputTokens: config.maxTokens
            }
        });

        const systemPrompt = `
        You are an expert Sales Intelligence Analyst for a CRM system. 
        Analyze the provided JSON data context and the user's specific query.
        
        RETURN ONLY VALID JSON matching this schema:
        {
            "summary": "A concise 1-2 sentence executive summary of the situation.",
            "insights": [
                { "type": "positive" | "negative" | "warning", "text": "Short bullet point (max 10 words)" }
            ]
        }

        Rules:
        - Be professional but conversational.
        - Focus on actionable business intelligence (revenue, churn, performance).
        - If the query is vague, provide a general health check.
        - Start the summary directly, do not say "Here is the summary".
        `;

        const userPrompt = `
        User Query: "${query}"
        
        Current Data Context:
        ${JSON.stringify(context, null, 2)}
        `;

        const result = await model.generateContent([systemPrompt, userPrompt]);
        const response = result.response;
        const text = response.text();

        // simple json cleanup
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        
        return JSON.parse(cleanText) as AIReportResponse;

    } catch (error: any) {
        console.error("❌ Gemini API Error:", error);
        return {
            summary: `Error: ${error.message || "Unknown error"}. Check server logs for details.`,
            insights: [
                { type: "negative", text: "AI Request Failed" }
            ]
        };
    }
}
