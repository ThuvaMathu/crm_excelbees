"use server";

import { checkRateLimit } from "@/lib/rate-limit";
import { isMaintenance } from "@/lib/env";

/**
 * Server-side login rate limit check. Firebase Auth itself only throttles
 * after Google's own threshold, so this adds an app-level limit (5 attempts
 * per 15 min per email) to slow down credential-stuffing / brute force.
 *
 * Also doubles as a maintenance-mode chokepoint: this is the one server
 * touchpoint the login flow hits before calling Firebase, so a direct call
 * to this action is blocked too, not just the UI path.
 */
export async function checkLoginRateLimit(
  email: string
): Promise<{ allowed: boolean; resetIn: number; reason?: "maintenance" }> {
  if (isMaintenance) {
    return { allowed: false, resetIn: 0, reason: "maintenance" };
  }
  const identifier = email.trim().toLowerCase();
  const { allowed, resetIn } = await checkRateLimit("login", identifier);
  return { allowed, resetIn };
}
