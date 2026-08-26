import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, limit, Timestamp, QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";
import { redis } from "../redis";
import { hasPermission, canEditRecord } from "../auth/permission-utils";
import { leadSchema } from "../validations/lead";
import { sanitizeData } from "./utils";
import type { Lead, LeadInput, LeadFilters, PaginationParams } from "@/types/crm";

const COLLECTION_NAME = "leads";

function orgCacheKey(orgId: string, suffix: string) { return `leads:${orgId}:${suffix}`; }
function cacheKey(orgId: string | undefined, suffix: string) {
  return orgId ? orgCacheKey(orgId, suffix) : "leads:list:all";
}

// Create a new lead
export async function createLead(data: LeadInput, userId: string, organizationId: string) {
  try {
    if (!organizationId) {
      return { success: false, id: null, error: "organizationId is required to create a lead" };
    }
    const permCheck = await hasPermission(userId, organizationId, "leads", "create");
    if (!permCheck.allowed) {
      return { success: false, id: null, error: permCheck.reason || "You do not have permission to create leads" };
    }
    const parsed = leadSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, id: null, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }

    const leadData: any = { ...data, organizationId, ownerId: userId, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
    // Normalize the empty-string form value (allowed by the schema for a
    // blank input) to `undefined` so Firestore never stores a string in a
    // numeric field.
    if (leadData.value === "") delete leadData.value;
    const docRef = await addDoc(collection(db, COLLECTION_NAME), sanitizeData(leadData));
    await redis.del(orgCacheKey(organizationId, "list:all"));
    if (userId) await redis.del(`dashboard:stats:${organizationId}:${userId}`);
    return { success: true, id: docRef.id, error: null };
  } catch (error: any) {
    return { success: false, id: null, error: error.message };
  }
}

// Get all leads with optional filters
export async function getLeads(organizationId?: string | LeadFilters, filters?: LeadFilters, pagination?: PaginationParams) {
  if (typeof organizationId === "object") { filters = organizationId as any; organizationId = undefined; }
  try {
    const hasOnlyClientFilters = !filters?.ownerId;
    const key = cacheKey(organizationId, "list:all");
    let leads: Lead[] = [];

    if (hasOnlyClientFilters) {
      const cached = await redis.get<Lead[]>(key);
      if (cached) {
        leads = cached.map((l: any) => ({
          ...l,
          createdAt: l.createdAt ? new Timestamp(l.createdAt.seconds || 0, l.createdAt.nanoseconds || 0) : null,
          updatedAt: l.updatedAt ? new Timestamp(l.updatedAt.seconds || 0, l.updatedAt.nanoseconds || 0) : null,
          lastContactedAt: l.lastContactedAt ? new Timestamp(l.lastContactedAt.seconds || 0, l.lastContactedAt.nanoseconds || 0) : null,
          aiLastUpdated: l.aiLastUpdated ? new Timestamp(l.aiLastUpdated.seconds || 0, l.aiLastUpdated.nanoseconds || 0) : null,
        }));
      }
    }

    if (leads.length === 0) {
      const constraints: QueryConstraint[] = [];
      if (organizationId) constraints.push(where("organizationId", "==", organizationId));
      if (filters?.ownerId) constraints.push(where("ownerId", "==", filters.ownerId));
      // No orderBy here — requires composite index that may not exist.
      // Client-side sort runs below instead.

      const q = constraints.length > 0 ? query(collection(db, COLLECTION_NAME), ...constraints) : collection(db, COLLECTION_NAME);
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isDeleted) return;
        leads.push({ id: doc.id, ...data } as Lead);
      });
      // The comment above claimed "client-side sort runs below instead" of
      // a Firestore orderBy, but no such sort ever existed — leads came
      // back in whatever arbitrary order Firestore's query returned them
      // in, so newest-first assumptions elsewhere (e.g. "the lead I just
      // created is the first row") didn't actually hold.
      leads.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      if (leads.length > 0 && hasOnlyClientFilters) await redis.set(key, leads, { ex: 300 });
    }

    let filtered = leads;
    if (filters?.status) filtered = filtered.filter((l) => l.status === filters.status);
    if (filters?.source) filtered = filtered.filter((l) => l.source === filters.source);
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter((l) =>
        l.firstName?.toLowerCase().includes(s) || l.lastName?.toLowerCase().includes(s) ||
        `${l.firstName ?? ""} ${l.lastName ?? ""}`.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s) || l.companyName?.toLowerCase().includes(s) ||
        l.phone?.toLowerCase().includes(s) || l.jobTitle?.toLowerCase().includes(s)
      );
    }
    const totalCount = filtered.length;
    if (pagination) {
      const start = (pagination.page - 1) * pagination.pageSize;
      filtered = filtered.slice(start, start + pagination.pageSize);
    }
    return { leads: filtered, total: totalCount, error: null };
  } catch (error: any) {
    return { leads: [], total: 0, error: error.message };
  }
}

export async function getLead(id: string) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && !docSnap.data().isDeleted) return { lead: { id: docSnap.id, ...docSnap.data() } as Lead, error: null };
    return { lead: null, error: "Lead not found" };
  } catch (error: any) { return { lead: null, error: error.message }; }
}

export async function updateLead(id: string, data: Partial<LeadInput>, userId: string) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Lead not found" };
    const existing = docSnap.data();
    const permCheck = await canEditRecord(userId, existing.organizationId, "leads", existing.ownerId);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to edit this lead" };
    }
    await updateDoc(docRef, sanitizeData({ ...data, updatedAt: Timestamp.now() }));
    if (existing.organizationId) await redis.del(orgCacheKey(existing.organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

// Soft delete: marks the lead as deleted rather than removing the
// document, preserving referential integrity and allowing recovery.
export async function deleteLead(id: string, userId: string) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Lead not found" };
    const existing = docSnap.data();
    const permCheck = await hasPermission(userId, existing.organizationId, "leads", "delete");
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to delete this lead" };
    }
    const orgId = existing.organizationId;
    await updateDoc(docRef, { isDeleted: true, deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
    if (orgId) await redis.del(orgCacheKey(orgId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function getLeadsByOwner(organizationId: string | undefined, ownerId: string) {
  try {
    const constraints: QueryConstraint[] = [where("ownerId", "==", ownerId)];
    if (organizationId) constraints.push(where("organizationId", "==", organizationId));
    constraints.push(orderBy("createdAt", "desc"));
    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);
    const leads: Lead[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isDeleted) return;
      leads.push({ id: doc.id, ...data } as Lead);
    });
    return { leads, error: null };
  } catch (error: any) { return { leads: [], error: error.message }; }
}

// Convert lead to contact
export async function convertLeadToContact(leadId: string, userId: string, userName: string, organizationId: string) {
  try {
    if (!organizationId) return { success: false, contactId: null, error: "organizationId is required to convert a lead" };
    const leadResult = await getLead(leadId);
    if (leadResult.error || !leadResult.lead) return { success: false, contactId: null, error: leadResult.error || "Lead not found" };
    const lead = leadResult.lead;
    if (lead.converted) return { success: false, contactId: lead.convertedToContactId || null, error: "Lead has already been converted to a contact" };

    const permCheck = await hasPermission(userId, organizationId, "leads", "edit");
    if (!permCheck.allowed) return { success: false, contactId: null, error: permCheck.reason || "You do not have permission to convert leads" };

    const { getOrganizationMember } = await import("./organizations");
    const { member } = await getOrganizationMember(organizationId, userId);
    const userRole = member?.role || "team";

    if (userRole === "team" && lead.ownerId !== userId) {
      return { success: false, contactId: null, error: "You can only convert leads you own" };
    }

    const { createContact } = await import("./contacts");
    const contactData = {
      firstName: lead.firstName, lastName: lead.lastName, email: lead.email,
      ...(lead.phone && { phone: lead.phone }),
      ...(lead.companyName && { companyName: lead.companyName }),
      ...(lead.jobTitle && { jobTitle: lead.jobTitle }),
      ...(lead.notes && { notes: lead.notes }),
      ...(lead.lastContactedAt && { lastContactedAt: lead.lastContactedAt }),
    };
    const contactResult = await createContact(contactData, userId, organizationId);
    if (!contactResult.success || !contactResult.id) return { success: false, contactId: null, error: contactResult.error || "Failed to create contact" };
    const contactId = contactResult.id;

    const leadDocRef = doc(db, COLLECTION_NAME, leadId);
    await updateDoc(leadDocRef, { converted: true, convertedToContactId: contactId, convertedAt: Timestamp.now(), updatedAt: Timestamp.now() });

    const { createActivity } = await import("./activities");
    const orgId = organizationId;
    await createActivity({ type: "log", content: `Lead converted to contact by ${userName}`, performedBy: userId, performedByName: userName, organizationId: orgId, relatedTo: { collection: "leads", id: leadId }, metadata: { contactId, action: "convert_to_contact" } });
    await createActivity({ type: "created", content: `Contact created from lead conversion by ${userName}`, performedBy: userId, performedByName: userName, organizationId: orgId, relatedTo: { collection: "contacts", id: contactId }, metadata: { leadId, action: "converted_from_lead" } });

    if (orgId) { await redis.del(orgCacheKey(orgId, "list:all")); await redis.del(`contacts:${orgId}:list:all`); if (userId) await redis.del(`dashboard:stats:${orgId}:${userId}`); }
    return { success: true, contactId, error: null };
  } catch (error: any) { return { success: false, contactId: null, error: error.message }; }
}

// Convert lead to deal
export async function convertLeadToDeal(leadId: string, userId: string, userName: string, organizationId: string) {
  try {
    if (!organizationId) return { success: false, dealId: null, error: "organizationId is required to convert a lead" };
    const leadResult = await getLead(leadId);
    if (leadResult.error || !leadResult.lead) return { success: false, dealId: null, error: leadResult.error || "Lead not found" };
    const lead = leadResult.lead;
    if (lead.convertedToDealId) return { success: false, dealId: lead.convertedToDealId, error: "Lead has already been converted to a deal" };

    const permCheck = await hasPermission(userId, organizationId, "leads", "edit");
    if (!permCheck.allowed) return { success: false, dealId: null, error: permCheck.reason || "You do not have permission to convert leads" };

    const { getOrganizationMember } = await import("./organizations");
    const { member } = await getOrganizationMember(organizationId, userId);
    const userRole = member?.role || "team";

    if (userRole === "team" && lead.ownerId !== userId) {
      return { success: false, dealId: null, error: "You can only convert leads you own" };
    }

    const { createDeal } = await import("./deals");
    const dealData = {
      title: `${lead.companyName || lead.lastName + "'s"} Deal`, value: lead.value || 0, stage: "Pipeline" as const,
      probability: 10, description: `Converted from lead: ${lead.firstName} ${lead.lastName}. Notes: ${lead.notes || ""}`,
      companyName: lead.companyName || undefined, contactIds: [],
    };
    const dealResult = await createDeal(dealData, userId, organizationId);
    if (!dealResult.success || !dealResult.id) return { success: false, dealId: null, error: dealResult.error || "Failed to create deal" };
    const dealId = dealResult.id;

    const leadDocRef = doc(db, COLLECTION_NAME, leadId);
    await updateDoc(leadDocRef, { converted: true, convertedToDealId: dealId, convertedAt: Timestamp.now(), updatedAt: Timestamp.now() });

    const { createActivity } = await import("./activities");
    const orgId = organizationId;
    await createActivity({ type: "log", content: `Lead converted to deal by ${userName}`, performedBy: userId, performedByName: userName, organizationId: orgId, relatedTo: { collection: "leads", id: leadId }, metadata: { dealId, action: "convert_to_deal" } });
    await createActivity({ type: "created", content: `Deal created from lead conversion by ${userName}`, performedBy: userId, performedByName: userName, organizationId: orgId, relatedTo: { collection: "deals", id: dealId }, metadata: { leadId, action: "converted_from_lead" } });

    if (orgId) { await redis.del(orgCacheKey(orgId, "list:all")); await redis.del(`deals:${orgId}:list:all`); if (userId) await redis.del(`dashboard:stats:${orgId}:${userId}`); }
    return { success: true, dealId, error: null };
  } catch (error: any) { return { success: false, dealId: null, error: error.message }; }
}

// Convert lead to project
export async function convertLeadToProject(leadId: string, userId: string, userName: string, organizationId: string) {
  try {
    if (!organizationId) return { success: false, projectId: null, error: "organizationId is required to convert a lead" };
    const leadResult = await getLead(leadId);
    if (leadResult.error || !leadResult.lead) return { success: false, projectId: null, error: leadResult.error || "Lead not found" };
    const lead = leadResult.lead;
    if (lead.convertedToProjectId) return { success: false, projectId: lead.convertedToProjectId, error: "Lead has already been converted to a project" };

    const permCheck = await hasPermission(userId, organizationId, "leads", "edit");
    if (!permCheck.allowed) return { success: false, projectId: null, error: permCheck.reason || "You do not have permission to convert leads" };

    const { getOrganizationMember } = await import("./organizations");
    const { member } = await getOrganizationMember(organizationId, userId);
    const userRole = member?.role || "team";

    if (userRole === "team" && lead.ownerId !== userId) {
      return { success: false, projectId: null, error: "You can only convert leads you own" };
    }

    const { createProject } = await import("./projects");
    const projectData = {
      name: `Project for ${lead.companyName || lead.lastName}`,
      description: `Converted from lead: ${lead.firstName} ${lead.lastName}. ${lead.notes || ""}`,
      scope: `Project created from lead conversion: ${lead.firstName} ${lead.lastName}`,
      status: "Planning" as const, priority: "Medium" as const, budget: lead.value || 0,
      startDate: Timestamp.now(), lifecycle: "active" as const, companyName: lead.companyName || undefined,
      phases: [{ id: crypto.randomUUID(), name: "Initial Phase", progress: 0, order: 0 }],
      tags: [], teamMembers: [userId], progress: 0,
    };
    const projectResult = await createProject(projectData, userId, organizationId);
    if (!projectResult.success || !projectResult.id) return { success: false, projectId: null, error: projectResult.error || "Failed to create project" };
    const projectId = projectResult.id;

    const leadDocRef = doc(db, COLLECTION_NAME, leadId);
    await updateDoc(leadDocRef, { converted: true, convertedToProjectId: projectId, convertedAt: Timestamp.now(), updatedAt: Timestamp.now() });

    const { createActivity } = await import("./activities");
    const orgId = organizationId;
    await createActivity({ type: "log", content: `Lead converted to project by ${userName}`, performedBy: userId, performedByName: userName, organizationId: orgId, relatedTo: { collection: "leads", id: leadId }, metadata: { projectId, action: "convert_to_project" } });
    await createActivity({ type: "created", content: `Project created from lead conversion by ${userName}`, performedBy: userId, performedByName: userName, organizationId: orgId, relatedTo: { collection: "projects", id: projectId }, metadata: { leadId, action: "converted_from_lead" } });

    if (orgId) { await redis.del(orgCacheKey(orgId, "list:all")); await redis.del(`projects:${orgId}:list:all`); if (userId) await redis.del(`dashboard:stats:${orgId}:${userId}`); }
    return { success: true, projectId, error: null };
  } catch (error: any) { return { success: false, projectId: null, error: error.message }; }
}
