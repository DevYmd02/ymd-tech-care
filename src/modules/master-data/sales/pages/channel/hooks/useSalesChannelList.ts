/**
 * @file useSalesChannelList.ts
 * @description Hook สำหรับจัดการ logic ของหน้ารายการช่องทางการขาย
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SalesChannelService } from '../services/channel.service';
import type { SalesChannelListItem } from '../types/channel.types';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { useConfirmation } from '@/shared/hooks/useConfirmation';

export function useSalesChannelList() {
    const { 
        filters, 
        setFilters, 
        handlePageChange,
        resetFilters
    } = useTableFilters({
        customParamKeys: {
          search: 'channel_code',
          search2: 'channel_name'
        }
    });

    const [allChannels, setAllChannels] = useState<SalesChannelListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { confirm } = useConfirmation();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await SalesChannelService.getList();
            setAllChannels(data);
        } catch (error) {
            console.error('Failed to fetch sales channels:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredData = useMemo(() => {
        let result = [...allChannels];

        // Filter by Status
        if (filters.status !== 'ALL') {
            result = result.filter(item => 
                filters.status === 'ACTIVE' ? item.is_active : !item.is_active
            );
        }

        // Filter by Code
        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(item => item.channel_code.toLowerCase().includes(term));
        }

        // Filter by Name
        if (filters.search2) {
            const term = filters.search2.toLowerCase();
            result = result.filter(item => item.channel_name.toLowerCase().includes(term));
        }

        // Sort by Created Date Desc
        result.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

        return result;
    }, [allChannels, filters]);

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
        const confirmed = await confirm({
            title: 'ยืนยันการลบ',
            description: 'คุณต้องการลบช่องทางการขายนี้หรือไม่?',
            variant: 'danger',
            confirmText: 'ลบ',
            cancelText: 'ยกเลิก'
        });

        if (confirmed) {
            try {
                await SalesChannelService.delete(id);
                fetchData();
            } catch (error) {
                console.error('Failed to delete sales channel:', error);
            }
        }
    }, [fetchData, confirm]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    return {
        filters,
        setFilters,
        handlePageChange,
        resetFilters,
        allChannels,
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
