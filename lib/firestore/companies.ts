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
import type { Company, CompanyInput, CompanyFilters, Address } from "@/types/crm";

const COLLECTION_NAME = "companies";

// Create a new company
export async function createCompany(data: CompanyInput, userId: string): Promise<{
  success: boolean;
  id: string | null;
  error: string | null;
}> {
  try {
    const companyData = {
      ...data,
      ownerId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), companyData);
    
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

// Get all companies with optional filters
export async function getCompanies(filters?: CompanyFilters): Promise<{
  companies: Company[];
  error: string | null;
}> {
  try {
    console.log("Fetching companies with filters:", filters);
    const constraints: QueryConstraint[] = [];

    // Apply filters
    if (filters?.industry) {
      constraints.push(where("industry", "==", filters.industry));
    }
    if (filters?.size) {
      constraints.push(where("size", "==", filters.size));
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
    console.log("Companies fetched:", querySnapshot.size);

    const companies: Company[] = [];
    querySnapshot.forEach((doc) => {
      companies.push({ id: doc.id, ...doc.data() } as Company);
    });

    // Sort by createdAt on client side
    companies.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    // Apply client-side search filter if provided
    let filteredCompanies = companies;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredCompanies = companies.filter(
        (company) =>
          company.name.toLowerCase().includes(searchLower) ||
          company.domain?.toLowerCase().includes(searchLower) ||
          company.industry?.toLowerCase().includes(searchLower)
      );
    }

    return {
      companies: filteredCompanies,
      error: null,
    };
  } catch (error: any) {
    console.error("Error in getCompanies:", error);
    return {
      companies: [],
      error: error.message,
    };
  }
}

// Get a single company by ID
export async function getCompany(id: string): Promise<{
  company: Company | null;
  error: string | null;
}> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        company: { id: docSnap.id, ...docSnap.data() } as Company,
        error: null,
      };
    } else {
      return {
        company: null,
        error: "Company not found",
      };
    }
  } catch (error: any) {
    return {
      company: null,
      error: error.message,
    };
  }
}

// Update a company
export async function updateCompany(id: string, data: Partial<CompanyInput>): Promise<{
  success: boolean;
  error: string | null;
}> {
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

// Delete a company
export async function deleteCompany(id: string): Promise<{
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

// Get contacts for a company
export async function getCompanyContacts(companyId: string) {
  try {
    const q = query(
      collection(db, "contacts"),
      where("companyId", "==", companyId)
    );

    const querySnapshot = await getDocs(q);
    const contacts: any[] = [];

    querySnapshot.forEach((doc) => {
      contacts.push({ id: doc.id, ...doc.data() });
    });

    return {
      contacts,
      error: null,
    };
  } catch (error: any) {
    return {
      contacts: [],
      error: error.message,
    };
  }
}
