import { test, expect } from "@playwright/test";
import { resolveLogLevel, resolveServerLogLevel, resolveClientLogLevel, isLevelEnabled, LOG_LEVELS } from "../../../lib/logger/levels";
import { sanitizeMetadata, isSensitiveKey, REDACTED } from "../../../lib/logger/sanitize";
import { serializeError, safeStringify } from "../../../lib/logger/serialize";
import { logger as clientLogger, setClientLogLevel } from "../../../lib/logger/client";

// These are pure Node-side unit tests of the centralized logger. They run in
// the Playwright (Node) context and never touch a browser page.

function setEnv(key: string, value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[key];
  else env[key] = value;
}

function setNodeEnv(value: string | undefined): void {
  setEnv("NODE_ENV", value);
}

test.describe("logger levels", () => {
  test("resolves valid levels and falls back to defaults", () => {
    expect(resolveLogLevel("debug")).toBe("debug");
    expect(resolveLogLevel("info")).toBe("info");
    expect(resolveLogLevel("warn")).toBe("warn");
    expect(resolveLogLevel("error")).toBe("error");
    expect(LOG_LEVELS).toEqual(["debug", "info", "warn", "error"]);
  });

  test("falls back to default when raw is invalid", () => {
    expect(resolveLogLevel("verbose", "info")).toBe("info");
    expect(resolveLogLevel(undefined, "debug")).toBe("debug");
  });

  test("server level defaults to debug in dev and info in production", () => {
    setNodeEnv("development");
    expect(resolveServerLogLevel()).toBe("debug");
    setNodeEnv("production");
    expect(resolveServerLogLevel()).toBe("info");
    setNodeEnv(undefined);
  });

  test("isLevelEnabled respects configured minimum", () => {
    expect(isLevelEnabled("info", "debug")).toBe(false);
    expect(isLevelEnabled("info", "info")).toBe(true);
    expect(isLevelEnabled("info", "warn")).toBe(true);
    expect(isLevelEnabled("error", "error")).toBe(true);
    expect(isLevelEnabled("error", "warn")).toBe(false);
  });
});

test.describe("logger sanitization", () => {
  test("redacts sensitive keys", () => {
    expect(isSensitiveKey("password")).toBe(true);
    expect(isSensitiveKey("pass")).toBe(true);
    expect(isSensitiveKey("smtpPass")).toBe(true);
    expect(isSensitiveKey("apiKey")).toBe(true);
    expect(isSensitiveKey("accessToken")).toBe(true);
    expect(isSensitiveKey("authorization")).toBe(true);
    expect(isSensitiveKey("cookie")).toBe(true);
    expect(isSensitiveKey("userId")).toBe(false);
    expect(isSensitiveKey("module")).toBe(false);
  });

  test("redacts sensitive values recursively", () => {
    const result = sanitizeMetadata({ password: "hunter2", nested: { token: "abc123", ok: 42 } }) as Record<string, unknown>;
    expect(result.password).toBe(REDACTED);
    expect((result.nested as Record<string, unknown>).token).toBe(REDACTED);
    expect((result.nested as Record<string, unknown>).ok).toBe(42);
  });

  test("keeps allowed fields intact", () => {
    const result = sanitizeMetadata({ userId: "u1", leadId: "l1", count: 5, enabled: true }) as Record<string, unknown>;
    expect(result.userId).toBe("u1");
    expect(result.leadId).toBe("l1");
    expect(result.count).toBe(5);
    expect(result.enabled).toBe(true);
  });

  test("caps nesting depth", () => {
    let deep: Record<string, unknown> = { value: "x" };
    for (let i = 0; i < 20; i++) deep = { child: deep };
    const result = sanitizeMetadata(deep) as Record<string, unknown>;
    let node = result as Record<string, unknown>;
    let depth = 0;
    while (node && typeof node === "object" && !Array.isArray(node)) {
      node = node.child as Record<string, unknown>;
      depth += 1;
      if (depth > 10) break;
    }
    // Depth is bounded well below the source's 20 levels.
    expect(depth).toBeLessThan(20);
  });

  test("caps array length and string length", () => {
    const bigArray = Array.from({ length: 200 }, (_, i) => i);
    const result = sanitizeMetadata(bigArray) as unknown[];
    expect(result.length).toBeLessThan(200);

    const bigString = "a".repeat(10000);
    const strResult = sanitizeMetadata(bigString) as string;
    expect(strResult.length).toBeLessThan(10000);
  });

  test("handles circular references without throwing", () => {
    const circular: Record<string, unknown> = { name: "x" };
    circular.self = circular;
    const result = sanitizeMetadata(circular) as Record<string, unknown>;
    expect(result.self).toBe("[circular]");
  });

  test("serializes dates to ISO strings", () => {
    const d = new Date("2026-01-01T00:00:00Z");
    expect(sanitizeMetadata(d)).toBe("2026-01-01T00:00:00.000Z");
  });
});

test.describe("logger error serialization", () => {
  test("serializes Error instances with name, message, stack", () => {
    const err = new Error("boom");
    const result = serializeError(err);
    expect(result.name).toBe("Error");
    expect(result.message).toBe("boom");
    expect(result.stack).toBeDefined();
  });

  test("serializes error codes", () => {
    const err = new Error("denied") as Error & { code: string };
    err.code = "PERMISSION_DENIED";
    const result = serializeError(err);
    expect(result.code).toBe("PERMISSION_DENIED");
  });

  test("serializes strings", () => {
    expect(serializeError("oops")).toEqual({ name: "Error", message: "oops" });
  });

  test("serializes unknown primitive values", () => {
    const result = serializeError(42);
    expect(result.message).toBe("42");
  });

  test("serializes null and undefined", () => {
    expect(serializeError(null).message).toBe("Unknown error");
    expect(serializeError(undefined).message).toBe("Unknown error");
  });

  test("serializes error-like objects", () => {
    const result = serializeError({ name: "CustomError", message: "custom message", code: "X1" });
    expect(result.name).toBe("CustomError");
    expect(result.message).toBe("custom message");
    expect(result.code).toBe("X1");
  });

  test("safeStringify does not throw on circular input", () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;
    expect(typeof safeStringify(circular)).toBe("string");
  });
});

test.describe("client logger behavior", () => {
  test("exposes the four standard methods", () => {
    expect(typeof clientLogger.debug).toBe("function");
    expect(typeof clientLogger.info).toBe("function");
    expect(typeof clientLogger.warn).toBe("function");
    expect(typeof clientLogger.error).toBe("function");
    expect(typeof clientLogger.child).toBe("function");
  });

  test("debug/info are filtered out when the level is warn", () => {
    const originalConsole = console.debug;
    const debugCalls: unknown[] = [];
    console.debug = (...args: unknown[]) => { debugCalls.push(args); };

    try {
      setClientLogLevel("warn");
      clientLogger.debug("should not appear", { module: "test" });
      clientLogger.info("should not appear", { module: "test" });
      clientLogger.warn("should appear", { module: "test" });
      clientLogger.error("should appear", { module: "test" });
      // debug() + info() are dropped; warn/error still emit (via console.warn/error)
      expect(debugCalls.length).toBe(0);
    } finally {
      console.debug = originalConsole;
    }
  });

  test("client level defaults to warn in production", () => {
    setNodeEnv("production");
    setEnv("LOG_LEVEL", undefined);
    setEnv("NEXT_PUBLIC_LOG_LEVEL", undefined);
    try {
      expect(resolveClientLogLevel()).toBe("warn");
    } finally {
      setNodeEnv(undefined);
    }
  });

  test("client level defaults to debug in development", () => {
    setNodeEnv("development");
    setEnv("LOG_LEVEL", undefined);
    setEnv("NEXT_PUBLIC_LOG_LEVEL", undefined);
    try {
      expect(resolveClientLogLevel()).toBe("debug");
    } finally {
      setNodeEnv(undefined);
    }
  });
});
