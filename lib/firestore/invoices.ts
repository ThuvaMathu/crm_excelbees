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
import { generateNextInvoiceNumber } from "./invoice-number-generator";
import type { Invoice, InvoiceInput, InvoiceStatus } from "@/types/crm";
import { createNotification } from "./notifications";

const COLLECTION_NAME = "invoices";

// Generate invoice number
function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `INV-${year}${month}-${random}`;
}

// Create a new invoice
export async function createInvoice(data: InvoiceInput, userId: string): Promise<{
  success: boolean;
  id: string | null;
  error: string | null;
}> {
  try {
    console.log("📝 Creating invoice:", data.invoiceNumber);

    const invoiceData = {
      ...data,
      invoiceNumber: data.invoiceNumber || await generateNextInvoiceNumber(userId),
      ownerId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), invoiceData);
    console.log("✅ Invoice created with ID:", docRef.id);

    // Invalidate cache
    await redis.del("invoices:list:all");
    if (userId) {
      await redis.del(`dashboard:stats:${userId}`);
    }

    return {
      success: true,
      id: docRef.id,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to create invoice:", error.message);
    return {
      success: false,
      id: null,
      error: error.message,
    };
  }
}

// Get all invoices with optional filters
export async function getInvoices(filters?: {
  status?: InvoiceStatus;
  companyId?: string;
  ownerId?: string;
  search?: string;
}): Promise<{
  invoices: Invoice[];
  error: string | null;
}> {
  try {
    console.log("📋 Fetching invoices with filters:", filters);
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (filters?.status) {
      constraints.push(where("status", "==", filters.status));
    }
    if (filters?.companyId) {
      constraints.push(where("companyId", "==", filters.companyId));
    }
    if (filters?.ownerId) {
      constraints.push(where("ownerId", "==", filters.ownerId));
    }

    // Only add ordering if we have filters
    if (constraints.length > 0) {
      constraints.push(orderBy("createdAt", "desc"));
    }

    const q = constraints.length > 0
      ? query(collection(db, COLLECTION_NAME), ...constraints)
      : collection(db, COLLECTION_NAME);

    // Try Cache for unfiltered requests
    const isUnfiltered = !filters || Object.keys(filters).length === 0 || (Object.keys(filters).length === 1 && filters.search === "");
    const cacheKey = "invoices:list:all";

    if (isUnfiltered) {
      const cached = await redis.get<Invoice[]>(cacheKey);
      if (cached) {
        console.log("⚡ HIT: Invoices list from Redis");
        // Rehydrate Timestamps
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
    console.log("📊 Invoices fetched:", querySnapshot.size);

    const invoices: Invoice[] = [];
    querySnapshot.forEach((doc) => {
      invoices.push({ id: doc.id, ...doc.data() } as Invoice);
    });

    if (invoices.length > 0 && isUnfiltered) {
      await redis.set(cacheKey, invoices, { ex: 300 });
    }

    // Sort by createdAt on client side
    invoices.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    // Apply client-side search filter
    let filteredInvoices = invoices;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredInvoices = invoices.filter(
        (invoice) =>
          invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
          invoice.companyName?.toLowerCase().includes(searchLower) ||
          invoice.contactName?.toLowerCase().includes(searchLower) ||
          invoice.clientEmail?.toLowerCase().includes(searchLower) ||
          invoice.status?.toLowerCase().includes(searchLower)
      );
    }

    console.log("✅ Returning", filteredInvoices.length, "invoices");
    return {
      invoices: filteredInvoices,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to fetch invoices:", error.message);
    return {
      invoices: [],
      error: error.message,
    };
  }
}

// Get a single invoice by ID
export async function getInvoice(id: string): Promise<{
  invoice: Invoice | null;
  error: string | null;
}> {
  try {
    console.log("🔍 Fetching invoice:", id);
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("✅ Invoice found:", id);
      return {
        invoice: { id: docSnap.id, ...docSnap.data() } as Invoice,
        error: null,
      };
    } else {
      console.warn("⚠️ Invoice not found:", id);
      return {
        invoice: null,
        error: "Invoice not found",
      };
    }
  } catch (error: any) {
    console.error("❌ Failed to fetch invoice:", error.message);
    return {
      invoice: null,
      error: error.message,
    };
  }
}

// Update an invoice
export async function updateInvoice(id: string, data: Partial<InvoiceInput>): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("📝 Updating invoice:", id);
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    } as any);

    console.log("✅ Invoice updated successfully");

    // Invalidate cache
    await redis.del("invoices:list:all");

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to update invoice:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Update invoice status
export async function updateInvoiceStatus(id: string, status: InvoiceStatus, paidDate?: Date): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("📝 Updating invoice status:", id, "to", status);
    const docRef = doc(db, COLLECTION_NAME, id);

    // Fetch current invoice to get owner and check previous status
    const currentInvoiceSnap = await getDoc(docRef);
    if (!currentInvoiceSnap.exists()) throw new Error("Invoice not found");
    const currentInvoice = currentInvoiceSnap.data() as Invoice;

    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
    };

    // If marking as paid, set paid date
    if (status === "Paid" && paidDate) {
      updateData.paidDate = Timestamp.fromDate(paidDate);
    }

    await updateDoc(docRef, updateData);

    // Notify owner if invoice is paid
    if (status === "Paid" && currentInvoice.status !== "Paid") {
      if (currentInvoice.ownerId) {
        console.log("🔔 Creating invoice paid notification for owner:", currentInvoice.ownerId);
        try {
          const notifResult = await createNotification(
            currentInvoice.ownerId,
            "invoice_paid",
            "Invoice Paid",
            `Invoice ${currentInvoice.invoiceNumber} has been marked as paid.`,
            "invoice",
            id
          );
          console.log("🔔 Invoice notification result:", notifResult);
        } catch (notifError) {
          console.error("❌ Failed to create invoice notification:", notifError);
        }
      } else {
        console.warn("⚠️ Invoice has no ownerId, skipping notification");
      }
    }

    console.log("✅ Invoice status updated");

    // Invalidate cache
    await redis.del("invoices:list:all");
    if (currentInvoice.ownerId) {
      await redis.del(`dashboard:stats:${currentInvoice.ownerId}`);
    }

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to update invoice status:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Delete an invoice
export async function deleteInvoice(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("🗑️ Deleting invoice:", id);
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    console.log("✅ Invoice deleted successfully");

    // Invalidate cache
    await redis.del("invoices:list:all");

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to delete invoice:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Get invoice statistics
export async function getInvoiceStats(): Promise<{
  stats: {
    totalRevenue: number;
    outstanding: number;
    overdueCount: number;
    draftCount: number;
  } | null;
  error: string | null;
}> {
  try {
    const { invoices } = await getInvoices();

    const stats = {
      totalRevenue: invoices
        .filter((inv) => inv.status === "Paid")
        .reduce((sum, inv) => sum + inv.total, 0),
      outstanding: invoices
        .filter((inv) => inv.status === "Sent" || inv.status === "Overdue")
        .reduce((sum, inv) => sum + inv.total, 0),
      overdueCount: invoices.filter((inv) => inv.status === "Overdue").length,
      draftCount: invoices.filter((inv) => inv.status === "Draft").length,
    };

    return {
      stats,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to get invoice stats:", error.message);
    return {
      stats: null,
      error: error.message,
    };
  }
}
