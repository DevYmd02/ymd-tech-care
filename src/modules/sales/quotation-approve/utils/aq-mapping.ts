/**
 * @file aq-mapping.ts
 * @description Pure utility functions for mapping and normalizing Sales Quotation (AQ) data
 */

import type { 
  SQForApproval, 
  SQLineForApproval,
  AQLineFormData
} from '../types/quotation-approve.types';
import { calculateLineTotal } from '@sales/shared/utils/sales-calculations';

/**
 * Smart Discovery for nested API objects
 */
export const findObject = (source: Record<string, unknown>): Record<string, unknown> => {
  if (source.rawData && typeof source.rawData === 'object' && !Array.isArray(source.rawData)) {
    return source.rawData as Record<string, unknown>;
  }

  if (Array.isArray(source.data) && source.data[0]) {
    const first = source.data[0] as Record<string, unknown>;
    if (first.header || first.sale_quotation_header) return (first.header || first.sale_quotation_header) as Record<string, unknown>;
    return first;
  }

  if (source.data && typeof source.data === 'object' && !Array.isArray(source.data)) {
    const d = source.data as Record<string, unknown>;
    if (d.header || d.sale_quotation_header || d.quotation_header || d.sq_header) {
      return (d.header || d.sale_quotation_header || d.quotation_header || d.sq_header) as Record<string, unknown>;
    }
    if (d.sq_id || d.sq_no || d.id) return d;
  }

  const priority = ['sale_quotation_header', 'quotation_header', 'header', 'sq_header', 'sale_quotation', 'quotation', 'sq'];
  for (const p of priority) {
    const val = source[p];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const v = val as Record<string, unknown>;
      if (v.sq_id || v.sq_no || v.id) return v;
    }
  }

  if (source.sq_id || source.sq_no || source.id || source.sale_quotation_id || source.quotation_id) return source;
  if (source.data && typeof source.data === 'object' && !Array.isArray(source.data)) return source.data as Record<string, unknown>;
  
  return source;
};

/**
 * Check if a string is a placeholder or empty
 */
export const isPlaceholder = (val: unknown): boolean => {
  if (!val) return true;
  const s = String(val).trim();
  return s === '' || s === '-' || s === 'null' || s === 'undefined' || s.includes('Customer ID:');
};

/**
 * Discovery helper for lines — More aggressive detection
 */
export const findLines = (source: Record<string, unknown>): unknown[] => {
  const priority = [
    'saleQuotationLines', 
    'sale_quotation_lines', 
    'sq_lines', 
    'lines', 
    'items', 
    'sale_quotation_detail',
    'sale_quotation_line',
    'sq_line'
  ];

  for (const p of priority) {
    if (Array.isArray(source[p]) && (source[p] as unknown[]).length > 0) {
      return source[p] as unknown[];
    }
  }
  
  const lineKey = Object.keys(source).find(k => 
    (k.toLowerCase().includes('line') || k.toLowerCase().includes('item')) && 
    Array.isArray(source[k]) && 
    (source[k] as unknown[]).length > 0
  );
  
  if (lineKey) return source[lineKey] as unknown[];

  const firstArray = Object.keys(source).find(k => Array.isArray(source[k]) && (source[k] as unknown[]).length > 0);
  return firstArray ? (source[firstArray] as unknown[]) : [];
};

/**
 * Normalizes raw API response into SQForApproval type
 */
export function normalizeSQ(raw: unknown): SQForApproval | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const obj = findObject(r);

  const sqId = Number(obj.sq_id || obj.id || obj.sale_quotation_id || obj.quotation_id || obj.id_sale_quotation || 0);
  if (!sqId) return null;

  const rawLines = findLines(obj);
  const lines: SQLineForApproval[] = rawLines.map((l: unknown) => {
    const line = l as Record<string, unknown>;
    const item = (line.item as Record<string, unknown>) || (line.item_master as Record<string, unknown>) || {};
    const uom = (line.uom as Record<string, unknown>) || (line.unit as Record<string, unknown>) || {};
    
    return {
      sq_line_id: Number(line.sq_line_id || line.id || 0),
      item_id: Number(line.item_id || item.item_id || item.id || 0),
      item_code: String(line.item_code || item.item_code || line.code || ''),
      item_name: String(line.item_name || item.item_name || item.item_name_th || line.description || line.name || ''),
      qty: Number(line.qty || line.quantity || 0),
      uom_id: Number(line.uom_id || uom.uom_id || uom.id || 0),
      uom_name: String(line.uom_name || uom.uom_name || uom.uom_name || uom.name || ''),
      unit_price: Number(line.unit_price || line.price || 0),
      discount_expression: String(line.discount_expression || line.line_discount_input || '0'),
      discount_amount: Number(line.line_discount || line.discount_amount || 0),
      net_amount: Number(line.line_total || line.net_amount || 0),
      remarks: String(line.remarks || line.note || ''),
      tax_code_id: line.tax_code_id ? Number(line.tax_code_id) : null,
      price_source: (
        line.price_source !== undefined ? Number(line.price_source) : 
        line.source !== undefined ? Number(line.source) : 
        line.source_id !== undefined ? Number(line.source_id) :
        line.price_type !== undefined ? Number(line.price_type) :
        undefined
      ),
      price_source_name: (() => {
        const name = String(
          line.price_source_name || line.source_name || line.sourceName || line.price_type_name || line.price_source_text || ''
        ).trim();

        if (name && name !== 'null' && name !== 'undefined' && name !== '-') {
          return name.toUpperCase().replace(/\s+/g, '_').replace('PRICELIST', 'PRICE_LIST');
        }
        
        const s = (
          line.price_source ?? line.source ?? line.source_id ?? line.price_type
        );
        if (Number(s) === 1) return 'PRICE_LIST';
        if (Number(s) === 2) return 'PRICE_LEVEL';
        if (Number(s) === 3) return 'MANUAL';
        return '';
      })(),
      price_level_priority: (
        line.price_level_priority !== undefined ? Number(line.price_level_priority) :
        line.priority !== undefined ? Number(line.priority) :
        undefined
      ),
    };
  });

  const getNested = (source: Record<string, unknown>, keys: string[]): Record<string, unknown> => {
    for (const k of keys) { 
      const val = source[k];
      if (val && typeof val === 'object' && !Array.isArray(val)) return val as Record<string, unknown>; 
    }
    return {};
  };

  const customer = getNested(obj, ['customer', 'customer_ref', 'customer_master', 'cust']);
  const branch = getNested(obj, ['branch', 'branch_ref', 'id_branch']);
  const dept = getNested(obj, ['emp_dept', 'department', 'dept', 'id_dept']);
  const area = getNested(obj, ['saleArea', 'empArea', 'sale_area', 'sale_area_ref', 'id_sale_area']);
  const tax = getNested(obj, ['taxCode', 'tax_code_ref', 'tax', 'tax_id']);

  const finalBCurrencyCode = String(obj.base_currency_code || obj.currency_code || obj.currency || 'THB');
  const finalQCurrencyCode = String(obj.quote_currency_code || obj.id_currency_code || obj.currency_code || obj.currency || 'THB');
  const finalRate = Number(obj.exchange_rate || obj.rate || 1);

  return {
    sq_id: sqId,
    sq_no: String(obj.sq_no || obj.sale_quotation_no || obj.code || obj.no || ''),
    sq_date: String(obj.sq_date || obj.sale_quotation_date || obj.date || '').split('T')[0],
    customer_id: Number(obj.customer_id || customer.customer_id || customer.id || obj.id_customer || 0),
    customer_name: String(obj.customer_name || obj.customer_name_th || obj.name_th || customer.customer_name_th || customer.name_th || customer.name || ''),
    customer_code: String(obj.customer_code || customer.customer_code || customer.code || ''),
    status: String(obj.status || 'PENDING'),
    base_currency_code: finalBCurrencyCode,
    base_currency_id: Number(obj.base_currency_id || 1),
    quote_currency_code: finalQCurrencyCode,
    quote_currency_id: Number(obj.quote_currency_id || 1),
    exchange_rate: finalRate,
    isMulticurrency: Boolean(
      (obj.is_multicurrency === true) || (finalBCurrencyCode !== 'THB') || (finalQCurrencyCode !== 'THB') ||
      (Math.abs(Number(obj.quote_total_amount || 0) - Number(obj.base_total_amount || 0)) > 0.01)
    ),
    exchange_rate_date: String(obj.exchange_rate_date || obj.sq_date || obj.date || '').split('T')[0],
    total_amount: Number(obj.total_amount || obj.quote_total_amount || 0),
    base_total_amount: Number(obj.base_total_amount || 0),
    quote_total_amount: Number(obj.quote_total_amount || 0),
    vat_amount: Number(obj.vat_amount || 0),
    base_tax_amount: Number(obj.base_tax_amount || 0),
    quote_tax_amount: Number(obj.quote_tax_amount || 0),
    tax_code_id: (obj.tax_code_id || tax.id) ? Number(obj.tax_code_id || tax.id) : undefined,
    tax_rate: Number(obj.tax_rate ?? tax.tax_rate ?? 0),
    tax_code: String(obj.tax_code || tax.tax_code || '').replace(/^-$/, ''),
    remarks: String(obj.remarks || ''),
    valid_until: String(obj.valid_until || '').split('T')[0],
    payment_term_days: Number(obj.payment_term_days || 0),
    branch_id: Number(obj.branch_id || branch.id || 0),
    branch_name: String(obj.branch_name || branch.name || '').replace(/^-$/, ''),
    emp_dept_id: Number(obj.emp_dept_id || dept.id || 0),
    emp_dept_name: String(obj.emp_dept_name || dept.name || '').replace(/^-$/, ''),
    project_id: Number(obj.project_id || (obj.project as Record<string, unknown>)?.project_id || 0),
    project_name: String(obj.project_name || (obj.project as Record<string, unknown>)?.project_name || '').replace(/^-$/, ''),
    sale_area_id: Number(obj.sale_area_id || area.id || 0),
    sale_area_name: String(obj.sale_area_name || area.name || '').replace('-', ''),
    emp_sale_id: Number(obj.emp_sale_id || (obj.emp_sale as Record<string, unknown>)?.employee_id || 0),
    emp_sale_name: String(obj.emp_sale_name || (obj.emp_sale as Record<string, unknown>)?.employee_fullname || ''),
    discount_expression: String(obj.discount_expression || '0'),
    discount_amount: Number(obj.discount_amount || 0),
    approval_emp_id: Number(obj.approval_emp_id || 0),
    approval_emp_name: String(obj.approval_emp_name || ''),
    lines,
    sub_total: Number(obj.sub_total || lines.reduce((s, l) => s + (l.net_amount || 0), 0) || 0),
  };
}

/**
 * Maps SQ and AQ data into form-compatible line data
 */
export function mapAQFormDataLines(
  sqLinesSource: SQLineForApproval[],
  discoveredAQLines: unknown[],
  fallbackAQLines: unknown[],
  isNew: boolean,
  isHistory: boolean,
  sqStatus: string
) {
  return sqLinesSource.map((sqLine) => {
    const allAQLines = [...discoveredAQLines, ...fallbackAQLines] as Record<string, unknown>[];
    const aqLine = allAQLines.find(
      (al) => Number(al.sq_line_id || al.id) === Number(sqLine.sq_line_id)
    );

    const originalQty = Number(sqLine.qty || 0);
    const discAmt = Number(sqLine.discount_amount || 0);
    const netAmt = Number(sqLine.net_amount ?? sqLine.line_total ?? 0);

    const approvedQty = aqLine
      ? Number(aqLine.approved_qty || 0)
      : (isNew ? originalQty : (String(sqStatus).toUpperCase() === 'APPROVED' ? originalQty : 0));

    const approvedNet = (approvedQty === originalQty)
      ? netAmt
      : approvedQty > 0
        ? calculateLineTotal(approvedQty, Number(sqLine.unit_price || 0), (originalQty > 0 ? (discAmt * approvedQty / originalQty) : 0))
        : 0;

    return {
      sq_line_id: Number(sqLine.sq_line_id),
      item_id: Number(sqLine.item_id),
      item_code: sqLine.item_code || '',
      item_name: sqLine.item_name || '',
      qty: originalQty,
      uom_id: Number(sqLine.uom_id),
      uom_name: sqLine.uom_name || '',
      unit_price: Number(sqLine.unit_price),
      discount_expression: String(sqLine.discount_expression || '0'),
      discount_amount: discAmt,
      net_amount: netAmt,
      is_approved: aqLine ? Number(aqLine.approved_qty || 0) > 0 : (isHistory ? true : isNew),
      approved_qty: approvedQty,
      approved_net_amount: Number(approvedNet.toFixed(2)),
      remarks: String(aqLine?.remarks || sqLine.note || sqLine.remarks || ''),
      price_source: sqLine.price_source !== undefined ? Number(sqLine.price_source) : undefined,
      price_source_name: String(sqLine.price_source_name || ''),
      price_level_priority: sqLine.price_level_priority !== undefined ? Number(sqLine.price_level_priority) : undefined,
    } as AQLineFormData;
  });
}

/**
 * 🕵️ Smart Recovery for Approval: Automatically detect price sources if missing
 */
export async function recoverApprovalPriceSources(
    lines: AQLineFormData[], 
    customerId: number, 
    branchId: number,
    setLines: (lines: AQLineFormData[]) => void
) {
    if (!lines || lines.length === 0 || !customerId || !branchId) return;

    const updatedLines = [...lines];
    let hasChanges = false;

    const promises = updatedLines.map(async (line, index) => {
        if (line.price_source_name && line.price_source_name !== '') return;

        try {
            const PricingService = await import('@sales/quotation/services/pricing.service').then(m => m.PricingService);
            const result = await PricingService.calculatePrice({
                itemId: line.item_id,
                qty: line.qty,
                customerId,
                branchId
            });

            if (result) {
                const priceDiff = Math.abs(Number(result.unitPrice) - Number(line.unit_price));
                if (priceDiff < 0.01) {
                    updatedLines[index] = {
                        ...line,
                        price_source: result.source,
                        price_source_name: result.sourceName,
                        price_level_priority: result.priority
                    };
                    hasChanges = true;
                } else {
                    updatedLines[index] = {
                        ...line,
                        price_source: 3,
                        price_source_name: 'MANUAL'
                    };
                    hasChanges = true;
                }
            }
        } catch {
            // Silent fail for recovery
        }
    });

    await Promise.all(promises);
    if (hasChanges) {
        setLines(updatedLines);
    }
}
