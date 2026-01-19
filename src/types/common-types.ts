/**
 * @file common-types.ts
 * @description Shared types ที่ใช้ร่วมกันในโปรเจค
 * @usage import type { CommonStatus, BaseEntity, ApiResponse } from '@/types/common-types';
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

/** Generic API Response */
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
}

/** Generic List Response (paginated) */
export interface ListResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

/** Generic List Params */
export interface ListParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: CommonStatus | 'ALL';
}

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
