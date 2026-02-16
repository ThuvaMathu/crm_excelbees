import { AIProviderFactory } from "@/services/ai/provider-factory";

export interface LandingPageAudit {
    url: string;
    loadTime: number; // ms
    status: number;
    title: string;
    description: string;
    sitemapFound: boolean;
    analysis: {
        score: number;
        usability: string[];
        conversion: string[];
        performance: string[];
    };
}

export class LandingPageAnalyzerService {
  
  /**
   * Attempt to find and parse sitemap.xml to discover pages
   */
  static async discoverPages(domain: string): Promise<string[]> {
      // Normalize domain
      let baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;
      // Remove trailing slash
      baseUrl = baseUrl.replace(/\/$/, "");

      const sitemapUrl = `${baseUrl}/sitemap.xml`;
      console.log("Fetching sitemap:", sitemapUrl);

      try {
          const res = await fetch(sitemapUrl);
          if (res.ok) {
              const xml = await res.text();
              // Simple regex parse for <loc> tags
              const locs = xml.match(/<loc>(.*?)<\/loc>/g);
              if (locs) {
                 return locs.map(l => l.replace(/<\/?loc>/g, "")).slice(0, 20); // Limit to 20 for now
              }
          }
      } catch (e) {
          console.warn("Sitemap fetch failed of parsed empty", e);
      }
      
      // Fallback: If no sitemap, just return root
      return [baseUrl];
  }

  /**
   * Deep Audit of a specific page
   */
  static async analyzePage(url: string, userId: string, workspaceId: string): Promise<LandingPageAudit> {
      // 1. Fetch Page & Measure Perf
      const startTime = performance.now();
      let html = "";
      let status = 0;
      
      try {
          const res = await fetch(url, { headers: { "User-Agent": "ExcelBees-Bot/1.0" } });
          status = res.status;
          html = await res.text();
      } catch (e) {
          throw new Error(`Failed to crawl ${url}`);
      }
      const loadTime = Math.round(performance.now() - startTime);

      // 2. Extract Metadata (Basic)
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1] : "No Title";
      
      const metaDescMatch = html.match(/name="description" content="(.*?)"/);
      const description = metaDescMatch ? metaDescMatch[1] : "No Description";

      // 3. AI Audit for CRO and Usability
      const cleanHtml = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "").substring(0, 15000); // Truncate
      
      const prompt = `
        Act as a Landing Page Conversion Expert.
        
        Analyze this HTML content (truncated).
        URL: ${url}
        Load Time: ${loadTime}ms
        Title: ${title}
        
        Evaluate:
        1. Value Proposition clarity.
        2. Call to Action (CTA) visibility.
        3. Potential performance bottlenecks (implied by bad tag usage).
        
        Output ONLY JSON:
        {
          "score": 0-100,
          "usability": ["point 1", "point 2"],
          "conversion": ["point 1", "point 2"],
          "performance": ["point 1 (e.g. image tags missing alt)", "point 2"]
        }
      `;

      const aiResult = await AIProviderFactory.extractJson<any>(
          prompt, 
          { url }, 
          { feature: "landing_page", complexity: "complex", userId, workspaceId }
      );

      return {
          url,
          loadTime,
          status,
          title,
          description,
          sitemapFound: true, // we assume it existed if we got here or dont care
          analysis: aiResult
      };
  }
}
