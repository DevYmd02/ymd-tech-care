
import type { QuotationFormValues } from '../schemas/quotation-schemas';
import type { QuotationLineData } from '../types/quotation.types';
import { sanitizePayload, cleanPayload } from '@/shared/utils/payload.utils';

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

    if (data.customer_id !== undefined && data.customer_id !== null) payload.customer_id = Number(data.customer_id);
    if (data.branch_id !== undefined && data.branch_id !== null) payload.branch_id = Number(data.branch_id);
    if (data.lead_id) payload.lead_id = data.lead_id;
    if (data.sale_area_id !== undefined && data.sale_area_id !== null) payload.sale_area_id = Number(data.sale_area_id);
    if (data.emp_sale_id !== undefined && data.emp_sale_id !== null) payload.emp_sale_id = Number(data.emp_sale_id);
    if (data.emp_dept_id !== undefined && data.emp_dept_id !== null) payload.emp_dept_id = Number(data.emp_dept_id);
    if (data.project_id !== undefined && data.project_id !== null) payload.project_id = Number(data.project_id);
    if (data.tax_code_id !== undefined && data.tax_code_id !== null) payload.tax_code_id = Number(data.tax_code_id);

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
