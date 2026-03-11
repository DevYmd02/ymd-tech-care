/**
 * @file warehouse-types.ts
 * @description Warehouse entity types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

// ====================================================================================
// WAREHOUSE
// ====================================================================================

/** BackendWarehouse - โครงสร้างดิบจาก API (Exact backend structure) */
export interface BackendWarehouse {
    warehouse_id: number;
    warehouse_code: string;
    warehouse_name: string;
    branch_id: number;
    address?: string;
}

/** WarehouseMaster - ข้อมูลคลังสินค้า (Extended for UI/Master Detail) */
export interface WarehouseMaster extends BaseMasterData, BackendWarehouse {
    id: number; // Mapping: warehouse_id
    // BaseMasterData handles is_active: boolean
}

/** WarehouseFormData - สำหรับ Frontend Form (Zod Schema) */
export interface WarehouseFormData {
    warehouse_code: string;
    warehouse_name: string;
    branch_id: number;
    address?: string;
    is_active: boolean;
}

/** WarehouseListItem - สำหรับแสดงในตาราง (UI-Ready) */
export interface WarehouseListItem extends BackendWarehouse {
    id: number;          // Mapping: warehouse_id
    is_active: boolean;  // Default to true if missing from API
    branch_name?: string;
    created_at?: string;
    updated_at?: string;
}

/** Initial form data สำหรับ new warehouse */
export const initialWarehouseFormData: WarehouseFormData = {
    warehouse_code: '',
    warehouse_name: '',
    branch_id: 0,
    address: '',
    is_active: true,
};

// ====================================================================================
// REQUEST / RESPONSE TYPES
// ====================================================================================

export interface WarehouseCreateRequest {
    warehouse_code: string;
    warehouse_name: string;
    branch_id: number;
    address?: string;
    is_active?: boolean;
}

export interface WarehouseUpdateRequest extends Partial<WarehouseCreateRequest> {
    warehouse_id: number;
}
