/**
 * Helper to recursively unwrap nested API responses.
 * Sometimes the backend wraps responses in `{ data: { data: ... } }`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const unwrapResponseData = (response: any): any => {
    if (!response) return response;
    let unwrapped = response;
    let depth = 0;
    while (unwrapped && unwrapped.data !== undefined && !Array.isArray(unwrapped.data) && typeof unwrapped.data === 'object' && depth < 3) {
        unwrapped = unwrapped.data;
        depth++;
    }
    if (unwrapped && unwrapped.data !== undefined) {
        return unwrapped.data;
    }
    return unwrapped;
};

/**
 * Scan an object for any array property that looks like line items.
 * Guards against inconsistent snake_case / camelCase keys from the backend.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractLinesArray = (data: any): any[] => {
    if (!data || typeof data !== 'object') return [];
    const possibleArrays = [
        data.lines, data.rfqLines, data.rfq_lines, data.items, 
        data.rfq_items, data.vq_lines, data.vqLines, data.po_lines, data.poLines
    ];
    for (const arr of possibleArrays) {
        if (Array.isArray(arr) && arr.length > 0) return arr;
    }
    for (const arr of possibleArrays) {
        if (Array.isArray(arr)) return arr;
    }
    return [];
};
