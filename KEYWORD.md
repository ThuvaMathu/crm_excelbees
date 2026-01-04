# KEYWORD RESEARCH - COMPETITOR-BASED and AI-POWERED KEYWORD DISCOVERY

## OVERVIEW

A competitor-driven and AI-powered keyword discovery system that extracts high-value keywords by analyzing competitor website content through systematic sitemap crawling and intelligent page selection.

**Core Principle:** Find what keywords competitors rank for by analyzing their actual website content, then identify opportunities for your business.

---

## TECH STACK

- **Google Places API / Google Search** - Competitor discovery
- **OpenAI GPT-4o** - Competitor validation, keyword extraction, analysis
- **OpenAI GPT-4o Web Search** - Sitemap discovery, metrics enrichment
- **Jina AI Reader** - Website content scraping (FREE)
- **Next.js API Routes** - Backend processing
- **Database** - `marketing/keyword` collection

---

## COMPLETE WORKFLOW - STEP BY STEP

### STEP 1: USER INPUT & SETUP

**Page:** `/marketing/keyword`

#### User provides:

**1. PRIMARY INPUTS (Required):**
- ✓ How many keywords do you want? (Slider: 5 / 10 / 25 / 50 / 100 / 200)
- ✓ Your business website URL (for context)
- ✓ Your business location (city, country)

**2. COMPETITOR SELECTION OPTIONS:**

**Option A: Import from Previous Analysis**
- Show list of competitors from `/competitors` analysis if exists
- Checkbox list to select which competitors to use
- Display: Company name, website URL, last analyzed date

**Option B: Manual Entry**
- Text input: "Enter competitor URLs (one per line)"
- User pastes 3-10 competitor URLs

**Option C: Auto-Discover Competitors**
- Checkbox: "Automatically find my competitors"
- System will discover competitors using Google + AI

**3. ANALYSIS DEPTH CONTROLS:**

📊 **Number of Competitors** (Slider: 1-10)

📄 **Pages per Competitor** (Slider: 3-20)

Total pages to analyze: `[Competitors × Pages] = X pages`

**4. PAGE SELECTION PREFERENCES (Optional):**
- ☐ Prioritize blog posts (for content keywords)
- ☐ Prioritize service pages (for commercial keywords)
- ☐ Include location pages (for local keywords)
- ☐ Include product pages (for transactional keywords)

**User clicks "Start Keyword Research"** → Triggers Step 2

---

### STEP 2: BUSINESS CONTEXT EXTRACTION

**API Route:** `POST /api/keyword/extract-business-context`

#### Process:

1. **Check database for existing business profile:**
   - Query: `marketing/competitors/{userId}/business_profile`
   - If exists and < 7 days old: Use cached, skip to Step 3
   - If not exists: Continue

2. **Scrape user's website:**
   - Jina AI: `https://r.jina.ai/{userWebsiteUrl}`

3. **Extract business context with GPT-4o:**
   ```
   Prompt:
   "Analyze this business website:
    {websiteContent}
    
    Extract as JSON:
    {
      industry: string,
      mainServices: string[],
      targetAudience: string,
      businessType: "B2B" | "B2C" | "Local" | "E-commerce",
      geographicScope: "Local" | "Regional" | "National" | "Global"
    }"
   ```

4. **Store in database:**
   - Collection: `marketing/keyword`
   - Document: `{researchId}/business_context`

#### Output:
```json
{
  "industry": "Digital Marketing Agency",
  "mainServices": ["SEO", "Content Marketing", "Social Media Management"],
  "targetAudience": "Small to medium businesses",
  "businessType": "B2B",
  "geographicScope": "Regional"
}
```

---

### STEP 3: COMPETITOR IDENTIFICATION

**API Route:** `POST /api/keyword/identify-competitors`

Process branches based on user's choice in Step 1:

#### BRANCH A: User selected "Import from Previous Analysis"

1. Retrieve competitor list from database:
   - Collection: `marketing/competitors`
   - Filter: `userId`, `status: "complete"`

2. Extract selected competitors:
   - `competitor_name`
   - `competitor_url`
   - `industry`
   - `last_analyzed_date`

3. Skip to Step 4 with competitor URLs

#### BRANCH B: User entered competitor URLs manually

1. Receive competitor URLs from frontend
2. Validate URLs (check if accessible)
3. Extract domain names
4. Skip to Step 4 with competitor URLs

#### BRANCH C: User chose "Auto-Discover Competitors"

1. **Use Google Search to find competitors:**
   
   OpenAI GPT-4o Web Search:
   ```
   Search Query: "{industry} companies in {location}"
   
   Prompt:
   "Search for competitors of this business:
    Industry: {industry}
    Location: {location}
    Services: {mainServices}
    
    Find 5-10 direct competitors (companies offering similar services 
    to the same audience). Return their website URLs.
    
    Return as JSON array:
    [
      {
        name: string,
        website: string,
        relevanceReason: string
      }
    ]"
   ```

2. **Alternative: Google Places API** (for local businesses):
   - Query: `"{industry} near {location}"`
   - Extract: business names + websites

3. **Validate competitors with GPT-4o:**
   ```
   Prompt:
   "Are these actual competitors for {userBusiness}?
    Filter out non-competitors, unrelated businesses, or marketplaces.
    Return validated list."
   ```

4. **Present to user for confirmation:**
   - Frontend shows: Discovered competitors with checkboxes
   - User selects which ones to analyze

5. Continue to Step 4 with confirmed competitor URLs

#### BRANCH D: Hybrid (Previous + Auto-Discover)

1. Load previous competitors
2. Discover new competitors
3. Combine and deduplicate
4. User confirms final list

#### Output from Step 3:
```json
{
  "competitors": [
    {
      "name": "Competitor A",
      "url": "https://competitorA.com",
      "source": "previous_analysis" | "manual" | "auto_discovered"
    },
    {
      "name": "Competitor B",
      "url": "https://competitorB.com",
      "source": "manual"
    }
  ],
  "totalCompetitors": 3
}
```

---

### STEP 4: SITEMAP DISCOVERY & PAGE IDENTIFICATION

**API Route:** `POST /api/keyword/discover-sitemaps`

For each competitor (runs in parallel):

#### Process:

1. **Try to find sitemap:**
   
   **Method A: Check common sitemap URLs**
   - `https://competitor.com/sitemap.xml`
   - `https://competitor.com/sitemap_index.xml`
   - `https://competitor.com/sitemap-index.xml`
   - `https://competitor.com/robots.txt` (extract sitemap from robots.txt)
   
   Use Jina AI to fetch each URL until one works:
   - `fetch: https://r.jina.ai/{sitemapUrl}`

2. **If sitemap not found, use OpenAI Web Search:**
   - Search Query: `"site:competitor.com sitemap"`
   
   Or use GPT-4o to analyze robots.txt:
   ```
   Prompt: "Extract sitemap URL from this robots.txt: {robotsTxt}"
   ```

3. **Parse sitemap XML:**
   - Extract all URLs listed in sitemap
   - Note: Sitemaps can be nested (sitemap index pointing to multiple sitemaps)
   
   If `sitemap_index.xml` found:
   - Fetch all child sitemaps
   - Combine all URLs

4. **Categorize pages from sitemap URLs:**
   
   Send URL list to GPT-4o:
   ```
   Prompt:
   "Categorize these website pages from sitemap:
    
    URLs:
    {urlList}
    
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
      categorizedPages: [
        {
          url: string,
          category: string,
          title: string (extracted from URL),
          isDynamic: boolean,
          priority: number 1-10 (based on importance)
        }
      ],
      statistics: {
        totalPages: number,
        pagesByCategory: { category: count }
      }
    }"
   ```

5. **Sort pages by priority and user preferences:**
   
   **Priority scoring logic:**
   - If user selected "Prioritize blog posts": blog pages get +3 points
   - If user selected "Prioritize service pages": service pages get +3 points
   - Homepage: Always priority 10
   - Service pages: Base priority 8
   - Blog posts: Base priority 7
   - About pages: Base priority 6
   - Location pages: Base priority 6 (higher if local business)
   - Case studies: Base priority 5
   - Other: Base priority 4

6. **Select top N pages** (N = user's "Pages per Competitor" setting):
   - Sort by priority score
   - Take top N pages
   - Ensure variety (don't take only blog posts)
   - Include at least: Homepage + 1 service page + mix of others

7. Store selected pages for each competitor

#### Output (per competitor):
```json
{
  "competitorName": "Competitor A",
  "competitorUrl": "https://competitorA.com",
  "sitemapUrl": "https://competitorA.com/sitemap.xml",
  "totalPagesInSitemap": 247,
  "selectedPages": [
    {
      "url": "https://competitorA.com",
      "category": "home",
      "title": "Home",
      "priority": 10
    },
    {
      "url": "https://competitorA.com/seo-services",
      "category": "services",
      "title": "SEO Services",
      "priority": 9
    },
    {
      "url": "https://competitorA.com/blog/local-seo-guide",
      "category": "blog",
      "title": "Local SEO Guide",
      "priority": 8
    }
  ],
  "pageCount": 10
}
```

#### Error Handling:
- If sitemap not found: Fallback to scraping main navigation links
- If sitemap too large (>10k pages): Sample intelligently across categories
- If competitor site blocks scraping: Skip and log error

---

### STEP 5: CONTENT EXTRACTION FROM SELECTED PAGES

**API Route:** `POST /api/keyword/extract-page-content`

For each selected page across all competitors:

#### Process (runs in batches of 10 pages in parallel):

1. **Scrape page content with Jina AI:**
   - `fetch: https://r.jina.ai/{pageUrl}`
   - Returns: Clean markdown of page content
   - Timeout: 30 seconds per page

2. **Extract metadata:**
   
   Send to GPT-4o:
   ```
   Prompt:
   "Extract metadata from this page content:
    
    URL: {pageUrl}
    CONTENT:
    {markdownContent}
    
    Extract as JSON:
    {
      title: string (page title),
      mainTopic: string (what is this page about in 5-10 words),
      contentType: string (service page, blog post, guide, etc),
      wordCount: number (estimate),
      hasStructuredData: boolean (looks like it has schema markup),
      contentQuality: number 1-10
    }"
   ```

3. **Store scraped content in database:**
   - Collection: `marketing/keyword/{researchId}/page_content`
   - Document structure:
   ```json
   {
     "pageId": "uuid",
     "competitorName": "string",
     "competitorUrl": "string",
     "pageUrl": "string",
     "category": "string",
     "scrapedContent": "string (markdown)",
     "metadata": "object",
     "scrapedAt": "timestamp"
   }
   ```

#### Progress tracking:
- Total pages to scrape: competitors × pages per competitor
- Update progress bar on frontend
- Example: "Extracting content: 23/30 pages completed"

#### Output (stored in database for each page):
```json
{
  "pageId": "uuid-123",
  "competitorName": "Competitor A",
  "competitorUrl": "https://competitorA.com",
  "pageUrl": "https://competitorA.com/seo-services",
  "category": "services",
  "scrapedContent": "# SEO Services\n\nWe provide comprehensive...",
  "metadata": {
    "title": "Professional SEO Services | Competitor A",
    "mainTopic": "SEO service offerings and benefits",
    "contentType": "service page",
    "wordCount": 1847,
    "hasStructuredData": true,
    "contentQuality": 8
  },
  "scrapedAt": "2025-01-05T10:30:00Z"
}
```

---

### STEP 6: KEYWORD EXTRACTION FROM CONTENT

**API Route:** `POST /api/keyword/extract-keywords`

Process all scraped pages through AI keyword extraction:

#### For each batch of 5 pages:

1. **Send content to GPT-4o for keyword extraction:**
   
   ```
   Prompt:
   "Extract SEO keywords from these competitor pages.
    
    USER'S BUSINESS CONTEXT:
    {businessContext}
    
    COMPETITOR PAGES:
    {batch of 5 pages with content}
    
    For each page, extract:
    
    1. PRIMARY KEYWORDS (1-3 per page):
       - Main topic keywords that the page targets
       - Keywords that appear in title, headings, early content
       - High commercial/search value keywords
    
    2. SECONDARY KEYWORDS (5-15 per page):
       - Supporting keywords throughout content
       - Long-tail variations
       - Related terms and synonyms
    
    3. KEYWORD CONTEXT:
       - Search intent (informational/commercial/transactional/navigational)
       - Topic relevance to user's business (high/medium/low)
       - Keyword usage pattern (naturally woven / keyword-stuffed / minimal)
    
    Return as JSON array:
    [
      {
        pageUrl: string,
        competitorName: string,
        primaryKeywords: [
          {
            keyword: string,
            occurrences: number,
            prominence: number 1-10 (based on title/heading placement)
          }
        ],
        secondaryKeywords: [
          {
            keyword: string,
            occurrences: number
          }
        ],
        searchIntent: string,
        relevanceToUser: string (high/medium/low),
        contentStrategy: string (brief description of keyword strategy observed)
      }
    ]
    
    Focus on extracting keywords that would be valuable for the user's business:
    Industry: {industry}
    Services: {mainServices}"
   ```

2. **Parse and validate extracted keywords:**
   - Remove duplicates within same page
   - Normalize keyword format (lowercase, trim spaces)
   - Filter out branded keywords (competitor's brand name)
   - Filter out generic stop words

3. **Store extracted keywords:**
   - Collection: `marketing/keyword/{researchId}/extracted_keywords`
   - One document per page with its keywords

#### Progress update:
"Extracting keywords: 18/30 pages analyzed"

#### Output (per page):
```json
{
  "pageId": "uuid-123",
  "pageUrl": "https://competitorA.com/seo-services",
  "competitorName": "Competitor A",
  "category": "services",
  "primaryKeywords": [
    {
      "keyword": "professional seo services",
      "occurrences": 8,
      "prominence": 10
    },
    {
      "keyword": "search engine optimization",
      "occurrences": 12,
      "prominence": 9
    }
  ],
  "secondaryKeywords": [
    {
      "keyword": "on-page seo",
      "occurrences": 4
    },
    {
      "keyword": "technical seo audit",
      "occurrences": 3
    },
    {
      "keyword": "local seo optimization",
      "occurrences": 5
    }
  ],
  "searchIntent": "commercial",
  "relevanceToUser": "high",
  "contentStrategy": "Focused on service-oriented keywords with local emphasis"
}
```

---

### STEP 7: KEYWORD AGGREGATION & DEDUPLICATION

**API Route:** `POST /api/keyword/aggregate-keywords`

#### Process:

1. **Collect all keywords from all pages:**
   - Query database: `marketing/keyword/{researchId}/extracted_keywords`
   - Gather all primary + secondary keywords

2. **Aggregate duplicate keywords across pages/competitors:**
   
   For each unique keyword:
   - Count total occurrences across all pages
   - Track which competitors use it
   - Track which page categories it appears in
   - Calculate prominence score (avg of all prominences)
   - List source pages

3. **Send aggregated data to GPT-4o for intelligent deduplication:**
   
   ```
   Prompt:
   "Deduplicate and consolidate these keywords found across competitor sites:
    
    KEYWORDS:
    {aggregatedKeywordList}
    
    Tasks:
    1. Merge semantic duplicates:
       Example: "seo services" = "search engine optimization services"
       Keep the most commonly used version as primary
    
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
        primaryKeyword: string,
        variations: string[],
        keywordFamily: string (parent topic),
        totalOccurrences: number,
        usedByCompetitors: number,
        avgProminence: number,
        searchIntent: string,
        relevanceScore: number 1-10,
        sources: [
          { competitor: string, pageUrl: string, category: string }
        ]
      }
    ]
    
    Sort by relevanceScore descending."
   ```

4. **Store consolidated keywords:**
   - Collection: `marketing/keyword/{researchId}/consolidated_keywords`

#### Output:
```json
[
  {
    "primaryKeyword": "local seo services",
    "variations": ["local search optimization", "local seo", "geo-targeted seo"],
    "keywordFamily": "seo services",
    "totalOccurrences": 47,
    "usedByCompetitors": 3,
    "avgProminence": 8.5,
    "searchIntent": "commercial",
    "relevanceScore": 9,
    "sources": [
      {
        "competitor": "Competitor A",
        "pageUrl": "https://competitorA.com/local-seo",
        "category": "services"
      },
      {
        "competitor": "Competitor B",
        "pageUrl": "https://competitorB.com/services",
        "category": "services"
      }
    ]
  }
]
```

---

### STEP 8: KEYWORD ENRICHMENT WITH METRICS

**API Route:** `POST /api/keyword/enrich-keywords`

#### Process:

1. **Take top consolidated keywords** based on user's requested count:
   - User wants: 25 keywords
   - Process: Top 25 keywords by relevanceScore

2. **For each keyword, use OpenAI GPT-4o Web Search to find metrics:**
   
   (Process in batches of 10 keywords)
   
   ```
   Search Query: "{keyword} search volume SEO"
   
   Prompt:
   "Search the web for SEO metrics about these keywords:
    
    KEYWORDS:
    {batch of 10 keywords}
    
    For each keyword, find:
    1. Monthly search volume (approximate, any geography mentioned)
    2. Keyword difficulty / competition level (low/medium/high)
    3. Search trends (rising/stable/declining)
    4. CPC (cost per click) if mentioned
    5. Current top-ranking domains for this keyword
    
    Return as JSON array. If exact data not found, provide educated estimates 
    based on keyword specificity and industry context.
    
    Industry context: {industry}"
   ```

3. **Enrich keyword data with metrics:**
   - Merge web search results with consolidated keywords

4. **Add competitor ranking analysis:**
   
   For top keywords, use Web Search:
   ```
   Search Query: "site:competitorA.com {keyword}"
   ```
   
   Check if competitor ranks for this keyword (present in search results)
   - Store: `whichCompetitorsRank: ["Competitor A", "Competitor B"]`

5. **Update database with enriched keywords:**
   - Collection: `marketing/keyword/{researchId}/final_keywords`

#### Output (enriched keywords):
```json
[
  {
    "primaryKeyword": "local seo services",
    "variations": ["local search optimization", "local seo"],
    "keywordFamily": "seo services",
    "searchIntent": "commercial",
    "relevanceScore": 9,
    
    "searchVolume": 8100,
    "searchVolumeCategory": "high",
    "difficulty": "medium",
    "trend": "rising",
    "cpc": "$45.20",
    "topRankingDomains": ["moz.com", "searchengineland.com", "localiq.com"],
    "whichCompetitorsRank": ["Competitor A", "Competitor C"],
    
    "sources": []
  }
]
```

---

### STEP 9: KEYWORD FILTERING & FINAL SELECTION

**API Route:** `POST /api/keyword/finalize-selection`

#### Process:

1. **User requested N keywords** (e.g., 25 keywords)
   - Current list: Enriched keywords sorted by relevanceScore

2. **Apply intelligent filtering to get best N keywords:**
   
   Send to GPT-4o:
   ```
   Prompt:
   "Select the best {N} keywords for this business from the enriched keyword list:
    
    BUSINESS:
    {businessContext}
    
    ENRICHED KEYWORDS:
    {enrichedKeywordsList}
    
    Selection criteria (in priority order):
    1. High relevance to user's services
    2. Balance of difficulty (mix of low, medium, high)
    3. Variety of search intent (informational, commercial, transactional)
    4. Used by multiple competitors (validated opportunity)
    5. Good search volume relative to difficulty
    6. Mix of short-tail (2 words) and long-tail (3-5 words)
    7. Coverage of different keyword families (diversity)
    
    Return top {N} keywords as JSON array with:
    - All existing keyword data
    - selectionReason: Brief explanation why this keyword was selected
    - strategicValue: "quick-win" | "core-target" | "long-term-goal"
    
    Ensure the final list includes:
    - At least 3 "quick-win" keywords (low difficulty, decent volume)
    - Majority "core-target" keywords (medium difficulty, high relevance)
    - 1-2 "long-term-goal" keywords (high difficulty, high volume)"
   ```

3. **Store final selected keywords:**
   - Collection: `marketing/keyword/{researchId}/selected_keywords`

#### Output (final N keywords):
```json
[
  {
    "rank": 1,
    "primaryKeyword": "local seo services",
    "searchVolume": 8100,
    "difficulty": "medium",
    "searchIntent": "commercial",
    "relevanceScore": 9,
    "whichCompetitorsRank": ["Competitor A", "Competitor C"],
    "strategicValue": "core-target",
    "selectionReason": "High relevance to services, strong search volume, 2 out of 3 competitors rank for it - proven opportunity"
  },
  {
    "rank": 2,
    "primaryKeyword": "affordable seo for small business",
    "searchVolume": 1200,
    "difficulty": "low",
    "searchIntent": "commercial",
    "relevanceScore": 8,
    "strategicValue": "quick-win",
    "selectionReason": "Lower competition, directly targets user's audience, long-tail keyword with clear purchase intent"
  }
]
```

---

### STEP 10: KEYWORD STRATEGY & INSIGHTS GENERATION

**API Route:** `POST /api/keyword/generate-insights`

#### Process:

1. **Compile all research data:**
   - Business context
   - Competitors analyzed
   - Total pages scraped
   - Total keywords extracted
   - Final selected keywords
   - Keyword metrics and competitor usage

2. **Send to GPT-4o for strategic analysis:**
   
   ```
   Prompt:
   "Generate a comprehensive keyword strategy report.
    
    USER'S BUSINESS:
    {businessContext}
    
    RESEARCH SUMMARY:
    - Competitors analyzed: {count}
    - Pages scraped: {count}
    - Total keywords extracted: {count}
    - Final selected keywords: {count}
    
    SELECTED KEYWORDS:
    {selectedKeywordsList}
    
    COMPETITIVE ANALYSIS:
    {competitorKeywordUsagePatterns}
    
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
    
    Make the report actionable, specific, and tailored to the user's business 
    and competitive landscape."
   ```

3. **Store strategy report:**
   - Collection: `marketing/keyword/{researchId}/strategy_report`

#### Output:
```json
{
  "executiveSummary": "...",
  "keywordBreakdown": {},
  "keywordFamilies": [],
  "competitorInsights": {},
  "contentRecommendations": [],
  "searchIntentDistribution": {},
  "priorityActionPlan": {},
  "successMetrics": {},
  "riskAssessment": {},
  "nextSteps": []
}
```

---

### STEP 11: EXPORT & REPORTING

**API Route:** `POST /api/keyword/export`

Generate exportable formats:

#### 1. Keywords CSV/Excel:
**Columns:**
- Rank
- Keyword
- Search Volume
- Difficulty
- Search Intent
- Strategic Value
- Competitors Ranking
- Trend
- CPC
- Selection Reason
- Sources (competitor pages)

#### 2. Strategy Report PDF:
- Full strategy document from Step 10
- Formatted with charts:
  * Keyword difficulty distribution (pie chart)
  * Search volume by keyword family (bar chart)
  * Competitor keyword overlap (Venn diagram)
- Executive summary at top

#### 3. Content Plan Spreadsheet:
**Columns:**
- Priority
- Keyword
- Content Type
- Target Word Count
- Status (Not Started)
- Assigned To
- Due Date
- Estimated Traffic

#### 4. Competitor Analysis Sheet:
- Which competitors rank for which keywords
- Matrix view: Keywords (rows) × Competitors (columns)
- Checkmark where competitor ranks

#### 5. Quick Reference Card (1-page PDF):
- Top 10 keywords to focus on
- Quick wins highlighted
- Immediate action items

---

### STEP 12: DISPLAY RESULTS

**Page:** `/marketing/keyword/results/[researchId]`

#### Frontend displays:

**Overview Dashboard:**
```
📊 Total Keywords Found: 25
📊 Total AI-Generated Keywords: 25
📈 Total Search Volume: 45,300/month
🎯 Quick Wins: 5 keywords
💪 Core Targets: 15 keywords
🚀 Long-term Goals: 5 keywords

👥 Competitors Analyzed: 3
📄 Pages Scraped: 30
⏱️ Analysis Completed: 8 minutes ago
```

**Keywords Table (Interactive):**
- Sortable columns: Rank, Keyword, Volume, Difficulty, Intent
- Filters: Strategic Value, Difficulty, Intent, Competitor
- Search box: Filter keywords
- Click keyword → Expand details:
  * Variations
  * Competitors ranking
  * Source pages
  * Selection reason
  * SERP preview (top ranking domains)

**Keyword Families View:**
- Card layout grouped by topic family
- Each card shows:
  * Family name
  * Keywords in family (count)
  * Total search volume
  * Recommended content strategy
- Click to expand full family

**Competitor Matrix View:**
- Table: Keywords (rows) × Competitors (columns)
- ✓ where competitor ranks for keyword
- Color coding:
  * Green: All competitors rank (high priority)
  * Yellow: Some competitors rank (opportunity)
  * Red: No competitors rank (blue ocean or irrelevant)

**Strategy Document:**
- Readable web view with sections
- Download as PDF button
- Share link functionality

**Content Recommendations:**
- List of suggested content pieces
- For each: keyword target, content type, priority
- "Create Content" button → Links to `/marketing/blog-writer`

**Action Plan Timeline:**
- Visual timeline: Month 1, 2-3, 4-6
- Keywords mapped to timeline
- Drag-and-drop to adjust schedule

#### User Actions:
- 📥 Download all exports (CSV, PDF, spreadsheets)
- 💾 Save custom keyword lists
- ✅ Mark keywords as "targeting" / "completed"
- 🔄 Re-run analysis (refresh with new data)
- ✏️ Create content from keyword (→ Blog Writer)
- 📧 Schedule weekly progress emails

---

## DATABASE SCHEMA

**Collection:** `marketing/keyword`

### 1. `/{researchId}`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "createdAt": "timestamp",
  "status": "analyzing" | "complete" | "failed",
  
  "requestedKeywordCount": "number",
  "businessWebsite": "string",
  "businessLocation": "string",
  "competitorSource": "previous" | "manual" | "auto" | "hybrid",
  "analysisDepth": {
    "competitorCount": "number",
    "pagesPerCompetitor": "number",
    "totalPages": "number"
  },
  "pagePreferences": {
    "prioritizeBlog": "boolean",
    "prioritizeServices": "boolean",
    "includeLocation": "boolean",
    "includeProducts": "boolean"
  }
}
```

### 2. `/{researchId}/business_context`
```json
{
  "industry": "string",
  "mainServices": ["string"],
  "targetAudience": "string",
  "businessType": "string",
  "geographicScope": "string",
  "analyzedAt": "timestamp"
}
```

### 3. `/{researchId}/competitors`
```json
[
  {
    "competitorId": "uuid",
    "name": "string",
    "url": "string",
    "source": "string",
    "status": "pending" | "scraped" | "analyzed" | "failed"
  }
]
```

### 4. `/{researchId}/sitemaps`
```json
{
  "competitorId": "uuid",
  "sitemapUrl": "string",
  "totalPagesInSitemap": "number",
  "selectedPages": [
    {
      "pageId": "uuid",
      "url": "string",
      "category": "string",
      "title": "string",
      "priority": "number"
    }
  ]
}
```

### 5. `/{researchId}/page_content`
```json
[
  {
    "pageId": "uuid",
    "competitorId": "uuid",
    "competitorName": "string",
    "pageUrl": "string",
    "category": "string",
    "scrapedContent": "string (markdown)",
    "metadata": "object",
    "scrapedAt": "timestamp"
  }
]
```

### 6. `/{researchId}/extracted_keywords`
```json
[
  {
    "pageId": "uuid",
    "pageUrl": "string",
    "competitorName": "string",
    "primaryKeywords": "array",
    "secondaryKeywords": "array",
    "searchIntent": "string",
    "relevanceToUser": "string",
    "contentStrategy": "string"
  }
]
```

### 7. `/{researchId}/consolidated_keywords`
```json
[
  {
    "keywordId": "uuid",
    "primaryKeyword": "string",
    "variations": ["string"],
    "keywordFamily": "string",
    "totalOccurrences": "number",
    "usedByCompetitors": "number",
    "avgProminence": "number",
    "searchIntent": "string",
    "relevanceScore": "number",
    "sources": "array"
  }
]
```

### 8. `/{researchId}/final_keywords`
```json
[
  {
    "keywordId": "uuid",
    "searchVolume": "number",
    "searchVolumeCategory": "string",
    "difficulty": "string",
    "trend": "string",
    "cpc": "string",
    "topRankingDomains": ["string"],
    "whichCompetitorsRank": ["string"]
  }
]
```

### 9. `/{researchId}/selected_keywords`
```json
[
  {
    "rank": "number",
    "keywordId": "uuid",
    "strategicValue": "string",
    "selectionReason": "string",
    "targetContentType": "string",
    "targetWordCount": "number",
    "status": "not_started" | "in_progress" | "completed"
  }
]
```

### 10. `/{researchId}/strategy_report`
```json
{
  "generatedAt": "timestamp",
  "executiveSummary": "string",
  "keywordBreakdown": "object",
  "keywordFamilies": "array",
  "competitorInsights": "object",
  "contentRecommendations": "array",
  "searchIntentDistribution": "object",
  "priorityActionPlan": "object",
  "successMetrics": "object",
  "riskAssessment": "object",
  "nextSteps": "array"
}
```

---

## CACHING STRATEGY

- **Business context:** 7 days (same as competitor analysis)
- **Competitor list:** 7 days (if from previous analysis)
- **Sitemap data:** 30 days (sitemaps don't change often)
- **Page content:** 14 days (content changes moderately)
- **Keyword metrics:** 30 days (search volumes stable)
- **Final strategy:** No cache (always generate fresh)

---

## API RATE LIMITING & COST OPTIMIZATION

### Parallel Processing:
- Scrape 10 pages simultaneously (max)
- Process keyword extraction in batches of 5 pages
- **Total time estimate:**
  * 3 competitors × 10 pages = 30 pages
  * Scraping: ~5 minutes (batch parallel)
  * Keyword extraction: ~3 minutes
  * Enrichment: ~2 minutes
  * Strategy: ~1 minute
  * **Total: ~11 minutes**

### Smart Sitemap Processing:
- Cache sitemap for 30 days
- If sitemap has 1000+ pages, sample intelligently
- Don't re-scrape same page within 14 days

### Keyword Extraction Optimization:
- Extract from 5 pages at once (batch prompt)
- Reduces API calls by 5x

### Metric Enrichment Optimization:
- Only enrich top N keywords (not all extracted)
- Batch 10 keywords per web search call
- For 25 keywords: 3 API calls instead of 25

### Cost Estimates (OpenAI GPT-4o):

**25 keywords from 3 competitors × 10 pages:**
- Business context: $0.10
- Competitor discovery: $0.15
- Sitemap analysis: $0.20
- Content scraping (Jina): FREE
- Keyword extraction: $1.50 (30 pages, batched)
- Consolidation: $0.30
- Enrichment: $0.50 (web search for 25 keywords)
- Strategy: $0.40
- **Total: ~$3.15 per research**

**100 keywords from 5 competitors × 20 pages:**
- **Total: ~$12.00 per research**

### Tiered Pricing Model:
- **FREE Tier:** 10 keywords, 2 competitors, 5 pages each = ~$1.50/research
- **STANDARD Tier:** 25 keywords, 3 competitors, 10 pages each = ~$3.15/research
- **PREMIUM Tier:** 50 keywords, 5 competitors, 20 pages each = ~$8.00/research
- **ENTERPRISE Tier:** 200 keywords, 10 competitors, 50 pages each = ~$30/research

---

## API ENDPOINTS SUMMARY

### POST `/api/keyword/extract-business-context`
- **Input:** `{ websiteUrl, location }`
- **Output:** `{ businessContext }`

### POST `/api/keyword/identify-competitors`
- **Input:** `{ method: "previous" | "manual" | "auto", data, businessContext }`
- **Output:** `{ competitors: Array }`

### POST `/api/keyword/discover-sitemaps`
- **Input:** `{ competitors: Array, pagesPerCompetitor, pagePreferences }`
- **Output:** `{ sitemapsData: Array }`

### POST `/api/keyword/extract-page-content`
- **Input:** `{ selectedPages: Array }`
- **Output:** `{ scrapedPages: Array }`
- **Progress:** WebSocket updates per page scraped

### POST `/api/keyword/extract-keywords`
- **Input:** `{ scrapedPages: Array, businessContext }`
- **Output:** `{ extractedKeywords: Array }`
- **Progress:** WebSocket updates per batch analyzed

### POST `/api/keyword/aggregate-keywords`
- **Input:** `{ extractedKeywords: Array }`
- **Output:** `{ consolidatedKeywords: Array }`

### POST `/api/keyword/enrich-keywords`
- **Input:** `{ consolidatedKeywords: Array, requestedCount }`
- **Output:** `{ enrichedKeywords: Array }`

### POST `/api/keyword/finalize-selection`
- **Input:** `{ enrichedKeywords: Array, requestedCount, businessContext }`
- **Output:** `{ selectedKeywords: Array }`

### POST `/api/keyword/generate-insights`
- **Input:** `{ selectedKeywords, allResearchData }`
- **Output:** `{ strategyReport }`

### POST `/api/keyword/export`
- **Input:** `{ researchId, formatType: "csv" | "pdf" | "excel" | "all" }`
- **Output:** `{ downloadUrl or downloadUrls }`

### GET `/api/keyword/research/[researchId]`
- **Output:** `{ fullResearchData, status, progress }`

### GET `/api/keyword/research/[researchId]/status`
- **Output:** `{ status, currentStep, progress%, estimatedTimeRemaining }`

---

## FRONTEND PAGES & ROUTES

### `/marketing/keyword`
- Main keyword research page
- Input form with all options
- Slider controls for competitors/pages
- "Start Research" button

### `/marketing/keyword/[researchId]/progress`
- Real-time progress page
- Shows current step:
  * ✓ Business context extracted
  * ⏳ Discovering competitors... (2/3 found)
  * ⏳ Extracting content... (15/30 pages)
  * ⏳ Analyzing keywords... (18/30 pages)
  * ⏳ Enriching metrics... (12/25 keywords)
  * ⏳ Generating strategy...
- Animated progress bar
- Cancel button (stop analysis)

### `/marketing/keyword/[researchId]/results`
- Main results dashboard
- Tabs:
  * Overview
  * Keywords Table
  * Keyword Families
  * Competitor Matrix
  * Strategy Document
  * Content Plan
  * Action Timeline

### `/marketing/keyword/[researchId]/keywords`
- Detailed keyword list view
- Advanced filtering
- Bulk actions (export selected, mark as targeting)

### `/marketing/keyword/[researchId]/strategy`
- Full strategy document
- Formatted with navigation
- Print/PDF export

### `/marketing/keyword/[researchId]/competitors`
- Competitor breakdown
- Show which pages were analyzed per competitor
- Which keywords each competitor ranks for
- Competitor keyword overlap

### `/marketing/keyword/history`
- List of all user's previous keyword research
- Quick stats per research
- Re-run or view results

### `/marketing/keyword/saved-lists`
- User's custom saved keyword lists
- Create list from any research
- Export lists

---

## ERROR HANDLING & EDGE CASES

### Competitor Website Issues:

**Site blocks scraping (403/429):**
- Skip competitor, log error
- Notify user: "Unable to analyze CompetitorX.com"
- Continue with other competitors

**Site down (500/503):**
- Retry once after 30 seconds
- If still fails, skip competitor

**No sitemap found:**
- Fallback: Scrape homepage + navigation links
- Use GPT-4o to extract main pages from nav

**Sitemap too large (>10,000 pages):**
- Sample intelligently:
  * Homepage: Always include
  * Category pages: Top 20%
  * Blog posts: Most recent + highest traffic indicators
  * Service pages: All (usually limited)

### Content Extraction Issues:

**Page returns no content:**
- Mark as failed, continue
- Don't count toward page limit

**JavaScript-heavy site:**
- Jina AI handles this automatically
- If still fails, note in results

**Page requires login:**
- Skip, mark as "restricted access"

### Keyword Extraction Issues:

**Page has minimal content (<200 words):**
- Extract what's available
- Lower priority in aggregation

**AI returns malformed JSON:**
- Retry once with stricter prompt
- If fails again, parse text manually
- Extract keywords with regex fallback

**No relevant keywords found:**
- Mark page as "low keyword value"
- Still include any keywords extracted

### Metric Enrichment Issues:

**Web search returns no data:**
- Use GPT-4o to estimate based on:
  * Keyword length (longer = lower volume)
  * Industry averages
  * Related keyword data
- Mark as "estimated" in results

**Conflicting data from multiple sources:**
- Take median value
- Note data range in tooltip

### User Input Edge Cases:

**User requests 100 keywords but only 50 found:**
- Return all 50 found
- Notify: "Found 50 high-quality keywords (requested 100)"

**User selects 10 competitors × 50 pages = 500 pages:**
- Show warning: "This will take ~45 minutes"
- Offer to reduce scope
- Charge premium tier pricing

**All competitors fail to scrape:**
- Show error: "Unable to analyze selected competitors"
- Suggest: Manual competitor entry or auto-discover
- Offer refund if paid tier

---

## PROGRESSIVE DISCLOSURE & UX FLOW

### Step 1: Simple Start
- Show only: "How many keywords?" slider
- "Continue" button

### Step 2: Competitor Selection
- Show 3 options (cards):
  * ☐ Import from previous analysis (if available)
  * ☐ Let AI find competitors
  * ☐ Enter competitors manually
- Can select multiple methods

### Step 3: Fine-tune (Optional - Collapsible "Advanced")
- Competitors slider (if auto-discover selected)
- Pages per competitor slider
- Page preferences checkboxes
- "Use defaults" button to skip

### Step 4: Review & Start
- Summary card:
  * Business: yoursite.com
  * Competitors: 3 (show names)
  * Pages to analyze: 30
  * Keywords to extract: 25
  * Estimated time: 10 minutes
- "Start Keyword Research" button

### Step 5: Progress (Real-time)
- Visual progress with steps
- Live updates via WebSocket
- "This is taking longer than expected" if >15 min

### Step 6: Results
- Start with simple overview
- Progressive disclosure:
  * "View all keywords" → Full table
  * "See strategy" → Strategy doc
  * "Compare competitors" → Matrix view

---

## INTEGRATION WITH OTHER MARKETING TOOLS

### With SEO Analyzer:
- After keyword research complete:
  * Button: "Analyze my site for these keywords"
  * Pre-fills SEO Analyzer with selected keywords
  * Checks if user's site targets these keywords

### With Blog Writer:
- Each keyword has "Write content" button
- Pre-fills Blog Writer with:
  * Primary keyword
  * Secondary keywords
  * Target word count
  * Content outline (from strategy)
- User can immediately create optimized content with AI and sugest image for content with AI separately.

### With Competitor Analysis:
- Button: "See full competitor analysis"
- Shared data between tools (no re-scraping)

### With Content Calendar: (later)
- "Add to calendar" button on content plan 
- Syncs keyword targets to editorial calendar
- Track content creation progress

---

## REAL-TIME PROGRESS UPDATES

### WebSocket Implementation for Live Progress:

**Server sends updates:**
```json
{
  "researchId": "string",
  "status": "string",
  "currentStep": "string",
  "progress": "number (0-100)",
  "details": "string",
  "estimatedTimeRemaining": "number (seconds)"
}
```

**Example progress messages:**
- "Analyzing your business website... 20%"
- "Discovering competitors... 40%"
- "Found 3 competitors: CompetitorA, CompetitorB, CompetitorC"
- "Extracting sitemaps... 50%"
- "Scraping content from CompetitorA (page 5/10)... 60%"
- "Extracting keywords from 30 pages... 75%"
- "Analyzing keyword metrics... 85%"
- "Generating your strategy report... 95%"
- "Complete! Analyzing 25 keywords... 100%"

---

## SECURITY & PRIVACY

### User Data Protection:
- All research data is private (user_id scoped)
- No sharing of user's business insights
- Delete on request (GDPR compliant)

### Competitor Data Ethics:
- Respect robots.txt
- Rate limit requests (don't DDoS competitors)
- Don't store competitor proprietary data

### API Security:
- Rate limiting per user (prevent abuse)
- Authentication required for all endpoints
- Input validation (URL sanitization)
- Block malicious URLs (phishing, malware sites)

### Data Retention:
- Research results: Kept for 90 days
- Scraped content: Deleted after 30 days
- Metrics: Kept for 90 days
- User can delete anytime

---

## TESTING CHECKLIST

### Functional Testing:
- ☐ Test with 1 competitor, 5 pages (minimal case)
- ☐ Test with 10 competitors, 50 pages (maximum case)
- ☐ Test with competitor that has no sitemap
- ☐ Test with competitor whose site is down
- ☐ Test with competitor that blocks scraping
- ☐ Test with sitemap containing 10,000+ pages
- ☐ Test keyword extraction from thin content (<200 words)
- ☐ Test keyword extraction from rich content (5,000+ words)
- ☐ Test with manually entered competitors
- ☐ Test with auto-discovered competitors
- ☐ Test with imported competitors from previous analysis
- ☐ Test requesting 200 keywords but only 50 found
- ☐ Test canceling mid-analysis
- ☐ Test resuming failed analysis
- ☐ Test all export formats (CSV, PDF, Excel)

### Edge Cases:
- ☐ Test with non-English websites
- ☐ Test with single-page websites
- ☐ Test with password-protected competitor sites
- ☐ Test with JavaScript-heavy SPA sites
- ☐ Test with competitor using Cloudflare protection
- ☐ Test with duplicate competitor URLs entered
- ☐ Test with invalid URLs entered
- ☐ Test with user's own website entered as competitor

### Performance:
- ☐ Test concurrent research requests (5 users at once)
- ☐ Test large sitemap processing (10k+ pages)
- ☐ Test parallel page scraping (50 pages simultaneously)
- ☐ Verify caching works (second analysis faster)
- ☐ Monitor API costs during test runs
- ☐ Check memory usage during analysis
- ☐ Verify WebSocket connection stability

### Integration:
- ☐ Test linking to Blog Writer from keyword
- ☐ Test linking to SEO Analyzer
- ☐ Test importing from Competitor Analysis
- ☐ Test exporting to calendar
- ☐ Test email notification delivery
- ☐ Test webhook firing on completion

---

## FINAL IMPLEMENTATION SUMMARY

This keyword research system provides:

✅ **Competitor-driven keyword discovery** (authentic, validated keywords)  
✅ **Intelligent page selection** (quality over quantity)  
✅ **AI-powered keyword extraction** (context-aware)  
✅ **Comprehensive metric enrichment** (actionable data)  
✅ **Strategic insights** (not just data dump)  
✅ **Seamless integration** with other marketing tools  
✅ **Scalable architecture** (from 10 to 200 keywords)  
✅ **Cost-optimized** ($1.50 - $30 per research)  
✅ **Fast processing** (10-15 minutes typical)  
✅ **User-friendly interface** (progressive disclosure)

### The system balances:
- Depth of analysis vs speed
- Data accuracy vs cost
- Automation vs user control
- Simplicity vs power features

**Result:** A professional keyword research tool that delivers competitive intelligence through systematic competitor content analysis, providing users with validated keyword opportunities and clear action plans for SEO success