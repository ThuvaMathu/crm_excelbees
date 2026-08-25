export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEnvironment = "development" | "production" | "test";

/**
 * Extra context fields a caller may attach to a log call. These are the
 * *allowed* fields; anything beyond them is passed through to the underlying
 * logger as arbitrary metadata (and sanitized).
 */
export interface LogContext {
  module?: string;
  action?: string;
  userId?: string;
  organizationId?: string;
  requestId?: string;
  /** Structured extra data. Never put whole documents / sensitive payloads here. */
  [key: string]: unknown;
}

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  cause?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  environment: LogEnvironment;
  module?: string;
  action?: string;
  userId?: string;
  organizationId?: string;
  requestId?: string;
  error?: SerializedError;
  metadata?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  /** Returns a child logger with bindings merged into every emitted log. */
  child(bindings: LogContext): Logger;
  /** Current minimum level this logger will emit. */
  level: LogLevel;
}
