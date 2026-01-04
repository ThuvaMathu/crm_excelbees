/**
 * AI Prompts for Competitor Analysis
 * All prompts used throughout the 10-step workflow
 */

import type { BusinessProfile, CompetitorAnalysis, DiscoveredCompetitor } from '@/types/competitor-analysis';

/**
 * STEP 2: Analyze user's business website
 */
export function getBusinessAnalysisPrompt(websiteContent: string): string {
  return `Analyze this business website and extract key information.

WEBSITE CONTENT:
${websiteContent}

Extract and structure the following information as JSON:

{
  "industry": "The primary industry or category (e.g., 'Digital Marketing Agency', 'SaaS Platform', 'E-commerce Store')",
  "services": ["Array of main products/services offered"],
  "targetAudience": "Who they target (demographics, business size, etc.)",
  "valueProposition": "Main value proposition in 1-2 sentences",
  "geographicScope": "Geographic scope (Local/Regional/National/Global)"
}

Be specific and extract real data from the content provided. Return ONLY valid JSON.`;
}

/**
 * STEP 3: Validate discovered competitors using AI
 */
export function getCompetitorValidationPrompt(
  userBusiness: BusinessProfile,
  competitors: Array<{ name: string; website: string }>
): string {
  return `Given this business profile, validate which of the discovered companies are actual competitors.

USER'S BUSINESS:
- Industry: ${userBusiness.industry}
- Services: ${userBusiness.services.join(', ')}
- Target Audience: ${userBusiness.targetAudience}
- Value Proposition: ${userBusiness.valueProposition}

DISCOVERED COMPANIES:
${competitors.map((c, i) => `${i + 1}. ${c.name} (${c.website})`).join('\n')}

Filter out non-competitors (directories, review sites, unrelated businesses).
Return a JSON array of valid competitor indices (0-based):

{
  "validCompetitorIndices": [0, 2, 3, ...]
}

Return ONLY valid JSON.`;
}

/**
 * STEP 5: Analyze competitor website content
 */
export function getCompetitorContentAnalysisPrompt(
  competitorName: string,
  scrapedContent: string
): string {
  return `Analyze this competitor website content in detail:

COMPETITOR: ${competitorName}

WEBSITE CONTENT:
${scrapedContent.slice(0, 15000)} ${scrapedContent.length > 15000 ? '...(truncated)' : ''}

Extract and structure the following information as JSON:

{
  "valueProposition": "Main value proposition (1-2 sentences)",
  "products": ["Array of key products/services offered"],
  "pricing": {
    "pricingModel": "subscription/one-time/tiered/freemium/custom/not_visible",
    "pricePoints": ["Array of prices found, e.g., '$99/month', '$499 one-time'"],
    "hasFreeTrialOrFreemium": boolean
  },
  "targetAudience": "Who they target (demographics, business size, etc.)",
  "uniqueSellingPoints": ["Array of USPs (max 5)"],
  "contentStrategy": {
    "hasBlog": boolean,
    "blogTopics": ["Array of main blog topics if present"],
    "contentTypes": ["Array: how-to, case studies, guides, etc."]
  },
  "websiteQuality": number (1-10 rating),
  "callsToAction": ["Main CTAs found on site"],
  "socialProof": "Brief description of testimonials, case studies, client logos mentioned",
  "technologyIndicators": ["Any tech/platforms mentioned, e.g., Shopify, WordPress"]
}

Be specific and extract real data from the content provided. If information is not available, use empty arrays or "not_visible". Return ONLY valid JSON.`;
}

/**
 * STEP 6: Analyze social media presence (optional)
 */
export function getSocialMediaAnalysisPrompt(
  competitorName: string,
  searchResults: string
): string {
  return `Based on these search results about ${competitorName}'s social media presence:

SEARCH RESULTS:
${searchResults}

Summarize their social media presence as JSON:

{
  "platforms": ["Array of platforms they're active on"],
  "estimatedFollowers": {
    "instagram": "5.2K",
    "linkedin": "2.1K",
    "facebook": "3.8K"
  },
  "activityLevel": "high/medium/low",
  "contentFocus": "Brief description of what they post about",
  "overallStrategy": "One sentence summary of their social media strategy"
}

If insufficient data is available, return:
{
  "platforms": [],
  "estimatedFollowers": {},
  "activityLevel": "low",
  "contentFocus": "insufficient data",
  "overallStrategy": "insufficient data"
}

Return ONLY valid JSON.`;
}

/**
 * STEP 7: Analyze pricing in detail (optional)
 */
export function getPricingAnalysisPrompt(pricingPageContent: string): string {
  return `Extract ALL pricing information from this pricing page:

PRICING PAGE CONTENT:
${pricingPageContent}

Return detailed JSON:

{
  "pricingTiers": [
    {
      "name": "Tier name",
      "price": "$299",
      "billingCycle": "monthly/annual/one-time",
      "features": ["Array of features included"]
    }
  ],
  "discounts": "Any promotional pricing or discounts mentioned",
  "comparisonToCompetitors": "Any competitive claims made",
  "valueMetrics": "How they justify pricing (ROI, savings, etc.)"
}

Return ONLY valid JSON.`;
}

/**
 * STEP 8: Generate comprehensive competitive intelligence report
 */
export function getCompetitiveInsightsPrompt(
  userBusiness: BusinessProfile,
  competitorAnalyses: Array<{ name: string; analysis: CompetitorAnalysis }>,
  userConcerns?: string[],
  keyProducts?: string[]
): string {
  const concernsText = userConcerns && userConcerns.length > 0
    ? `\nUSER'S SPECIFIC CONCERNS: ${userConcerns.join(', ')}`
    : '';
  
  const productsText = keyProducts && keyProducts.length > 0
    ? `\nKEY PRODUCTS/SERVICES TO FOCUS ON: ${keyProducts.join(', ')}`
    : '';

  return `You are an expert competitive intelligence analyst. Analyze this competitive landscape.

USER'S BUSINESS:
- Industry: ${userBusiness.industry}
- Services: ${userBusiness.services.join(', ')}
- Target Audience: ${userBusiness.targetAudience}
- Value Proposition: ${userBusiness.valueProposition}
- Geographic Scope: ${userBusiness.geographicScope}${concernsText}${productsText}

COMPETITOR DATA:
${competitorAnalyses.map((c, i) => `
${i + 1}. ${c.name}
   - Value Proposition: ${c.analysis.valueProposition}
   - Products: ${c.analysis.products.join(', ')}
   - Target Audience: ${c.analysis.targetAudience}
   - Pricing: ${c.analysis.pricing.pricePoints.join(', ') || 'Not visible'}
   - USPs: ${c.analysis.uniqueSellingPoints.join('; ')}
   - Website Quality: ${c.analysis.websiteQuality}/10
`).join('\n')}

Provide a comprehensive competitive intelligence report with these sections as JSON:

{
  "executiveSummary": "3-4 sentence overview of the competitive landscape and your market position",
  "marketPositioning": "Describe where each competitor sits on key dimensions (price, service breadth, target market). Identify your position and gaps.",
  "competitorProfiles": [
    {
      "name": "Competitor Name",
      "summary": "One sentence positioning",
      "strengths": ["3-4 key strengths"],
      "weaknesses": ["3-4 vulnerabilities"],
      "pricingStrategy": "How they price and position",
      "differentiation": "What makes them unique",
      "threatLevel": "high/medium/low",
      "threatExplanation": "Why this threat level"
    }
  ],
  "opportunities": [
    {
      "type": "market_gap/content/pricing/service/audience",
      "title": "Brief title",
      "description": "What the opportunity is",
      "howToExploit": "How to take advantage of it",
      "effort": "low/medium/high"
    }
  ],
  "threats": ["Array of key threats to watch"],
  "recommendations": [
    {
      "category": "quick_win/medium_term/long_term",
      "title": "Recommendation title",
      "description": "What to do",
      "howToExecute": ["Step 1", "Step 2", "Step 3"],
      "expectedImpact": "What impact this will have"
    }
  ],
  "monitoringPlan": {
    "trackingFrequency": "What to track monthly/quarterly",
    "competitorsToWatch": ["Which competitors to monitor closely"],
    "keyMetrics": ["Metrics to track"]
  },
  "keyTakeaways": ["5 bullet points: Most important insights"]
}

Make the report actionable, specific, and tailored to helping this business compete effectively. Use concrete examples from the competitor data. Be direct and honest about both opportunities and challenges.

Return ONLY valid JSON.`;
}

/**
 * STEP 3: Web search for competitors (fallback/supplement)
 */
export function getCompetitorDiscoveryPrompt(
  businessName: string,
  industry: string,
  location: string
): string {
  return `Search the web and find top competitors for "${businessName}" in the ${industry} industry. Location: ${location}.

Find 10-15 actual competing companies (not directories or review sites).

Return a JSON array:

{
  "competitors": [
    {
      "name": "Company Name",
      "website": "https://example.com",
      "description": "Brief description of what they do"
    }
  ]
}

Return ONLY valid JSON.`;
}
