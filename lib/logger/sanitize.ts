/**
 * Sensitive-data sanitization for logs.
 *
 * This is a CRM — we must never write passwords, tokens, cookies, auth
 * headers, SMTP credentials, payment data or full customer records to logs.
 * `sanitizeMetadata` recursively redacts known-sensitive keys and truncates
 * anything too large before it reaches the transport.
 */

const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  /password/i,
  /passwd/i,
  /\bpass\b/i,
  /passphrase/i,
  /secret/i,
  /token/i,
  /api[-_]?key/i,
  /apikey/i,
  /authorization/i,
  /cookie/i,
  /sessionid/i,
  /credential/i,
  /private[-_]?key/i,
  /firebase[-_]?private[-_]?key/i,
  /smtp[-_]?pass/i,
  /access[-_]?token/i,
  /refresh[-_]?token/i,
  /id[-_]?token/i,
  /card[-_]?number/i,
  /cvv/i,
  /cvc/i,
  /pan\b/i,
  /encryption[-_]?key/i,
];

export const REDACTED = "[REDACTED]";

/** Max nesting depth before we bail out with a placeholder. */
const MAX_DEPTH = 5;
/** Max number of array elements serialized. */
const MAX_ARRAY_ITEMS = 50;
/** Max string length serialized per value. */
const MAX_STRING_LENGTH = 2000;

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function truncateString(value: string): string {
  return value.length > MAX_STRING_LENGTH
    ? `${value.slice(0, MAX_STRING_LENGTH)}…[truncated]`
    : value;
}

/**
 * Recursively sanitize an arbitrary value before logging:
 * - Redacts values under sensitive key names.
 * - Caps nesting depth, array length and string length.
 * - Resolves Firestore Timestamp / Date to ISO strings.
 * - Breaks circular references.
 */
export function sanitizeMetadata(
  value: unknown,
  depth = 0,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") return truncateString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();

  if (depth >= MAX_DEPTH) return "[depth-exceeded]";

  if (typeof value === "object") {
    if (seen.has(value)) return "[circular]";
    seen.add(value);

    try {
      // Date-like objects → ISO string
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? "[invalid-date]" : value.toISOString();
      }
      if (typeof (value as { toDate?: unknown }).toDate === "function") {
        const d = (value as { toDate: () => Date }).toDate();
        return isNaN(d.getTime()) ? "[invalid-date]" : d.toISOString();
      }

      if (Array.isArray(value)) {
        const items = value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeMetadata(item, depth + 1, seen));
        if (value.length > MAX_ARRAY_ITEMS) items.push(`[+${value.length - MAX_ARRAY_ITEMS} more]`);
        return items;
      }

      const out: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        if (isSensitiveKey(key)) {
          out[key] = REDACTED;
        } else {
          out[key] = sanitizeMetadata(val, depth + 1, seen);
        }
      }
      return out;
    } finally {
      seen.delete(value);
    }
  }

  return value;
}
