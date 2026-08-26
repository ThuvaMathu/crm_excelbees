import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, Timestamp, QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";
import { redis } from "../redis";
import { invoiceSchema } from "../validations/invoice";
import { generateNextInvoiceNumber } from "./invoice-number-generator";
import { hasPermission, canEditRecord } from "../auth/permission-utils";
import { sanitizeData } from "./utils";
import type { Invoice, InvoiceInput, InvoiceStatus } from "@/types/crm";
import { createNotification } from "./notifications";
import { logger } from "@/lib/logger/client";

const COLLECTION_NAME = "invoices";

function orgCacheKey(orgId: string, suffix: string) { return `invoices:${orgId}:${suffix}`; }
function cacheKey(orgId: string | undefined, suffix: string) {
  return orgId ? orgCacheKey(orgId, suffix) : "invoices:list:all";
}

export async function createInvoice(data: InvoiceInput, userId: string, organizationId: string): Promise<{
  success: boolean; id: string | null; invoiceNumber: string | null; error: string | null;
}> {
  try {
    if (!organizationId) {
      return { success: false, id: null, invoiceNumber: null, error: "organizationId is required to create an invoice" };
    }
    const permCheck = await hasPermission(userId, organizationId, "invoices", "create");
    if (!permCheck.allowed) {
      return { success: false, id: null, invoiceNumber: null, error: permCheck.reason || "You do not have permission to create invoices" };
    }
    const parsed = invoiceSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, id: null, invoiceNumber: null, error: parsed.error.issues.map((i) => i.message).join(", ") };
    }

    let invoiceNumber = data.invoiceNumber;
    if (!invoiceNumber) {
      try {
        invoiceNumber = await generateNextInvoiceNumber(organizationId);
      } catch (e: any) {
        // Fall back to a timestamp-based number so a settings/network
        // hiccup in the sequential generator doesn't block invoice creation.
        logger.error("Invoice number generation failed, using fallback", { module: "invoices", action: "create", error: e });
        invoiceNumber = `INV-${Date.now()}`;
      }
    }
    const invoiceData: any = { ...parsed.data, invoiceNumber, organizationId, ownerId: userId, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), sanitizeData(invoiceData));
    await redis.del(orgCacheKey(organizationId, "list:all"));
    if (userId) await redis.del(`dashboard:stats:${organizationId}:${userId}`);
    logger.info("Invoice created", { module: "invoices", action: "create", metadata: { invoiceId: docRef.id, invoiceNumber } });
    // The caller's pre-creation form data never has invoiceNumber set when
    // it's auto-generated here — callers that build a PDF/email right after
    // creating (see app/org/[orgId]/invoices/create/page.tsx) need the real
    // assigned number, not just the doc id, or jsPDF.text(undefined, ...)
    // throws "Invalid arguments passed to jsPDF.text".
    return { success: true, id: docRef.id, invoiceNumber, error: null };
  } catch (error: any) {
    logger.error("Failed to create invoice", { module: "invoices", action: "create", error });
    return { success: false, id: null, invoiceNumber: null, error: error.message };
  }
}

export async function getInvoices(organizationId?: string | { status?: InvoiceStatus; companyId?: string; ownerId?: string; search?: string }, filters?: {
  status?: InvoiceStatus; companyId?: string; ownerId?: string; search?: string;
}): Promise<{ invoices: Invoice[]; error: string | null }> {
  if (typeof organizationId === "object") { filters = organizationId as any; organizationId = undefined; }
  try {
    const constraints: QueryConstraint[] = [];
    if (organizationId) constraints.push(where("organizationId", "==", organizationId));
    if (filters?.status) constraints.push(where("status", "==", filters.status));
    if (filters?.companyId) constraints.push(where("companyId", "==", filters.companyId));
    if (filters?.ownerId) constraints.push(where("ownerId", "==", filters.ownerId));
    // No orderBy — multiple where+orderBy requires composite index. Sort client-side below.
    const q = constraints.length > 0 ? query(collection(db, COLLECTION_NAME), ...constraints) : query(collection(db, COLLECTION_NAME));
    const isUnfiltered = !filters || Object.keys(filters).length === 0 || (Object.keys(filters).length === 1 && filters.search === "");
    const key = cacheKey(organizationId, "list:all");

    if (isUnfiltered) {
      const cached = await redis.get<Invoice[]>(key);
      if (cached) {
        const hydrated = cached.map((inv: any) => ({
          ...inv,
          createdAt: inv.createdAt ? new Timestamp(inv.createdAt.seconds || 0, inv.createdAt.nanoseconds || 0) : null,
          updatedAt: inv.updatedAt ? new Timestamp(inv.updatedAt.seconds || 0, inv.updatedAt.nanoseconds || 0) : null,
          dueDate: inv.dueDate ? new Timestamp(inv.dueDate.seconds || 0, inv.dueDate.nanoseconds || 0) : null,
          paidDate: inv.paidDate ? new Timestamp(inv.paidDate.seconds || 0, inv.paidDate.nanoseconds || 0) : null,
        }));
        return { invoices: hydrated, error: null };
      }
    }

    const querySnapshot = await getDocs(q);
    const invoices: Invoice[] = [];
    querySnapshot.forEach((doc) => { invoices.push({ id: doc.id, ...doc.data() } as Invoice); });
    if (invoices.length > 0 && isUnfiltered) await redis.set(key, invoices, { ex: 300 });

    invoices.sort((a, b) => { const aT = a.createdAt?.toMillis?.() || 0; const bT = b.createdAt?.toMillis?.() || 0; return bT - aT; });

    let filtered = invoices;
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      filtered = invoices.filter((i) => i.invoiceNumber?.toLowerCase().includes(s) || i.companyName?.toLowerCase().includes(s) ||
        i.contactName?.toLowerCase().includes(s) || i.clientEmail?.toLowerCase().includes(s) || i.status?.toLowerCase().includes(s));
    }
    return { invoices: filtered, error: null };
  } catch (error: any) { return { invoices: [], error: error.message }; }
}

export async function getInvoice(id: string): Promise<{ invoice: Invoice | null; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { invoice: { id: docSnap.id, ...docSnap.data() } as Invoice, error: null };
    return { invoice: null, error: "Invoice not found" };
  } catch (error: any) { return { invoice: null, error: error.message }; }
}

export async function updateInvoice(id: string, data: Partial<InvoiceInput>, userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Invoice not found" };
    const existing = docSnap.data();
    const permCheck = await canEditRecord(userId, existing.organizationId, "invoices", existing.ownerId);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to edit this invoice" };
    }
    await updateDoc(docRef, sanitizeData({ ...data, updatedAt: Timestamp.now() }) as any);
    if (existing.organizationId) await redis.del(orgCacheKey(existing.organizationId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus, userId: string, paidDate?: Date): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const currentSnap = await getDoc(docRef);
    if (!currentSnap.exists()) throw new Error("Invoice not found");
    const current = currentSnap.data() as Invoice;

    const permCheck = await canEditRecord(userId, current.organizationId, "invoices", current.ownerId);
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to update this invoice" };
    }

    const updateData: any = { status, updatedAt: Timestamp.now() };
    if (status === "Paid" && paidDate) updateData.paidDate = Timestamp.fromDate(paidDate);
    await updateDoc(docRef, updateData);

    if (status === "Paid" && current.status !== "Paid" && current.ownerId) {
      try {
        await createNotification(current.ownerId, "invoice_paid", "Invoice Paid", `Invoice ${current.invoiceNumber} has been marked as paid.`, "invoice", id, current.organizationId);
      } catch (err) {
        logger.error("Failed to create invoice_paid notification", { module: "invoices", action: "notify", metadata: { invoiceId: id }, error: err });
      }
    }

    if (current.organizationId) { await redis.del(orgCacheKey(current.organizationId, "list:all")); if (current.ownerId) await redis.del(`dashboard:stats:${current.organizationId}:${current.ownerId}`); }
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function deleteInvoice(id: string, userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return { success: false, error: "Invoice not found" };
    const existing = docSnap.data();
    const permCheck = await hasPermission(userId, existing.organizationId, "invoices", "delete");
    if (!permCheck.allowed) {
      return { success: false, error: permCheck.reason || "You do not have permission to delete this invoice" };
    }
    const orgId = existing.organizationId;
    await deleteDoc(docRef);
    if (orgId) await redis.del(orgCacheKey(orgId, "list:all"));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function getInvoiceStats(organizationId?: string): Promise<{
  stats: { totalRevenue: number; outstanding: number; overdueCount: number; draftCount: number } | null;
  error: string | null;
}> {
  try {
    const { invoices } = await getInvoices(organizationId);
    const stats = {
      totalRevenue: invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.total, 0),
      outstanding: invoices.filter((i) => i.status === "Sent" || i.status === "Overdue").reduce((s, i) => s + i.total, 0),
      overdueCount: invoices.filter((i) => i.status === "Overdue").length,
      draftCount: invoices.filter((i) => i.status === "Draft").length,
    };
    return { stats, error: null };
  } catch (error: any) { return { stats: null, error: error.message }; }
}
