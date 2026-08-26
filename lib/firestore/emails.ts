import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, Timestamp, QueryConstraint,
} from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeData } from "./utils";
import type { Email, EmailInput, EmailStatus } from "@/types/email";
import { logger } from "@/lib/logger/client";

const COLLECTION_NAME = "emails";

export async function createEmail(data: Partial<EmailInput>, userId: string, organizationId: string): Promise<{
  success: boolean; id: string | null; error: string | null;
}> {
  try {
    if (!organizationId) {
      return { success: false, id: null, error: "organizationId is required to create an email" };
    }
    const emailData: any = {
      ...data, status: data.status || "draft", organizationId, ownerId: userId, createdBy: userId,
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
      tracking: { trackOpens: data.tracking?.trackOpens ?? true, trackClicks: data.tracking?.trackClicks ?? true, opens: 0, clicks: 0 },
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), sanitizeData(emailData));
    return { success: true, id: docRef.id, error: null };
  } catch (error: any) { return { success: false, id: null, error: error.message }; }
}

export async function getEmails(organizationId?: string | { status?: EmailStatus; ownerId?: string; relatedTo?: { collection: string; id: string }; search?: string }, filters?: {
  status?: EmailStatus; ownerId?: string; relatedTo?: { collection: string; id: string }; search?: string;
}): Promise<{ emails: Email[]; error: string | null }> {
  if (typeof organizationId === "object") { filters = organizationId as any; organizationId = undefined; }
  try {
    const constraints: QueryConstraint[] = [];
    if (organizationId) constraints.push(where("organizationId", "==", organizationId));
    if (filters?.status) constraints.push(where("status", "==", filters.status));
    if (filters?.ownerId) constraints.push(where("ownerId", "==", filters.ownerId));
    if (filters?.relatedTo) { constraints.push(where("relatedTo.collection", "==", filters.relatedTo.collection)); constraints.push(where("relatedTo.id", "==", filters.relatedTo.id)); }
    // No orderBy — multiple where+orderBy requires a composite index that may not exist.
    // Sort client-side instead.
    const q = constraints.length > 0 ? query(collection(db, COLLECTION_NAME), ...constraints) : collection(db, COLLECTION_NAME);
    const querySnapshot = await getDocs(q);
    const emails: Email[] = [];
    querySnapshot.forEach((doc) => { emails.push({ id: doc.id, ...doc.data() } as Email); });
    emails.sort((a, b) => {
      const aMs = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bMs = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bMs - aMs;
    });

    let filtered = emails;
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      filtered = emails.filter((e) => e.subject.toLowerCase().includes(s) ||
        e.to.some((r) => r.email.toLowerCase().includes(s) || r.name?.toLowerCase().includes(s)));
    }
    return { emails: filtered, error: null };
  } catch (error: any) { return { emails: [], error: error.message }; }
}

export async function getEmail(id: string): Promise<{ email: Email | null; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { email: { id: docSnap.id, ...docSnap.data() } as Email, error: null };
    return { email: null, error: "Email not found" };
  } catch (error: any) { return { email: null, error: error.message }; }
}

export async function updateEmail(id: string, data: Partial<EmailInput>): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, sanitizeData({ ...data, updatedAt: Timestamp.now() }) as any);
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function updateEmailStatus(id: string, status: EmailStatus, sentAt?: Date): Promise<{ success: boolean; error: string | null }> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = { status, updatedAt: Timestamp.now() };
    if (status === "sent" && sentAt) updateData.sentAt = Timestamp.fromDate(sentAt);
    await updateDoc(docRef, updateData);
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function deleteEmail(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return { success: true, error: null };
  } catch (error: any) { return { success: false, error: error.message }; }
}

export async function saveDraft(data: Partial<EmailInput>, userId: string, organizationId: string, draftId?: string): Promise<{
  success: boolean; id: string | null; error: string | null;
}> {
  try {
    const draftData = { ...data, status: "draft" as EmailStatus };
    if (draftId) {
      const result = await updateEmail(draftId, draftData);
      return { success: result.success, id: draftId, error: result.error };
    }
    return await createEmail(draftData, userId, organizationId);
  } catch (error: any) { return { success: false, id: null, error: error.message }; }
}

export async function trackEmailOpen(emailId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, emailId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const email = docSnap.data() as Email;
      const now = Timestamp.now();
      await updateDoc(docRef, { "tracking.opens": (email.tracking?.opens || 0) + 1, "tracking.lastOpenedAt": now, "tracking.firstOpenedAt": email.tracking?.firstOpenedAt || now, updatedAt: now });
    }
  } catch (error: any) {
    logger.error("Failed to track open", { module: "emails", action: "track-open", metadata: { emailId }, error });
  }
}

export async function trackEmailClick(emailId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, emailId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const email = docSnap.data() as Email;
      await updateDoc(docRef, { "tracking.clicks": (email.tracking?.clicks || 0) + 1, updatedAt: Timestamp.now() });
    }
  } catch (error: any) {
    logger.error("Failed to track click", { module: "emails", action: "track-click", metadata: { emailId }, error });
  }
}
