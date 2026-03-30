/**
 * @file employee-group.types.ts
 * @description Employee Group (กลุ่มพนักงาน) master data types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface EmployeeGroupMaster extends BaseMasterData {
    id: number;
    group_id: number;
    group_code: string;
    group_name: string;
    group_name_en?: string;
}

export interface EmployeeGroupFormData {
    groupCode: string;
    groupName: string;
    groupNameEn: string;
    isActive: boolean;
}

export type EmployeeGroupListItem = EmployeeGroupMaster;
