
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
