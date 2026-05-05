import { useQuery } from '@tanstack/react-query';
import { DeliveryService, type DeliveryListParams } from '../services/delivery.service';

/**
 * @file useDelivery.ts
 * @description Hooks สำหรับการดึงข้อมูล Delivery
 */

/**
 * Hook สำหรับดึงรายการ Delivery พร้อม Pagination และ Filter
 */
export const useDeliveryList = (params: DeliveryListParams) => {
    return useQuery({
        queryKey: ['deliveries', params],
        queryFn: () => DeliveryService.getList(params),
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook สำหรับดึงรายละเอียด Delivery รายตัว
 */
export const useDeliveryDetail = (id?: string) => {
    return useQuery({
        queryKey: ['delivery', id],
        queryFn: () => (id ? DeliveryService.getById(id) : Promise.resolve(null)),
        enabled: !!id,
        staleTime: 2 * 60 * 1000,
    });
};
