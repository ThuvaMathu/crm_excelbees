import { Timestamp } from "firebase/firestore";

// ============================================================
// MULTI-TENANT — ORGANIZATION TYPES
// ============================================================

export interface Organization {
  id: string;
  name: string;
  slug: string; // URL-safe identifier e.g. "excelbees-inc"
  ownerId: string; // Firebase UID of the creator
  logoUrl?: string; // Also used as the invoice/PDF company logo — admin-only, org-wide.
  website?: string;
  industry?: string;
  size?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  smtpConfig?: SMTPConfig;
  invoiceSettings?: InvoiceOrgSettings;
}

export interface SMTPConfig {
  provider: string; // e.g., "gmail", "yahoo", "zoho", "custom"
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass?: string; // App password, encrypted in DB
}

// Org-wide invoice branding/config — admin-only (see
// app/org/[orgId]/settings/invoices/page.tsx). Deliberately has no
// companyName (always the org's own `name`, not a separately editable
// value — team members must not be able to invoice under a different
// company name), no fromName/fromEmail (always the actual sending user's
// own name/email, resolved at send time, not a stored value), and no
// logoUrl (reuses Organization.logoUrl directly instead of duplicating it).
export interface InvoiceOrgSettings {
  colorTheme: InvoiceColorTheme; // Hex color, applied to PDF accent color
  invoicePrefix: string; // e.g., "INV-", "EB-"
  nextInvoiceNumber: number; // Auto-incrementing counter, shared org-wide
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  ifsc?: string;
  upiId?: string;
  gstin?: string;
}

export type OrgMemberStatus = "active" | "invited" | "suspended";

export interface OrganizationMember {
  id: string; // doc id = `${organizationId}_${userId}`
  organizationId: string;
  userId: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role: UserRole;
  permissions?: UserPermissions;
  status: OrgMemberStatus;
  joinedAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  memberIds: string[]; // array of userIds
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================
// USER & PERMISSION TYPES
// ============================================================

// User Types
export type UserRole = "admin" | "manager" | "team";

// Module Permission - Granular CRUD + EditAll control
export interface ModulePermission {
  read: boolean;
  create: boolean;
  edit: boolean;   // Own records only for non-admin
  delete: boolean;
  editAll: boolean; // Other users' records (admin/manager)
}

// Feature Toggle - Simple on/off for premium features
export interface FeatureToggle {
  enabled: boolean;
}

// Comprehensive User Permissions Interface
export interface UserPermissions {
  // CRM Core Modules
  leads: ModulePermission;
  contacts: ModulePermission;
  companies: ModulePermission;
  deals: ModulePermission;
  projects: ModulePermission;
  tasks: ModulePermission;
  invoices: ModulePermission;
  reports: ModulePermission;

  // AI Assistant Module (Gemini-powered)
  aiAssistant: FeatureToggle;

  // Admin Module
  userManagement: FeatureToggle;
}

// Permission Keys for type-safe access
export type ModuleKey = keyof UserPermissions;
export type FeatureKey = Exclude<ModuleKey, "leads" | "contacts" | "companies" | "deals" | "projects" | "tasks" | "invoices" | "reports">;
export type ActionKey = "read" | "create" | "edit" | "delete" | "editAll";

// Default Permission Templates by Role
export const ROLE_DEFAULTS: Record<UserRole, UserPermissions> = {
  admin: {
    // CRM Core - Full Access
    leads: { read: true, create: true, edit: true, delete: true, editAll: true },
    contacts: { read: true, create: true, edit: true, delete: true, editAll: true },
    companies: { read: true, create: true, edit: true, delete: true, editAll: true },
    deals: { read: true, create: true, edit: true, delete: true, editAll: true },
    projects: { read: true, create: true, edit: true, delete: true, editAll: true },
    tasks: { read: true, create: true, edit: true, delete: true, editAll: true },
    invoices: { read: true, create: true, edit: true, delete: true, editAll: true },
    reports: { read: true, create: true, edit: true, delete: false, editAll: true },

    // AI Assistant
    aiAssistant: { enabled: true },

    // Admin
    userManagement: { enabled: true },

  },
  manager: {
    // CRM Core - Full Create/Read/Edit All, No Delete
    leads: { read: true, create: true, edit: true, delete: false, editAll: true },
    contacts: { read: true, create: true, edit: true, delete: false, editAll: true },
    companies: { read: true, create: true, edit: true, delete: false, editAll: true },
    deals: { read: true, create: true, edit: true, delete: false, editAll: true },
    projects: { read: true, create: true, edit: true, delete: false, editAll: true },
    tasks: { read: true, create: true, edit: true, delete: false, editAll: true },
    invoices: { read: true, create: true, edit: true, delete: false, editAll: true },
    reports: { read: true, create: false, edit: false, delete: false, editAll: true },

    // AI Assistant
    aiAssistant: { enabled: true },

    // Admin - View Only
    userManagement: { enabled: false },

  },
  team: {
    // CRM Core - Create own records, Read all, Edit own only
    leads: { read: true, create: true, edit: true, delete: false, editAll: false },
    contacts: { read: true, create: true, edit: true, delete: false, editAll: false },
    companies: { read: true, create: true, edit: true, delete: false, editAll: false },
    deals: { read: true, create: true, edit: true, delete: false, editAll: false },
    projects: { read: true, create: false, edit: false, delete: false, editAll: false },
    tasks: { read: true, create: true, edit: true, delete: false, editAll: false },
    invoices: { read: false, create: false, edit: false, delete: false, editAll: false },
    reports: { read: false, create: false, edit: false, delete: false, editAll: false },

    // AI Assistant - Disabled by default (admin can enable per user)
    aiAssistant: { enabled: false },

    // Admin - No Access
    userManagement: { enabled: false },

  },
};

// Audit Log Types
export type AuditAction =
  | "user_created"
  | "user_deleted"
  | "user_deactivated"
  | "user_activated"
  | "role_changed"
  | "permission_changed"
  | "permission_reset"
  | "password_reset"
  | "login_attempt"
  | "login_success"
  | "login_failed"
  | "permission_denied";

export interface AuditLog {
  id: string;
  action: AuditAction;
  targetUserId?: string;
  targetUserName?: string;
  performedBy: string;
  performedByName: string;
  details: Record<string, any>;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

// Role Template for Firestore
export interface RoleTemplate {
  id: UserRole | string;
  name: string;
  description: string;
  isSystem: boolean;
  defaultPermissions: UserPermissions;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Extended User Interface with Permissions
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: UserRole;
  permissions?: UserPermissions; // NEW: Granular permissions
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  isFirstLogin?: boolean;
  isActive?: boolean;
  createdBy?: string;
  passwordChangedAt?: Date;
  provider?: "password" | "google.com";
}

// Additional User Types for Firestore
export type UserStatus = "active" | "inactive";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  phone?: string;
  position?: string;      // Job title / role within company
  role: UserRole;
  isFirstLogin: boolean;
  isActive: boolean;
  isOnboarded?: boolean;  // false until user completes the onboarding wizard
  status: UserStatus;
  createdAt: Timestamp;
  createdBy: string;
  lastLoginAt: Timestamp;
  passwordChangedAt?: Timestamp;
  updatedAt?: Timestamp;
  provider?: "password" | "google.com";
  permissions?: UserPermissions;
  documents?: any[];
  settings?: {
    theme?: "light" | "dark" | "system";
    notifications?: boolean | {
      emailNotifications?: boolean;
      taskReminders?: boolean;
      weeklySummary?: boolean;
    };
    defaultCurrency?: string;
  };
}

// Lead Types
export type LeadStatus = "New" | "Contacted" | "Follow Up" | "Qualified" | "Lost";
export type LeadSource = "Website" | "Referral" | "Ads" | "Cold Call" | "Other";

export interface Lead {
  id: string;
  organizationId: string; // multi-tenant scope
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  jobTitle?: string | null;
  status: LeadStatus;
  source: LeadSource;
  value?: number;
  ownerId: string;
  ownerName?: string;
  tags: string[];
  notes?: string | null;
  // AI Qualification
  aiScore?: number;
  aiReasoning?: string[];
  aiLastUpdated?: Timestamp | null;
  lastContactedAt?: Timestamp | null;
  // Conversion tracking
  converted?: boolean;
  convertedToContactId?: string | null;
  convertedToDealId?: string | null;
  convertedToProjectId?: string | null;
  convertedAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Contact Types
export interface Contact {
  id: string;
  organizationId: string; // multi-tenant scope
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  ownerId: string;
  ownerName?: string;
  jobTitle?: string | null;
  lastContactedAt?: Timestamp | null;
  notes?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Company Types
export type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+";

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface Company {
  id: string;
  organizationId: string; // multi-tenant scope
  name: string;
  domain?: string;
  email?: string;
  phone?: string;
  description?: string;
  industry?: string;
  size?: CompanySize;
  annualRevenue?: number;
  billingAddress?: Address;
  shippingAddress?: Address;
  ownerId: string;
  ownerName?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Activity Types
export type ActivityType = 
  | "note" 
  | "email" 
  | "call" 
  | "log" 
  | "status_change" 
  | "created" 
  | "updated" 
  | "deleted";

export interface Activity {
  id: string;
  organizationId?: string; // multi-tenant scope
  type: ActivityType;
  content: string; // Can be plain text or HTML
  performedBy: string;
  performedByName?: string;
  relatedTo: {
    collection: string;
    id: string;
  };
  metadata?: {
    oldValue?: any;
    newValue?: any;
    field?: string;
    [key: string]: any;
  };
  attachments?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  mentions?: string[]; // Array of user IDs mentioned
  createdAt: Timestamp;
}

// Deal Types
export type DealStage = 
  | "Pipeline" 
  | "Follow Up" 
  | "Schedule Service" 
  | "Conversation" 
  | "Won" 
  | "Lost";

export interface Deal {
  id: string;
  organizationId: string; // multi-tenant scope
  title: string;
  stage: DealStage;
  value: number;
  probability: number; // 0-100
  closeDate?: Timestamp;
  contactIds: string[];
  companyId?: string;
  companyName?: string;
  ownerId: string;
  ownerName?: string;
  description?: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archived?: boolean;
}

// Project Types
export type ProjectStatus = "Planning" | "Development" | "Active" | "On Hold" | "Completed" | "Management" | "Cancelled";
export type ProjectPriority = "Low" | "Medium" | "High" | "Critical";
export type ProjectLifecycle = "active" | "maintenance";
export type ManagementBillingCycle = "Quarterly" | "Semi-Annual" | "None";

export interface ProjectPhase {
  id: string;
  name: string;
  description?: string;
  progress: number; // 0–100
  order: number;
}

export interface ProjectFinancials {
  initialCost?: number;
  annualRecurringCost?: number;
  managementBillingCycle?: ManagementBillingCycle;
  nextBillingDate?: Timestamp;
  isRecurringEnabled: boolean;
}

export interface ProjectNotificationSettings {
  enabled: boolean;
  emailEnabled: boolean;
  lastNotificationSent?: Timestamp;
}

export interface Project {
  id: string;
  organizationId: string; // multi-tenant scope
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  lifecycle: ProjectLifecycle; // "active" | "maintenance"
  scope?: string; // Project scope defined at creation
  phases: ProjectPhase[]; // Project phases with individual progress
  startDate: Timestamp;
  endDate?: Timestamp;
  
  // Financials & Lifecycle
  financials?: ProjectFinancials;
  notificationSettings?: ProjectNotificationSettings;

  budget?: number; // Legacy/Total budget
  companyId?: string;
  companyName?: string;
  dealId?: string;
  teamMembers: string[]; // User IDs
  files?: any[]; // Uploaded files associated with the project
  ownerId: string;
  ownerName?: string;
  progress: number; // 0-100
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archived?: boolean;
}

// Task Types
export type TaskStatus = "To Do" | "In Progress" | "Review" | "Done";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type TaskType = "To Do" | "Call" | "Email" | "Meeting";

export interface Task {
  id: string;
  organizationId: string; // multi-tenant scope
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  projectId?: string;
  projectName?: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: Timestamp;
  startDate?: Timestamp;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  ownerId: string;
  ownerName?: string;
  relatedTo?: {
    type: "lead" | "contact" | "deal" | "company";
    id: string;
    name: string;
  };
  associates?: string[];
  isArchived?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

// Invoice Types
export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled";
export type PaymentTerms = "Net 15" | "Net 30" | "Net 60" | "Due on Receipt" | "Custom";
export type InvoiceTemplate = "standard" | "professional" | "creative";
export type InvoiceColorTheme = string; // Hex color code (e.g., "#3B82F6")

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  taxRate: number; // Percentage (e.g., 10 for 10%)
  total: number; // Auto-calculated
  type?: "Service" | "Advance" | "Refund" | "Credit" | "Discount"; // Line item type for adjustments
}

export interface Invoice {
  id: string;
  organizationId: string; // multi-tenant scope
  invoiceNumber: string;
  status: InvoiceStatus;
  template: InvoiceTemplate;
  // Client Information
  companyId?: string;
  companyName?: string;
  contactId?: string;
  contactName?: string;
  clientEmail?: string;
  billingAddress?: string;
  shippingAddress?: string;
  
  // Deal/Project Linking (Nullable/Optional)
  dealId?: string;
  dealName?: string;
  projectId?: string;
  projectName?: string;
  
  // Invoice Details
  issueDate: Timestamp;
  dueDate: Timestamp;
  paidDate?: Timestamp;
  paymentTerms: PaymentTerms;
  currency: string; // e.g., "USD", "EUR"
  
  // Line Items & Calculations
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  taxRate: number; // Percentage
  discount: number; // Fixed amount
  total: number;
  
  // Additional Info
  notes?: string;
  terms?: string;
  customFields?: Record<string, string>;
  
  // Recurring Settings
  isRecurring?: boolean;
  recurring?: {
    frequency: "weekly" | "monthly" | "quarterly" | "yearly";
    interval: number;
    startDate: Timestamp;
    endDate?: Timestamp;
    lastGenerated?: Timestamp;
    nextGenerationDate?: Timestamp;
    status: "active" | "paused" | "ended";
  };

  // Compliance & Audit
  taxProfileId?: string;
  clientTaxId?: string;
  auditTrail?: {
    action: string;
    userId: string;
    userName: string;
    timestamp: Timestamp;
    details?: string;
  }[];

  // Metadata
  ownerId: string;
  ownerName?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sentAt?: Timestamp;
  voidedAt?: Timestamp;
}

// Notification Types
export type NotificationType = 
  | "deal_won" 
  | "deal_lost" 
  | "task_assigned" 
  | "task_due" 
  | "invoice_paid" 
  | "invoice_overdue"
  | "project_completed"
  | "mention";

export interface Notification {
  id: string;
  organizationId: string; // multi-tenant scope
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: "lead" | "contact" | "deal" | "company" | "project" | "task" | "invoice";
  entityId: string;
  read: boolean;
  createdAt: Timestamp;
}

// ============================================================
// NEW ENTITY TYPES — Notes & Quotes
// ============================================================

export interface Note {
  id: string;
  organizationId: string;
  content: string; // rich text / markdown
  ownerId: string;
  ownerName?: string;
  relatedTo?: {
    type: "lead" | "contact" | "deal" | "company" | "project";
    id: string;
    name: string;
  };
  isPinned?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type QuoteStatus = "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired";

export interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  taxRate: number;
  total: number;
}

export interface Quote {
  id: string;
  organizationId: string;
  quoteNumber: string;
  status: QuoteStatus;
  companyId?: string;
  companyName?: string;
  contactId?: string;
  contactName?: string;
  dealId?: string;
  issueDate: Timestamp;
  expiryDate?: Timestamp;
  lineItems: QuoteLineItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes?: string;
  terms?: string;
  ownerId: string;
  ownerName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Form Input Types (without Firestore-specific fields)
export type LeadInput = Omit<Lead, "id" | "organizationId" | "createdAt" | "updatedAt" | "ownerId" | "ownerName">;
export type ContactInput = Omit<Contact, "id" | "organizationId" | "createdAt" | "updatedAt" | "ownerId" | "ownerName">;
export type CompanyInput = Omit<Company, "id" | "organizationId" | "createdAt" | "updatedAt" | "ownerId" | "ownerName">;
export type DealInput = Omit<Deal, "id" | "organizationId" | "createdAt" | "updatedAt" | "ownerId" | "ownerName">;
export type ProjectInput = Omit<Project, "id" | "organizationId" | "createdAt" | "updatedAt" | "ownerId" | "ownerName">;
export type TaskInput = Omit<Task, "id" | "organizationId" | "createdAt" | "updatedAt" | "ownerId" | "ownerName" | "completedAt">;
export type InvoiceInput = Omit<Invoice, "id" | "organizationId" | "createdAt" | "updatedAt" | "ownerId" | "ownerName" | "paidDate">;


// Filter Types
export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  ownerId?: string;
  search?: string;
}

export interface ContactFilters {
  companyId?: string;
  ownerId?: string;
  search?: string;
}

export interface CompanyFilters {
  industry?: string;
  size?: CompanySize;
  ownerId?: string;
  search?: string;
}

export interface DealFilters {
  stage?: DealStage;
  ownerId?: string;
  companyId?: string;
  search?: string;
  minValue?: number;
  maxValue?: number;
  archived?: boolean;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  priority?: ProjectPriority;
  ownerId?: string;
  companyId?: string;
  dealId?: string;
  search?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  archived?: boolean;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  assigneeId?: string;
  projectId?: string;
  contactId?: string;
  leadId?: string;
  ownerId?: string;
  search?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  // New filter parameters
  userId?: string; // Current user ID for userRole filtering
  userRole?: "all" | "assigned" | "created" | "associated";
  priorities?: TaskPriority[];
  statuses?: TaskStatus[];
  isArchived?: boolean;
}

// Pagination
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


