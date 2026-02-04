import { Timestamp } from "firebase/firestore";

// User Types
export type UserRole = "admin" | "manager" | "team";

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: UserRole;
  invoiceSettings?: InvoiceUserSettings;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Lead Types
export type LeadStatus = "New" | "Contacted" | "Follow Up" | "Qualified" | "Lost";
export type LeadSource = "Website" | "Referral" | "Ads" | "Cold Call" | "Other";

export interface Lead {
  id: string;
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
export type ManagementBillingCycle = "Quarterly" | "Semi-Annual" | "None";

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
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
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
  ownerId: string;
  ownerName?: string;
  progress: number; // 0-100
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Task Types
export type TaskStatus = "To Do" | "In Progress" | "Review" | "Done";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";
export type TaskType = "To Do" | "Call" | "Email" | "Meeting";

export interface Task {
  id: string;
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
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

// Invoice Types
export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled";
export type PaymentTerms = "Net 15" | "Net 30" | "Net 60" | "Due on Receipt" | "Custom";
export type InvoiceTemplate = "standard" | "professional" | "creative";
export type InvoiceColorTheme = string; // Hex color code (e.g., "#3B82F6")

export interface InvoiceUserSettings {
  template: InvoiceTemplate;
  companyName: string;
  fromName: string;
  fromEmail: string;
  logoUrl?: string;
  colorTheme: InvoiceColorTheme; // Hex color
  invoicePrefix: string; // e.g., "INV-", "EB-"
  nextInvoiceNumber: number; // Auto-incrementing counter
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  taxRate: number; // Percentage (e.g., 10 for 10%)
  total: number; // Auto-calculated
}

export interface Invoice {
  id: string;
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
    interval: number; // e.g. every 2 weeks
    startDate: Timestamp;
    endDate?: Timestamp;
    lastGenerated?: Timestamp;
    nextGenerationDate?: Timestamp;
    status: "active" | "paused" | "ended";
  };

  // Compliance & Audit
  taxProfileId?: string; // For linking to global tax configurations
  clientTaxId?: string; // VAT/GST
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
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: "lead" | "contact" | "deal" | "company" | "project" | "task" | "invoice";
  entityId: string;
  read: boolean;
  createdAt: Timestamp;
}

// Form Input Types (without Firestore-specific fields)
export type LeadInput = Omit<Lead, "id" | "createdAt" | "updatedAt" | "ownerId" | "ownerName">;
export type ContactInput = Omit<Contact, "id" | "createdAt" | "updatedAt" | "ownerId" | "ownerName">;
export type CompanyInput = Omit<Company, "id" | "createdAt" | "updatedAt" | "ownerId" | "ownerName">;
export type DealInput = Omit<Deal, "id" | "createdAt" | "updatedAt" | "ownerId" | "ownerName">;
export type ProjectInput = Omit<Project, "id" | "createdAt" | "updatedAt" | "ownerId" | "ownerName">;
export type TaskInput = Omit<Task, "id" | "createdAt" | "updatedAt" | "ownerId" | "ownerName" | "completedAt">;
export type InvoiceInput = Omit<Invoice, "id" | "createdAt" | "updatedAt" | "ownerId" | "ownerName" | "paidDate">;

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
  ownerId?: string;
  search?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
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
