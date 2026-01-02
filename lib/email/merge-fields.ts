// Merge field definitions for email templates
import type { MergeFieldCategory, Email } from "@/types/email";

export const mergeFieldCategories: Record<string, MergeFieldCategory> = {
  contact: {
    label: "Contact Information",
    fields: [
      { key: "contact.firstName", label: "First Name", example: "John" },
      { key: "contact.lastName", label: "Last Name", example: "Doe" },
      { key: "contact.fullName", label: "Full Name", example: "John Doe" },
      { key: "contact.email", label: "Email", example: "john@example.com" },
      { key: "contact.phone", label: "Phone", example: "+1 555-0123" },
      { key: "contact.company", label: "Company", example: "Acme Corp" },
      { key: "contact.jobTitle", label: "Job Title", example: "CEO" },
    ],
  },
  
  invoice: {
    label: "Invoice Details",
    fields: [
      { key: "invoice.number", label: "Invoice Number", example: "INV-2024-001" },
      { key: "invoice.date", label: "Invoice Date", example: "Dec 31, 2024" },
      { key: "invoice.dueDate", label: "Due Date", example: "Jan 30, 2025" },
      { key: "invoice.total", label: "Total Amount", example: "$1,234.56" },
      { key: "invoice.currency", label: "Currency", example: "USD" },
      { key: "invoice.status", label: "Status", example: "Sent" },
    ],
  },
  
  deal: {
    label: "Deal Information",
    fields: [
      { key: "deal.name", label: "Deal Name", example: "Q4 Enterprise Deal" },
      { key: "deal.value", label: "Deal Value", example: "$50,000" },
      { key: "deal.stage", label: "Deal Stage", example: "Negotiation" },
      { key: "deal.closeDate", label: "Expected Close Date", example: "Mar 31, 2025" },
    ],
  },
  
  user: {
    label: "Your Information",
    fields: [
      { key: "user.firstName", label: "Your First Name", example: "Jane" },
      { key: "user.lastName", label: "Your Last Name", example: "Smith" },
      { key: "user.fullName", label: "Your Full Name", example: "Jane Smith" },
      { key: "user.email", label: "Your Email", example: "jane@company.com" },
      { key: "user.phone", label: "Your Phone", example: "+1 555-0789" },
      { key: "user.jobTitle", label: "Your Job Title", example: "Account Manager" },
    ],
  },
  
  company: {
    label: "Company Information",
    fields: [
      { key: "company.name", label: "Company Name", example: "Your Company Inc" },
      { key: "company.address", label: "Company Address", example: "456 Business Ave" },
      { key: "company.phone", label: "Phone", example: "+1 555-1234" },
      { key: "company.website", label: "Website", example: "www.company.com" },
    ],
  },
  
  datetime: {
    label: "Date & Time",
    fields: [
      { key: "today", label: "Today's Date", example: "Dec 31, 2024" },
      { key: "tomorrow", label: "Tomorrow's Date", example: "Jan 1, 2025" },
      { key: "currentYear", label: "Current Year", example: "2024" },
      { key: "currentMonth", label: "Current Month", example: "December" },
    ],
  },
};

// Helper function to get nested value from object
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

// Resolve merge fields in template
export function resolveMergeFields(
  template: string,
  data: Record<string, any>
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, fieldPath) => {
    const trimmedPath = fieldPath.trim();
    
    // Handle special datetime fields
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const specialFields: Record<string, string> = {
      today: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      tomorrow: tomorrow.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      currentYear: now.getFullYear().toString(),
      currentMonth: now.toLocaleDateString("en-US", { month: "long" }),
    };
    
    if (specialFields[trimmedPath]) {
      return specialFields[trimmedPath];
    }
    
    // Get value from data object
    const value = getNestedValue(data, trimmedPath);
    
    if (value !== undefined && value !== null) {
      // Format numbers as currency if it looks like a currency field
      if (typeof value === "number" && (trimmedPath.includes("total") || trimmedPath.includes("value") || trimmedPath.includes("amount"))) {
        return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      
      // Format dates
      if (value instanceof Date || (typeof value === "object" && value.toDate)) {
        const date = value instanceof Date ? value : value.toDate();
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
      
      return String(value);
    }
    
    // Return original if not found
    return match;
  });
}

// Validate email address
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Parse email string (supports "Name <email@example.com>" format)
export function parseEmailString(emailString: string): { name?: string; email: string } {
  const match = emailString.match(/^(.+?)\s*<(.+?)>$/);
  
  if (match) {
    return {
      name: match[1].trim(),
      email: match[2].trim(),
    };
  }
  
  return {
    email: emailString.trim(),
  };
}

// Get merge field data from CRM entities
export async function getMergeFieldData(context: {
  contactId?: string;
  companyId?: string;
  dealId?: string;
  invoiceId?: string;
  userId?: string;
}): Promise<Record<string, any>> {
  const data: Record<string, any> = {};
  
  // In a real implementation, fetch data from Firestore
  // For now, return empty object - will be implemented with actual data fetching
  
  return data;
}

// Validate email before sending
export function validateEmail(email: Partial<Email>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  
  // Check recipients
  if (!email.to || email.to.length === 0) {
    errors.recipients = "At least one recipient is required";
  } else {
    const invalidRecipients = email.to.filter((r) => !r.isValid);
    if (invalidRecipients.length > 0) {
      errors.recipients = `Invalid email addresses: ${invalidRecipients.map((r) => r.email).join(", ")}`;
    }
  }
  
  // Check subject
  if (!email.subject || email.subject.trim().length === 0) {
    errors.subject = "Subject is required";
  } else if (email.subject.length > 200) {
    errors.subject = "Subject is too long (max 200 characters)";
  }
  
  // Check body
  if (!email.body || email.body.trim().length === 0) {
    errors.body = "Email body is required";
  }
  
  // Check attachments size
  if (email.attachments && email.attachments.length > 0) {
    const totalSize = email.attachments.reduce((sum, att) => sum + att.size, 0);
    const maxSize = 25 * 1024 * 1024; // 25MB
    
    if (totalSize > maxSize) {
      errors.attachments = "Total attachment size exceeds 25MB";
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
