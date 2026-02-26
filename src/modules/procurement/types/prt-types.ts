
export type PRTStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export interface PurchaseReturn {
    prt_id: string;
    prt_no: string;
    prt_date: string; // ISO Date string
    vendor_id: string;
    vendor_name: string;
    vendor_code: string;
    ref_grn_id: string;
    ref_grn_no: string;
    currency_id?: string;
    exchange_rate?: number;
    rate_date?: string;
    is_multicurrency?: boolean;
    total_qty: number;
    total_amount: number;
    status: PRTStatus;
    created_by: string;
    created_at: string;
    updated_at: string;
    items?: PrtLineItem[];
}

export interface PRTListParams {
    page: number;
    limit: number;
    prt_no?: string;     // search
    vendor_name?: string; // search2
    ref_grn_no?: string;  // search3
    status?: PRTStatus | 'ALL';
    date_from?: string;
    date_to?: string;
    sort?: string;
}

export interface PRTListResponse {
    data: PurchaseReturn[];
    total: number;
    page: number;
    limit: number;
}

export interface PrtItem {
    id: string;
    code: string;
    name: string;
    uom: string;
    price: number;
}

export interface PrtLineItem {
    item_id: string;
    item_code: string;
    item_name: string;
    qty_return: number;
    uom_id?: string;
    unit_price_ref: number;
    line_total: number;
}

// ====================================================================================
// ZOD SCHEMAS & FORM TYPES
// ====================================================================================

import { z } from 'zod';

export const prtLineSchema = z.object({
    item_id: z.string(),
    item_code: z.string().min(1, 'ระบุรหัสสินค้า'),
    item_name: z.string().min(1, 'ระบุชื่อสินค้า'),
    qty_return: z.coerce.number().min(0.001, 'จำนวนต้องมากกว่า 0'),
    uom_id: z.string().optional(),
    unit_price_ref: z.coerce.number().min(0, 'ราคาห้ามติดลบ'),
    line_total: z.coerce.number()
});

export const prtSchema = z.object({
    prt_no: z.string().optional(),
    prt_date: z.string().refine(val => !isNaN(Date.parse(val)), 'วันที่ไม่ถูกต้อง'),
    vendor_id: z.string().min(1, 'กรุณาเลือกผู้ขาย'),
    reference_grn_id: z.string().optional(),
    status: z.string(),
    stock_effect: z.string(),
    reason: z.string().optional(),
    is_multicurrency: z.boolean(),
    currency_id: z.string().optional(),
    currency_type_id: z.string().optional(),
    exchange_rate: z.coerce.number().optional(),
    rate_date: z.string().optional(),
    items: z.array(prtLineSchema).min(1, 'ต้องมีรายการสินค้าอย่างน้อย 1 รายการ'),
    tax_rate: z.coerce.number().default(7),
    is_vat_included: z.boolean().default(false)
});

export type PrtFormValues = z.infer<typeof prtSchema>;