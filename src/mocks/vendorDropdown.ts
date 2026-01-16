/**
 * @file vendorDropdown.ts
 * @description Mock data for vendor dropdown in PRHeader
 * @purpose Centralized vendor dropdown options for PR form
 * @note ใช้ VendorDropdownItem จาก vendor-types.ts เป็น single source of truth
 */

import type { VendorDropdownItem } from '../types/vendor-types';

// ====================================================================================
// VENDOR DROPDOWN OPTIONS
// ====================================================================================

export const VENDOR_DROPDOWN_OPTIONS: VendorDropdownItem[] = [
    { vendor_code: "V001", vendor_name: "บริษัท ไอทีซัพพลาย จำกัด" },
    { vendor_code: "V002", vendor_name: "บริษัท แอดวานซ์ อินโฟร์ เซอร์วิส จำกัด" },
    { vendor_code: "V003", vendor_name: "บริษัท ไมโครซอฟท์ (ประเทศไทย) จำกัด" },
    { vendor_code: "V004", vendor_name: "บริษัท กูเกิล (ประเทศไทย) จำกัด" },
    { vendor_code: "V005", vendor_name: "บริษัท อะเมซอน เว็บ เซอร์วิสเซส จำกัด" },
];

// ====================================================================================
// LEGACY EXPORTS - For backward compatibility
// ====================================================================================

/** 
 * @deprecated ใช้ VENDOR_DROPDOWN_OPTIONS แทน
 * Record format สำหรับ backward compatibility 
 */
export const VENDOR_DROPDOWN_RECORD: Record<string, string> = Object.fromEntries(
    VENDOR_DROPDOWN_OPTIONS.map(v => [v.vendor_code, v.vendor_name])
);
