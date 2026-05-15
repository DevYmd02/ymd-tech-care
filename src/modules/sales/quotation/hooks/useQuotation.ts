import { useQuery } from '@tanstack/react-query';
import { QuotationService, type QuotationListParams } from '@sales/quotation/services/quotation.service';

/**
 * @file useQuotation.ts
 * @description Hooks สำหรับการดึงข้อมูล Quotation
 */

/**
 * Hook สำหรับดึงรายการ Quotation พร้อมรองรับ Pagination และ Filter
 */
export const useQuotationList = (params: QuotationListParams) => {
    return useQuery({
        queryKey: ['quotations', params],
        queryFn: ({ signal }) => QuotationService.getList(params, { signal }),
        staleTime: 5 * 60 * 1000,
    });
};

/**
 * Hook สำหรับดึงรายละเอียด Quotation รายตัว
 */
export const useQuotationDetail = (id?: string) => {
    return useQuery({
        queryKey: ['quotation', id],
        queryFn: ({ signal }) => id ? QuotationService.getById(id, { signal }) : Promise.resolve(null),
        enabled: !!id,
        staleTime: 2 * 60 * 1000,
    });
};
