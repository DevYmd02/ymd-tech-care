/**
 * @file reservation.types.ts
 * @description Type definitions for Sales Reservation module
 */

import { z } from 'zod';
import { ReservationFormSchema, ReservationLineSchema } from '../schemas/reservation-schemas';

export type ReservationLineData = z.infer<typeof ReservationLineSchema>;
export type ReservationFormData = z.infer<typeof ReservationFormSchema>;

// Keep the old interfaces if they are used elsewhere as names, 
// but define them based on the schemas to keep them in sync.
// Actually, using type aliases with z.infer is cleaner.

export interface ReservationHeader {
    reservation_id: string;
    reservation_no: string;
    reservation_date: string;
    customer_code: string;
    customer_name: string;
    branch_name: string;
    total_amount: number;
    status: string;
    created_at: string;
}
