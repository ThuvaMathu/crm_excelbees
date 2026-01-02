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
  increment,
} from "firebase/firestore";
import { db } from "../firebase";
import type { EmailTemplate, EmailTemplateInput, EmailTemplateCategory } from "@/types/email";

const COLLECTION_NAME = "emailTemplates";



// Create a new email template
export async function createTemplate(
  data: Partial<EmailTemplateInput>,
  userId: string
): Promise<{
  success: boolean;
  id: string | null;
  error: string | null;
}> {
  try {
    console.log("📝 Creating email template:", data.name);
    
    const templateData = {
      ...data,
      isDefault: data.isDefault || false,
      isShared: data.isShared || false,
      isActive: data.isActive !== false,
      usageCount: 0,
      createdBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), templateData);
    console.log("✅ Template created with ID:", docRef.id);
    
    return {
      success: true,
      id: docRef.id,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to create template:", error.message);
    return {
      success: false,
      id: null,
      error: error.message,
    };
  }
}

// Get all email templates
export async function getTemplates(filters?: {
  category?: EmailTemplateCategory;
  isActive?: boolean;
  createdBy?: string;
}): Promise<{
  templates: EmailTemplate[];
  error: string | null;
}> {
  try {
    console.log("📋 Fetching email templates with filters:", filters);
    let q = query(collection(db, COLLECTION_NAME));

    // Apply filters
    if (filters?.category) {
      q = query(q, where("category", "==", filters.category));
    }
    if (filters?.isActive !== undefined) {
      q = query(q, where("isActive", "==", filters.isActive));
    }
    if (filters?.createdBy) {
      q = query(q, where("createdBy", "==", filters.createdBy));
    }

    // Order by name - DONE CLIENT SIDE TO AVOID INDEX ISSUES
    // q = query(q, orderBy("name", "asc"));

    const querySnapshot = await getDocs(q);
    console.log("📊 Templates fetched:", querySnapshot.size);

    let templates: EmailTemplate[] = [];
    querySnapshot.forEach((doc) => {
      templates.push({ id: doc.id, ...doc.data() } as EmailTemplate);
    });

    // Sort client-side
    templates.sort((a, b) => a.name.localeCompare(b.name));

    console.log("✅ Returning", templates.length, "templates");
    return {
      templates,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to fetch templates:", error.message);
    return {
      templates: [],
      error: error.message,
    };
  }
}

// Get a single template by ID
export async function getTemplate(id: string): Promise<{
  template: EmailTemplate | null;
  error: string | null;
}> {
  try {
    console.log("🔍 Fetching template:", id);
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("✅ Template found:", id);
      return {
        template: { id: docSnap.id, ...docSnap.data() } as EmailTemplate,
        error: null,
      };
    } else {
      console.warn("⚠️ Template not found:", id);
      return {
        template: null,
        error: "Template not found",
      };
    }
  } catch (error: any) {
    console.error("❌ Failed to fetch template:", error.message);
    return {
      template: null,
      error: error.message,
    };
  }
}

// Update a template
export async function updateTemplate(
  id: string,
  data: Partial<EmailTemplateInput>
): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("📝 Updating template:", id);
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    } as any);

    console.log("✅ Template updated successfully");
    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to update template:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Delete a template
export async function deleteTemplate(id: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    console.log("🗑️ Deleting template:", id);
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    console.log("✅ Template deleted successfully");
    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Failed to delete template:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Increment template usage count
export async function incrementUsageCount(id: string): Promise<void> {
  // Static templates are not stored in Firestore, so we don't track usage for them
  if (id.startsWith("static_")) {
    return;
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      usageCount: increment(1),
      lastUsedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    console.error("❌ Failed to increment usage count:", error.message);
  }
}


