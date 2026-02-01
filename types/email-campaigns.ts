import { Timestamp } from "firebase/firestore";

// ============================================================================
// CAMPAIGN TYPES
// ============================================================================

export type CampaignType = "one-time" | "automated" | "recurring";
export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "paused" | "archived" | "failed";

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  folder?: string;

  // Email Details
  from: {
    name: string;
    email: string;
  };
  replyTo?: string;
  subject: string;
  previewText?: string;

  // Content
  content: {
    html: string;
    plainText?: string;
  };
  templateId?: string;

  // Audience
  audienceIds: string[]; // References to audience/list IDs
  recipientCount: number;
  exclusions?: {
    unsubscribed: boolean;
    bounced: boolean;
    listIds?: string[];
    campaignIds?: string[];
  };

  // Scheduling
  scheduledAt?: Timestamp;
  sendImmediately?: boolean;
  optimizeSendTime?: boolean; // AI-based send time optimization

  // Sending Settings
  throttling: {
    emailsPerHour: number;
    retryFailed: boolean;
    maxRetries: number;
  };

  // Tracking
  tracking: {
    trackOpens: boolean;
    trackClicks: boolean;
  };

  // Stats (populated after send)
  stats?: CampaignStats;

  // Automation (for automated campaigns)
  workflowId?: string;

  // Recurring (for recurring campaigns)
  recurring?: {
    frequency: "daily" | "weekly" | "monthly";
    interval: number; // e.g., every 2 weeks
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time: string; // HH:mm format
    nextSendAt?: Timestamp;
  };

  // Metadata
  createdBy: string;
  createdByName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sentAt?: Timestamp;
  completedAt?: Timestamp;

  // Error tracking
  error?: string;
  failedRecipients?: number;
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  complained: number; // spam reports
  
  // Rates
  deliveryRate: number; // delivered / sent
  openRate: number; // opened / delivered
  clickRate: number; // clicked / delivered
  clickToOpenRate: number; // clicked / opened
  unsubscribeRate: number;
  
  // Revenue tracking (optional)
  conversions?: number;
  revenue?: number;
  
  lastUpdatedAt: Timestamp;
}

// ============================================================================
// AUDIENCE & SEGMENTATION
// ============================================================================

export type AudienceType = "static" | "dynamic";
export type AudienceSource = "manual" | "csv" | "crm" | "segment";

export interface Audience {
  id: string;
  name: string;
  description?: string;
  type: AudienceType;
  source: AudienceSource;

  // For static lists
  contacts?: Contact[];
  contactCount: number;

  // For dynamic segments
  segmentRules?: SegmentRule[];

  // CRM Integration
  crmSync?: {
    enabled: boolean;
    lastSyncAt?: Timestamp;
    syncFrequency: "realtime" | "daily" | "manual";
    filters?: CRMFilter[];
  };

  // Stats
  stats?: {
    totalContacts: number;
    activeContacts: number;
    unsubscribed: number;
    bounced: number;
    avgEngagement: number; // 0-100
  };

  // Metadata
  createdBy: string;
  createdByName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Contact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  
  // Status
  subscribed: boolean;
  bounced: boolean;
  complained: boolean;
  
  // Engagement
  lastOpenedAt?: Timestamp;
  lastClickedAt?: Timestamp;
  totalOpens: number;
  totalClicks: number;
  
  // Source
  source: "manual" | "import" | "crm" | "form";
  crmLeadId?: string;
  
  subscribedAt: Timestamp;
  unsubscribedAt?: Timestamp;
}

export interface SegmentRule {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than" | "in_last" | "not_in_last";
  value: any;
  logicalOperator?: "AND" | "OR";
}

export interface CRMFilter {
  field: string; // e.g., "status", "tags", "location"
  operator: string;
  value: any;
}

// ============================================================================
// TEMPLATES
// ============================================================================

export type TemplateCategory = "newsletter" | "promotion" | "announcement" | "welcome" | "onboarding" | "custom";

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  
  // Content
  subject: string;
  previewText?: string;
  html: string;
  plainText?: string;
  
  // Design
  thumbnail?: string; // Preview image URL
  
  // Settings
  isSystem: boolean; // System templates vs user-created
  isActive: boolean;
  
  // Usage
  usageCount: number;
  lastUsedAt?: Timestamp;
  
  // Metadata
  createdBy: string;
  createdByName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// AUTOMATION & WORKFLOWS
// ============================================================================

export type WorkflowStatus = "draft" | "active" | "paused" | "archived";
export type TriggerType = "list_subscribe" | "crm_added" | "link_clicked" | "email_opened" | "field_changed" | "date_based" | "inactivity";
export type WorkflowStepType = "send_email" | "wait" | "condition" | "add_tag" | "remove_tag" | "add_to_list" | "remove_from_list" | "end";

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  
  // Trigger
  trigger: WorkflowTrigger;
  
  // Steps
  steps: WorkflowStep[];
  
  // Settings
  settings: {
    allowMultipleEnrollments: boolean;
    reEnrollmentDelay?: number; // days
    exitOnUnsubscribe: boolean;
    exitOnGoal?: string; // goal ID
    maxEmailsPerContact: number;
    throttling: number; // emails per hour
  };
  
  // Stats
  stats?: {
    totalEnrolled: number;
    currentlyEnrolled: number;
    completed: number;
    exited: number;
  };
  
  // Metadata
  createdBy: string;
  createdByName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  activatedAt?: Timestamp;
}

export interface WorkflowTrigger {
  type: TriggerType;
  config: {
    listId?: string;
    fieldName?: string;
    fieldValue?: any;
    dateField?: string;
    daysInactive?: number;
    campaignId?: string;
  };
}

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  position: number;
  
  // Email step
  emailConfig?: {
    templateId?: string;
    subject: string;
    content: string;
  };
  
  // Wait step
  waitConfig?: {
    duration: number;
    unit: "minutes" | "hours" | "days" | "weeks";
    waitUntil?: {
      time?: string; // HH:mm
      dayOfWeek?: number; // 0-6
      skipWeekends?: boolean;
      skipHolidays?: boolean;
    };
  };
  
  // Condition step
  conditionConfig?: {
    field: string;
    operator: string;
    value: any;
    truePath?: string; // next step ID
    falsePath?: string; // next step ID
  };
  
  // Tag/List step
  tagConfig?: {
    tagName: string;
  };
  listConfig?: {
    listId: string;
  };
  
  nextStepId?: string; // For linear flow
}

// ============================================================================
// ANALYTICS & TRACKING
// ============================================================================

export type EventType = "sent" | "delivered" | "opened" | "clicked" | "bounced" | "unsubscribed" | "complained";

export interface CampaignEvent {
  id: string;
  campaignId: string;
  contactId: string;
  contactEmail: string;
  
  eventType: EventType;
  timestamp: Timestamp;
  
  // Event-specific data
  metadata?: {
    linkUrl?: string; // for clicks
    linkId?: string;
    deviceType?: "desktop" | "mobile" | "tablet";
    userAgent?: string;
    ipAddress?: string;
    location?: {
      country?: string;
      city?: string;
    };
    bounceReason?: string;
    unsubscribeReason?: string;
  };
}

export interface LinkTracking {
  id: string;
  campaignId: string;
  originalUrl: string;
  trackingUrl: string;
  clicks: number;
  uniqueClicks: number;
  clickRate: number;
}

// ============================================================================
// BRAND SETTINGS
// ============================================================================

export interface BrandSettings {
  id: string; // userId
  
  // Logo
  logo?: {
    url: string;
    width: number;
    height: number;
  };
  
  // Colors
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };
  
  // Typography
  fonts: {
    heading: string;
    body: string;
  };
  
  // Social Links
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  
  // Footer
  footer: {
    companyName: string;
    address: string;
    unsubscribeText: string;
  };
  
  // SMTP Settings (for Nodemailer)
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string; // Encrypted
    };
  };
  
  updatedAt: Timestamp;
}

// ============================================================================
// INPUT TYPES (for creating/updating)
// ============================================================================

export type CampaignInput = Omit<Campaign, "id" | "createdAt" | "updatedAt" | "stats" | "sentAt" | "completedAt">;
export type AudienceInput = Omit<Audience, "id" | "createdAt" | "updatedAt" | "contactCount" | "stats">;
export type TemplateInput = Omit<EmailTemplate, "id" | "createdAt" | "updatedAt" | "usageCount" | "lastUsedAt">;
export type WorkflowInput = Omit<Workflow, "id" | "createdAt" | "updatedAt" | "stats" | "activatedAt">;

// ============================================================================
// AI GENERATION
// ============================================================================

export interface AIContentRequest {
  // One-click mode
  quickPrompt?: string;
  
  // Detailed mode
  goal?: "promote" | "announce" | "nurture" | "event" | "feedback" | "custom";
  targetAudience?: string;
  tone?: "professional" | "friendly" | "urgent" | "formal" | "casual";
  length?: "short" | "standard" | "detailed";
  includeElements?: {
    cta: boolean;
    testimonials: boolean;
    urgency: boolean;
    socialProof: boolean;
    benefits: boolean;
    personalization: boolean;
  };
  customInstructions?: string;
}

export interface AIContentResponse {
  subjectLines: string[]; // 3 options
  previewText: string;
  html: string;
  plainText: string;
}

// ============================================================================
// QUEUE & JOBS
// ============================================================================

export interface EmailJob {
  id: string;
  campaignId: string;
  contactId: string;
  contactEmail: string;
  
  subject: string;
  html: string;
  plainText?: string;
  
  status: "pending" | "processing" | "sent" | "failed" | "bounced";
  attempts: number;
  maxAttempts: number;
  
  error?: string;
  
  createdAt: Timestamp;
  processedAt?: Timestamp;
}
