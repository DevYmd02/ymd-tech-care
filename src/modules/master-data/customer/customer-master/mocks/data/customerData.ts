import type { 
  CustomerMaster, 
  CustomerBusinessType, 
  CustomerGroup, 
  CustomerBillingGroup 
} from "@customer/customer-master/types/customer-types";
import type { CustomerType } from "@customer/customer-type/types/customer-type.types";

/** Business Types Data */
export const MOCK_BUSINESS_TYPES: CustomerBusinessType[] = [
  {
    business_type_id: 1,
    business_type_code: 'MFG',
    business_type_name: 'ธุรกิจการผลิต',
    business_type_nameeng: 'Manufacturing',
    remark: 'ธุรกิจที่เน้นการผลิตสินค้าอุตสาหกรรม',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    business_type_id: 2,
    business_type_code: 'RET',
    business_type_name: 'ธุรกิจค้าปลีก',
    business_type_nameeng: 'Retail',
    remark: 'ธุรกิจเน้นการขายสินค้าปลีกทั่วไป',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    business_type_id: 3,
    business_type_code: 'WHO',
    business_type_name: 'ธุรกิจค้าส่ง',
    business_type_nameeng: 'Wholesale',
    remark: 'ธุรกิจเน้นการขายสินค้าส่ง',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

/** Customer Types Data */
export const MOCK_CUSTOMER_TYPES: CustomerType[] = [
  {
    customer_type_id: '861a7a2a-7e1a-4b9b-9c1a-7e1a4b9b9c1a',
    customer_type_code: 'IND',
    customer_type_name: 'ลูกค้าบุคคลธรรมดา',
    customer_type_nameeng: 'Individual',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    customer_type_id: 'e2a1a7a2-a7e1-4b9b-9c1a-7e1a4b9b9c1b',
    customer_type_code: 'COR',
    customer_type_name: 'ลูกค้านิติบุคคล',
    customer_type_nameeng: 'Corporate',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    customer_type_id: 'f3a1a7a2-f7e1-4b9b-9c1a-7e1a4b9b9c1c',
    customer_type_code: 'GOV',
    customer_type_name: 'ลูกค้าหน่วยงานราชการ',
    customer_type_nameeng: 'Government',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

/** Customer Groups Data */
export const MOCK_CUSTOMER_GROUPS: CustomerGroup[] = [
  {
    customer_group_id: 1,
    customer_group_code: 'RET',
    customer_group_name: 'กลุ่มค้าปลีก',
    customer_group_nameeng: 'Retail Group',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    customer_group_id: 2,
    customer_group_code: 'WHO',
    customer_group_name: 'กลุ่มค้าส่ง',
    customer_group_nameeng: 'Wholesale Group',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

/** Billing Groups Data */
export const MOCK_BILLING_GROUPS: CustomerBillingGroup[] = [
  {
    bill_group_id: 1,
    bill_group_code: 'MON',
    bill_group_name: 'กลุ่มวางบิลรายเดือน',
    bill_group_nameeng: 'Monthly',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    bill_group_id: 2,
    bill_group_code: 'WEK',
    bill_group_name: 'กลุ่มวางบิลรายสัปดาห์',
    bill_group_nameeng: 'Weekly',
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
