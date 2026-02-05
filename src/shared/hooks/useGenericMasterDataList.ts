/**
 * @file useGenericMasterDataList.ts
 * @description Custom hook for managing generic master data list state and logic
 * @usage Used with GenericMasterDataList component to handle filtering, pagination, and CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import type { GenericMasterDataItem } from '@/modules/master-data/types/generic-master-data-types';

/**
 * Filter function type for master data items
 */
export type MasterDataFilterFn<T> = (
    items: T[],
    searchTerm: string,
    statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE'
) => T[];

/**
 * Hook configuration
 */
export interface UseGenericMasterDataListConfig<T> {
    /** Function to fetch data (can be async) */
    fetchData: () => Promise<T[]> | T[];
    /** Custom filter function (optional, uses default if not provided) */
    filterFn?: MasterDataFilterFn<T>;
    /** Search fields to filter by (used in default filter) */
    searchFields?: Array<keyof T>;
    /** Initial rows per page */
    initialRowsPerPage?: number;
}

/**
 * Default filter function for master data
 */
function defaultFilterFn<T extends GenericMasterDataItem>(
    items: T[],
    searchTerm: string,
    statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE',
    searchFields: Array<keyof T>
): T[] {
    let filtered = [...items];

    // Filter by status
    if (statusFilter !== 'ALL') {
        filtered = filtered.filter((item) =>
            statusFilter === 'ACTIVE' ? item.is_active : !item.is_active
        );
    }

    // Filter by search term
    if (searchTerm && searchFields.length > 0) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter((item) =>
            searchFields.some((field) => {
                const value = item[field];
                return value && String(value).toLowerCase().includes(term);
            })
        );
    }

    return filtered;
}

/**
 * Custom hook for managing generic master data list
 */
export function useGenericMasterDataList<T extends GenericMasterDataItem>(
    config: UseGenericMasterDataListConfig<T>
) {
    const { fetchData, filterFn, searchFields = [], initialRowsPerPage = 10 } = config;

    // State
    const [allItems, setAllItems] = useState<T[]>([]);
    const [filteredItems, setFilteredItems] = useState<T[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch and filter data
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchData();
            setAllItems(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setAllItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [fetchData]);

    // Apply filters whenever dependencies change
    useEffect(() => {
        const applyFilters = () => {
            const filterFunction = filterFn || ((items, search, status) =>
                defaultFilterFn(items, search, status, searchFields)
            );
            const filtered = filterFunction(allItems, searchTerm, statusFilter);
            setFilteredItems(filtered);
        };

        applyFilters();
    }, [allItems, searchTerm, statusFilter, filterFn, searchFields]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, rowsPerPage]);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Calculate pagination
    const totalItems = filteredItems.length;
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + rowsPerPage);

    // Handlers
    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
    };

    const handleStatusFilterChange = (status: 'ALL' | 'ACTIVE' | 'INACTIVE') => {
        setStatusFilter(status);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleRowsPerPageChange = (rows: number) => {
        setRowsPerPage(rows);
    };

    const handleRefresh = () => {
        loadData();
    };

    return {
        // Data
        items: paginatedItems,
        totalItems,
        allItems,
        filteredItems,

        // State
        isLoading,
        searchTerm,
        statusFilter,
        currentPage,
        rowsPerPage,
        totalPages,

        // Handlers
        onSearchChange: handleSearchChange,
        onStatusFilterChange: handleStatusFilterChange,
        onPageChange: handlePageChange,
        onRowsPerPageChange: handleRowsPerPageChange,
        onRefresh: handleRefresh,
        refresh: loadData,
    };
}
