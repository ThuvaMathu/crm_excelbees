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
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (filters?.status) {
      constraints.push(where("status", "==", filters.status));
    }
    if (filters?.source) {
      constraints.push(where("source", "==", filters.source));
    }
    if (filters?.ownerId) {
      constraints.push(where("ownerId", "==", filters.ownerId));
    }

    // Add ordering
    constraints.push(orderBy("createdAt", "desc"));

    // Add pagination
    if (pagination) {
      constraints.push(limit(pagination.pageSize));
    }

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    
    // Try Cache for unfiltered requests (and no pagination for now, or page 1)
    const isUnfiltered = (!filters || Object.keys(filters).length === 0) && (!pagination);
    const cacheKey = "leads:list:all";

    if (isUnfiltered) {
        const cached = await redis.get<Lead[]>(cacheKey);
        if (cached) {
                console.log("⚡ HIT: Leads list from Redis");
                // Rehydrate Timestamps
                const hydrated = cached.map((l: any) => ({
                ...l,
                createdAt: l.createdAt ? new Timestamp(l.createdAt.seconds || 0, l.createdAt.nanoseconds || 0) : null,
                updatedAt: l.updatedAt ? new Timestamp(l.updatedAt.seconds || 0, l.updatedAt.nanoseconds || 0) : null,
                lastContactedAt: l.lastContactedAt ? new Timestamp(l.lastContactedAt.seconds || 0, l.lastContactedAt.nanoseconds || 0) : null,
                aiLastUpdated: l.aiLastUpdated ? new Timestamp(l.aiLastUpdated.seconds || 0, l.aiLastUpdated.nanoseconds || 0) : null,
                }));
                return { leads: hydrated, error: null };
        }
    }

    const querySnapshot = await getDocs(q);
    console.log("📊 Leads fetched from Firestore:", querySnapshot.size);

    const leads: Lead[] = [];
    querySnapshot.forEach((doc) => {
      leads.push({ id: doc.id, ...doc.data() } as Lead);
    });

    if (leads.length > 0 && isUnfiltered) {
        await redis.set(cacheKey, leads, { ex: 300 });
    }

    // Apply client-side search filter if provided
    let filteredLeads = leads;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredLeads = leads.filter(
        (lead) =>
          lead.firstName.toLowerCase().includes(searchLower) ||
          lead.lastName.toLowerCase().includes(searchLower) ||
          lead.email.toLowerCase().includes(searchLower) ||
          lead.companyName?.toLowerCase().includes(searchLower)
      );
      console.log("🔍 After search filter:", filteredLeads.length, "leads");
    }

    console.log("✅ Returning", filteredLeads.length, "leads");
    return {
      leads: filteredLeads,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to fetch leads:", error.message);
    return {
      leads: [],
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
