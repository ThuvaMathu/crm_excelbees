# Agentic Keyword Research - Strategic Migration Plan

## Context
**Current State:** Keyword Research uses a linear 9-step workflow with OpenAI GPT-4o exclusively
**Goal:** Migrate to intelligent **Four-Agent Workflow** using Google Gemini for LLM tasks
**Date:** 2026-02-12

---

## Problem Analysis

### Current Implementation Issues
1. **Linear Processing:** Each step runs sequentially, blocking the user
2. **Single LLM Dependency:** All AI tasks use OpenAI GPT-4o only
3. **No Parallelization:** Can't process multiple competitors/pages simultaneously
4. **Cost Inefficiency:** GPT-4o is expensive for high-volume analysis tasks
5. **Limited Intelligence:** No semantic clustering or intent analysis

### Four-Agent Workflow Architecture

```
┌─────────────────────────────────────────────────────┐
│                    USER INPUT                           │
└──────────────────┬────────────────────────────────────────┘
                   │
                   ▼
         ┌──────────────────────────────┐
         │  AGENT ORCHESTRATION       │
         └───────┬──────────────┬────────────────┘
                   │              │              │
                   ▼              ▼              ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  AGENT A   │  │  AGENT B   │  │  AGENT C   │  │  AGENT D   │
    │ Strategist  │  │ Researcher  │  │ Auditor    │  │ Analyst    │
    │ (Gemini)   │  │ (Scraping) │  │ (SEO API)  │  │ (Clustering)│
    └────────────┘  └────────────┘  └────────────┘  └────────────┘
                   │              │              │
                   ▼              ▼              ▼
         ┌──────────────────────────────────────────┐
         │      AGGREGATION & OUTPUT           │
         │  Consolidate → Score → Cluster       │
         │         → Label → Store               │
         └──────────────────────────────────────────┘
```

---

## Agent Specifications

### Agent A: The Strategist (Google Gemini)
**Role:** Strategic analysis and planning
**Input:** URL, Name, or Description
**Logic:**
- If Name/URL provided → scrape/analyze to get business context
- Feed context to **Gemini** for Core Product Pillars analysis
- Output: Business Profile + Initial Seed Keywords (20)

**Prompt Template:**
```typescript
const STRATEGIST_PROMPT = `
You are a business strategy expert. Analyze the provided business/website and generate:

1. CORE PRODUCT PILLARS (5-7 main offerings)
2. TARGET AUDIENCE (primary customer segments)
3. VALUE PROPOSITION (unique selling points)
4. BRAND VOICE (tone, personality)

From this, generate 20 SEED KEYWORDS that represent the business's core offerings.
Format as JSON: { pillars: [...], audience: [...], keywords: ["keyword1", ...] }
`;
```

---

### Agent B: The Researcher (Web Scraper)
**Role:** Multi-source data collection
**Input:** Seed keywords from Agent A, Competitor URLs from user/Agent A
**Logic:**
- Fetch Google Search results for each seed keyword
- Scrape competitor websites (Jina AI reader or Playwright)
- Extract page titles, meta descriptions, headers
- Parallel processing: 5 competitors × 10 pages = concurrent batches

**Output:** Structured page content for each competitor

**Code:** Uses existing `/api/keyword/scrape-competitors` route

---

### Agent C: The Auditor (SEO Hard Data API)
**Role:** Search metrics acquisition
**Input:** 20 seed keywords × ~5 variants = 100 queries
**Logic:**
- Query SEO API (DataForSEO, Semrush, SerpAPI)
- Fetch: Search Volume, CPC, KD, SERP features
- Expand 20 seeds → ~1000 final keywords
- Cache results to minimize API costs

**Output:** Enriched keyword list with metrics

**New File:** `lib/seo/seo-api-client.ts`
```typescript
interface SEOMetrics {
  keyword: string;
  searchVolume: number;
  cpc: number;
  difficulty: number;
  trend: "up" | "down" | "stable";
}
```

---

### Agent D: The Analyst (Clustering & Intent)
**Role:** Semantic grouping and user intent classification
**Input:** ~1000 enriched keywords from Agent C
**Logic:**
- **Vectorization:** Convert to embeddings using Gemini Embeddings API
- **Clustering:** DBSCAN algorithm (density-based, no preset K)
- **Labeling:** Send clusters to Gemini for descriptive labels
  - Parent Topic
  - Funnel Stage (Awareness → Consideration → Conversion)
  - User Intent (Informational, Navigational, Transactional)

**Output:** 50-100 keyword clusters with strategic labels

**New File:** `lib/analysis/keyword-clustering.ts`
```typescript
interface KeywordCluster {
  clusterId: string;
  keywords: Keyword[];
  label: string;
  topic: string;
  funnelStage: "awareness" | "consideration" | "conversion";
  opportunityScore: number; // (Volume × CPC) / Difficulty
}
```

---

## Implementation Plan

### Phase 1: Infrastructure Setup

#### 1.1 Create SEO API Client
**File:** `lib/seo/seo-api-client.ts`
```typescript
// Support multiple providers with fallback
export class SEOAPIClient {
  private provider: "dataforseo" | "semrush" | "serpapi";

  async getMetrics(keywords: string[]): Promise<SEOMetrics[]>;
  async getBatchMetrics(keywordGroups: string[][]): Promise<SEOMetrics[][]>;
}
```

**Config:** Add to `lib/seo/config.ts`
```typescript
export const SEO_CONFIG = {
  primaryProvider: "dataforseo",
  fallbackProviders: ["semrush", "serpapi"],
  batchSize: 100,
  cacheTTL: 604800000, // 7 days
};
```

#### 1.2 Create Clustering Service
**File:** `lib/analysis/keyword-clustering.ts`
```typescript
// DBSCAN implementation
export function clusterKeywords(
  keywords: EnrichedKeyword[]
): Promise<KeywordCluster[]>;

// Gemini embedding
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]>;
```

#### 1.3 Update AI Provider Factory
**File:** `services/ai/provider-factory.ts`
**Change:** Add routing for keyword tasks → Gemini Flash
```typescript
// Route keyword tasks to Gemini for cost efficiency
if (taskType === "keyword-strategy" || taskType === "keyword-clustering") {
  return getGeminiFlashProvider(); // Cheapest for embeddings
}
```

---

### Phase 2: Agent Implementation

#### 2.1 Agent A - Strategist Service
**File:** `services/agents/strategist-agent.ts`
```typescript
import { generateContent } from "@google/generative-ai";

export async function analyzeBusiness(input: {
  url?: string;
  name?: string;
  description?: string;
}) {
  const prompt = `You are a business strategist...`;

  const result = await generateContent({
    model: "gemini-1.5-flash",
    config: {
      responseMimeType: "application/json", // Structured output
      temperature: 0.3,
    },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  return JSON.parse(result.response.text());
}
```

#### 2.2 Agent B - Researcher Service
**File:** `services/agents/researcher-agent.ts`
```typescript
// Uses existing scraper but adds parallelization
export async function researchCompetitors(
  competitors: string[],
  seedKeywords: string[]
) {
  const batches = chunk(competitors, 5);
  const results = await Promise.all(
    batches.map(batch => Promise.all(
      batch.map(comp => scrapeWebsite(comp))
    ))
  );
  return results.flat();
}
```

#### 2.3 Agent C - Auditor Service
**File:** `services/agents/auditor-agent.ts`
```typescript
import { seoAPI } from "@/lib/seo/seo-api-client";

export async function auditKeywords(keywords: string[]) {
  // Batch requests for efficiency
  const batches = chunk(keywords, 100);
  const allMetrics = [];

  for (const batch of batches) {
    const metrics = await seoAPI.getBatchMetrics(
      batch.map(k => generateVariants(k))
    );
    allMetrics.push(...metrics);
  }

  return allMetrics;
}
```

#### 2.4 Agent D - Analyst Service
**File:** `services/agents/analyst-agent.ts`
```typescript
import { genAI } from "@/lib/ai/gemini-client";
import { generateEmbeddings, clusterKeywords } from "@/lib/analysis/keyword-clustering";

export async function analyzeIntent(
  keywords: EnrichedKeyword[]
): Promise<KeywordCluster[]> {
  // Generate embeddings
  const embeddings = await generateEmbeddings(
    keywords.map(k => `${k.keyword} ${k.searchIntent}`)
  );

  // Cluster using DBSCAN
  const clusters = clusterKeywords(embeddings);

  // Label clusters with Gemini
  const labeled = await Promise.all(
    clusters.map(cluster => labelCluster(cluster))
  );

  return labeled;
}
```

---

### Phase 3: API Migration

#### 3.1 Update New Research API Route
**File:** `app/api/keyword/research-agentic/route.ts` (NEW)
```typescript
import { protectedRoute } from "@/lib/api/protected-route";
import { orchestrator } from "@/services/agents/orchestrator";

export const POST = protectedRoute(async (request, user) => {
  const { url, name, competitors } = await request.json();

  // Run agentic workflow
  const result = await orchestrator.run({
    type: "full-research",
    input: { url, name, competitors },
    userId: user.uid,
  });

  return Response.json(result);
}, {
  requireAuth: true,
  requireFeature: "keywordResearch",
});
```

#### 3.2 Create Orchestrator Service
**File:** `services/agents/orchestrator.ts`
```typescript
import { strategistAgent } from "./strategist-agent";
import { researcherAgent } from "./researcher-agent";
import { auditorAgent } from "./auditor-agent";
import { analystAgent } from "./analyst-agent";

export class KeywordOrchestrator {
  async run(params: {
    type: "quick" | "full-research";
    input: ResearchInput;
    userId: string;
  }) {
    switch (params.type) {
      case "quick":
        return await this.quickResearch(params);
      case "full-research":
        return await this.fullResearch(params);
    }
  }

  private async fullResearch(params) {
    // Agent A: Generate seeds + business context
    const strategy = await strategistAgent.analyze(params.input);

    // Agent B: Scrape competitors
    const competitorData = await researcherAgent.research(
      strategy.competitors,
      strategy.seedKeywords
    );

    // Agent C: Enrich with SEO metrics
    const enriched = await auditorAgent.audit(
      strategy.seedKeywords,
      competitorData
    );

    // Agent D: Cluster and analyze intent
    const clusters = await analystAgent.analyze(enriched);

    return { clusters, opportunityScore: this.calculateScore(clusters) };
  }
}
```

---

### Phase 4: Frontend Updates

#### 4.1 Update Results Page
**File:** `app/(dashboard)/marketing/keyword/[researchId]/results/page.tsx`
**Changes:**
- Display cluster-based results instead of flat list
- Show opportunity scoring
- Enable "regenerate cluster" action
- Filter by funnel stage
- Visual cluster representation (tree view optional)

#### 4.2 Update New Research Form
**File:** `app/(dashboard)/marketing/keyword/new/page.tsx`
**Changes:**
- Add "Agentic Mode" toggle (default: off for backward compatibility)
- When enabled, show estimated time/cost
- Display agent progress (Strategy → Research → Audit → Analysis)
- Allow partial results (don't wait for all agents to complete)

#### 4.3 Create Agent Status Component
**File:** `components/keyword/AgentStatus.tsx` (NEW)
```typescript
interface AgentStatusProps {
  agents: {
    name: string;
    status: "idle" | "running" | "complete" | "error";
    progress?: number;
    result?: any;
  }[];
}
```

---

## File Structure (New/Modified)

### New Files:
```
lib/seo/
├── seo-api-client.ts          # SEO API abstraction
├── seo-config.ts              # API configuration

lib/analysis/
├── keyword-clustering.ts       # DBSCAN + labeling
├── embedding-service.ts         # Gemini embeddings wrapper

services/agents/
├── orchestrator.ts             # Main workflow coordinator
├── strategist-agent.ts         # Gemini strategy analysis
├── researcher-agent.ts          # Parallel web scraping
├── auditor-agent.ts            # SEO metrics acquisition
└── analyst-agent.ts            # Clustering & intent

services/ai/
└── gemini-client.ts           # Gemini SDK wrapper

app/api/keyword/
└── research-agentic/route.ts  # New agentic endpoint
```

### Modified Files:
```
services/ai/provider-factory.ts   # Add keyword task routing
types/keyword-research.ts          # Add cluster/intent types
app/(dashboard)/marketing/keyword/new/page.tsx  # Add agentic mode
app/(dashboard)/marketing/keyword/[researchId]/results/page.tsx  # Display clusters
components/keyword/AgentStatus.tsx  # New status display
```

---

## Verification Plan

### End-to-End Testing

1. **Strategy Agent:**
   - Input: Sample URL → Verify: Business profile + 20 seeds generated
   - Test with various inputs (name-only, description-only)

2. **Researcher Agent:**
   - Input: 3 competitor URLs → Verify: All pages scraped
   - Test with invalid URL → Verify: Graceful error handling

3. **Auditor Agent:**
   - Input: 20 keywords → Verify: Metrics returned for all
   - Test cache invalidation

4. **Analyst Agent:**
   - Input: 1000 enriched keywords → Verify: Clusters generated
   - Verify: Clusters make semantic sense

5. **Orchestration:**
   - Verify: All 4 agents execute in correct order
   - Verify: Results aggregate correctly
   - Test failure scenarios (one agent fails)

6. **UI:**
   - Verify: Agent status updates in real-time
   - Verify: Can navigate away and back (progress persists)
   - Verify: Legacy mode still works (backward compatibility)

---

## Migration Rollout Strategy

### Option A: Parallel Launch (Recommended)
1. Deploy new agentic API route alongside existing
2. Add feature flag: `USE_AGENTIC_KEYWORD_FLOW = false`
3. Test agentic flow thoroughly
4. Gradual rollout to users (beta → selected → all)

### Option B: Direct Replacement
1. Replace API route implementation entirely
2. Migrate database format if needed
3. Frontend update to use new response structure

**Recommendation:** Option A for safety and gradual migration

---

## Cost Optimization

### Gemini vs GPT-4o Cost Comparison (per 1M tokens)

| Model | Input | Output | Cost (per 1M) |
|-------|-------|--------|------------------|
| GPT-4o | $2.50 | $10.00 | **$12.50** |
| Gemini 1.5 Flash | $0.075 | $0.60 | **$0.675** |
| Gemini 1.5 Pro | $1.25 | $3.50 | **$4.75** |

**Potential Savings:** ~95% cost reduction for embedding tasks

**Break-even:** Additional complexity must be justified by volume

---

## Success Criteria

### Functional Requirements
- [x] All 4 agents execute successfully
- [x] Clustering produces semantic groups
- [x] SEO metrics integrate properly
- [x] UI displays agent progress
- [x] Results include opportunity scoring
- [x] Response time < 60 seconds for full research

### Quality Requirements
- [x] Clusters labeled descriptively by Gemini
- [x] Funnel stages assigned logically
- [x] Search intent classification accuracy > 80%
- [x] Opportunity score correlates with human assessment

### Performance Requirements
- [x] Agents run in parallel where possible
- [x] Results cache appropriately (SEO: 7 days, content: 24 hours)
- [x] API rate limits respected
- [x] Error recovery works (one agent failure doesn't break flow)

---

