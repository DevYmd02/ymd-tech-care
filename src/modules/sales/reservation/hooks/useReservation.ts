import { useQuery } from '@tanstack/react-query';
import { ReservationService, type ReservationListParams } from '@sales/reservation/services/reservation.service';

/**
 * @file useReservation.ts
 * @description Hooks สำหรับการดึงข้อมูล Reservation
 */

/**
 * Hook สำหรับดึงรายการ Reservation พร้อมรองรับ Pagination และ Filter
 */
export const useReservationList = (params: ReservationListParams) => {
    return useQuery({
        queryKey: ['sales-reservations', params],
        queryFn: () => ReservationService.getList(params),
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook สำหรับดึงรายละเอียด Reservation รายตัว
 */
export const useReservationDetail = (id?: string) => {
    return useQuery({
        queryKey: ['sales-reservation', id],
        queryFn: () => id ? ReservationService.getById(id) : Promise.resolve(null),
        enabled: !!id,
        staleTime: 2 * 60 * 1000,
    });
};
