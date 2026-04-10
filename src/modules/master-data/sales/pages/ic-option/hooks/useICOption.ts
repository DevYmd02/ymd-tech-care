import { useState, useCallback, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { ICOption, ICOptionFilters } from '../types/ic-option.types';
import { ICOptionService } from '../services/ic-option.service';

export function useICOption() {
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
            const res = await ICOptionService.getICOptions();
            setData(res);
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล Base IC Option');
            console.error('Fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
                item.branch_id?.toLowerCase().includes(query)
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

    const handleDelete = async (id: string) => {
        if (!window.confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) return;
        
        try {
            await ICOptionService.deleteICOption(id);
            toast.success('ลบข้อมูลสำเร็จ');
            fetchData();
        } catch (err) {
            toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
            console.error(err);
        }
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
        handleDelete,
        handleModalClose,
        resetFilters: () => setFilters({ search: '', page: 1, limit: 10 }),
        handlePageChange: (page: number) => handleSetFilters({ page }),
    };
}
