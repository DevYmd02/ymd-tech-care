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

/**
 * Employee Form Data — covers all fields from M16 employee schema
 */
export interface EmployeeFormData {
    // ข้อมูลพื้นฐาน
    employeeCode: string;           // emp_code varchar(25) yes
    taxIdCard: string;              // tax_idcard varchar(25)
    empTitle: string;               // emp_title varchar(50) yes  — คำนำหน้า (Thai)
    empTitleEng: string;            // emp_titleeng varchar(255) — คำนำหน้า (Eng)
    empName: string;                // emp_name varchar(255) yes — ชื่อพนักงาน (Thai)
    empNameEng: string;             // emp_nameeng varchar(255) — ชื่อพนักงาน (Eng)
    tel: string;                    // tel varchar(255)
    email: string;                  // email varchar(255)

    // ที่อยู่
    address: string;                // address text
    district: string;               // district varchar(100) — ตำบล
    amphur: string;                 // amphur varchar(100) — อำเภอ
    province: string;               // province varchar(100) — จังหวัด
    postCode: string;               // post_code varchar(25) — รหัสไปรษณีย์

    // ข้อมูลองค์กร
    deptId: string;                 // dept_id uuid (FK) — ID แผนก
    deptCode: string;               // dept_code varchar(25) — รหัสแผนก
    postId: string;                 // post_id uuid (FK) — ID ตำแหน่ง
    positionCode: string;           // position_code varchar(25) — รหัสตำแหน่ง
    empGroupId: string;             // emp_group_id uuid (FK)
    empGroupCode: string;           // emp_group_code varchar(25)
    empHead: string;                // emp_head uuid — ID หัวหน้า
    empHeadCode: string;            // emp_head_code varchar(25) — รหัสหัวหน้า
    empType: string;                // emp_type boolean — S:พนักงานขาย, G:พนักงานปกติ
    taxId: string;                  // tax_id varchar(25) — เลขประจำตัวผู้เสียภาษี

    // วันที่สำคัญ
    empStartDate: string;           // emp_startdate datetime(8)
    empResignDate: string;          // emp_resigndate datetime(8)
    empStatus: string;              // emp_status boolean — 1:ทำงาน 2:พักงาน 3:ลาออก 4:เกษียณ

    // อื่นๆ
    empSignature: string;           // emp_signature varchar(255) — Path ลายเซ็นต์ (Legacy/Main)
    signatures?: EmployeeSignature[]; // รองรับหลายลายเซ็นต์ (แยกตาราง/แยก Endpoint)
    remark: string;                 // remark varchar(255)

    // Legacy fields (kept for backward compat)
    firstName: string;
    lastName: string;
    positionId: number;
    sideId: string | number;
    isActive: boolean;
}

/**
 * โครงสร้างข้อมูลลายเซ็นต์พนักงาน (ตรงตามตาราง employee_signature)
 */
export interface EmployeeSignature {
    emp_signature_id?: number;      // Primary Key (ID ลายเซ็นต์)
    emp_id?: number;                // รหัสพนักงาน (FK ไป employee)
    signature_url: string;          // ที่อยู่ไฟล์ลายเซ็นต์ (URL / Path)
    signature_name?: string;        // ชื่อไฟล์ / คำอธิบายลายเซ็นต์
    is_active: boolean;             // เป็นลายเซ็นต์ที่ใช้งานอยู่หรือไม่
    is_deleted: boolean;            // สถานะลบ (Soft Delete)
    
    // Helper fields สำหรับ Frontend
    file?: File;                    // สำหรับเก็บไฟล์ที่จะอัปโหลด
    previewUrl?: string;            // สำหรับแสดง Preview รูปภาพ
}

export type EmployeeListItem = EmployeeMaster;
