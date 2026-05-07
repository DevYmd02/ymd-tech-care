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
    tax_id?: string;
    emp_type?: string;
    position_id?: number;
    position_name?: string;
    department_id?: number;
    department_code?: string;
    department_name?: string;
    emp_side_id?: string | number;
    emp_side_code?: string;
    emp_side_name?: string;
    side_code?: string;
    side_name?: string;
    // Department variations
    dept_id?: string | number;
    dept_code?: string;
    dept_name?: string;
    emp_dept_code?: string;
    emp_dept_name?: string;
    // Position variations
    pos_id?: string | number;
    pos_name?: string;
    emp_position_name?: string;
    status: 'ACTIVE' | 'RESIGNED' | 'SUSPENDED';
    is_active: boolean;
    // Relationship Objects (found in nested responses)
    position?: {
        position_code?: string;
        position_name: string;
    };
    department?: {
        department_code?: string;
        department_name: string;
    };
    side?: {
        side_code?: string;
        side_name: string;
    };
    branch?: {
        branch_code?: string;
        branch_name: string;
    };
}

export interface EmployeeAddress {
    address_type: 'CONTACT' | 'REGISTERED' | string;
    address: string;
    sub_district?: string;
    district: string;
    province: string;
    postal_code: string;
    country: string;
    contact_person: string;
}

/**
 * Employee Form Data — covers all fields from requested POST payload
 */
export interface EmployeeFormData {
    branch_id: number | null;
    employee_code: string;
    employee_title_th: string;
    employee_title_en: string;
    employee_firstname_th: string;
    employee_lastname_th: string;
    employee_firstname_en: string;
    employee_lastname_en: string;
    employee_startdate: string | null;
    employee_resigndate: string | null;
    employee_status: number;
    phone: string;
    email: string;
    remark: string;
    tax_id: string;
    emp_type: string;
    position_id: number | null;
    emp_dept_id: number | null;
    is_active: boolean;
    employee_head_id: number | null;
    addresses: EmployeeAddress[];
}

export type EmployeeListItem = EmployeeMaster;
