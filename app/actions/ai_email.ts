"use server";

import { getAIAdapter } from "@/lib/ai/service";

export interface EmailAnalysisResult {
    sentiment: "Positive" | "Neutral" | "Negative" | "Urgent";
    actionItems: string[];
    summary: string;
    keyPoints: string[];
}

/**
 * Generates an email draft based on user prompt and context.
 */
export async function generateEmailDraft(
  userPrompt: string,
  contextData: string,
  tone: string = "professional"
) {
  try {
    const { service, model, temperature } = getAIAdapter('email');

    const systemPrompt = `
You are an expert sales assistant. Your goal is to write a perfect email draft based on the user's request and the provided CRM context.

CONTEXT:
${contextData}

INSTRUCTIONS:
- Write the email subject and body.
- Tone: ${tone}
- Be concise and professional.
- Use placeholders like [Name] if information is missing.
- Return the response in JSON format with "subject" and "body" fields.
    `.trim();

    const response = await service.generateJSON<{ subject: string; body: string }>({
      prompt: `${systemPrompt}\n\nUSER REQUEST: ${userPrompt}`,
      temperature: temperature, 
      model: model,
    });

    return { success: true, data: response };
  } catch (error: any) {
    console.error("AI Email Generation Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Analyzes an email content for sentiment and action items.
 */
export async function analyzeEmail(content: string) {
    try {
        const { service, model, temperature } = getAIAdapter('email');

        const prompt = `
        Analyze the following email content:
        "${content}"

        Provide a JSON response with:
        - sentiment: "Positive", "Neutral", "Negative", or "Urgent"
        - summary: A 1-sentence summary
        - actionItems: A list of suggested next steps or extracted to-dos
        - keyPoints: 3 bullet points of main info
        `;

        const response = await service.generateJSON<EmailAnalysisResult>({
            prompt,
            model,
            temperature
        });

        return { success: true, data: response };
    } catch (error: any) {
        console.error("AI Email Analysis Error:", error);
        return { success: false, error: error.message };
    }
}
