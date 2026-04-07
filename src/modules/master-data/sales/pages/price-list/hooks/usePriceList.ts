/**
 * @file usePriceList.ts
 * @description Hook for managing Price List logic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PriceListService } from '@master-data/sales/pages/price-list/services/price-list.service';
import type { PriceListHeader } from '@master-data/sales/pages/price-list/types/price-list.types';
import { useTableFilters } from '@/shared/hooks/useTableFilters';

export function usePriceList() {
    const { 
        filters, 
        setFilters, 
        handlePageChange,
        resetFilters
    } = useTableFilters({
        customParamKeys: {
          search: 'price_list_no',
          search2: 'price_list_name'
        }
    });

    const [allPriceLists, setAllPriceLists] = useState<PriceListHeader[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await PriceListService.getList();
            setAllPriceLists(data);
        } catch (error) {
            console.error('Failed to fetch price lists:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredData = useMemo(() => {
        let result = [...allPriceLists];

        // Filter by Status
        if (filters.status !== 'ALL') {
            result = result.filter(item => 
                filters.status === 'ACTIVE' ? item.is_active : !item.is_active
            );
        }

        // Filter by No
        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(item => item.price_list_no.toLowerCase().includes(term));
        }

        // Filter by Name
        if (filters.search2) {
            const term = filters.search2.toLowerCase();
            result = result.filter(item => item.price_list_name.toLowerCase().includes(term));
        }

        // Sort by Created Date Desc
        result.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

        return result;
    }, [allPriceLists, filters]);

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
        if (confirm('คุณต้องการลบรายการราคานี้หรือไม่?')) {
            try {
                await PriceListService.delete(id);
                fetchData();
            } catch (error) {
                console.error('Failed to delete price list:', error);
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
