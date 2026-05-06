/**
 * @file common-types.ts
 * @description Shared types ที่ใช้ร่วมกันในโปรเจค
 * @usage import type { CommonStatus, BaseEntity, ApiResponse } from '@/shared/types/common-types';
 */

// ====================================================================================
// STATUS TYPES
// ====================================================================================

/** สถานะทั่วไป (ACTIVE/INACTIVE) */
export type CommonStatus = 'ACTIVE' | 'INACTIVE';

/** สถานะ Vendor (รวม SUSPENDED และ BLACKLISTED) */
export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLACKLISTED';

// NOTE: PRStatus ย้ายไปที่ pr-types.ts เพื่อหลีกเลี่ยง conflict
// import type { PRStatus } from './pr-types' ถ้าต้องการใช้

// ====================================================================================
// BASE INTERFACES
// ====================================================================================

/** Base interface สำหรับทุก Entity ที่มี audit fields */
export interface BaseEntity {
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
}

/** Base interface สำหรับ Master Data ที่มี is_active flag */
export interface BaseMasterData extends BaseEntity {
    is_active: boolean;
}

/** Base interface สำหรับ List Item ที่แสดงในตาราง */
export interface BaseListItem {
    id: string;
    code: string;
    name: string;
    is_active: boolean;
}

// ====================================================================================
// API TYPES
// ====================================================================================
import type { ApiResponse as BaseApiResponse, DataListResponse, ListParams as BaseListParams } from './api.types';

/** Generic API Response */
export type ApiResponse<T = unknown> = BaseApiResponse<T>;

/** Generic List Response (paginated) */
export type ListResponse<T> = DataListResponse<T>;

/** Generic List Params */
export type ListParams = BaseListParams;


// ====================================================================================
// UTILITY TYPES
// ====================================================================================

/** Make all properties optional except specified keys */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/** Dropdown item for Select components */
export interface DropdownItem {
    value: string;
    label: string;
    disabled?: boolean;
}

// ====================================================================================
// FORM TYPES
// ====================================================================================

/** Form mode - create or edit */
export type FormMode = 'create' | 'edit' | 'view';

/** Form state with validation */
export interface FormState<T> {
    data: T;
    errors: Partial<Record<keyof T, string>>;
    isSubmitting: boolean;
    isDirty: boolean;
}

// ====================================================================================
// APPROVAL WORKFLOW TYPES
// ====================================================================================

/** ApprovalDocType - ประเภทเอกสารที่ต้องอนุมัติ */
export type ApprovalDocType = 'PR' | 'PO' | 'GRN' | 'INVOICE';

/** ApprovalFlow - ตารางกำหนดเงื่อนไขการอนุมัติ */
export interface ApprovalFlow {
    flow_id: string;
    doc_type: ApprovalDocType;
    min_amount: number;
    max_amount: number;
    approval_flow_steps?: ApprovalFlowStep[];
}

/** ApprovalFlowStep - ขั้นตอนการอนุมัติ */
export interface ApprovalFlowStep {
    step_id: string;
    flow_id: string;
    step_no: number;
    approver_role_id?: string;
    approver_user_id?: string;
    min_approvers: number;
}
