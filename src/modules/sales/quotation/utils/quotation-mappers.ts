
import type { QuotationFormValues } from '../schemas/quotation-schemas';
import type { QuotationLineData, QuotationFormData, RawQuotationLine } from '../types/quotation.types';
import { sanitizePayload, cleanPayload } from '@/shared/utils/payload.utils';
import { normalizeId, normalizeDate } from '@/shared/utils/data-mapping.utils';
import { masterDataCache } from '@/shared/utils/master-data-cache';
import { logger } from '@utils';

/** 🎯 Fields allowed by the backend DTO for Quotation Header */
export const KNOWN_SQ_DTO_FIELDS = [
    'sq_no', 'sq_date', 'valid_until', 'customer_id', 'branch_id', 'lead_id',
    'quote_currency_code', 'base_currency_code', 'exchange_rate', 'exchange_rate_date',
    'status', 'sq_status', 'remarks', 'payment_term_days', 'onhold',
    'tax_code_id', 'sale_area_id', 'emp_sale_id', 'emp_dept_id', 'project_id', 'job_id',
    'discount_expression', 'discount_amount', 'sub_total', 'vat_amount', 'total_amount',
    'sq_lines'
];

/** 🎯 Fields allowed by the backend DTO for Quotation Lines */
export const KNOWN_SQ_LINE_DTO_FIELDS = [
    'sq_line_id', 'item_id', 'note', 'qty', 'uom_id', 
    'unit_price', 'discount_expression', 'tax_code_id'
];

/**
 * 🎯 Quotation Form Mapper
 * Converts UI form values (QuotationFormValues) to backend-ready DTO.
 */
export const mapQuotationFormToDTO = (data: QuotationFormValues): Record<string, unknown> => {
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

    const payload: Record<string, unknown> = {
        status: data.status || 'DRAFT',
        sq_status: data.sq_status || data.status || 'DRAFT',
        remarks: data.remarks || '',
        payment_term_days: Number(data.payment_term_days) || 0,
        onhold: data.onhold || 'N',
        base_currency_code: data.base_currency_code || data.currency_code || 'THB',
        quote_currency_code: data.quote_currency_code || data.currency_code || 'THB',
        exchange_rate: Number(data.exchange_rate ?? 1),
        discount_expression: data.discount_expression !== undefined ? data.discount_expression : '0',
        sq_date: toISOString(data.sq_date),
        valid_until: toISOString(data.valid_until),
        exchange_rate_date: toISOString(data.exchange_rate_date || data.sq_date || new Date())
    };

    if (data.customer_id) payload.customer_id = Number(data.customer_id);
    if (data.branch_id) payload.branch_id = Number(data.branch_id);
    if (data.lead_id) payload.lead_id = data.lead_id;
    if (data.sale_area_id) payload.sale_area_id = Number(data.sale_area_id);
    if (data.emp_sale_id) payload.emp_sale_id = Number(data.emp_sale_id);
    if (data.emp_dept_id) payload.emp_dept_id = Number(data.emp_dept_id);
    if (data.project_id) payload.project_id = Number(data.project_id);
    if (data.tax_code_id) payload.tax_code_id = Number(data.tax_code_id);

    if (data.lines && data.lines.length > 0) {
        payload.sq_lines = data.lines.map((line: QuotationLineData) => ({
            sq_line_id: line.sq_line_id ? Number(line.sq_line_id) : undefined,
            item_id: Number(line.item_id),
            note: line.note || '',
            qty: Number(line.qty) || 0,
            uom_id: Number(line.uom_id),
            unit_price: Number(line.unit_price) || 0,
            discount_expression: line.discount_expression || '0',
            tax_code_id: line.tax_code_id ? Number(line.tax_code_id) : undefined,
        }));
    }

    // Sanitize Lines
    if (Array.isArray(payload.sq_lines)) {
        payload.sq_lines = payload.sq_lines.map((line: unknown) => 
            sanitizePayload<Record<string, unknown>>(line, KNOWN_SQ_LINE_DTO_FIELDS)
        );
    }
    
    // Sanitize Header
    const sanitized = sanitizePayload<Record<string, unknown>>(payload, KNOWN_SQ_DTO_FIELDS);
    return cleanPayload(sanitized) as Record<string, unknown>;
};

/**
 * 🎯 Map backend response DTO to frontend QuotationFormData
 * Handles inconsistent API formats gracefully using fallbacks.
 */
export const mapDTOToQuotationForm = (response: unknown): QuotationFormData | null => {
    logger.debug('[QuotationMapper] Mapping DTO to QuotationFormData');
    
    // 1. Unified Response Extraction
    let raw: Record<string, unknown> | null = null;
    if (response && typeof response === 'object') {
        raw = Array.isArray(response) ? (response[0] as Record<string, unknown>) : (response as Record<string, unknown>);
        if (raw && !raw.sq_id && !raw.id && raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
            raw = raw.data as Record<string, unknown>;
        }
    }

    if (!raw || typeof raw !== 'object') {
        logger.error('[QuotationMapper] Invalid response structure', response);
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
    return {
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
};

