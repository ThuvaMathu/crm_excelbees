import { Timestamp } from "firebase/firestore";

// Email Status
export type EmailStatus = "draft" | "scheduled" | "sending" | "sent" | "failed" | "bounced";

// Email Template Category
export type EmailTemplateCategory = 
  | "invoice" 
  | "quote" 
  | "follow-up" 
  | "reminder" 
  | "welcome" 
  | "general";

// Email Recipient
export interface EmailRecipient {
  id?: string;
  email: string;
  name?: string;
  contactId?: string;
  isValid: boolean;
  avatar?: string;
}

// Email Attachment
export interface EmailAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
  source: "upload" | "crm" | "link";
  crmRecordId?: string;
}

// Email Tracking
export interface EmailTracking {
  trackOpens: boolean;
  trackClicks: boolean;
  opens: number;
  clicks: number;
  lastOpenedAt?: Timestamp;
  firstOpenedAt?: Timestamp;
}

// Email
export interface Email {
  id: string;
  organizationId?: string; // multi-tenant scope
  from: string;
  fromName?: string;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: string;
  subject: string;
  body: string; // HTML content
  plainText?: string; // Plain text fallback
  attachments?: EmailAttachment[];
  status: EmailStatus;
  
  // Template
  templateId?: string;
  templateName?: string;
  
  // Tracking
  tracking: EmailTracking;
  
  // Scheduling
  scheduledAt?: Timestamp; // Renamed from scheduledFor
  sentAt?: Timestamp;
  
  // CRM Integration
  relatedTo?: {
    collection: string;
    id: string;
    name?: string;
  };
  
  // Metadata
  createdBy: string;
  createdByName?: string;
  ownerId: string;
  ownerName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Error tracking
  error?: string;
  retryCount?: number;
}

// Email Template
export interface EmailTemplate {
  id: string;
  organizationId?: string; // multi-tenant scope
  name: string;
  description?: string;
  category: EmailTemplateCategory;
  subject: string;
  body: string; // HTML with merge fields
  
  // Settings
  isDefault: boolean;
  isShared: boolean;
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

// Email Context (for opening compose modal)
export interface EmailContext {
  type: "invoice" | "quote" | "deal" | "contact" | "company" | "lead" | "general";
  relatedRecordId?: string;
  relatedRecordName?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  invoiceId?: string;
  
  // Pre-fill data
  to?: EmailRecipient[];
  subject?: string;
  body?: string;
  attachments?: EmailAttachment[];
  templateId?: string;
}

// Merge Field Definition
export interface MergeFieldDefinition {
  key: string;
  label: string;
  example: string;
  description?: string;
}

export interface MergeFieldCategory {
  label: string;
  fields: MergeFieldDefinition[];
}

// Email Input (for creating emails)
export type EmailInput = Omit<Email, "id" | "createdAt" | "updatedAt" | "ownerId" | "ownerName">;

// Email Template Input
export type EmailTemplateInput = Omit<EmailTemplate, "id" | "createdAt" | "updatedAt" | "usageCount" | "lastUsedAt">;

// Email Compose State
export interface EmailComposeState {
  // Recipients
  to: EmailRecipient[];
  cc: EmailRecipient[];
  bcc: EmailRecipient[];
  from: string;
  fromName: string;
  replyTo: string;
  
  // Content
  subject: string;
  body: string;
  plainText: string;
  
  // Template
  selectedTemplate: EmailTemplate | null;
  hasUnsavedChanges: boolean;
  
  // Attachments
  attachments: EmailAttachment[];
  isUploadingFiles: boolean;
  uploadProgress: Record<string, number>;
  
  // Options
  tracking: {
    trackOpens: boolean;
    trackClicks: boolean;
  };
  scheduledSendTime: Date | null;
  
  // UI State
  showCCBCC: boolean;
  activeTab: "compose" | "preview";
  errors: Record<string, string>;
  isSending: boolean;
  isDraft: boolean;
}

// Email Validation Result
export interface EmailValidationResult {
  isValid: boolean;
  errors: {
    recipients?: string;
    subject?: string;
    body?: string;
    attachments?: string;
  };
}
