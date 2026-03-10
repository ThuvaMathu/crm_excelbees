import { doc, runTransaction, Transaction, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import type { InvoiceUserSettings } from "@/types/crm";

/**
 * Initialize invoice settings for a user if they don't exist
 * This should be called when a user is first created or when accessing invoice features
 */
export async function initializeInvoiceSettings(
  userId: string,
  startingNumber: number = 1
): Promise<{ success: boolean; error: string | null }> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { success: false, error: "User not found" };
    }

    const userData = userSnap.data();
    const existingSettings = userData.invoiceSettings;

    // Only initialize if settings don't exist
    if (!existingSettings) {
      const defaultSettings: InvoiceUserSettings = {
        template: "standard",
        companyName: userData.displayName || "",
        fromName: userData.displayName || "",
        fromEmail: userData.email || "",
        logoUrl: "",
        colorTheme: "#3B82F6",
        invoicePrefix: "INV-",
        nextInvoiceNumber: startingNumber,
      };

      await setDoc(
        userRef,
        { invoiceSettings: defaultSettings },
        { merge: true }
      );
      console.log("✅ Invoice settings initialized for user:", userId);
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("❌ Failed to initialize invoice settings:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate the next sequential invoice number for a user using Firestore Transactions
 * This ensures atomic increments and prevents race conditions
 *
 * @param userId - User ID
 * @returns Promise<string> - Generated invoice number (e.g., "INV-001")
 */
export async function generateNextInvoiceNumber(userId: string): Promise<string> {
  const userRef = doc(db, "users", userId);

  try {
    // Use a transaction to atomically read and increment the invoice number
    const invoiceNumber = await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error("User not found. Please ensure the user exists before generating invoice numbers.");
      }

      const userData = userSnap.data();
      const settings = userData.invoiceSettings as InvoiceUserSettings | undefined;

      // Initialize settings if they don't exist (defensive programming)
      if (!settings) {
        throw new Error(
          "Invoice settings not found. Please initialize invoice settings first by calling initializeInvoiceSettings()."
        );
      }

      const prefix = settings.invoicePrefix || "INV-";
      const nextNumber = settings.nextInvoiceNumber || 1;

      // Format number with leading zeros (4 digits minimum for better sequence)
      const formattedNumber = String(nextNumber).padStart(4, "0");
      const generatedInvoiceNumber = `${prefix}${formattedNumber}`;

      // Atomically increment the counter
      transaction.update(userRef, {
        "invoiceSettings.nextInvoiceNumber": nextNumber + 1,
      });

      console.log(`📄 Generated invoice number: ${generatedInvoiceNumber} (next will be ${nextNumber + 1})`);

      return generatedInvoiceNumber;
    });

    return invoiceNumber;
  } catch (error: any) {
    console.error("❌ Error generating invoice number:", error);

    // CRITICAL: Do NOT fallback to random numbers
    // This prevents non-sequential invoice numbers
    // Instead, re-throw the error with a helpful message
    throw new Error(
      `Failed to generate sequential invoice number: ${error.message}. Please contact support.`
    );
  }
}

/**
 * Manually set the next invoice number (useful for importing existing invoices)
 * @param userId - User ID
 * @param nextNumber - Next invoice number to use
 */
export async function setNextInvoiceNumber(
  userId: string,
  nextNumber: number
): Promise<{ success: boolean; error: string | null }> {
  try {
    const userRef = doc(db, "users", userId);

    // Use transaction to ensure atomic update
    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error("User not found");
      }

      const userData = userSnap.data();
      const existingSettings = userData.invoiceSettings;

      if (!existingSettings) {
        // Initialize with the specified starting number
        const defaultSettings: InvoiceUserSettings = {
          template: "standard",
          companyName: "",
          fromName: "",
          fromEmail: "",
          logoUrl: "",
          colorTheme: "#3B82F6",
          invoicePrefix: "INV-",
          nextInvoiceNumber: nextNumber,
        };

        transaction.set(userRef, { invoiceSettings: defaultSettings }, { merge: true });
      } else {
        // Update only the nextInvoiceNumber field
        transaction.update(userRef, {
          "invoiceSettings.nextInvoiceNumber": nextNumber,
        });
      }
    });

    console.log(`✅ Next invoice number set to ${nextNumber} for user ${userId}`);
    return { success: true, error: null };
  } catch (error: any) {
    console.error("❌ Error setting next invoice number:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get the current invoice settings for a user
 * @param userId - User ID
 */
export async function getInvoiceSettings(
  userId: string
): Promise<{ settings: InvoiceUserSettings | null; error: string | null }> {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { settings: null, error: "User not found" };
    }

    const userData = userSnap.data();
    const settings = userData.invoiceSettings as InvoiceUserSettings | undefined;

    if (!settings) {
      return { settings: null, error: "Invoice settings not found" };
    }

    return { settings, error: null };
  } catch (error: any) {
    console.error("❌ Error getting invoice settings:", error);
    return { settings: null, error: error.message };
  }
}
