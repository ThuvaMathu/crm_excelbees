import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  query, where, orderBy, Timestamp, QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";
import { redis } from "../redis";
import { contactSchema } from "../validations/contact";
import { hasPermission, canEditRecord } from "../auth/permission-utils";
import { sanitizeData } from "./utils";
import type { Contact, ContactInput, ContactFilters } from "@/types/crm";

const COLLECTION_NAME = "contacts";

function orgCacheKey(orgId: string, suffix: string) { return `contacts:${orgId}:${suffix}`; }
function cacheKey(orgId: string | undefined, suffix: string) {
  return orgId ? orgCacheKey(orgId, suffix) : "contacts:list:all";
}

function rehydrateTs(val: any) {
  if (!val) return null;
  if (typeof val?.toDate === 'function') return val;
  if (typeof val === 'object' && 'seconds' in val) return new Timestamp(val.seconds, val.nanoseconds);
  return null;
}

export async function createContact(data: ContactInput, userId: string, organizationId: string) {
  try {
    if (!organizationId) {
      return { success: false, id: null, error: "organizationId is required to create a contact" };
    }
    const permCheck = await hasPermission(userId, organizationId, "contacts", "create");
    if (!permCheck.allowed) {
      return { success: false, id: null, error: permCheck.reason || "You do not have permission to create contacts" };
    }
    const parsed = contactSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, id: null, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }

    const contactData: any = sanitizeData({
      ...data, organizationId, ownerId: userId, createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    });

    const docRef = await addDoc(collection(db, COLLECTION_NAME), contactData);
    await redis.del(orgCacheKey(organizationId, "list:all"));
    return { success: true, id: docRef.id, error: null };
  } catch (error: any) {
    return { success: false, id: null, error: error.message };
  }
}

export async function getContacts(organizationId?: string | ContactFilters, filters?: ContactFilters) {
  if (typeof organizationId === "object") { filters = organizationId as any; organizationId = undefined; }
  try {
    const constraints: QueryConstraint[] = [];
    if (organizationId) constraints.push(where("organizationId", "==", organizationId));
    if (filters?.companyId) constraints.push(where("companyId", "==", filters.companyId));
    if (filters?.ownerId) constraints.push(where("ownerId", "==", filters.ownerId));
    if (constraints.length > 0) constraints.push(orderBy("createdAt", "desc"));

    const q = constraints.length > 0 ? query(collection(db, COLLECTION_NAME), ...constraints) : collection(db, COLLECTION_NAME);

    const isUnfiltered = !filters || Object.keys(filters).length === 0 || (Object.keys(filters).length === 1 && filters.search === "");
    const key = cacheKey(organizationId, "list:all");

    if (isUnfiltered) {
      const cached = await redis.get<Contact[]>(key);
      if (cached) {
        const hydrated = cached.map((c: any) => ({
          ...c,
          createdAt: rehydrateTs(c.createdAt),
          updatedAt: rehydrateTs(c.updatedAt),
          lastContactedAt: rehydrateTs(c.lastContactedAt),
        }));
        return { contacts: hydrated, error: null };
      }
    }

    const querySnapshot = await getDocs(q);
    const contacts: Contact[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isDeleted) return;
      contacts.push({ id: doc.id, ...data } as Contact);
    });

    if (contacts.length > 0 && isUnfiltered) await redis.set(key, contacts, { ex: 300 });

    contacts.sort((a, b) => { const aT = a.createdAt?.toMillis?.() || 0; const bT = b.createdAt?.toMillis?.() || 0; return bT - aT; });

    let filtered = contacts;
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      filtered = contacts.filter((c) =>
        c.firstName?.toLowerCase().includes(s) || c.lastName?.toLowerCase().includes(s) ||
        `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s) || c.companyName?.toLowerCase().includes(s) ||
        c.phone?.toLowerCase().includes(s) || c.jobTitle?.toLowerCase().includes(s)
      );
    }
    return { contacts: filtered, error: null };
  } catch (error: any) {
    return { contacts: [], error: error.message };
  }
}

export async function getContact(id: string) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && !docSnap.data().isDeleted) return { contact: { id: docSnap.id, ...docSnap.data() } as Contact, error: null };
    return { contact: null, error: "Contact not found" };
  } catch (error: any) {
    return { contact: null, error: error.message };
  }
}

export async function updateContact(id: string, data: Partial<ContactInput>, userId: string) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Contact not found" };
    const existing = docSnap.data();
    const permCheck = await canEditRecord(userId, existing.organizationId, "contacts", existing.ownerId);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to edit this contact" };
    }
    await updateDoc(docRef, sanitizeData({ ...data, updatedAt: Timestamp.now() }));
    if (existing.organizationId) await redis.del(orgCacheKey(existing.organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Soft delete: marks the contact as deleted rather than removing the
// document, preserving referential integrity and allowing recovery.
export async function deleteContact(id: string, userId: string) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Contact not found" };
    const existing = docSnap.data();
    const permCheck = await hasPermission(userId, existing.organizationId, "contacts", "delete");
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to delete this contact" };
    }
    const orgId = existing.organizationId;
    await updateDoc(docRef, { isDeleted: true, deletedAt: Timestamp.now(), updatedAt: Timestamp.now() });
    if (orgId) await redis.del(orgCacheKey(orgId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function importContacts(contacts: ContactInput[], userId: string, organizationId: string) {
  try {
    if (!organizationId) return { results: null, error: "organizationId is required to import contacts" };
    const results = { success: 0, failed: 0, errors: [] as string[] };
    for (const contact of contacts) {
      const { success, error } = await createContact(contact, userId, organizationId);
      if (success) results.success++; else { results.failed++; results.errors.push(error || "Unknown error"); }
    }
    return { results, error: null };
  } catch (error: any) {
    return { results: null, error: error.message };
  }
}
