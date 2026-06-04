import { z } from 'zod';

/**
 * @file delivery.schemas.ts
 * @description Zod schemas for Delivery module
 * @tables delivery_header (D11), delivery_line (D12)
 */

// ============================================================
// delivery_line schema
// ============================================================
export const DeliveryLineSchema = z.object({
    delivery_line_id: z.union([z.string(), z.number()]).optional(),
    delivery_id: z.union([z.string(), z.number()]).optional(),
    so_line_id: z.union([z.string(), z.number()]).optional(),
    item_id: z.string().min(1, 'กรุณาเลือกสินค้า'),
    item_code: z.string().default(''),
    item_name: z.string().default(''),
    qty_shipped: z.coerce.number().min(0.001, 'จำนวนต้องมากกว่า 0'),
    qty_ordered: z.coerce.number().optional(),
    remaining_qty: z.coerce.number().optional(),
    uom_id: z.string().min(1, 'กรุณาเลือกหน่วยนับ'),
    uom_name: z.string().optional(),
    warehouse_id: z.string().min(1, 'กรุณาเลือกคลังสินค้า'),
    warehouse_name: z.string().optional(),
    location_id: z.string().optional(),
    location_name: z.string().optional(),
    lot_id: z.union([z.string(), z.number()]).optional().nullable(),
    lot_no: z.string().optional().nullable(),
    lot_balance_id: z.coerce.number().optional().nullable(),
    serial_no: z.string().optional(),
    remarks: z.string().optional(),
    item_uom_id: z.coerce.number().optional().nullable(),
}).passthrough();

// ============================================================
// delivery_header schema
// ============================================================
export const DeliveryFormSchema = z.object({
    delivery_id: z.union([z.string(), z.number()]).optional(),
    delivery_no: z.string().optional(),
    delivery_date: z.string().min(1, 'กรุณาระบุวันที่จัดส่ง'),
    so_id: z.string().min(1, 'กรุณาเลือกใบสั่งขาย (SO)'),
    so_no: z.string().optional(),
    customer_id: z.string().min(1, 'กรุณาเลือกลูกค้า'),
    customer_name: z.string().optional(),
    branch_id: z.string().min(1, 'กรุณาเลือกสาขา'),
    warehouse_id: z.string().optional(),
    ship_to_address: z.string().optional(),
    ship_method: z.string().optional(),
    carrier: z.string().optional(),
    tracking_no: z.string().optional(),
    status: z.enum(['DRAFT', 'SHIPPED', 'DELIVERED', 'CANCELLED']).default('DRAFT'),
    ship_by_emp: z.string().optional(),
    ship_by_emp_name: z.string().optional(),
    remarks: z.string().optional(),
    docu_date: z.string().min(1, 'กรุณาระบุวันที่เอกสาร'),
    lines: z.array(DeliveryLineSchema).min(1, 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ'),
});

export type DeliveryFormValues = z.infer<typeof DeliveryFormSchema>;
export type DeliveryLineValues = z.infer<typeof DeliveryLineSchema>;

/**
 * ค่าเริ่มต้นสำหรับฟอร์มใบจัดส่งสินค้า
 */
export const getDeliveryDefaultValues = (): Partial<DeliveryFormValues> => ({
    delivery_no: '',
    delivery_date: new Date().toISOString().split('T')[0],
    docu_date: new Date().toISOString().split('T')[0],
    so_id: '',
    so_no: '',
    customer_id: '',
    customer_name: '',
    branch_id: '',
    warehouse_id: '',
    ship_to_address: '',
    ship_method: '',
    carrier: '',
    tracking_no: '',
    status: 'DRAFT',
    ship_by_emp: '',
    ship_by_emp_name: '',
    remarks: '',
    lines: [],
});
