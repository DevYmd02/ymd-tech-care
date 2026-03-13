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
  item_id: z.coerce.number().optional(),
  code: z.string().min(1, 'รหัสสินค้าจำเป็นต้องระบุ'),
  description: z.string().min(1, 'รายละเอียดสินค้าจำเป็นต้องระบุ'),
  qty: z.number().positive('จำนวนต้องมากกว่า 0'),
  unit: z.string().min(1, 'หน่วยนับจำเป็นต้องระบุ'),
  // Dynamic record of vendor_id -> cell data
  vendors: z.record(z.coerce.number(), QCMatrixVendorCellSchema),
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
  qc_id: z.coerce.number().optional(),
  qc_no: z.string().optional(),
  pr_id: z.coerce.number().optional(),
  rfq_id: z.coerce.number().optional(), // Added for precise RFQ tracking
  winning_vq_id: z.coerce.number().optional(), // VQ ที่ชนะการเปรียบเทียบ
  status: QCStatusEnum.default('DRAFT'),
  comparison_date: z.union([z.string(), z.date()]).optional(),
  dept_division: z.string().optional(),
  created_by: z.coerce.number().optional(),
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
  totalPages: number;
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
  vendor_name: z.string().optional(), // 🎯 New API Mapping
  vq_total_amount: z.union([z.string(), z.number()]).optional(), // 🎯 New API Mapping
  vq_header_id: z.coerce.number().optional(), // 🎯 Required for Smart Status Logic
  winning_vendor_id: z.coerce.number().optional(),
  subject: z.string().optional(),
});

/**
 * CreateQCFormSchema
 * Used for UI State in QCFormModal.tsx (contains extra display fields)
 */
export const CreateQCFormSchema = QCHeaderSchema.extend({
  items: z.array(QCMatrixRowSchema).optional(),
  remark: z.string().optional(),
  rfq_no: z.string().optional(),
  pr_no: z.string().optional(),
});

/**
 * CreateQCSchema
 * 5-Field Pure Payload for QC Creation (Strictly for API)
 */
export const CreateQCSchema = z.object({
  rfq_id: z.coerce.number(),
  pr_id: z.coerce.number().nullable().optional(),
  department_id: z.coerce.number().nullable().optional(),
  created_by: z.coerce.number(),
  winning_vq_id: z.coerce.number(),
});

export type CreateQCPayload = z.infer<typeof CreateQCSchema>;
export type CreateQCFormData = z.infer<typeof CreateQCFormSchema>;

// ====================================================================================
// 5. Submit Winner Schema
// ====================================================================================

/**
 * SubmitQCWinnerSchema
 * Minimal relational payload indicating which VQ won.
 */
export const SubmitQCWinnerSchema = z.object({
  winning_vq_id: z.coerce.number(),
});

export type SubmitQCWinnerData = z.infer<typeof SubmitQCWinnerSchema>;

// ====================================================================================
// 6. Types Integration & Clean-Up
// ====================================================================================

export type QCStatus = z.infer<typeof QCStatusEnum>;
export type QCMatrixVendorCell = z.infer<typeof QCMatrixVendorCellSchema>;
export type QCMatrixRow = z.infer<typeof QCMatrixRowSchema>;
export type QCHeader = z.infer<typeof QCHeaderSchema>;
export type QCListItem = z.infer<typeof QCListItemSchema>;
export type QCFormData = z.infer<typeof CreateQCFormSchema>;
export type QCCreateData = CreateQCPayload; // Service create now uses the 5-field payload
export type CreateQCFormSchemaType = z.infer<typeof CreateQCFormSchema>;

// ====================================================================================
// 7. PR-Centric "Ready for PO" Types (Postman Response Mapping)
// ====================================================================================

export interface IReadyForPOPR {
  pr_id: number;
  pr_no: string;
  base_currency_code: string;
  pr_base_total_amount: number;
  requester_name: string;
  preferred_vendor?: {
    vendor_id: number;
    vendor_name: string;
  } | null;
  qcHeaders?: {
    qc_id: number;
    qc_no: string;
    pr_id: number;
    winning_vq_id: number;
    winning_vendor_id?: number;
    status: string;
    created_at: string;
  }[] | null;
}