import { z } from 'zod';

/**
 * Standard schema for database/UI identifiers that can be string or number.
 * Coerces stringified numbers to actual numbers, while leaving strings (like UUIDs or placeholder words) untouched.
 */
export const zIdSchema = z.union([z.string(), z.number()]).transform((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  const num = Number(val);
  return isNaN(num) ? val : num;
});
