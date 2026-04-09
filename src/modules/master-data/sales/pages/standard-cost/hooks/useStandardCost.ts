/**
 * @file useStandardCost.ts
 * @description Hook for managing Standard Cost List logic
 */

import { useState, useEffect, useCallback } from 'react';
import { StandardCostService } from '../services/standard-cost.service';
import type { StandardCostHeader, StandardCostFilter } from '../types/standard-cost.types';
import { logger } from '@/shared/utils/logger';

export const useStandardCost = () => {
    const [data, setData] = useState<StandardCostHeader[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<StandardCostFilter>({
        search: '',
        page: 1,
        limit: 10,
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await StandardCostService.getList({
                q: filter.search,
                page: filter.page,
                limit: filter.limit,
            });
            setData(response || []);
        } catch (error) {
            logger.error('Failed to fetch standard costs:', error);
            // Swallowed error to keep UI stable, but logger notified
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (id: number) => {
        if (window.confirm('คุณต้องการลบข้อมูลต้นทุนมาตรฐานนี้ใช่หรือไม่?')) {
            const success = await StandardCostService.delete(id);
            if (success) {
                alert('ลบข้อมูลสำเร็จ');
                fetchData();
            } else {
                alert('ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
            }
        }
    };

    const handleSearch = (search: string) => {
        setFilter(prev => ({ ...prev, search, page: 1 }));
    };

    return {
        data,
        isLoading,
        filter,
        setFilter,
        handleDelete,
        handleSearch,
        refresh: fetchData,
    };
};
