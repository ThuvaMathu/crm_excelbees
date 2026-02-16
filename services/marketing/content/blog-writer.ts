import { AIProviderFactory } from "@/services/ai/provider-factory";

export interface BlogOutline {
  title: string;
  headings: string[];
  keywords: string[];
}

export class BlogWriterService {
  /**
   * Step 1: Generate a structured outline
   */
  static async generateOutline(topic: string, tone: string, userId: string, workspaceId: string): Promise<BlogOutline> {
    const prompt = `
      Act as a professional Blog Editor.
      Topic: "${topic}"
      Tone: "${tone}"
      
      Create a detailed blog post outline.
      Include a catchy Title, 4-6 main Section Headings, and 3-5 target SEO keywords.
      
      Output ONLY valid JSON matching:
      {
        "title": "string",
        "headings": ["string"],
        "keywords": ["string"]
      }
    `;

    return AIProviderFactory.extractJson<BlogOutline>(
      prompt,
      { topic, tone },
      { 
        feature: "blog_writer", 
        complexity: "creative", // Use generic creative model (GPT-4o-mini or Gemini Pro)
        userId, 
        workspaceId 
      }
    );
  }

  /**
   * Step 2: Generate full content based on the approved outline
   */
  static async generateDraft(outline: BlogOutline, tone: string, userId: string, workspaceId: string): Promise<string> {
    const prompt = `
      Act as a professional content writer.
      
      Write a full blog post based on this outline:
      Title: ${outline.title}
      Headings: ${outline.headings.join(", ")}
      Keywords to use: ${outline.keywords.join(", ")}
      Tone: ${tone}
      
      Requirements:
      - Use markdown formatting (H1, H2, **bold**, lists).
      - Write engaging, high-quality content for each section.
      - Ensure the post is at least 600 words.
      - Optimize for search intent.
    `;

    return AIProviderFactory.generate(
      prompt,
      { outline, tone },
      {
        feature: "blog_writer",
        complexity: "complex", // Use GPT-4o for high quality long-form writing
        userId,
        workspaceId,
        useCache: false // Always fresh content
      }
    );
  }
}
