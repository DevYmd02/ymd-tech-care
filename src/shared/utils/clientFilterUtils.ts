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

import { logger } from '@/shared/utils/logger';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Primitive types allowed in filter params (mirrors mockUtils.FilterValue) */
type FilterValue = string | number | boolean | undefined | null;

/** Configuration for the client-side filter */
interface ClientFilterOptions<T> {
  /** Fields to search when a generic `q` param is provided */
  searchableFields?: (keyof T)[];
  /** The field on T that holds the date value for date_from / date_to range filtering */
  dateField?: keyof T;
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
  const excludeKeys = ['page', 'limit', 'sort', 'q', 'date_from', 'date_to', 'total'];

  Object.keys(params).forEach(key => {
    if (excludeKeys.includes(key)) return;

    const filterValue = params[key];
    if (filterValue === undefined || filterValue === null || filterValue === '' || filterValue === 'ALL') return;

    processed = processed.filter(item => {
      const record = item as Record<string, string | number | boolean | null | undefined>;
      if (!(key in record)) return true;

      const itemValue = record[key];

      // String → Partial Match (Case Insensitive)
      if (typeof itemValue === 'string' && typeof filterValue === 'string') {
        return itemValue.toLowerCase().includes(filterValue.toLowerCase());
      }

      // Strict Equality with String Casting for Robustness
      return String(itemValue) === String(filterValue);
    });
  });

  // 3. Date Range Filtering
  if ((params.date_from || params.date_to) && options.dateField) {
    const dateFromStr = typeof params.date_from === 'string' ? params.date_from : undefined;
    const dateToStr = typeof params.date_to === 'string' ? params.date_to : undefined;

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
  const total = processed.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const items = processed.slice(startIndex, startIndex + limit);

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
  limit: number = 20
): PaginatedResponse<T> => {
  const total = data.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedData = data.slice(startIndex, startIndex + limit);

  logger.debug(`📄 [ClientPagination] Sliced ${total} items → page ${page}/${totalPages} (limit ${limit}, showing ${paginatedData.length})`);

  return {
    data: paginatedData,
    total,
    page,
    limit,
    totalPages,
  };
};
