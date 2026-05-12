/**
 * @file clientFilterUtils.ts
 * @description Hybrid Fallback — Client-Side Filtering for Real API Responses
 *
 * The backend API currently ignores query parameters and returns the full dataset.
 * In Mock mode, filtering works perfectly because `applyMockFilters()` handles it
 * in-memory. This utility replicates that EXACT logic so the Real API services
 * can apply the same filtering client-side until the backend implements it.
 *
 * Architecture: Fetch ALL → Filter → Paginate → Return shaped response
 *
 * @see src/core/api/mockUtils.ts — the original mock filtering logic this mirrors
 */

import { logger } from '@/shared/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Primitive types allowed in filter params (mirrors mockUtils.FilterValue) */
export type FilterValue = string | number | boolean | undefined | null;

/** Configuration for the client-side filter */
interface ClientFilterOptions<T> {
  /** Fields to search when a generic `q` param is provided */
  searchableFields?: (keyof T)[];
  /** The field on T that holds the date value for date_from / date_to range filtering */
  dateField?: keyof T;
  /** Preserved total count from backend response to avoid capping total on paginated chunks */
  backendTotal?: number;
  /** List of fields that MUST match exactly (e.g. status) rather than partial string matching */
  exactMatchFields?: (keyof T)[];
}

/** Standard paginated list response shape used across all procurement modules */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Core Filter Function ────────────────────────────────────────────────────

/**
 * Applies client-side filtering, sorting, and pagination to an array of items.
 * This is the EXACT same logic as `applyMockFilters` from mockUtils.ts,
 * adapted for use in real API service files as a Hybrid Fallback.
 *
 * @param data     - The full dataset returned by the real API
 * @param params   - The query parameters from the UI (filter form values)
 * @param options  - Configuration: searchable fields, date field
 * @returns        - A paginated response matching the ListResponse shape
 */
export const applyClientFilters = <T extends object>(
  data: T[],
  params: Record<string, FilterValue>,
  options: ClientFilterOptions<T> = {}
): PaginatedResponse<T> => {
  let processed = [...data];

  // 1. Generic Search (q param → partial match across searchableFields)
  if (typeof params.q === 'string' && params.q.trim() !== '' && options.searchableFields) {
    const q = params.q.toLowerCase();
    processed = processed.filter(item => {
      const record = item as Record<string, string | number | boolean | null | undefined>;
      return options.searchableFields?.some(field => {
        const val = record[field as string];
        return String(val ?? '').toLowerCase().includes(q);
      });
    });
  }

  // 2. Specific Field Filters (mirrors mockUtils logic exactly)
  const excludeKeys = ['page', 'limit', 'sort', 'q', 'date_from', 'date_to', 'date_start', 'date_end', 'start_date', 'end_date', 'total'];

  Object.keys(params).forEach(key => {
    if (excludeKeys.includes(key)) return;

    const filterValue = params[key];
    if (filterValue === undefined || filterValue === null || filterValue === '' || filterValue === 'ALL') return;

    processed = processed.filter(item => {
      const record = item as Record<string, string | number | boolean | null | undefined>;
      if (!(key in record)) return false; // 🎯 STRICT: Missing key means mismatch

      const itemValue = record[key];

      // String → Partial Match (Case Insensitive)
      if (typeof itemValue === 'string' && typeof filterValue === 'string') {
        const isExactMatchField = options.exactMatchFields?.includes(key as keyof T);
        if (isExactMatchField) {
            const match = String(itemValue || '').trim().toLowerCase() === String(filterValue || '').trim().toLowerCase();
            if (!match) {
                return false;
            }
            return true;
        }
        return String(itemValue || '').toLowerCase().includes(String(filterValue || '').toLowerCase());
      }

      // Strict Equality with String Casting for Robustness
      const match = String(itemValue ?? '').trim() === String(filterValue ?? '').trim();
      return match;
    });
  });

  // 3. Date Range Filtering
  const dateFrom = params.date_from ?? params.date_start;
  const dateTo = params.date_to ?? params.date_end;

  if ((dateFrom || dateTo) && options.dateField) {
    const dateFromStr = typeof dateFrom === 'string' ? dateFrom : undefined;
    const dateToStr = typeof dateTo === 'string' ? dateTo : undefined;

    const from = dateFromStr ? new Date(dateFromStr).getTime() : -Infinity;
    const to = dateToStr ? new Date(dateToStr).getTime() : Infinity;

    processed = processed.filter(item => {
      const record = item as Record<string, string | number | boolean | null | undefined>;
      const fieldVal = record[options.dateField as string];
      const dateStr = String(fieldVal);
      const dateVal = new Date(dateStr).getTime();
      return dateVal >= from && dateVal <= to;
    });
  }

  // 4. Sorting
  if (typeof params.sort === 'string' && params.sort.trim() !== '') {
    const [key, direction] = params.sort.split(':');
    processed.sort((a, b) => {
      const recA = a as Record<string, string | number | boolean | null | undefined>;
      const recB = b as Record<string, string | number | boolean | null | undefined>;
      const valA = recA[key] as FilterValue;
      const valB = recB[key] as FilterValue;

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comparison = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      return direction === 'desc' ? -comparison : comparison;
    });
  }

  // 5. Pagination
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  
  let total = processed.length;
  let hasOverriddenTotal = false;
  // 🎯 PRESERVE BACKEND TOTAL: If backend is paginating and returned total exists,
  // and we hasn't filter out anything from the array input size (length), override total
  if (options.backendTotal !== undefined && options.backendTotal > total && total === data.length) {
    total = options.backendTotal;
    hasOverriddenTotal = true;
  }

  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  
  // 🎯 FIX: If total is overridden, data is already paginated by backend (or has chunk size = limit/total).
  // DO NOT slice with offset (startIndex) because the array ALREADY starts at 0 for this page.
  const items = hasOverriddenTotal 
    ? processed.slice(0, limit) 
    : processed.slice(startIndex, startIndex + limit);

  logger.debug(`🔍 [ClientFilter] Filtered ${data.length} → ${total} items (page ${page}/${totalPages}, limit ${limit})`);

  return { data: items, total, page, limit, totalPages };
};


/**
 * Safely extracts an array of items from various API response shapes.
 * Handles: raw array, { data: [...] }, { items: [...] }, or nested structures.
 */
export const extractArrayFromResponse = <T>(response: object | null | undefined): T[] => {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (response && typeof response === 'object') {
    const obj = response as Record<string, T[]>;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.items)) return obj.items;
  }

  return [];
};

/**
 * Applies ONLY client-side pagination (slicing) to an already-filtered array.
 * Use this when the data has already been filtered (e.g., by mock handlers)
 * but still needs to be sliced for the current page/limit.
 *
 * @param data  - The full (possibly pre-filtered) dataset
 * @param page  - Current page number (1-based)
 * @param limit - Items per page
 * @returns     - A paginated response with sliced data and metadata
 */
export const applyClientPagination = <T>(
  data: T[],
  page: number = 1,
  limit: number = 20,
  backendTotal?: number
): PaginatedResponse<T> => {
  let total = data.length;
  let hasOverriddenTotal = false;

  if (backendTotal !== undefined && backendTotal > total && total === data.length) {
    total = backendTotal;
    hasOverriddenTotal = true;
  }

  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  
  // 🎯 FIX: If total is overridden, data is already paginated by backend.
  // DO NOT slice with offset (startIndex) because the array ALREADY starts at 0 for this page.
  const paginatedData = hasOverriddenTotal 
    ? data.slice(0, limit) 
    : data.slice(startIndex, startIndex + limit);

  logger.debug(`📄 [ClientPagination] Sliced ${data.length} items → page ${page}/${totalPages} (limit ${limit}, showing ${paginatedData.length})`);

  return {
    data: paginatedData,
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * 🎯 Hybrid Filtering Param Preparer
 * 
 * Determines if client-side filtering is needed based on the presence of
 * filter parameters, and prepares the API parameters accordingly.
 */
export const prepareHybridParams = (
    params: Record<string, FilterValue>,
    supportedBackendFields: string[] = [],
    options: { maxWindow?: number } = {}
) => {
    const { maxWindow = 500 } = options;
    const apiParams = { ...params };
    
    // Check if any provided param is NOT supported by the backend
    const filterKeys = Object.keys(params).filter(key => 
        !['page', 'limit', 'sort'].includes(key) && 
        params[key] !== undefined && 
        params[key] !== null && 
        params[key] !== '' && 
        params[key] !== 'ALL'
    );
    
    const needsClientFilter = filterKeys.some(key => !supportedBackendFields.includes(key));
    
    if (needsClientFilter) {
        // Expand search window to find matches
        apiParams.limit = maxWindow;
        apiParams.page = 1;
        
        // Strip non-supported fields from API call to prevent backend errors or 0-results
        filterKeys.forEach(key => {
            if (!supportedBackendFields.includes(key)) {
                delete apiParams[key];
            }
        });
        
        logger.debug(`🚀 [HybridParams] Expansion triggered (limit=${maxWindow}) due to fields:`, filterKeys.filter(k => !supportedBackendFields.includes(k)));
    }
    
    return {
        apiParams,
        needsClientFilter
    };
};

