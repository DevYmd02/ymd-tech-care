import { useQuery } from '@tanstack/react-query';
import { SalesOrderService, type SalesOrderListParams } from '../services/sales-order.service';

/**
 * @file useSalesOrder.ts
 * @description Hooks สำหรับการดึงข้อมูล Sales Order
 */

/**
 * Hook สำหรับดึงรายการ Sales Order พร้อมรองรับ Pagination และ Filter
 */
export const useSalesOrderList = (params: SalesOrderListParams) => {
    return useQuery({
        queryKey: ['sales-orders', params],
        queryFn: () => SalesOrderService.getList(params),
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook สำหรับดึงรายละเอียด Sales Order รายตัว
 */
export const useSalesOrderDetail = (id?: string) => {
    return useQuery({
        queryKey: ['sales-order', id],
        queryFn: () => id ? SalesOrderService.getById(id) : Promise.resolve(null),
        enabled: !!id,
        staleTime: 2 * 60 * 1000,
    });
};
