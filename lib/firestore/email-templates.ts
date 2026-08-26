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
import { logger } from "@/lib/logger/client";

const COLLECTION_NAME = "emailTemplates";



// Create a new email template
export async function createTemplate(
  data: Partial<EmailTemplateInput>,
  userId: string,
  organizationId?: string
): Promise<{
  success: boolean;
  id: string | null;
  error: string | null;
}> {
  try {
    const templateData: any = {
      ...data,
      isDefault: data.isDefault || false,
      isShared: data.isShared || false,
      isActive: data.isActive !== false,
      usageCount: 0,
      createdBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    if (organizationId) templateData.organizationId = organizationId;

    const docRef = await addDoc(collection(db, COLLECTION_NAME), templateData);
    logger.info("Template created", { module: "email-templates", action: "create", metadata: { templateId: docRef.id } });
    
    return {
      success: true,
      id: docRef.id,
      error: null,
    };
  } catch (error: any) {
    logger.error("Failed to create template", { module: "email-templates", action: "create", error });
    return {
      success: false,
      id: null,
      error: error.message,
    };
  }
}

// Get all email templates
export async function getTemplates(
  organizationIdOrFilters?: string | {
    category?: EmailTemplateCategory;
    isActive?: boolean;
    createdBy?: string;
  },
  filters?: {
    category?: EmailTemplateCategory;
    isActive?: boolean;
    createdBy?: string;
  }
): Promise<{
  templates: EmailTemplate[];
  error: string | null;
}> {
  let organizationId: string | undefined;
  if (typeof organizationIdOrFilters === "string") {
    organizationId = organizationIdOrFilters;
  } else if (organizationIdOrFilters) {
    filters = organizationIdOrFilters;
  }

  try {
    let q = query(collection(db, COLLECTION_NAME));

    // Apply org scope
    if (organizationId) {
      q = query(q, where("organizationId", "==", organizationId));
    }

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

    let templates: EmailTemplate[] = [];
    querySnapshot.forEach((doc) => {
      templates.push({ id: doc.id, ...doc.data() } as EmailTemplate);
    });

    // Sort client-side
    templates.sort((a, b) => a.name.localeCompare(b.name));

    return {
      templates,
      error: null,
    };
  } catch (error: any) {
    logger.error("Failed to fetch templates", { module: "email-templates", action: "fetch", error });
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
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        template: { id: docSnap.id, ...docSnap.data() } as EmailTemplate,
        error: null,
      };
    } else {
      logger.warn("Template not found", { module: "email-templates", action: "fetch", metadata: { templateId: id } });
      return {
        template: null,
        error: "Template not found",
      };
    }
  } catch (error: any) {
    logger.error("Failed to fetch template", { module: "email-templates", action: "fetch", metadata: { templateId: id }, error });
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
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    } as any);

    logger.info("Template updated", { module: "email-templates", action: "update", metadata: { templateId: id } });
    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    logger.error("Failed to update template", { module: "email-templates", action: "update", metadata: { templateId: id }, error });
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
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    logger.info("Template deleted", { module: "email-templates", action: "delete", metadata: { templateId: id } });
    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    logger.error("Failed to delete template", { module: "email-templates", action: "delete", metadata: { templateId: id }, error });
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
    logger.error("Failed to increment usage count", { module: "email-templates", action: "increment-usage", metadata: { templateId: id }, error });
  }
}


