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
            
            // 1. Unified Response Extraction (Trust api.ts unwrapping, handle root arrays)
            let raw: Record<string, unknown> | null = null;
            if (response && typeof response === 'object') {
                raw = Array.isArray(response) ? (response[0] as Record<string, unknown>) : (response as Record<string, unknown>);
                // Deep discovery fallback for { data: { ... } } if api.ts skipped unwrapping
                if (raw && !raw.sq_id && raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
                    raw = raw.data as Record<string, unknown>;
                }
            }

            if (!raw || typeof raw !== 'object') {
                logger.error('[QuotationService] Invalid response structure', response);
                return null;
            }

            // 2. Determine where the lines are located — EXHAUSTIVE DETECTION
            const priority = ['saleQuotationLines', 'sale_quotation_lines', 'sq_lines', 'lines', 'items', 'sale_quotation_detail', 'sale_quotation_line', 'sq_line'];
            let rawLines: RawQuotationLine[] = [];
            
            for (const p of priority) {
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
            
            // 3. Assemble the final strictly-typed object
            const safeRaw = { ...raw };
            delete safeRaw.lines;
            delete safeRaw.saleQuotationLines;
            
            // 🕵️ Aggressive ID & Field Discovery helper
            const pick = (pref: string, ...fallbacks: string[]) => {
                if (raw[pref] !== undefined && raw[pref] !== null) return raw[pref];
                for (const f of fallbacks) {
                    if (raw[f] !== undefined && raw[f] !== null) return raw[f];
                }
                return undefined;
            };

            const result: QuotationFormData = {
                ...safeRaw,
                sq_id: normalizeId(raw.sq_id),
                sq_no: String(raw.sq_no || ''),
                sq_date: normalizeDate(raw.sq_date),
                customer_id: normalizeId(raw.customer_id),
                branch_id: normalizeId(raw.branch_id),
                branch_name: (masterDataCache.getBranchName(raw.branch_id as number | string) || '') as string,
                currency_code: String(pick('quote_currency_code', 'currency_code', 'currency') || 'THB'),
                base_currency_code: String(pick('base_currency_code', 'home_currency') || 'THB'),
                quote_currency_code: String(pick('quote_currency_code', 'currency_code') || 'THB'),
                exchange_rate: Number(pick('exchange_rate', 'rate') || 1),
                exchange_rate_date: normalizeDate(raw.exchange_rate_date || raw.sq_date || raw.date),
                status: String(raw.status || raw.sq_status || 'DRAFT'),
                sub_total: Number(raw.quote_sub_total || raw.base_sub_total || raw.sub_total || raw.total_sub_total || 0),
                discount_expression: (() => {
                    const expr = String(raw.discount_expression || raw.discount_input || raw.discount_rate || raw.discount || raw.header_discount || '');
                    if (expr && expr !== '0' && expr !== 'null' && expr !== 'undefined') return expr;
                    const amt = Number(raw.quote_discount_amount || raw.base_discount_amount || raw.discount_amount || raw.total_discount || 0);
                    return amt > 0 ? String(amt) : '0';
                })(),
                discount_amount: Number(raw.quote_discount_amount || raw.base_discount_amount || raw.discount_amount || raw.total_discount || 0),
                vat_amount: Number(raw.quote_tax_amount || raw.base_tax_amount || raw.vat_amount || raw.total_vat || 0),
                total_amount: Number(raw.quote_total_amount || raw.base_total_amount || raw.total_amount || 0),
                payment_term_days: Number(pick('payment_term_days', 'credit_term') || 0),
                onhold: String(raw.onhold || 'N'),
                remarks: String(raw.remarks || ''),
                tax_code_id: (String(pick('tax_code_id', 'tax_id') ?? '') || '') as string,
                isMulticurrency: Boolean(
                    raw.isMulticurrency || 
                    (raw.base_currency_code && String(raw.base_currency_code) !== 'THB') ||
                    (raw.quote_currency_code && String(raw.quote_currency_code) !== 'THB') ||
                    (raw.base_currency_code !== raw.quote_currency_code)
                ),
                lines: rawLines.map(line => {
                    const sourceVal = line.price_source !== undefined ? line.price_source : line.source;
                    const sourceNameRaw = line.price_source_name || line.source_name || '';
                    
                    return {
                        ...line,
                        sq_line_id: normalizeId(line.sq_line_id),
                        item_id: normalizeId(line.item_id || line.product_id),
                        item_code: String(line.item_code || line.product_code || ''),
                        item_name: String(line.item_name || line.product_name || ''),
                        qty: Number(line.qty || 0),
                        uom_id: normalizeId(line.uom_id),
                        unit_price: Number(line.unit_price || 0),
                        discount_expression: String(line.discount_expression || line.line_discount_input || '0'),
                        line_discount: Number(line.line_discount || 0),
                        line_total: Number(line.line_total || line.net_amount || line.total_amount || 0),
                        price_source: sourceVal !== undefined ? Number(sourceVal) : undefined,
                        price_source_name: sourceNameRaw || undefined,
                    } as QuotationLineData;
                })
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
    static async submitForApproval(id: string | number): Promise<void> {
        logger.info(`[QuotationService] Submitting for approval: ${id}`);
        return this.update(id, { 
            status: 'PENDING',
        } as Partial<QuotationFormValues>);
    }
}
