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

// Get all deals with optional filters
export async function getDeals(filters?: DealFilters): Promise<{
  deals: Deal[];
  error: string | null;
}> {
  try {
    console.log("Fetching deals with filters:", filters);
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (filters?.stage) {
      constraints.push(where("stage", "==", filters.stage));
    }
    if (filters?.ownerId) {
      constraints.push(where("ownerId", "==", filters.ownerId));
    }
    if (filters?.companyId) {
      constraints.push(where("companyId", "==", filters.companyId));
    }

    // Only add ordering if we have filters (to avoid index requirements)
    if (constraints.length > 0) {
      constraints.push(orderBy("createdAt", "desc"));
    }

    const q = constraints.length > 0
      ? query(collection(db, COLLECTION_NAME), ...constraints)
      : collection(db, COLLECTION_NAME);
      
    const querySnapshot = await getDocs(q);
    console.log("Deals fetched:", querySnapshot.size);

    const deals: Deal[] = [];
    querySnapshot.forEach((doc) => {
      deals.push({ id: doc.id, ...doc.data() } as Deal);
    });

    // Sort by createdAt on client side
    deals.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    // Apply client-side filters
    let filteredDeals = deals;

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredDeals = deals.filter(
        (deal) =>
          deal.title.toLowerCase().includes(searchLower) ||
          deal.companyName?.toLowerCase().includes(searchLower) ||
          deal.description?.toLowerCase().includes(searchLower)
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
