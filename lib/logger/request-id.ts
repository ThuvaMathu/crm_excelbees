import { headers } from "next/headers";

/**
 * Create a fresh correlation id. Uses crypto.randomUUID where available
 * (Node 19+, Edge), otherwise falls back to a timestamp + random suffix.
 */
export function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Read the request correlation id propagated by middleware (x-request-id
 * header). Returns undefined when unavailable (e.g. not a request scope, or
 * no middleware-assigned id). Server-only — do not import from client code.
 */
export async function getRequestId(): Promise<string | undefined> {
  try {
    const headerList = await headers();
    return headerList.get("x-request-id") ?? undefined;
  } catch {
    return undefined;
  }
}
