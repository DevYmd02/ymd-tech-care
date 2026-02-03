/**
 * @file IVendorService.ts
 * @description Interface for Vendor Service - defines standard methods for both Mock and Real implementations
 */

import type {
  VendorMaster,
  VendorListResponse,
  VendorCreateRequest,
  VendorResponse,
  VendorDropdownItem,
} from '../../types/vendor-types';

export interface IVendorService {
  getList(): Promise<VendorListResponse>;
  getById(vendorId: string): Promise<VendorMaster | null>;
  getByTaxId(taxId: string): Promise<VendorMaster | null>;
  getDropdown(): Promise<VendorDropdownItem[]>;
  create(data: VendorCreateRequest): Promise<VendorResponse>;
  update(vendorId: string, data: Partial<VendorCreateRequest>): Promise<VendorResponse>;
  delete(vendorId: string): Promise<{ success: boolean; message?: string }>;
  block(vendorId: string, remark?: string): Promise<VendorResponse>;
  unblock(vendorId: string): Promise<VendorResponse>;
  setOnHold(vendorId: string, onHold: boolean): Promise<VendorResponse>;
  search(query: string): Promise<VendorMaster[]>;
}
