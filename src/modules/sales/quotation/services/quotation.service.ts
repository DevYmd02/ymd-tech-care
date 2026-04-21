import api, { USE_MOCK, extractErrorMessage } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import type { QuotationFormData, QuotationHeader, QuotationListItem, QuotationLineData, RawQuotationData, RawQuotationLine } from '@sales/quotation/types/quotation.types';
import type { QuotationFormValues } from '@sales/quotation/schemas/quotation-schemas';
import { applyClientFilters, extractArrayFromResponse, type PaginatedResponse } from '@/shared/utils/clientFilterUtils';

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
        const normalizeItem = (item: QuotationListItem): QuotationHeader => {
            // Safe-access 'id' from index signature with type check
            const rawId = item.id;
            const finalId = (typeof rawId === 'string' || typeof rawId === 'number') 
                ? rawId 
                : item.sq_id;

            return {
                id: finalId,
                sq_id: item.sq_id,
                sq_no: item.sq_no,
                date: item.sq_date || '',
                customer_id: item.customer_id,
                customer_name: String(item.customer_name_th || item.customer_name || `Customer ID: ${item.customer_id}`),
                customer_code: item.customer_code || '',
                // 📡 Explicitly map relation IDs to satisfy backend 'connect' mandatory requirements
                branch_id: item.branch_id ? Number(item.branch_id) : null,
                lead_id: item.lead_id || null,
                total_amount: Number(item.quote_total_amount || 0),
                currency: item.quote_currency_code || 'THB',
                status: item.status as QuotationHeader['status'],
                expiry_date: item.valid_until || '',
                workflow_status: item.sq_status || '',
                sq_status: item.sq_status || '',
                // 📡 Explicitly map business tracking IDs from list item to header object
                sale_area_id: item.sale_area_id ? Number(item.sale_area_id) : (item.emp_area_id ? Number(item.emp_area_id) : null),
                emp_sale_id: item.emp_sale_id ? Number(item.emp_sale_id) : null,
                emp_dept_id: item.emp_dept_id ? Number(item.emp_dept_id) : null,
                project_id: item.project_id ? Number(item.project_id) : null,
                lines: (item.saleQuotationLines || item.lines) as QuotationLineData[],
                rawData: item as Record<string, unknown>
            };
        };

        const rawItems = extractArrayFromResponse<QuotationListItem>(response as object);
        if (rawItems.length > 0) {
            console.log('📋 [QuotationService] Raw First Item from List:', rawItems[0]);
        }
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
    static async getById(id: string | number): Promise<QuotationFormData | null> {
        logger.debug('Fetching quotation detail for id:', id);
        try {
            // Define expected wrapped structure to avoid 'any'
            interface WrappedRawResponse {
                data?: RawQuotationData;
            }
            
            const response = await api.get<RawQuotationData & WrappedRawResponse>(ENDPOINTS.detail(String(id)));
            
            // 🚨 CRITICAL DIAGNOSTIC: Log the raw data so we can see exactly what the backend sends
            console.info(`[QuotationService] 🚨 RAW DATA for ID ${id}:`, response);
            if (response && typeof response === 'object') {
                console.info('[QuotationService] Keys found:', Object.keys(response as object));
            }

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
                // Shape C: Named Object
                else if (rObj.sale_quotation !== undefined) {
                    extracted = rObj.sale_quotation;
                } else if (rObj.quotation !== undefined) {
                    extracted = rObj.quotation;
                }
            }

            // 2. Handle single-item arrays gracefully (common in some backend architectures)
            const finalObject: unknown = Array.isArray(extracted) ? extracted[0] : extracted;

            // 3. Final structural validation with Silence & Resilience
            if (!finalObject || typeof finalObject !== 'object' || Array.isArray(finalObject)) {
                logger.warn(`[QuotationService] Normalization failed for ID: ${id}. Final object is invalid.`);
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

            const result: QuotationFormData = {
                ...safeRaw,
                sq_id: raw.sq_id,
                sq_no: raw.sq_no || '',
                sq_date: raw.sq_date || '',
                customer_id: raw.customer_id || 0,
                currency_code: raw.currency_code || 'THB',
                status: raw.status || 'DRAFT',
                sub_total: Number(raw.sub_total || 0),
                discount_amount: Number(raw.discount_amount || 0),
                vat_amount: Number(raw.vat_amount || 0),
                total_amount: Number(raw.total_amount || 0),
                payment_term_days: Number(raw.payment_term_days || 0),
                onhold: raw.onhold || 'N',
                remarks: raw.remarks || '',
                sale_area_id: raw.sale_area_id !== undefined 
                    ? Number(raw.sale_area_id) 
                    : (raw.emp_area_id !== undefined ? Number(raw.emp_area_id) : undefined),
                emp_sale_id: raw.emp_sale_id !== undefined ? Number(raw.emp_sale_id) : undefined,
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
                        price_source_name: finalName || undefined
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
     * Helper for Payload Transformation (Backend-Exact Matching)
     */
    private static preparePayload(data: QuotationFormValues) {
        // 🧪 Helper for ISO Date Formatting (YYYY-MM-DDT00:00:00.000Z)
        // 🧪 Helper for ISO Date Formatting (YYYY-MM-DDT00:00:00.000Z) with fallback detection
        const toISOString = (dateInput?: string | null | Date) => {
            if (!dateInput) return null;
            try {
                const date = typeof dateInput === 'string' ? new Date(dateInput.split('T')[0]) : dateInput;
                if (isNaN(date.getTime())) return null;
                return date.toISOString();
            } catch {
                return null;
            }
        };

        // 🧪 Map lines to "sq_lines" with backend-exact fields
        const sq_lines = (data.lines || []).map((line: QuotationLineData) => {
            const lineId = Number(line.sq_line_id);
            return {
                sq_line_id: (lineId && !isNaN(lineId)) ? lineId : undefined, 
                item_id: Number(line.item_id),
                note: line.note || '',
                qty: Number(line.qty) || 0,
                uom_id: Number(line.uom_id),
                unit_price: Number(line.unit_price) || 0,
                discount_expression: line.discount_expression || '0',
                tax_code_id: line.tax_code_id ? Number(line.tax_code_id) : undefined
            };
        });

        // 🧪 Dynamic Payload Construction
        // 🛡️ PROTECTION: Instead of sending 'null' for missing fields (which triggers Prisma 'connect' errors),
        // we OMIT those fields entirely so the backend preserves current data.
        const payload: Partial<RawQuotationData> & Record<string, unknown> = {
            status: data.status || 'DRAFT',
            sq_status: (data as QuotationFormValues).sq_status || data.status || 'DRAFT',
            remarks: data.remarks || '',
            payment_term_days: Number(data.payment_term_days) || 0,
            onhold: data.onhold || 'N',
            base_currency_code: data.base_currency_code || 'THB',
            quote_currency_code: data.quote_currency_code || 'THB',
            exchange_rate: Number(data.exchange_rate ?? 1),
            discount_expression: data.discount_expression || '0',
        };

        // 📡 Conditional Field Inclusion (Only if present and not 0/null/undefined for IDs)
        if (data.sq_date) payload.sq_date = toISOString(data.sq_date) || undefined;
        if (data.valid_until) payload.valid_until = toISOString(data.valid_until) || undefined;

        // 🛡️ Ensure exchange_rate_date is never empty for the backend, defaulting to today or sq_date if necessary
        const xrDate = data.exchange_rate_date || data.sq_date || new Date().toISOString().split('T')[0];
        payload.exchange_rate_date = toISOString(xrDate);
        
        // 🛡️ PROTECTION: Only include relation IDs if they are valid positive numbers
        const isValidId = (id: unknown): boolean => {
            if (id === null || id === undefined || id === '') return false;
            const num = Number(id);
            return !isNaN(num) && num > 0;
        };

        // Standard IDs
        if (isValidId(data.customer_id)) payload.customer_id = Number(data.customer_id);
        if (isValidId(data.branch_id)) payload.branch_id = Number(data.branch_id);
        if (data.lead_id) payload.lead_id = data.lead_id;
        
        // 📡 Relation IDs: Omit them entirely if invalid (Backend fails on both null and undefined inside connect)
        if (isValidId(data.sale_area_id)) payload.sale_area_id = Number(data.sale_area_id);
        
        if (isValidId(data.emp_sale_id)) payload.emp_sale_id = Number(data.emp_sale_id);
        if (isValidId(data.emp_dept_id)) payload.emp_dept_id = Number(data.emp_dept_id);
        if (isValidId(data.project_id)) payload.project_id = Number(data.project_id);
        if (isValidId(data.tax_code_id)) payload.tax_code_id = Number(data.tax_code_id);

        // 🛡️ PROTECTION: Only include sq_lines if they actually exist in input data
        if (data.lines && data.lines.length > 0) {
            payload.sq_lines = sq_lines;
        }

        return payload;
    }

    /**
     * สร้าง Quotation ใหม่
     */
    static async create(data: QuotationFormValues): Promise<void> {
        const payload = this.preparePayload(data);
        
        logger.info('🚀 [QuotationService] CREATE PAYLOAD:', payload);
        console.log('--- CREATE PAYLOAD JSON ---');
        console.log(JSON.stringify(payload, null, 2));

        try {
            await api.post(ENDPOINTS.list, payload);
        } catch (error) {
            const errorMsg = extractErrorMessage(error);
            logger.error(`[QuotationService] create failed: ${errorMsg}`, { error, payloadSent: payload });
            throw error;
        }
    }

    /**
     * อัปเดตข้อมูล Quotation
     */
    static async update(id: string | number, data: Partial<QuotationFormValues>): Promise<void> {
        // 🧪 Robust Update Logic: Backend requires a full payload for PATCH.
        // If data is partial (e.g. status only), we fetch current data and merge.
        let finalFormValues: QuotationFormValues;

        if (!data.lines || !data.sq_date || !data.customer_id) {
            logger.debug(`[QuotationService] Partial update detected for ID ${id}. Fetching full data to merge...`);
            const currentData = await this.getById(id);
            
            if (!currentData) {
                // 🛡️ Resilience: If we can't fetch current detail data (e.g. API returning empty), 
                // we still try to proceed with a partial update using only the provided data.
                // This allows status-only updates (like Send for Approval) to potentially work.
                logger.info(`💡 [QuotationService] Detail API unavailable for ID ${id}. Proceeding with localized payload hydration.`);
                finalFormValues = data as unknown as QuotationFormValues;
            } else {
                // Standard Merge Logic
                finalFormValues = {
                    ...currentData,
                    ...data
                } as unknown as QuotationFormValues;
            }
        } else {
            finalFormValues = data as QuotationFormValues;
        }

        const payload = this.preparePayload(finalFormValues);
        
        logger.info(`🚀 [QuotationService] UPDATE (PATCH) PAYLOAD for ID ${id}:`, payload);
        console.log(`--- UPDATE PAYLOAD JSON (ID: ${id}) ---`);
        console.log(JSON.stringify(payload, null, 2));

        try {
            await api.patch(ENDPOINTS.detail(String(id)), payload);
        } catch (error) {
            const errorMsg = extractErrorMessage(error);
            logger.error(`[QuotationService] update failed (ID: ${id}): ${errorMsg}`, { error, payloadSent: payload });
            throw error;
        }
    }
}
