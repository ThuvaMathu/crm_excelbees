import { Lead, Deal, Contact, Company, Project, Task, Invoice } from "@/types/crm";

/**
 * Approximate token count for a string (4 characters ≈ 1 token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to a maximum token count
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
  const estimated = estimateTokens(text);
  if (estimated <= maxTokens) return text;

  const charLimit = maxTokens * 4;
  return text.slice(0, charLimit) + "...(truncated)";
}

export function buildLeadContext(lead: Lead): string {
  return `
LEAD PROFILE:
Name: ${lead.firstName} ${lead.lastName}
Email: ${lead.email}
Company: ${lead.companyName || "N/A"}
Job Title: ${lead.jobTitle || "N/A"}
Status: ${lead.status}
Source: ${lead.source}
Value: ${lead.value ? `$${lead.value}` : "N/A"}
Notes: ${lead.notes || "No notes"}
Tags: ${lead.tags.join(", ") || "None"}
  `.trim();
}

export function buildDealContext(deal: Deal): string {
  return `
DEAL DETAILS:
Title: ${deal.title}
Stage: ${deal.stage}
Value: $${deal.value}
Probability: ${deal.probability}%
Company: ${deal.companyName || "N/A"}
Close Date: ${deal.closeDate ? new Date(deal.closeDate.seconds * 1000).toLocaleDateString() : "N/A"}
Description: ${deal.description || "N/A"}
Notes: ${deal.notes || "No notes"}
  `.trim();
}

export function buildContactContext(contact: Contact): string {
  return `
CONTACT PROFILE:
Name: ${contact.firstName} ${contact.lastName}
Email: ${contact.email}
Phone: ${contact.phone || "N/A"}
Company: ${contact.companyName || "N/A"}
Job Title: ${contact.jobTitle || "N/A"}
Notes: ${contact.notes || "No notes"}
  `.trim();
}

export function buildCompanyContext(company: Company): string {
  return `
COMPANY PROFILE:
Name: ${company.name}
Industry: ${company.industry || "N/A"}
Size: ${company.size || "N/A"}
Description: ${company.description || "N/A"}
Domain: ${company.domain || "N/A"}
Notes: ${company.notes || "No notes"}
  `.trim();
}

export function buildTaskContext(task: Task): string {
  return `
TASK DETAILS:
Title: ${task.title}
Status: ${task.status}
Priority: ${task.priority}
Due Date: ${task.dueDate ? new Date(task.dueDate.seconds * 1000).toLocaleDateString() : "N/A"}
Description: ${task.description || "N/A"}
  `.trim();
}
