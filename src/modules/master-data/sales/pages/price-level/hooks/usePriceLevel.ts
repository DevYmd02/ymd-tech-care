/**
 * @file usePriceLevel.ts
 * @description Hook for managing Price Level listing logic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PriceLevelService } from '../services/price-level.service';
import type { PriceLevel } from '../types/price-level.types';
import { useTableFilters } from '@/shared/hooks/useTableFilters';

export function usePriceLevel() {
    const { 
        filters, 
        setFilters, 
        handlePageChange,
        resetFilters
    } = useTableFilters({
        customParamKeys: {
          search: 'item_name'
        }
    });

    const [allPriceLevels, setAllPriceLevels] = useState<PriceLevel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await PriceLevelService.getList();
            setAllPriceLevels(data);
        } catch (error) {
            console.error('Failed to fetch price levels:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredData = useMemo(() => {
        let result = [...allPriceLevels];

        // Filter by Search (Item Code or Name)
        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(item => 
                (item.item_name || '').toLowerCase().includes(term) ||
                (item.item_code || '').toLowerCase().includes(term) ||
                (item.item_name_en || '').toLowerCase().includes(term)
            );
        }

        // Sort by listno if available, else by item_id
        result.sort((a, b) => (a.listno || 0) - (b.listno || 0));

        return result;
    }, [allPriceLevels, filters]);

    const paginatedData = useMemo(() => {
        const startIndex = (filters.page - 1) * filters.limit;
        return filteredData.slice(startIndex, startIndex + filters.limit);
    }, [filteredData, filters.page, filters.limit]);

    const handleCreateNew = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleDelete = useCallback(async (id: string) => {
        if (confirm('คุณต้องการลบรายการนี้หรือไม่?')) {
            try {
                const success = await PriceLevelService.delete(id);
                if (success) {
                    fetchData();
                }
            } catch (error) {
                console.error('Failed to delete price level:', error);
            }
        }
    }, [fetchData]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    return {
        filters,
        setFilters,
        handlePageChange,
        resetFilters,
        isLoading,
        isModalOpen,
        editingId,
        filteredData,
        paginatedData,
        fetchData,
        handleCreateNew,
        handleEdit,
        handleDelete,
        handleModalClose
    };
}
