/**
 * @file vendor-types.ts
 * @description Types สำหรับ Vendor Master Data - รองรับ Backend API
 * @usage import type { VendorMaster, VendorFormData } from '@/modules/master-data/vendor/types/vendor-types';
 */

import type { IBaseMaster } from '@/shared/types/common-master.types';

// ====================================================================================
// ENUMS - Vendor Status Types
// ====================================================================================

/** สถานะของ Vendor */
export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLACKLISTED';

/** ประเภท Vendor */
export type VendorType = 'COMPANY' | 'INDIVIDUAL' | 'GOVERNMENT';

/** ประเภทที่อยู่ */
export type VendorAddressType = 'REGISTERED' | 'CONTACT' | 'BILLING' | 'SHIPPING';

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

/** Address Item for Form Data */
export interface VendorAddressFormItem {
    id: string; // Temp ID for UI key
    address: string;
    subDistrict?: string; // Tambon / Khwaeng (Optional)
    district: string;    // Amphoe / Khet
    province: string;
    postalCode: string;
    country: string;
    isMain: boolean;
    addressType?: VendorAddressType; // Added for UI distinction
    
    // Contact Info within Address (Sync with Backend JSON)
    contactPerson?: string;
    phone?: string;
    phoneExtension?: string;
    email?: string;
}

// ====================================================================================
// MAIN INTERFACES - ตาม Database Schema
// ====================================================================================

/**
 * VendorAddress (Backend Schema)
 */
export interface VendorAddress {
    vendor_address_id: string;
    vendor_id: string;
    address_type: VendorAddressType;
    address: string;
    sub_district?: string | null;
    district?: string | null;
    province?: string | null;
    postal_code?: string | null;
    country: string;
    contact_person?: string | null;
    phone?: string | null;
    phone_extension?: string | null;
    email?: string | null;
    is_default: boolean;
    is_active: boolean;
}

/**
 * VendorContact (Backend Schema)
 */
export interface VendorContact {
    contact_id: string;
    vendor_id: string;
    contact_name: string;
    position?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    is_primary: boolean;
}

/**
 * VendorBankAccount (Backend Schema)
 */
export interface VendorBankAccountData {
    // Renamed to avoid conflict with frontend form type
    bank_account_id: string;
    vendor_id: string;
    bank_name: string;
    bank_branch?: string; // Renamed from branch_name
    account_no: string;   // Renamed from account_number
    account_name: string;
    account_type: 'SAVING' | 'CURRENT';
    swift_code?: string;
    is_default: boolean;  // Renamed from is_primary
}

/**
 * VendorMaster - ข้อมูลหลักของผู้ขาย (ตาม vendor_master table + relations)
 */
export interface VendorMaster {
    vendor_id: string;
    vendor_code: string;
    vendor_name: string;
    vendor_name_en?: string;
    tax_id?: string;
    vendor_type: VendorType;
    status: VendorStatus;
    
    // Numeric IDs matching Backend JSON -> Changed to String for Consistency
    vendor_type_id: string;
    vendor_group_id: string;
    currency_id: string;

    // Relational Data (Matches JSON structure)
    addresses: VendorAddress[];
    vendorAddresses?: VendorAddress[];
    contacts: VendorContact[];
    vendorContacts?: VendorContact[];
    bank_accounts: VendorBankAccountData[];
    vendorBankAccounts?: VendorBankAccountData[];

    // Deprecated flat fields (kept optional)
    address_line1?: string;
    district?: string;
    province?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
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
    updated_by?: string; // Add optional updated_by field
}

/**
 * VendorFormData - สำหรับ Frontend Form (camelCase)
 */
export interface VendorFormData {
    vendorCode: string;
    vendorCodeSearch: string;
    vendorName: string;
    vendorNameTh: string;
    vendorNameEn: string;
    vendorType: VendorType;
    
    // ID strings (from <select>)
    vendorTypeId: string;
    vendorGroupId: string;
    currencyId: string;
    
    businessCategory: string;
    taxId: string;
    branchName: string;
    currency: string;
    vatRegistered: boolean;
    whtRegistered: boolean;
    
    // Address List - Fixed 2 items: [0]=REGISTERED, [1]=CONTACT
    addresses: VendorAddressFormItem[];
    // Checkbox: "Same as Primary" - when true, CONTACT address copies from REGISTERED
    sameAsRegistered: boolean;
    
    // Contact Info
    contactName: string;
    phone: string;
    mobile: string;
    email: string;
    website: string;
    
    // Payment
    paymentTerms: string;
    creditLimit: number;
    
    // Lists
    bankAccounts: VendorBankAccount[];
    additionalContacts: VendorContactPerson[];
    
    remarks: string;
    
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
    vendor_type: VendorType;
    status: VendorStatus;
    
    // Flat Address Display Fields (legacy/mock)
    address_line1?: string;
    sub_district?: string;
    district?: string;
    province?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    email?: string;
    
    // Nested arrays (from backend API)
    addresses?: VendorAddress[];
    vendorAddresses?: VendorAddress[];
    contacts?: VendorContact[];
    vendorContacts?: VendorContact[];
    bank_accounts?: VendorBankAccountData[];
    vendorBankAccounts?: VendorBankAccountData[];
    
    payment_term_days?: number;
    vat_registered?: boolean;
    is_active?: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * VendorDropdownItem - สำหรับ Dropdown/Select
 */
export interface VendorDropdownItem {
    vendor_code: string;
    vendor_name: string;
}

/**
 * VendorSearchItem - สำหรับ SearchModal
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
    status?: VendorStatus;
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
    items: VendorListItem[];
    total: number;
    page: number;
    limit: number;
}

/** Request สำหรับ create/update */
export interface VendorCreateRequest {
    vendor_code?: string;
    vendor_name: string;
    vendor_name_en?: string;
    tax_id?: string;
    vendor_type?: VendorType; // Backend uses vendor_type_id instead
    
    vendor_id?: string;
    
    vendor_type_id: string;
    vendor_group_id: string;
    currency_id: string;
    
    // New Structure Matches JSON Response
    addresses: Partial<VendorAddress>[];
    contacts: Partial<VendorContact>[];
    bank_accounts: Partial<VendorBankAccountData>[];

    // Flat fields (kept for backward compatibility or direct binding)
    phone?: string;
    email?: string;
    website?: string;
    remarks?: string;
    
    payment_term_days?: number;
    credit_limit?: number;
    currency_code?: string;
    vat_registered?: boolean;
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
    // Map Addresses
    const addresses: Partial<VendorAddress>[] = form.addresses.map(addr => ({
        address_type: addr.addressType || 'REGISTERED', 
        address: addr.address || "",
        district: addr.district || "",
        province: addr.province || "",
        postal_code: addr.postalCode || "",
        country: addr.country || "Thailand",
        is_default: addr.isMain,
        is_active: true,
        contact_person: addr.contactPerson || "",
        phone: addr.phone || "",
        phone_extension: addr.phoneExtension || "",
        email: addr.email || (addr.isMain ? form.email : "") || "" 
    }));

    // Map Contacts
    const additionalContacts: Partial<VendorContact>[] = form.additionalContacts.map((c) => ({
        contact_name: c.name,
        position: c.position || "",
        phone: c.phone || "",
        mobile: c.mobile || "",
        email: c.email || "",
        is_primary: false
    }));

    // Map Main Contact (from standalone keys)
    const mainContact: Partial<VendorContact> = {
        contact_name: form.contactName,
        position: 'Main Contact',
        phone: form.phone || "",
        mobile: form.mobile || "",
        email: form.email || "",
        is_primary: true
    };

    // Combine: Only add mainContact if it has a name
    const contacts: Partial<VendorContact>[] = form.contactName 
        ? [mainContact, ...additionalContacts]
        : additionalContacts;

    // Map Bank Accounts
    const bank_accounts: Partial<VendorBankAccountData>[] = form.bankAccounts.map((b, index) => ({
        bank_name: b.bankName,
        bank_branch: b.branchName || "",
        account_no: b.accountNumber,
        account_name: b.accountName,
        account_type: b.accountType as 'SAVING' | 'CURRENT',
        swift_code: b.swiftCode || "",
        is_default: b.isMain || index === 0
    }));

    // Payment Term logic
    let payment_term_days = 30;
    if (form.paymentTerms === 'Net 7 Days') payment_term_days = 7;
    else if (form.paymentTerms === 'Net 15 Days') payment_term_days = 15;
    else if (form.paymentTerms === 'Net 60 Days') payment_term_days = 60;
    else if (form.paymentTerms === 'Cash') payment_term_days = 0;

    return {
        vendor_code: form.vendorCode || undefined,
        vendor_name: form.vendorNameTh,
        vendor_name_en: form.vendorNameEn,
        tax_id: form.taxId || undefined,
        vendor_type_id: form.vendorTypeId,
        vendor_group_id: form.vendorGroupId,
        currency_id: form.currencyId,
        addresses: addresses,
        contacts: contacts,
        bank_accounts: bank_accounts,
        phone: form.phone || undefined,
        email: form.email || undefined,
        payment_term_days,
    };
}

/**
 * Helper function เพื่อเช็คว่าสองที่อยู่เหมือนกันหรือไม่
 */
function areAddressesEqual(addr1: VendorAddressFormItem, addr2: VendorAddressFormItem): boolean {
    return (
        addr1.address === addr2.address &&
        addr1.subDistrict === addr2.subDistrict &&
        addr1.district === addr2.district &&
        addr1.province === addr2.province &&
        addr1.postalCode === addr2.postalCode &&
        addr1.country === addr2.country
    );
}

/**
 * แปลง VendorMaster (API) → VendorFormData (frontend)
 */
export function toVendorFormData(vendor: VendorMaster): VendorFormData {
    // Map Addresses - ensure we have exactly 2 items: [0]=REGISTERED, [1]=CONTACT
    let registeredAddress: VendorAddressFormItem = {
        id: '1',
        address: '',
        subDistrict: '',
        district: '',
        province: '',
        postalCode: '',
        country: 'Thailand',
        isMain: true,
        addressType: 'REGISTERED'
    };
    
    let contactAddress: VendorAddressFormItem = {
        id: '2',
        address: '',
        subDistrict: '',
        district: '',
        province: '',
        postalCode: '',
        country: 'Thailand',
        isMain: false,
        addressType: 'CONTACT'
    };
    
    // Interface for legacy/alias fields that might coming from API variants
    interface VendorMasterLegacy extends VendorMaster {
        contactName?: string;
        contactPerson?: string;
        primaryContact?: string;
        mobile?: string;
        phoneNumber?: string;
    }
    
    // Handle both frontend 'addresses' and backend 'vendorAddresses' field names
    const vendorAny = vendor as VendorMasterLegacy;
    const addressesArray = vendor.addresses || vendorAny.vendorAddresses || [];
    
    if (addressesArray.length > 0) {
        // Find REGISTERED address
        const regAddr = addressesArray.find((a: { address_type?: string }) => a.address_type === 'REGISTERED');
        if (regAddr) {
            registeredAddress = {
                id: regAddr.vendor_address_id?.toString() || '1',
                address: regAddr.address || '',
                subDistrict: '',
                district: regAddr.district || '',
                province: regAddr.province || '',
                postalCode: regAddr.postal_code || '',
                country: regAddr.country || 'Thailand',
                isMain: regAddr.is_default || true,
                addressType: 'REGISTERED',
                contactPerson: regAddr.contact_person || '',
                phone: regAddr.phone || '',
                phoneExtension: regAddr.phone_extension || '',
                email: regAddr.email || ''
            };
        } else if (addressesArray[0]) {
            const firstAddr = addressesArray[0];
            registeredAddress = {
                id: firstAddr.vendor_address_id?.toString() || '1',
                address: firstAddr.address || '',
                subDistrict: '',
                district: firstAddr.district || '',
                province: firstAddr.province || '',
                postalCode: firstAddr.postal_code || '',
                country: firstAddr.country || 'Thailand',
                isMain: true,
                addressType: 'REGISTERED',
                contactPerson: firstAddr.contact_person || '',
                phone: firstAddr.phone || '',
                phoneExtension: firstAddr.phone_extension || '',
                email: firstAddr.email || ''
            };
        }
        
        // Find CONTACT address
        const contAddr = addressesArray.find((a: { address_type?: string }) => a.address_type === 'CONTACT');
        if (contAddr) {
            contactAddress = {
                id: contAddr.vendor_address_id?.toString() || '2',
                address: contAddr.address || '',
                subDistrict: '',
                district: contAddr.district || '',
                province: contAddr.province || '',
                postalCode: contAddr.postal_code || '',
                country: contAddr.country || 'Thailand',
                isMain: false,
                addressType: 'CONTACT',
                contactPerson: contAddr.contact_person || '',
                phone: contAddr.phone || '',
                phoneExtension: contAddr.phone_extension || '',
                email: contAddr.email || ''
            };
        } else if (addressesArray[1]) {
            const secondAddr = addressesArray[1];
            contactAddress = {
                id: secondAddr.vendor_address_id?.toString() || '2',
                address: secondAddr.address || '',
                subDistrict: '',
                district: secondAddr.district || '',
                province: secondAddr.province || '',
                postalCode: secondAddr.postal_code || '',
                country: secondAddr.country || 'Thailand',
                isMain: false,
                addressType: 'CONTACT',
                contactPerson: secondAddr.contact_person || '',
                phone: secondAddr.phone || '',
                phoneExtension: secondAddr.phone_extension || '',
                email: secondAddr.email || ''
            };
        } else {
            contactAddress = {
                ...registeredAddress,
                id: '2',
                isMain: false,
                addressType: 'CONTACT'
            };
        }
    } else if (vendor.address_line1) {
        registeredAddress = {
            id: '1',
            address: vendor.address_line1 || '',
            subDistrict: '',
            district: vendor.district || '',
            province: vendor.province || '',
            postalCode: vendor.postal_code || '',
            country: vendor.country || 'Thailand',
            isMain: true,
            addressType: 'REGISTERED'
        };
        contactAddress = {
            ...registeredAddress,
            id: '2',
            isMain: false,
            addressType: 'CONTACT'
        };
    }
    
    const formAddresses: VendorAddressFormItem[] = [registeredAddress, contactAddress];
    const sameAsRegistered = areAddressesEqual(registeredAddress, contactAddress);

    // Map Contacts
    const contactsArray = vendor.contacts || vendorAny.vendorContacts || [];
    const formContacts: VendorContactPerson[] = (contactsArray.length > 0)
        ? contactsArray.map((c: {
            contact_id?: string | number;
            contact_name: string;
            position?: string;
            phone?: string;
            mobile?: string;
            email?: string;
            is_primary?: boolean;
        }) => ({
            id: c.contact_id?.toString() || Math.random().toString(),
            name: c.contact_name,
            position: c.position || '',
            phone: c.phone || '',
            mobile: c.mobile || '',
            email: c.email || '',
            isMain: c.is_primary || false
        }))
        : [];

    // Map Bank Accounts
    const bankAccountsArray = vendor.bank_accounts || vendorAny.vendorBankAccounts || [];
    const formBankAccounts: VendorBankAccount[] = (bankAccountsArray.length > 0)
        ? bankAccountsArray.map((b: {
            bank_account_id?: string | number;
            bank_name: string;
            bank_branch?: string;
            account_no: string;
            account_name: string;
            account_type: string;
            swift_code?: string;
            is_default: boolean;
        }) => ({
            id: b.bank_account_id?.toString() || Math.random().toString(),
            bankName: b.bank_name,
            branchName: b.bank_branch || '',
            accountNumber: b.account_no,
            accountName: b.account_name,
            accountType: b.account_type,
            swiftCode: b.swift_code || '',
            isMain: b.is_default || false
        }))
        : [];

    return {
        vendorCode: vendor.vendor_code,
        vendorCodeSearch: '',
        vendorName: vendor.vendor_name,
        vendorNameTh: vendor.vendor_name,
        vendorNameEn: vendor.vendor_name_en || '',
        taxId: vendor.tax_id || '',
        vendorType: vendor.vendor_type,
        vendorTypeId: vendor.vendor_type_id?.toString() || '1',
        vendorGroupId: vendor.vendor_group_id?.toString() || '1',
        currencyId: vendor.currency_id?.toString() || '1',
        businessCategory: '',
        branchName: 'สำนักงานใหญ่',
        currency: vendor.currency_code || 'THB',
        vatRegistered: vendor.vat_registered || false,
        whtRegistered: false,
        addresses: formAddresses,
        sameAsRegistered,
        contactName: formContacts.find(c => c.isMain)?.name || vendorAny.contactName || vendorAny.contactPerson || vendorAny.primaryContact || registeredAddress.contactPerson || '',
        phone: vendor.phone || '',
        mobile: vendorAny.mobile || vendorAny.phoneNumber || '',
        email: vendor.email || '',
        website: vendor.website || '',
        paymentTerms: `${vendor.payment_term_days ? 'Net ' + vendor.payment_term_days + ' Days' : 'Net 30 Days'}`,
        creditLimit: vendor.credit_limit || 0,
        bankAccounts: formBankAccounts,
        additionalContacts: formContacts,
        remarks: vendor.remarks || '',
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
    vendorType: 'COMPANY',
    vendorTypeId: '',
    vendorGroupId: '',
    currencyId: '1',
    businessCategory: '',
    taxId: '',
    branchName: '',
    currency: 'THB',
    vatRegistered: true,
    whtRegistered: false,
    addresses: [{
        id: '1',
        address: '',
        subDistrict: '',
        district: '',
        province: '',
        postalCode: '',
        country: '',
        isMain: true,
        addressType: 'REGISTERED',
        contactPerson: '',
        phone: '',
        phoneExtension: '',
        email: ''
    }, {
        id: '2',
        address: '',
        subDistrict: '',
        district: '',
        province: '',
        postalCode: '',
        country: '',
        isMain: false,
        addressType: 'CONTACT',
        contactPerson: '',
        phone: '',
        phoneExtension: '',
        email: ''
    }],
    sameAsRegistered: false,
    contactName: '',
    phone: '',
    mobile: '',
    email: '',
    website: '',
    paymentTerms: '',
    creditLimit: 0,
    bankAccounts: [],
    additionalContacts: [],
    remarks: '',
    onHold: false,
    blocked: false,
    inactive: false,
};

// ====================================================================================
// VENDOR TYPE MASTER - ประเภทเจ้าหนี้
// ====================================================================================

/**
 * VendorTypeMaster - ข้อมูลประเภทเจ้าหนี้
 */
export interface VendorTypeMaster extends IBaseMaster {
    vendor_type_id: string;
    vendor_type_code: string;
    vendor_type_name: string;
    vendor_type_name_en?: string;
}

/**
 * VendorTypeFormData - สำหรับ Frontend Form
 */
export interface VendorTypeFormData {
    typeCode: string;
    typeName: string;
    typeNameEn: string;
    isActive: boolean;
}

// ====================================================================================
// VENDOR GROUP MASTER - กลุ่มเจ้าหนี้
// ====================================================================================

/**
 * VendorGroupMaster - ข้อมูลกลุ่มเจ้าหนี้
 */
export interface VendorGroupMaster extends IBaseMaster {
    vendor_group_id: string;
    vendor_group_code: string;
    vendor_group_name: string;
    vendor_group_name_en?: string;
}

/**
 * VendorGroupFormData - สำหรับ Frontend Form
 */
export interface VendorGroupFormData {
    groupCode: string;
    groupName: string;
    groupNameEn: string;
    isActive: boolean;
}

