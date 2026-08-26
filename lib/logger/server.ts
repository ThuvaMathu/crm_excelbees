/**
 * Server logger (pino-backed).
 *
 * - Development: pretty, colored terminal output via pino-pretty.
 * - Production: structured JSON on stdout, suitable for any log ingester.
 *
 * This module MUST only be imported from server-only code (route handlers,
 * server actions, server utilities). Client/browser code must use
 * `@/lib/logger/client` instead — bundling pino + pino-pretty into the
 * browser breaks the client build.
 */

import pino from "pino";
import type { LogContext, LogEntry, LogEnvironment, LogLevel, Logger } from "./types";
import { resolveServerLogLevel } from "./levels";
import { sanitizeMetadata, REDACTED } from "./sanitize";
import { serializeError } from "./serialize";

const isDev = process.env.NODE_ENV !== "production";

const environment: LogEnvironment =
  process.env.NODE_ENV === "production"
    ? "production"
    : process.env.NODE_ENV === "test"
      ? "test"
      : "development";

const pinoInstance = pino({
  level: resolveServerLogLevel(),
  messageKey: "message",
  base: { app: "crm-excelbees", environment },
  timestamp: () => `,"timestamp":${JSON.stringify(new Date().toISOString())}`,
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  // Second line of defense on top of sanitizeMetadata: redact known-sensitive
  // top-level/nested paths even if a caller bypasses the sanitizer.
  redact: {
    paths: [
      "password",
      "*.password",
      "pass",
      "*.pass",
      "token",
      "*.token",
      "accessToken",
      "*.accessToken",
      "refreshToken",
      "*.refreshToken",
      "apiKey",
      "*.apiKey",
      "authorization",
      "*.authorization",
      "cookie",
      "*.cookie",
      "smtpPass",
      "*.smtpPass",
      "privateKey",
      "*.privateKey",
    ],
    censor: REDACTED,
  },
  transport: isDev
    ? {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard", singleLine: false },
      }
    : undefined,
});

const APP_NAME = "crm-excelbees";

interface BuildResult {
  payload: Record<string, unknown>;
  message: string;
}

/**
 * Turn `(message, context)` into pino payload + message, applying
 * sanitization, error serialization, and field separation.
 */
function build(level: LogLevel, message: string, context: LogContext): BuildResult {
  const {
    module,
    action,
    userId,
    organizationId,
    requestId,
    error,
    metadata,
    ...rest
  } = context ?? {};

  const payload: Record<string, unknown> = {};
  if (module) payload.module = module;
  if (action) payload.action = action;
  if (userId) payload.userId = userId;
  if (organizationId) payload.organizationId = organizationId;
  if (requestId) payload.requestId = requestId;

  if (error !== undefined) {
    payload.error = serializeError(error);
  }

  // Any remaining context keys become a sanitized `metadata` object so we
  // never stringify raw caller objects into the log message.
  const restKeys = Object.keys(rest);
  if (restKeys.length > 0 || metadata !== undefined) {
    const sanitizedRest = sanitizeMetadata(rest) as Record<string, unknown>;
    const sanitizedMeta = metadata !== undefined ? (sanitizeMetadata(metadata) as Record<string, unknown>) : undefined;
    payload.metadata = {
      ...sanitizedRest,
      ...(sanitizedMeta ?? {}),
    };
  }

  return { payload, message };
}

function makeLogger(bindings: LogContext = {}): Logger {
  const emit = (level: LogLevel, message: string, context: LogContext) => {
    const merged = { ...bindings, ...context };
    const { payload, message: msg } = build(level, message, merged);
    // Merge bindings back so child loggers always attach their fields.
    const boundKeys: LogContext = {};
    for (const key of ["module", "action", "userId", "organizationId", "requestId"] as const) {
      if (bindings[key]) boundKeys[key] = bindings[key];
    }
    const finalPayload = { ...boundKeys, ...payload };
    (pinoInstance as unknown as {
      [key in LogLevel]: (payload: Record<string, unknown>, msg: string) => void;
    })[level](finalPayload, msg);
  };

  const logger: Logger = {
    debug: (message, context) => emit("debug", message, context ?? {}),
    info: (message, context) => emit("info", message, context ?? {}),
    warn: (message, context) => emit("warn", message, context ?? {}),
    error: (message, context) => emit("error", message, context ?? {}),
    child: (childBindings) => makeLogger({ ...bindings, ...childBindings }),
    get level() {
      return resolveServerLogLevel();
    },
  };

  return logger;
}

export const logger: Logger = makeLogger();

export type { Logger, LogContext, LogEntry, LogLevel };
export { APP_NAME as appName };
