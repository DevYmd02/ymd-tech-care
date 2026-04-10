import { z } from 'zod';

// ==========================================
// ZOD SCHEMA
// ==========================================

// Helper for Char(1) flags that might come as numbers (0/1) or strings ('Y'/'N')
const flagSchema = z.preprocess((val) => {
    // Convert numbers/strings to standardized 'Y' or 'N'
    if (val === 1 || val === '1' || val === 'Y' || val === 'y' || val === true) return 'Y';
    return 'N';
}, z.string().length(1));

export const icOptionSchema = z.object({
    ic_option_id: z.coerce.string().optional(),
    branch_id: z.coerce.number().min(1, 'กรุณาระบุรหัสสาขา'),
    
    // Text fields
    aging_expire: z.coerce.string().min(1, 'กรุณาระบุระยะเวลา Aging').max(50, 'ห้ามเกิน 50 ตัวอักษร'),

    // Numeric fields
    set_price1: z.number().int().min(0, 'ต้องไม่ต่ำกว่า 0'),
    set_price2: z.number().int().min(0, 'ต้องไม่ต่ำกว่า 0'),
    set_price3: z.number().int().min(0, 'ต้องไม่ต่ำกว่า 0'),
    set_price4: z.number().int().min(0, 'ต้องไม่ต่ำกว่า 0'),

    // Char(1) Flags - using the preprocessed schema
    auto_perpetual_cost: flagSchema,
    barcode_flag: flagSchema,
    check_deficit: flagSchema,
    check_deficit_option: flagSchema,
    check_max_qty: flagSchema,
    check_min_qty: flagSchema,
    check_qty_flag: flagSchema,
    check_standcost: flagSchema,
    expire_alert_flag: flagSchema,
    order_alert_flag: flagSchema,
    post_cost_flag: flagSchema,
    reorder_flag: flagSchema,
    set_autopost: flagSchema,
    set_costcn: flagSchema,
    set_costcn_ap: flagSchema,
    set_costcn_ap_refinv: flagSchema,
    set_costcn_refinv: flagSchema,
    set_cost_return_issueref: flagSchema,
    set_goodqty: flagSchema,
    set_inve: flagSchema,
    set_price: flagSchema,
    set_price_ic: flagSchema,
    set_price_pack: flagSchema,
    set_price_po: flagSchema,
    trasfer_cost_flag: flagSchema,
    
    // Virtual/Join fields for display
    branch_code: z.coerce.string().optional(),
    branch_name: z.coerce.string().optional(),
});

// ==========================================
// TYPES
// ==========================================

export type ICOption = z.infer<typeof icOptionSchema>;
export type ICOptionFormData = ICOption;

export interface ICOptionFilters {
    search?: string;
    page: number;
    limit: number;
}
