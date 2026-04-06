/**
 * @file ve-types.ts
 * @description Type definitions for Vendor Evaluation (VE) module
 * @tables vendor_evaluation, vendor_evaluation_score
 */

import type { CreateVEFormData, VendorGradeEnum, EvaluationResultEnum } from '@/modules/procurement/schemas/ve-schemas';
import { z } from 'zod';

// ====================================================================================
// VENDOR EVALUATION (VE) - Tables Representation
// ====================================================================================

export type VendorGrade = z.infer<typeof VendorGradeEnum>;
export type EvaluationResult = z.infer<typeof EvaluationResultEnum>;

/** (M36) vendor_evaluation */
export interface VendorEvaluationHeader {
    evaluation_id: string;              // UUID
    vendor_id: string;                  // UUID
    vendor_name: string;
    evaluation_period: string;          // e.g. "2026 - ไตรมาส 1" 
    evaluation_date: string;            // ISO Date
    emp_id: string;                     // UUID
    total_score: number;
    vendor_grade: VendorGrade;
    evaluation_result: EvaluationResult;
    remark?: string;
    created_date: string;               // ISO Date
    
    // Aggregation for list view
    evaluator_name?: string;            // Joined name
}

/** (M37) vendor_evaluation_score */
export interface VendorEvaluationScore {
    score_id: string;                   // UUID
    evaluation_id: string;              // UUID
    criteria_code: string;              // QUALITY, DELIVERY, PRICE
    criteria_name: string;              // คุณภาพสินค้า/บริการ
    score: number;
    weight: number;                     // 40, 30, 30
    weighted_score: number;             // Calculated
    remark?: string;
}

// ====================================================================================
// SERVICE TYPES - REQUEST/RESPONSE
// ====================================================================================

export interface VEListParams {
    vendor_name?: string;
    evaluation_period?: string;
    vendor_grade?: VendorGrade;
    evaluation_result?: EvaluationResult;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
    sort?: string;
}

export interface VEListResponse {
    data: VendorEvaluationHeader[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Ensure full compatibility with the form
export type CreateVEPayload = CreateVEFormData;
