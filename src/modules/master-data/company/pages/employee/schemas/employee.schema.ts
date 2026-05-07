import { z } from 'zod';

/**
 * @file employee.schema.ts
 * @description Zod schema for Employee form. Uses snake_case to match API payloads.
 */
export const employeeSchema = z.object({
    branch_id:             z.number().nullable(),
    employee_code:         z.string().min(1, 'กรุณากรอกรหัสพนักงาน').max(25),
    employee_title_th:     z.string().min(1, 'กรุณาเลือกคำนำหน้า'),
    employee_title_en:     z.string().default(''),
    employee_firstname_th: z.string().min(1, 'กรุณากรอกชื่อ (ไทย)'),
    employee_lastname_th:  z.string().min(1, 'กรุณากรอกนามสกุล (ไทย)'),
    employee_firstname_en: z.string().default(''),
    employee_lastname_en:  z.string().default(''),
    employee_startdate:    z.string().nullable(),
    employee_resigndate:   z.string().nullable(),
    employee_status:       z.number().default(1),
    phone:                 z.string().min(1, 'กรุณากรอกเบอร์โทรศัพท์'),
    email:                 z.string().email('รูปแบบอีเมลไม่ถูกต้อง').or(z.literal('')),
    remark:                z.string().default(''),
    tax_id:                z.string().default(''),
    emp_type:              z.string().default('G'),
    position_id:           z.number().nullable(),
    emp_dept_id:           z.number().nullable(),
    is_active:             z.boolean().default(true),
    employee_head_id:      z.number().nullable(),
    
    // Addresses
    addresses: z.array(z.object({
        address_type:   z.string().default('CONTACT'),
        address:        z.string().default(''),
        sub_district:   z.string().default(''),
        district:       z.string().default(''),
        province:       z.string().default(''),
        postal_code:    z.string().default(''),
        country:        z.string().default('TH'),
        contact_person: z.string().default('')
    })).default([])
});

export type EmployeeSchemaType = z.infer<typeof employeeSchema>;
