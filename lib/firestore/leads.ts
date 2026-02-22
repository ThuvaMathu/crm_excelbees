import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";
import { redis } from "../redis";
import type { Lead, LeadInput, LeadFilters, PaginationParams } from "@/types/crm";

const COLLECTION_NAME = "leads";

// Create a new lead
export async function createLead(data: LeadInput, userId: string) {
  console.log("📝 Creating lead:", data.email, "for user:", userId);
  try {
    const leadData = {
      ...data,
      ownerId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), leadData);
    console.log("✅ Lead created with ID:", docRef.id);

    // Invalidate cache
    await redis.del("leads:list:all");
    if (userId) {
      await redis.del(`dashboard:stats:${userId}`);
    }

    return {
      success: true,
      id: docRef.id,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to create lead:", error.message);
    return {
      success: false,
      id: null,
      error: error.message,
    };
  }
}

// Get all leads with optional filters
export async function getLeads(
  filters?: LeadFilters,
  pagination?: PaginationParams
) {
  console.log("📋 Fetching leads with filters:", filters);
  try {
    // Check if we only have client-side filters (search, status, source)
    // If so, fetch all leads and filter client-side to avoid composite index issues
    const hasOnlyClientFilters = !filters?.ownerId;

    const cacheKey = "leads:list:all";

    let leads: Lead[] = [];

    // Try cache first for all requests (we filter client-side anyway)
    if (hasOnlyClientFilters) {
      const cached = await redis.get<Lead[]>(cacheKey);
      if (cached) {
        console.log("⚡ HIT: Leads list from Redis");
        leads = cached.map((l: any) => ({
          ...l,
          createdAt: l.createdAt ? new Timestamp(l.createdAt.seconds || 0, l.createdAt.nanoseconds || 0) : null,
          updatedAt: l.updatedAt ? new Timestamp(l.updatedAt.seconds || 0, l.updatedAt.nanoseconds || 0) : null,
          lastContactedAt: l.lastContactedAt ? new Timestamp(l.lastContactedAt.seconds || 0, l.lastContactedAt.nanoseconds || 0) : null,
          aiLastUpdated: l.aiLastUpdated ? new Timestamp(l.aiLastUpdated.seconds || 0, l.aiLastUpdated.nanoseconds || 0) : null,
        }));
      }
    }

    // If no cached data, fetch from Firestore
    if (leads.length === 0) {
      const constraints: QueryConstraint[] = [];

      // Only add ownerId filter at Firestore level (simple single-field query)
      if (filters?.ownerId) {
        constraints.push(where("ownerId", "==", filters.ownerId));
      }

      // Add ordering
      constraints.push(orderBy("createdAt", "desc"));

      const q = query(collection(db, COLLECTION_NAME), ...constraints);
      const querySnapshot = await getDocs(q);
      console.log("📊 Leads fetched from Firestore:", querySnapshot.size);

      querySnapshot.forEach((doc) => {
        leads.push({ id: doc.id, ...doc.data() } as Lead);
      });

      // Cache the full unfiltered result
      if (leads.length > 0 && hasOnlyClientFilters) {
        await redis.set(cacheKey, leads, { ex: 300 });
      }
    }

    // Apply all filters client-side
    let filteredLeads = leads;

    // Status filter
    if (filters?.status) {
      filteredLeads = filteredLeads.filter(
        (lead) => lead.status === filters.status
      );
      console.log("🔍 After status filter:", filteredLeads.length, "leads");
    }

    // Source filter
    if (filters?.source) {
      filteredLeads = filteredLeads.filter(
        (lead) => lead.source === filters.source
      );
      console.log("🔍 After source filter:", filteredLeads.length, "leads");
    }

    // Search filter
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredLeads = filteredLeads.filter(
        (lead) =>
          lead.firstName?.toLowerCase().includes(searchLower) ||
          lead.lastName?.toLowerCase().includes(searchLower) ||
          `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.companyName?.toLowerCase().includes(searchLower) ||
          lead.phone?.toLowerCase().includes(searchLower) ||
          lead.jobTitle?.toLowerCase().includes(searchLower)
      );
      console.log("🔍 After search filter:", filteredLeads.length, "leads");
    }

    // Apply pagination AFTER all filters
    const totalCount = filteredLeads.length;
    if (pagination) {
      const start = (pagination.page - 1) * pagination.pageSize;
      filteredLeads = filteredLeads.slice(start, start + pagination.pageSize);
    }

    console.log("✅ Returning", filteredLeads.length, "of", totalCount, "leads");
    return {
      leads: filteredLeads,
      total: totalCount,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to fetch leads:", error.message);
    return {
      leads: [],
      total: 0,
      error: error.message,
    };
  }
}

// Get a single lead by ID
export async function getLead(id: string) {
  console.log("🔍 Fetching lead:", id);
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("✅ Lead found:", id);
      return {
        lead: { id: docSnap.id, ...docSnap.data() } as Lead,
        error: null,
      };
    } else {
      console.warn("⚠️ Lead not found:", id);
      return {
        lead: null,
        error: "Lead not found",
      };
    }
  } catch (error: any) {
    console.error("❌ Failed to fetch lead:", error.message);
    return {
      lead: null,
      error: error.message,
    };
  }
}

// Update a lead
export async function updateLead(id: string, data: Partial<LeadInput>) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });

    // Invalidate cache
    await redis.del("leads:list:all");

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Delete a lead
export async function deleteLead(id: string) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    // Invalidate cache
    await redis.del("leads:list:all");

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Get leads by owner
export async function getLeadsByOwner(ownerId: string) {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("ownerId", "==", ownerId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const leads: Lead[] = [];

    querySnapshot.forEach((doc) => {
      leads.push({ id: doc.id, ...doc.data() } as Lead);
    });

    return {
      leads,
      error: null,
    };
  } catch (error: any) {
    return {
      leads: [],
      error: error.message,
    };
  }
}

// Convert lead to contact
export async function convertLeadToContact(leadId: string, userId: string, userName: string) {
  console.log("🔄 Converting lead to contact:", leadId);
  try {
    // 1. Get the lead
    const leadResult = await getLead(leadId);
    if (leadResult.error || !leadResult.lead) {
      return {
        success: false,
        contactId: null,
        error: leadResult.error || "Lead not found",
      };
    }

    const lead = leadResult.lead;

    // 2. Check if already converted
    if (lead.converted) {
      return {
        success: false,
        contactId: lead.convertedToContactId || null,
        error: "Lead has already been converted to a contact",
      };
    }

    // 3. Create contact from lead data
    const { createContact } = await import("./contacts");
    const contactData = {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone || null,
      companyName: lead.companyName || null,
      jobTitle: lead.jobTitle || null,
      notes: lead.notes || null,
      lastContactedAt: lead.lastContactedAt || null,
    };

    const contactResult = await createContact(contactData, userId);

    if (!contactResult.success || !contactResult.id) {
      return {
        success: false,
        contactId: null,
        error: contactResult.error || "Failed to create contact",
      };
    }

    const contactId = contactResult.id;
    console.log("✅ Contact created:", contactId);

    // 4. Update lead to mark as converted
    const leadDocRef = doc(db, COLLECTION_NAME, leadId);
    await updateDoc(leadDocRef, {
      converted: true,
      convertedToContactId: contactId,
      convertedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log("✅ Lead marked as converted");

    // 5. Log activity for the conversion
    const { createActivity } = await import("./activities");
    await createActivity({
      type: "log",
      content: `Lead converted to contact by ${userName}`,
      performedBy: userId,
      performedByName: userName,
      relatedTo: {
        collection: "leads",
        id: leadId,
      },
      metadata: {
        contactId,
        action: "convert_to_contact",
      },
    });

    // Also log on the contact side
    await createActivity({
      type: "created",
      content: `Contact created from lead conversion by ${userName}`,
      performedBy: userId,
      performedByName: userName,
      relatedTo: {
        collection: "contacts",
        id: contactId,
      },
      metadata: {
        leadId,
        action: "converted_from_lead",
      },
    });

    console.log("✅ Activities logged");

    // 6. Invalidate caches
    await redis.del("leads:list:all");
    await redis.del("contacts:list:all");
    if (userId) {
      await redis.del(`dashboard:stats:${userId}`);
    }

    return {
      success: true,
      contactId,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to convert lead:", error.message);
    return {
      success: false,
      contactId: null,
      error: error.message,
    };
  }
}

// Convert lead to deal
export async function convertLeadToDeal(leadId: string, userId: string, userName: string) {
  console.log("🔄 Converting lead to deal:", leadId);
  try {
    // 1. Get the lead
    const leadResult = await getLead(leadId);
    if (leadResult.error || !leadResult.lead) {
      return { success: false, dealId: null, error: leadResult.error || "Lead not found" };
    }
    const lead = leadResult.lead;

    // 2. Check if already converted to deal
    if (lead.convertedToDealId) {
      return { success: false, dealId: lead.convertedToDealId, error: "Lead has already been converted to a deal" };
    }

    // 3. Create deal from lead data
    const { createDeal } = await import("./deals");
    const dealData = {
      title: `${lead.companyName || lead.lastName + "'s"} Deal`,
      value: lead.value || 0,
      stage: "Pipeline" as const,
      probability: 10,
      description: `Converted from lead: ${lead.firstName} ${lead.lastName}. Notes: ${lead.notes || ""}`,
      companyName: lead.companyName || undefined,
      contactIds: [], // We might want to create a contact first, but for now empty
    };

    const dealResult = await createDeal(dealData, userId);

    if (!dealResult.success || !dealResult.id) {
      return { success: false, dealId: null, error: dealResult.error || "Failed to create deal" };
    }

    const dealId = dealResult.id;
    console.log("✅ Deal created:", dealId);

    // 4. Update lead
    const leadDocRef = doc(db, COLLECTION_NAME, leadId);
    await updateDoc(leadDocRef, {
      converted: true,
      convertedToDealId: dealId,
      convertedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // 5. Log activity
    const { createActivity } = await import("./activities");
    await createActivity({
      type: "log", // Start with log, or maybe 'deal_created'?
      content: `Lead converted to deal by ${userName}`,
      performedBy: userId,
      performedByName: userName,
      relatedTo: { collection: "leads", id: leadId },
      metadata: { dealId, action: "convert_to_deal" },
    });

    // Log on Deal side
    await createActivity({
      type: "created",
      content: `Deal created from lead conversion by ${userName}`,
      performedBy: userId,
      performedByName: userName,
      relatedTo: { collection: "deals", id: dealId },
      metadata: { leadId, action: "converted_from_lead" },
    });

    // 6. Invalidate caches
    await redis.del("leads:list:all");
    await redis.del("deals:list:all");
    if (userId) await redis.del(`dashboard:stats:${userId}`);

    return { success: true, dealId, error: null };
  } catch (error: any) {
    console.error("❌ Failed to convert lead to deal:", error.message);
    return { success: false, dealId: null, error: error.message };
  }
}

// Convert lead to project
export async function convertLeadToProject(leadId: string, userId: string, userName: string) {
  console.log("🔄 Converting lead to project:", leadId);
  try {
    // 1. Get the lead
    const leadResult = await getLead(leadId);
    if (leadResult.error || !leadResult.lead) {
      return { success: false, projectId: null, error: leadResult.error || "Lead not found" };
    }
    const lead = leadResult.lead;

    // 2. Check if already converted to project
    if (lead.convertedToProjectId) {
      return { success: false, projectId: lead.convertedToProjectId, error: "Lead has already been converted to a project" };
    }

    // 3. Create project from lead data
    const { createProject } = await import("./projects");
    const projectData = {
      name: `Project for ${lead.companyName || lead.lastName}`,
      description: `Converted from lead: ${lead.firstName} ${lead.lastName}. ${lead.notes || ""}`,
      status: "Planning" as const,
      priority: "Medium" as const,
      budget: lead.value || 0,
      startDate: Timestamp.now(),
      clientId: "", // Empty for now, ideally linked to a Client/Contact
      companyName: lead.companyName || undefined,
      tags: [],
      teamMembers: [userId],
      progress: 0,
    };

    const projectResult = await createProject(projectData, userId);

    if (!projectResult.success || !projectResult.id) {
      return { success: false, projectId: null, error: projectResult.error || "Failed to create project" };
    }

    const projectId = projectResult.id;
    console.log("✅ Project created:", projectId);

    // 4. Update lead
    const leadDocRef = doc(db, COLLECTION_NAME, leadId);
    await updateDoc(leadDocRef, {
      converted: true,
      convertedToProjectId: projectId,
      convertedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // 5. Log activity
    const { createActivity } = await import("./activities");
    await createActivity({
      type: "log",
      content: `Lead converted to project by ${userName}`,
      performedBy: userId,
      performedByName: userName,
      relatedTo: { collection: "leads", id: leadId },
      metadata: { projectId, action: "convert_to_project" },
    });

    // Log on Project side
    await createActivity({
      type: "created",
      content: `Project created from lead conversion by ${userName}`,
      performedBy: userId,
      performedByName: userName,
      relatedTo: { collection: "projects", id: projectId },
      metadata: { leadId, action: "converted_from_lead" },
    });

    // 6. Invalidate caches
    await redis.del("leads:list:all");
    await redis.del("projects:list:all");
    if (userId) await redis.del(`dashboard:stats:${userId}`);

    return { success: true, projectId, error: null };
  } catch (error: any) {
    console.error("❌ Failed to convert lead to project:", error.message);
    return { success: false, projectId: null, error: error.message };
  }
}
