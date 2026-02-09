/**
 * @file warehouse-types.ts
 * @description Warehouse entity types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

// ====================================================================================
// WAREHOUSE
// ====================================================================================

/** WarehouseMaster - ข้อมูลคลังสินค้า */
export interface WarehouseMaster extends BaseMasterData {
    warehouse_id: string;
    warehouse_code: string;
    warehouse_name: string;
    branch_id?: string;
    address?: string;
}

/** WarehouseFormData - สำหรับ Frontend Form */
export interface WarehouseFormData {
    warehouseCode: string;
    warehouseCodeSearch: string;
    warehouseName: string;
    branchId: string;
    branchName: string;
    address: string;
    isActive: boolean;
}

/** WarehouseListItem - สำหรับแสดงในตาราง */
export interface WarehouseListItem {
    warehouse_id: string;
    warehouse_code: string;
    warehouse_name: string;
    branch_name?: string;
    is_active: boolean;
    created_at: string;
}

/** Initial form data สำหรับ new warehouse */
export const initialWarehouseFormData: WarehouseFormData = {
    warehouseCode: '',
    warehouseCodeSearch: '',
    warehouseName: '',
    branchId: '',
    branchName: '',
    address: '',
    isActive: true,
};

// ====================================================================================
// REQUEST / RESPONSE TYPES
// ====================================================================================

export interface WarehouseCreateRequest {
    warehouse_code: string;
    warehouse_name: string;
    branch_id: string;
    address?: string;
    is_active?: boolean;
}

export interface WarehouseUpdateRequest extends Partial<WarehouseCreateRequest> {
    warehouse_id: string;
}
