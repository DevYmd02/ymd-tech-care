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
    employee_fullname?: string;
    title_name?: string;
    first_name?: string;
    last_name?: string;
    // Thai fields (found in some mocks/API responses)
    employee_title_th?: string;
    employee_firstname_th?: string;
    employee_lastname_th?: string;
    email?: string;
    phone?: string;
    position_id?: number;
    position_name?: string;
    department_id?: number;
    department_name?: string;
    side_id?: string | number;
    side_name?: string;
    status: 'ACTIVE' | 'RESIGNED' | 'SUSPENDED';
    is_active: boolean;
    // Relationship Objects (found in nested responses)
    position?: {
        position_name: string;
    };
    department?: {
        department_name: string;
    };
    side?: {
        side_name: string;
    };
    branch?: {
        branch_name: string;
    };
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
