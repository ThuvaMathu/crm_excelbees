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
import type { Deal, DealInput, DealFilters, DealStage } from "@/types/crm";
import { createNotification } from "./notifications";

const COLLECTION_NAME = "deals";

// Create a new deal
export async function createDeal(data: DealInput, userId: string): Promise<{
  success: boolean;
  id: string | null;
  error: string | null;
}> {
  try {
    const dealData: any = {
      ...data,
      contactIds: data.contactIds || [],
      archived: false,
      ownerId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Remove undefined values (Firestore doesn't support them)
    Object.keys(dealData).forEach(key => {
      if (dealData[key] === undefined) {
        delete dealData[key];
      }
    });

    const docRef = await addDoc(collection(db, COLLECTION_NAME), dealData);

    // Invalidate cache
    await redis.del("deals:list:all");
    if (userId) {
      await redis.del(`dashboard:stats:${userId}`);
    }

    return {
      success: true,
      id: docRef.id,
      error: null,
    };
  } catch (error: any) {
    return {
      success: false,
      id: null,
      error: error.message,
    };
  }
}

// Create project from deal
export async function createProjectFromDeal(dealId: string, userId: string, userName: string) {
  console.log("🔄 Creating project from deal:", dealId);
  try {
    // 1. Get the deal
    const dealResult = await getDeal(dealId);
    if (dealResult.error || !dealResult.deal) {
      return { success: false, projectId: null, error: dealResult.error || "Deal not found" };
    }
    const deal = dealResult.deal;

    // 2. Create project from deal data
    const { createProject } = await import("./projects");
    const projectData = {
      name: `Project: ${deal.title}`,
      description: deal.description || `Created from deal: ${deal.title}`,
      status: "Planning" as const,
      priority: "Medium" as const,
      budget: deal.value || 0,
      startDate: Timestamp.now(),
      clientId: deal.contactIds?.[0] || "",
      companyName: deal.companyName || undefined,
      companyId: deal.companyId || undefined,
      dealId: deal.id,
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

    // 3. Log activity
    const { createActivity } = await import("./activities");
    await createActivity({
      type: "created",
      content: `Project created from deal by ${userName}`,
      performedBy: userId,
      performedByName: userName,
      relatedTo: { collection: "deals", id: dealId },
      metadata: { projectId, action: "create_project" },
    });

    // Log on Project side
    await createActivity({
      type: "created",
      content: `Project initialized from deal: ${deal.title}`,
      performedBy: userId,
      performedByName: userName,
      relatedTo: { collection: "projects", id: projectId },
      metadata: { dealId, action: "initialized_from_deal" },
    });

    // 4. Invalidate caches
    await redis.del("deals:list:all");
    await redis.del("projects:list:all");
    if (userId) await redis.del(`dashboard:stats:${userId}`);

    return { success: true, projectId, error: null };
  } catch (error: any) {
    console.error("❌ Failed to create project from deal:", error.message);
    return { success: false, projectId: null, error: error.message };
  }
}

// Archive a deal
export async function archiveDeal(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { archived: true, updatedAt: Timestamp.now() });

    // Invalidate cache
    await redis.del("deals:list:all");

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Unarchive a deal
export async function unarchiveDeal(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { archived: false, updatedAt: Timestamp.now() });

    // Invalidate cache
    await redis.del("deals:list:all");

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get all deals with optional filters
export async function getDeals(filters?: DealFilters): Promise<{
  deals: Deal[];
  error: string | null;
}> {
  try {
    console.log("Fetching deals with filters:", filters);

    const cacheKey = "deals:list:all";
    let deals: Deal[] = [];

    // Try cache first
    const cached = await redis.get<Deal[]>(cacheKey);
    if (cached) {
      console.log("⚡ HIT: Deals list from Redis");
      deals = cached.map((d: any) => ({
        ...d,
        createdAt: d.createdAt ? new Timestamp(d.createdAt.seconds || 0, d.createdAt.nanoseconds || 0) : null,
        updatedAt: d.updatedAt ? new Timestamp(d.updatedAt.seconds || 0, d.updatedAt.nanoseconds || 0) : null,
        closeDate: d.closeDate ? new Timestamp(d.closeDate.seconds || 0, d.closeDate.nanoseconds || 0) : null,
      }));
    }

    // If no cached data, fetch from Firestore
    if (deals.length === 0) {
      const constraints: QueryConstraint[] = [];

      // Only add simple single-field filters at Firestore level
      if (filters?.ownerId) {
        constraints.push(where("ownerId", "==", filters.ownerId));
      }

      constraints.push(orderBy("createdAt", "desc"));

      const q = query(collection(db, COLLECTION_NAME), ...constraints);
      const querySnapshot = await getDocs(q);
      console.log("Deals fetched:", querySnapshot.size);

      querySnapshot.forEach((doc) => {
        deals.push({ id: doc.id, ...doc.data() } as Deal);
      });

      // Cache the full result
      if (deals.length > 0) {
        await redis.set(cacheKey, deals, { ex: 300 });
      }
    }

    // Sort by createdAt on client side
    deals.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    // Apply all filters client-side
    let filteredDeals = deals;

    // Archived filter — treats missing `archived` field as not archived
    if (filters?.archived !== undefined) {
      filteredDeals = filteredDeals.filter((deal) => (deal.archived ?? false) === filters.archived);
    } else {
      // By default, exclude archived deals (missing field = not archived)
      filteredDeals = filteredDeals.filter((deal) => !deal.archived);
    }

    // Stage filter
    if (filters?.stage) {
      filteredDeals = filteredDeals.filter((deal) => deal.stage === filters.stage);
    }

    // Company filter
    if (filters?.companyId) {
      filteredDeals = filteredDeals.filter((deal) => deal.companyId === filters.companyId);
    }

    // Search filter
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredDeals = filteredDeals.filter(
        (deal) =>
          deal.title?.toLowerCase().includes(searchLower) ||
          deal.companyName?.toLowerCase().includes(searchLower) ||
          deal.description?.toLowerCase().includes(searchLower) ||
          deal.ownerName?.toLowerCase().includes(searchLower)
      );
    }

    if (filters?.minValue !== undefined) {
      filteredDeals = filteredDeals.filter((deal) => deal.value >= filters!.minValue!);
    }

    if (filters?.maxValue !== undefined) {
      filteredDeals = filteredDeals.filter((deal) => deal.value <= filters!.maxValue!);
    }

    return {
      deals: filteredDeals,
      error: null,
    };
  } catch (error: any) {
    console.error("Error in getDeals:", error);
    return {
      deals: [],
      error: error.message,
    };
  }
}

// Get deals grouped by stage (for Kanban board)
export async function getDealsByStage(): Promise<{
  dealsByStage: Record<DealStage, Deal[]> | null;
  error: string | null;
}> {
  try {
    const { deals } = await getDeals();

    const dealsByStage: Record<DealStage, Deal[]> = {
      Pipeline: [],
      "Follow Up": [],
      "Schedule Service": [],
      Conversation: [],
      Won: [],
      Lost: [],
    };

    deals.forEach((deal) => {
      dealsByStage[deal.stage].push(deal);
    });

    return {
      dealsByStage,
      error: null,
    };
  } catch (error: any) {
    return {
      dealsByStage: null,
      error: error.message,
    };
  }
}

// Get a single deal by ID
export async function getDeal(id: string): Promise<{
  deal: Deal | null;
  error: string | null;
}> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        deal: { id: docSnap.id, ...docSnap.data() } as Deal,
        error: null,
      };
    } else {
      return {
        deal: null,
        error: "Deal not found",
      };
    }
  } catch (error: any) {
    return {
      deal: null,
      error: error.message,
    };
  }
}

// Update a deal
export async function updateDeal(id: string, data: Partial<DealInput>): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);

    // Fetch current deal to compare changes and get owner
    const currentDealSnap = await getDoc(docRef);
    if (!currentDealSnap.exists()) throw new Error("Deal not found");
    const currentDeal = currentDealSnap.data() as Deal;

    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    } as any);

    // Check for stage change to notify
    if (data.stage && data.stage !== currentDeal.stage && (data.stage === "Won" || data.stage === "Lost")) {
      const type = data.stage === "Won" ? "deal_won" : "deal_lost";
      const title = `Deal ${data.stage}`;
      const message = `Deal "${currentDeal.title}" has been marked as ${data.stage}.`;

      await createNotification(
        currentDeal.ownerId,
        type,
        title,
        message,
        "deal",
        id
      );
    }

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

// Update deal stage (for drag-and-drop)
export async function updateDealStage(id: string, stage: DealStage): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);

    // Fetch current deal to get owner
    const currentDealSnap = await getDoc(docRef);
    if (!currentDealSnap.exists()) throw new Error("Deal not found");
    const currentDeal = currentDealSnap.data() as Deal;

    await updateDoc(docRef, {
      stage,
      updatedAt: Timestamp.now(),
    });

    // Notify if stage is Won or Lost
    if (stage !== currentDeal.stage && (stage === "Won" || stage === "Lost")) {
      const type = stage === "Won" ? "deal_won" : "deal_lost";
      const title = `Deal ${stage}`;
      const message = `Deal "${currentDeal.title}" has been marked as ${stage}.`;

      await createNotification(
        currentDeal.ownerId,
        type,
        title,
        message,
        "deal",
        id
      );
    }

    // Invalidate cache
    await redis.del("deals:list:all");
    if (currentDeal.ownerId) {
      await redis.del(`dashboard:stats:${currentDeal.ownerId}`);
    }

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

// Delete a deal
export async function deleteDeal(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    // Invalidate cache
    await redis.del("deals:list:all");

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
