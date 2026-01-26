/**
 * @file vendor-types.ts
 * @description Types สำหรับ Vendor Master Data - รองรับ Backend API
 * @usage import type { VendorMaster, VendorFormData } from '@/types/vendor-types';
 */

// ====================================================================================
// ENUMS - Vendor Status Types
// ====================================================================================

/** สถานะของ Vendor */
export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLACKLISTED';

/** ประเภท Vendor */
/** ประเภท Vendor */
export type VendorType = 'COMPANY' | 'INDIVIDUAL' | 'GOVERNMENT';

/** Bank Account Interface */
export interface VendorBankAccount {
    id: string;
    bankName: string;
    branchName: string;
    accountNumber: string;
    accountName: string;
    accountType: string;
    swiftCode: string;
    isMain: boolean;
}

/** Additional Contact Interface */
export interface VendorContactPerson {
    id: string;
    name: string;
    position: string;
    phone: string;
    mobile: string;
    email: string;
    isMain: boolean;
}

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
    remarks?: string;
    
    // Payment Info
    payment_term_days?: number;
    credit_limit?: number;
    currency_code?: string;
    vat_registered?: boolean;
    
    // Flags
    is_blocked: boolean;
    is_on_hold: boolean;
    is_active?: boolean;
    
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
    vendorType: VendorType;
    businessCategory: string; // New
    taxId: string;
    branchName: string; // New
    currency: string; // New
    vatRegistered: boolean; // New
    whtRegistered: boolean; // New
    
    // Address PP.20
    addressLine1: string;
    district: string;
    province: string;
    postalCode: string;
    country: string; // New
    
    // Contact Info
    contactName: string; // New
    phone: string;
    mobile: string; // New
    email: string;
    website: string; // New
    
    // Payment
    paymentTerms: string; // New
    creditLimit: number; // New
    
    // Lists
    bankAccounts: VendorBankAccount[]; // New
    additionalContacts: VendorContactPerson[]; // New
    
    remarks: string;
    
    // Status flags
    onHold: boolean;
    blocked: boolean;
    inactive: boolean;

    // Deprecated / Backwards Compat (Keep optional/hidden if needed or remove if unused in new form)
    addressLine2: string;
    subDistrict: string;
    useAddressPP20: boolean;
    contactAddressLine1: string;
    contactAddressLine2: string;
    contactSubDistrict: string;
    contactDistrict: string;
    contactProvince: string;
    contactPostalCode: string;
    phoneExt: string;
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

/**
 * VendorSearchItem - สำหรับ SearchModal (รองรับทั้ง API และ legacy)
 * Extended to include all fields needed for vendor selection
 */
export interface VendorSearchItem {
    vendor_id: string;
    code: string;
    name: string;
    name_en?: string;
    address?: string;
    phone?: string;
    email?: string;
    taxId?: string;
    payment_term_days?: number;
    vat_registered?: boolean;
    is_active?: boolean;
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
    remarks?: string;
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
        remarks: form.remarks || undefined,
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
        businessCategory: '', // API not provided yet
        branchName: 'สำนักงานใหญ่', // API not provided yet
        currency: vendor.currency_code || 'THB',
        vatRegistered: vendor.vat_registered || false,
        whtRegistered: false, // API not provided yet
        
        addressLine1: vendor.address_line1 || '',
        addressLine2: vendor.address_line2 || '',
        subDistrict: vendor.sub_district || '',
        district: vendor.district || '',
        province: vendor.province || '',
        postalCode: vendor.postal_code || '',
        country: vendor.country || 'Thailand',
        
        contactName: '', // API not provided yet
        phone: vendor.phone || '',
        mobile: '', // API not provided yet
        email: vendor.email || '',
        website: vendor.website || '',
        
        paymentTerms: `${vendor.payment_term_days ? 'Net ' + vendor.payment_term_days + ' Days' : 'Net 30 Days'}`,
        creditLimit: vendor.credit_limit || 0,
        
        bankAccounts: [], // API not provided yet
        additionalContacts: [], // API not provided yet
        
        remarks: vendor.remarks || '',
        
        onHold: vendor.is_on_hold,
        blocked: vendor.is_blocked,
        inactive: vendor.status === 'INACTIVE',

        // Deprecated mapping
        useAddressPP20: false,
        contactAddressLine1: vendor.address_line1 || '',
        contactAddressLine2: vendor.address_line2 || '',
        contactSubDistrict: vendor.sub_district || '',
        contactDistrict: vendor.district || '',
        contactProvince: vendor.province || '',
        contactPostalCode: vendor.postal_code || '',
        phoneExt: vendor.phone_ext || '',
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
    vendorType: 'COMPANY',
    businessCategory: '',
    taxId: '',
    branchName: 'สำนักงานใหญ่',
    currency: 'THB',
    vatRegistered: true,
    whtRegistered: false,
    
    addressLine1: '',
    addressLine2: '',
    subDistrict: '',
    district: '',
    province: '',
    postalCode: '',
    country: 'Thailand',
    
    contactName: '',
    phone: '',
    mobile: '',
    email: '',
    website: '',
    
    paymentTerms: 'Net 30 Days',
    creditLimit: 0,
    
    bankAccounts: [],
    additionalContacts: [],
    
    remarks: '',
    
    onHold: false,
    blocked: false,
    inactive: false,

    // Deprecated defaults
    useAddressPP20: false,
    contactAddressLine1: '',
    contactAddressLine2: '',
    contactSubDistrict: '',
    contactDistrict: '',
    contactProvince: '',
    contactPostalCode: '',
    phoneExt: '',
};
