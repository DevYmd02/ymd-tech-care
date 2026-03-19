/**
 * @file useTableFilters.ts
 * @description Custom hook for managing table filter state via URL SearchParams
 * @features
 * - Syncs APPLIED filter state with URL params (shareable, bookmarkable URLs)
 * - LOCAL filter state for inputs (no auto-fetching on every keystroke)
 * - Explicit Search: inputs update localFilters, "Search" button commits to appliedFilters (URL)
 * - Type-safe with generic status type support
 * - Compatible with service layer interfaces (PRListParams, RFQFilterCriteria, etc.)
 */

import { useState, useCallback, useMemo } from 'react';
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
  defaultSearch4?: string;
  defaultStatus?: TStatus | 'ALL';
  defaultSort?: string;
  defaultDate_start?: string;
  defaultDate_end?: string;
  customParamKeys?: {
    page?: string;
    limit?: string;
    search?: string;
    search2?: string;
    search3?: string;
    search4?: string;
    status?: string;
    sort?: string;
    date_start?: string;
    date_end?: string;
  };
}

/** Filter state returned by the hook */
export interface TableFilters<TStatus extends string = string> {
  page: number;
  limit: number;
  search: string;
  search2: string;
  search3: string;
  search4: string;
  status: TStatus | 'ALL';
  sort: string;
  date_start: string;
  date_end: string;
}

/** Parsed sort state */
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

/** Return type of the useTableFilters hook */
export interface UseTableFiltersReturn<TStatus extends string = string> {
  /**
   * APPLIED filters (committed to URL, used by React Query).
   * Inputs should NOT bind to this directly.
   */
  filters: TableFilters<TStatus>;

  /**
   * LOCAL draft filters (bound to UI inputs).
   * Does NOT trigger a fetch — only updates UI state.
   */
  localFilters: TableFilters<TStatus>;

  /** Update a single local filter field without triggering a fetch */
  handleFilterChange: (name: keyof TableFilters<TStatus>, value: string) => void;

  /** Commit localFilters → appliedFilters (URL) → triggers fetch */
  handleApplyFilters: () => void;

  /** Update multiple applied filters at once (for programmatic use) */
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

  /** Change quaternary search term (resets page to 1) */
  handleSearch4Change: (value: string) => void;

  /** Change sorting (Single-Column Logic) */
  handleSortChange: (key: string) => void;

  /** Parsed sort configuration derived from filters.sort */
  sortConfig: SortConfig | null;

  /** Reset both local and applied filters to defaults */
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
  search4: 'search4',
  status: 'status',
  sort: 'sort',
  date_start: 'date_start',
  date_end: 'date_end',
} as const;

// ====================================================================================
// HOOK IMPLEMENTATION
// ====================================================================================

/**
 * Custom hook for managing table filter state via URL params.
 * Implements "Explicit Search" pattern:
 * - `localFilters` → bound to UI inputs (keystroke-safe, no fetch)
 * - `filters` (applied) → committed to URL, drives React Query
 * - `handleFilterChange(name, value)` → updates localFilters only
 * - `handleApplyFilters()` → commits localFilters → URL → refetch
 * - `resetFilters()` → clears both local and applied filters
 */
export function useTableFilters<TStatus extends string = string>(
  options: TableFilterOptions<TStatus> = {}
): UseTableFiltersReturn<TStatus> {
  const [searchParams, setSearchParams] = useSearchParams();

  // ------------------------------------------------------------
  // Resolve Param Keys (Default + Custom Overrides)
  // ------------------------------------------------------------
  const cpk = options.customParamKeys;
  const keys = useMemo(() => ({
    page: cpk?.page ?? PARAM_KEYS.page,
    limit: cpk?.limit ?? PARAM_KEYS.limit,
    search: cpk?.search ?? PARAM_KEYS.search,
    search2: cpk?.search2 ?? PARAM_KEYS.search2,
    search3: cpk?.search3 ?? PARAM_KEYS.search3,
    search4: cpk?.search4 ?? PARAM_KEYS.search4,
    status: cpk?.status ?? PARAM_KEYS.status,
    sort: cpk?.sort ?? PARAM_KEYS.sort,
    date_start: cpk?.date_start ?? PARAM_KEYS.date_start,
    date_end: cpk?.date_end ?? PARAM_KEYS.date_end,
  }), [cpk?.page, cpk?.limit, cpk?.search, cpk?.search2, cpk?.search3, cpk?.search4, cpk?.status, cpk?.sort, cpk?.date_start, cpk?.date_end]);

  // ------------------------------------------------------------
  // Default filter values (used for reset)
  // ------------------------------------------------------------
  const defaultFilters = useMemo<TableFilters<TStatus>>(() => ({
    page: options.defaultPage || 1,
    limit: options.defaultLimit || 20,
    search: options.defaultSearch || '',
    search2: options.defaultSearch2 || '',
    search3: options.defaultSearch3 || '',
    search4: options.defaultSearch4 || '',
    status: (options.defaultStatus || 'ALL') as TStatus | 'ALL',
    sort: options.defaultSort || '',
    date_start: options.defaultDate_start || '',
    date_end: options.defaultDate_end || '',
  }), [options.defaultPage, options.defaultLimit, options.defaultSearch, options.defaultSearch2, options.defaultSearch3, options.defaultSearch4, options.defaultStatus, options.defaultSort, options.defaultDate_start, options.defaultDate_end]);

  // ------------------------------------------------------------
  // APPLIED filters: Derived from URL params (triggers React Query)
  // ------------------------------------------------------------
  const filters = useMemo<TableFilters<TStatus>>(() => {
    const pageParam = searchParams.get(keys.page);
    const limitParam = searchParams.get(keys.limit);
    return {
      page: pageParam ? parseInt(pageParam, 10) : defaultFilters.page,
      limit: limitParam ? parseInt(limitParam, 10) : defaultFilters.limit,
      search: searchParams.get(keys.search) ?? defaultFilters.search,
      search2: searchParams.get(keys.search2) ?? defaultFilters.search2,
      search3: searchParams.get(keys.search3) ?? defaultFilters.search3,
      search4: searchParams.get(keys.search4) ?? defaultFilters.search4,
      status: (searchParams.get(keys.status) ?? defaultFilters.status) as TStatus | 'ALL',
      sort: searchParams.get(keys.sort) ?? defaultFilters.sort,
      date_start: searchParams.get(keys.date_start) ?? defaultFilters.date_start,
      date_end: searchParams.get(keys.date_end) ?? defaultFilters.date_end,
    };
  }, [searchParams, keys, defaultFilters]);

  // ------------------------------------------------------------
  // LOCAL draft filters: Bound to UI inputs (does NOT trigger fetch)
  // Initialized from the current applied filters (URL)
  // ------------------------------------------------------------
  const [localFilters, setLocalFilters] = useState<TableFilters<TStatus>>(filters);

  // ------------------------------------------------------------
  // Handler: Update a single local filter field (no fetch)
  // ------------------------------------------------------------
  const handleFilterChange = useCallback(
    (name: keyof TableFilters<TStatus>, value: string) => {
      setLocalFilters((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // ------------------------------------------------------------
  // Handler: Commit localFilters → URL (triggers React Query fetch)
  // ------------------------------------------------------------
  const handleApplyFilters = useCallback(() => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);

      // Commit all local filter values to URL
      const filterMap: Array<[string, string | number]> = [
        [keys.search, localFilters.search],
        [keys.search2, localFilters.search2],
        [keys.search3, localFilters.search3],
        [keys.search4, localFilters.search4],
        [keys.status, localFilters.status],
        [keys.date_start, localFilters.date_start],
        [keys.date_end, localFilters.date_end],
        [keys.sort, localFilters.sort],
      ];

      filterMap.forEach(([paramKey, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          newParams.set(paramKey, String(value));
        } else {
          newParams.delete(paramKey);
        }
      });

      // Always reset page to 1 on new search
      newParams.set(keys.page, '1');

      return newParams;
    });
  }, [setSearchParams, keys, localFilters]);

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
  // Helper to update URL params (for programmatic setFilters)
  // ------------------------------------------------------------
  const updateParams = useCallback(
    (updates: Partial<TableFilters<TStatus>>, resetPage = false) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);

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

        if (resetPage) {
          newParams.set(keys.page, '1');
        }

        return newParams;
      });
    },
    [setSearchParams, keys]
  );

  // ------------------------------------------------------------
  // Handler: Set multiple applied filters at once (programmatic)
  // ------------------------------------------------------------
  const setFilters = useCallback(
    (updates: Partial<TableFilters<TStatus>>) => {
      const shouldResetPage = 'search' in updates || 'search2' in updates || 'search3' in updates || 'search4' in updates || 'status' in updates || 'date_start' in updates || 'date_end' in updates;
      updateParams(updates, shouldResetPage && !('page' in updates));
      // Also sync local filters when programmatic updates are made
      setLocalFilters((prev) => ({ ...prev, ...updates }));
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
  // Handler: Search change (resets page to 1) — Legacy/Programmatic
  // ------------------------------------------------------------
  const handleSearchChange = useCallback(
    (value: string) => {
      updateParams({ search: value } as Partial<TableFilters<TStatus>>, true);
      setLocalFilters((prev) => ({ ...prev, search: value }));
    },
    [updateParams]
  );

  // ------------------------------------------------------------
  // Handler: Status change (resets page to 1)
  // ------------------------------------------------------------
  const handleStatusChange = useCallback(
    (status: TStatus | 'ALL') => {
      updateParams({ status } as Partial<TableFilters<TStatus>>, true);
      setLocalFilters((prev) => ({ ...prev, status }));
    },
    [updateParams]
  );

  // ------------------------------------------------------------
  // Handler: Date range change (resets page to 1)
  // ------------------------------------------------------------
  const handleDateRangeChange = useCallback(
    (from: string, to: string) => {
      updateParams({ date_start: from, date_end: to } as Partial<TableFilters<TStatus>>, true);
      setLocalFilters((prev) => ({ ...prev, date_start: from, date_end: to }));
    },
    [updateParams]
  );

  // ------------------------------------------------------------
  // Handler: Secondary search change (resets page to 1)
  // ------------------------------------------------------------
  const handleSearch2Change = useCallback(
    (value: string) => {
      updateParams({ search2: value } as Partial<TableFilters<TStatus>>, true);
      setLocalFilters((prev) => ({ ...prev, search2: value }));
    },
    [updateParams]
  );

  // ------------------------------------------------------------
  // Handler: Tertiary search change (resets page to 1)
  // ------------------------------------------------------------
  const handleSearch3Change = useCallback(
    (value: string) => {
      updateParams({ search3: value } as Partial<TableFilters<TStatus>>, true);
      setLocalFilters((prev) => ({ ...prev, search3: value }));
    },
    [updateParams]
  );

  // ------------------------------------------------------------
  // Handler: Quaternary search change (resets page to 1)
  // ------------------------------------------------------------
  const handleSearch4Change = useCallback(
    (value: string) => {
      updateParams({ search4: value } as Partial<TableFilters<TStatus>>, true);
      setLocalFilters((prev) => ({ ...prev, search4: value }));
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
        newDirection = current.direction === 'desc' ? 'asc' : 'desc';
      } else {
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
    setLocalFilters(defaultFilters);
  }, [setSearchParams, defaultFilters]);

  return {
    filters,
    localFilters,
    handleFilterChange,
    handleApplyFilters,
    setFilters,
    handlePageChange,
    handleSearchChange,
    handleSearch2Change,
    handleSearch3Change,
    handleSearch4Change,
    handleStatusChange,
    handleDateRangeChange,
    handleSortChange,
    sortConfig,
    resetFilters,
  };
}

export default useTableFilters;
