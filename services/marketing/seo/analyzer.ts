import { AIProviderFactory } from "@/services/ai/provider-factory";
import { MarketingSEOAudit } from "@/types/marketing";
import { Timestamp } from "firebase/firestore";

export class SEOAnalyzerService {
  /**
   * Orchestrates the full SEO analysis: Crawl -> Extract -> AI Audit
   */
  static async analyzePage(url: string, userId: string, workspaceId: string): Promise<MarketingSEOAudit> {
    
    // 1. Crawl / Fetch (Simplified for Node environment)
    let html = "";
    let status = 0;
    let loadTime = 0;
    
    // Normalize URL
    let targetUrl = url;
    if (!targetUrl.startsWith("http")) {
        targetUrl = "https://" + targetUrl;
    }

    try {
      const startTime = performance.now();
      // Use a "Real" browser user-agent to avoid immediate blocking by some WAFs
      const res = await fetch(targetUrl, { 
        headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
        }
      });
      
      if (!res.ok) {
          throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
      }

      loadTime = Math.round(performance.now() - startTime);
      status = res.status;
      html = await res.text();
    } catch (e: any) {
      console.warn(`[SEO Crawler] Failed to crawl ${url}:`, e.message);
      // Fallback: If crawl fails, we proceed with empty HTML so AI can at least analyze the URL structure
      // or we re-throw if strict. Let's proceed with a warning state.
      status = 0;
      html = `<!-- Crawl Failed: ${e.message} -->`;
    }

    // 2. Prepare Context for AI
    // We truncate HTML to avoid token limits, focusing on Head and Body structure
    const truncatedHtml = this.cleanAndTruncateHtml(html);

    const context = {
        url,
        status,
        loadTimeMs: loadTime,
        htmlSample: truncatedHtml
    };

    // 3. Prompt AI for structured audit
    const prompt = `
      You are an elite Technical SEO Auditor. Analyze the provided HTML and performance metrics.
      
      Target URL: ${url}
      Status: ${status}
      Load Time: ${loadTime}ms
      
      Identify 3-5 critical technical, content, or UX issues.
      Provide detailed recommendations.
      Calculate an overall SEO Score (0-100).
      
      Output ONLY valid JSON matching this TypeScript interface:
      {
        pageUrl: string;
        score: number;
        issues: { category: "technical" | "content" | "ux"; issue: string; impact: "low" | "medium" | "high" }[];
        recommendations: string[];
      }
    `;

    // 4. Call AI (using "complex" logic implementation via factory if needed, acting as JSON extractor)
    const auditData = await AIProviderFactory.extractJson<Partial<MarketingSEOAudit>>(
        prompt,

        context,
        { 
            feature: "seoAnalyzer", 
            complexity: "routine", // Gemini Flash is good enough for this
            userId, 
            workspaceId 
        } 
    );

    // 5. Structure Final Result
    return {
        id: crypto.randomUUID(),
        pageUrl: url,
        score: auditData.score || 0,
        issues: auditData.issues || [],
        recommendations: auditData.recommendations || [],
        auditDate: Timestamp.now(),
        workspaceId
    };
  }

  private static cleanAndTruncateHtml(html: string): string {
    // Basic cleanup: remove scripts, styles, comments to save tokens
    let clean = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/\s+/g, " ");
    
    // Limit to ~20k chars (approx 5k tokens) to be safe
    return clean.substring(0, 20000);
  }
}
