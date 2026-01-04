import { NextRequest, NextResponse } from "next/server";
import { AIProviderFactory } from "@/services/ai/provider-factory";
import { getAIConfig } from "@/lib/ai/config";

// Force dynamic since we use dynamic params
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ feature: string }> }
) {
  try {
    const { feature } = await params;
    const { action, prompt, context, userId, workspaceId } = await req.json();

    if (!prompt || !userId || !workspaceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Determine complexity from config or request
    // TODO: Map feature to complexity mapping if not provided
    const complexity = "routine"; 

    // --- Feature Dispatcher ---
    
    // 1. SEO Analyzer
    if (feature === "seo" && action === "analyze_page") {
       const { SEOAnalyzerService } = await import("@/services/marketing/seo/analyzer");
       const result = await SEOAnalyzerService.analyzePage(context.url, userId, workspaceId);
       return NextResponse.json({ content: JSON.stringify(result) }); // serialized for generic handling on client
    }

    // 2. Keyword Research
    if (feature === "keywords" && action === "research") {
        const { KeywordResearcherService } = await import("@/services/marketing/keywords/researcher");
        const results = await KeywordResearcherService.researchKeywords(context.seed, userId, workspaceId);
        return NextResponse.json({ content: JSON.stringify(results) });
    }

    // 3. Blog Writer
    if (feature === "blog") {
        const { BlogWriterService } = await import("@/services/marketing/content/blog-writer");
        
        if (action === "generate_outline") {
            const outline = await BlogWriterService.generateOutline(context.topic, context.tone, userId, workspaceId);
            return NextResponse.json({ content: JSON.stringify(outline) });
        }
        
        if (action === "generate_draft") {
            const draft = await BlogWriterService.generateDraft(context.outline, context.tone, userId, workspaceId);
            return NextResponse.json({ content: draft });
        }
    }

    // 4. Competitor Analysis
    if (feature === "competitors" && action === "analyze") {
        const { CompetitorAnalyzerService } = await import("@/services/marketing/competitors/analyzer");
        const result = await CompetitorAnalyzerService.analyzeCompetitor(context.domain, userId, workspaceId);
        return NextResponse.json({ content: JSON.stringify(result) });
    }

    // 5. Email Campaign Manager
    if (feature === "email_campaign") {
        const { EmailCampaignService } = await import("@/services/marketing/email/campaign-manager");

        if (action === "generate_subjects") {
            const subjects = await EmailCampaignService.generateSubjectLines(context.topic, context.audience, userId, workspaceId);
            return NextResponse.json({ content: JSON.stringify(subjects) });
        }

        if (action === "generate_content") {
            const content = await EmailCampaignService.generateEmailContent(context.topic, context.audience, context.tone, userId, workspaceId);
            return NextResponse.json({ content: content });
        }
        
        if (action === "save") {
            const id = await EmailCampaignService.saveCampaign(context.campaignData, workspaceId);
            return NextResponse.json({ id });
        }

        if (action === "send") {
            await EmailCampaignService.sendCampaign(context.campaignId);
            return NextResponse.json({ success: true });
        }
    }

    // 6. Social Media Manager
    if (feature === "social") {
        const { SocialMediaManagerService } = await import("@/services/marketing/social/manager");
        
        if (action === "generate_posts") {
             const posts = await SocialMediaManagerService.generatePosts(context.topic, context.platforms, context.tone, userId, workspaceId);
             return NextResponse.json({ content: JSON.stringify(posts) });
        }
    }

    // 7. Ad Copy Generator
    if (feature === "ads") {
        const { AdCopyGeneratorService } = await import("@/services/marketing/ads/copy-generator");
        
        if (action === "generate_ads") {
             const ads = await AdCopyGeneratorService.generateAdCopy(context.product, context.audience, context.benefit, context.platform, userId, workspaceId);
             return NextResponse.json({ content: JSON.stringify(ads) });
        }
    }

    // 8. Landing Page Analyzer
    if (feature === "landing_page") {
        const { LandingPageAnalyzerService } = await import("@/services/marketing/landing-pages/analyzer");
        
        if (action === "discover") {
             const pages = await LandingPageAnalyzerService.discoverPages(context.domain);
             return NextResponse.json({ content: JSON.stringify(pages) });
        }
        
        if (action === "analyze_page") {
             const audit = await LandingPageAnalyzerService.analyzePage(context.url, userId, workspaceId);
             return NextResponse.json({ content: JSON.stringify(audit) });
        }
    }









    if (action === "json") {
       // Extract JSON
       // We need a schema for this feature.
       // For now, assuming schema is passed in context or predefined (Simplified for Step 3)
       const schema = context.schema || "{}"; 
       const result = await AIProviderFactory.extractJson(
         prompt, 
         schema, 
         context, 
         { feature, complexity, userId, workspaceId }
       );
       return NextResponse.json(result);
    } else {
       // Generate Content
       const result = await AIProviderFactory.generate(
         prompt, 
         context, 
         { feature, complexity, userId, workspaceId }
       );
       return NextResponse.json({ content: result });
    }

  } catch (error: any) {
    console.error("[Marketing API] Error Details:", {
        message: error.message,
        stack: error.stack,
        feature: params, // might be promise, so just logging context if possible
    });
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
