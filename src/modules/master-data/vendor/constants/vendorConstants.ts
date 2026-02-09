/**
 * @file vendorConstants.ts
 * @description Centralized constants for Vendor Master Data
 */

export const VENDOR_TYPES = [
    { label: 'ผู้จัดจำหน่าย (Distributor)', value: '1' },
    { label: 'บุคคลธรรมดา (Individual)', value: '2' },
    { label: 'หน่วยงานราชการ (Government)', value: '3' },
];

export const BUSINESS_CATEGORIES = [
    { label: 'อุปกรณ์ไอที', value: '1' },
    { label: 'อุปกรณ์สำนักงาน', value: '2' },
    { label: 'บริการ', value: '3' },
    { label: 'รับเหมาก่อสร้าง', value: '4' },
];

export const CURRENCIES = [
    { label: 'THB - บาท', value: '1' },
    { label: 'USD - ดอลลาร์สหรัฐ', value: '2' },
    { label: 'EUR - ยูโร', value: '3' },
    { label: 'JPY - เยน', value: '4' },
    { label: 'CNY - หยวน', value: '5' },
];

export const ADDRESS_TYPES = [
    { label: 'Shipping (ส่งของ)', value: 'SHIPPING' },
    { label: 'Billing (วางบิล)', value: 'BILLING' },
    { label: 'Warehouse (คลังสินค้า)', value: 'WAREHOUSE' },
    { label: 'Office (สำนักงาน)', value: 'OFFICE' },
    { label: 'Other (อื่นๆ)', value: 'OTHER' },
];

export const PAYMENT_TERMS = [
    { label: 'Cash', value: 'Cash' },
    { label: 'Net 7 Days', value: 'Net 7 Days' },
    { label: 'Net 15 Days', value: 'Net 15 Days' },
    { label: 'Net 30 Days', value: 'Net 30 Days' },
    { label: 'Net 60 Days', value: 'Net 60 Days' },
];

export const BANK_ACCOUNT_TYPES = [
    { label: 'ออมทรัพย์', value: 'SAVING' },
    { label: 'กระแสรายวัน', value: 'CURRENT' },
];
