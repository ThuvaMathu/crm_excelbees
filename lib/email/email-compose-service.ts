import { sendEmail } from "./email-service";
import { resolveMergeFields } from "./merge-fields";
import type { Email, EmailContext } from "@/types/email";
import type { Contact, Company, Deal, Invoice } from "@/types/crm";
import { getContact } from "../firestore/contacts";
import { getCompany } from "../firestore/companies";
import { getDeal } from "../firestore/deals";
import { getInvoice } from "../firestore/invoices";
import { getAppUrl } from "../environment";
import { signValue } from "../crypto";
// Use Admin SDK for all server-side Firestore writes so they are not
// subject to client-auth rules (this module only runs in API routes).
import { adminDb } from "../firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { logger } from "@/lib/logger";

// Send email with merge field resolution
export async function sendEmailWithMergeFields(
  email: Email,
  context?: EmailContext
): Promise<{ success: boolean; error: string | null }> {
  try {
    logger.info("Sending email", { module: "email", action: "send", organizationId: email.organizationId, metadata: { subject: email.subject, emailId: email.id } });
    
    // Gather merge field data
    const mergeData = await gatherMergeFieldData(email, context);
    
    // Resolve merge fields in subject and body
    const resolvedSubject = resolveMergeFields(email.subject, mergeData);
    const resolvedBody = resolveMergeFields(email.body, mergeData);
    
    // Generate plain text version
    const plainText = generatePlainText(resolvedBody);
    
    // Prepare recipients
    const toEmails = email.to.map((r) => r.email);
    
    // Prepare attachments
    const attachments = email.attachments?.map((att) => ({
      filename: att.name,
      path: att.url, // Nodemailer supports URLs in path
    }));

    // Inject tracking pixel if enabled
    let finalBody = resolvedBody;
    if (email.tracking?.trackOpens && email.id) {
      finalBody = injectTrackingPixel(finalBody, email.id);
    }
    
    // Rewrite links for click tracking if enabled
    if (email.tracking?.trackClicks && email.id) {
      finalBody = rewriteLinksForTracking(finalBody, email.id);
    }

    // Build From display name: "User Name via ExcelBees" so recipients see who sent it.
    // Actual SMTP sender stays as the authenticated account; Reply-To routes replies to the user.
    const displayName = email.fromName
      ? `${email.fromName} via ExcelBees`
      : "ExcelBees CRM";
    const replyTo = email.from || undefined;

    // Send email using existing email service
    const result = await sendEmail(
      toEmails.join(", "),
      resolvedSubject,
      finalBody,
      undefined,
      attachments,
      undefined,
      undefined,
      replyTo,
      displayName,
      email.organizationId
    );
    
    if (result.success) {
      await adminUpdateEmailStatus(email.id, "sent", new Date());
      await logEmailToTimeline(email, context);
      logger.info("Email sent successfully", { module: "email", action: "send", organizationId: email.organizationId, metadata: { emailId: email.id } });
    } else {
      await adminUpdateEmailStatus(email.id, "failed");
      logger.error("Email send failed", { module: "email", action: "send", organizationId: email.organizationId, metadata: { emailId: email.id }, error: result.error });
    }

    return result;
  } catch (error: any) {
    logger.error("Failed to send email", { module: "email", action: "send", organizationId: email.organizationId, metadata: { emailId: email.id }, error });
    await adminUpdateEmailStatus(email.id, "failed");
    return {
      success: false,
      error: error.message,
    };
  }
}

// Gather merge field data from CRM
async function gatherMergeFieldData(
  email: Email,
  context?: EmailContext
): Promise<Record<string, any>> {
  const data: Record<string, any> = {};
  
  try {
    // Get contact data
    if (context?.contactId) {
      const { contact } = await getContact(context.contactId);
      if (contact) {
        data.contact = {
          firstName: contact.firstName,
          lastName: contact.lastName,
          fullName: `${contact.firstName} ${contact.lastName}`,
          email: contact.email,
          phone: contact.phone,
          company: contact.companyName,
          jobTitle: contact.jobTitle,
        };
      }
    } else if (email.to.length > 0 && email.to[0].contactId) {
      const { contact } = await getContact(email.to[0].contactId);
      if (contact) {
        data.contact = {
          firstName: contact.firstName,
          lastName: contact.lastName,
          fullName: `${contact.firstName} ${contact.lastName}`,
          email: contact.email,
          phone: contact.phone,
          company: contact.companyName,
          jobTitle: contact.jobTitle,
        };
      }
    }
    
    // Get company data
    if (context?.companyId) {
      const { company } = await getCompany(context.companyId);
      if (company) {
        data.company = {
          name: company.name,
          address: typeof company.billingAddress === 'string' 
            ? company.billingAddress 
            : `${company.billingAddress?.street || ''}, ${company.billingAddress?.city || ''}, ${company.billingAddress?.state || ''} ${company.billingAddress?.zipCode || ''}`.trim(),
          phone: company.phone,
        };
      }
    }
    
    // Get deal data
    if (context?.dealId) {
      const { deal } = await getDeal(context.dealId);
      if (deal) {
        data.deal = {
          name: deal.title,
          value: deal.value,
          stage: deal.stage,
          closeDate: deal.closeDate,
        };
      }
    }
    
    // Get invoice data
    if (context?.invoiceId) {
      const { invoice } = await getInvoice(context.invoiceId);
      if (invoice) {
        data.invoice = {
          number: invoice.invoiceNumber,
          date: invoice.issueDate,
          dueDate: invoice.dueDate,
          total: invoice.total,
          currency: invoice.currency,
          status: invoice.status,
        };
      }
    }
    
    // Add user data (from email sender)
    data.user = {
      fullName: email.fromName || email.from,
      email: email.from,
      // Add more user fields as needed
    };
    
    // Company info (your company)
    data.company = data.company || {
      name: "Your Company", // TODO: Get from settings
      address: "123 Business St",
      phone: "+1 234 567 8900",
      website: "www.yourcompany.com",
    };
    
  } catch (error: any) {
    logger.error("Error gathering merge field data", { module: "email", action: "gather-merge-fields", error });
  }
  
  return data;
}

// Generate plain text from HTML
function generatePlainText(html: string): string {
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, "");
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Remove extra whitespace
  text = text.replace(/\s+/g, " ").trim();
  
  return text;
}

// ============================================================================
// Admin SDK helpers — used only in this server-side module
// ============================================================================

async function adminUpdateEmailStatus(
  id: string,
  status: string,
  sentAt?: Date
): Promise<void> {
  try {
    logger.debug("Updating email status", { module: "email", action: "update-status", metadata: { emailId: id, status } });
    const patch: Record<string, unknown> = {
      status,
      updatedAt: Timestamp.now(),
    };
    if (status === "sent" && sentAt) {
      patch.sentAt = Timestamp.fromDate(sentAt);
    }
    await adminDb.collection("emails").doc(id).update(patch);
    logger.debug("Email status updated", { module: "email", action: "update-status", metadata: { emailId: id, status } });
  } catch (error: any) {
    logger.error("Failed to update email status", { module: "email", action: "update-status", metadata: { emailId: id }, error });
  }
}

async function adminCreateActivity(data: {
  type: string;
  content: string;
  performedBy: string;
  performedByName: string;
  relatedTo: { collection: string; id: string };
}): Promise<void> {
  try {
    logger.debug("Creating activity", { module: "email", action: "create-activity", metadata: { type: data.type } });
    const payload: Record<string, unknown> = { ...data, createdAt: Timestamp.now() };
    // Remove undefined values — Firestore rejects them
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });
    await adminDb.collection("activities").add(payload);
    logger.debug("Activity created", { module: "email", action: "create-activity", metadata: { type: data.type } });
  } catch (error: any) {
    logger.error("Failed to create activity", { module: "email", action: "create-activity", error });
  }
}

// ============================================================================

// Log email to CRM timeline
async function logEmailToTimeline(
  email: Email,
  context?: EmailContext
): Promise<void> {
  try {
    if (!email.relatedTo && !context?.relatedRecordId) {
      return; // No CRM entity to log to
    }

    const relatedTo = email.relatedTo || {
      collection:
        context?.type === "invoice"
          ? "invoices"
          : context?.type === "deal"
          ? "deals"
          : context?.type === "contact"
          ? "contacts"
          : context?.type === "company"
          ? "companies"
          : "emails",
      id: context?.relatedRecordId || email.id,
    };

    await adminCreateActivity({
      type: "email",
      content: `Email sent: ${email.subject}`,
      performedBy: email.createdBy,
      performedByName: email.createdByName || email.fromName || "Unknown",
      relatedTo,
    });

    logger.debug("Email logged to CRM timeline", { module: "email", action: "log-timeline", metadata: { emailId: email.id } });
  } catch (error: any) {
    logger.error("Failed to log email to timeline", { module: "email", action: "log-timeline", metadata: { emailId: email.id }, error });
  }
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

// Schedule email for later
export async function scheduleEmail(
  email: Email,
  scheduledFor: Date
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Update email with scheduled time
    await adminUpdateEmailStatus(email.id, "scheduled");
    
    // In a production app, you would:
    // 1. Use a job queue (Bull, Agenda, etc.)
    // 2. Or use Firebase Cloud Functions with scheduled triggers
    // 3. Or use a third-party service like SendGrid scheduled sends
    
    logger.info("Email scheduled", { module: "email", action: "schedule", metadata: { emailId: email.id, scheduledFor: scheduledFor.toISOString() } });
    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    logger.error("Failed to schedule email", { module: "email", action: "schedule", metadata: { emailId: email.id }, error });
    return {
      success: false,
      error: error.message,
    };
  }
}
// Inject tracking pixel
function injectTrackingPixel(html: string, emailId: string): string {
  const baseUrl = getAppUrl();
  const sig = signValue(`open:${emailId}`);
  const pixelUrl = `${baseUrl}/api/email/track/open/${emailId}?sig=${sig}`;
  const pixelHtml = `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:none;width:1px;height:1px;opacity:0;" />`;
  
  // Insert before closing body tag if exists, otherwise append
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixelHtml}</body>`);
  } else {
    return `${html}${pixelHtml}`;
  }
}

// Rewrite links for tracking
function rewriteLinksForTracking(html: string, emailId: string): string {
  const baseUrl = getAppUrl();
  const trackingBaseUrl = `${baseUrl}/api/email/track/click`;
  
  // Simple regex to match href attributes
  // Note: A proper HTML parser would be more robust, but regex works for most generated email HTML
  return html.replace(/<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["']([^>]*)>/gi, (match, url, rest) => {
    // Skip anchor links, mailto:, tel:, and already tracked links
    if (
      url.startsWith("#") || 
      url.startsWith("mailto:") || 
      url.startsWith("tel:") ||
      url.startsWith(trackingBaseUrl)
    ) {
      return match;
    }
    
    const encodedUrl = encodeURIComponent(url);
    const sig = signValue(`${emailId}:${url}`);
    const trackingUrl = `${trackingBaseUrl}?id=${emailId}&url=${encodedUrl}&sig=${sig}`;

    return `<a href="${trackingUrl}"${rest}>`;
  });
}
