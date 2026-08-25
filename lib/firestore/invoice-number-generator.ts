import { auth } from "../firebase";
import { logger } from "@/lib/logger/client";

/**
 * Generate the next sequential invoice number for an organization.
 *
 * The actual counter increment happens server-side (see
 * app/api/org/[orgId]/invoices/next-number/route.ts) via an Admin SDK
 * transaction, because the org doc's write rule is admin-only but any
 * active team member needs to be able to advance the shared counter when
 * creating an invoice.
 *
 * @param orgId - Organization ID
 * @returns Promise<string> - Generated invoice number (e.g., "INV-0001")
 */
export async function generateNextInvoiceNumber(orgId: string): Promise<string> {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Not authenticated");

    logger.info("Requesting next invoice number", { module: "invoices", action: "generate-number", metadata: { orgId } });

    const res = await fetch(`/api/org/${orgId}/invoices/next-number`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Server returned ${res.status}`);
    }

    return data.invoiceNumber;
  } catch (error: any) {
    logger.error("Error generating invoice number", { module: "invoices", action: "generate-number", metadata: { orgId }, error });

    // CRITICAL: Do NOT fallback to random numbers here — the caller
    // (createInvoice()) already has its own timestamp-based fallback for
    // when this throws, so a settings/network hiccup doesn't block
    // invoice creation entirely; re-throwing keeps that fallback in one
    // place instead of duplicating it.
    throw new Error(`Failed to generate sequential invoice number: ${error.message}`);
  }
}
