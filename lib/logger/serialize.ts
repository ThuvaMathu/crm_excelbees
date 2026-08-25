import type { SerializedError } from "./types";
import { sanitizeMetadata } from "./sanitize";

/**
 * Normalize a caught value (Error, string, unknown, object) into a safe,
 * structured error payload for logging. Preserves message + stack + name and
 * any useful code/cause fields without ever stringifying secrets.
 */
export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    const result: SerializedError = {
      name: error.name || "Error",
      message: error.message || "Unknown error",
    };
    if (error.stack) result.stack = error.stack;
    const code = (error as Error & { code?: unknown }).code;
    if (code !== undefined && code !== null) {
      result.code = typeof code === "string" ? code : String(code);
    }
    if (error.cause !== undefined && error.cause !== null) {
      result.cause = error.cause instanceof Error ? error.cause.message : String(error.cause);
    }
    return result;
  }

  if (typeof error === "string") {
    return { name: "Error", message: error };
  }

  if (error === null || error === undefined) {
    return { name: "Error", message: "Unknown error" };
  }

  if (typeof error === "object") {
    const obj = error as Record<string, unknown>;
    const result: SerializedError = {
      name: typeof obj.name === "string" ? obj.name : "Error",
      message: typeof obj.message === "string" ? obj.message : "Unknown error",
    };
    if (typeof obj.stack === "string") result.stack = obj.stack;
    if (obj.code !== undefined && obj.code !== null) result.code = String(obj.code);
    return result;
  }

  return { name: "Error", message: String(error) };
}

/**
 * Safely stringify arbitrary data for a log message without throwing on
 * circular references or leaking nested secrets (values are sanitized).
 */
export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(sanitizeMetadata(value)) ?? "undefined";
  } catch {
    return "[unserializable]";
  }
}
