/**
 * @file employee.types.ts
 * @description Employee (พนักงาน) master data types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface EmployeeMaster extends BaseMasterData {
    id: number;
    employee_id: number;
    employee_code: string;
    employee_name: string;
    title_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    position_id?: number;
    position_name?: string;
    department_id?: number;
    department_name?: string;
    side_id?: string | number;
    status: 'ACTIVE' | 'RESIGNED' | 'SUSPENDED';
}

export interface EmployeeFormData {
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    positionId: number;
    sideId: string | number;
    isActive: boolean;
}

export type EmployeeListItem = EmployeeMaster;
