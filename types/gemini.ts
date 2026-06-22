export interface AIResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface LeadScore {
  score: number;
  tier: "hot" | "warm" | "cold";
  reasoning: string[];
  suggestedActions: string[];
}

export interface DealInsight {
  winProbability: number;
  riskLevel: "low" | "medium" | "high";
  keyFactors: string[];
  recommendedNextStep: string;
  estimatedCloseDate?: string;
}

export interface EmailDraft {
  subject: string;
  body: string;
  tone: string;
}

export interface SearchIntent {
  collection: string;
  filters: Record<string, unknown>;
  sortBy?: string;
  displayQuery: string;
}

export interface ReportInsight {
  summary: string;
  insights: { type: "positive" | "negative" | "warning"; text: string }[];
  recommendations: string[];
}

export interface TaskPrioritySuggestion {
  taskId: string;
  suggestedPriority: "Low" | "Medium" | "High" | "Urgent";
  reasoning: string;
}

export interface FollowUpSuggestion {
  entityId: string;
  entityType: "lead" | "contact" | "deal";
  entityName: string;
  urgency: "high" | "medium" | "low";
  reason: string;
  suggestedAction: string;
  suggestedDate: string;
}

export interface SentimentAnalysis {
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  score: number;
  keyTopics: string[];
  summary: string;
  actionItems: string[];
}

export interface MeetingSummary {
  summary: string;
  keyPoints: string[];
  actionItems: { task: string; assignee?: string; dueDate?: string }[];
  decisions: string[];
}

export interface RewriteOptions {
  tone: "professional" | "casual" | "formal" | "creative";
  goal: "improve" | "simplify" | "expand" | "rephrase";
  length: "shorter" | "same" | "longer";
}
