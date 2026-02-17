/**
 * @file customer-types.ts
 * @description Types for Customer Master Data - Supported for Backend API
 * @usage import type { CustomerMaster, CustomerFormData } from '@/modules/master-data/customer/types/customer-types';
 */

import type { IBaseMaster } from '@/shared/types/common-master.types';

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
export interface CustomerMaster extends IBaseMaster {
    customer_id: string;
    customer_code: string;
    customer_name_th: string;
    customer_name_en?: string;
    tax_id?: string;
    status: CustomerStatus;
    
    business_type_id: string;
    customer_type_id: string;
    customer_group_id: string;
    billing_group_id: string;
    
    credit_limit: number;
    credit_days: number;
    payment_method: string;

    // Relational Data
    addresses?: CustomerAddress[];
    contacts?: CustomerContact[];
    
    // Relations (optional objects)
    business_type?: CustomerBusinessType;
    customer_type?: CustomerType;
    customer_group?: CustomerGroup;
    billing_group?: CustomerBillingGroup;

    created_at: string;
    updated_at: string;
    updated_by?: string;
}

/** Customer Form Data (Standard snake_case) */
export interface CustomerFormData {
    customer_code: string;
    customer_name_th: string;
    customer_name_en: string;
    tax_id: string;
    
    business_type_id: string;
    customer_type_id: string;
    customer_group_id: string;
    billing_group_id: string;
    
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
export interface CustomerBusinessType extends IBaseMaster {
    business_type_id: string;
    business_type_code: string;
    business_type_name_th: string;
    business_type_name_en?: string;
    note?: string;
    is_active: boolean;
}

/** Customer Type */
export interface CustomerType extends IBaseMaster {
    customer_type_id: string;
    customer_type_code: string;
    customer_type_name_th: string;
    customer_type_name_en?: string;
    note?: string;
    is_active: boolean;
}

/** Customer Group */
export interface CustomerGroup extends IBaseMaster {
    customer_group_id: string;
    customer_group_code: string;
    customer_group_name_th: string;
    customer_group_name_en?: string;
    note?: string;
    is_active: boolean;
}

/** Customer Billing Group */
export interface CustomerBillingGroup extends IBaseMaster {
    billing_group_id: string;
    billing_group_code: string;
    billing_group_name_th: string;
    billing_group_name_en?: string;
    is_active: boolean;
}

// ====================================================================================
// INITIAL DATA & MAPPING
// ====================================================================================

export const initialCustomerFormData: CustomerFormData = {
    customer_code: '',
    customer_name_th: '',
    customer_name_en: '',
    tax_id: '',
    business_type_id: '',
    customer_type_id: '',
    customer_group_id: '',
    billing_group_id: '',
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
export function toCustomerFormData(customer: CustomerMaster): CustomerFormData {
    return {
        customer_code: customer.customer_code,
        customer_name_th: customer.customer_name_th,
        customer_name_en: customer.customer_name_en || '',
        tax_id: customer.tax_id || '',
        business_type_id: customer.business_type_id,
        customer_type_id: customer.customer_type_id,
        customer_group_id: customer.customer_group_id,
        billing_group_id: customer.billing_group_id,
        vat_registered: true, // Assume true or map from field if exists
        addresses: (customer.addresses || []).map((addr) => ({
            id: addr.customer_address_id,
            address: addr.address,
            subDistrict: addr.sub_district || '',
            district: addr.district || '',
            province: addr.province || '',
            postalCode: addr.postal_code || '',
            country: addr.country,
            isMain: addr.is_default,
            addressType: addr.address_type,
            contactPerson: addr.contact_person || '',
            phone: addr.phone || '',
            phoneExtension: addr.phone_extension || '',
            email: addr.email || ''
        })),
        same_as_registered: false,
        contact_name: customer.contacts?.[0]?.contact_name || '',
        phone: customer.contacts?.[0]?.phone || '',
        mobile: customer.contacts?.[0]?.mobile || '',
        email: customer.contacts?.[0]?.email || '',
        website: '',
        credit_limit: customer.credit_limit,
        credit_term: customer.credit_days, // Map credit_days to credit_term
        payment_method_id: customer.payment_method,
        currency_id: 'THB',
        additional_contacts: (customer.contacts || []).slice(1).map(c => ({
            id: c.contact_id,
            name: c.contact_name,
            position: c.position || '',
            phone: c.phone || '',
            mobile: c.mobile || '',
            email: c.email || '',
            isMain: false
        })),
        note: '',
        status: customer.status
    };
}
