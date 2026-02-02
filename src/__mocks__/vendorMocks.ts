/**
 * @file vendorMocks.ts
 * @description Single Source of Truth (SSOT) for Vendor Master Data
 * 
 * @note All RFQ, QT, and QC modules MUST reference vendors from this file.
 * Do NOT create ad-hoc vendor data in other mock files.
 */

import type { VendorMaster } from '../types/vendor-types';

const IS_DEV = import.meta.env.DEV;

// =============================================================================
// VENDOR MASTER DATA (SSOT)
// =============================================================================

const _mockVendors: VendorMaster[] = [
  {
    vendor_id: 'vendor-001',
    vendor_code: 'V001',
    vendor_name: 'บริษัท ไอทีซัพพลาย จำกัด',
    vendor_name_en: 'IT Supply Co., Ltd.',
    vendor_type: 'COMPANY',
    vendor_type_id: 1,
    vendor_group_id: 1,
    currency_id: 1,
    tax_id: '0105562012345',
    phone: '02-123-4567',
    email: 'sales@itsupply.co.th',
    status: 'ACTIVE',
    is_blocked: false,
    is_on_hold: false,
    is_active: true,
    vat_registered: true,
    payment_term_days: 30,
    credit_limit: 500000,
    currency_code: 'THB',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T10:30:00Z',
    updated_by: 'Admin User',
    addresses: [
      {
        vendor_address_id: 1,
        vendor_id: 1, // Mock ID
        address_type: 'REGISTERED',
        address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
        district: 'คลองเตย',
        province: 'กรุงเทพมหานคร',
        postal_code: '10110',
        country: 'Thailand',
        contact_person: 'คุณสมชาย ใจดี',
        is_default: true,
        is_active: true
      }
    ],
    contacts: [],
    bank_accounts: []
  },
  {
    vendor_id: 'vendor-002',
    vendor_code: 'V002',
    vendor_name: 'บริษัท ออฟฟิศเมท จำกัด',
    vendor_name_en: 'OfficeMate Co., Ltd.',
    vendor_type: 'COMPANY',
    vendor_type_id: 1,
    vendor_group_id: 1,
    currency_id: 1,
    tax_id: '0105562012346',
    phone: '02-234-5678',
    email: 'sales@officemate.co.th',
    status: 'ACTIVE',
    is_blocked: false,
    is_on_hold: false,
    is_active: true,
    vat_registered: true,
    payment_term_days: 45,
    credit_limit: 1000000,
    currency_code: 'THB',
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T14:20:00Z',
    updated_by: 'Purchasing Manager',
    addresses: [
      {
        vendor_address_id: 2,
        vendor_id: 2,
        address_type: 'REGISTERED',
        address: '456 ถนนพระราม 4 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330',
        country: 'Thailand',
        contact_person: 'คุณวิภา รักงาน',
        is_default: true,
        is_active: true
      }
    ],
    contacts: [],
    bank_accounts: []
  },
  {
    vendor_id: 'vendor-003',
    vendor_code: 'V003',
    vendor_name: 'บริษัท เฟอร์นิเจอร์พลัส จำกัด',
    vendor_name_en: 'Furniture Plus Co., Ltd.',
    vendor_type: 'COMPANY',
    vendor_type_id: 1,
    vendor_group_id: 2,
    currency_id: 1,
    tax_id: '0105562012347',
    phone: '02-345-6789',
    email: 'sales@furnitureplus.co.th',
    status: 'ACTIVE',
    is_blocked: false,
    is_on_hold: false,
    is_active: true,
    vat_registered: false,
    payment_term_days: 30,
    credit_limit: 300000,
    currency_code: 'THB',
    created_at: '2026-01-03T00:00:00Z',
    updated_at: '2026-01-03T09:15:00Z',
    updated_by: 'System Admin',
    addresses: [
      {
        vendor_address_id: 3,
        vendor_id: 3,
        address_type: 'REGISTERED',
        address: '789 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900',
        country: 'Thailand',
        is_default: true,
        is_active: true
      }
    ],
    contacts: [],
    bank_accounts: []
  },
  {
    vendor_id: 'vendor-004',
    vendor_code: 'V004',
    vendor_name: 'ห้างหุ้นส่วนจำกัด เครื่องเขียนไทย',
    vendor_name_en: 'Thai Stationery LP.',
    vendor_type: 'COMPANY',
    vendor_type_id: 1,
    vendor_group_id: 3,
    currency_id: 1,
    tax_id: '0105562012348',
    phone: '02-456-7890',
    email: 'contact@thaistationery.co.th',
    status: 'ACTIVE',
    is_blocked: false,
    is_on_hold: false,
    is_active: true,
    vat_registered: true,
    payment_term_days: 15,
    credit_limit: 100000,
    currency_code: 'THB',
    created_at: '2026-01-04T00:00:00Z',
    updated_at: '2026-01-04T16:45:00Z',
    updated_by: 'Accountant',
    addresses: [
      {
        vendor_address_id: 4,
        vendor_id: 4,
        address_type: 'REGISTERED',
        address: '321 ถนนเพชรบุรี แขวงมักกะสัน เขตราชเทวี กรุงเทพฯ 10400',
        country: 'Thailand',
        is_default: true,
        is_active: true
      }
    ],
    contacts: [],
    bank_accounts: []
  },
  {
    vendor_id: 'vendor-005',
    vendor_code: 'V005',
    vendor_name: 'บริษัท สมาร์ทเทค โซลูชั่นส์ จำกัด',
    vendor_name_en: 'SmartTech Solutions Co., Ltd.',
    vendor_type: 'COMPANY',
    vendor_type_id: 1,
    vendor_group_id: 1,
    currency_id: 1,
    tax_id: '0105562098765',
    phone: '02-567-8901',
    email: 'info@smarttech.co.th',
    status: 'ACTIVE',
    is_blocked: false,
    is_on_hold: true,
    is_active: true,
    vat_registered: true,
    payment_term_days: 60,
    credit_limit: 2000000,
    currency_code: 'THB',
    created_at: '2026-01-05T00:00:00Z',
    updated_at: '2026-01-10T11:00:00Z',
    updated_by: 'Admin User',
    addresses: [
      {
        vendor_address_id: 5,
        vendor_id: 5,
        address_type: 'REGISTERED',
        address: '555 ถนนรัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400',
        country: 'Thailand',
        is_default: true,
        is_active: true
      }
    ],
    contacts: [],
    bank_accounts: []
  },
];

/** Mock data สำหรับ Vendor List - เฉพาะ DEV mode */
export const MOCK_VENDORS: VendorMaster[] = IS_DEV ? _mockVendors : [];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** ดึง Vendor ตาม ID */
export const getVendorById = (vendorId: string): VendorMaster | undefined => {
  return MOCK_VENDORS.find(v => v.vendor_id === vendorId);
};

/** ดึง Vendor ตาม Code */
export const getVendorByCode = (vendorCode: string): VendorMaster | undefined => {
  return MOCK_VENDORS.find(v => v.vendor_code === vendorCode);
};

/** ดึง Active Vendors สำหรับ Dropdown */
export const getActiveVendors = (): VendorMaster[] => {
  return MOCK_VENDORS.filter(v => v.status === 'ACTIVE' && !v.is_blocked);
};
