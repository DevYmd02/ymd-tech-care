/**
 * @file useSalesAreaList.ts
 * @description Hook สำหรับจัดการ logic ของหน้ารายการเขตการขาย
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SaleAreaService } from '../services/area.service';
import type { SaleAreaListItem } from '../types/area.types';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { logger } from '@/shared/utils/logger';

export function useSalesAreaList() {
    const { 
        filters, 
        setFilters, 
        handlePageChange,
        resetFilters
    } = useTableFilters({
        customParamKeys: {
          search: 'sale_area_code',
          search2: 'sale_area_name'
        }
    });

    const [allAreas, setAllAreas] = useState<SaleAreaListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await SaleAreaService.getList();
            setAllAreas(data);
        } catch (error) {
            logger.error('Failed to fetch sales areas:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredData = useMemo(() => {
        let result = [...allAreas];

        // Filter by Status
        if (filters.status !== 'ALL') {
            result = result.filter(item => 
                filters.status === 'ACTIVE' ? item.is_active : !item.is_active
            );
        }

        // Filter by Code
        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(item => item.sale_area_code.toLowerCase().includes(term));
        }

        // Filter by Name
        if (filters.search2) {
            const term = filters.search2.toLowerCase();
            result = result.filter(item => item.sale_area_name.toLowerCase().includes(term));
        }

        // Sort by Created Date Desc
        result.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

        return result;
    }, [allAreas, filters]);

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
        if (confirm('คุณต้องการลบเขตการขายนี้หรือไม่?')) {
            try {
                await SaleAreaService.delete(id);
                fetchData();
            } catch (error) {
                logger.error('Failed to delete sales area:', error);
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
        allAreas,
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
