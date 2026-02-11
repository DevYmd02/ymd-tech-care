import { z } from 'zod';


// ====================================================================================
// SUB-SCHEMAS
// ====================================================================================

const VendorAddressSchema = z.object({
    id: z.string(),
    address: z.string().min(1, 'กรุณากรอกที่อยู่'),
    subDistrict: z.string().optional().or(z.literal('')),
    district: z.string().min(1, 'กรุณากรอกอำเภอ/เขต'),
    province: z.string().min(1, 'กรุณากรอกจังหวัด'),
    postalCode: z.string().length(5, 'รหัสไปรษณีย์ต้องมี 5 หลัก').regex(/^\d+$/, 'กรอกได้เฉพาะตัวเลข'),
    country: z.string().min(1, 'กรุณากรอกประเทศ'),
    isMain: z.boolean(),
    addressType: z.enum(['REGISTERED', 'CONTACT', 'BILLING', 'SHIPPING']).optional(),
    
    // Optional contact within address - Interface has `contactPerson?: string;`
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    phoneExtension: z.string().optional(),
    email: z.string().optional()
});

const VendorContactPersonSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'กรุณากรอกชื่อผู้ติดต่อ'),
    position: z.string(),
    phone: z.string(),
    mobile: z.string(),
    email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').or(z.literal('')),
    isMain: z.boolean()
});

const VendorBankAccountSchema = z.object({
    id: z.string(),
    bankName: z.string().min(1, 'กรุณากรอกชื่อธนาคาร'),
    branchName: z.string(),
    accountNumber: z.string().min(1, 'กรุณากรอกเลขบัญชี'),
    accountName: z.string().min(1, 'กรุณากรอกชื่อบัญชี'),
    accountType: z.string(),
    swiftCode: z.string(),
    isMain: z.boolean()
});

// ====================================================================================
// MAIN SCHEMA
// ====================================================================================

export const VendorSchema = z.object({
    vendorCode: z.string(),
    vendorCodeSearch: z.string(),
    vendorName: z.string(),
    vendorNameTh: z.string().min(1, 'กรุณากรอกชื่อเจ้าหนี้ (ไทย)'),
    vendorNameEn: z.string(),
    
    vendorType: z.enum(['COMPANY', 'INDIVIDUAL', 'GOVERNMENT']),
    
    // ID Strings
    vendorTypeId: z.string().min(1, 'กรุณาเลือกประเภทเจ้าหนี้'),
    vendorGroupId: z.string().min(1, 'กรุณาเลือกกลุ่มเจ้าหนี้'),
    currencyId: z.string().min(1, 'กรุณาเลือกสกุลเงิน'),
    
    businessCategory: z.string(),
    
    taxId: z.string()
        .max(13, 'เลขประจำตัวผู้เสียภาษีต้องไม่เกิน 13 หลัก')
        .regex(/^\d*$/, 'กรอกได้เฉพาะตัวเลข')
        .or(z.literal('')),
        
    branchName: z.string().min(1, 'กรุณากรอกชื่อสาขา'),
    currency: z.string(),
    vatRegistered: z.boolean(),
    whtRegistered: z.boolean(),
    
    addresses: z.array(VendorAddressSchema).min(1, 'ต้องมีที่อยู่อย่างน้อย 1 รายการ'),
    sameAsRegistered: z.boolean(),
    
    // Main Contact
    contactName: z.string(),
    phone: z.string(),
    mobile: z.string(),
    email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').or(z.literal('')),
    website: z.string(),
    
    // Payment
    paymentTerms: z.string(),
    creditLimit: z.number().min(0),
    
    // Lists
    bankAccounts: z.array(VendorBankAccountSchema),
    additionalContacts: z.array(VendorContactPersonSchema),
    
    remarks: z.string(),
    
    // Status
    onHold: z.boolean(),
    blocked: z.boolean(),
    inactive: z.boolean()
});
