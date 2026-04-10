import { z } from 'zod';

// ==========================================
// ZOD SCHEMA
// ==========================================

export const icOptionSchema = z.object({
    ic_option_id: z.string().uuid().optional(),
    branch_id: z.string().uuid({ message: 'กรุณาระบุรหัสสาขา' }),
    
    // Text fields
    aging_expire: z.string().max(50, 'ห้ามเกิน 50 ตัวอักษร'),

    // Numeric fields
    set_price1: z.number().int().min(0, 'ต้องไม่ต่ำกว่า 0'),
    set_price2: z.number().int().min(0, 'ต้องไม่ต่ำกว่า 0'),
    set_price3: z.number().int().min(0, 'ต้องไม่ต่ำกว่า 0'),
    set_price4: z.number().int().min(0, 'ต้องไม่ต่ำกว่า 0'),

    // Char(1) Flags
    auto_perpetual_cost: z.string().length(1),
    barcode_flag: z.string().length(1),
    check_deficit: z.string().length(1),
    check_deficit_option: z.string().length(1),
    check_max_qty: z.string().length(1),
    check_min_qty: z.string().length(1),
    check_qty_flag: z.string().length(1),
    check_standcost: z.string().length(1),
    expire_alert_flag: z.string().length(1),
    order_alert_flag: z.string().length(1),
    post_cost_flag: z.string().length(1),
    reorder_flag: z.string().length(1),
    set_autopost: z.string().length(1),
    set_costcn: z.string().length(1),
    set_costcn_ap: z.string().length(1),
    set_costcn_ap_refinv: z.string().length(1),
    set_costcn_refinv: z.string().length(1),
    set_cost_return_issueref: z.string().length(1),
    set_goodqty: z.string().length(1),
    set_inve: z.string().length(1),
    set_price: z.string().length(1),
    set_price_ic: z.string().length(1),
    set_price_pack: z.string().length(1),
    set_price_po: z.string().length(1),
    trasfer_cost_flag: z.string().length(1),
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
