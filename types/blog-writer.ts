import { Timestamp } from "firebase/firestore";

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface BlogConfiguration {
  // Section 1: Content Length & Format
  readingTime: number; // minutes
  wordCount: number;
  contentDepth: "overview" | "detailed" | "expert";

  // Section 2: Writing Style & Tone
  tone: "professional" | "conversational" | "educational" | "persuasive" | "storytelling";
  formalityLevel: number; // 1-10
  pronounUse: "first" | "second" | "third" | "mixed";
  technicalLevel: "beginner" | "intermediate" | "advanced";

  // Section 3: Audience & Intent
  targetAudience: string;
  readerKnowledge: "beginner" | "some" | "expert";
  primaryGoal: "educate" | "generate_leads" | "drive_sales" | "build_authority" | "answer_questions";
  readerIntent: "informational" | "commercial" | "transactional";

  // Section 4: Content Structure & Elements
  introStyle: "hook_problem" | "story" | "direct" | "question" | "statistics";
  contentElements: string[]; // toc, faq, steps, comparison, case_studies, etc.
  paragraphStructure: "short" | "standard" | "detailed";
  listUsage: "minimal" | "balanced" | "heavy";

  // Section 5: SEO Optimization
  keywordOptimization: "natural" | "optimized" | "aggressive";
  keywordDensity: number; // percentage
  internalLinking: boolean;
  externalLinkingStrategy: "minimal" | "moderate" | "extensive";
  metaDescriptionOptimization: string[];

  // Section 6: Calls-to-Action
  ctaFrequency: "single" | "multiple" | "none";
  ctaType: string[];
  ctaTone: "soft" | "direct" | "urgent";

  // Section 7: Formatting & Readability
  targetReadabilityScore: number; // Flesch score
  sentenceLength: "short" | "medium" | "varied";
  headingFrequency: "frequent" | "standard" | "sparse";
  formattingElements: string[];

  // Section 8: Content Research & Citations
  researchDepth: "none" | "light" | "moderate" | "deep";
  citationStyle: "inline" | "numbered" | "footnotes" | "none";
  sourcePreference: string[];

  // Section 9: Visual Content
  imageDensity: "minimal" | "standard" | "rich" | "very_rich";
  imageTypes: string[];
  generateAIPrompts: boolean;

  // Section 10: Advanced Options
  contentFreshness: "evergreen" | "current" | "time_sensitive";
  geographicFocus: "global" | "region" | "local";
  geographicLocation?: string;
  industryJargon: "avoid" | "use_sparingly" | "use_freely";
  contentOriginality: "unique_angle" | "comprehensive_update" | "standard";
  voicePersonality: string[];
}

// ============================================================================
// OUTLINE TYPES
// ============================================================================

export interface BlogSubheading {
  heading: string; // H3
  keyPoints: string[];
  estimatedWordCount: number;
  keywordsToInclude: string[];
  imageNeeded: boolean;
  imageDescription?: string;
}

export interface BlogSection {
  section: string;
  heading: string; // H2
  purpose: string;
  subheadings: BlogSubheading[];
  estimatedWordCount: number;
  transitionToNext?: string;
}

export interface BlogOutline {
  workingTitle: string;
  slug: string;
  metaDescription: string;
  sections: BlogSection[];
  seoStrategy: SEOStrategy;
  ctaPlacement: CTAPlacement[];
  visualContent: VisualContent[];
  mainImageAIPrompt: string;
  contentStrategy: string;
  uniqueAngle: string;
  estimatedMetrics: EstimatedMetrics;
}

export interface SEOStrategy {
  primaryKeywordPlacement: string[];
  secondaryKeywordDistribution: Record<string, number>;
  targetKeywordDensity: string;
  internalLinkOpportunities: string[];
  externalSourceTypes: string[];
}

export interface CTAPlacement {
  location: string;
  type: string;
  suggestedText: string;
}

export interface VisualContent {
  location: string;
  type: string;
  description: string;
  aiImagePrompt?: string;
}

export interface EstimatedMetrics {
  totalWordCount: number;
  readingTime: number;
  numberOfHeadings: number;
  numberOfImages: number;
  numberOfCTAs: number;
}

// ============================================================================
// IMAGE & CTA PLACEHOLDERS
// ============================================================================

export interface ImagePlaceholder {
  id: string;
  location: string;
  type: string;
  description: string;
  aiPrompt?: string;
  imageUrl?: string;
  altText?: string;
}

export interface CTAPlaceholder {
  id: string;
  location: string;
  type: string;
  suggestedText: string;
  actualText?: string;
}

// ============================================================================
// KEYWORD USAGE & SEO METRICS
// ============================================================================

export interface KeywordUsage {
  primary: {
    count: number;
    density: number;
    inTitle: boolean;
    inFirstParagraph: boolean;
    inHeadings: number;
  };
  secondary: Array<{
    keyword: string;
    count: number;
    density: number;
  }>;
}

export interface ContentMetrics {
  actualWordCount: number;
  targetWordCount: number;
  actualReadingTime: number;
  readabilityScore: number;
  seoScore: number;
  keywordDensity: number;
  keywordUsage: KeywordUsage;
  structure: {
    headings: { h2: number; h3: number; h4?: number };
    paragraphs: number;
    lists: number;
    links: { internal: number; external: number };
  };
}

// ============================================================================
// VERSION HISTORY
// ============================================================================

export interface VersionHistory {
  version: number;
  content: string;
  updatedAt: Date | Timestamp;
  changes?: string;
  wordCount: number;
}

// ============================================================================
// MAIN BLOG POST DOCUMENT
// ============================================================================

export interface BlogPost {
  // Identifiers
  id: string;
  userId: string;

  // Content
  slug: string;
  title: string;
  description: string; // Meta description
  content: string; // HTML
  tags: string[];

  // Configuration
  configuration: BlogConfiguration;

  // Keywords
  primaryKeyword: string;
  secondaryKeywords: string[];
  keywordResearchId?: string; // Link to keyword research

  // SEO & Images
  mainImageAIPrompt?: string;
  mainImageUrl?: string;
  imagePlaceholders: ImagePlaceholder[];
  ctaPlaceholders: CTAPlaceholder[];

  // Metadata
  targetWordCount: number;
  actualWordCount: number;
  targetReadingTime: number;
  actualReadingTime: number;

  // Structure
  outline: BlogOutline;

  // SEO Metrics
  seoScore: number; // 0-100
  readabilityScore: number; // Flesch reading ease
  keywordDensity: number; // Percentage
  keywordUsage: KeywordUsage;

  // Status
  status: "draft" | "in_progress" | "complete" | "published";
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  publishedAt?: Date | Timestamp;

  // Version Control
  version: number;
  versionHistory: VersionHistory[];
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface BlogTemplate {
  id: string;
  userId: string;
  name: string;
  description: string;
  configuration: BlogConfiguration;
  outline?: Partial<BlogOutline>;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface GenerateOutlineRequest {
  primaryKeyword: string;
  secondaryKeywords: string[];
  configuration: BlogConfiguration;
  userId: string;
}

export interface GenerateOutlineResponse {
  blogId: string;
  outline: BlogOutline;
  seoStrategy: SEOStrategy;
  visualContent: VisualContent[];
  estimatedMetrics: EstimatedMetrics;
}

export interface GenerateContentRequest {
  blogId: string;
  outline: BlogOutline;
  configuration: BlogConfiguration;
  userId: string;
}

export interface GenerateContentResponse {
  blogId: string;
  content: string;
  metrics: ContentMetrics;
  imagePlaceholders: ImagePlaceholder[];
  ctaPlaceholders: CTAPlaceholder[];
}

export interface AIAssistRequest {
  blogId: string;
  action: "continue" | "rewrite" | "expand" | "simplify" | "add_examples" | "add_statistics" | "add_faq" | "improve_readability" | "make_engaging" | "add_transitions" | "seo_optimize" | "add_ctas";
  selection?: string;
  context?: string;
  userId: string;
}

export interface AIAssistResponse {
  generatedContent: string;
}

export interface ExportRequest {
  blogId: string;
  format: "markdown" | "html" | "pdf" | "txt";
  userId: string;
}

export interface ExportResponse {
  downloadUrl?: string;
  content?: string;
}

// ============================================================================
// PRESET TEMPLATES
// ============================================================================

export const PRESET_TEMPLATES: Record<string, Partial<BlogConfiguration>> = {
  quick_news: {
    readingTime: 4,
    wordCount: 1000,
    contentDepth: "overview",
    tone: "professional",
    formalityLevel: 7,
    paragraphStructure: "short",
    headingFrequency: "frequent",
  },
  standard_blog: {
    readingTime: 8,
    wordCount: 2000,
    contentDepth: "detailed",
    tone: "conversational",
    formalityLevel: 5,
    paragraphStructure: "standard",
    headingFrequency: "standard",
  },
  ultimate_guide: {
    readingTime: 18,
    wordCount: 4500,
    contentDepth: "expert",
    tone: "educational",
    formalityLevel: 6,
    paragraphStructure: "detailed",
    headingFrequency: "standard",
    contentElements: ["toc", "faq", "examples", "checklist"],
  },
  how_to_tutorial: {
    readingTime: 10,
    wordCount: 2500,
    contentDepth: "detailed",
    tone: "educational",
    formalityLevel: 4,
    paragraphStructure: "standard",
    contentElements: ["steps", "examples", "checklist"],
  },
  listicle: {
    readingTime: 6,
    wordCount: 1500,
    contentDepth: "overview",
    tone: "conversational",
    formalityLevel: 3,
    paragraphStructure: "short",
    listUsage: "heavy",
  },
  comparison: {
    readingTime: 11,
    wordCount: 2750,
    contentDepth: "detailed",
    tone: "professional",
    formalityLevel: 6,
    paragraphStructure: "standard",
    contentElements: ["comparison", "examples"],
  },
  thought_leadership: {
    readingTime: 14,
    wordCount: 3500,
    contentDepth: "expert",
    tone: "persuasive",
    formalityLevel: 8,
    paragraphStructure: "detailed",
    contentElements: ["statistics", "quotes", "case_studies"],
  },
};
