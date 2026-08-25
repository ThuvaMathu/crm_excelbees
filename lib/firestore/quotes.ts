import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";
import { redis } from "../redis";
import type { Quote, QuoteStatus } from "@/types/crm";

const COLLECTION_NAME = "quotes";

function orgCacheKey(orgId: string, suffix: string) { return `quotes:${orgId}:${suffix}`; }

function rehydrateTs(val: any) {
  if (!val) return null;
  if (typeof val?.toDate === "function") return val;
  if (typeof val === "object" && "seconds" in val) return new Timestamp(val.seconds, val.nanoseconds);
  return null;
}

export type QuoteInput = Omit<Quote, "id" | "organizationId" | "createdAt" | "updatedAt" | "ownerId" | "ownerName">;

export interface QuoteFilters {
  status?: QuoteStatus;
  companyId?: string;
  search?: string;
}

export async function createQuote(
  data: QuoteInput,
  userId: string,
  ownerName: string,
  organizationId: string
) {
  try {
    const quoteData: any = {
      ...data,
      organizationId,
      ownerId: userId,
      ownerName,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), quoteData);
    await redis.del(orgCacheKey(organizationId, "list:all"));
    return { success: true, id: docRef.id, error: null };
  } catch (error: any) {
    return { success: false, id: null, error: error.message };
  }
}

export async function getQuotes(organizationId: string, filters?: QuoteFilters) {
  try {
    const constraints: QueryConstraint[] = [
      where("organizationId", "==", organizationId),
    ];
    if (filters?.status) constraints.push(where("status", "==", filters.status));
    if (filters?.companyId) constraints.push(where("companyId", "==", filters.companyId));
    constraints.push(orderBy("createdAt", "desc"));

    const cacheKey = orgCacheKey(organizationId, "list:all");
    const isUnfiltered = !filters || Object.keys(filters).every(k => !(filters as any)[k]);

    if (isUnfiltered) {
      const cached = await redis.get<Quote[]>(cacheKey);
      if (cached) {
        return {
          quotes: cached.map((q: any) => ({
            ...q,
            createdAt: rehydrateTs(q.createdAt),
            updatedAt: rehydrateTs(q.updatedAt),
            issueDate: rehydrateTs(q.issueDate),
            expiryDate: rehydrateTs(q.expiryDate),
          })),
          error: null,
        };
      }
    }

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const snap = await getDocs(q);
    let quotes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quote));

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      quotes = quotes.filter(
        (qt) =>
          qt.quoteNumber.toLowerCase().includes(s) ||
          (qt.companyName && qt.companyName.toLowerCase().includes(s)) ||
          (qt.contactName && qt.contactName.toLowerCase().includes(s))
      );
    }

    if (isUnfiltered) {
      await redis.set(cacheKey, quotes, { ex: 300 });
    }

    return { quotes, error: null };
  } catch (error: any) {
    return { quotes: [], error: error.message };
  }
}

export async function getQuote(quoteId: string) {
  try {
    const snap = await getDoc(doc(db, COLLECTION_NAME, quoteId));
    if (!snap.exists()) return { quote: null, error: "Quote not found" };
    return { quote: { id: snap.id, ...snap.data() } as Quote, error: null };
  } catch (error: any) {
    return { quote: null, error: error.message };
  }
}

export async function updateQuote(
  quoteId: string,
  data: Partial<QuoteInput>,
  organizationId: string
) {
  try {
    await updateDoc(doc(db, COLLECTION_NAME, quoteId), { ...data, updatedAt: Timestamp.now() });
    await redis.del(orgCacheKey(organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteQuote(quoteId: string, organizationId: string) {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, quoteId));
    await redis.del(orgCacheKey(organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateQuoteNumber(organizationId: string): Promise<string> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("organizationId", "==", organizationId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    const count = snap.size + 1;
    return `QT-${String(count).padStart(4, "0")}`;
  } catch {
    return `QT-${Date.now()}`;
  }
}
