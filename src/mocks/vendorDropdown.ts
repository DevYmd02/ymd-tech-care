/**
 * @file vendorDropdown.ts
 * @description Mock data for vendor dropdown in PRHeader
 * @purpose Centralized vendor dropdown options for PR form
 */

export interface VendorDropdownItem {
    code: string;
    name: string;
}

export const VENDOR_DROPDOWN_OPTIONS: Record<string, string> = {
    "V001": "บริษัท ไอทีซัพพลาย จำกัด",
    "V002": "บริษัท แอดวานซ์ อินโฟร์ เซอร์วิส จำกัด",
    "V003": "บริษัท ไมโครซอฟท์ (ประเทศไทย) จำกัด",
    "V004": "บริษัท กูเกิล (ประเทศไทย) จำกัด",
    "V005": "บริษัท อะเมซอน เว็บ เซอร์วิสเซส จำกัด"
};
