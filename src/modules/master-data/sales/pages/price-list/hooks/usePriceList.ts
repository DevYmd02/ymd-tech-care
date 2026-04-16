/**
 * @file usePriceList.ts
 * @description Hook for managing Price List logic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PriceListService } from '@master-data/sales/pages/price-list/services/price-list.service';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import type { PriceListHeader } from '@master-data/sales/pages/price-list/types/price-list.types';
import { useTableFilters } from '@/shared/hooks/useTableFilters';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { logger } from '@/shared/utils/logger';
import toast from 'react-hot-toast';

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

    const { confirm: confirmDialog } = useConfirmation();

    const [allPriceLists, setAllPriceLists] = useState<PriceListHeader[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // STEP 1: Fetch both Price Lists and Customers in parallel for efficiency
            const [plResponse, custResponse] = await Promise.all([
                PriceListService.getList(),
                CustomerService.getList({ limit: 1000 }) // Load a large batch to catch most customers
            ]);

            const priceLists = Array.isArray(plResponse) ? plResponse : [];
            const customers = custResponse?.data || [];
            
            // STEP 2: Create a quick-lookup map for customers
            const customerMap = new Map();
            customers.forEach(cust => {
                const id = String(cust.customer_id || cust.id);
                customerMap.set(id, cust);
            });

            // STEP 3: Hydrate Price List data with Customer names/codes
            const hydratedData = priceLists.map(pl => {
                const custId = String(pl.customer_id || '');
                const custBase = customerMap.get(custId);
                
                return {
                    ...pl,
                    customer_code: custBase?.customer_code || pl.customer_code,
                    customer_name_th: custBase?.customer_name_th || custBase?.customer_name || pl.customer_name_th || pl.customer_name
                };
            });

            setAllPriceLists(hydratedData);
        } catch (error) {
            logger.error('Failed to fetch price lists/customers:', error);
            toast.error('ไม่สามารถโหลดข้อมูลได้');
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
        const isConfirmed = await confirmDialog({
            title: 'ยืนยันการลบ',
            description: 'คุณต้องการลบรายการราคานี้หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
            variant: 'danger',
            confirmText: 'ลบรายการ'
        });

        if (isConfirmed) {
            try {
                await PriceListService.delete(id);
                fetchData();
            } catch (error) {
                logger.error('Failed to delete price list:', error);
            }
        }
    }, [confirmDialog, fetchData]);

    const handleApprove = useCallback(async (id: string) => {
        const isConfirmed = await confirmDialog({
            title: 'ยืนยันการอนุมัติ',
            description: 'คุณต้องการอนุมัติรายการราคานี้หรือไม่?',
            variant: 'info',
            confirmText: 'อนุมัติ'
        });

        if (isConfirmed) {
            try {
                const result = await PriceListService.approve(id);
                if (result.success) {
                    toast.success('อนุมัติสำเร็จ');
                    fetchData();
                } else {
                    toast.error(result.message || 'อนุมัติไม่สำเร็จ');
                }
            } catch (error) {
                logger.error('Failed to approve price list:', error);
                toast.error('เกิดข้อผิดพลาดในการอนุมัติ');
            }
        }
    }, [confirmDialog, fetchData]);

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
        handleApprove,
        handleModalClose
    };
}
