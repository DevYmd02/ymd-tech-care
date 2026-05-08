import { z } from 'zod';

export const customerAddressSchema = z.object({
  id: z.union([z.string(), z.number()]),
  address: z.string().min(1, 'กรุณากรอกที่อยู่'),
  subDistrict: z.string().optional(),
  district: z.string().min(1, 'กรุณากรอกแขวง/ตำบล'),
  province: z.string().min(1, 'กรุณากรอกจังหวัด'),
  postalCode: z.string().min(1, 'กรุณากรอกรหัสไปรษณีย์'),
  country: z.string().default('Thailand'),
  is_default: z.boolean().default(false),
  addressType: z.enum(['REGISTERED', 'CONTACT', 'BILLING', 'SHIPPING']).default('REGISTERED'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  phoneExtension: z.string().optional(),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
});

export const customerContactSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1, 'กรุณากรอกชื่อผู้ติดต่อ'),
  position: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
  is_default: z.boolean().default(false),
});

export const customerSchema = z.object({
  customer_code: z.string().min(1, 'กรุณากรอกรหัสลูกค้า'),
  customer_name_th: z.string().min(1, 'กรุณากรอกชื่อลูกค้า (TH)'),
  customer_name_en: z.string().optional(),
  tax_id: z.string().optional(),
  vat_registered: z.boolean().default(true),
  
  business_type_id: z.union([z.string(), z.number()]).optional(),
  customer_type_id: z.union([z.string(), z.number()]),
  customer_group_id: z.union([z.string(), z.number()]),
  billing_group_id: z.union([z.string(), z.number()]).optional(),
  
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
  website: z.string().url('รูปแบบเว็บไซต์ไม่ถูกต้อง').optional().or(z.literal('')),
  
  credit_limit: z.coerce.number().min(0).default(0),
  credit_term: z.coerce.number().min(0).default(0),
  payment_method_id: z.string().optional(),
  price_level_id: z.union([z.string(), z.number()]).optional(),
  
  addresses: z.array(customerAddressSchema).min(1, 'กรุณาเพิ่มที่ใหญ่อย่างน้อย 1 ที่อยู่'),
  same_as_registered: z.boolean().default(false),
  
  additional_contacts: z.array(customerContactSchema).optional().default([]),
  note: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  is_active: z.boolean().default(true),
});

export type CustomerSchemaType = z.infer<typeof customerSchema>;
