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
import type { Email, EmailInput, EmailStatus } from "@/types/email";

const COLLECTION_NAME = "emails";

// Create a new email
export async function createEmail(
  data: Partial<EmailInput>,
  userId: string
): Promise<{
  success: boolean;
  id: string | null;
  error: string | null;
}> {
  try {
    console.log("📧 Creating email:", data.subject);
    
    const emailData = {
      ...data,
      status: data.status || "draft",
      ownerId: userId,
      createdBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      tracking: {
        trackOpens: data.tracking?.trackOpens ?? true,
        trackClicks: data.tracking?.trackClicks ?? true,
        opens: 0,
        clicks: 0,
      },
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), emailData);
    console.log("✅ Email created with ID:", docRef.id);
    
    return {
      success: true,
      id: docRef.id,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to create email:", error.message);
    return {
      success: false,
      id: null,
      error: error.message,
    };
  }
}

// Get all emails with optional filters
export async function getEmails(filters?: {
  status?: EmailStatus;
  ownerId?: string;
  relatedTo?: { collection: string; id: string };
  search?: string;
}): Promise<{
  emails: Email[];
  error: string | null;
}> {
  try {
    console.log("📋 Fetching emails with filters:", filters);
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (filters?.status) {
      constraints.push(where("status", "==", filters.status));
    }
    if (filters?.ownerId) {
      constraints.push(where("ownerId", "==", filters.ownerId));
    }
    if (filters?.relatedTo) {
      constraints.push(where("relatedTo.collection", "==", filters.relatedTo.collection));
      constraints.push(where("relatedTo.id", "==", filters.relatedTo.id));
    }

    // Add ordering
    constraints.push(orderBy("createdAt", "desc"));

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);
    console.log("📊 Emails fetched:", querySnapshot.size);

    const emails: Email[] = [];
    querySnapshot.forEach((doc) => {
      emails.push({ id: doc.id, ...doc.data() } as Email);
    });

    // Apply client-side search filter
    let filteredEmails = emails;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredEmails = emails.filter(
        (email) =>
          email.subject.toLowerCase().includes(searchLower) ||
          email.to.some((recipient) => 
            recipient.email.toLowerCase().includes(searchLower) ||
            recipient.name?.toLowerCase().includes(searchLower)
          )
      );
    }

    console.log("✅ Returning", filteredEmails.length, "emails");
    return {
      emails: filteredEmails,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to fetch emails:", error.message);
    return {
      emails: [],
      error: error.message,
    };
  }
}

// Get a single email by ID
export async function getEmail(id: string): Promise<{
  email: Email | null;
  error: string | null;
}> {
  try {
    console.log("🔍 Fetching email:", id);
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("✅ Email found:", id);
      return {
        email: { id: docSnap.id, ...docSnap.data() } as Email,
        error: null,
      };
    } else {
      console.warn("⚠️ Email not found:", id);
      return {
        email: null,
        error: "Email not found",
      };
    }
  } catch (error: any) {
    console.error("❌ Failed to fetch email:", error.message);
    return {
      email: null,
      error: error.message,
    };
  }
}

// Update an email
export async function updateEmail(
  id: string,
  data: Partial<EmailInput>
): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("📝 Updating email:", id);
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    } as any);

    console.log("✅ Email updated successfully");
    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to update email:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Update email status
export async function updateEmailStatus(
  id: string,
  status: EmailStatus,
  sentAt?: Date
): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("📝 Updating email status:", id, "to", status);
    const docRef = doc(db, COLLECTION_NAME, id);
    
    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
    };

    if (status === "sent" && sentAt) {
      updateData.sentAt = Timestamp.fromDate(sentAt);
    }

    await updateDoc(docRef, updateData);

    console.log("✅ Email status updated");
    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to update email status:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Delete an email
export async function deleteEmail(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("🗑️ Deleting email:", id);
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    console.log("✅ Email deleted successfully");
    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to delete email:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Save email as draft
export async function saveDraft(
  data: Partial<EmailInput>,
  userId: string,
  draftId?: string
): Promise<{
  success: boolean;
  id: string | null;
  error: string | null;
}> {
  try {
    const draftData = {
      ...data,
      status: "draft" as EmailStatus,
    };

    if (draftId) {
      // Update existing draft
      const result = await updateEmail(draftId, draftData);
      return {
        success: result.success,
        id: draftId,
        error: result.error,
      };
    } else {
      // Create new draft
      return await createEmail(draftData, userId);
    }
  } catch (error: any) {
    console.error("❌ Failed to save draft:", error.message);
    return {
      success: false,
      id: null,
      error: error.message,
    };
  }
}

// Track email open
export async function trackEmailOpen(emailId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, emailId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const email = docSnap.data() as Email;
      const now = Timestamp.now();
      
      await updateDoc(docRef, {
        "tracking.opens": (email.tracking?.opens || 0) + 1,
        "tracking.lastOpenedAt": now,
        "tracking.firstOpenedAt": email.tracking?.firstOpenedAt || now,
        updatedAt: now,
      });
    }
  } catch (error: any) {
    console.error("❌ Failed to track email open:", error.message);
  }
}

// Track email click
export async function trackEmailClick(emailId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, emailId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const email = docSnap.data() as Email;
      
      await updateDoc(docRef, {
        "tracking.clicks": (email.tracking?.clicks || 0) + 1,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error: any) {
    console.error("❌ Failed to track email click:", error.message);
  }
}
