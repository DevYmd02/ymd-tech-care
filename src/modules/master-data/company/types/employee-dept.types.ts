/**
 * @file employee-dept.types.ts
 * @description Employee Dept (แผนก) master data types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface EmployeeDeptMaster extends BaseMasterData {
    id: string | number;
    emp_dept_id?: string | number;
    emp_dept_code?: string;
    emp_dept_name?: string;
    emp_dept_nameeng?: string;
    emp_side_id?: string | number;
    is_active: boolean;
    
    // Joint data support
    emp_side_name?: string;
    emp_side_code?: string;

    // Legacy mapping support (Backward compatibility)
    dept_id?: string | number;
    dept_code?: string;
    dept_name?: string;
    dept_nameeng?: string;
    side_id?: string | number;
    side_code?: string;
    side_name?: string;
    section_id?: number;
    section_code?: string;
    section_name?: string;
    section_name_en?: string;
    department_id?: number;
    department_code?: string;
    department_name?: string;
}

export interface EmployeeDeptFormData {
    emp_dept_code: string;
    emp_dept_name: string;
    emp_dept_nameeng: string;
    emp_side_id: string | number;
    is_active: boolean;
}

// Backward compatibility aliases
export type SectionMaster = EmployeeDeptMaster;
export type SectionFormData = EmployeeDeptFormData;
export type SectionListItem = EmployeeDeptMaster;
export type EmployeeDeptListItem = EmployeeDeptMaster;
