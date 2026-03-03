import { z } from 'zod';

/**
 * @file qc-schemas.ts
 * @description Zod validation schemas for Quotation Comparison (QC) module.
 * Ground Truth Sync: Aligned with actual UI statuses and DB structure.
 */

// ====================================================================================
// 1. Base Constants & Enums (The Core Fix)
// ====================================================================================

/**
 * QC Status Enum
 * Ground Truth (image_3411fe.png & image_3501dc.png):
 * 'DRAFT'     = แบบร่าง
 * 'COMPLETED' = ยืนยันผลแล้ว
 * 'CANCELLED' = ยกเลิก
 */
export const QCStatusEnum = z.enum(['DRAFT', 'COMPLETED', 'CANCELLED']);

// ====================================================================================
// 2. Comparison Matrix Schemas (image_40c8de.png)
// ====================================================================================

/**
 * QCMatrixVendorCellSchema
 * Validates individual vendor quotes for a specific item.
 */
export const QCMatrixVendorCellSchema = z.object({
  unit_price: z.number().nonnegative('ราคาต่อหน่วยต้องไม่ติดลบ').default(0),
  total_price: z.number().nonnegative('ราคารวมต้องไม่ติดลบ').default(0),
  is_no_quote: z.boolean().default(false),
  is_winner: z.boolean().default(false),
});

/**
 * QCMatrixRowSchema
 * Validates the Y-axis (Line items) in the comparison matrix.
 */
export const QCMatrixRowSchema = z.object({
  item_id: z.string().uuid('ID สินค้าไม่ถูกต้อง').optional(),
  code: z.string().min(1, 'รหัสสินค้าจำเป็นต้องระบุ'),
  description: z.string().min(1, 'รายละเอียดสินค้าจำเป็นต้องระบุ'),
  qty: z.number().positive('จำนวนต้องมากกว่า 0'),
  unit: z.string().min(1, 'หน่วยนับจำเป็นต้องระบุ'),
  // Dynamic record of vendor_id -> cell data
  vendors: z.record(z.string(), QCMatrixVendorCellSchema),
}).superRefine((data, ctx) => {
  // Logic Audit: Winning Logic
  const vendorValues = Object.values(data.vendors);
  const hasOfferedPrices = vendorValues.some(v => !v.is_no_quote && v.total_price > 0);
  const hasWinnerSelected = vendorValues.some(v => v.is_winner);

  if (hasOfferedPrices && !hasWinnerSelected) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `กรุณาเลือกผู้ชนะสำหรับรายการ ${data.code}`,
      path: ['vendors']
    });
  }
});

// ====================================================================================
// 3. Database Header Schemas (image_40d0a0.png)
// ====================================================================================

/**
 * QCHeaderSchema
 * Strictly follows the DB structure.
 */
export const QCHeaderSchema = z.object({
  qc_id: z.string().uuid().optional(),
  qc_no: z.string().optional(),
  pr_id: z.string().uuid('กรุณาเลือกใบขอซื้อ (PR)').optional(),
  rfq_id: z.string().uuid().optional(), // Added for precise RFQ tracking
  status: QCStatusEnum.default('DRAFT'),
  comparison_date: z.union([z.string(), z.date()]).optional(),
  dept_division: z.string().optional(),
  created_by: z.string().uuid().optional(),
  created_at: z.string().optional(),
});

// ====================================================================================
// 4. Service Types (Request/Response)
// ====================================================================================

export interface QCListParams {
  qc_no?: string;
  pr_no?: string;
  rfq_no?: string;
  status?: QCStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface QCListResponse {
  data: QCListItem[];
  total: number;
  page: number;
  limit: number;
}

// ====================================================================================
// 4. List View Schema (Calculated Fields)
// ====================================================================================

/**
 * QCListItemSchema
 * Used for QCListPage.tsx containing aggregated data.
 */
export const QCListItemSchema = QCHeaderSchema.extend({
  pr_no: z.string().optional(),
  rfq_no: z.string().optional(),
  vendor_count: z.number().nonnegative().optional().default(0),
  lowest_price: z.number().nonnegative().optional().default(0),
  lowest_bidder_name: z.string().optional().default('-'),
  subject: z.string().optional(),
});

/**
 * CreateQCSchema
 * Payload for creation/update including items.
 */
export const CreateQCSchema = QCHeaderSchema.extend({
  items: z.array(QCMatrixRowSchema).min(1, 'ต้องมีรายการเปรียบเทียบอย่างน้อย 1 รายการ'),
  remark: z.string().optional(),
});

// ====================================================================================
// 5. Types Integration & Clean-Up
// ====================================================================================

export type QCStatus = z.infer<typeof QCStatusEnum>;
export type QCMatrixVendorCell = z.infer<typeof QCMatrixVendorCellSchema>;
export type QCMatrixRow = z.infer<typeof QCMatrixRowSchema>;
export type QCHeader = z.infer<typeof QCHeaderSchema>;
export type QCListItem = z.infer<typeof QCListItemSchema>;
export type QCFormData = z.infer<typeof CreateQCSchema>;
export type QCCreateData = QCFormData;