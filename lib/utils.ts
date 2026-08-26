import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Firestore Timestamps arrive as real Timestamp instances from the SDK, but
// as plain { seconds, nanoseconds } objects after a round-trip through the
// Redis cache (or other JSON serialization). This normalizes either shape
// (plus Date/string/number) into a JS Date so callers never crash on
// `value.toDate()`.
export function toJsDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && typeof (value as any).toDate === "function") return (value as any).toDate();
  if (typeof value === "object" && "seconds" in (value as any)) {
    return new Date((value as any).seconds * 1000 + Math.floor(((value as any).nanoseconds ?? 0) / 1e6));
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}
