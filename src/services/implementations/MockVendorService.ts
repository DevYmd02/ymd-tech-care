/**
 * @file MockVendorService.ts
 * @description Mock implementation for Vendor Service
 * @refactored Enforce immutable state management with structuredClone
 */

import type { IVendorService } from '../interfaces/IVendorService';
import type {
  VendorMaster,
  VendorListParams,
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

  async getList(params?: VendorListParams): Promise<VendorListResponse> {
    logger.log('[MockVendorService] getList', params);
    await this.delay(300);

    let filteredVendors = this.vendors; // Start with reference, but we will clone at the end

    if (params?.status && params.status !== 'ALL') {
      filteredVendors = filteredVendors.filter(v => v.status === params.status);
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      filteredVendors = filteredVendors.filter(v =>
        v.vendor_name.toLowerCase().includes(search) ||
        v.vendor_code.toLowerCase().includes(search)
      );
    }

    // Return deep copy of the filtered result to prevent mutation of internal state
    return {
      data: structuredClone(filteredVendors),
      total: filteredVendors.length,
      page: params?.page || 1,
      limit: params?.limit || 20,
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
      vendor_type: data.vendor_type,
      address_line1: data.address_line1,
      address_line2: data.address_line2,
      sub_district: data.sub_district,
      district: data.district,
      province: data.province,
      postal_code: data.postal_code,
      phone: data.phone,
      phone_ext: data.phone_ext,
      email: data.email,
      remarks: data.remarks,
      status: 'ACTIVE',
      is_blocked: false,
      is_on_hold: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

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

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
