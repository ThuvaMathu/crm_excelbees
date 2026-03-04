import { Campaign, CampaignStats, Contact, Audience } from "@/types/email-campaigns";
import { Timestamp } from "firebase/firestore";

/**
 * Generate a unique campaign ID
 */
export function generateCampaignId(): string {
  return `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique audience ID
 */
export function generateAudienceId(): string {
  return `audience_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique template ID
 */
export function generateTemplateId(): string {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique workflow ID
 */
export function generateWorkflowId(): string {
  return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate campaign statistics
 */
export function calculateCampaignStats(
  sent: number,
  delivered: number,
  opened: number,
  clicked: number,
  bounced: number,
  unsubscribed: number
): CampaignStats {
  const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
  const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
  const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
  const clickToOpenRate = opened > 0 ? (clicked / opened) * 100 : 0;
  const unsubscribeRate = delivered > 0 ? (unsubscribed / delivered) * 100 : 0;

  return {
    sent,
    delivered,
    bounced,
    opened,
    clicked,
    unsubscribed,
    complained: 0,
    deliveryRate: Math.round(deliveryRate * 10) / 10,
    openRate: Math.round(openRate * 10) / 10,
    clickRate: Math.round(clickRate * 10) / 10,
    clickToOpenRate: Math.round(clickToOpenRate * 10) / 10,
    unsubscribeRate: Math.round(unsubscribeRate * 10) / 10,
    lastUpdatedAt: Timestamp.now(),
  };
}

/**
 * Format campaign status for display
 */
export function formatCampaignStatus(status: Campaign["status"]): string {
  const statusMap: Record<Campaign["status"], string> = {
    draft: "Draft",
    scheduled: "Scheduled",
    sending: "Sending",
    sent: "Sent",
    paused: "Paused",
    archived: "Archived",
    failed: "Failed",
  };
  return statusMap[status] || status;
}

/**
 * Get status color class
 */
export function getCampaignStatusColor(status: Campaign["status"]): string {
  const colorMap: Record<Campaign["status"], string> = {
    draft: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800",
    scheduled: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900",
    sending: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900",
    sent: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900",
    paused: "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900",
    archived: "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800",
    failed: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900",
  };
  return colorMap[status] || colorMap.draft;
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parse CSV contacts
 */
export function parseCSVContacts(csvContent: string): Contact[] {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const emailIndex = headers.findIndex((h) => h === "email");
  if (emailIndex === -1) {
    throw new Error("CSV must contain an 'email' column");
  }

  const firstNameIndex = headers.findIndex((h) => h === "firstname" || h === "first_name");
  const lastNameIndex = headers.findIndex((h) => h === "lastname" || h === "last_name");
  const companyIndex = headers.findIndex((h) => h === "company");

  const contacts: Contact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const email = values[emailIndex];

    if (email && isValidEmail(email)) {
      contacts.push({
        id: `contact_${Date.now()}_${i}`,
        email,
        firstName: firstNameIndex >= 0 ? values[firstNameIndex] : undefined,
        lastName: lastNameIndex >= 0 ? values[lastNameIndex] : undefined,
        company: companyIndex >= 0 ? values[companyIndex] : undefined,
        subscribed: true,
        bounced: false,
        complained: false,
        totalOpens: 0,
        totalClicks: 0,
        source: "import",
        subscribedAt: Timestamp.now(),
      });
    }
  }

  return contacts;
}

/**
 * Generate tracking pixel URL
 */
export function generateTrackingPixelUrl(campaignId: string, contactId: string): string {
  return `/api/marketing/campaigns/track/open?c=${campaignId}&ct=${contactId}`;
}

/**
 * Generate click tracking URL
 */
export function generateClickTrackingUrl(
  campaignId: string,
  contactId: string,
  linkId: string,
  originalUrl: string
): string {
  const params = new URLSearchParams({
    c: campaignId,
    ct: contactId,
    l: linkId,
    u: originalUrl,
  });
  return `/api/marketing/campaigns/track/click?${params.toString()}`;
}

/**
 * Wrap links in email content with tracking URLs
 */
export function wrapLinksWithTracking(
  html: string,
  campaignId: string,
  contactId: string
): string {
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi;
  let linkId = 0;

  return html.replace(linkRegex, (match, url) => {
    linkId++;
    const trackingUrl = generateClickTrackingUrl(
      campaignId,
      contactId,
      `link_${linkId}`,
      url
    );
    return match.replace(url, trackingUrl);
  });
}

/**
 * Inject tracking pixel into email HTML
 */
export function injectTrackingPixel(html: string, campaignId: string, contactId: string): string {
  const pixelUrl = generateTrackingPixelUrl(campaignId, contactId);
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`;

  // Try to inject before closing body tag
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`);
  }

  // Otherwise append to end
  return html + pixel;
}

/**
 * Replace merge tags in content
 */
export function replaceMergeTags(
  content: string,
  contact: Partial<Contact>,
  customData?: Record<string, any>
): string {
  let result = content;

  // Standard merge tags
  const mergeTags: Record<string, string> = {
    "{{FirstName}}": contact.firstName || "",
    "{{LastName}}": contact.lastName || "",
    "{{Email}}": contact.email || "",
    "{{Company}}": contact.company || "",
  };

  // Custom fields
  if (customData) {
    Object.keys(customData).forEach((key) => {
      mergeTags[`{{${key}}}`] = String(customData[key]);
    });
  }

  // Replace all merge tags
  Object.entries(mergeTags).forEach(([tag, value]) => {
    result = result.replace(new RegExp(tag, "g"), value);
  });

  return result;
}

/**
 * Calculate engagement score for a contact (0-100)
 */
export function calculateEngagementScore(contact: Contact): number {
  let score = 0;

  // Opens contribute 40 points max
  score += Math.min(contact.totalOpens * 4, 40);

  // Clicks contribute 60 points max
  score += Math.min(contact.totalClicks * 12, 60);

  // Recent activity bonus
  const now = Date.now();
  if (contact.lastOpenedAt) {
    const daysSinceOpen = (now - contact.lastOpenedAt.toMillis()) / (1000 * 60 * 60 * 24);
    if (daysSinceOpen < 7) score += 10;
    else if (daysSinceOpen < 30) score += 5;
  }

  return Math.min(Math.round(score), 100);
}

/**
 * Clean object by removing undefined values (for Firestore)
 */
export function cleanObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => cleanObject(v)).filter((v) => v !== undefined);
  } else if (obj !== null && typeof obj === "object" && !(obj instanceof Date) && !(obj instanceof Timestamp)) {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, cleanObject(v)])
        .filter(([_, v]) => v !== undefined)
    );
  }
  return obj;
}

/**
 * Format date for display
 */
export function formatCampaignDate(date: any, includeTime: boolean = true): string {
  let d: Date;

  if (date instanceof Timestamp) {
    d = date.toDate();
  } else if (date instanceof Date) {
    d = date;
  } else if (date && typeof date === 'object' && '_seconds' in date) {
    // Serialized Firestore timestamp from JSON API response
    d = new Date(date._seconds * 1000);
  } else if (date && typeof date === 'object' && 'seconds' in date) {
    // Alternative serialized format
    d = new Date(date.seconds * 1000);
  } else {
    // String or number
    d = new Date(date);
  }

  if (isNaN(d.getTime())) return "N/A";

  const dateStr = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (!includeTime) return dateStr;

  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${dateStr} at ${timeStr}`;
}

/**
 * Estimate send time based on recipient count and throttling
 */
export function estimateSendTime(recipientCount: number, emailsPerHour: number): string {
  const hours = recipientCount / emailsPerHour;

  if (hours < 1) {
    const minutes = Math.ceil(hours * 60);
    return `~${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }

  const roundedHours = Math.ceil(hours);
  return `~${roundedHours} hour${roundedHours !== 1 ? "s" : ""}`;
}
