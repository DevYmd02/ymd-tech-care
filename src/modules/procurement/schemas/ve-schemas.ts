import { z } from 'zod';

/**
 * @file ve-schemas.ts
 * @description Zod validation schemas for Vendor Evaluation (VE) module.
 */

// ====================================================================================
// 1. Enums & Constants
// ====================================================================================

export const VendorGradeEnum = z.enum(['Preferred', 'Grade A', 'Grade B', 'Grade C']);
export const EvaluationResultEnum = z.enum(['PASS', 'IMPROVE', 'TERMINATE']);

// ====================================================================================
// 2. Form Data Schemas
// ====================================================================================

export const VECriteriaRowSchema = z.object({
  criteria_code: z.string().min(1, 'รหัสหัวข้อจำเป็น'),
  criteria_name: z.string().min(1, 'ชื่อหัวข้อการประเมินจำเป็น'),
  score: z.number().min(0).max(100, 'คะแนนต้องอยู่ระหว่าง 0-100'),
  weight: z.number().min(0).max(100, 'น้ำหนักต้องอยู่ระหว่าง 0-100'),
  weighted_score: z.number().min(0).max(100),
  remark: z.string().optional(),
});

export const CreateVEFormSchema = z.object({
  vendor_id: z.string().min(1, 'กรุณาเลือกผู้ขาย'),
  vendor_name: z.string().optional(),
  evaluation_period: z.string().min(1, 'กรุณาระบุรอบการประเมิน'),
  evaluation_date: z.union([z.string(), z.date()]),
  emp_id: z.string().optional(), // Could be system generated or auto-filled
  
  // Array of criteria
  criteria: z.array(VECriteriaRowSchema).min(1, 'ต้องมีเกณฑ์การประเมินอย่างน้อย 1 ข้อ'),
  
  // Summary fields 
  total_score: z.number().min(0).max(100),
  vendor_grade: VendorGradeEnum.optional(),
  evaluation_result: EvaluationResultEnum.optional(),
  remark: z.string().optional(),
});

export type CreateVEFormData = z.infer<typeof CreateVEFormSchema>;
export type VECriteriaRowData = z.infer<typeof VECriteriaRowSchema>;
