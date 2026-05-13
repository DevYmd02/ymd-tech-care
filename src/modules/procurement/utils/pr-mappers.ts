
import type { PRFormData, PRLineFormData } from '@/modules/procurement/schemas/pr-schemas';
import type { CreatePRPayload } from '@/modules/procurement/types/pr-types';

/**
 * 🎯 PR Form Mapper
 * Converts the UI form data (PRFormData) into the backend-ready payload (CreatePRPayload).
 * This logic is extracted from usePRForm.ts to improve maintainability.
 */
export const mapPRFormToPayload = (data: PRFormData, isEditMode: boolean): CreatePRPayload => {
    // 1. Filter out completely empty lines
    const activeLines = (data.lines || []).filter((line: PRLineFormData) => {
        const isItemIdEmpty = !line.item_id || line.item_id === 0;
        const isItemCodeEmpty = !line.item_code || line.item_code.trim() === '';
        const isQtyZero = !line.qty || Number(line.qty) === 0;
        const isPriceZero = !line.est_unit_price || Number(line.est_unit_price) === 0;
        const isDescriptionEmpty = !line.description || line.description.trim() === '';
        
        // Row is 100% empty if ALL key fields are empty/zero — skip it
        const isCompletelyEmpty = isItemIdEmpty && isItemCodeEmpty && isQtyZero && isPriceZero && isDescriptionEmpty;
        
        return !isCompletelyEmpty;
    });

    // 2. Filter to only valid lines (has item and qty > 0)
    const validLines = activeLines.filter((line: PRLineFormData) => 
        line.item_id && line.item_id !== 0 && Number(line.qty) > 0
    );

    const isOnHold = data.is_on_hold === 'Y' || data.is_on_hold === true;
    const targetStatus = isOnHold ? 'DRAFT' : 'PENDING';

    // 3. Construct wire-ready payload (Postman-synced)
    const payload: CreatePRPayload = {
        // Header
        ...(data.pr_no && data.pr_no !== '(รอรันเลข)' && { pr_no: data.pr_no }),
        pr_date: data.pr_date,
        need_by_date: data.need_by_date,
        requester_user_id: Number(data.requester_user_id || 2),
        branch_id: Number(data.branch_id || 1),
        project_id: data.project_id ? Number(data.project_id) : 0,
        cost_center_id: data.cost_center_id ? Number(data.cost_center_id) : undefined,
        preferred_vendor_id: data.preferred_vendor_id ? Number(data.preferred_vendor_id) : undefined,
        pr_tax_code_id: data.pr_tax_code_id ? Number(data.pr_tax_code_id) : null,
        remark: data.purpose || data.remark || '',
        status: targetStatus,
        ...(isEditMode && { version: Number(data.version) || 1 }),
        
        // Currency & Terms
        pr_base_currency_code: data.pr_base_currency_code || 'THB',
        pr_quote_currency_code: data.pr_quote_currency_code || 'THB',
        pr_exchange_rate: Number(Number(data.pr_exchange_rate || 1).toFixed(4)),
        pr_exchange_rate_date: data.pr_exchange_rate_date || data.pr_date,
        pr_discount_raw: String(data.pr_discount_raw || '0'),
        payment_term_days: data.payment_term_days != null ? Number(data.payment_term_days) : undefined,
        vendor_quote_no: data.vendor_quote_no || '',
        shipping_method: data.shipping_method || '',
        
        // Additional info
        credit_days: data.credit_days != null ? Number(data.credit_days) : undefined,
        delivery_date: data.delivery_date || data.need_by_date || data.pr_date,
        requester_name: data.requester_name || "",
        
        // Lines
        lines: validLines.map((line, index: number) => ({
            pr_line_id: line.pr_line_id ? Number(line.pr_line_id) : undefined,
            line_no: index + 1,
            item_id: Number(line.item_id),
            description: line.remark ? `${line.description} (หมายเหตุ: ${line.remark})` : (line.item_name || line.description || "No Description"),
            warehouse_id: Number(line.warehouse_id || 1),
            location: line.location || "",
            location_id: line.location ? Number(line.location) : undefined,
            qty: Number(Number(line.qty || 0).toFixed(4)),
            est_unit_price: Number(Number(line.est_unit_price || 0).toFixed(4)),
            uom_id: Number(line.uom_id),
            required_receipt_type: line.required_receipt_type || "FULL",
            line_discount_raw: String(line.line_discount_raw || '0'),
            remark: line.remark || "",
        })),
    };

    return payload;
};
