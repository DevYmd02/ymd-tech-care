import api, { USE_MOCK, extractErrorMessage } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import type { QuotationFormData, QuotationHeader, QuotationListItem } from '@sales/quotation/types/quotation.types';
import type { QuotationFormValues } from '@sales/quotation/schemas/quotation-schemas';
import { applyClientFilters, extractArrayFromResponse, type PaginatedResponse } from '@/shared/utils/clientFilterUtils';

export type { QuotationHeader };

export interface QuotationListParams {
    sq_no?: string;
    customer_name?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
    sort?: string;
    q?: string;
}

/** Standard Paginated Response for Quotation List */
export type QuotationListResponse = PaginatedResponse<QuotationHeader>;

/** Interface for Detail Response with Header/Lines nesting */
interface QuotationDetailApiResponse {
    header?: QuotationFormData;
    lines?: QuotationFormData['lines'];
    data?: QuotationFormData;
}

const ENDPOINTS = {
    list: '/sale-quotation',
    detail: (id: string) => `/sale-quotation/${id}`,
};

export class QuotationService {
    /**
     * ดึงรายการ Quotation
     */
    static async getList(params?: QuotationListParams): Promise<QuotationListResponse> {
        logger.debug('Fetching quotations with params:', params);
        
        // 1. Prepare API Params
        const apiParams: Record<string, string | number | boolean | undefined | null> = { ...params };
        const needsClientFilter = !!(params?.sq_no || params?.customer_name || params?.status || params?.start_date || params?.end_date);

        // 🎯 WORKAROUND: Hybrid Fallback
        if (needsClientFilter && !USE_MOCK) {
            apiParams.limit = 500;
            apiParams.page = 1;
            delete apiParams.sq_no;
            delete apiParams.customer_name;
            delete apiParams.status;
            delete apiParams.start_date;
            delete apiParams.end_date;
        }

        const response = await api.get<unknown>(ENDPOINTS.list, { params: apiParams });

        // Normalize Response Helper (Map Backend Field Names to Frontend)
        const normalizeItem = (item: QuotationListItem): QuotationHeader => ({
            id: item.sq_id,
            sq_id: item.sq_id,
            sq_no: item.sq_no,
            date: item.sq_date || '',
            customer_id: item.customer_id,
            customer_name: String(item.customer_name_th || item.customer_name || `Customer ID: ${item.customer_id}`),
            customer_code: item.customer_code || '',
            total_amount: Number(item.quote_total_amount || 0),
            currency: item.quote_currency_code || 'THB',
            status: item.status as QuotationHeader['status'],
            expiry_date: item.valid_until || '',
            workflow_status: item.sq_status || ''
        });

        const rawItems = extractArrayFromResponse<QuotationListItem>(response as object);
        const allItems = rawItems.map(normalizeItem);

        // 2. Client-Side Filtering Fallback
        if (needsClientFilter || USE_MOCK) {
            const filterParams: Record<string, string | number | boolean | undefined | null> = {};
            if (params?.sq_no) filterParams.sq_no = params.sq_no;
            if (params?.customer_name) filterParams.customer_name = params.customer_name;
            if (params?.status && params.status !== 'ALL') filterParams.status = params.status;
            if (params?.start_date) filterParams.date_start = params.start_date;
            if (params?.end_date) filterParams.date_end = params.end_date;
            if (params?.page) filterParams.page = params.page;
            if (params?.limit) filterParams.limit = params.limit;
            if (params?.sort) filterParams.sort = params.sort;
            if (params?.q) filterParams.q = params.q;

            return applyClientFilters<QuotationHeader>(allItems, filterParams, {
                searchableFields: ['sq_no', 'customer_name'],
                dateField: 'date',
                backendTotal: allItems.length
            });
        }

        // Return standardized paginated response
        const limit = params?.limit || 20;
        return {
            data: allItems,
            total: allItems.length,
            page: params?.page || 1,
            limit: limit,
            totalPages: Math.ceil(allItems.length / limit) || 1
        };
    }

    /**
     * ดึงรายละเอียด Quotation ตาม ID
     */
    static async getById(id: string): Promise<QuotationFormData | null> {
        logger.debug('Fetching quotation detail for id:', id);
        const response = await api.get<QuotationDetailApiResponse>(ENDPOINTS.detail(id));
        
        // Handle nesting: { data: { ... } } or { header: { ... }, lines: [] }
        if (response?.header) {
            return {
                ...response.header,
                lines: response.lines || []
            };
        }

        if (response?.data) {
            return response.data;
        }
        
        return response as unknown as QuotationFormData;
    }

    /**
     * สร้าง Quotation ใหม่
     */
    static async create(data: QuotationFormValues): Promise<void> {
        // 🧪 Helper for ISO Date Formatting (YYYY-MM-DDT00:00:00.000Z)
        const toISODate = (dateStr?: string | null) => {
            if (!dateStr) return null;
            try {
                // Ensure it's just the date part if it comes in as YYYY-MM-DD
                const d = new Date(dateStr.split('T')[0]);
                return d.toISOString();
            } catch {
                return null;
            }
        };

        // 🧪 PRE-TRANSFORMATION: Map lines to "sq_lines" with backend-exact fields
        const sq_lines = (data.lines || []).map((line) => ({
            item_id: line.item_id,
            note: line.note || '',
            qty: line.qty,
            uom_id: line.uom_id,
            unit_price: line.unit_price,
            discount_expression: line.discount_expression || '0'
        }));

        // 🧪 PAYLOAD TRANSFORMATION (Backend-Exact Matching)
        const payload = {
            sq_date: toISODate(data.sq_date),
            lead_id: data.lead_id || null,
            customer_id: data.customer_id,
            branch_id: data.branch_id,
            status: data.status || 'DRAFT',
            valid_until: toISODate(data.valid_until),
            remarks: data.remarks || '',
            payment_term_days: data.payment_term_days || 0,
            onhold: data.onhold || 'N',
            emp_area_id: data.emp_area_id || 1, // Fallback if missing
            emp_dept_id: data.emp_dept_id || 1, // Fallback if missing
            project_id: data.project_id || 1,   // Sample had project_id: 1
            sq_status: data.sq_status || 'WAIT_CUSTOMER',
            base_currency_code: data.base_currency_code || 'THB',
            quote_currency_code: data.quote_currency_code || 'THB',
            exchange_rate: data.exchange_rate || 1,
            exchange_rate_date: toISODate(data.exchange_rate_date),
            tax_code_id: data.tax_code_id || null,
            discount_expression: data.discount_expression || '0',
            sq_lines: sq_lines
        };

        // 🔍 DEBUGGING: Log the final payload as a clean JSON string
        logger.info('🚀 [QuotationService] FINAL TRANSFORMED PAYLOAD:', payload);
        console.log('--- FINAL PAYLOAD JSON (Copy for backend logs) ---');
        console.log(JSON.stringify(payload, null, 2));

        try {
            await api.post(ENDPOINTS.list, payload);
        } catch (error) {
            const errorMsg = extractErrorMessage(error);
            logger.error(`[QuotationService] create failed: ${errorMsg}`, {
                error,
                payloadSent: payload
            });
            throw error;
        }
    }

    /**
     * อัปเดตข้อมูล Quotation
     */
    static async update(id: string, data: Partial<QuotationFormValues>): Promise<void> {
        logger.info('Updating Quotation:', id, data);
        return await api.patch(ENDPOINTS.detail(id), data);
    }
}
