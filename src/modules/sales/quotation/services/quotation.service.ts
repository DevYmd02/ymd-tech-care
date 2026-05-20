import api, { USE_MOCK, extractErrorMessage } from '@core/api/api';
import { logger } from '@utils';
import { 
    normalizeId, 
    normalizeDate, 
    normalizeCustomerName
} from '@/shared/utils/data-mapping.utils';
import { masterDataCache } from '@/shared/utils/master-data-cache';
import { 
    type QuotationHeader, 
    type QuotationFormData, 
    type QuotationLineData,
    type QuotationListItem
} from '../types/quotation.types';
import type { QuotationFormValues } from '@sales/quotation/schemas/quotation-schemas';
import { applyClientFilters, extractArrayFromResponse, type PaginatedResponse, prepareHybridParams } from '@utils/clientFilterUtils';
import { mapQuotationFormToDTO, mapDTOToQuotationForm } from '../utils/quotation-mappers';
import type { AxiosRequestConfig } from 'axios';

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
export interface QuotationListResponse extends PaginatedResponse<QuotationHeader> {
    isPartial?: boolean;
}

const ENDPOINTS = {
    list: '/sale-quotation',
    detail: (id: string | number) => `/sale-quotation/${id}`,
    create: '/sale-quotation',
};

export class QuotationService {
    /**
     * ดึงรายการ Quotation
     */
    static async getList(params?: QuotationListParams, config?: AxiosRequestConfig): Promise<QuotationListResponse> {
        logger.debug('Fetching quotations with params:', params);
        
        // 🚀 EFFICIENCY FIX: Optimized Hybrid Filtering
        const SUPPORTED_BACKEND_FIELDS = ['sq_no', 'status', 'page', 'limit', 'sort'];
        const { apiParams, needsClientFilter } = prepareHybridParams(
            params as Record<string, string | number | boolean | undefined | null> || {}, 
            SUPPORTED_BACKEND_FIELDS, 
            { maxWindow: 100 } 
        );

        try {
            const response = await api.get<unknown>(ENDPOINTS.list, { ...config, params: apiParams });
            
            if (!response || (typeof response !== 'object')) {
                logger.warn('[QuotationService] Empty or invalid list response');
                return { data: [], total: 0, page: 1, limit: 10, totalPages: 1 };
            }

            // Normalize Response Helper
            const normalizeItem = (item: QuotationListItem): QuotationHeader => {
                const id = normalizeId(item.id || item.sq_id);
                return {
                    id,
                    sq_id: id,
                    sq_no: String(item.sq_no || ''),
                    date: normalizeDate(item.sq_date),
                    sq_date: normalizeDate(item.sq_date),
                    customer_id: normalizeId(item.customer_id),
                    customer_name: normalizeCustomerName(item) || `Customer ID: ${item.customer_id}`,
                    customer_code: String(item.customer_code || ''),
                    branch_id: item.branch_id ? Number(item.branch_id) : null,
                    branch_name: (typeof masterDataCache.getBranchName(item.branch_id as number | string) === 'string' ? masterDataCache.getBranchName(item.branch_id as number | string) : '') as string,
                    lead_id: item.lead_id || null,

                    currency: String(item.quote_currency_code || item.currency_code || 'THB'),
                    base_currency_code: String(item.base_currency_code || 'THB'),
                    quote_currency_code: String(item.quote_currency_code || item.currency_code || 'THB'),
                    exchange_rate: Number(item.exchange_rate || 1),
                    isMulticurrency: Boolean(
                        item.isMulticurrency || 
                        (item.base_currency_code && item.base_currency_code !== 'THB') ||
                        (item.quote_currency_code && item.quote_currency_code !== 'THB') ||
                        (item.base_currency_code && item.quote_currency_code && item.base_currency_code !== item.quote_currency_code)
                    ),
                    status: (item.status || item.sq_status) as QuotationHeader['status'],
                    expiry_date: normalizeDate(item.valid_until),
                    valid_until: normalizeDate(item.valid_until),
                    payment_term_days: Number(item.payment_term_days || 0),
                    tax_code_id: item.tax_code_id ? Number(item.tax_code_id) : null,
                    workflow_status: item.sq_status || '',
                    sq_status: item.sq_status || '',
                    sale_area_id: item.sale_area_id ? Number(item.sale_area_id) : (item.emp_area_id ? Number(item.emp_area_id) : null),
                    emp_sale_id: item.emp_sale_id ? Number(item.emp_sale_id) : null,
                    emp_sale_name: (typeof masterDataCache.getEmployeeName(item.emp_sale_id as number | string) === 'string' ? masterDataCache.getEmployeeName(item.emp_sale_id as number | string) : '') as string,
                    emp_dept_id: item.emp_dept_id ? Number(item.emp_dept_id) : null,
                    emp_dept_name: (typeof masterDataCache.getDepartmentName(item.emp_dept_id as number | string) === 'string' ? masterDataCache.getDepartmentName(item.emp_dept_id as number | string) : '') as string,
                    project_id: item.project_id ? Number(item.project_id) : null,
                    remarks: String(item.remarks || item.remark || item.note || ''),
                    
                    // 💰 Summary Fields (Critical for Initial Data/Data-Reuse)
                    sub_total: Number(item.quote_sub_total || item.base_sub_total || item.sub_total || item.total_sub_total || 0),
                    discount_amount: Number(item.quote_discount_amount || item.base_discount_amount || item.discount_amount || item.total_discount || 0),
                    discount_expression: String(item.discount_expression || item.discount_input || item.discount_rate || item.header_discount || (Number(item.quote_discount_amount || 0) > 0 ? String(item.quote_discount_amount) : '0')),
                    vat_amount: Number(item.quote_tax_amount || item.base_tax_amount || item.vat_amount || item.total_vat || 0),
                    total_amount: Number(item.quote_total_amount || item.base_total_amount || item.total_amount || 0),
                    base_total_amount: Number(item.base_total_amount || item.total_amount || 0),

                    lines: (item.saleQuotationLines || item.lines || []) as QuotationLineData[],
                    rawData: item as Record<string, unknown>
                };
            };

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
        } catch (error) {
            // Silently handle canceled requests
            if (String(error).includes('CanceledError') || String(error).includes('canceled')) {
                return { data: [], total: 0, page: 1, limit: 10, totalPages: 1 };
            }
            logger.error('[QuotationService] List fetch failed:', error);
            return { data: [], total: 0, page: 1, limit: 10, totalPages: 1 };
        }
    }

    /**
     * ดึงรายละเอียด Quotation ตาม ID
     */
    static async getById(id: string | number, config?: AxiosRequestConfig): Promise<QuotationFormData | null> {
        logger.debug('Fetching quotation detail for id:', id);
        try {
            const response = await api.get<unknown>(ENDPOINTS.detail(String(id)), config);
            return mapDTOToQuotationForm(response);
        } catch (error) {
            logger.error(`[QuotationService] Failed to fetch detail for id: ${id}`, error);
            throw error;
        }
    }

    /**
     * สร้าง Quotation ใหม่
     */
    static async create(data: QuotationFormValues, config?: AxiosRequestConfig): Promise<void> {
        const payload = mapQuotationFormToDTO(data);
        logger.info('🚀 [QuotationService] CREATE PAYLOAD:', payload);

        try {
            await api.post(ENDPOINTS.list, payload, config);
        } catch (error) {
            const errorMsg = extractErrorMessage(error);
            logger.error(`[QuotationService] create failed: ${errorMsg}`, { error, payloadSent: payload });
            throw error;
        }
    }

    /**
     * อัปเดตข้อมูล Quotation
     */
    static async update(id: string | number, data: Partial<QuotationFormValues>, config?: AxiosRequestConfig): Promise<void> {
        let finalFormValues: QuotationFormValues;

        // 🛡️ HYDRATION GUARD: If critical fields are missing, fetch current data first
        const isPartial = !data.lines || !data.sq_date || !data.customer_id;
        
        if (isPartial) {
            logger.debug(`[QuotationService] Partial update detected for ID ${id}, hydrating from server...`);
            const currentData = await this.getById(id, config);
            if (!currentData) {
                logger.warn(`[QuotationService] Could not hydrate data for ID ${id}, proceeding with raw partial data.`);
                finalFormValues = data as unknown as QuotationFormValues;
            } else {
                finalFormValues = { ...currentData, ...data } as unknown as QuotationFormValues;
            }
        } else {
            finalFormValues = data as QuotationFormValues;
        }

        const payload = mapQuotationFormToDTO(finalFormValues);
        logger.info(`🚀 [QuotationService] UPDATE (PATCH) PAYLOAD for ID ${id}:`, payload);

        try {
            await api.patch(ENDPOINTS.detail(String(id)), payload, config);
        } catch (error) {
            const errorMsg = extractErrorMessage(error);
            logger.error(`[QuotationService] update failed (ID: ${id}): ${errorMsg}`, { error, payloadSent: payload });
            throw error;
        }
    }

    /**
     * 🏷️ ส่งใบเสนอราคาขออนุมัติ (Submit for Approval)
     */
    static async submitForApproval(id: string | number, currentData?: Partial<QuotationFormValues>): Promise<void> {
        logger.info(`[QuotationService] Submitting for approval: ${id}`);
        
        // 🚀 If currentData is provided (from UI state), use it directly to avoid extra hydration
        if (currentData && currentData.lines && currentData.sq_date && currentData.customer_id) {
            return this.update(id, { 
                ...currentData,
                status: 'PENDING',
            } as Partial<QuotationFormValues>);
        }

        return this.update(id, { 
            status: 'PENDING',
        } as Partial<QuotationFormValues>);
    }
}
