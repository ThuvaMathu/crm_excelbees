/**
 * Client logger (browser-safe).
 *
 * Safe to bundle for the browser: no pino, no Node APIs, no server-only
 * imports. Uses `console` under the hood.
 *
 * - Development: level `debug` by default → detailed console output.
 * - Production: level `warn` by default → only warnings + errors hit the
 *   browser console, avoiding noisy production output. Errors are emitted as
 *   structured JSON so they can later be forwarded to a monitoring provider.
 *
 * Level can be overridden with NEXT_PUBLIC_LOG_LEVEL or LOG_LEVEL.
 */

import type { LogContext, LogEnvironment, LogLevel, Logger } from "./types";
import { resolveClientLogLevel } from "./levels";
import { sanitizeMetadata } from "./sanitize";
import { serializeError } from "./serialize";

const environment: LogEnvironment =
  process.env.NODE_ENV === "production"
    ? "production"
    : process.env.NODE_ENV === "test"
      ? "test"
      : "development";

const isDev = process.env.NODE_ENV !== "production";

const consoleMethod: Record<LogLevel, "debug" | "info" | "warn" | "error"> = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
};

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

let configuredLevel = resolveClientLogLevel();

/** Allow runtime override (e.g. from a settings screen in dev). */
export function setClientLogLevel(level: LogLevel): void {
  configuredLevel = level;
}

function isEnabled(level: LogLevel): boolean {
  return levelWeight[level] >= levelWeight[configuredLevel];
}

function stripKnownFields(context: LogContext): Record<string, unknown> {
  const { module, action, userId, organizationId, requestId, error, metadata, ...rest } = context ?? {};
  const payload: Record<string, unknown> = {};
  if (module) payload.module = module;
  if (action) payload.action = action;
  if (userId) payload.userId = userId;
  if (organizationId) payload.organizationId = organizationId;
  if (requestId) payload.requestId = requestId;
  if (error !== undefined) payload.error = serializeError(error);

  const restKeys = Object.keys(rest);
  if (restKeys.length > 0 || metadata !== undefined) {
    const sanitizedRest = sanitizeMetadata(rest) as Record<string, unknown>;
    const sanitizedMeta = metadata !== undefined ? (sanitizeMetadata(metadata) as Record<string, unknown>) : undefined;
    payload.metadata = { ...sanitizedRest, ...(sanitizedMeta ?? {}) };
  }
  return payload;
}

function makeLogger(bindings: LogContext = {}): Logger {
  const emit = (level: LogLevel, message: string, context: LogContext) => {
    if (!isEnabled(level)) return;

    const merged = { ...bindings, ...context };
    const payload = stripKnownFields(merged);

    if (isDev) {
      const label = `[${level.toUpperCase()}]`;
      const scope = payload.module ? `[${payload.module}]` : "";
      const args: unknown[] = [message];
      if (Object.keys(payload).length > 0) args.push(payload);
      // eslint-disable-next-line no-console
      console[consoleMethod[level]](label, scope, ...args);
    } else {
      // Structured single-line JSON, ready for a future monitoring provider.
      const entry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        environment,
        ...payload,
      };
      // eslint-disable-next-line no-console
      console[consoleMethod[level]](JSON.stringify(entry));
    }
  };

  const logger: Logger = {
    debug: (message, context) => emit("debug", message, context ?? {}),
    info: (message, context) => emit("info", message, context ?? {}),
    warn: (message, context) => emit("warn", message, context ?? {}),
    error: (message, context) => emit("error", message, context ?? {}),
    child: (childBindings) => makeLogger({ ...bindings, ...childBindings }),
    get level() {
      return configuredLevel;
    },
  };

  return logger;
}

export const logger: Logger = makeLogger();
