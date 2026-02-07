// Competitor Analysis Types
// Based on COMPETITOR.md specification

export type AnalysisStatus = 'discovering' | 'scraping' | 'analyzing' | 'complete' | 'failed';
export type AnalysisDepth = 'quick' | 'standard' | 'deep';
export type CompetitorSource = 'gemini' | 'google_places' | 'web_search' | 'user_provided';
export type ScrapingStatus = 'success' | 'failed' | 'limited_data';
export type ThreatLevel = 'high' | 'medium' | 'low';
export type OpportunityType = 'market_gap' | 'content' | 'pricing' | 'service' | 'audience';
export type RecommendationCategory = 'quick_win' | 'medium_term' | 'long_term';
export type EffortLevel = 'low' | 'medium' | 'high';
export type ActivityLevel = 'high' | 'medium' | 'low';
export type SpecificConcern = 'pricing' | 'content' | 'seo' | 'social';

export interface AnalysisPreferences {
  keyProducts?: string[];
  specificConcerns?: SpecificConcern[];
  knownCompetitors?: string[];
  excludeCompetitors?: string[];
  analysisDepth: AnalysisDepth;
}

export interface BusinessProfile {
  industry: string;
  services: string[];
  targetAudience: string;
  valueProposition: string;
  geographicScope: string;
}

export interface DiscoveredCompetitor {
  name: string;
  website: string;
  source: CompetitorSource;
  selected: boolean;
  rating?: number;
  reviewCount?: number;
}

export interface PricingInfo {
  pricingModel: string;
  pricePoints: string[];
  hasFreeTrialOrFreemium: boolean;
}

export interface ContentStrategy {
  hasBlog: boolean;
  blogTopics: string[];
  contentTypes: string[];
}

export interface CompetitorAnalysis {
  valueProposition: string;
  products: string[];
  pricing: PricingInfo;
  targetAudience: string;
  uniqueSellingPoints: string[];
  contentStrategy: ContentStrategy;
  websiteQuality: number;
  callsToAction: string[];
  socialProof: string;
  technologyIndicators: string[];
}

export interface SocialMediaData {
  platforms: string[];
  estimatedFollowers: Record<string, string>;
  activityLevel: ActivityLevel;
  contentFocus: string;
  overallStrategy: string;
}

export interface PricingTier {
  name: string;
  price: string;
  billingCycle: string;
  features: string[];
}

export interface DetailedPricing {
  pricingTiers: PricingTier[];
  discounts: string;
  comparisonToCompetitors: string;
  valueMetrics: string;
}

export interface CompetitorData {
  id: string;
  analysisId: string;
  competitorName: string;
  competitorUrl: string;
  scrapedContent: string;
  scrapedAt: Date;
  scrapingStatus: ScrapingStatus;
  analysis?: CompetitorAnalysis;
  socialMediaData?: SocialMediaData;
  detailedPricing?: DetailedPricing;
}

export interface CompetitorProfile {
  name: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  pricingStrategy: string;
  differentiation: string;
  threatLevel: ThreatLevel;
  threatExplanation: string;
}

export interface Opportunity {
  type: OpportunityType;
  title: string;
  description: string;
  howToExploit: string;
  effort: EffortLevel;
}

export interface Recommendation {
  category: RecommendationCategory;
  title: string;
  description: string;
  howToExecute: string[];
  expectedImpact: string;
}

export interface MonitoringPlan {
  trackingFrequency: string;
  competitorsToWatch: string[];
  keyMetrics: string[];
}

export interface ReportSections {
  executiveSummary: string;
  marketPositioning: string;
  competitorProfiles: CompetitorProfile[];
  opportunities: Opportunity[];
  threats: string[];
  recommendations: Recommendation[];
  monitoringPlan: MonitoringPlan;
  keyTakeaways: string[];
}

export interface CompetitorReport {
  id: string;
  analysisId: string;
  generatedAt: Date;
  reportContent: string;
  sections: ReportSections;
  pdfUrl?: string;
  reportFormat: 'web' | 'pdf';
}

export interface CompetitorAnalysisDocument {
  id: string;
  userId: string;
  workspaceId: string;
  createdAt: Date;
  updatedAt: Date;
  
  // User inputs
  userBusinessUrl: string;
  location: string;
  competitorCount: number;
  preferences: AnalysisPreferences;
  
  // Analysis data
  userBusinessProfile?: BusinessProfile;
  competitorsFound?: DiscoveredCompetitor[];
  
  // Status tracking
  status: AnalysisStatus;
  currentStep: number;
  errorMessage?: string;
}

export interface CompetitorCache {
  id: string;
  competitorUrl: string;
  scrapedContent: string;
  cachedAt: Date;
  expiresAt: Date;
}

// API Request/Response Types

export interface AnalyzeBusinessRequest {
  websiteUrl: string;
  location: string;
  userId: string;
  workspaceId: string;
}

export interface AnalyzeBusinessResponse {
  businessProfile: BusinessProfile;
  analysisId: string;
}

export interface DiscoverCompetitorsRequest {
  analysisId: string;
  businessProfile: BusinessProfile;
  location: string;
  preferences: AnalysisPreferences;
}

export interface DiscoverCompetitorsResponse {
  competitors: DiscoveredCompetitor[];
}

export interface ScrapeCompetitorsRequest {
  analysisId: string;
  competitors: Array<{ name: string; website: string }>;
}

export interface ScrapedCompetitor {
  competitorName: string;
  websiteUrl: string;
  scrapedContent: string;
  status: ScrapingStatus;
  error?: string;
}

export interface ScrapeCompetitorsResponse {
  scrapedData: ScrapedCompetitor[];
}

export interface AnalyzeContentRequest {
  analysisId: string;
  scrapedData: ScrapedCompetitor[];
}

export interface AnalyzeContentResponse {
  analyses: CompetitorAnalysis[];
}

export interface GenerateInsightsRequest {
  analysisId: string;
}

export interface GenerateInsightsResponse {
  report: CompetitorReport;
}

export interface FormatReportRequest {
  reportId: string;
  format: 'web' | 'pdf';
}

export interface FormatReportResponse {
  formattedReport: string;
}

export interface GetReportResponse {
  report: CompetitorReport;
  analysis: CompetitorAnalysisDocument;
  competitors: CompetitorData[];
  generatedAt: Date;
}
