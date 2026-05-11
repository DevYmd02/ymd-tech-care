/**
 * @file customer-types.ts
 * @description Types for Customer Master Data - Supported for Backend API
 * @usage import type { CustomerMaster, CustomerFormData } from '@/modules/master-data/customer/types/customer-types';
 */

import type { CustomerType } from '@customer/customer-type/types/customer-type.types';

// ====================================================================================
// ENUMS / TYPES
// ====================================================================================

/** สถานะของ Customer */
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

/** ประเภทที่อยู่ */
export type CustomerAddressType = 'REGISTERED' | 'CONTACT' | 'BILLING' | 'SHIPPING';

/** Address Item for Form Data */
export interface CustomerAddressFormItem {
    id: string | number; // Temp ID for UI key
    address: string;
    subDistrict?: string;
    district: string;
    province: string;
    postalCode: string;
    country: string;
    is_default: boolean;
    addressType?: CustomerAddressType;
    contactPerson?: string;
    phone?: string;
    phoneExtension?: string;
    email?: string;
}

/** Additional Contact Interface */
export interface CustomerContactPerson {
    id: string | number;
    name: string;
    position: string;
    phone: string;
    mobile: string;
    email: string;
    is_default: boolean;
}

// ====================================================================================
// MAIN INTERFACES - ตาม Database Schema
// ====================================================================================

/** Customer Address (Backend Schema) */
export interface CustomerAddress {
    customer_address_id: number | string;
    customer_id: number | string;
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
    contact_id: number | string;
    customer_id: number | string;
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
    customer_name_th?: string;
    customer_name_en?: string;
    customer_name?: string;
    customer_nameeng?: string;
    tax_id: string;
    is_vat_registered?: boolean;
    business_type_id: number | string;
    customer_type_id: number | string;
    customer_group_id: number | string;
    billing_group_id?: number | string;
    bill_group_id?: number | string;
    credit_limit?: number | string;
    credit_days?: number;
    credit_term_days?: number;
    payment_method?: string;
    payment_method_default?: string;
    price_level_id?: number;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    contact_name?: string | null;
    status: CustomerStatus;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Relational Data
    addresses?: CustomerAddress[];
    customerAddresses?: CustomerAddress[];
    contacts?: CustomerContact[];
    
    // Relations (optional objects)
    business_type?: CustomerBusinessType;
    customer_type?: CustomerType;
    customer_group?: CustomerGroup;
    billing_group?: CustomerBillingGroup;
    price_level?: { id: number | string; name?: string };
}

/** Customer Form Data (Standard snake_case) */
export interface CustomerFormData {
    customer_code: string;
    customer_name_th: string;
    customer_name_en: string;
    tax_id: string;
    
    business_type_id: number | string;
    customer_type_id: number | string;
    customer_group_id: number | string;
    billing_group_id: number | string;
    
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
    price_level_id: number | string;
    
    additional_contacts: CustomerContactPerson[];
    note: string;
    status: CustomerStatus;
    is_active: boolean;
}

// ====================================================================================
// SETUPS / CONFIGURATIONS (Moved from configurations/ submodule)
// ====================================================================================

/** Customer Business Type (Re-exported from modular types) */
import type { CustomerBusinessType } from '@customer/business-type/types/business-type.types';
export type { CustomerBusinessType };

/** Customer Type (Re-exported from modular types) */
export type { CustomerType };

/** Customer Group (Re-exported from modular types) */
import type { CustomerGroup } from '@customer/customer-group/types/customer-group.types';
export type { CustomerGroup };

/** Customer Billing Group (Re-exported from modular types) */
import type { CustomerBillingGroup } from '@customer/billing-group/types/billing-group.types';
export type { CustomerBillingGroup };

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
        is_default: true,
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
        is_default: false,
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
    payment_method_id: '',
    price_level_id: '',
    additional_contacts: [],
    note: '',
    status: 'ACTIVE',
    is_active: true
};

/**
 * แปลง CustomerMaster (API) → CustomerFormData (frontend)
 */
export const toCustomerFormData = (c: CustomerMaster): CustomerFormData => {
    // Resolve relational arrays
    const targetAddresses = c.customerAddresses || c.addresses;
    
    return {
        customer_code: c.customer_code || '',
        customer_name_th: c.customer_name || c.customer_name_th || '',
        customer_name_en: c.customer_nameeng || c.customer_name_en || '',
        tax_id: c.tax_id || '',
        business_type_id: c.business_type_id != null ? String(c.business_type_id) : (c.business_type?.business_type_id != null ? String(c.business_type.business_type_id) : ''),
        customer_type_id: c.customer_type_id != null ? String(c.customer_type_id) : (c.customer_type?.customer_type_id != null ? String(c.customer_type.customer_type_id) : ''),
        customer_group_id: c.customer_group_id != null ? String(c.customer_group_id) : (c.customer_group?.customer_group_id != null ? String(c.customer_group.customer_group_id) : ''),
        billing_group_id: c.bill_group_id != null ? String(c.bill_group_id) : (c.billing_group_id != null ? String(c.billing_group_id) : (c.billing_group?.bill_group_id != null ? String(c.billing_group.bill_group_id) : '')),
        vat_registered: c.is_vat_registered ?? true,
        addresses: targetAddresses && targetAddresses.length > 0 ? targetAddresses.map((addr) => ({
            id: addr.customer_address_id ? String(addr.customer_address_id) : String(Math.random()),
            address: addr.address || '',
            subDistrict: addr.sub_district || '',
            district: addr.district || '',
            province: addr.province || '',
            postalCode: addr.postal_code || '',
            country: addr.country || 'Thailand',
            is_default: addr.is_default ?? false,
            addressType: addr.address_type || 'REGISTERED',
            contactPerson: addr.contact_person || '',
            phone: addr.phone || '',
            phoneExtension: addr.phone_extension || '',
            email: addr.email || ''
        })) : initialCustomerFormData.addresses,
        same_as_registered: true,
        contact_name: c.contact_name || c.contacts?.[0]?.contact_name || '',
        phone: c.phone || c.contacts?.[0]?.phone || '',
        mobile: c.contacts?.[0]?.mobile || '',
        email: c.email || c.contacts?.[0]?.email || '',
        website: c.website || '',
        credit_limit: Number(c.credit_limit || 0),
        credit_term: c.credit_term_days || c.credit_days || 0,
        payment_method_id: c.payment_method_default || c.payment_method || '',
        price_level_id: c.price_level_id != null ? String(c.price_level_id) : (c.price_level?.id != null ? String(c.price_level.id) : ''),
        additional_contacts: (c.contacts || []).slice(1).map((contact) => ({
            id: contact.contact_id || String(Math.random()),
            name: contact.contact_name || '',
            position: contact.position || '',
            phone: contact.phone || '',
            mobile: contact.mobile || '',
            email: contact.email || '',
            is_default: contact.is_primary ?? false
        })),
        note: '',
        status: c.status || 'ACTIVE',
        is_active: c.is_active ?? true
    };
};
