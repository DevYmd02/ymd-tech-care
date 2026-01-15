/**
 * @file vendor-types.ts
 * @description Types สำหรับ Vendor Master Data - รองรับ Backend API
 * @usage import type { VendorMaster, VendorFormData } from '@/types/vendor-types';
 */

// ====================================================================================
// ENUMS - Vendor Status Types
// ====================================================================================

/** สถานะของ Vendor */
export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'ON_HOLD';

/** ประเภท Vendor */
export type VendorType = 'COMPANY' | 'INDIVIDUAL' | 'GOVERNMENT';

// ====================================================================================
// MAIN INTERFACES - ตาม Database Schema
// ====================================================================================

/**
 * VendorMaster - ข้อมูลหลักของผู้ขาย (ตาม vendor_master table)
 */
export interface VendorMaster {
    vendor_id: string;
    vendor_code: string;
    vendor_name: string;
    vendor_name_en?: string;
    tax_id?: string;
    vendor_type: VendorType;
    status: VendorStatus;
    
    // Address PP.20
    address_line1?: string;
    address_line2?: string;
    sub_district?: string;
    district?: string;
    province?: string;
    postal_code?: string;
    country?: string;
    
    // Contact
    phone?: string;
    phone_ext?: string;
    email?: string;
    website?: string;
    
    // Payment Info
    payment_term_days?: number;
    credit_limit?: number;
    currency_code?: string;
    
    // Flags
    is_blocked: boolean;
    is_on_hold: boolean;
    
    // Audit
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
}

/**
 * VendorFormData - สำหรับ Frontend Form (camelCase)
 */
export interface VendorFormData {
    vendorCode: string;
    vendorCodeSearch: string; // For search input
    vendorName: string;
    vendorNameTh: string; // Thai name (alias for vendorName)
    vendorNameEn: string;
    taxId: string;
    vendorType: VendorType;
    
    // Address PP.20
    addressLine1: string;
    addressLine2: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
    
    // Contact Address (same as PP.20 or different)
    useAddressPP20: boolean;
    contactAddressLine1: string;
    contactAddressLine2: string;
    contactSubDistrict: string;
    contactDistrict: string;
    contactProvince: string;
    contactPostalCode: string;
    
    // Contact Info
    phone: string;
    phoneExt: string;
    email: string;
    
    // Status flags
    onHold: boolean;
    blocked: boolean;
    inactive: boolean;
}

/**
 * VendorListItem - สำหรับแสดงในตาราง (subset ของ VendorMaster)
 */
export interface VendorListItem {
    vendor_id: string;
    vendor_code: string;
    vendor_name: string;
    vendor_name_en?: string;
    tax_id?: string;
    status: VendorStatus;
    phone?: string;
    email?: string;
    created_at: string;
}

/**
 * VendorDropdownItem - สำหรับ Dropdown/Select
 */
export interface VendorDropdownItem {
    vendor_code: string;
    vendor_name: string;
}

// ====================================================================================
// API TYPES - Request/Response
// ====================================================================================

/** Parameters สำหรับ getList */
export interface VendorListParams {
    status?: VendorStatus | 'ALL';
    vendor_type?: VendorType;
    search?: string;
    page?: number;
    limit?: number;
}

/** Response จาก getList */
export interface VendorListResponse {
    data: VendorListItem[];
    total: number;
    page: number;
    limit: number;
}

/** Request สำหรับ create/update */
export interface VendorCreateRequest {
    vendor_name: string;
    vendor_name_en?: string;
    tax_id?: string;
    vendor_type: VendorType;
    address_line1?: string;
    address_line2?: string;
    sub_district?: string;
    district?: string;
    province?: string;
    postal_code?: string;
    phone?: string;
    phone_ext?: string;
    email?: string;
}

/** Response จาก create/update */
export interface VendorResponse {
    success: boolean;
    message?: string;
    data?: VendorMaster;
}

// ====================================================================================
// UTILITY FUNCTIONS - Data Transformation
// ====================================================================================

/**
 * แปลง VendorFormData (frontend) → VendorCreateRequest (API)
 */
export function toVendorCreateRequest(form: VendorFormData): VendorCreateRequest {
    return {
        vendor_name: form.vendorName,
        vendor_name_en: form.vendorNameEn || undefined,
        tax_id: form.taxId || undefined,
        vendor_type: form.vendorType,
        address_line1: form.addressLine1 || undefined,
        address_line2: form.addressLine2 || undefined,
        sub_district: form.subDistrict || undefined,
        district: form.district || undefined,
        province: form.province || undefined,
        postal_code: form.postalCode || undefined,
        phone: form.phone || undefined,
        phone_ext: form.phoneExt || undefined,
        email: form.email || undefined,
    };
}

/**
 * แปลง VendorMaster (API) → VendorFormData (frontend)
 */
export function toVendorFormData(vendor: VendorMaster): VendorFormData {
    return {
        vendorCode: vendor.vendor_code,
        vendorCodeSearch: '',
        vendorName: vendor.vendor_name,
        vendorNameTh: vendor.vendor_name, // Same as vendorName
        vendorNameEn: vendor.vendor_name_en || '',
        taxId: vendor.tax_id || '',
        vendorType: vendor.vendor_type,
        addressLine1: vendor.address_line1 || '',
        addressLine2: vendor.address_line2 || '',
        subDistrict: vendor.sub_district || '',
        district: vendor.district || '',
        province: vendor.province || '',
        postalCode: vendor.postal_code || '',
        useAddressPP20: true,
        contactAddressLine1: vendor.address_line1 || '',
        contactAddressLine2: vendor.address_line2 || '',
        contactSubDistrict: vendor.sub_district || '',
        contactDistrict: vendor.district || '',
        contactProvince: vendor.province || '',
        contactPostalCode: vendor.postal_code || '',
        phone: vendor.phone || '',
        phoneExt: vendor.phone_ext || '',
        email: vendor.email || '',
        onHold: vendor.is_on_hold,
        blocked: vendor.is_blocked,
        inactive: vendor.status === 'INACTIVE',
    };
}

/**
 * Initial form data สำหรับ new vendor
 */
export const initialVendorFormData: VendorFormData = {
    vendorCode: '',
    vendorCodeSearch: '',
    vendorName: '',
    vendorNameTh: '',
    vendorNameEn: '',
    taxId: '',
    vendorType: 'COMPANY',
    addressLine1: '',
    addressLine2: '',
    subDistrict: '',
    district: '',
    province: '',
    postalCode: '',
    useAddressPP20: true,
    contactAddressLine1: '',
    contactAddressLine2: '',
    contactSubDistrict: '',
    contactDistrict: '',
    contactProvince: '',
    contactPostalCode: '',
    phone: '',
    phoneExt: '',
    email: '',
    onHold: false,
    blocked: false,
    inactive: false,
};
