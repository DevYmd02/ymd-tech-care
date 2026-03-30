/**
 * @file employee-side.types.ts
 * @description Employee Side (ฝ่าย) master data types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface EmployeeSideMaster extends BaseMasterData {
    id: string | number;
    side_id?: string | number; // DB Field
    side_code?: string;       // DB Field
    side_name?: string;       // DB Field
    side_nameeng?: string;    // DB Field
    department_id: number;    // Legacy Field
    department_code: string;  // Legacy Field
    department_name: string;  // Legacy Field
    department_name_en?: string; // Legacy Field
}

export interface EmployeeSideFormData {
    sideCode: string;
    sideName: string;
    sideNameEn: string;
    isActive: boolean;
}

// Backward compatibility aliases
export type DepartmentMaster = EmployeeSideMaster;
export type DepartmentFormData = EmployeeSideFormData;
export type DepartmentListItem = EmployeeSideMaster;
export type EmployeeSideListItem = EmployeeSideMaster;
