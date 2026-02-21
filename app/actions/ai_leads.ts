"use server";

import { getAIAdapter } from "@/lib/ai/service";
import { updateLead } from "@/lib/firestore/leads";
import type { Lead } from "@/types/crm";
import { Timestamp } from "firebase/firestore";
import { writeFileSync } from "fs";
import { join } from "path";

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

    const rawResult = await service.generateJSON<Record<string, any>>({
      prompt,
      model,
      temperature,
    });

    // Write raw response to a debug file for inspection
    try {
      const debugPath = join(process.cwd(), "enrich-debug.json");
      writeFileSync(debugPath, JSON.stringify(rawResult, null, 2), "utf-8");
      console.log("AI Enrichment raw response written to:", debugPath);
      console.log("AI Enrichment raw response:", JSON.stringify(rawResult));
    } catch (e) {
      console.log("Could not write debug file:", e);
    }

    // Deep extraction: handle arrays and nested objects
    let data: Record<string, any> = rawResult;
    // If the response is an array, take the first element
    if (Array.isArray(rawResult)) {
      data = rawResult[0] || {};
    }
    // If the response has a single top-level key that contains an object, unwrap it
    const keys = Object.keys(data);
    if (keys.length === 1 && typeof data[keys[0]] === "object" && !Array.isArray(data[keys[0]])) {
      data = data[keys[0]];
    }

    // Case-insensitive key lookup helper
    const findValue = (obj: Record<string, any>, ...possibleKeys: string[]): any => {
      for (const key of possibleKeys) {
        // Direct match
        if (obj[key] !== undefined) return obj[key];
        // Case-insensitive match
        const found = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
        if (found && obj[found] !== undefined) return obj[found];
      }
      return undefined;
    };

    const result: AICompanyEnrichmentResult = {
      industry: findValue(data, "industry") || "Unknown",
      employeeCount: String(findValue(data, "employeeCount", "employee_count", "employees", "size") || "Unknown"),
      keyTech: findValue(data, "keyTech", "key_tech", "technologies", "tech_stack", "techStack") || [],
      summary: findValue(data, "summary", "description", "overview", "about") || "No summary available",
      location: findValue(data, "location", "headquarters", "hq", "address") || undefined,
      foundedYear: String(findValue(data, "foundedYear", "founded_year", "founded", "yearFounded", "year_founded") || ""),
    };

    return { success: true, data: result };
  } catch (error: any) {
    console.error("AI Enrichment Error:", error);
    return { success: false, error: error.message };
  }
}
