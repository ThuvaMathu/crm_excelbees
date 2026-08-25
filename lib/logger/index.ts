/**
 * Central logging entry point (server-safe default).
 *
 * Import `logger` from `@/lib/logger` in server code (route handlers, server
 * actions, server utilities). Import from `@/lib/logger/client` in browser
 * code to avoid pulling pino into the client bundle.
 *
 * Usage:
 *   logger.debug("Fetching leads", { module: "leads", action: "fetch" });
 *   logger.info("Lead created", { module: "leads", action: "create", leadId, userId });
 *   logger.warn("Permission denied", { module: "permissions", action: "update", userId });
 *   logger.error("Failed to update lead", { module: "leads", action: "update", leadId, userId, error });
 */

import { logger } from "./server";

export { logger } from "./server";
export { getRequestId, createRequestId } from "./request-id";
export { serializeError, safeStringify } from "./serialize";
export { sanitizeMetadata, isSensitiveKey } from "./sanitize";
export { resolveLogLevel, resolveServerLogLevel, resolveClientLogLevel, isLevelEnabled, LOG_LEVELS } from "./levels";
export type { Logger, LogContext, LogEntry, LogLevel, LogEnvironment, SerializedError } from "./types";

/**
 * Backward-compatible AI feature log helper (used by `app/actions/ai/*`).
 * Logs an INFO line under module "ai" with feature + timing + success.
 */
export function logAI(
  feature: string,
  params: { model?: string; success: boolean; latencyMs?: number; error?: string },
): void {
  const { error, ...rest } = params;
  logger.info(`AI ${feature} ${params.success ? "succeeded" : "failed"}`, {
    module: "ai",
    feature,
    ...rest,
    ...(error ? { error } : {}),
  });
}
