/**
 * @file payload.utils.ts
 * @description Utilities for sanitizing and preparing API payloads.
 */

import { z } from 'zod';

/**
 * Sanitizes an object by picking only the specified keys.
 * This prevents "DTO Leak" where extra fields cause 400 Bad Request errors on the backend.
 * 
 * @param data The raw data to sanitize
 * @param whitelist Either a Zod schema or an array of allowed keys
 * @returns A new object containing only the whitelisted fields
 */
export function sanitizePayload<T>(data: unknown, whitelist: z.ZodObject<z.ZodRawShape> | string[]): T {
    const rawData = data as Record<string, unknown>;
    if (!rawData || typeof rawData !== 'object') return data as T;

    const allowedKeys = whitelist instanceof z.ZodObject 
        ? Object.keys(whitelist.shape) 
        : whitelist;

    const result: Record<string, unknown> = {};
    
    allowedKeys.forEach(key => {
        if (key in rawData) {
            const value = rawData[key];
            
            // Handle arrays of objects recursively if needed
            // (Note: This is a simple implementation. For complex nested schemas, 
            // the service should handle nested sanitization explicitly)
            result[key] = value;
        }
    });
    
    return result as T;
}

/**
 * Deeply removes null, undefined, or empty string values from a payload.
 * Also handles empty arrays.
 */
export function cleanPayload(data: unknown): unknown {
    if (Array.isArray(data)) {
        return data.map(v => cleanPayload(v)).filter(v => v !== undefined);
    }
    
    if (data !== null && typeof data === 'object') {
        const result: Record<string, unknown> = {};
        Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
            const cleaned = cleanPayload(value);
            if (cleaned !== null && cleaned !== undefined && cleaned !== '') {
                result[key] = cleaned;
            }
        });
        return Object.keys(result).length > 0 ? result : undefined;
    }
    
    return data;
}
