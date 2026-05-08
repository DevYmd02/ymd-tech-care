import type { PaginatedListResponse } from '@/shared/types/api.types';

/**
 * Helper to recursively unwrap nested API responses.
 * Sometimes the backend wraps responses in `{ data: { data: ... } }`.
 */
export const unwrapResponseData = <T>(response: unknown): T => {
    if (!response || typeof response !== 'object') return response as T;
    
    let unwrapped = response as Record<string, unknown>;
    let depth = 0;
    
    // 🎯 Recursively unwrap .data envelopes
    while (unwrapped && unwrapped.data !== undefined && !Array.isArray(unwrapped.data) && typeof unwrapped.data === 'object' && depth < 3) {
        unwrapped = unwrapped.data as Record<string, unknown>;
        depth++;
    }
    
    // 🎯 If the result contains a .header property (common in detail responses), unwrap it too
    if (unwrapped && unwrapped.header !== undefined && typeof unwrapped.header === 'object' && !Array.isArray(unwrapped.header)) {
        // 🎯 STABILITY FIX: In document details (PR, SO, PO), lines/items are often siblings of 'header'.
        const keys = Object.keys(unwrapped);
        const hasLines = keys.some(k => 
          k.toLowerCase().includes('line') || 
          k.toLowerCase().includes('item') || 
          k.toLowerCase().includes('detail')
        );

        if (!hasLines) {
            return unwrapped.header as T;
        } else {
            // Flatten header fields into top level while preserving siblings (lines/items)
            return {
                ...(unwrapped.header as Record<string, unknown>),
                ...unwrapped
            } as T;
        }
    }
    
    if (unwrapped && unwrapped.data !== undefined) {
        return unwrapped.data as T;
    }
    return unwrapped as T;
};

/**
 * Normalizes an inconsistent API response into a standard ListResponse.
 * Handles cases where data might be in 'items', 'data', or a direct array.
 */
export const normalizeListResponse = <T>(response: unknown): PaginatedListResponse<T> => {
    if (!response) {
        return { items: [], total: 0, page: 1, limit: 10 };
    }

    if (Array.isArray(response)) {
        return {
            items: response as T[],
            total: response.length,
            page: 1,
            limit: response.length
        };
    }

    const res = response as Record<string, unknown>;
    
    // 1. Try 'items' key (Our standard)
    if (Array.isArray(res.items)) {
        return {
            items: res.items as T[],
            total: Number(res.total || res.items.length),
            page: Number(res.page || 1),
            limit: Number(res.limit || res.items.length)
        };
    }

    // 2. Try 'data' key (Common in Master Data)
    if (Array.isArray(res.data)) {
        return {
            items: res.data as T[],
            total: Number(res.total || res.data.length),
            page: Number(res.page || 1),
            limit: Number(res.limit || res.data.length)
        };
    }

    // 3. Last resort: Return empty list
    return { items: [], total: 0, page: 1, limit: 10 };
};

/**
 * Scan an object for any array property that looks like line items.
 * Guards against inconsistent snake_case / camelCase keys from the backend.
 */
export const extractLinesArray = <T>(data: unknown): T[] => {
    if (!data || typeof data !== 'object') return [];
    
    const d = data as Record<string, unknown>;
    
    const possibleArrays = [
        d.lines, d.vqLines, d.vq_lines, 
        d.prLines, d.pr_lines, d.prLinesRaw,
        d.line_items, d.items, d.detailLines,
        d.rfqLines, d.rfq_lines, d.rfq_items,
        d.po_lines, d.poLines, d.saleQuotationLines
    ];
    
    for (const arr of possibleArrays) {
        if (Array.isArray(arr) && arr.length > 0) return arr as T[];
    }
    
    for (const arr of possibleArrays) {
        if (Array.isArray(arr)) return arr as T[];
    }
    
    return [];
};
