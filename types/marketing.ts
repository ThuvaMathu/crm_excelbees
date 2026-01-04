import { Timestamp } from "firebase/firestore";

export type MarketingStatus = "draft" | "scheduled" | "active" | "completed" | "paused" | "archived";

// 1. Marketing Campaigns
export interface MarketingCampaign {
  id: string;
  name: string;
  type: "email" | "social" | "ad" | "seo" | "content" | "multi-channel";
  status: MarketingStatus;
  startDate: Timestamp;
  endDate?: Timestamp;
  budget: number;
  spent: number;
  createdBy: string;
  workspaceId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 2. Competitors
export interface MarketingCompetitor {
  id: string;
  domain: string;
  companyName: string;
  industry?: string;
  trackingEnabled: boolean;
  lastAnalyzed?: Timestamp;
  metrics?: {
    domainAuthority?: number;
    organicTraffic?: number;
    keywordCount?: number;
  };
  workspaceId: string;
  createdAt: Timestamp;
}

// 3. Keywords
export interface MarketingKeyword {
  id: string;
  keyword: string;
  searchVolume: number;
  difficulty: number;
  intent: "informational" | "transactional" | "navigational" | "commercial";
  status: "active" | "ignored" | "tracked";
  currentRank?: number;
  history?: { rank: number; date: Timestamp }[];
  trackedSince: Timestamp;
  workspaceId: string;
}

// 4. Content Calendar
export interface MarketingContentItem {
  id: string;
  title: string;
  contentType: "blog" | "social" | "email" | "ad" | "video";
  channel: string; // "twitter", "linkedin", "blog", "newsletter"
  scheduledDate: Timestamp;
  status: MarketingStatus;
  assignedTo?: string; // User ID
  campaignId?: string;
  workspaceId: string;
  assets?: string[]; // URLs
  createdAt: Timestamp;
}

// 5. Email Campaigns (Bulk)
export interface MarketingEmailCampaign {
  id: string;
  campaignId?: string; // Link to parent MarketingCampaign
  subject: string;
  content: string; // HTML
  templateId?: string;
  recipientsCount: number;
  sentAt?: Timestamp;
  stats?: {
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
  };
  status: MarketingStatus;
  workspaceId: string;
  createdAt: Timestamp;
}

// 6. Social Posts
export interface MarketingSocialPost {
  id: string;
  platform: "twitter" | "linkedin" | "facebook" | "instagram" | "tiktok";
  content: string;
  mediaUrls?: string[];
  scheduledTime: Timestamp;
  status: MarketingStatus;
  publishedUrl?: string;
  engagementMetrics?: {
    likes: number;
    shares: number;
    comments: number;
    impressions: number;
  };
  workspaceId: string;
  createdAt: Timestamp;
}

// 7. Ad Copies
export interface MarketingAdCopy {
  id: string;
  platform: "google" | "facebook" | "linkedin" | "instagram";
  headline: string;
  description: string;
  cta: string;
  performanceScore?: number; // AI predicted or actual
  campaignId?: string;
  workspaceId: string;
  createdAt: Timestamp;
}

// 8. Landing Pages
export interface MarketingLandingPage {
  id: string;
  url: string;
  title: string;
  conversionRate?: number;
  lastAnalyzed?: Timestamp;
  recommendations?: {
    type: "design" | "copy" | "seo" | "tech";
    severity: "low" | "medium" | "high";
    description: string;
  }[];
  workspaceId: string;
  createdAt: Timestamp;
}

// 9. SEO Audits
export interface MarketingSEOAudit {
  id: string;
  pageUrl: string;
  score: number; // 0-100
  issues: {
    category: "technical" | "content" | "ux";
    issue: string;
    impact: "low" | "medium" | "high";
  }[];
  recommendations: string[];
  auditDate: Timestamp;
  workspaceId: string;
}

// 10. Analytics Events (Aggregated)
export interface MarketingAnalyticsMetric {
  id: string;
  metricType: "traffic" | "conversion" | "ranking" | "engagement" | "spend";
  value: number;
  date: Timestamp;
  channel?: string;
  campaignId?: string;
  workspaceId: string;
}
