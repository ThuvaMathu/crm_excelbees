import type { LogLevel } from "./types";

export const LOG_LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error"];

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export function isLogLevel(value: string | undefined): value is LogLevel {
  return LOG_LEVELS.includes(value as LogLevel);
}

/**
 * Resolve a raw string (from env, etc.) into a valid LogLevel, or fall back to
 * a default. In development we default to "debug"; in production "info".
 */
export function resolveLogLevel(
  raw: string | undefined,
  defaultLevel: LogLevel = process.env.NODE_ENV === "production" ? "info" : "debug",
): LogLevel {
  if (raw && isLogLevel(raw)) return raw;
  return defaultLevel;
}

/**
 * Resolve the level used by the *server* logger.
 * Priority: LOG_LEVEL env var → dev "debug" / prod "info".
 */
export function resolveServerLogLevel(): LogLevel {
  return resolveLogLevel(process.env.LOG_LEVEL);
}

/**
 * Resolve the level used by the *client* logger. Client logs default to
 * "debug" in dev and "warn" in production so we don't spam browser consoles.
 * Overridable via NEXT_PUBLIC_LOG_LEVEL or LOG_LEVEL.
 */
export function resolveClientLogLevel(): LogLevel {
  return resolveLogLevel(
    process.env.NEXT_PUBLIC_LOG_LEVEL || process.env.LOG_LEVEL,
    process.env.NODE_ENV === "production" ? "warn" : "debug",
  );
}

/** True when a log of `level` should be emitted given the current `configured` minimum. */
export function isLevelEnabled(configured: LogLevel, level: LogLevel): boolean {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[configured];
}
