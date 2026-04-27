import { z } from 'zod';

// ==========================================
// SYSTEM DOCUMENT TYPE
// ==========================================

export interface SystemDocument {
    system_document_id: number;
    document_code: string;   // Link IC (e.g. 103, 104)
    document_name: string;   // ชื่อรายการเอกสาร
}

// ==========================================
// NEGATIVE STOCK CHECK OPTIONS
// Maps to: ตรวจสอบสินค้าติดลบ
// ==========================================
export const NEGATIVE_STOCK_CHECK_OPTIONS = [
    { id: 0, name: '(Default)' },
    { id: 1, name: 'สินค้าติดลบไม่ได้' },
    { id: 2, name: 'สินค้าติดลบได้' },
    { id: 3, name: 'แสดงข้อความถาม' },
    { id: 4, name: 'ตามรายตัวสินค้า' },
] as const;

// ==========================================
// NEGATIVE STOCK MODE OPTIONS
// Maps to: ตรวจสอบจำนวนสินค้า (ตรวจสอบด้วย)
// ==========================================
export const NEGATIVE_STOCK_MODE_OPTIONS = [
    { id: 0, name: '(Default)' },
    { id: 1, name: 'ยอดสินค้าคงเหลือ' },
    { id: 2, name: 'Sale Stock' },
] as const;

// ==========================================
// QUANTITY VALIDATION FLAG OPTIONS
// Maps to: ตรวจสินค้าติดลบด้วย (การคำนวณสั่งซื้อ)
// ==========================================
export const QUANTITY_VALIDATION_OPTIONS = [
    { id: 0, name: '(Default)' },
    { id: 1, name: 'ยอดสั่งจอง ,ค้างส่ง ,ค้างรับ ,Sale Stock' },
    { id: 2, name: 'ยอด Sale Stock' },
] as const;

// ==========================================
// ZOD SCHEMA
// ==========================================

export const icOptionListSchema = z.object({
    option_list_id: z.coerce.number().optional(),
    ic_option_id: z.coerce.number(),
    system_document_id: z.coerce.number(),
    sort_order: z.coerce.number().optional().default(0),

    // Dropdown fields (int: 0 = Default, others = specific option)
    negative_stock_check: z.coerce.number().int().min(0).default(0),
    negative_stock_mode: z.coerce.number().int().min(0).default(0),
    quantity_validation_flag: z.coerce.number().int().min(0).default(0),

    // Virtual join fields for display
    system_document_code: z.coerce.string().optional(),
    system_document_name: z.coerce.string().optional(),
    system_document_name_eng: z.coerce.string().optional(),
});

export type ICOptionListItem = z.infer<typeof icOptionListSchema>;

export interface ICOptionListFormData {
    ic_option_id: number;
    system_document_id: number;
    sort_order: number;
    negative_stock_check: number;
    negative_stock_mode: number;
    quantity_validation_flag: number;
}
