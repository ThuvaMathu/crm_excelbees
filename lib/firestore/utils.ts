
/**
 * Recursively removes undefined values from an object or array.
 * Firestore does not support 'undefined' values (only 'null').
 *
 * @param obj The object or array to sanitize
 * @returns A new object or array with undefined values removed
 */
export function sanitizeData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Date/Timestamp instances must pass through untouched. Date has ZERO own
  // enumerable properties (its internal time value is not a regular
  // property, and Timestamp's toDate()/toMillis() live on its prototype) —
  // the generic Object.keys()-based recursion below silently rebuilt both
  // into an empty {} object, which Firestore then stored as a blank map
  // field. This is what caused invoice issueDate/dueDate (coerced to a
  // native Date by lib/validations/date-coerce.ts before reaching here) to
  // save as {} and render as "-" everywhere they're displayed — and would
  // do the same to any other Date/Timestamp field passed through
  // sanitizeData() across the codebase, not just invoices.
  if (obj instanceof Date) {
    return obj;
  }
  if (typeof obj === "object" && typeof (obj as any).toDate === "function") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeData(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const newObj: any = {};
    Object.keys(obj).forEach(key => {
      const value = (obj as any)[key];
      if (value !== undefined) {
        newObj[key] = sanitizeData(value);
      }
    });
    return newObj as T;
  }

  return obj;
}
