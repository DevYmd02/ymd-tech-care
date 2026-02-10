/**
 * @file branch-types.ts
 * @description Branch entity types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

// ====================================================================================
// BRANCH - กำหนดรหัสสาขา
// ====================================================================================

/** BranchMaster - ข้อมูลสาขา */
export interface BranchMaster extends BaseMasterData {
    branch_id: string;
    branch_code: string;
    branch_name: string;
}

/** BranchFormData - สำหรับ Frontend Form */
export interface BranchFormData {
    branchCode: string;
    branchCodeSearch: string;
    branchName: string;
    isActive: boolean;
}

/** BranchListItem - สำหรับแสดงในตาราง */
export interface BranchListItem {
    branch_id: string;
    branch_code: string;
    branch_name: string;
    is_active: boolean;
    created_at: string;
}

/** BranchDropdownItem - สำหรับ Dropdown/Select */
export interface BranchDropdownItem {
    branch_id: string;
    branch_code: string;
    branch_name: string;
}

/** Initial form data สำหรับ new branch */
export const initialBranchFormData: BranchFormData = {
    branchCode: '',
    branchCodeSearch: '',
    branchName: '',
    isActive: true,
};

// ====================================================================================
// REQUEST / RESPONSE TYPES
// ====================================================================================

export interface BranchCreateRequest {
    branch_code: string;
    branch_name: string;
    is_active: boolean;
}

export interface BranchUpdateRequest extends Partial<BranchCreateRequest> {
    branch_id: string;
}
