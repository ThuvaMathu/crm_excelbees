"use server";

import { isMaintenance } from "@/lib/env";

const MAINTENANCE_MESSAGE =
  "Sign-in is temporarily unavailable while we perform maintenance. Please try again shortly.";

/**
 * Server-side chokepoint for login/signup pages to check before calling any
 * Firebase Auth function. Firebase Auth itself is called directly from the
 * browser (no server-side login route), so this cannot stop a caller that
 * bypasses our pages and invokes the Firebase SDK directly — it only blocks
 * the app's own flow and any direct call to this action.
 */
export async function checkAuthAvailability(): Promise<{ allowed: boolean; message?: string }> {
  if (isMaintenance) {
    return { allowed: false, message: MAINTENANCE_MESSAGE };
  }
  return { allowed: true };
}
