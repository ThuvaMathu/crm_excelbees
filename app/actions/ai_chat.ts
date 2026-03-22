"use server";

import { getAIAdapter } from "@/lib/ai/service";
import { ChatMessage, ChatMode } from "@/types/ai";
import { adminDb } from "@/lib/firebase-admin";

async function getCRMContext(userId?: string) {
    try {
        // Fetch all CRM data in parallel
        const [leadsSnapshot, dealsSnapshot, tasksSnapshot, contactsSnapshot, companiesSnapshot, invoicesSnapshot, projectsSnapshot] = await Promise.all([
            adminDb.collection("leads").get(),
            adminDb.collection("deals").get(),
            adminDb.collection("tasks").get(),
            adminDb.collection("contacts").get(),
            adminDb.collection("companies").get(),
            adminDb.collection("invoices").get(),
            adminDb.collection("projects").get(),
        ]);

        // --- Leads ---
        const leads = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const leadsByStatus: Record<string, number> = {};
        leads.forEach((lead: any) => {
            const status = lead.status || "Unknown";
            leadsByStatus[status] = (leadsByStatus[status] || 0) + 1;
        });
        const statusBreakdown = Object.entries(leadsByStatus)
            .map(([status, count]) => `${count} ${status}`)
            .join(", ");
        const recentLeads = leads.slice(0, 10).map((lead: any) =>
            `"${lead.name || lead.firstName || 'Unnamed'}" (Status: ${lead.status || 'Unknown'}, Source: ${lead.source || 'N/A'})`
        ).join("; ");

        // --- Deals ---
        const deals = dealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const dealsByStage: Record<string, number> = {};
        let totalDealValue = 0;
        deals.forEach((deal: any) => {
            const stage = deal.stage || "Unknown";
            dealsByStage[stage] = (dealsByStage[stage] || 0) + 1;
            totalDealValue += deal.value || 0;
        });
        const stageBreakdown = Object.entries(dealsByStage)
            .map(([stage, count]) => `${count} ${stage}`)
            .join(", ");
        const recentDeals = deals.slice(0, 10).map((deal: any) =>
            `"${deal.name || deal.title || 'Untitled'}" ($${(deal.value || 0).toLocaleString()}, Stage: ${deal.stage || 'Unknown'})`
        ).join("; ");

        // --- Tasks ---
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const pendingTasks = tasks.filter((t: any) => t.status !== "Done").length;
        const tasksByStatus: Record<string, number> = {};
        tasks.forEach((t: any) => {
            const status = t.status || "Unknown";
            tasksByStatus[status] = (tasksByStatus[status] || 0) + 1;
        });
        const taskStatusBreakdown = Object.entries(tasksByStatus)
            .map(([status, count]) => `${count} ${status}`)
            .join(", ");

        // --- Contacts ---
        const contacts = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const recentContacts = contacts.slice(0, 10).map((c: any) =>
            `"${c.firstName || ''} ${c.lastName || ''}" (Email: ${c.email || 'N/A'}, Company: ${c.companyName || 'N/A'})`
        ).join("; ");

        // --- Companies ---
        const companies = companiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const recentCompanies = companies.slice(0, 10).map((c: any) =>
            `"${c.name || 'Unnamed'}" (Industry: ${c.industry || 'N/A'})`
        ).join("; ");

        // --- Invoices ---
        const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const paidInvoices = invoices.filter((i: any) => i.status === "Paid");
        const overdueInvoices = invoices.filter((i: any) => i.status === "Overdue");
        const totalRevenue = paidInvoices.reduce((sum: number, i: any) => sum + (i.total || 0), 0);
        const recentInvoices = invoices.slice(0, 10).map((i: any) =>
            `#${i.invoiceNumber || i.id} ($${(i.total || 0).toLocaleString()}, Status: ${i.status || 'Unknown'})`
        ).join("; ");

        // --- Projects ---
        const projects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const activeProjects = projects.filter((p: any) => p.status === "Active");
        const recentProjects = projects.slice(0, 10).map((p: any) =>
            `"${p.name || 'Unnamed'}" (Status: ${p.status || 'Unknown'})`
        ).join("; ");

        return `
    CURRENT CRM DATA (LIVE):
    
    LEADS (${leads.length} total): ${statusBreakdown || "none"}
    Recent Leads: ${recentLeads || "none"}
    
    DEALS (${deals.length} total, Total Value: $${totalDealValue.toLocaleString()}): ${stageBreakdown || "none"}
    Recent Deals: ${recentDeals || "none"}
    
    TASKS (${tasks.length} total, ${pendingTasks} pending): ${taskStatusBreakdown || "none"}
    
    CONTACTS (${contacts.length} total)
    Recent Contacts: ${recentContacts || "none"}
    
    COMPANIES (${companies.length} total)
    Recent Companies: ${recentCompanies || "none"}
    
    INVOICES (${invoices.length} total, ${paidInvoices.length} Paid, ${overdueInvoices.length} Overdue, Revenue: $${totalRevenue.toLocaleString()})
    Recent Invoices: ${recentInvoices || "none"}
    
    PROJECTS (${projects.length} total, ${activeProjects.length} Active)
    Recent Projects: ${recentProjects || "none"}
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
