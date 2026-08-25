import { z } from "zod";

/**
 * A Firestore Timestamp (client or Admin SDK — both expose `.toDate()`),
 * matched structurally so this file doesn't need to import either SDK.
 */
const timestampLike = z.custom<{ toDate: () => Date }>(
  (val) => typeof val === "object" && val !== null && typeof (val as any).toDate === "function",
  { message: "Expected a Date or Firestore Timestamp" }
);

/**
 * Accepts a native Date or a Firestore Timestamp and normalizes to a native
 * Date. Unlike `z.preprocess`, this uses `z.union(...).transform(...)` so
 * the schema's input type stays a concrete union (Date | Timestamp-like)
 * instead of collapsing to `unknown` — `z.preprocess` accepts arbitrary
 * input by design, which breaks `zodResolver`'s type inference against
 * react-hook-form's `useForm<Input, Context, Output>` generics.
 */
export function coerceTimestamp() {
  return z.union([z.date(), timestampLike]).transform((val) =>
    val instanceof Date ? val : val.toDate()
  );
}

export function coerceTimestampOptional() {
  return z
    .union([z.date(), timestampLike])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined) return undefined;
      return val instanceof Date ? val : val.toDate();
    });
}