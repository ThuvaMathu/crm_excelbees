"use server";

import { getAIAdapter } from "@/lib/ai/service";
import { ChatMessage, ChatMode } from "@/types/ai";

// Mock function to simulate fetching CRM context
// In a real scenario, this would import 'getLeads', 'getDeals' etc.
async function getCRMContext() {
    // Simulating a fetching data from the database
    // This is "Pilot Mode" context
    return `
    CURRENT USER CONTEXT:
    - Role: Sales Manager
    - Active Leads: 5 (2 Qualified, 3 New)
    - Recent Deals: "Acme Corp" ($50k, Negotiation), "TechStart" ($12k, Proposal)
    - Tasks Today: Call John Doe at 2pm.
    `;
}

export async function chatWithCopilot(
    history: ChatMessage[],
    userMessage: string,
    mode: ChatMode
) {
    try {
        const { service, model, temperature } = getAIAdapter('copilot');

        let systemPrompt = "";
        let contextData = "";

        if (mode === 'crm') {
             contextData = await getCRMContext();
             systemPrompt = `
You are the Excel Bees CRM Copilot, an advanced AI assistant for sales professionals.
Your goal is to help the user manage their leads, deals, and tasks using the provided CRM data.

MODE: CRM PILOT 🛡️
- You rely STRICTLY on the provided Context Data.
- If the answer is not in the context, say you don't have that info but can help find it.
- Be precise, data-driven, and professional.

CONTEXT DATA:
${contextData}
            `.trim();
        } else {
            // General Mode
            systemPrompt = `
You are the Excel Bees Business Assistant.
Your goal is to help with general business tasks, drafting content, market research, and brainstorming.

MODE: GENERAL CHAT 🌐
- You have access to broad general knowledge.
- You can be creative and expansive.
- Do NOT make up CRM data. If asked about specific deals, ask the user to switch to CRM Pilot mode.
            `.trim();
        }

        // Convert history to format expected by service (if needed) or just append to prompt
        // For simple Turn-by-Turn, we'll append the last few messages for context
        const conversationHistory = history.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        const fullPrompt = `
${systemPrompt}

CONVERSATION HISTORY:
${conversationHistory}

USER: ${userMessage}
ASSISTANT:
        `.trim();

        const response = await service.generateText({
            prompt: fullPrompt,
            model: model,
            temperature: temperature
        });

        // Create the assistant message object
        const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.text,
            mode: mode,
            timestamp: Date.now()
        };

        return { success: true, data: assistantMessage };

    } catch (error: any) {
        console.error("Copilot Error:", error);
        return { success: false, error: error.message };
    }
}
