import { Timestamp } from "firebase/firestore";

// Lead Types
export type LeadStatus = "New" | "Contacted" | "Follow Up" | "Qualified" | "Lost";
export type LeadSource = "Website" | "Referral" | "Ads" | "Cold Call" | "Other";

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  status: LeadStatus;
  source: LeadSource;
  value?: number;
  ownerId: string;
  ownerName?: string;
  tags: string[];
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Contact Types
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyId?: string;
  companyName?: string;
  ownerId: string;
  ownerName?: string;
  jobTitle?: string;
  lastContactedAt?: Timestamp;
  notes?: string;
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
}

// Activity Types
export type ActivityType = "note" | "email" | "call" | "log" | "status_change";

export interface Activity {
  id: string;
  type: ActivityType;
  content: string;
  performedBy: string;
  performedByName?: string;
  relatedTo: {
    collection: "leads" | "contacts" | "companies" | "deals";
    id: string;
  };
  metadata?: Record<string, any>;
  createdAt: Timestamp;
}

// Form Input Types (without Firestore-specific fields)
export type LeadInput = Omit<Lead, "id" | "createdAt" | "updatedAt" | "ownerName" | "ownerId">;
export type ContactInput = Omit<Contact, "id" | "createdAt" | "updatedAt" | "ownerName" | "companyName" | "ownerId">;
export type CompanyInput = Omit<Company, "id" | "createdAt" | "updatedAt" | "ownerName" | "ownerId">;
export type DealInput = Omit<Deal, "id" | "createdAt" | "updatedAt" | "ownerName" | "companyName" | "ownerId">;

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
