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
        queryFn: ({ signal }) => SalesOrderService.getList(params, { signal }),
        staleTime: 1000 * 30, // 30s
    });
};

/**
 * Hook สำหรับดึงรายละเอียด Sales Order รายตัว
 */
export const useSalesOrderDetail = (id?: string) => {
    return useQuery({
        queryKey: ['sales-order', id],
        queryFn: ({ signal }) => id ? SalesOrderService.getById(id, { signal }) : Promise.resolve(null),
        enabled: !!id,
        staleTime: 1000 * 60, // 1m
    });
};
