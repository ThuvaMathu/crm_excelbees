/**
 * TypeScript types for Keyword Research feature
 */

export interface KeywordResearchDocument {
  id: string;
  userId: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'analyzing' | 'complete' | 'failed';
  currentStep: number;
  errorMessage?: string;
  
  requestedKeywordCount: number;
  businessWebsite: string;
  businessLocation: string;
  competitorSource: 'previous' | 'manual' | 'auto' | 'hybrid';
  
  analysisDepth: {
    competitorCount: number;
    pagesPerCompetitor: number;
    totalPages: number;
  };
  
  pagePreferences: {
    prioritizeBlog: boolean;
    prioritizeServices: boolean;
    includeLocation: boolean;
    includeProducts: boolean;
  };
}

export interface BusinessContext {
  industry: string;
  mainServices: string[];
  targetAudience: string;
  businessType: 'B2B' | 'B2C' | 'Local' | 'E-commerce';
  geographicScope: 'Local' | 'Regional' | 'National' | 'Global';
  analyzedAt: Date;
}

export interface KeywordCompetitor {
  competitorId: string;
  name: string;
  url: string;
  source: 'previous_analysis' | 'manual' | 'auto_discovered';
  status: 'pending' | 'scraped' | 'analyzed' | 'failed';
}

export interface SitemapData {
  competitorId: string;
  competitorName: string;
  sitemapUrl: string;
  totalPagesInSitemap: number;
  selectedPages: SelectedPage[];
}

export interface SelectedPage {
  pageId: string;
  url: string;
  category: 'home' | 'about' | 'services' | 'blog' | 'location' | 'case-study' | 'resource' | 'other';
  title: string;
  priority: number;
  isDynamic?: boolean;
  competitorUrl?: string;
  competitorId?: string;
  competitorName?: string;
}

export interface PageContent {
  pageId: string;
  competitorId: string;
  competitorName: string;
  pageUrl: string;
  category: string;
  scrapedContent: string;
  metadata: PageMetadata;
  scrapedAt: Date;
}

export interface PageMetadata {
  title: string;
  mainTopic: string;
  contentType: string;
  wordCount: number;
  hasStructuredData: boolean;
  contentQuality: number;
}

export interface ExtractedKeyword {
  keyword: string;
  occurrences: number;
  prominence?: number;
}

export interface PageKeywords {
  pageId: string;
  pageUrl: string;
  competitorName: string;
  category: string;
  primaryKeywords: ExtractedKeyword[];
  secondaryKeywords: ExtractedKeyword[];
  searchIntent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  relevanceToUser: 'high' | 'medium' | 'low';
  contentStrategy: string;
}

export interface ConsolidatedKeyword {
  keywordId: string;
  primaryKeyword: string;
  variations: string[];
  keywordFamily: string;
  totalOccurrences: number;
  usedByCompetitors: number;
  avgProminence: number;
  searchIntent: string;
  relevanceScore: number;
  sources: Array<{
    competitor: string;
    pageUrl: string;
    category: string;
  }>;
}

export interface EnrichedKeyword extends ConsolidatedKeyword {
  searchVolume: number;
  searchVolumeCategory: 'low' | 'medium' | 'high';
  difficulty: 'low' | 'medium' | 'high';
  trend: 'rising' | 'stable' | 'declining';
  cpc?: string;
  topRankingDomains: string[];
  whichCompetitorsRank: string[];
}

export interface SelectedKeyword extends EnrichedKeyword {
  rank: number;
  strategicValue: 'quick-win' | 'core-target' | 'long-term-goal';
  selectionReason: string;
  targetContentType?: string;
  targetWordCount?: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface KeywordFamily {
  familyName: string;
  keywords: string[];
  totalSearchVolume: number;
  contentStrategy: string;
}

export interface ContentRecommendation {
  keywordCluster: string;
  contentType: string;
  targetWordCount: number;
  keyTopics: string[];
  priority: number;
}

export interface StrategyReport {
  generatedAt: Date;
  executiveSummary: string;
  keywordBreakdown: {
    quickWins: SelectedKeyword[];
    coreTargets: SelectedKeyword[];
    longTermGoals: SelectedKeyword[];
  };
  keywordFamilies: KeywordFamily[];
  competitorInsights: {
    allCompetitorsTarget: string[];
    someCompetitorsTarget: string[];
    noCompetitorsTarget: string[];
    competitiveGaps: string[];
  };
  contentRecommendations: ContentRecommendation[];
  searchIntentDistribution: {
    informational: { count: number; strategy: string };
    commercial: { count: number; strategy: string };
    transactional: { count: number; strategy: string };
  };
  priorityActionPlan: {
    month1: string[];
    month2to3: string[];
    month4to6: string[];
  };
  successMetrics: {
    expectedTrafficIncrease: string;
    targetRankings: string;
    conversionPotential: string;
  };
  riskAssessment: {
    cannibalizationRisks: string[];
    optimizationWarnings: string[];
    competitiveThreats: string[];
  };
  nextSteps: string[];
}

// API Request/Response types

export interface ExtractBusinessContextRequest {
  websiteUrl: string;
  location: string;
  userId: string;
  workspaceId: string;
}

export interface ExtractBusinessContextResponse {
  businessContext: BusinessContext;
  researchId: string;
}

export interface IdentifyCompetitorsRequest {
  researchId: string;
  method: 'previous' | 'manual' | 'auto' | 'hybrid';
  data?: {
    previousAnalysisId?: string;
    manualUrls?: string[];
    autoDiscoverCount?: number;
  };
  businessContext: BusinessContext;
}

export interface IdentifyCompetitorsResponse {
  competitors: KeywordCompetitor[];
  totalCompetitors: number;
}

export interface DiscoverSitemapsRequest {
  researchId: string;
  competitors: KeywordCompetitor[];
  pagesPerCompetitor: number;
  pagePreferences: {
    prioritizeBlog: boolean;
    prioritizeServices: boolean;
    includeLocation: boolean;
    includeProducts: boolean;
  };
}

export interface DiscoverSitemapsResponse {
  sitemapsData: SitemapData[];
}

export interface ExtractPageContentRequest {
  researchId: string;
  selectedPages: SelectedPage[];
}

export interface ExtractPageContentResponse {
  scrapedPages: PageContent[];
}

export interface ExtractKeywordsRequest {
  researchId: string;
  scrapedPages: PageContent[];
  businessContext: BusinessContext;
}

export interface ExtractKeywordsResponse {
  extractedKeywords: PageKeywords[];
}

export interface AggregateKeywordsRequest {
  researchId: string;
  extractedKeywords: PageKeywords[];
}

export interface AggregateKeywordsResponse {
  consolidatedKeywords: ConsolidatedKeyword[];
}

export interface EnrichKeywordsRequest {
  researchId: string;
  consolidatedKeywords: ConsolidatedKeyword[];
  requestedCount: number;
}

export interface EnrichKeywordsResponse {
  enrichedKeywords: EnrichedKeyword[];
}

export interface FinalizeSelectionRequest {
  researchId: string;
  enrichedKeywords: EnrichedKeyword[];
  requestedCount: number;
  businessContext: BusinessContext;
}

export interface FinalizeSelectionResponse {
  selectedKeywords: SelectedKeyword[];
}

export interface GenerateInsightsRequest {
  researchId: string;
  selectedKeywords: SelectedKeyword[];
  allResearchData: {
    businessContext: BusinessContext;
    competitors: KeywordCompetitor[];
    totalPagesScraped: number;
    totalKeywordsExtracted: number;
  };
}

export interface GenerateInsightsResponse {
  strategyReport: StrategyReport;
}

export interface ExportRequest {
  researchId: string;
  formatType: 'csv' | 'pdf' | 'excel' | 'all';
}

export interface ExportResponse {
  downloadUrl?: string;
  downloadUrls?: {
    csv?: string;
    pdf?: string;
    excel?: string;
  };
}
