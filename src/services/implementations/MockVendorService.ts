/**
 * @file MockVendorService.ts
 * @description Mock implementation for Vendor Service
 * @refactored Enforce immutable state management with structuredClone
 */

import type { IVendorService } from '../interfaces/IVendorService';
import type {
  VendorMaster,
  VendorListResponse,
  VendorCreateRequest,
  VendorResponse,
  VendorDropdownItem,
} from '../../types/vendor-types';
import { MOCK_VENDORS } from '../../__mocks__/vendorMocks';
import { logger } from '../../utils/logger';

export class MockVendorService implements IVendorService {
  private vendors: VendorMaster[];

  constructor() {
    this.vendors = structuredClone(MOCK_VENDORS);
  }

  async getList(): Promise<VendorListResponse> {
    logger.log('[MockVendorService] getList');
    await this.delay(300);

    const filteredVendors = this.vendors; // Start with reference, but we will clone at the end

    // Return deep copy of all results (Simulate returning ALL vendors)
    return {
      data: filteredVendors.map(v => {
          const vClone = structuredClone(v); 
          const primaryAddr = v.addresses?.find(a => a.address_type === 'REGISTERED') || v.addresses?.[0];
          
          if (primaryAddr) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (vClone as any).address_line1 = primaryAddr.address;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (vClone as any).district = primaryAddr.district;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (vClone as any).province = primaryAddr.province;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (vClone as any).postal_code = primaryAddr.postal_code;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (vClone as any).country = primaryAddr.country;
          }
          return vClone;
      }),
      total: filteredVendors.length,
      page: 1,
      limit: filteredVendors.length,
    };
  }

  async getById(vendorId: string): Promise<VendorMaster | null> {
    const vendor = this.vendors.find(v => v.vendor_id === vendorId);
    return vendor ? structuredClone(vendor) : null;
  }

  async getByTaxId(taxId: string): Promise<VendorMaster | null> {
    logger.log('[MockVendorService] getByTaxId', taxId);
    await this.delay(200);
    const vendor = this.vendors.find(v => v.tax_id === taxId);
    return vendor ? structuredClone(vendor) : null;
  }

  async getDropdown(): Promise<VendorDropdownItem[]> {
    // primitive mapping is safe, but technically if keys were objects we'd need deep copy. 
    // Here it creates new objects, so it's safe.
    return this.vendors.map(v => ({
      vendor_code: v.vendor_code,
      vendor_name: v.vendor_name,
    }));
  }

  async create(data: VendorCreateRequest): Promise<VendorResponse> {
    logger.log('[MockVendorService] create', data);
    await this.delay(300);

    const newVendor: VendorMaster = {
      vendor_id: `vendor-${Date.now()}`,
      vendor_code: `V${String(this.vendors.length + 1).padStart(3, '0')}`,
      vendor_name: data.vendor_name,
      vendor_name_en: data.vendor_name_en,
      tax_id: data.tax_id,
      vendor_type: data.vendor_type || 'COMPANY', // Default fallback
      
      // Sync numeric IDs from request
      vendor_type_id: data.vendor_type_id || 1,
      vendor_group_id: data.vendor_group_id || 1,
      currency_id: data.currency_id || 1,

      status: 'ACTIVE',
      is_blocked: false,
      is_on_hold: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      addresses: (data.addresses || []).map((addr, idx) => ({
          vendor_address_id: Date.now() + idx,
          vendor_id: 0,
          address_type: addr.address_type || 'REGISTERED',
          address: addr.address || '',
          // sub_district removed
          district: addr.district || '',
          province: addr.province || '',
          postal_code: addr.postal_code || '',
          country: addr.country || 'Thailand',
          is_default: addr.is_default || false,
          is_active: true,
          
          // Address Contact Details
          contact_person: addr.contact_person || '',
          phone: addr.phone || '',
          phone_extension: addr.phone_extension || '',
          email: addr.email || ''
      })),
      contacts: (data.contacts || []).map((c, idx) => ({
          contact_id: Date.now() + idx + 100,
          vendor_id: 0,
          contact_name: c.contact_name || '',
          position: c.position || '',
          phone: c.phone || '',
          mobile: c.mobile || '',
          email: c.email || '',
          is_primary: c.is_primary || false
      })),
      bank_accounts: (data.bank_accounts || []).map((b, idx) => ({
          bank_account_id: Date.now() + idx + 200,
          vendor_id: 0,
          bank_name: b.bank_name || '',
          bank_branch: b.bank_branch || '', // Renamed
          account_no: b.account_no || '',   // Renamed
          account_name: b.account_name || '',
          account_type: b.account_type || 'SAVING',
          swift_code: b.swift_code || '',
          is_default: b.is_default || false // Renamed
      })),

      phone: data.phone,
      email: data.email,
      remarks: data.remarks,
      
      payment_term_days: data.payment_term_days,
      credit_limit: data.credit_limit,
      currency_code: data.currency_code,
      vat_registered: data.vat_registered,
    };

    // Fix: Map address fields for legacy flat structure display if available
    if (newVendor.addresses && newVendor.addresses.length > 0) {
        const primaryAddr = newVendor.addresses.find(a => a.address_type === 'REGISTERED') || newVendor.addresses[0];
        if (primaryAddr) {
             // These are legacy fields that might be used for display in the grid
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             (newVendor as any).address_line1 = primaryAddr.address;
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             (newVendor as any).district = primaryAddr.district;
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             (newVendor as any).province = primaryAddr.province;
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             (newVendor as any).postal_code = primaryAddr.postal_code;
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             (newVendor as any).country = primaryAddr.country;
        }
    }

    // Push to internal state
    this.vendors.unshift(newVendor);

    // Return a COPY
    return { success: true, message: 'สร้าง Vendor สำเร็จ (Mock)', data: structuredClone(newVendor) };
  }

  async update(vendorId: string, data: Partial<VendorCreateRequest>): Promise<VendorResponse> {
    logger.log('[MockVendorService] update', vendorId, data);
    await this.delay(300);

    const index = this.vendors.findIndex(v => v.vendor_id === vendorId);
    if (index === -1) {
      return { success: false, message: 'ไม่พบ Vendor ที่ต้องการอัปเดต' };
    }

    // Create a new object for immutability within the array
    const updatedVendor = {
      ...this.vendors[index],
      ...data,
      updated_at: new Date().toISOString(),
    } as VendorMaster;

    // Fix: Map address fields for legacy flat structure display if available
    if (updatedVendor.addresses && updatedVendor.addresses.length > 0) {
        const primaryAddr = updatedVendor.addresses.find(a => a.address_type === 'REGISTERED') || updatedVendor.addresses[0];
        if (primaryAddr) {
             // These are legacy fields that might be used for display in the grid
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             (updatedVendor as any).address_line1 = primaryAddr.address;
             // sub_district removed
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             (updatedVendor as any).district = primaryAddr.district;
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             (updatedVendor as any).province = primaryAddr.province;
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             (updatedVendor as any).postal_code = primaryAddr.postal_code;
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             (updatedVendor as any).country = primaryAddr.country;
        }
    }
    
    // Replace in internal state
    this.vendors[index] = updatedVendor;

    return { success: true, message: 'อัปเดต Vendor สำเร็จ (Mock)', data: structuredClone(updatedVendor) };
  }

  async delete(vendorId: string): Promise<{ success: boolean; message?: string }> {
    logger.log('[MockVendorService] delete', vendorId);
    await this.delay(200);

    const initialLength = this.vendors.length;
    this.vendors = this.vendors.filter(v => v.vendor_id !== vendorId);
    
    if (this.vendors.length === initialLength) {
         return { success: false, message: 'ไม่พบ Vendor ที่ต้องการลบ' };
    }

    return { success: true };
  }

  async block(vendorId: string, remark?: string): Promise<VendorResponse> {
    logger.log('[MockVendorService] block', vendorId, remark);
    
    const index = this.vendors.findIndex(v => v.vendor_id === vendorId);
    if (index === -1) return { success: false, message: 'ไม่พบ Vendor' };

    const updatedVendor = {
        ...this.vendors[index],
        status: 'BLACKLISTED' as const,
        is_blocked: true,
        updated_at: new Date().toISOString()
    };
    
    this.vendors[index] = updatedVendor;

    return { success: true, message: 'Block Vendor สำเร็จ (Mock)', data: structuredClone(updatedVendor) };
  }

  async unblock(vendorId: string): Promise<VendorResponse> {
    logger.log('[MockVendorService] unblock', vendorId);
    
    const index = this.vendors.findIndex(v => v.vendor_id === vendorId);
    if (index === -1) return { success: false, message: 'ไม่พบ Vendor' };

    const updatedVendor = {
        ...this.vendors[index],
        status: 'ACTIVE' as const,
        is_blocked: false,
        updated_at: new Date().toISOString()
    };
    
    this.vendors[index] = updatedVendor;

    return { success: true, message: 'Unblock Vendor สำเร็จ (Mock)', data: structuredClone(updatedVendor) };
  }

  async setOnHold(vendorId: string, onHold: boolean): Promise<VendorResponse> {
    logger.log('[MockVendorService] setOnHold', vendorId, onHold);
    
    const index = this.vendors.findIndex(v => v.vendor_id === vendorId);
    if (index === -1) return { success: false, message: 'ไม่พบ Vendor' };

    const updatedVendor = {
        ...this.vendors[index],
        is_on_hold: onHold,
        updated_at: new Date().toISOString()
    };
    
    this.vendors[index] = updatedVendor;

    return { success: true, message: `Set Hold=${onHold} สำเร็จ (Mock)`, data: structuredClone(updatedVendor) };
  }

  async search(query: string): Promise<VendorMaster[]> {
    logger.log('[MockVendorService] search', query);
    await this.delay(200);
    const search = query.toLowerCase();
    const result = this.vendors.filter(v =>
      v.vendor_name.toLowerCase().includes(search) ||
      v.vendor_code.toLowerCase().includes(search) ||
      v.tax_id?.toLowerCase().includes(search)
    );
    return structuredClone(result);
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
