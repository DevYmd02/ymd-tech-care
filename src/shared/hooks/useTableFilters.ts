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
  const {
    defaultPage = 1,
    defaultLimit = 20,
    defaultSearch = '',
    defaultStatus = 'ALL' as TStatus | 'ALL',
    defaultSort = '',
    defaultDateFrom = '',
    defaultDateTo = '',
  } = options;

  // ------------------------------------------------------------
  // Resolve Param Keys (Default + Custom Overrides)
  // ------------------------------------------------------------
  const keys = useMemo(() => ({
    page: options.customParamKeys?.page ?? PARAM_KEYS.page,
    limit: options.customParamKeys?.limit ?? PARAM_KEYS.limit,
    search: options.customParamKeys?.search ?? PARAM_KEYS.search,
    search2: options.customParamKeys?.search2 ?? PARAM_KEYS.search2,
    search3: options.customParamKeys?.search3 ?? PARAM_KEYS.search3,
    status: options.customParamKeys?.status ?? PARAM_KEYS.status,
    sort: options.customParamKeys?.sort ?? PARAM_KEYS.sort,
    dateFrom: options.customParamKeys?.dateFrom ?? PARAM_KEYS.dateFrom,
    dateTo: options.customParamKeys?.dateTo ?? PARAM_KEYS.dateTo,
  }), [options.customParamKeys]);

  const [searchParams, setSearchParams] = useSearchParams();

  // ------------------------------------------------------------
  // Derive filters from URL params (memoized for performance)
  // ------------------------------------------------------------
  const filters = useMemo<TableFilters<TStatus>>(() => {
    const pageParam = searchParams.get(keys.page);
    const limitParam = searchParams.get(keys.limit);

    return {
      page: pageParam ? parseInt(pageParam, 10) : defaultPage,
      limit: limitParam ? parseInt(limitParam, 10) : defaultLimit,
      search: searchParams.get(keys.search) ?? defaultSearch,
      search2: searchParams.get(keys.search2) ?? '',
      search3: searchParams.get(keys.search3) ?? '',
      status: (searchParams.get(keys.status) ?? defaultStatus) as TStatus | 'ALL',
      sort: searchParams.get(keys.sort) ?? defaultSort,
      dateFrom: searchParams.get(keys.dateFrom) ?? defaultDateFrom,
      dateTo: searchParams.get(keys.dateTo) ?? defaultDateTo,
    };
  }, [searchParams, keys, defaultPage, defaultLimit, defaultSearch, defaultStatus, defaultSort, defaultDateFrom, defaultDateTo]);

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
    resetFilters,
  };
}

export default useTableFilters;
