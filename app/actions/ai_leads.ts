"use server";

import { getAIAdapter } from "@/lib/ai/service";
import { updateLead } from "@/lib/firestore/leads";
import type { Lead } from "@/types/crm";
import { Timestamp } from "firebase/firestore";

export interface AILeadScoreResult {
  score: number;
  reasoning: string[];
  nextSteps: string[];
}

export interface AICompanyEnrichmentResult {
  industry: string;
  employeeCount: string;
  keyTech: string[];
  summary: string;
  location?: string;
  foundedYear?: string;
}

/**
 * Generates a qualification score (0-100) for a lead based on available data.
 */
export async function scoreLead(lead: Lead): Promise<{ success: boolean; data?: AILeadScoreResult; error?: string }> {
  try {
    const { service, model, temperature } = getAIAdapter('leads');

    const prompt = `
    Analyze this sales lead and provide a qualification score (0-100) based on ideal customer profile fit.
    
    LEAD PROFILE:
    Name: ${lead.firstName} ${lead.lastName}
    Job Title: ${lead.jobTitle || "Unknown"}
    Company: ${lead.companyName || "Unknown"}
    Industry: Unknown
    Source: ${lead.source}
    Status: ${lead.status}
    Value: $${lead.value}
    
    CRITERIA for High Score:
    - Director/VP/C-Level titles
    - High potential deal value
    - Known tech/software industries
    
    Respond in JSON format:
    {
      "score": number, // 0-100
      "reasoning": ["point 1", "point 2", "point 3"],
      "nextSteps": ["action 1", "action 2"]
    }
    `;

    const result = await service.generateJSON<AILeadScoreResult>({
      prompt,
      model,
      temperature,
    });

    // Cache the result in the lead document
    await updateLead(lead.id, {

        aiScore: result.score,
        aiReasoning: result.reasoning,
        aiLastUpdated: Timestamp.now(),
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error("AI Lead Scoring Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Enriches company data using AI knowledge.
 */
export async function enrichLead(companyName: string, website?: string): Promise<{ success: boolean; data?: AICompanyEnrichmentResult; error?: string }> {
  try {
    if (!companyName) return { success: false, error: "Company name is required" };

    const { service, model, temperature } = getAIAdapter('leads'); // Using 'leads' config for enrichment too

    const prompt = `
    Provide detailed business intelligence for the company: "${companyName}" ${website ? `(${website})` : ""}.
    
    If exact data is unknown, make an educated guess based on typical companies in this sector, but mark it as estimate.
    
    Respond in JSON format:
    {
      "industry": "Specific Industry",
      "employeeCount": "e.g. 50-200",
      "keyTech": ["Tech 1", "Tech 2"],
      "summary": "Brief 2-sentence business summary",
      "location": "HQ City, Country",
      "foundedYear": "Year or 'Unknown'"
    }
    `;

    const result = await service.generateJSON<AICompanyEnrichmentResult>({
      prompt,
      model,
      temperature,
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error("AI Enrichment Error:", error);
    return { success: false, error: error.message };
  }
}
