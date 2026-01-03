import { Timestamp } from "firebase/firestore";
import { addMonths, addYears } from "date-fns";
import type { ManagementBillingCycle } from "@/types/crm";

export function calculateNextBillingDate(
  startDate: Date | Timestamp,
  cycle: ManagementBillingCycle
): Date | null {
  if (cycle === "None") return null;

  const start = startDate instanceof Timestamp ? startDate.toDate() : startDate;
  
  // Logic: Billing starts after the project is in Management phase.
  // But usually, the "next billing date" is calculated relative to the start of the management phase or the project start date?
  // User request: "computes next billing date based on project start date... and management billing cycle"
  // Assuming billing starts from Project Start Date strictly for now, or we can assume it starts when Management Phase begins.
  // Let's assume standard recurring billing based on the cycle frequency.
  
  // However, often management fees start *after* development.
  // For this MVP, let's calculate based on current date vs cycle to find the *next* future date.
  // But for simple "Next Billing Date" setting:
  // If Quarterly: Add 3 months.
  // If Semi-Annual: Add 6 months.
  
  // Start with a basic implementation:
  // If starting from scratch, next billing is Start + 1 cycle.
  
  if (cycle === "Quarterly") {
    return addMonths(start, 3);
  }
  
  if (cycle === "Semi-Annual") {
    return addMonths(start, 6);
  }

  return null;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
