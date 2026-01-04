COMPETITOR ANALYSIS - REFACTOR & IMPROVEMENT PLAN & WORKFLOW
=====================================================

OVERVIEW:
---------
Improve the current competitor ananysis in the marketing section.
User provides: Company Website URL + Location + Optional Preferences
System analyzes user's business, discovers competitors, scrapes their websites, 
analyzes data with AI, and generates comprehensive competitive intelligence report.

TECH STACK:
-----------
- Google Places API (competitor discovery)
- Jina AI Reader (website scraping)
- OpenAI GPT-4o (analysis & insights)
- Next.js API Routes (backend processing)
- Database (store analysis results)


WORKFLOW - STEP BY STEP:
=========================

STEP 1: USER INPUT COLLECTION
------------------------------
Page: /competitors (new analysis form)

Required Inputs:
  ✓ Company Website URL
  ✓ Business Location (city, country)
  ✓ Number of competitors to analyze (default: 5, max: 20)

Optional Enhancement Inputs:
  ○ Key products/services to focus on
  ○ Specific concerns (pricing, content strategy, SEO, social media)
  ○ Known competitors to include/exclude (comma-separated URLs)
  ○ Analysis depth (Quick Scan / Standard / Deep Dive)

User clicks "Find Competitors" button → Triggers Step 2


STEP 2: ANALYZE USER'S BUSINESS
--------------------------------
API Route: POST /api/analyze-user-business

Process:
  1. Receive user's website URL from frontend
  2. Scrape user's website using Jina AI:
     → Fetch: https://r.jina.ai/{userWebsiteUrl}
     → Returns: Clean markdown content of entire website
  
  3. Send website content to OpenAI GPT-4o:
     Prompt: "Analyze this business website and extract:
              - Industry/category
              - Main products/services
              - Target audience
              - Value proposition
              - Geographic scope
              Format as JSON."
     
  4. Store extracted business profile in database
  5. Return business summary to frontend

Output:
  {
    industry: "Digital Marketing Agency",
    services: ["SEO", "Content Marketing", "PPC"],
    targetAudience: "Small businesses",
    valueProposition: "Affordable data-driven marketing",
    geographicScope: "Local"
  }


STEP 3: DISCOVER COMPETITORS
-----------------------------
API Route: POST /api/discover-competitors

Process:
  1. Receive: user's business profile + location + preferences
  
  2. METHOD A - Local Competitor Discovery (Google Places API):
     → Query: "{industry} in {location}"
     → Example: "Digital Marketing Agency in Brisbane, Australia"
     → API Call: Google Places Text Search
     → Returns: List of businesses with names, addresses, ratings, place_ids
     
     → For each place_id, fetch details:
       API Call: Google Places Details
       Fields: name, website, rating, user_ratings_total
     
     → Filter: Only businesses with websites
     → Sort: By rating and review count
     → Take top 10-15 results
  
  3. METHOD B - Web-based Competitor Discovery (OpenAI GPT-4o Web Search):
     → If user selected national/global scope OR local results < 5:
     → Prompt: "Search the web and find top competitors for {businessName} 
                in the {industry} industry. Location: {location}.
                Return company names and website URLs."
     → AI searches web and returns competitor list
  
  4. COMBINE & DEDUPLICATE:
     → Merge results from Google Places + Web Search
     → Remove duplicates (match by domain)
     → Remove user's own website if present
  
  5. AI VALIDATION (GPT-4o):
     → Prompt: "Given this business: {userBusinessSummary}
                Are these actual competitors? Filter out non-competitors:
                {discoveredCompetitors}"
     → Returns: Validated competitor list
  
  6. ADD USER-PROVIDED COMPETITORS:
     → If user added "known competitors to include"
     → Append to validated list
  
  7. REMOVE EXCLUDED COMPETITORS:
     → If user added "competitors to exclude"
     → Filter them out
  
  8. LIMIT TO USER'S REQUESTED NUMBER:
     → If user wants 5 competitors, take top 5 by relevance
  
  9. Store competitor list in database
  10. Return to frontend for user confirmation

Output to Frontend:
  [
    { name: "Competitor A", website: "https://competitorA.com", source: "Google Places" },
    { name: "Competitor B", website: "https://competitorB.com", source: "Web Search" },
    ...
  ]

Frontend displays list with checkboxes → User confirms/deselects → Clicks "Analyze"


STEP 4: SCRAPE COMPETITOR WEBSITES
-----------------------------------
API Route: POST /api/scrape-competitors

Process (Runs in Parallel for All Competitors):
  
  For each competitor website:
    1. Check cache: Has this website been scraped in last 24 hours?
       → If YES: Retrieve from database, skip to Step 5
       → If NO: Continue scraping
    
    2. Scrape website using Jina AI Reader:
       → Fetch: https://r.jina.ai/{competitorWebsiteUrl}
       → Returns: Complete website content as clean markdown
       → Handles: JavaScript rendering, multiple pages, navigation
       → Timeout: 30 seconds
    
    3. Store scraped content in database with timestamp
    
    4. Return scraped content

Error Handling:
  - If scraping fails (timeout, 404, blocked):
    → Log error
    → Mark competitor as "scraping failed"
    → Continue with other competitors
    → Still include in analysis with limited data

Output (for each competitor):
  {
    competitorName: "Competitor A",
    websiteUrl: "https://competitorA.com",
    scrapedContent: "# Homepage\n\nWe provide...\n\n## Services...",
    scrapedAt: "2025-01-04T10:30:00Z",
    status: "success"
  }


STEP 5: ANALYZE COMPETITOR WEBSITES
------------------------------------
API Route: POST /api/analyze-competitor-content

Process (Runs in Parallel for All Competitors):
  
  For each competitor:
    1. Send scraped website content to OpenAI GPT-4o:
       
       Prompt: 
       "Analyze this competitor website content in detail:
        
        WEBSITE CONTENT:
        {scrapedMarkdownContent}
        
        Extract and structure the following information as JSON:
        
        1. valueProposition: Main value proposition (1-2 sentences)
        2. products: Array of key products/services offered
        3. pricing: Pricing information if visible, including:
           - pricingModel: (subscription/one-time/tiered/freemium/custom)
           - pricePoints: Array of prices found
           - hasFreeTrialOrFreemium: boolean
        4. targetAudience: Who they target (demographics, business size, etc.)
        5. uniqueSellingPoints: Array of USPs (max 5)
        6. contentStrategy:
           - hasBlog: boolean
           - blogTopics: Array of main blog topics if present
           - contentTypes: Array (how-to, case studies, guides, etc.)
        7. websiteQuality: Rating 1-10 with brief explanation
        8. callsToAction: Main CTAs found on site
        9. socialProof: Testimonials, case studies, client logos mentioned
        10. technologyIndicators: Any tech/platforms mentioned (e.g., Shopify, WordPress)
        
        Be specific and extract real data from the content provided."
    
    2. Parse JSON response from GPT-4o
    3. Store analysis in database
    4. Return structured analysis

Output (for each competitor):
  {
    competitorName: "Competitor A",
    valueProposition: "Fast, affordable SEO services for local businesses",
    products: ["Local SEO", "Google My Business Optimization", "Citation Building"],
    pricing: {
      pricingModel: "tiered",
      pricePoints: ["$299/month", "$599/month", "$999/month"],
      hasFreeTrialOrFreemium: true
    },
    targetAudience: "Small local businesses with 1-10 employees",
    uniqueSellingPoints: [
      "30-day money-back guarantee",
      "Local SEO specialists",
      "No long-term contracts"
    ],
    contentStrategy: {
      hasBlog: true,
      blogTopics: ["Local SEO tips", "Google algorithm updates", "Case studies"],
      contentTypes: ["how-to", "case studies", "industry news"]
    },
    websiteQuality: 7,
    callsToAction: ["Free SEO Audit", "Book Consultation", "Start Free Trial"],
    socialProof: "50+ client testimonials, 15 case studies",
    technologyIndicators: ["WordPress", "Google Analytics"]
  }


STEP 6: SOCIAL MEDIA ANALYSIS (OPTIONAL - Based on User Preferences)
---------------------------------------------------------------------
API Route: POST /api/analyze-social-media

If user selected "social media" as a specific concern:

Process:
  1. For each competitor, use OpenAI GPT-4o Web Search:
     
     Search Query 1: "{competitorName} Instagram followers"
     Search Query 2: "{competitorName} LinkedIn company page"
     Search Query 3: "{competitorName} Facebook page"
     Search Query 4: "{competitorName} Twitter followers"
  
  2. AI extracts from search results:
     - Platform presence (which platforms they're on)
     - Follower counts (approximate if not exact)
     - Recent posts/activity indicators
     - Engagement indicators (likes, comments mentioned in articles)
  
  3. Prompt GPT-4o to summarize:
     "Based on these search results about {competitorName}'s social media:
      {searchResults}
      
      Summarize their social media presence:
      - platforms: Array of platforms they're active on
      - estimatedFollowers: Object with platform: count
      - activityLevel: (high/medium/low)
      - contentFocus: Brief description of what they post about
      - overallStrategy: One sentence summary"
  
  4. Store social media analysis

Output (for each competitor):
  {
    competitorName: "Competitor A",
    socialMedia: {
      platforms: ["Instagram", "LinkedIn", "Facebook"],
      estimatedFollowers: {
        instagram: "5.2K",
        linkedin: "2.1K",
        facebook: "3.8K"
      },
      activityLevel: "high",
      contentFocus: "Client success stories and SEO tips",
      overallStrategy: "Heavy focus on Instagram for visual case studies"
    }
  }

Note: If web search doesn't return good data, mark as "insufficient data"


STEP 7: PRICING DEEP DIVE (If Selected as Specific Concern)
------------------------------------------------------------
API Route: POST /api/analyze-pricing

If user selected "pricing" as a specific concern:

Process:
  1. For each competitor, search for pricing page:
     → Use Jina AI to scrape: {competitorUrl}/pricing
     → Also try: /plans, /packages, /costs
  
  2. Send pricing page content to GPT-4o:
     Prompt: "Extract ALL pricing information from this page:
              {pricingPageContent}
              
              Return detailed JSON:
              - pricingTiers: Array of objects with:
                  {name, price, billingCycle, features: Array}
              - discounts: Any promotional pricing or discounts
              - comparisonToCompetitors: Any competitive claims made
              - valueMetrics: How they justify pricing (ROI, savings, etc.)"
  
  3. Store detailed pricing analysis

Output:
  {
    competitorName: "Competitor A",
    detailedPricing: {
      pricingTiers: [
        {
          name: "Starter",
          price: "$299",
          billingCycle: "monthly",
          features: ["5 keywords", "Monthly reporting", "Local citation building"]
        },
        {
          name: "Growth",
          price: "$599",
          billingCycle: "monthly",
          features: ["15 keywords", "Bi-weekly reporting", "Content creation"]
        }
      ],
      discounts: "10% off annual plans",
      comparisonToCompetitors: "Claims to be 30% cheaper than competitors",
      valueMetrics: "Average client sees 150% increase in organic traffic"
    }
  }


STEP 8: AI COMPETITIVE INTELLIGENCE SYNTHESIS
----------------------------------------------
API Route: POST /api/generate-insights

Process:
  1. Gather all analyzed data:
     - User's business profile
     - All competitor analyses
     - Social media data (if collected)
     - Detailed pricing data (if collected)
  
  2. Send everything to OpenAI GPT-4o with comprehensive prompt:

Prompt:
"You are an expert competitive intelligence analyst. Analyze this competitive landscape.

USER'S BUSINESS:
{userBusinessProfile}

USER'S SPECIFIC CONCERNS:
{userSelectedConcerns} (e.g., pricing, content strategy, SEO)

USER'S PRODUCTS/SERVICES FOCUS:
{keyProductsToFocusOn}

COMPETITOR DATA:
{competitorAnalysesArray}

Provide a comprehensive competitive intelligence report with these sections:

1. EXECUTIVE SUMMARY
   - 3-4 sentence overview of the competitive landscape
   - Your market position relative to competitors

2. MARKET POSITIONING MAP
   - Describe where each competitor sits on key dimensions:
     * Price (budget/mid-range/premium)
     * Service breadth (specialist vs full-service)
     * Target market (SMB/Mid-market/Enterprise)
   - Identify your position and the gaps

3. INDIVIDUAL COMPETITOR PROFILES
   For each competitor, provide:
   
   **[Competitor Name]**
   - Quick Summary: One sentence positioning
   - Strengths: 3-4 key strengths
   - Weaknesses: 3-4 vulnerabilities
   - Pricing Strategy: How they price and position
   - Differentiation: What makes them unique
   - Threat Level: High/Medium/Low with explanation

4. COMPETITIVE GAPS & OPPORTUNITIES
   Identify specific opportunities for the user:
   - Market Gaps: Underserved segments or unmet needs
   - Content Opportunities: Topics competitors aren't covering well
   - Pricing Opportunities: Where you can compete on price or value
   - Service Gaps: Services offered by few or no competitors
   - Audience Segments: Customer types not being targeted
   
   For each opportunity, explain:
   - Why it exists
   - How to exploit it
   - Estimated effort/investment needed

5. THREAT ASSESSMENT
   - Which competitors pose the biggest threat and why
   - Emerging competitive trends to watch
   - Potential future moves by competitors
   - Market dynamics that could shift competitive landscape

6. STRATEGIC RECOMMENDATIONS
   Provide 5-7 specific, actionable recommendations:
   - Quick Wins (can implement in 1-4 weeks)
   - Medium-term Initiatives (1-3 months)
   - Long-term Strategy (3-6 months)
   
   Each recommendation should include:
   - What to do
   - Why it will help you compete
   - How to execute (brief steps)
   - Expected impact

7. COMPETITIVE MONITORING PLAN
   - What to track regularly (monthly/quarterly)
   - Which competitors to watch most closely
   - Key metrics to monitor

8. KEY TAKEAWAYS
   - 5 bullet points: Most important insights from this analysis

Make the report actionable, specific, and tailored to helping this business compete effectively. Use concrete examples from the competitor data. Be direct and honest about both opportunities and challenges."

  3. Receive comprehensive report from GPT-4o
  4. Store report in database
  5. Return to frontend


STEP 9: GENERATE FORMATTED REPORT
----------------------------------
API Route: POST /api/format-report

Process:
  1. Take AI-generated insights
  2. Structure into presentation-ready format:
     - Add data visualizations (pricing comparison tables, positioning matrix)
     - Include competitor website screenshots (optional)
     - Format with proper headings, bullets, emphasis
     - Add executive summary at top
     - Include methodology note at bottom
  
  3. Generate multiple formats:
     - Web view (HTML/React components)
     - PDF export (using PDF generation library)
     - PowerPoint export (optional, for presentations)
  
  4. Store report with unique ID
  5. Return report to frontend


STEP 10: DISPLAY & SAVE REPORT
-------------------------------
Page: /competitors/report/[reportId]

Frontend displays:
  ✓ Executive Summary (collapsible)
  ✓ Market Positioning Visual
  ✓ Competitor Profiles (tabs or accordion)
  ✓ Opportunities & Threats (highlighted)
  ✓ Strategic Recommendations (numbered list)
  ✓ Key Takeaways (summary box)

User Actions:
  - Download as PDF
  - Export to PowerPoint (optional)
  - Share with team (generate shareable link)
  - Schedule email digest (weekly/monthly updates)
  - Re-run analysis (refresh data)


DATABASE SCHEMA:
================

Table: competitor_analyses
  - id (uuid)
  - user_id (uuid)
  - created_at (timestamp)
  - user_business_url (text)
  - user_business_profile (jsonb)
  - location (text)
  - competitors_found (jsonb array)
  - analysis_preferences (jsonb)
  - status (enum: 'discovering', 'scraping', 'analyzing', 'complete', 'failed')

Table: competitor_data
  - id (uuid)
  - analysis_id (uuid, foreign key)
  - competitor_name (text)
  - competitor_url (text)
  - scraped_content (text)
  - scraped_at (timestamp)
  - analysis_result (jsonb)
  - social_media_data (jsonb)
  - detailed_pricing (jsonb)

Table: competitor_reports
  - id (uuid)
  - analysis_id (uuid, foreign key)
  - report_content (text)
  - generated_at (timestamp)
  - report_format (enum: 'web', 'pdf', 'pptx')

Table: competitor_cache
  - competitor_url (text, primary key)
  - scraped_content (text)
  - cached_at (timestamp)
  - expires_at (timestamp)


CACHING STRATEGY:
=================
- Cache competitor website scrapes for 24 hours
- Cache Google Places results for 1 week per location/industry combo
- Cache competitor analysis results for 1 week
- Invalidate cache if user manually requests refresh


ERROR HANDLING:
===============
- If Google Places API fails → Fall back to OpenAI Web Search only
- If Jina AI scraping fails for a competitor → Mark as "limited data" and continue
- If OpenAI API rate limit hit → Queue request and retry with exponential backoff
- If all competitors fail to scrape → Show error, offer to retry or manually add data
- If AI analysis returns malformed JSON → Retry once, then save raw text response


COST OPTIMIZATION:
==================
1. Batch competitor scraping (parallel requests up to 5 at a time)
2. Cache aggressively (24-hour website cache, 1-week analysis cache)
3. Use GPT-4o-mini for initial scraping/parsing, GPT-4o only for final insights
4. Limit free tier users to 3 competitors, premium users to 20
5. Offer "quick scan" option that skips social media and detailed pricing


IMPLEMENTATION TIMELINE:
========================
Week 1: Steps 1-4 (Input → Business Analysis → Competitor Discovery → Website Scraping)
Week 2: Step 5 (Website Content Analysis with AI)
Week 3: Steps 6-7 (Social Media & Pricing Deep Dives)
Week 4: Steps 8-10 (AI Insights → Report Generation → Frontend Display)


API ENDPOINTS SUMMARY:
======================
POST /api/analyze-user-business
  Input: { websiteUrl, location }
  Output: { businessProfile }

POST /api/discover-competitors
  Input: { businessProfile, location, preferences }
  Output: { competitors: Array }

POST /api/scrape-competitors
  Input: { competitors: Array }
  Output: { scrapedData: Array }

POST /api/analyze-competitor-content
  Input: { scrapedData: Array }
  Output: { analyses: Array }

POST /api/analyze-social-media (optional)
  Input: { competitors: Array }
  Output: { socialMediaData: Array }

POST /api/analyze-pricing (optional)
  Input: { competitors: Array }
  Output: { pricingData: Array }

POST /api/generate-insights
  Input: { userBusiness, competitorAnalyses, socialMedia?, pricing? }
  Output: { report: string }

GET /api/reports/[reportId]
  Output: { report, competitors, generatedAt }


FRONTEND PAGES:
===============
/marketing/competitors - Main page with "Start New Analysis" button & History table with view report button
/marketing/competitors/new - Input form for new analysis
/marketing/competitors/[analysisId]/discovering - Loading state while finding competitors
/marketing/competitors/[analysisId]/confirm - Show found competitors, user confirms
/marketing/competitors/[analysisId]/analyzing - Progress bar while analyzing
/marketing/competitors/[analysisId]/report - Final report display


TESTING CHECKLIST:
==================
□ Test with local business (Google Places API should find competitors)
□ Test with online-only business (Web Search should find competitors)
□ Test with website that blocks scraping (should handle gracefully)
□ Test with 1 competitor (should still generate useful insights)
□ Test with 10+ competitors (should handle parallel processing)
□ Test cache hit (second analysis should be much faster)
□ Test API failures (each API should have fallback)
□ Test mobile responsiveness of report page


Save this as the .txt file and for each step analyse this file and proceed
