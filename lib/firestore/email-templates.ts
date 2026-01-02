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

    // Order by name
    q = query(q, orderBy("name", "asc"));

    const querySnapshot = await getDocs(q);
    console.log("📊 Templates fetched:", querySnapshot.size);

    const templates: EmailTemplate[] = [];
    querySnapshot.forEach((doc) => {
      templates.push({ id: doc.id, ...doc.data() } as EmailTemplate);
    });

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

// Seed default templates
export async function seedDefaultTemplates(userId: string): Promise<void> {
  try {
    console.log("🌱 Seeding default email templates...");
    
    const defaultTemplates: Partial<EmailTemplateInput>[] = [
      {
        name: "Invoice Email",
        description: "Send invoice to client",
        category: "invoice",
        subject: "Invoice {{invoice.number}} from {{company.name}}",
        body: `<p>Dear {{contact.firstName}},</p>

<p>I hope this email finds you well. Please find attached Invoice {{invoice.number}} for {{invoice.total}}.</p>

<p><strong>Invoice Details:</strong></p>
<ul>
  <li>Invoice Number: {{invoice.number}}</li>
  <li>Invoice Date: {{invoice.date}}</li>
  <li>Due Date: {{invoice.dueDate}}</li>
  <li>Amount Due: {{invoice.total}}</li>
</ul>

<p>Please process payment by {{invoice.dueDate}} to avoid any late fees.</p>

<p>If you have any questions, please don't hesitate to contact me.</p>

<p>Best regards,<br>
{{user.fullName}}<br>
{{user.jobTitle}}<br>
{{company.name}}</p>`,
        isDefault: true,
        isShared: true,
      },
      {
        name: "Quote Email",
        description: "Send quote to prospect",
        category: "quote",
        subject: "Quote for {{deal.name}}",
        body: `<p>Dear {{contact.firstName}},</p>

<p>Thank you for your interest in {{company.name}}. I'm pleased to provide you with a quote for {{deal.name}}.</p>

<p>Please review the attached quote and let me know if you have any questions.</p>

<p>This quote is valid for 30 days from {{today}}.</p>

<p>Looking forward to working with you!</p>

<p>Best regards,<br>
{{user.fullName}}<br>
{{user.jobTitle}}<br>
{{company.name}}</p>`,
        isDefault: true,
        isShared: true,
      },
      {
        name: "Follow-up Email",
        description: "Follow up with contact",
        category: "follow-up",
        subject: "Following up on {{deal.name}}",
        body: `<p>Hi {{contact.firstName}},</p>

<p>I wanted to follow up on our recent conversation about {{deal.name}}.</p>

<p>Do you have any questions or need any additional information?</p>

<p>I'm here to help!</p>

<p>Best regards,<br>
{{user.fullName}}<br>
{{user.jobTitle}}<br>
{{company.name}}</p>`,
        isDefault: true,
        isShared: true,
      },
      {
        name: "Payment Reminder",
        description: "Remind client about payment",
        category: "reminder",
        subject: "Payment Reminder - Invoice {{invoice.number}}",
        body: `<p>Dear {{contact.firstName}},</p>

<p>This is a friendly reminder that Invoice {{invoice.number}} for {{invoice.total}} is due on {{invoice.dueDate}}.</p>

<p>Please process payment at your earliest convenience.</p>

<p>Thank you for your business!</p>

<p>Best regards,<br>
{{user.fullName}}<br>
{{user.jobTitle}}<br>
{{company.name}}</p>`,
        isDefault: true,
        isShared: true,
      },
      {
        name: "General Email",
        description: "General purpose email template",
        category: "general",
        subject: "",
        body: `<p>Dear {{contact.firstName}},</p>

<p>[Your message here]</p>

<p>Best regards,<br>
{{user.fullName}}<br>
{{user.jobTitle}}<br>
{{company.name}}</p>`,
        isDefault: true,
        isShared: true,
      },
    ];

    for (const template of defaultTemplates) {
      await createTemplate(template, userId);
    }

    console.log("✅ Default templates seeded successfully");
  } catch (error: any) {
    console.error("❌ Failed to seed default templates:", error.message);
  }
}
