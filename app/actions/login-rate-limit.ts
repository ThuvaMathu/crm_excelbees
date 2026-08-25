"use server";

import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Server-side login rate limit check. Firebase Auth itself only throttles
 * after Google's own threshold, so this adds an app-level limit (5 attempts
 * per 15 min per email) to slow down credential-stuffing / brute force.
 */
export async function checkLoginRateLimit(email: string): Promise<{ allowed: boolean; resetIn: number }> {
  const identifier = email.trim().toLowerCase();
  const { allowed, resetIn } = await checkRateLimit("login", identifier);
  return { allowed, resetIn };
}
