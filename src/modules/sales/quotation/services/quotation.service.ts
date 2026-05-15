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
    type QuotationListItem,
    type RawQuotationLine
} from '../types/quotation.types';
import type { QuotationFormValues } from '@sales/quotation/schemas/quotation-schemas';
import { applyClientFilters, extractArrayFromResponse, type PaginatedResponse, prepareHybridParams } from '@utils/clientFilterUtils';
import { mapQuotationFormToDTO } from '../utils/quotation-mappers';
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
            
            // 1. Unified Response Extraction
            let raw: Record<string, unknown> | null = null;
            if (response && typeof response === 'object') {
                raw = Array.isArray(response) ? (response[0] as Record<string, unknown>) : (response as Record<string, unknown>);
                if (raw && !raw.sq_id && !raw.id && raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
                    raw = raw.data as Record<string, unknown>;
                }
            }

            if (!raw || typeof raw !== 'object') {
                logger.error('[QuotationService] Invalid response structure', response);
                return null;
            }

            // 2. Exhaustive Detection helper
            const pick = (pref: string, ...fallbacks: string[]) => {
                if (raw![pref] !== undefined && raw![pref] !== null) return raw![pref];
                for (const f of fallbacks) {
                    if (raw![f] !== undefined && raw![f] !== null) return raw![f];
                }
                return undefined;
            };

            // 3. Determine where the lines are located
            const linePriority = ['saleQuotationLines', 'sale_quotation_lines', 'sq_lines', 'lines', 'items', 'sale_quotation_detail', 'sale_quotation_line', 'sq_line'];
            let rawLines: RawQuotationLine[] = [];
            
            for (const p of linePriority) {
                const val = raw[p];
                if (Array.isArray(val) && val.length > 0) {
                    rawLines = val as RawQuotationLine[];
                    break;
                }
            }

            if (rawLines.length === 0) {
                const firstArray = Object.keys(raw).find(k => Array.isArray(raw[k]) && (raw[k] as unknown[]).length > 0);
                if (firstArray) rawLines = raw[firstArray] as RawQuotationLine[];
            }
            
            // 4. Assemble the final object with robust fallbacks
            const result: QuotationFormData = {
                sq_id: normalizeId(pick('sq_id', 'id')),
                sq_no: String(pick('sq_no', 'no') || ''),
                sq_date: normalizeDate(pick('sq_date', 'date', 'sqDate')),
                customer_id: normalizeId(pick('customer_id', 'customerId')),
                branch_id: normalizeId(pick('branch_id', 'branchId')),
                branch_name: (masterDataCache.getBranchName(pick('branch_id', 'branchId') as number | string) || '') as string,
                lead_id: normalizeId(pick('lead_id', 'leadId')),
                
                currency_code: String(pick('quote_currency_code', 'currency_code', 'currency') || 'THB'),
                base_currency_code: String(pick('base_currency_code', 'home_currency') || 'THB'),
                quote_currency_code: String(pick('quote_currency_code', 'currency_code') || 'THB'),
                exchange_rate: Number(pick('exchange_rate', 'rate') || 1),
                exchange_rate_date: normalizeDate(pick('exchange_rate_date', 'exchangeRateDate', 'sq_date', 'date')),
                
                status: String(pick('status', 'sq_status', 'workflow_status') || 'DRAFT'),
                valid_until: normalizeDate(pick('valid_until', 'expiry_date', 'expireDate')),
                
                sub_total: Number(pick('quote_sub_total', 'base_sub_total', 'sub_total', 'total_sub_total') || 0),
                discount_amount: Number(pick('quote_discount_amount', 'base_discount_amount', 'discount_amount', 'total_discount') || 0),
                discount_expression: String(pick('discount_expression', 'discount_input', 'discount_rate', 'discount', 'header_discount') || '0'),
                vat_amount: Number(pick('quote_tax_amount', 'base_tax_amount', 'vat_amount', 'total_vat') || 0),
                total_amount: Number(pick('quote_total_amount', 'base_total_amount', 'total_amount') || 0),
                
                payment_term_days: Number(pick('payment_term_days', 'credit_term') || 0),
                onhold: String(pick('onhold', 'on_hold') || 'N'),
                remarks: String(pick('remarks', 'remark', 'note') || ''),
                tax_code_id: normalizeId(pick('tax_code_id', 'tax_id')),
                
                sale_area_id: normalizeId(pick('sale_area_id', 'emp_area_id', 'area_id')),
                emp_sale_id: normalizeId(pick('emp_sale_id', 'sale_id', 'employee_id')),
                emp_dept_id: normalizeId(pick('emp_dept_id', 'dept_id', 'department_id')),
                project_id: normalizeId(pick('project_id', 'projectId', 'job_id')),
                
                isMulticurrency: Boolean(
                    pick('isMulticurrency', 'is_multicurrency') || 
                    (pick('base_currency_code') && String(pick('base_currency_code')) !== 'THB') ||
                    (pick('quote_currency_code') && String(pick('quote_currency_code')) !== 'THB')
                ),
                
                lines: rawLines.map(line => ({
                    sq_line_id: normalizeId(line.sq_line_id || line.id),
                    item_id: normalizeId(line.item_id || line.product_id),
                    item_code: String(line.item_code || line.product_code || line.code || ''),
                    item_name: String(line.item_name || line.product_name || line.name || ''),
                    qty: Number(line.qty || 0),
                    uom_id: normalizeId(line.uom_id),
                    unit_price: Number(line.unit_price || 0),
                    discount_expression: String(line.discount_expression || line.line_discount_input || '0'),
                    line_discount: Number(line.line_discount || 0),
                    line_total: Number(line.line_total || line.net_amount || line.total_amount || 0),
                    price_source: line.price_source !== undefined ? Number(line.price_source) : (line.source !== undefined ? Number(line.source) : undefined),
                    price_source_name: line.price_source_name || line.source_name || '',
                    note: line.note || '',
                } as QuotationLineData))
            };

            logger.debug(`[QuotationService] Successfully fetched detail for id: ${id}`, result);
            return result;
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
