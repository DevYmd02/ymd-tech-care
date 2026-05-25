
import type { SalesOrderFormValues, SalesOrderLineValues } from '../schemas/sales-order.schemas';
import { sanitizePayload } from '@/shared/utils/payload.utils';

/** 🎯 Fields allowed by the backend DTO for Sales Order Header (Aligned with D9) */
export const KNOWN_SO_DTO_FIELDS = [
    'so_date', 'status', 'status_remark', 'base_currency_code', 'quote_currency_code',
    'exchange_rate', 'exchange_rate_date', 'payment_term_days', 'ship_days', 'onhold',
    'remarks', 'discount_expression', 'ship_date', 'customer_id', 'branch_id',
    'tax_code_id', 'emp_sale_id', 'emp_dept_id', 'sale_area_id', 'reservation_id',
    'project_id', 'saleOrderLines'
];

/** 🎯 Fields allowed by the backend DTO for Sales Order Lines (Aligned with D10) */
export const KNOWN_SO_LINE_DTO_FIELDS = [
    'so_id', 'so_line_id', 'item_id', 'qty', 'uom_id', 'unit_price', 'net_amount',
    'discount_expression', 'note', 'warehouse_id', 'location_id', 'lot_id', 'reservation_line_id'
];

/**
 * 🎯 Sales Order Form Mapper
 * Converts UI form values (SalesOrderFormValues) to backend-ready DTO.
 */
export const mapSalesOrderFormToDTO = (data: SalesOrderFormValues, isUpdate = false): Record<string, unknown> => {
    const toISOString = (dateInput?: string) => {
        if (!dateInput || dateInput === '') return undefined;
        try {
            const date = new Date(dateInput);
            if (isNaN(date.getTime())) return undefined;
            return date.toISOString();
        } catch {
            return undefined;
        }
    };

    const isValidId = (id: unknown): boolean => {
        if (id === null || id === undefined || id === '' || id === 0) return false;
        const num = Number(id);
        return !isNaN(num) && num > 0;
    };

    const transformed: Record<string, unknown> = {
        so_date: toISOString(data.so_date) || new Date().toISOString(),
        status: data.status || 'DRAFT',
        status_remark: data.status_remark || '',
        base_currency_code: data.base_currency_code || data.currency_code || 'THB',
        quote_currency_code: data.quote_currency_code || data.currency_code || 'THB',
        exchange_rate: Number(data.exchange_rate || 1),
        exchange_rate_date: toISOString(data.exchange_rate_date || data.so_date) || new Date().toISOString(),
        payment_term_days: Number(data.payment_term_days || 0),
        ship_days: Number(data.ship_days || 0),
        onhold: data.onhold === 'Y' ? 'Y' : 'N',
        remarks: data.remarks || '',
        discount_expression: data.discount_input || '0',
        ship_date: toISOString(data.ship_date),
    };

    if (isValidId(data.customer_id)) transformed.customer_id = Number(data.customer_id);
    if (isValidId(data.branch_id)) transformed.branch_id = Number(data.branch_id);
    if (isValidId(data.tax_code_id)) transformed.tax_code_id = Number(data.tax_code_id);
    if (isValidId(data.emp_sale_id)) transformed.emp_sale_id = Number(data.emp_sale_id);
    if (isValidId(data.emp_dept_id)) transformed.emp_dept_id = Number(data.emp_dept_id);
    if (isValidId(data.emp_area_id)) transformed.sale_area_id = Number(data.emp_area_id);
    if (isValidId(data.reservation_id)) transformed.reservation_id = Number(data.reservation_id);
    if (isValidId(data.job_id)) transformed.project_id = Number(data.job_id);

    if (data.lines && Array.isArray(data.lines)) {
        const headerSoId = Number(data.so_id || 0);
        transformed.saleOrderLines = data.lines.map((line: SalesOrderLineValues) => {
            const l: Record<string, unknown> = {
                so_id: headerSoId || Number(line.so_id || 0),
                item_id: Number(line.item_id),
                qty: Number(line.qty_ordered || 0),
                uom_id: Number((line as Record<string, unknown>).item_uom_id || line.uom_id),
                unit_price: Number(line.unit_price || 0),
                net_amount: Number(line.line_total || 0),
                discount_expression: line.line_discount_input || '0',
                note: line.note || '',
            };

            if (isValidId(line.warehouse_id)) l.warehouse_id = Number(line.warehouse_id);
            if (isValidId(line.location_id)) l.location_id = Number(line.location_id);
            if (isValidId(line.lot_id)) l.lot_id = Number(line.lot_id);
            if (isValidId(line.reservation_line_id)) l.reservation_line_id = Number(line.reservation_line_id);

            if (isUpdate && line.so_line_id) {
                l.so_line_id = Number(line.so_line_id);
            }
            
            return sanitizePayload<Record<string, unknown>>(l, KNOWN_SO_LINE_DTO_FIELDS);
        });
    }

    return sanitizePayload<Record<string, unknown>>(transformed, KNOWN_SO_DTO_FIELDS);
};
