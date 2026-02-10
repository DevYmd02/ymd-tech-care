/**
 * @file useTableFilters.ts
 * @description Custom hook for managing table filter state via URL SearchParams
 * @features
 * - Syncs filter state with URL params (shareable, bookmarkable URLs)
 * - Resets page to 1 when search/status changes
 * - Type-safe with generic status type support
 * - Compatible with service layer interfaces (PRListParams, RFQFilterCriteria, etc.)
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// ====================================================================================
// TYPES
// ====================================================================================

/** Options for configuring the hook with default values */
export interface TableFilterOptions<TStatus extends string = string> {
  defaultPage?: number;
  defaultLimit?: number;
  defaultSearch?: string;
  defaultSearch2?: string;
  defaultSearch3?: string;
  defaultStatus?: TStatus | 'ALL';
  defaultSort?: string;
  defaultDateFrom?: string;
  defaultDateTo?: string;
  customParamKeys?: {
    page?: string;
    limit?: string;
    search?: string;
    search2?: string;
    search3?: string;
    status?: string;
    sort?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

/** Filter state returned by the hook */
export interface TableFilters<TStatus extends string = string> {
  page: number;
  limit: number;
  search: string;
  search2: string;
  search3: string;
  status: TStatus | 'ALL';
  sort: string;
  dateFrom: string;
  dateTo: string;
}

/** Parsed sort state */
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

/** Return type of the useTableFilters hook */
export interface UseTableFiltersReturn<TStatus extends string = string> {
  /** Current filter values (readonly, derived from URL) */
  filters: TableFilters<TStatus>;
  
  /** Update multiple filters at once */
  setFilters: (updates: Partial<TableFilters<TStatus>>) => void;
  
  /** Change page number (does NOT reset page) */
  handlePageChange: (page: number) => void;
  
  /** Change search term (resets page to 1) */
  handleSearchChange: (value: string) => void;
  
  /** Change status filter (resets page to 1) */
  handleStatusChange: (status: TStatus | 'ALL') => void;
  
  /** Change date range filter (resets page to 1) */
  handleDateRangeChange: (from: string, to: string) => void;
  
  /** Change secondary search term (resets page to 1) */
  handleSearch2Change: (value: string) => void;
  
  /** Change tertiary search term (resets page to 1) */
  handleSearch3Change: (value: string) => void;
  
  /** Change sorting (Single-Column Logic) */
  handleSortChange: (key: string) => void;

  /** Parsed sort configuration derived from filters.sort */
  sortConfig: SortConfig | null;
  
  /** Reset all filters to defaults and clear URL params */
  resetFilters: () => void;
}

// ====================================================================================
// URL PARAM KEYS
// ====================================================================================

const PARAM_KEYS = {
  page: 'page',
  limit: 'limit',
  search: 'search',
  search2: 'search2',
  search3: 'search3',
  status: 'status',
  sort: 'sort',
  dateFrom: 'dateFrom',
  dateTo: 'dateTo',
} as const;

// ====================================================================================
// HOOK IMPLEMENTATION
// ====================================================================================

/**
 * Custom hook for managing table filter state via URL params
 * 
 * @param options - Default values for filters
 * @returns Object with filters state and handler functions
 * 
 * @example
 * ```tsx
 * const { filters, handleSearchChange, handleStatusChange, resetFilters } = useTableFilters<RFQStatus>({
 *   defaultStatus: 'ALL',
 *   defaultLimit: 20,
 * });
 * 
 * // Use filters for API call
 * const { data } = useQuery(['rfqs', filters], () => rfqService.getList(filters));
 * ```
 */
export function useTableFilters<TStatus extends string = string>(
  options: TableFilterOptions<TStatus> = {}
): UseTableFiltersReturn<TStatus> {
  const [searchParams, setSearchParams] = useSearchParams();

  // ------------------------------------------------------------
  // Resolve Param Keys (Default + Custom Overrides)
  // Deps use individual primitives to avoid infinite loops from inline objects
  // ------------------------------------------------------------
  const cpk = options.customParamKeys;
  const keys = useMemo(() => ({
    page: cpk?.page ?? PARAM_KEYS.page,
    limit: cpk?.limit ?? PARAM_KEYS.limit,
    search: cpk?.search ?? PARAM_KEYS.search,
    search2: cpk?.search2 ?? PARAM_KEYS.search2,
    search3: cpk?.search3 ?? PARAM_KEYS.search3,
    status: cpk?.status ?? PARAM_KEYS.status,
    sort: cpk?.sort ?? PARAM_KEYS.sort,
    dateFrom: cpk?.dateFrom ?? PARAM_KEYS.dateFrom,
    dateTo: cpk?.dateTo ?? PARAM_KEYS.dateTo,
  }), [cpk?.page, cpk?.limit, cpk?.search, cpk?.search2, cpk?.search3, cpk?.status, cpk?.sort, cpk?.dateFrom, cpk?.dateTo]);

  // ------------------------------------------------------------
  // Derive filters from URL params (memoized for performance)
  // ------------------------------------------------------------
  const filters = useMemo<TableFilters<TStatus>>(() => {
    // Define internal default filters based on options
    const defaultInternalFilters: TableFilters<TStatus> = {
      page: options.defaultPage || 1,
      limit: options.defaultLimit || 20,
      search: options.defaultSearch || '',
      search2: options.defaultSearch2 || '',
      search3: options.defaultSearch3 || '',
      status: (options.defaultStatus || 'ALL') as TStatus | 'ALL',
      sort: options.defaultSort || '',
      dateFrom: options.defaultDateFrom || '',
      dateTo: options.defaultDateTo || '',
    };

    const pageParam = searchParams.get(keys.page);
    const limitParam = searchParams.get(keys.limit);

    return {
      page: pageParam ? parseInt(pageParam, 10) : defaultInternalFilters.page,
      limit: limitParam ? parseInt(limitParam, 10) : defaultInternalFilters.limit,
      search: searchParams.get(keys.search) ?? defaultInternalFilters.search,
      search2: searchParams.get(keys.search2) ?? defaultInternalFilters.search2,
      search3: searchParams.get(keys.search3) ?? defaultInternalFilters.search3,
      status: (searchParams.get(keys.status) ?? defaultInternalFilters.status) as TStatus | 'ALL',
      sort: searchParams.get(keys.sort) ?? defaultInternalFilters.sort,
      dateFrom: searchParams.get(keys.dateFrom) ?? defaultInternalFilters.dateFrom,
      dateTo: searchParams.get(keys.dateTo) ?? defaultInternalFilters.dateTo,
    };
  }, [searchParams, keys, options.defaultPage, options.defaultLimit, options.defaultSearch, options.defaultSearch2, options.defaultSearch3, options.defaultStatus, options.defaultSort, options.defaultDateFrom, options.defaultDateTo]);

  // ------------------------------------------------------------
  // Single-Column Sort Config derivation (key:direction)
  // ------------------------------------------------------------
  const sortConfig = useMemo<SortConfig | null>(() => {
    if (!filters.sort) return null;
    const [key, direction] = filters.sort.split(':');
    if (!key || (direction !== 'asc' && direction !== 'desc')) return null;
    return { key, direction: direction as 'asc' | 'desc' };
  }, [filters.sort]);

  // ------------------------------------------------------------
  // Helper to update URL params
  // ------------------------------------------------------------
  const updateParams = useCallback(
    (updates: Partial<TableFilters<TStatus>>, resetPage = false) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);

        // Apply updates
        Object.entries(updates).forEach(([key, value]) => {
          const paramKey = keys[key as keyof typeof keys];
          if (paramKey) {
            if (value !== undefined && value !== '' && value !== null) {
              newParams.set(paramKey, String(value));
            } else {
              newParams.delete(paramKey);
            }
          }
        });

        // Reset page to 1 if requested
        if (resetPage) {
          newParams.set(keys.page, '1');
        }

        return newParams;
      });
    },
    [setSearchParams, keys]
  );

  // ------------------------------------------------------------
  // Handler: Set multiple filters at once
  // ------------------------------------------------------------
  const setFilters = useCallback(
    (updates: Partial<TableFilters<TStatus>>) => {
      // If search or status is changing, reset page
      const shouldResetPage = 'search' in updates || 'search2' in updates || 'search3' in updates || 'status' in updates || 'dateFrom' in updates || 'dateTo' in updates;
      updateParams(updates, shouldResetPage && !('page' in updates));
    },
    [updateParams]
  );

  // ------------------------------------------------------------
  // Handler: Page change (no page reset)
  // ------------------------------------------------------------
  const handlePageChange = useCallback(
    (page: number) => {
      updateParams({ page } as Partial<TableFilters<TStatus>>, false);
    },
    [updateParams]
  );

  // ------------------------------------------------------------
  // Handler: Search change (resets page to 1)
  // ------------------------------------------------------------
  const handleSearchChange = useCallback(
    (value: string) => {
      updateParams({ search: value } as Partial<TableFilters<TStatus>>, true);
    },
    [updateParams]
  );

  // ------------------------------------------------------------
  // Handler: Status change (resets page to 1)
  // ------------------------------------------------------------
  const handleStatusChange = useCallback(
    (status: TStatus | 'ALL') => {
      updateParams({ status } as Partial<TableFilters<TStatus>>, true);
    },
    [updateParams]
  );

  // ------------------------------------------------------------
  // Handler: Date range change (resets page to 1)
  // ------------------------------------------------------------
  const handleDateRangeChange = useCallback(
    (from: string, to: string) => {
      updateParams({ dateFrom: from, dateTo: to } as Partial<TableFilters<TStatus>>, true);
    },
    [updateParams]
  );

  // ------------------------------------------------------------
  // Handler: Secondary search change (resets page to 1)
  // ------------------------------------------------------------
  const handleSearch2Change = useCallback(
    (value: string) => {
      updateParams({ search2: value } as Partial<TableFilters<TStatus>>, true);
    },
    [updateParams]
  );

  // ------------------------------------------------------------
  // Handler: Tertiary search change (resets page to 1)
  // ------------------------------------------------------------
  const handleSearch3Change = useCallback(
    (value: string) => {
      updateParams({ search3: value } as Partial<TableFilters<TStatus>>, true);
    },
    [updateParams]
  );

  // ------------------------------------------------------------
  // Handler: Sort change (Single-Column Logic: New=DESC, Same=Toggle)
  // ------------------------------------------------------------
  const handleSortChange = useCallback(
    (key: string) => {
      const current = sortConfig;
      let newDirection: 'asc' | 'desc' = 'desc';

      if (current && current.key === key) {
        // Same column -> Toggle
        newDirection = current.direction === 'desc' ? 'asc' : 'desc';
      } else {
        // New column -> Always start with DESC (Business Default)
        newDirection = 'desc';
      }

      updateParams({ sort: `${key}:${newDirection}` } as Partial<TableFilters<TStatus>>, false);
    },
    [sortConfig, updateParams]
  );

  // ------------------------------------------------------------
  // Handler: Reset all filters to defaults
  // ------------------------------------------------------------
  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return {
    filters,
    setFilters,
    handlePageChange,
    handleSearchChange,
    handleSearch2Change,
    handleSearch3Change,
    handleStatusChange,
    handleDateRangeChange,
    handleSortChange,
    sortConfig,
    resetFilters,
  };
}

export default useTableFilters;
