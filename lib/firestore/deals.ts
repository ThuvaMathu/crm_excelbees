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
  Timestamp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";
import { redis } from "../redis";
import { dealSchema } from "../validations/deal";
import { hasPermission, canEditRecord } from "../auth/permission-utils";
import type { Deal, DealInput, DealFilters, DealStage } from "@/types/crm";
import { createNotification } from "./notifications";
import { sanitizeData } from "./utils";
import { logger } from "@/lib/logger/client";

const COLLECTION_NAME = "deals";

function orgCacheKey(orgId: string, suffix: string) {
  return `deals:${orgId}:${suffix}`;
}

function cacheKey(orgId: string | undefined, suffix: string) {
  return orgId ? orgCacheKey(orgId, suffix) : "deals:list:all";
}

function rehydrateTimestamp(val: any) {
  if (!val) return null;
  if (typeof val?.toDate === 'function') return val;
  if (typeof val === 'object' && 'seconds' in val) {
    try { return new Timestamp(val.seconds, val.nanoseconds); } catch { return null; }
  }
  return null;
}

// Create a new deal
export async function createDeal(data: DealInput, userId: string, organizationId: string): Promise<{
  success: boolean;
  id: string | null;
  error: string | null;
}> {
  try {
    if (!organizationId) {
      return { success: false, id: null, error: "organizationId is required to create a deal" };
    }
    const permCheck = await hasPermission(userId, organizationId, "deals", "create");
    if (!permCheck.allowed) {
      return { success: false, id: null, error: permCheck.reason || "You do not have permission to create deals" };
    }
    const parsed = dealSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, id: null, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }

    const dealData: any = {
      ...parsed.data,
      organizationId,
      contactIds: data.contactIds || [],
      archived: false,
      ownerId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    Object.keys(dealData).forEach(key => {
      if (dealData[key] === undefined) delete dealData[key];
    });

    const docRef = await addDoc(collection(db, COLLECTION_NAME), dealData);

    await redis.del(orgCacheKey(organizationId, "list:all"));
    if (userId) await redis.del(`dashboard:stats:${organizationId}:${userId}`);

    return { success: true, id: docRef.id, error: null };
  } catch (error: any) {
    return { success: false, id: null, error: error.message };
  }
}

// Create project from deal
export async function createProjectFromDeal(dealId: string, userId: string, userName: string, organizationId: string) {
  try {
    if (!organizationId) return { success: false, projectId: null, error: "organizationId is required to create a project from a deal" };
    const dealResult = await getDeal(dealId);
    if (dealResult.error || !dealResult.deal) return { success: false, projectId: null, error: dealResult.error || "Deal not found" };
    const deal = dealResult.deal;

    const { createProject } = await import("./projects");
    const projectData = {
      name: `Project: ${deal.title}`,
      description: deal.description || `Created from deal: ${deal.title}`,
      scope: `Project created from deal conversion: ${deal.title}`,
      status: "Planning" as const,
      priority: "Medium" as const,
      budget: deal.value || 0,
      startDate: Timestamp.now(),
      lifecycle: "active" as const,
      phases: [{ id: crypto.randomUUID(), name: "Initial Phase", progress: 0, order: 0 }],
      companyName: deal.companyName || undefined,
      companyId: deal.companyId || undefined,
      dealId: deal.id,
      tags: [],
      teamMembers: [userId],
      progress: 0,
    };

    const projectResult = await createProject(projectData, userId, organizationId);
    if (!projectResult.success || !projectResult.id) return { success: false, projectId: null, error: projectResult.error || "Failed to create project" };
    const projectId = projectResult.id;

    const { createActivity } = await import("./activities");
    const orgId = organizationId;
    await createActivity({
      type: "created", content: `Project created from deal by ${userName}`,
      performedBy: userId, performedByName: userName, organizationId: orgId,
      relatedTo: { collection: "deals", id: dealId },
      metadata: { projectId, action: "create_project" },
    });
    await createActivity({
      type: "created", content: `Project initialized from deal: ${deal.title}`,
      performedBy: userId, performedByName: userName, organizationId: orgId,
      relatedTo: { collection: "projects", id: projectId },
      metadata: { dealId, action: "initialized_from_deal" },
    });

    if (orgId) {
      await redis.del(orgCacheKey(orgId, "list:all"));
      await redis.del(`projects:${orgId}:list:all`);
      if (userId) await redis.del(`dashboard:stats:${orgId}:${userId}`);
    }

    return { success: true, projectId, error: null };
  } catch (error: any) {
    return { success: false, projectId: null, error: error.message };
  }
}

// Archive a deal
export async function archiveDeal(id: string, currentUserId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Deal not found" };
    const existing = docSnap.data();
    const permCheck = await canEditRecord(currentUserId, existing.organizationId, "deals", existing.ownerId);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to archive this deal" };
    }
    await updateDoc(docRef, { archived: true, updatedAt: Timestamp.now() });
    if (existing.organizationId) await redis.del(orgCacheKey(existing.organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Unarchive a deal
export async function unarchiveDeal(id: string, currentUserId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Deal not found" };
    const existing = docSnap.data();
    const permCheck = await canEditRecord(currentUserId, existing.organizationId, "deals", existing.ownerId);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to unarchive this deal" };
    }
    await updateDoc(docRef, { archived: false, updatedAt: Timestamp.now() });
    if (existing.organizationId) await redis.del(orgCacheKey(existing.organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get all deals with optional filters
export async function getDeals(organizationId?: string | DealFilters, filters?: DealFilters): Promise<{
  deals: Deal[];
  error: string | null;
}> {
  if (typeof organizationId === "object") { filters = organizationId as any; organizationId = undefined; }
  try {
    const key = cacheKey(organizationId, "list:all");
    let deals: Deal[] = [];

    const cached = await redis.get<Deal[]>(key);
    if (cached) {
      logger.debug("Deals list cache hit", { module: "deals", action: "fetch", organizationId: organizationId || undefined, metadata: { cacheHit: true } });
      deals = cached.map((d: any) => ({
        ...d,
        createdAt: rehydrateTimestamp(d.createdAt),
        updatedAt: rehydrateTimestamp(d.updatedAt),
        closeDate: rehydrateTimestamp(d.closeDate),
      }));
    }

    if (deals.length === 0) {
      const constraints: QueryConstraint[] = [];
      if (organizationId) constraints.push(where("organizationId", "==", organizationId));
      if (filters?.ownerId) constraints.push(where("ownerId", "==", filters.ownerId));
      // No orderBy — requires composite index that may not exist.
      // Client-side sort runs below instead.

      const q = constraints.length > 0 ? query(collection(db, COLLECTION_NAME), ...constraints) : collection(db, COLLECTION_NAME);
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        deals.push({ id: doc.id, ...doc.data() } as Deal);
      });

      if (deals.length > 0) await redis.set(key, deals, { ex: 300 });
    }

    deals.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    let filteredDeals = deals;

    if (filters?.archived !== undefined) {
      filteredDeals = filteredDeals.filter((deal) => (deal.archived ?? false) === filters.archived);
    } else {
      filteredDeals = filteredDeals.filter((deal) => !deal.archived);
    }
    if (filters?.stage) filteredDeals = filteredDeals.filter((deal) => deal.stage === filters.stage);
    if (filters?.companyId) filteredDeals = filteredDeals.filter((deal) => deal.companyId === filters.companyId);
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredDeals = filteredDeals.filter((deal) =>
        deal.title?.toLowerCase().includes(searchLower) ||
        deal.companyName?.toLowerCase().includes(searchLower) ||
        deal.description?.toLowerCase().includes(searchLower) ||
        deal.ownerName?.toLowerCase().includes(searchLower)
      );
    }
    if (filters?.minValue !== undefined) filteredDeals = filteredDeals.filter((deal) => deal.value >= filters!.minValue!);
    if (filters?.maxValue !== undefined) filteredDeals = filteredDeals.filter((deal) => deal.value <= filters!.maxValue!);

    return { deals: filteredDeals, error: null };
  } catch (error: any) {
    return { deals: [], error: error.message };
  }
}

// Get deals grouped by stage
export async function getDealsByStage(organizationId?: string): Promise<{
  dealsByStage: Record<DealStage, Deal[]> | null;
  error: string | null;
}> {
  try {
    const { deals } = await getDeals(organizationId);
    const dealsByStage: Record<DealStage, Deal[]> = {
      Pipeline: [], "Follow Up": [], "Schedule Service": [], Conversation: [], Won: [], Lost: [],
    };
    deals.forEach((deal) => { dealsByStage[deal.stage].push(deal); });
    return { dealsByStage, error: null };
  } catch (error: any) {
    return { dealsByStage: null, error: error.message };
  }
}

// Get a single deal by ID
export async function getDeal(id: string): Promise<{ deal: Deal | null; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { deal: { id: docSnap.id, ...docSnap.data() } as Deal, error: null };
    return { deal: null, error: "Deal not found" };
  } catch (error: any) {
    return { deal: null, error: error.message };
  }
}

// Update a deal
export async function updateDeal(id: string, data: Partial<DealInput>, userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const currentDealSnap = await getDoc(docRef);
    if (!currentDealSnap.exists()) throw new Error("Deal not found");
    const currentDeal = currentDealSnap.data() as Deal;

    const permCheck = await canEditRecord(userId, currentDeal.organizationId, "deals", currentDeal.ownerId);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to edit this deal" };
    }

    await updateDoc(docRef, sanitizeData({ ...data, updatedAt: Timestamp.now() }) as any);

    if (data.stage && data.stage !== currentDeal.stage && (data.stage === "Won" || data.stage === "Lost")) {
      const type = data.stage === "Won" ? "deal_won" : "deal_lost";
      if (currentDeal.ownerId) {
        try {
          await createNotification(currentDeal.ownerId, type, `Deal ${data.stage}`,
            `Deal "${currentDeal.title}" has been marked as ${data.stage}.`, "deal", id, currentDeal.organizationId);
        } catch (err) {
          logger.error("Failed to create deal notification", { module: "deals", action: "notify", metadata: { dealId: id, type }, error: err });
        }
      }
    }

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update deal stage
export async function updateDealStage(id: string, stage: DealStage, userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const currentDealSnap = await getDoc(docRef);
    if (!currentDealSnap.exists()) throw new Error("Deal not found");
    const currentDeal = currentDealSnap.data() as Deal;

    const permCheck = await canEditRecord(userId, currentDeal.organizationId, "deals", currentDeal.ownerId);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to move this deal" };
    }

    await updateDoc(docRef, { stage, updatedAt: Timestamp.now() });

    if (stage !== currentDeal.stage && (stage === "Won" || stage === "Lost")) {
      const type = stage === "Won" ? "deal_won" : "deal_lost";
      if (currentDeal.ownerId) {
        try {
          await createNotification(currentDeal.ownerId, type, `Deal ${stage}`,
            `Deal "${currentDeal.title}" has been marked as ${stage}.`, "deal", id, currentDeal.organizationId);
        } catch (err) {
          logger.error("Failed to create deal notification", { module: "deals", action: "notify", metadata: { dealId: id, type }, error: err });
        }
      }
    }

    if (currentDeal.organizationId) await redis.del(orgCacheKey(currentDeal.organizationId, "list:all"));
    if (currentDeal.ownerId) await redis.del(`dashboard:stats:${currentDeal.organizationId || "global"}:${currentDeal.ownerId}`);

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete a deal
export async function deleteDeal(id: string, currentUserId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Deal not found" };
    const existing = docSnap.data();
    const permCheck = await hasPermission(currentUserId, existing.organizationId, "deals", "delete");
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to delete this deal" };
    }
    const orgId = existing.organizationId;
    await deleteDoc(docRef);
    if (orgId) await redis.del(orgCacheKey(orgId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
