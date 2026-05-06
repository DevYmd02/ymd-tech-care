import { z } from 'zod';

export const employeeSchema = z.object({
    // ข้อมูลพื้นฐาน
    employeeCode:   z.string().min(1, 'กรุณากรอกรหัสพนักงาน').max(25, 'รหัสพนักงานต้องไม่เกิน 25 ตัวอักษร'),
    taxIdCard:      z.string().min(1, 'กรุณากรอกเลขประจำตัวประชาชน').max(25).regex(/^\d+$/, 'กรุณากรอกเฉพาะตัวเลข'),
    empTitle:       z.string().min(1, 'กรุณาเลือกคำนำหน้า').max(50),
    empTitleEng:    z.string().max(255).or(z.literal('')),
    empName:        z.string().min(1, 'กรุณากรอกชื่อพนักงาน').max(255),
    empNameEng:     z.string().max(255).or(z.literal('')),
    tel:            z.string().min(1, 'กรุณากรอกเบอร์โทรศัพท์').max(255).regex(/^\d+$/, 'กรุณากรอกเฉพาะตัวเลข'),
    email:          z.string().email('รูปแบบอีเมลไม่ถูกต้อง').or(z.literal('')),

    // ที่อยู่
    address:        z.string().min(1, 'กรุณากรอกที่อยู่').max(5000),
    district:       z.string().min(1, 'กรุณากรอกตำบล').max(100),
    amphur:         z.string().min(1, 'กรุณากรอกอำเภอ').max(100),
    province:       z.string().min(1, 'กรุณากรอกจังหวัด').max(100),
    postCode:       z.string().min(1, 'กรุณากรอกรหัสไปรษณีย์').max(25).regex(/^\d+$/, 'กรุณากรอกเฉพาะตัวเลข'),

    // ข้อมูลองค์กร
    deptId:         z.string().min(1, 'กรุณาเลือกแผนก'),
    deptCode:       z.string().max(25).or(z.literal('')),
    postId:         z.string().min(1, 'กรุณาเลือกตำแหน่ง'),
    positionId:     z.number().optional(),
    positionCode:   z.string().max(25).or(z.literal('')),
    empGroupId:     z.string().min(1, 'กรุณาเลือกกลุ่มพนักงาน'),
    empGroupCode:   z.string().max(25).or(z.literal('')),
    headId:         z.string().max(25).or(z.literal('')),
    headName:       z.string().max(255).or(z.literal('')),

    // ข้อมูลอื่นๆ
    salary:         z.number().min(0).default(0),
    remark:         z.string().max(255).or(z.literal('')),
    isActive:       z.boolean().default(true),

    // ลายเซ็นต์ (Array ของรูปภาพ)
    signatures: z.array(z.object({
        emp_signature_id: z.number().optional(),
        signature_url: z.string(),
        previewUrl: z.string().optional(),
        is_active: z.boolean().default(true),
        is_deleted: z.boolean().default(false)
    })).optional().default([])
});

export type EmployeeSchemaType = z.infer<typeof employeeSchema>;
