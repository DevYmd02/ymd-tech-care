/**
 * @file employee-side.types.ts
 * @description Employee Side (ฝ่าย) master data types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface EmployeeSideMaster extends BaseMasterData {
    id: string | number;
    emp_side_id?: string | number;
    emp_side_code?: string;
    emp_side_name?: string;
    emp_side_nameeng?: string;
    is_active: boolean;
    // Legacy mapping support
    side_id?: string | number;
    side_code?: string;
    side_name?: string;
    side_nameeng?: string;
    department_id?: string | number;
    department_code?: string;
    department_name?: string;
    department_name_en?: string;
}

export interface EmployeeSideFormData {
    emp_side_code: string;
    emp_side_name: string;
    emp_side_nameeng: string;
    is_active: boolean;
}

// Backward compatibility aliases
export type DepartmentMaster = EmployeeSideMaster;
export type DepartmentFormData = EmployeeSideFormData;
export type DepartmentListItem = EmployeeSideMaster;
export type EmployeeSideListItem = EmployeeSideMaster;

