import api, { USE_MOCK, extractErrorMessage } from '@core/api/api';
import { logger } from '@utils';
import { 
    normalizeId, 
    normalizeDate, 
    normalizeCustomerName
} from '@/shared/utils/data-mapping.utils';
import { masterDataCache } from '@/shared/utils/master-data-cache';
import type { QuotationFormData, QuotationHeader, QuotationListItem, QuotationLineData, RawQuotationData, RawQuotationLine } from '@sales/quotation/types/quotation.types';
import type { QuotationFormValues } from '@sales/quotation/schemas/quotation-schemas';
import { applyClientFilters, extractArrayFromResponse, type PaginatedResponse } from '@utils/clientFilterUtils';
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
export type QuotationListResponse = PaginatedResponse<QuotationHeader>;

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

        const response = await api.get<unknown>(ENDPOINTS.list, { ...config, params: apiParams });

        // Normalize Response Helper (Map Backend Field Names to Frontend)
        const normalizeItem = (item: QuotationListItem): QuotationHeader => {
            const id = normalizeId(item.id || item.sq_id);
            return {
                id,
                sq_id: id,
                sq_no: String(item.sq_no || ''),
                date: normalizeDate(item.sq_date),
                customer_id: normalizeId(item.customer_id),
                customer_name: normalizeCustomerName(item) || `Customer ID: ${item.customer_id}`,
                customer_code: String(item.customer_code || ''),
                branch_id: item.branch_id ? Number(item.branch_id) : null,
                branch_name: (typeof masterDataCache.getBranchName(item.branch_id as number | string) === 'string' ? masterDataCache.getBranchName(item.branch_id as number | string) : '') as string,
                lead_id: item.lead_id || null,
                total_amount: Number(item.quote_total_amount || 0),
                base_total_amount: Number(item.base_total_amount || item.total_amount || 0),
                currency: item.quote_currency_code || 'THB',
                status: (item.status || item.sq_status) as QuotationHeader['status'],
                expiry_date: normalizeDate(item.valid_until),
                workflow_status: item.sq_status || '',
                sq_status: item.sq_status || '',
                sale_area_id: item.sale_area_id ? Number(item.sale_area_id) : (item.emp_area_id ? Number(item.emp_area_id) : null),
                emp_sale_id: item.emp_sale_id ? Number(item.emp_sale_id) : null,
                emp_sale_name: (typeof masterDataCache.getEmployeeName(item.emp_sale_id as number | string) === 'string' ? masterDataCache.getEmployeeName(item.emp_sale_id as number | string) : '') as string,
                emp_dept_id: item.emp_dept_id ? Number(item.emp_dept_id) : null,
                emp_dept_name: (typeof masterDataCache.getDepartmentName(item.emp_dept_id as number | string) === 'string' ? masterDataCache.getDepartmentName(item.emp_dept_id as number | string) : '') as string,
                project_id: item.project_id ? Number(item.project_id) : null,
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
    }

    /**
     * ดึงรายละเอียด Quotation ตาม ID
     */
    static async getById(id: string | number, config?: AxiosRequestConfig): Promise<QuotationFormData | null> {
        logger.debug('Fetching quotation detail for id:', id);
        try {
            // Define expected wrapped structure to avoid 'any'
            interface WrappedRawResponse {
                data?: RawQuotationData;
            }
            
            const response = await api.get<RawQuotationData & WrappedRawResponse>(ENDPOINTS.detail(String(id)), config);
            
            // 🧪 Smart Mapping Logic: Parse strings and isolate the core quotation object
            let extracted: unknown = response;
            const responseType = typeof response;

            // 1. Check if the response is a string (might be unparsed JSON)
            if (responseType === 'string' && (response as unknown as string).trim().length > 0) {
                try {
                    extracted = JSON.parse(response as unknown as string);
                } catch {
                    logger.warn(`[QuotationService] Response is a string but not valid JSON for ID: ${id}`);
                }
            } else if (response && responseType === 'object') {
                const rObj = response as Record<string, unknown>;
                
                // Shape A: Standard Wrapper
                if (rObj.data !== undefined) {
                    extracted = rObj.data;
                } 
                // Shape B: ERP-specific Header/Lines wrapper
                else if (rObj.header !== undefined && typeof rObj.header === 'object') {
                    // Combine header and lines if they are split
                    const header = rObj.header as Record<string, unknown>;
                    const lines = Array.isArray(rObj.lines) ? rObj.lines : 
                                 (Array.isArray(rObj.saleQuotationLines) ? rObj.saleQuotationLines : []);
                    extracted = { ...header, saleQuotationLines: lines };
                }
                else if (rObj.rawData !== undefined && typeof rObj.rawData === 'object') {
                    // 🛡️ CRITICAL FIX: Extract from rawData wrapper (as seen in debug logs)
                    const rd = rObj.rawData as Record<string, unknown>;
                    const lines = Array.isArray(rObj.lines) ? rObj.lines : 
                                 (Array.isArray(rObj.saleQuotationLines) ? rObj.saleQuotationLines : 
                                 (Array.isArray(rd.lines) ? rd.lines : 
                                 (Array.isArray(rd.saleQuotationLines) ? rd.saleQuotationLines : [])));
                    extracted = { ...rd, saleQuotationLines: lines };
                }
                // Shape C: Named Object
                else if (rObj.sale_quotation !== undefined) {
                    extracted = rObj.sale_quotation;
                } else if (rObj.quotation !== undefined) {
                    extracted = rObj.quotation;
                }
            }

            // 2. Handle single-item arrays gracefully
            let finalObject: unknown = Array.isArray(extracted) ? extracted[0] : extracted;

            // 🚨 Fallback: if Shape A (data) was null/empty but the root object has quotation properties
            if ((!finalObject || typeof finalObject !== 'object') && response && typeof response === 'object' && !Array.isArray(response)) {
                const r = response as Record<string, unknown>;
                if (r.sq_id || r.sq_no || r.id) {
                    finalObject = response;
                }
            }

            // 3. Final structural validation
            if (!finalObject || typeof finalObject !== 'object' || Array.isArray(finalObject)) {
                return null;
            }

            // 4. Safe cast to RawQuotationData for property mapping
            const raw = finalObject as RawQuotationData & Record<string, unknown>;

            // 2. Determine where the lines are located — EXHAUSTIVE DETECTION
            const priority = ['saleQuotationLines', 'sale_quotation_lines', 'sq_lines', 'lines', 'items', 'sale_quotation_detail', 'sale_quotation_line', 'sq_line'];
            let rawLines: unknown[] = [];
            
            for (const p of priority) {
                const val = raw[p];
                if (Array.isArray(val) && val.length > 0) {
                    rawLines = val as unknown[];
                    break;
                }
            }

            if (rawLines.length === 0) {
                // Secondary check: first non-empty array found in the object
                const firstArray = Object.keys(raw).find(k => Array.isArray(raw[k]) && (raw[k] as unknown[]).length > 0);
                if (firstArray) rawLines = raw[firstArray] as unknown[];
            }
            
            // 3. Assemble the final strictly-typed object
            const { lines: _rawLines, saleQuotationLines: _rawSaleLines, ...safeRaw } = raw;
            
            // Omit raw line arrays from results - debug log to satisfy unused-vars lint
            if (_rawLines || _rawSaleLines) {
                logger.debug('[QuotationService] Mapping raw line data into strictly typed lines');
            }

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
                currency_code: (() => {
                    const q = String(raw.quote_currency_code || raw.quote_currency?.currency_code || raw.quote_currency?.code || raw.currency_code || raw.currency || raw.id_currency || raw.currency_id || raw.currency_id_code || 'THB');
                    const b = String(raw.base_currency_code || raw.base_currency?.currency_code || raw.base_currency?.code || raw.currency_code || 'THB');
                    return (b !== 'THB' && q === 'THB') ? b : q;
                })(),
                base_currency_code: String(raw.base_currency_code || raw.base_currency?.currency_code || raw.base_currency?.code || 'THB'),
                quote_currency_code: String(raw.quote_currency_code || raw.quote_currency?.currency_code || raw.quote_currency?.code || 'THB'),
                exchange_rate: Number(raw.exchange_rate || raw.rate || raw.exchangeRate || 1),
                exchange_rate_date: normalizeDate(raw.exchange_rate_date || raw.sq_date || raw.date),
                status: String(raw.status || raw.sq_status || 'DRAFT'),
                sub_total: Number(raw.sub_total || 0),
                discount_expression: String(raw.discount_expression || raw.discount_input || raw.discount_rate_expression || '0'),
                discount_amount: Number(raw.discount_amount || raw.quote_discount_amount || 0),
                vat_amount: Number(raw.vat_amount || 0),
                total_amount: Number(raw.total_amount || 0),
                payment_term_days: Number(pick('payment_term_days', 'payment_term', 'credit_term', 'credit_days') || 0),
                onhold: raw.onhold || 'N',
                remarks: raw.remarks || '',
                tax_code_id: (String(pick('tax_code_id', 'tax_id', 'vat_id', 'id_tax') ?? '') || '') as string,
                sale_area_id: (String(pick('sale_area_id', 'emp_area_id', 'area_id', 'id_area') ?? '') || '') as string,
                emp_sale_id: (String(pick('emp_sale_id', 'sale_id', 'emp_id_sale', 'id_sale') ?? '') || '') as string,
                emp_sale_name: (typeof masterDataCache.getEmployeeName(pick('emp_sale_id', 'sale_id', 'emp_id_sale', 'id_sale') as number | string) === 'string' ? masterDataCache.getEmployeeName(pick('emp_sale_id', 'sale_id', 'emp_id_sale', 'id_sale') as number | string) : '') as string,
                emp_dept_id: (String(pick('emp_dept_id', 'dept_id', 'department_id', 'id_dept') ?? '') || '') as string,
                emp_dept_name: (typeof masterDataCache.getDepartmentName(pick('emp_dept_id', 'dept_id', 'department_id', 'id_dept') as number | string) === 'string' ? masterDataCache.getDepartmentName(pick('emp_dept_id', 'dept_id', 'department_id', 'id_dept') as number | string) : '') as string,
                project_id: (String(pick('project_id', 'job_id', 'id_project', 'project') ?? '') || '') as string,
                job_id: (String(pick('job_id', 'project_id', 'id_project') ?? '') || '') as string,
                lines: Array.isArray(rawLines) ? (rawLines as RawQuotationLine[]).map(line => {
                    const sourceVal = line.price_source !== undefined ? line.price_source : line.source;
                    const sourceNameRaw = line.price_source_name || line.source_name || line.sourceName || '';
                    
                    let finalName = '';
                    if (sourceNameRaw) {
                        finalName = sourceNameRaw.toUpperCase().replace(/\s+/g, '_');
                    } else if (sourceVal !== undefined && sourceVal !== null) {
                        const v = Number(sourceVal);
                        if (v === 1) finalName = 'PRICE_LIST';
                        else if (v === 2) finalName = 'PRICE_LEVEL';
                        else if (v === 3) finalName = 'MANUAL';
                    }

                    return {
                        ...line,
                        price_source: sourceVal !== undefined ? Number(sourceVal) : undefined,
                        price_source_name: finalName || undefined,
                        price_level_priority: line.price_level_priority !== undefined ? Number(line.price_level_priority) : (line.priority !== undefined ? Number(line.priority) : undefined)
                    } as QuotationLineData;
                }) : []
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
