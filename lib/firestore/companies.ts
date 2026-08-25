import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, Timestamp, QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";
import { redis } from "../redis";
import { companySchema } from "../validations/company";
import { hasPermission, canEditRecord } from "../auth/permission-utils";
import { sanitizeData } from "./utils";
import type { Company, CompanyInput, CompanyFilters, Address } from "@/types/crm";

const COLLECTION_NAME = "companies";

function orgCacheKey(orgId: string, suffix: string) { return `companies:${orgId}:${suffix}`; }
function cacheKey(orgId: string | undefined, suffix: string) {
  return orgId ? orgCacheKey(orgId, suffix) : "companies:list:all";
}

export async function createCompany(data: CompanyInput, userId: string, organizationId: string): Promise<{
  success: boolean; id: string | null; error: string | null;
}> {
  try {
    if (!organizationId) {
      return { success: false, id: null, error: "organizationId is required to create a company" };
    }
    const permCheck = await hasPermission(userId, organizationId, "companies", "create");
    if (!permCheck.allowed) {
      return { success: false, id: null, error: permCheck.reason || "You do not have permission to create companies" };
    }
    const parsed = companySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, id: null, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }

    const companyData: any = { ...data, organizationId, ownerId: userId, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), sanitizeData(companyData));
    await redis.del(orgCacheKey(organizationId, "list:all"));
    if (userId) await redis.del(`dashboard:stats:${organizationId}:${userId}`);
    return { success: true, id: docRef.id, error: null };
  } catch (error: any) {
    return { success: false, id: null, error: error.message };
  }
}

export async function getCompanies(organizationId?: string | CompanyFilters, filters?: CompanyFilters): Promise<{
  companies: Company[]; error: string | null;
}> {
  if (typeof organizationId === "object") { filters = organizationId as any; organizationId = undefined; }
  try {
    const constraints: QueryConstraint[] = [];
    if (organizationId) constraints.push(where("organizationId", "==", organizationId));
    if (filters?.industry) constraints.push(where("industry", "==", filters.industry));
    if (filters?.size) constraints.push(where("size", "==", filters.size));
    if (filters?.ownerId) constraints.push(where("ownerId", "==", filters.ownerId));
    if (constraints.length > 0) constraints.push(orderBy("createdAt", "desc"));

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const isUnfiltered = !filters || Object.keys(filters).length === 0 || (Object.keys(filters).length === 1 && filters.search === "");
    const key = cacheKey(organizationId, "list:all");

    if (isUnfiltered) {
      const cached = await redis.get<Company[]>(key);
      if (cached) {
        const hydrated = cached.map((c: any) => ({
          ...c,
          createdAt: c.createdAt ? new Timestamp(c.createdAt.seconds || 0, c.createdAt.nanoseconds || 0) : null,
          updatedAt: c.updatedAt ? new Timestamp(c.updatedAt.seconds || 0, c.updatedAt.nanoseconds || 0) : null,
        }));
        return { companies: hydrated, error: null };
      }
    }

    const querySnapshot = await getDocs(q);
    const companies: Company[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isDeleted) return;
      companies.push({ id: doc.id, ...data } as Company);
    });
    if (companies.length > 0 && isUnfiltered) await redis.set(key, companies, { ex: 300 });

    companies.sort((a, b) => { const aT = a.createdAt?.toMillis?.() || 0; const bT = b.createdAt?.toMillis?.() || 0; return bT - aT; });

    let filtered = companies;
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      filtered = companies.filter((c) =>
        c.name?.toLowerCase().includes(s) || c.domain?.toLowerCase().includes(s) ||
        c.industry?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) ||
        c.phone?.toLowerCase().includes(s)
      );
    }
    return { companies: filtered, error: null };
  } catch (error: any) {
    return { companies: [], error: error.message };
  }
}

export async function getCompany(id: string): Promise<{ company: Company | null; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && !docSnap.data().isDeleted) return { company: { id: docSnap.id, ...docSnap.data() } as Company, error: null };
    return { company: null, error: "Company not found" };
  } catch (error: any) { return { company: null, error: error.message }; }
}

export async function updateCompany(id: string, data: Partial<CompanyInput>, userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Company not found" };
    const existing = docSnap.data();
    const permCheck = await canEditRecord(userId, existing.organizationId, "companies", existing.ownerId);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to edit this company" };
    }
    await updateDoc(docRef, sanitizeData({ ...data, updatedAt: Timestamp.now() }));
    if (existing.organizationId) await redis.del(orgCacheKey(existing.organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

// Soft delete: marks the company as deleted rather than removing the
// document, preserving referential integrity and allowing recovery.
export async function deleteCompany(id: string, userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Company not found" };
    const existing = docSnap.data();
    const permCheck = await hasPermission(userId, existing.organizationId, "companies", "delete");
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to delete this company" };
    }
    const orgId = existing.organizationId;
    await updateDoc(docRef, { isDeleted: true, deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
    if (orgId) await redis.del(orgCacheKey(orgId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function getCompanyContacts(organizationId: string | undefined, companyId: string) {
  try {
    const constraints: any[] = [where("companyId", "==", companyId)];
    if (organizationId) constraints.push(where("organizationId", "==", organizationId));
    const q = query(collection(db, "contacts"), ...constraints);
    const querySnapshot = await getDocs(q);
    const contacts: any[] = [];
    querySnapshot.forEach((doc) => { contacts.push({ id: doc.id, ...doc.data() }); });
    return { contacts, error: null };
  } catch (error: any) { return { contacts: [], error: error.message }; }
}
