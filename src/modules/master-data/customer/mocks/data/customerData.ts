import type { 
  CustomerMaster, 
  CustomerBusinessType, 
  CustomerType, 
  CustomerGroup, 
  CustomerBillingGroup 
} from "@/modules/master-data/customer/types/customer-types";

/** Business Types Data */
export const MOCK_BUSINESS_TYPES: CustomerBusinessType[] = [
  {
    id: 1,
    code: 'MFG',
    name_th: 'ธุรกิจการผลิต',
    name_en: 'Manufacturing',
    business_type_id: 1,
    business_type_code: 'MFG',
    business_type_name_th: 'ธุรกิจการผลิต',
    business_type_name_en: 'Manufacturing',
    note: 'ธุรกิจที่เน้นการผลิตสินค้าอุตสาหกรรม',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    code: 'RET',
    name_th: 'ธุรกิจค้าปลีก',
    name_en: 'Retail',
    business_type_id: 2,
    business_type_code: 'RET',
    business_type_name_th: 'ธุรกิจค้าปลีก',
    business_type_name_en: 'Retail',
    note: 'ธุรกิจเน้นการขายสินค้าปลีกทั่วไป',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    code: 'WHO',
    name_th: 'ธุรกิจค้าส่ง',
    name_en: 'Wholesale',
    business_type_id: 3,
    business_type_code: 'WHO',
    business_type_name_th: 'ธุรกิจค้าส่ง',
    business_type_name_en: 'Wholesale',
    note: 'ธุรกิจเน้นการขายสินค้าส่ง',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

/** Customer Types Data */
export const MOCK_CUSTOMER_TYPES: CustomerType[] = [
  {
    id: 1,
    code: 'IND',
    name_th: 'ลูกค้าบุคคลธรรมดา',
    name_en: 'Individual',
    customer_type_id: 1,
    customer_type_code: 'IND',
    customer_type_name_th: 'ลูกค้าบุคคลธรรมดา',
    customer_type_name_en: 'Individual',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    code: 'COR',
    name_th: 'ลูกค้านิติบุคคล',
    name_en: 'Corporate',
    customer_type_id: 2,
    customer_type_code: 'COR',
    customer_type_name_th: 'ลูกค้านิติบุคคล',
    customer_type_name_en: 'Corporate',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    code: 'GOV',
    name_th: 'ลูกค้าหน่วยงานราชการ',
    name_en: 'Government',
    customer_type_id: 3,
    customer_type_code: 'GOV',
    customer_type_name_th: 'ลูกค้าหน่วยงานราชการ',
    customer_type_name_en: 'Government',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

/** Customer Groups Data */
export const MOCK_CUSTOMER_GROUPS: CustomerGroup[] = [
  {
    id: 1,
    code: 'RET',
    name_th: 'กลุ่มค้าปลีก',
    name_en: 'Retail Group',
    customer_group_id: 1,
    customer_group_code: 'RET',
    customer_group_name_th: 'กลุ่มค้าปลีก',
    customer_group_name_en: 'Retail Group',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    code: 'WHO',
    name_th: 'กลุ่มค้าส่ง',
    name_en: 'Wholesale Group',
    customer_group_id: 2,
    customer_group_code: 'WHO',
    customer_group_name_th: 'กลุ่มค้าส่ง',
    customer_group_name_en: 'Wholesale Group',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

/** Billing Groups Data */
export const MOCK_BILLING_GROUPS: CustomerBillingGroup[] = [
  {
    id: 1,
    code: 'MON',
    name_th: 'กลุ่มวางบิลรายเดือน',
    name_en: 'Monthly',
    billing_group_id: 1,
    billing_group_code: 'MON',
    billing_group_name_th: 'กลุ่มวางบิลรายเดือน',
    billing_group_name_en: 'Monthly',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    code: 'WEK',
    name_th: 'กลุ่มวางบิลรายสัปดาห์',
    name_en: 'Weekly',
    billing_group_id: 2,
    billing_group_code: 'WEK',
    billing_group_name_th: 'กลุ่มวางบิลรายสัปดาห์',
    billing_group_name_en: 'Weekly',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

/** Customers Data */
export const MOCK_CUSTOMERS: CustomerMaster[] = [
  {
    id: 1,
    code: 'CUS-001',
    name_th: 'บริษัท สยามคอมเมิร์ซ จำกัด',
    name_en: 'Siam Commerce Co., Ltd.',
    customer_id: 1,
    customer_code: 'CUS-001',
    customer_name_th: 'บริษัท สยามคอมเมิร์ซ จำกัด',
    customer_name_en: 'Siam Commerce Co., Ltd.',
    tax_id: '0105558111111',
    business_type_id: 1,
    customer_type_id: 2,
    customer_group_id: 1,
    billing_group_id: 1,
    credit_limit: 500000.00,
    credit_days: 30,
    payment_method: 'โอนเงิน',
    status: 'ACTIVE',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    code: 'CUS-002',
    name_th: 'ห้างหุ้นส่วนจำกัด เจริญพาณิชย์',
    name_en: 'Charoen Panich Ltd., Part.',
    customer_id: 2,
    customer_code: 'CUS-002',
    customer_name_th: 'ห้างหุ้นส่วนจำกัด เจริญพาณิชย์',
    customer_name_en: 'Charoen Panich Ltd., Part.',
    tax_id: '0125558222222',
    business_type_id: 2,
    customer_type_id: 2,
    customer_group_id: 2,
    billing_group_id: 2,
    credit_limit: 300000.00,
    credit_days: 45,
    payment_method: 'เช็ค',
    status: 'ACTIVE',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
