import { useState, useCallback, useMemo, useEffect } from 'react';
import { useToast } from '@ui/feedback/Toast';
import { logger } from '@/shared/utils/logger';
import type { ICOption, ICOptionFilters } from '../types/ic-option.types';
import { ICOptionService } from '../services/ic-option.service';
import { BranchService } from '@/modules/master-data/company/services/branch.service';

export function useICOption() {
    const { toast } = useToast();
    const [data, setData] = useState<ICOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [filters, setFilters] = useState<ICOptionFilters>({
        search: '',
        page: 1,
        limit: 10,
    });

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [res, branchesRes] = await Promise.all([
                ICOptionService.getICOptions(),
                BranchService.getList({ page: 1, limit: 1000 })
            ]);
            
            const branches = Array.isArray(branchesRes) ? branchesRes : (branchesRes?.items ?? []);
            const branchMap = new Map(branches.map(b => [b.id || b.branch_id, b]));

            // Map branch details into ICOption data
            const enrichedData = res.map(item => {
                const branch = branchMap.get(item.branch_id);
                return {
                    ...item,
                    branch_code: branch?.branch_code,
                    branch_name: branch?.branch_name
                };
            });

            setData(enrichedData);
        } catch (error) {
            toast('เกิดข้อผิดพลาดในการโหลดข้อมูล Base IC Option', 'error');
            logger.error('Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filtering & Pagination
    const filteredData = useMemo(() => {
        let sorted = [...data];

        // Ensure new items naturally appear first since we prepend them in service
        
        if (filters.search) {
            const query = filters.search.toLowerCase();
            sorted = sorted.filter(item => 
                item.aging_expire?.toLowerCase().includes(query) ||
                String(item.branch_id ?? '').includes(query)
            );
        }
        return sorted;
    }, [data, filters.search]);

    const paginatedData = useMemo(() => {
        const startIndex = (filters.page - 1) * filters.limit;
        return filteredData.slice(startIndex, startIndex + filters.limit);
    }, [filteredData, filters.page, filters.limit]);

    // Event Handlers
    const handleSetFilters = (newFilters: Partial<ICOptionFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters, page: newFilters.page ?? 1 }));
    };

    const handleCreateNew = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setTimeout(() => setEditingId(null), 200); // Wait for modal close animation
    };

    return {
        data,
        filters,
        setFilters: handleSetFilters,
        isLoading,
        isModalOpen,
        editingId,
        filteredData,
        paginatedData,
        fetchData,
        handleCreateNew,
        handleEdit,
        handleModalClose,
        resetFilters: () => setFilters({ search: '', page: 1, limit: 10 }),
        handlePageChange: (page: number) => handleSetFilters({ page }),
    };
}
