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
import type { Contact, ContactInput, ContactFilters } from "@/types/crm";

const COLLECTION_NAME = "contacts";

// Create a new contact
export async function createContact(data: ContactInput, userId: string) {
  try {
    const contactData = {
      ...data,
      ownerId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), contactData);
    
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

// Get all contacts with optional filters
export async function getContacts(filters?: ContactFilters) {
  try {
    console.log("Fetching contacts with filters:", filters);
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (filters?.companyId) {
      constraints.push(where("companyId", "==", filters.companyId));
    }
    if (filters?.ownerId) {
      constraints.push(where("ownerId", "==", filters.ownerId));
    }

    // Only add ordering if we have filters (to avoid index requirements)
    if (constraints.length > 0) {
      constraints.push(orderBy("createdAt", "desc"));
    }

    const q = constraints.length > 0 
      ? query(collection(db, COLLECTION_NAME), ...constraints)
      : collection(db, COLLECTION_NAME);
      
    const querySnapshot = await getDocs(q);
    console.log("Contacts fetched:", querySnapshot.size);

    const contacts: Contact[] = [];
    querySnapshot.forEach((doc) => {
      contacts.push({ id: doc.id, ...doc.data() } as Contact);
    });

    // Sort by createdAt on client side
    contacts.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    // Apply client-side search filter if provided
    let filteredContacts = contacts;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredContacts = contacts.filter(
        (contact) =>
          contact.firstName.toLowerCase().includes(searchLower) ||
          contact.lastName.toLowerCase().includes(searchLower) ||
          contact.email.toLowerCase().includes(searchLower) ||
          contact.companyName?.toLowerCase().includes(searchLower)
      );
    }

    return {
      contacts: filteredContacts,
      error: null,
    };
  } catch (error: any) {
    console.error("Error in getContacts:", error);
    return {
      contacts: [],
      error: error.message,
    };
  }
}

// Get a single contact by ID
export async function getContact(id: string) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        contact: { id: docSnap.id, ...docSnap.data() } as Contact,
        error: null,
      };
    } else {
      return {
        contact: null,
        error: "Contact not found",
      };
    }
  } catch (error: any) {
    return {
      contact: null,
      error: error.message,
    };
  }
}

// Update a contact
export async function updateContact(id: string, data: Partial<ContactInput>) {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });

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

// Delete a contact
export async function deleteContact(id: string) {
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

// Bulk import contacts
export async function importContacts(contacts: ContactInput[], userId: string) {
  try {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const contact of contacts) {
      const { success, error } = await createContact(contact, userId);
      if (success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(error || "Unknown error");
      }
    }

    return {
      results,
      error: null,
    };
  } catch (error: any) {
    return {
      results: null,
      error: error.message,
    };
  }
}
