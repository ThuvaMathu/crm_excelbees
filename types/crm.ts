import { Timestamp } from "firebase/firestore";

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

  // Premium / Marketing AI Modules
  marketingAI: FeatureToggle;
  competitorAnalysis: FeatureToggle;
  keywordResearch: FeatureToggle;
  blogWriter: FeatureToggle;
  emailCampaigns: FeatureToggle;
  marketingCalendar: FeatureToggle;
  seoAnalyzer: FeatureToggle;
  aiCopilot: FeatureToggle;

  // Admin Module
  userManagement: FeatureToggle;

  // HR / Employee Management Module
  hr: {
    employees: ModulePermission;   // Directory access
    attendance: ModulePermission;  // Time tracking
    leaves: ModulePermission;      // Leave management
    payroll: ModulePermission;     // Salary info
  };
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

    // Marketing AI - All Enabled
    marketingAI: { enabled: true },
    competitorAnalysis: { enabled: true },
    keywordResearch: { enabled: true },
    blogWriter: { enabled: true },
    emailCampaigns: { enabled: true },
    marketingCalendar: { enabled: true },
    seoAnalyzer: { enabled: true },
    aiCopilot: { enabled: true },

    // Admin
    userManagement: { enabled: true },

    // HR - Full Access
    hr: {
      employees: { read: true, create: true, edit: true, delete: true, editAll: true },
      attendance: { read: true, create: true, edit: true, delete: true, editAll: true },
      leaves: { read: true, create: true, edit: true, delete: true, editAll: true },
      payroll: { read: true, create: true, edit: true, delete: true, editAll: true },
    },
  },
  manager: {
    // CRM Core - Read All, Edit All (except delete some)
    leads: { read: true, create: true, edit: true, delete: true, editAll: true },
    contacts: { read: true, create: true, edit: true, delete: true, editAll: true },
    companies: { read: true, create: true, edit: true, delete: true, editAll: true },
    deals: { read: true, create: true, edit: true, delete: true, editAll: true },
    projects: { read: true, create: true, edit: true, delete: true, editAll: true },
    tasks: { read: true, create: true, edit: true, delete: false, editAll: false },
    invoices: { read: true, create: true, edit: true, delete: false, editAll: true },
    reports: { read: true, create: false, edit: false, delete: false, editAll: true },

    // Marketing AI - Enabled
    marketingAI: { enabled: true },
    competitorAnalysis: { enabled: true },
    keywordResearch: { enabled: true },
    blogWriter: { enabled: true },
    emailCampaigns: { enabled: true },
    marketingCalendar: { enabled: true },
    seoAnalyzer: { enabled: true },
    aiCopilot: { enabled: true },

    // Admin - View Only
    userManagement: { enabled: false },

    // HR - Manager can manage team, view all employees
    hr: {
      employees: { read: true, create: false, edit: false, delete: false, editAll: false },
      attendance: { read: true, create: true, edit: false, delete: false, editAll: false },
      leaves: { read: true, create: true, edit: true, delete: false, editAll: false },
      payroll: { read: true, create: false, edit: false, delete: false, editAll: false },
    },
  },
  team: {
    // CRM Core - Own Records Only
    leads: { read: true, create: true, edit: true, delete: false, editAll: false },
    contacts: { read: true, create: true, edit: true, delete: false, editAll: false },
    companies: { read: true, create: false, edit: false, delete: false, editAll: false },
    deals: { read: true, create: true, edit: true, delete: false, editAll: false },
    projects: { read: true, create: false, edit: false, delete: false, editAll: false },
    tasks: { read: true, create: true, edit: true, delete: false, editAll: false },
    invoices: { read: false, create: false, edit: false, delete: false, editAll: false },
    reports: { read: false, create: false, edit: false, delete: false, editAll: false },

    // Marketing AI - Disabled by Default (toggleable)
    marketingAI: { enabled: false },
    competitorAnalysis: { enabled: false },
    keywordResearch: { enabled: false },
    blogWriter: { enabled: false },
    emailCampaigns: { enabled: false },
    marketingCalendar: { enabled: false },
    seoAnalyzer: { enabled: false },
    aiCopilot: { enabled: false },

    // Admin - No Access
    userManagement: { enabled: false },

    // HR - Basic employee access
    hr: {
      employees: { read: true, create: false, edit: false, delete: false, editAll: false },
      attendance: { read: true, create: true, edit: false, delete: false, editAll: false },
      leaves: { read: true, create: true, edit: false, delete: false, editAll: false },
      payroll: { read: true, create: false, edit: false, delete: false, editAll: false },
    },
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
  | "login_failed";

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
  invoiceSettings?: InvoiceUserSettings;
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
  employeeId?: string;
  role: UserRole;
  isFirstLogin: boolean;
  isActive: boolean;
  status: UserStatus;
  createdAt: Timestamp;
  createdBy: string;
  lastLoginAt: Timestamp;
  passwordChangedAt?: Timestamp;
  updatedAt?: Timestamp;
  provider?: "password" | "google.com";
  permissions?: UserPermissions;
  invoiceSettings?: InvoiceUserSettings;
  documents?: any[];
  settings?: {
    theme?: "light" | "dark" | "system";
    notifications?: boolean;
    defaultCurrency?: string;
  };
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
  leadId?: string;
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

// ============================================================
// HR / EMPLOYEE MANAGEMENT TYPES
// ============================================================

export type EmploymentType = "Full-Time" | "Part-Time" | "Contract" | "Intern";
export type OnboardingStatus = "Pending" | "In Progress" | "Completed";
export type AttendanceStatus = "Present" | "Absent" | "Half-Day" | "Late";
export type LeaveType = "Sick" | "Vacation" | "Personal" | "Unpaid";
export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";
export type PayrollStatus = "Draft" | "Processing" | "Paid";

// Employee Profile - Extends base user with HR-specific info
export interface EmployeeProfile {
  id: string;                  // Firestore Document ID (primary key)
  userId?: string | null;      // Links to users/{uid} - null if no CRM access
  hasCRMAccess?: boolean;      // Whether employee has CRM access
  email: string;               // Employee email
  firstName: string;           // First name
  lastName: string;            // Last name
  displayName: string;         // Full name for display
  photoURL?: string;           // Profile photo

  // HR Details
  department: string;          // e.g., "Sales", "Engineering", "HR"
  jobTitle: string;            // e.g., "Senior Developer"
  startDate: Timestamp;        // Date of joining
  employmentType: EmploymentType;
  reportsTo?: string;          // UID of the manager

  // Personal Info (Access Restricted)
  phone?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  // Documents
  documents?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Timestamp;
  }[];

  // Leave Balance
  leaveBalance?: {
    vacation: number;
    sick: number;
    personal: number;
    usedVacation?: number;
    usedSick?: number;
    usedPersonal?: number;
  };

  // Salary Info (Basic)
  salary?: {
    baseSalary: number;
    currency: string;
    payFrequency: "monthly" | "bi-weekly" | "hourly";
  };

  // System Metadata
  onboardingStatus: OnboardingStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type EmployeeProfileInput = Omit<EmployeeProfile, "id" | "createdAt" | "updatedAt"> & {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

// Attendance Record
export interface AttendanceRecord {
  id: string;
  userId: string;              // Employee UID
  userName: string;            // Snapshot for display
  date: string;                // YYYY-MM-DD (Query index)

  clockIn: Timestamp;
  clockOut?: Timestamp;
  breakStart?: Timestamp;
  breakEnd?: Timestamp;

  totalHours: number;          // Calculated on clock out (hours)
  status: AttendanceStatus;
  notes?: string;              // "Forgot to clock out", etc.

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Leave Request
export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  department?: string;         // Snapshot for filtering

  type: LeaveType;
  startDate: string;           // YYYY-MM-DD
  endDate: string;             // YYYY-MM-DD
  daysCount: number;           // 1, 2, 0.5, etc.
  reason?: string;

  status: LeaveStatus;
  managerId?: string;          // Who approved/rejected (from reportsTo or Admin)
  managerName?: string;
  approvedAt?: Timestamp;
  rejectionReason?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Payroll Record
export interface PayrollRecord {
  id: string;
  userId: string;
  userName: string;

  periodStart: string;         // YYYY-MM-DD
  periodEnd: string;           // YYYY-MM-DD
  payoutDate: string;          // YYYY-MM-DD

  baseSalary: number;          // Monthly/Bi-weekly gross
  currency: string;            // "USD"

  // Simple structure - No complex tax engine yet
  additions?: { description: string; amount: number }[]; // Bonuses
  deductions?: { description: string; amount: number }[]; // Tax/Insurance

  netSalary: number;           // Base + Additions - Deductions
  status: PayrollStatus;

  payslipUrl?: string;         // Link to generated PDF in Storage
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Input Types (without Firestore fields)

export type LeaveRequestInput = Omit<LeaveRequest, "id" | "createdAt" | "updatedAt" | "status" | "managerId" | "managerName" | "approvedAt" | "rejectionReason">;
