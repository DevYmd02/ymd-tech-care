/**
 * @file employee-group.types.ts
 * @description Employee Group (กลุ่มพนักงาน) master data types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface EmployeeGroupMaster extends BaseMasterData {
    employee_group_id: string; // uuid
    employee_group_code: string;
    employee_group_name: string;
    employee_group_nameeng: string;
}

export interface EmployeeGroupFormData {
    employeeGroupCode: string;
    employeeGroupName: string;
    employeeGroupNameEn: string;
    isActive: boolean;
}

export type EmployeeGroupListItem = EmployeeGroupMaster;

