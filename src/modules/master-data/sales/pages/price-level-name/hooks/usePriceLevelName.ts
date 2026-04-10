/**
 * @file usePriceLevelName.ts
 * @description Hook for managing Price Level Name listing logic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PriceLevelNameService } from '@sales-master/pages/price-level-name/services/price-level-name.service';
import type { PriceLevelName } from '../types/price-level-name.types';
import { logger } from '@/shared/utils/logger';

export function usePriceLevelName(isActive: boolean = true) {
    const [allItems, setAllItems] = useState<PriceLevelName[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await PriceLevelNameService.getList();
            const data = Array.isArray(response) ? response : [];
            // Sort by level_no ascending
            data.sort((a, b) => (a.level_no || 0) - (b.level_no || 0));
            setAllItems(data);
        } catch (error: unknown) {
            logger.error('Failed to fetch price level names:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        if (isActive && !hasFetched) {
            fetchData();
            setHasFetched(true);
        }
    }, [isActive, fetchData, hasFetched]);

    const filteredData = useMemo(() => {
        if (!search) return allItems;
        const term = search.toLowerCase();
        return allItems.filter(item =>
            (item.code || '').toLowerCase().includes(term) ||
            (item.name || '').toLowerCase().includes(term)
        );
    }, [allItems, search]);

    const paginatedData = useMemo(() => {
        const startIndex = (page - 1) * limit;
        return filteredData.slice(startIndex, startIndex + limit);
    }, [filteredData, page, limit]);

    const handleCreateNew = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (id: string | number) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleDelete = useCallback(async (id: string | number) => {
        if (confirm('คุณต้องการลบรายการนี้หรือไม่?')) {
            try {
                const success = await PriceLevelNameService.delete(id);
                if (success) {
                    fetchData();
                }
            } catch (error: unknown) {
                logger.error('Failed to delete price level name:', error);
            }
        }
    }, [fetchData]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handlePageChange = (newPage: number) => setPage(newPage);

    const resetFilters = () => {
        setSearch('');
        setPage(1);
    };

    return {
        allItems,
        filteredData,
        paginatedData,
        isLoading,
        isModalOpen,
        editingId,
        search,
        setSearch,
        page,
        setPage,
        limit,
        setLimit,
        fetchData,
        handleCreateNew,
        handleEdit,
        handleDelete,
        handleModalClose,
        handlePageChange,
        resetFilters,
    };
}
