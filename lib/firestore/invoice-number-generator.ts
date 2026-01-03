import { getUserInvoiceSettings, setUserInvoiceSettings } from "./users";
import type { InvoiceUserSettings } from "@/types/crm";

/**
 * Generate the next sequential invoice number for a user
 * @param userId - User ID
 * @returns Promise<string> - Generated invoice number (e.g., "INV-001")
 */
export async function generateNextInvoiceNumber(userId: string): Promise<string> {
  try {
    // Get user's invoice settings
    const { settings, error } = await getUserInvoiceSettings(userId);

    if (error) {
      console.error("Failed to get invoice settings:", error);
      // Fallback to default
      return `INV-${String(Date.now()).slice(-6)}`;
    }

    // Use settings or defaults
    const prefix = settings?.invoicePrefix || "INV-";
    const nextNumber = settings?.nextInvoiceNumber || 1;

    // Format number with leading zeros (3 digits minimum)
    const formattedNumber = String(nextNumber).padStart(3, "0");
    const invoiceNumber = `${prefix}${formattedNumber}`;

    // Increment the counter for next time
    const updatedSettings: Partial<InvoiceUserSettings> = {
      ...settings,
      nextInvoiceNumber: nextNumber + 1,
    };

    // Save the incremented counter
    await setUserInvoiceSettings(userId, updatedSettings as InvoiceUserSettings);

    return invoiceNumber;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    // Fallback to timestamp-based number
    return `INV-${String(Date.now()).slice(-6)}`;
  }
}

/**
 * Manually set the next invoice number (useful for importing existing invoices)
 * @param userId - User ID
 * @param nextNumber - Next invoice number to use
 */
export async function setNextInvoiceNumber(userId: string, nextNumber: number): Promise<void> {
  try {
    const { settings } = await getUserInvoiceSettings(userId);
    
    if (settings) {
      const updatedSettings: InvoiceUserSettings = {
        ...settings,
        nextInvoiceNumber: nextNumber,
      };
      
      await setUserInvoiceSettings(userId, updatedSettings);
    }
  } catch (error) {
    console.error("Error setting next invoice number:", error);
  }
}
