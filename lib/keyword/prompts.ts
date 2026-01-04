/**
 * AI Prompts for Keyword Research
 */

import type { BusinessContext, KeywordCompetitor, SelectedPage, PageContent, ExtractedKeyword } from '@/types/keyword-research';

/**
 * Prompt for extracting business context from website content
 */
export function getBusinessContextPrompt(websiteContent: string): string {
  return `Analyze this business website content and extract structured business information.

WEBSITE CONTENT:
${websiteContent.substring(0, 8000)}

Extract the following information as JSON:
{
  "industry": "string (specific industry/niche)",
  "mainServices": ["string array of 3-5 main services/products"],
  "targetAudience": "string (who is the target customer)",
  "businessType": "B2B" | "B2C" | "Local" | "E-commerce",
  "geographicScope": "Local" | "Regional" | "National" | "Global"
}

Be specific and accurate. Return ONLY valid JSON.`;
}

/**
 * Prompt for validating discovered competitors
 */
export function getCompetitorValidationPrompt(
  competitors: Array<{ name: string; website: string; relevanceReason?: string }>,
  businessContext: BusinessContext
): string {
  return `Validate if these are actual competitors for the user's business.

USER'S BUSINESS:
- Industry: ${businessContext.industry}
- Services: ${businessContext.mainServices.join(', ')}
- Target Audience: ${businessContext.targetAudience}
- Business Type: ${businessContext.businessType}

DISCOVERED COMPETITORS:
${competitors.map((c, i) => `${i + 1}. ${c.name} (${c.website})${c.relevanceReason ? ` - ${c.relevanceReason}` : ''}`).join('\n')}

Filter out:
- Non-competitors (different industry/services)
- Marketplaces or directories
- Unrelated businesses
- Duplicate entries

Return validated list as JSON array:
[
  {
    "name": "string",
    "website": "string",
    "isValid": boolean,
    "reason": "string (why valid or invalid)"
  }
]`;
}

/**
 * Prompt for categorizing sitemap URLs
 */
export function getSitemapCategorizationPrompt(urls: string[]): string {
  const urlList = urls.slice(0, 200).join('\n'); // Limit to 200 URLs to avoid token limits
  
  return `Categorize these website pages from a sitemap.

URLs:
${urlList}

Categorize each URL as:
- home: Homepage
- about: About/Company pages
- services: Service/Product pages
- blog: Blog posts
- location: Location-specific pages
- case-study: Case studies/Portfolio
- resource: Resources/Guides/Downloads
- other: Other content

Also identify:
- ID-based pages (e.g., /blog/post-123, /product/item-456)
- Dynamic pages (e.g., /category/*, /tag/*)

Return as JSON:
{
  "categorizedPages": [
    {
      "url": "string",
      "category": "string",
      "title": "string (extracted from URL path)",
      "isDynamic": boolean,
      "priority": number (1-10, based on importance for SEO analysis)"
    }
  ],
  "statistics": {
    "totalPages": number,
    "pagesByCategory": { "category": count }
  }
}`;
}

/**
 * Prompt for extracting page metadata
 */
export function getPageMetadataPrompt(pageUrl: string, markdownContent: string): string {
  return `Extract metadata from this page content.

URL: ${pageUrl}

CONTENT:
${markdownContent.substring(0, 5000)}

Extract as JSON:
{
  "title": "string (page title)",
  "mainTopic": "string (what is this page about in 5-10 words)",
  "contentType": "string (service page, blog post, guide, landing page, etc)",
  "wordCount": number (estimate),
  "hasStructuredData": boolean (looks like it has schema markup or structured content),
  "contentQuality": number (1-10, based on depth, clarity, and value)"
}

Return ONLY valid JSON.`;
}

/**
 * Prompt for extracting keywords from page content
 */
export function getKeywordExtractionPrompt(
  pages: Array<{ pageUrl: string; competitorName: string; category: string; content: string }>,
  businessContext: BusinessContext
): string {
  const pagesContent = pages.map((p, i) => 
    `PAGE ${i + 1}: ${p.competitorName} - ${p.pageUrl}
Category: ${p.category}
Content: ${p.content.substring(0, 3000)}
---`
  ).join('\n\n');

  return `Extract SEO keywords from these competitor pages.

USER'S BUSINESS CONTEXT:
- Industry: ${businessContext.industry}
- Services: ${businessContext.mainServices.join(', ')}
- Target Audience: ${businessContext.targetAudience}

COMPETITOR PAGES:
${pagesContent}

For each page, extract:

1. PRIMARY KEYWORDS (1-3 per page):
   - Main topic keywords that the page targets
   - Keywords that appear in title, headings, early content
   - High commercial/search value keywords

2. SECONDARY KEYWORDS (15-30 per page):
   - Supporting keywords throughout content
   - Long-tail variations
   - Related terms and synonyms
   - QUESTIONS (Who, What, Where, How...) and SENTENCES (4+ words)

3. KEYWORD CONTEXT:
   - Search intent (informational/commercial/transactional/navigational)
   - Topic relevance to user's business (high/medium/low)
   - Keyword usage pattern (naturally woven / keyword-stuffed / minimal)

Return as JSON array:
[
  {
    "pageUrl": "string",
    "competitorName": "string",
    "primaryKeywords": [
      {
        "keyword": "string",
        "occurrences": number,
        "prominence": number (1-10, based on title/heading placement)"
      }
    ],
    "secondaryKeywords": [
      {
        "keyword": "string",
        "occurrences": number
      }
    ],
    "searchIntent": "string",
    "relevanceToUser": "high" | "medium" | "low",
    "contentStrategy": "string (brief description of keyword strategy observed)"
  }
]

Focus on extracting keywords that would be valuable for the user's business in ${businessContext.industry}.`;
}

/**
 * Prompt for consolidating and deduplicating keywords
 */
export function getKeywordConsolidationPrompt(
  aggregatedKeywords: Array<{
    keyword: string;
    totalOccurrences: number;
    competitors: string[];
    categories: string[];
    avgProminence: number;
  }>
): string {
  const keywordList = aggregatedKeywords.slice(0, 100).map(k => 
    `"${k.keyword}" - ${k.totalOccurrences} occurrences, ${k.competitors.length} competitors, prominence: ${k.avgProminence.toFixed(1)}`
  ).join('\n');

  return `Deduplicate and consolidate these keywords found across competitor sites.

KEYWORDS:
${keywordList}

Tasks:
1. Merge semantic duplicates:
   Example: "seo services" = "search engine optimization services"
   Keep the most commonly used version as primary
   IMPORTANT: Do NOT merge distinct questions or long-tail sentences into short keywords. Preserve them as separate entries.

2. Group keyword variations:
   Example: "local seo", "local search optimization", "local seo services"
   Primary: "local seo"
   Variations: ["local search optimization", "local seo services"]

3. Identify keyword families:
   Example family: "email marketing"
   - email marketing automation
   - email marketing software
   - email marketing tips
   - email marketing campaign

4. Calculate keyword score based on:
   - Frequency across competitors (more = better)
   - Prominence (title/heading placement)
   - Relevance to user's business
   - Search intent alignment

Return consolidated keyword list as JSON:
[
  {
    "primaryKeyword": "string",
    "variations": ["string"],
    "keywordFamily": "string (parent topic)",
    "totalOccurrences": number,
    "usedByCompetitors": number,
    "avgProminence": number,
    "searchIntent": "string",
    "relevanceScore": number (1-10),
    "sources": [
      { "competitor": "string", "pageUrl": "string", "category": "string" }
    ]
  }
]

Sort by relevanceScore descending. Return top 300 keywords.`;
}

/**
 * Prompt for selecting final keywords
 */
export function getKeywordSelectionPrompt(
  enrichedKeywords: Array<any>,
  requestedCount: number,
  businessContext: BusinessContext
): string {
  const keywordList = enrichedKeywords.map((k, i) => 
    `${i + 1}. "${k.primaryKeyword}" - Vol: ${k.searchVolume}, Diff: ${k.difficulty}, Intent: ${k.searchIntent}, Score: ${k.relevanceScore}`
  ).join('\n');

  return `Select the best ${requestedCount} keywords for this business from the enriched keyword list.

BUSINESS:
- Industry: ${businessContext.industry}
- Services: ${businessContext.mainServices.join(', ')}
- Target Audience: ${businessContext.targetAudience}
- Business Type: ${businessContext.businessType}

ENRICHED KEYWORDS:
${keywordList}

Selection criteria (in priority order):
1. High relevance to user's services
2. Balance of difficulty (mix of low, medium, high)
3. Variety of search intent (informational, commercial, transactional)
4. Used by multiple competitors (validated opportunity)
5. Good search volume relative to difficulty
6. Mix of short-tail (2 words) and long-tail (3-5 words)
7. Coverage of different keyword families (diversity)

If the provided list has fewer than ${requestedCount} keywords, GENERATE additional high-quality, relevant keywords to meet the target count of ${requestedCount}.

Return top ${requestedCount} keywords as JSON array with:
- All existing keyword data
- For generated keywords, provide estimated searchVolume and difficulty
- selectionReason: Brief explanation why this keyword was selected
- strategicValue: "quick-win" | "core-target" | "long-term-goal"

Ensure the final list includes:
- At least 3 "quick-win" keywords (low difficulty, decent volume)
- At least 50% "Key Sentences" (Questions or Long-tail keywords with 4+ words) to ensure coverage of specific user queries.
- Majority "core-target" keywords (medium difficulty, high relevance)
- 1-2 "long-term-goal" keywords (high difficulty, high volume)

Return as JSON array.`;
}

/**
 * Prompt for generating comprehensive strategy report
 */
export function getStrategyGenerationPrompt(data: {
  businessContext: BusinessContext;
  competitors: KeywordCompetitor[];
  totalPagesScraped: number;
  totalKeywordsExtracted: number;
  selectedKeywords: Array<any>;
}): string {
  const keywordList = data.selectedKeywords.map(k => 
    `- "${k.primaryKeyword}" (${k.strategicValue}, ${k.searchVolume} vol, ${k.difficulty} diff)`
  ).join('\n');

  return `Generate a comprehensive keyword strategy report.

USER'S BUSINESS:
- Industry: ${data.businessContext.industry}
- Services: ${data.businessContext.mainServices.join(', ')}
- Target Audience: ${data.businessContext.targetAudience}
- Business Type: ${data.businessContext.businessType}

RESEARCH SUMMARY:
- Competitors analyzed: ${data.competitors.length}
- Pages scraped: ${data.totalPagesScraped}
- Total keywords extracted: ${data.totalKeywordsExtracted}
- Final selected keywords: ${data.selectedKeywords.length}

SELECTED KEYWORDS:
${keywordList}

Create a strategic report with:

1. EXECUTIVE SUMMARY
   - Overview of keyword opportunity landscape
   - Total search volume across selected keywords
   - Competitive positioning insights
   - Key strategic recommendations (3-5 bullets)

2. KEYWORD BREAKDOWN BY TYPE
   Quick Wins (Low difficulty):
   - List keywords with action plan for each
   
   Core Targets (Medium difficulty):
   - List keywords with content strategy for each
   
   Long-term Goals (High difficulty):
   - List keywords with sustained effort plan

3. KEYWORD FAMILIES & TOPIC CLUSTERS
   Group keywords into content themes:
   - Family name
   - Keywords in family
   - Recommended content strategy
   - Total family search volume

4. COMPETITOR KEYWORD INSIGHTS
   - Which keywords are ALL competitors targeting (high priority)
   - Which keywords ONLY some competitors target (opportunities)
   - Keywords NO competitors focus on (blue ocean)
   - Competitive gaps you can exploit

5. CONTENT RECOMMENDATIONS
   For each keyword cluster:
   - Recommended content type (blog, service page, guide, tool)
   - Target content length
   - Key topics to cover (based on competitor analysis)
   - Internal linking strategy

6. SEARCH INTENT DISTRIBUTION
   - Informational keywords: count and strategy
   - Commercial keywords: count and strategy
   - Transactional keywords: count and strategy

7. PRIORITY ACTION PLAN
   MONTH 1:
   - 3-5 keywords to target immediately
   - Specific actions for each
   
   MONTH 2-3:
   - Next set of keywords
   - Content production plan
   
   MONTH 4-6:
   - Long-term keyword targets
   - Link building and authority building

8. SUCCESS METRICS
   - Expected traffic increase (realistic estimate)
   - Target rankings by timeframe
   - Conversion potential by keyword

9. RISK ASSESSMENT
   - Keyword cannibalization risks
   - Over-optimization warnings
   - Competitive threats

10. NEXT STEPS CHECKLIST
    Immediate actions, short-term goals, long-term strategy

Make the report actionable, specific, and tailored to the user's business and competitive landscape.

Return as JSON with all sections.`;
}
