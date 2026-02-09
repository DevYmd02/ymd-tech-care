/**
 * @file common-master.types.ts
 * @description Shared base types for all Master Data entities
 */

// ====================================================================================
// COMMON TYPES
// ====================================================================================

/** Common status for all master data */
export type MasterDataStatus = 'ACTIVE' | 'INACTIVE';

/** Base interface for all master data */
export interface BaseMasterData {
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
}

/**
 * IBaseMaster - Extended base for code/name entities
 * Use this for entities like Brand, Color, ItemGroup, VendorType, etc.
 */
export interface IBaseMaster extends BaseMasterData {
    id: string;
    code: string;
    name_th: string;
    name_en?: string;
}

/**
 * IBaseFormData - Base for frontend form data (camelCase)
 */
export interface IBaseFormData {
    code: string;
    nameTh: string;
    nameEn: string;
    isActive: boolean;
}

// ====================================================================================
// API TYPES - Request/Response (Common for all master data)
// ====================================================================================

/** Generic list params */
export interface MasterDataListParams {
    status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
    search?: string;
    page?: number;
    limit?: number;
}

/** Generic list response */
export interface MasterDataListResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

/** Generic API response */
export interface MasterDataResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}
