"use server";

import { getAIAdapter } from "@/lib/ai/service";



export async function generateText(prompt: string) {
  try {
    // defaults to 'email' strategy for email-related operations
    const { service, model, temperature } = getAIAdapter('email');

    const response = await service.generateText({
      prompt: prompt,
      temperature: temperature,
      model: model,
    });

    return { success: true, data: response.text };
  } catch (error: any) {
    console.error("AI Text Generation Error:", error);
    return { success: false, error: error.message };
  }
}
