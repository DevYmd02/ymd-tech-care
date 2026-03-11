/**
 * @file customer-types.ts
 * @description Types for Customer Master Data - Supported for Backend API
 * @usage import type { CustomerMaster, CustomerFormData } from '@/modules/master-data/customer/types/customer-types';
 */


// ====================================================================================
// ENUMS / TYPES
// ====================================================================================

/** สถานะของ Customer */
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

/** ประเภทที่อยู่ */
export type CustomerAddressType = 'REGISTERED' | 'CONTACT' | 'BILLING' | 'SHIPPING';

/** Address Item for Form Data */
export interface CustomerAddressFormItem {
    id: string; // Temp ID for UI key
    address: string;
    subDistrict?: string;
    district: string;
    province: string;
    postalCode: string;
    country: string;
    isMain: boolean;
    addressType?: CustomerAddressType;
    contactPerson?: string;
    phone?: string;
    phoneExtension?: string;
    email?: string;
}

/** Additional Contact Interface */
export interface CustomerContactPerson {
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

/** Customer Address (Backend Schema) */
export interface CustomerAddress {
    customer_address_id: string;
    customer_id: string;
    address_type: CustomerAddressType;
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

/** Customer Contact (Backend Schema) */
export interface CustomerContact {
    contact_id: string;
    customer_id: string;
    contact_name: string;
    position?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    is_primary: boolean;
}

/** Customer Master Data */
export interface CustomerMaster {
    id: number;
    code: string;
    name_th: string;
    name_en: string;
    customer_id: number;
    customer_code: string;
    customer_name_th: string;
    customer_name_en: string;
    tax_id: string;
    business_type_id: number;
    customer_type_id: number;
    customer_group_id: number;
    billing_group_id: number;
    credit_limit?: number;
    credit_days?: number;
    payment_method?: string;
    status: CustomerStatus;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Relational Data
    addresses?: CustomerAddress[];
    contacts?: CustomerContact[];
    
    // Relations (optional objects)
    business_type?: CustomerBusinessType;
    customer_type?: CustomerType;
    customer_group?: CustomerGroup;
    billing_group?: CustomerBillingGroup;
}

/** Customer Form Data (Standard snake_case) */
export interface CustomerFormData {
    customer_code: string;
    customer_name_th: string;
    customer_name_en: string;
    tax_id: string;
    
    business_type_id: number;
    customer_type_id: number;
    customer_group_id: number;
    billing_group_id: number;
    
    vat_registered: boolean;
    
    addresses: CustomerAddressFormItem[];
    same_as_registered: boolean;
    
    contact_name: string;
    phone: string;
    mobile: string;
    email: string;
    website?: string;
    
    credit_limit: number;
    credit_term: number;
    payment_method_id: string;
    currency_id: string;
    
    additional_contacts: CustomerContactPerson[];
    note: string;
    status: CustomerStatus;
}

// ====================================================================================
// SETUPS / CONFIGURATIONS (Moved from configurations/ submodule)
// ====================================================================================

/** Customer Business Type */
export interface CustomerBusinessType {
    id: number;
    code: string;
    name_th: string;
    name_en: string;
    business_type_id: number;
    business_type_code: string;
    business_type_name_th: string;
    business_type_name_en: string;
    note?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** Customer Type */
export interface CustomerType {
    id: number;
    code: string;
    name_th: string;
    name_en: string;
    customer_type_id: number;
    customer_type_code: string;
    customer_type_name_th: string;
    customer_type_name_en: string;
    note?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** Customer Group */
export interface CustomerGroup {
    id: number;
    code: string;
    name_th: string;
    name_en: string;
    customer_group_id: number;
    customer_group_code: string;
    customer_group_name_th: string;
    customer_group_name_en: string;
    note?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/** Customer Billing Group */
export interface CustomerBillingGroup {
    id: number;
    code: string;
    name_th: string;
    name_en: string;
    billing_group_id: number;
    billing_group_code: string;
    billing_group_name_th: string;
    billing_group_name_en: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ====================================================================================
// INITIAL DATA & MAPPING
// ====================================================================================

export const initialCustomerFormData: CustomerFormData = {
    customer_code: '',
    customer_name_th: '',
    customer_name_en: '',
    tax_id: '',
    business_type_id: 0,
    customer_type_id: 0,
    customer_group_id: 0,
    billing_group_id: 0,
    vat_registered: true,
    addresses: [{
        id: '1',
        address: '',
        subDistrict: '',
        district: '',
        province: '',
        postalCode: '',
        country: 'Thailand',
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
        country: 'Thailand',
        isMain: false,
        addressType: 'CONTACT',
        contactPerson: '',
        phone: '',
        phoneExtension: '',
        email: ''
    }],
    same_as_registered: false,
    contact_name: '',
    phone: '',
    mobile: '',
    email: '',
    website: '',
    credit_limit: 0,
    credit_term: 30,
    payment_method_id: 'TRANSFER',
    currency_id: 'THB',
    additional_contacts: [],
    note: '',
    status: 'ACTIVE'
};

/**
 * แปลง CustomerMaster (API) → CustomerFormData (frontend)
 */
export const toCustomerFormData = (c: CustomerMaster): CustomerFormData => {
    return {
        customer_code: c.customer_code || '',
        customer_name_th: c.customer_name_th || '',
        customer_name_en: c.customer_name_en || '',
        tax_id: c.tax_id || '',
        business_type_id: c.business_type_id || 0,
        customer_type_id: c.customer_type_id || 0,
        customer_group_id: c.customer_group_id || 0,
        billing_group_id: c.billing_group_id || 0,
        vat_registered: true,
        addresses: (c.addresses || []).map((addr) => ({
            id: addr.customer_address_id ? String(addr.customer_address_id) : '1',
            address: addr.address || '',
            subDistrict: addr.sub_district || '',
            district: addr.district || '',
            province: addr.province || '',
            postalCode: addr.postal_code || '',
            country: addr.country || 'Thailand',
            isMain: addr.is_default ?? false,
            addressType: addr.address_type || 'REGISTERED',
            contactPerson: addr.contact_person || '',
            phone: addr.phone || '',
            phoneExtension: addr.phone_extension || '',
            email: addr.email || ''
        })),
        same_as_registered: true,
        contact_name: c.contacts?.[0]?.contact_name || '',
        phone: c.contacts?.[0]?.phone || '',
        mobile: c.contacts?.[0]?.mobile || '',
        email: c.contacts?.[0]?.email || '',
        website: '',
        credit_limit: c.credit_limit || 0,
        credit_term: c.credit_days || 0,
        payment_method_id: c.payment_method || '',
        currency_id: 'THB',
        additional_contacts: (c.contacts || []).slice(1).map((contact) => ({
            id: contact.contact_id || String(Math.random()),
            name: contact.contact_name || '',
            position: contact.position || '',
            phone: contact.phone || '',
            mobile: contact.mobile || '',
            email: contact.email || '',
            isMain: contact.is_primary ?? false
        })),
        note: '',
        status: c.status || 'ACTIVE'
    };
};
