"use server";

import { getAIAdapter } from "@/lib/ai/service";
import { ChatMessage, ChatMode } from "@/types/ai";
import { adminDb } from "@/lib/firebase-admin";

async function getCRMContext(userId?: string) {
    try {
        // Fetch real leads data
        const leadsSnapshot = await adminDb.collection("leads").get();
        const leads = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const leadsByStatus: Record<string, number> = {};
        leads.forEach((lead: any) => {
            const status = lead.status || "Unknown";
            leadsByStatus[status] = (leadsByStatus[status] || 0) + 1;
        });

        const statusBreakdown = Object.entries(leadsByStatus)
            .map(([status, count]) => `${count} ${status}`)
            .join(", ");

        // Fetch real deals data
        const dealsSnapshot = await adminDb.collection("deals").get();
        const deals = dealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const recentDeals = deals.slice(0, 5).map((deal: any) =>
            `"${deal.name || deal.title || 'Untitled'}" ($${(deal.value || 0).toLocaleString()}, ${deal.stage || 'Unknown'})`
        ).join(", ");

        // Fetch tasks
        const tasksSnapshot = await adminDb.collection("tasks").get();
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const pendingTasks = tasks.filter((t: any) => t.status !== "completed" && t.status !== "done").length;

        return `
    CURRENT CRM DATA (LIVE):
    - Total Leads: ${leads.length} (${statusBreakdown || "none"})
    - Total Deals: ${deals.length}${recentDeals ? ` | Recent: ${recentDeals}` : ""}
    - Pending Tasks: ${pendingTasks}
    `;
    } catch (error) {
        console.error("Error fetching CRM context:", error);
        return `
    CURRENT CRM DATA: Unable to fetch live data. Please try again.
    `;
    }
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
