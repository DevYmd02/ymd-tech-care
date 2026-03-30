/**
 * @file employee-dept.types.ts
 * @description Employee Dept (แผนก) master data types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface EmployeeDeptMaster extends BaseMasterData {
    id: string | number;
    dept_id?: string | number; // DB Field
    dept_code?: string;       // DB Field
    dept_name?: string;       // DB Field
    dept_nameeng?: string;    // DB Field
    side_id?: string | number; // DB Field (FK)
    side_code?: string;       // DB Field (FK)
    side_name?: string;       // DB Field (FK/Join)
    section_id: number;       // Legacy Field
    section_code: string;     // Legacy Field
    section_name: string;     // Legacy Field
    section_name_en?: string; // Legacy Field
    department_id?: number;   // Legacy Field (FK)
    department_code?: string; // Legacy Field (FK)
    department_name?: string; // Legacy Field (FK)
}

export interface EmployeeDeptFormData {
    deptCode: string;
    deptName: string;
    deptNameEn: string;
    sideId: string | number;
    isActive: boolean;
}

// Backward compatibility aliases
export type SectionMaster = EmployeeDeptMaster;
export type SectionFormData = EmployeeDeptFormData;
export type SectionListItem = EmployeeDeptMaster;
export type EmployeeDeptListItem = EmployeeDeptMaster;
