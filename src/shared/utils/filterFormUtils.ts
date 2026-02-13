/**
 * @file filterFormUtils.ts
 * @description Utility functions and types for FilterFormBuilder
 */

// ====================================================================================
// HELPER FUNCTION FOR CREATING FILTER CHANGE HANDLER
// ====================================================================================

/**
 * Helper type for creating a filter change handler from useTableFilters
 * Maps filter names to their corresponding handler functions
 */
export type FilterChangeHandlers = {
    search: (value: string) => void;
    search2: (value: string) => void;
    search3: (value: string) => void;
    status: (value: string) => void;
    dateFrom: (value: string) => void;
    dateTo: (value: string) => void;
};

/**
 * Creates a unified filter change handler from individual handlers
 * 
 * @example
 * ```tsx
 * const handleFilterChange = createFilterChangeHandler({
 *   search: handleSearchChange,
 *   search2: handleSearch2Change,
 *   status: (val) => handleStatusChange(val as Status),
 *   dateFrom: (val) => handleDateRangeChange(val, filters.dateTo),
 *   dateTo: (val) => handleDateRangeChange(filters.dateFrom, val),
 * });
 * ```
 */
export function createFilterChangeHandler(
    handlers: Partial<FilterChangeHandlers>
): (name: string, value: string) => void {
    return (name: string, value: string) => {
        const handler = handlers[name as keyof FilterChangeHandlers];
        if (handler) {
            handler(value);
        }
    };
}
