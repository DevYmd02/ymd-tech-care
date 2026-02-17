import api, { USE_MOCK } from '@/core/api/api';
import type {
  VendorMaster,
  VendorListResponse,
  VendorCreateRequest,
  VendorResponse,
  VendorDropdownItem,
  VendorStatus,
} from '../types/vendor-types';
import { logger } from '@/shared/utils/logger';
import { 
  MOCK_VENDORS, 
  getVendorById as mockGetById,
} from '@/modules/master-data/vendor/mocks/vendorMocks';
import type { SuccessResponse } from '@/shared/types/api-response.types';

// Local in-memory store for mocks (persists during session)
let localVendorData: VendorMaster[] = [...MOCK_VENDORS];

// Define Union Type for Legacy and Standard Responses - REMOVED (Trust Interceptor)

export const VendorService = {
  getList: async (): Promise<VendorListResponse> => {
    if (USE_MOCK) {
       logger.info('🎭 [Mock Mode] Serving Vendor List from Local Store');
       return {
         items: localVendorData,
         total: localVendorData.length,
         page: 1,
         limit: 100
       };
    }
    try {
      // Trust Global Interceptor - it unwraps { success, data } -> data
      const response = await api.get<VendorListResponse>('/vendors');
      return response;
    } catch (error) {
      logger.error('[VendorService] getList error:', error);
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
      };
    }
  },

  getById: async (vendorId: string): Promise<VendorMaster | null> => {
    if (USE_MOCK) {
      const mockVendor = localVendorData.find(v => v.vendor_id === vendorId) || mockGetById(vendorId);
      if (mockVendor) {
        logger.info(`🎭 [Mock Mode] Serving Vendor Detail: ${vendorId}`);
        return mockVendor;
      }
      return null;
    }
    try {
      return await api.get<VendorMaster>(`/vendors/${vendorId}`);
    } catch (error) {
      logger.error('[VendorService] getById error:', error);
      return null;
    }
  },

  getByTaxId: async (taxId: string): Promise<VendorMaster | null> => {
    if (USE_MOCK) {
        return localVendorData.find(v => v.tax_id === taxId) || null;
    }
    try {
      return await api.get<VendorMaster>(`/vendors/by-tax-id/${taxId}`);
    } catch (error) {
      logger.error('[VendorService] getByTaxId error:', error);
      return null;
    }
  },

  getDropdown: async (): Promise<VendorDropdownItem[]> => {
    if (USE_MOCK) {
      logger.info('🎭 [Mock Mode] Serving Vendor Dropdown');
      return localVendorData.filter(v => v.status === 'ACTIVE').map((v: VendorMaster) => ({
        vendor_id: v.vendor_id,
        vendor_code: v.vendor_code,
        vendor_name: v.vendor_name
      }));
    }
    try {
      return await api.get<VendorDropdownItem[]>('/vendors/dropdown');
    } catch (error) {
      logger.error('[VendorService] getDropdown error:', error);
      return [];
    }
  },

  create: async (data: VendorCreateRequest): Promise<VendorResponse> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Creating Vendor', data);
        
        // Simulate Backend ID Generation
        const newId = `VEN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(localVendorData.length + 1).padStart(4, '0')}`;
        
        // Map Request to Master (Mock)
        const newVendor: VendorMaster = {
            vendor_id: newId, // Use as ID for mock
            vendor_code: data.vendor_code || newId,
            vendor_name: data.vendor_name,
            vendor_name_en: data.vendor_name_en,
            tax_id: data.tax_id,
            vendor_type: data.vendor_type_id === 2 ? 'INDIVIDUAL' : 'COMPANY', // Simple logic
            status: 'ACTIVE',
            vendor_type_id: data.vendor_type_id,
            vendor_group_id: data.vendor_group_id,
            currency_id: data.currency_id,
            
            // Map Relations
            // Map Relations
            addresses: data.addresses.map((a, i) => ({
                vendor_address_id: String(Math.floor(Math.random() * 10000)),
                vendor_id: '0', // Mock doesn't care
                address_type: a.address_type || (i === 0 ? 'REGISTERED' : 'CONTACT'),
                address: a.address || '',
                district: a.district,
                province: a.province,
                postal_code: a.postal_code,
                country: a.country || 'Thailand',
                contact_person: a.contact_person,
                phone: a.phone,
                phone_extension: a.phone_extension,
                email: a.email,
                is_default: a.is_default || false,
                is_active: true
            })),
            
            contacts: data.contacts.map((c) => ({
                contact_id: String(Math.floor(Math.random() * 10000)),
                vendor_id: '0',
                contact_name: c.contact_name || '',
                position: c.position,
                phone: c.phone,
                mobile: c.mobile,
                email: c.email,
                is_primary: c.is_primary || false
            })),

            bank_accounts: data.bank_accounts.map((b) => ({
                bank_account_id: String(Math.floor(Math.random() * 10000)),
                vendor_id: '0',
                bank_name: b.bank_name || '',
                bank_branch: b.bank_branch,
                account_no: b.account_no || '',
                account_name: b.account_name || '',
                account_type: b.account_type || 'SAVING',
                swift_code: b.swift_code,
                is_default: b.is_default || false
            })),

            // Flat fields
            address_line1: data.addresses[0]?.address,
            phone: data.phone,
            email: data.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            updated_by: 'Admin',
            
            is_blocked: false,
            is_on_hold: false,
            payment_term_days: data.payment_term_days,
            credit_limit: data.credit_limit
        };

        localVendorData.unshift(newVendor);
        return { success: true, data: newVendor };
    }

    try {
      return await api.post<VendorResponse>('/vendors', data);
    } catch (error) {
      logger.error('[VendorService] create error:', error);
      let message = 'เกิดข้อผิดพลาดในการสร้าง Vendor';
      if (error instanceof Error) message = error.message;
      return { success: false, message };
    }
  },

  update: async (vendorId: string, data: Partial<VendorCreateRequest>): Promise<VendorResponse> => {
    if (USE_MOCK) {
        const index = localVendorData.findIndex(v => v.vendor_id === vendorId);
        if (index !== -1) {
            // Merge logic (simplified)
            localVendorData[index] = {
                ...localVendorData[index],
                vendor_name: data.vendor_name || localVendorData[index].vendor_name,
                updated_at: new Date().toISOString(),
                // ... map other fields if needed
            };
            return { success: true, data: localVendorData[index] };
        }
        return { success: false, message: 'Vendor not found' };
    }

    try {
      return await api.put<VendorResponse>(`/vendors/${vendorId}`, data);
    } catch (error) {
      logger.error('[VendorService] update error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการอัปเดต Vendor' };
    }
  },

  delete: async (vendorId: string): Promise<{ success: boolean; message?: string }> => {
    if (USE_MOCK) {
        const initialLength = localVendorData.length;
        // Simulate Dependency Conflict for vendor-001 (Safe Delete Test)
        if (vendorId === 'vendor-001') {
             return { 
                 success: false, 
                 message: 'ไม่สามารถลบผู้ขายรายนี้ได้ เนื่องจากมีการใช้งานอยู่ในเอกสาร PR/PO (Simulation)' 
             };
        }
        localVendorData = localVendorData.filter(v => v.vendor_id !== vendorId);
        if (localVendorData.length < initialLength) {
            return { success: true };
        }
        return { success: false, message: 'Vendor not found' };
    }
    
    try {
      await api.delete<SuccessResponse>(`/vendors/${vendorId}`);
      return { success: true };
    } catch (error) {
      logger.error('[VendorService] delete error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการลบ Vendor' };
    }
  },

  block: async (vendorId: string, remark?: string): Promise<VendorResponse> => {
    if (USE_MOCK) {
        const index = localVendorData.findIndex(v => v.vendor_id === vendorId);
        if (index !== -1) {
            localVendorData[index].is_blocked = true;
            localVendorData[index].remarks = remark; // simplified
            return { success: true, data: localVendorData[index] };
        }
    }
    try {
      return await api.post<VendorResponse>(`/vendors/${vendorId}/block`, { remark });
    } catch (error) {
      logger.error('[VendorService] block error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการ Block Vendor' };
    }
  },

  unblock: async (vendorId: string): Promise<VendorResponse> => {
    try {
      return await api.post<VendorResponse>(`/vendors/${vendorId}/unblock`);
    } catch (error) {
      logger.error('[VendorService] unblock error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการ Unblock Vendor' };
    }
  },

  setOnHold: async (vendorId: string, onHold: boolean): Promise<VendorResponse> => {
    try {
      return await api.post<VendorResponse>(`/vendors/${vendorId}/hold`, { on_hold: onHold });
    } catch (error) {
      logger.error('[VendorService] setOnHold error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ Hold' };
    }
  },

  updateStatus: async (vendorId: string, status: string): Promise<VendorResponse> => {
    if (USE_MOCK) {
        const index = localVendorData.findIndex(v => v.vendor_id === vendorId);
        if (index !== -1) {
            localVendorData[index].status = status as VendorStatus;
            return { success: true, data: localVendorData[index] };
        }
        return { success: false, message: 'Vendor not found' };
    }
    try {
        return await api.patch<VendorResponse>(`/vendors/${vendorId}/status`, { status });
    } catch (error) {
        logger.error('[VendorService] updateStatus error:', error);
        return { success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ' };
    }
  },

  search: async (query: string): Promise<VendorMaster[]> => {
    if (USE_MOCK) {
       const lowerQuery = query.toLowerCase();
       return MOCK_VENDORS.filter((v: VendorMaster) => 
          v.vendor_name.toLowerCase().includes(lowerQuery) || 
          v.vendor_code.toLowerCase().includes(lowerQuery)
       );
    }
    try {
      return await api.get<VendorMaster[]>('/vendors/search', { params: { q: query } });
    } catch (error) {
      logger.error('[VendorService] search error:', error);
      return [];
    }
  }
};
