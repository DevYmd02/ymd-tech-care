/**
 * @file company-structure.types.ts
 * @description Company organizational structure types (Department, Section, Job, Position, Employee Group, Employee)
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

// ====================================================================================
// DEPARTMENT (ฝ่าย)
// ====================================================================================

export interface DepartmentMaster extends BaseMasterData {
    id: number;
    department_id: number;
    department_code: string;
    department_name: string;
    department_name_en?: string;
}

export interface DepartmentFormData {
    departmentCode: string;
    departmentName: string;
    departmentNameEn: string;
    isActive: boolean;
}

export type DepartmentListItem = DepartmentMaster;

// ====================================================================================
// SECTION (แผนก)
// ====================================================================================

export interface SectionMaster extends BaseMasterData {
    id: number;
    section_id: number;
    section_code: string;
    section_name: string;
    section_name_en?: string;
    department_id?: number;
    department_code?: string;
    department_name?: string;
}

export interface SectionFormData {
    sectionCode: string;
    sectionName: string;
    sectionNameEn: string;
    departmentId: number;
    isActive: boolean;
}

export type SectionListItem = SectionMaster;

// ====================================================================================
// JOB (Job)
// ====================================================================================

export interface JobMaster extends BaseMasterData {
    id: number;
    job_id: number;
    job_code: string;
    job_name: string;
}

export interface JobFormData {
    jobCode: string;
    jobName: string;
    isActive: boolean;
}

export type JobListItem = JobMaster;

// ====================================================================================
// EMPLOYEE GROUP (กลุ่มพนักงาน)
// ====================================================================================

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

// ====================================================================================
// POSITION (ตำแหน่ง)
// ====================================================================================

export interface PositionMaster extends BaseMasterData {
    id: number;
    position_id: number;
    position_code: string;
    position_name: string;
    position_name_en?: string;
}

export interface PositionFormData {
    positionCode: string;
    positionName: string;
    positionNameEn: string;
    isActive: boolean;
}

export type PositionListItem = PositionMaster;

// ====================================================================================
// EMPLOYEE (พนักงาน)
// ====================================================================================

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
    status: 'ACTIVE' | 'RESIGNED' | 'SUSPENDED';
}

export interface EmployeeFormData {
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    positionId: number;
    departmentId: number;
    isActive: boolean;
}

export type EmployeeListItem = EmployeeMaster;
