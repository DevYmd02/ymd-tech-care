import api, { USE_MOCK } from '@/core/api/api';
import type {
  VendorMaster,
  VendorListItem,
  VendorListResponse,
  VendorResponse,
  VendorDropdownItem,
  VendorStatus,
} from '../types/vendor-types';
import { logger } from '@/shared/utils/logger';
import { 
  MOCK_VENDORS, 
} from '@/modules/master-data/vendor/mocks/vendorMocks';
import type { SuccessResponse } from '@/shared/types/api-response.types';

// Local in-memory store for mocks (persists during session)
let localVendorData: VendorMaster[] = [...MOCK_VENDORS];

// 🔄 Helper function: Format payload to match the new backend JSON specification
function mapVendorToApi(data: any): any {
    const payload: any = {
        vendor_code: data.vendor_code || data.vendorCode || '',
        vendor_name: data.vendor_name || data.vendorNameTh || '',
        vendor_nameeng: data.vendor_nameeng || data.vendor_name_en || data.vendorNameEn || '',
        vat_registration_no: data.vat_registration_no || data.tax_id || data.taxId || '',
        is_vat_registered: Boolean(data.is_vat_registered ?? data.vatRegistered ?? false),
        payment_term_days: (() => {
            if (data.payment_term_days !== undefined && data.payment_term_days !== null && data.payment_term_days !== '') {
                return Number(data.payment_term_days);
            }
            const terms = data.paymentTerms;
            if (terms === 'Cash') return 0;
            if (terms === 'Net 7 Days') return 7;
            if (terms === 'Net 15 Days') return 15;
            if (terms === 'Net 30 Days') return 30;
            if (terms === 'Net 60 Days') return 60;
            const match = String(terms || '').match(/\d+/);
            return match ? Number(match[0]) : 30; 
        })(),
        phone: data.phone || '',
        phone_extension: data.mobile || data.phone_extension || '',
        email: data.email || '',
        website: data.website || '',
        is_subject_to_wht: Boolean(data.is_subject_to_wht ?? data.whtRegistered ?? false),
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,

        vendor_type_id: Number(data.vendor_type_id || data.vendorTypeId) || null,
        vendor_group_id: Number(data.vendor_group_id || data.vendorGroupId) || null,
        currency_id: Number(data.currency_id || data.currencyId) || null,
    };

    // Filter and Map Addresses (กรองเอาเฉพาะอันที่กรอกข้อมูลมาจริงๆ)
    const rawAddresses = data.addresses || [];
    payload.addresses = rawAddresses
        .filter((a: any) => (a.address || '').trim() !== '')
        .map((a: any, i: number) => {
            const addrPayload: any = {
                address: a.address || '',
                sub_district: a.sub_district || a.subDistrict || '',
                province: a.province || '',
                district: a.district || '',
                postal_code: String(a.postal_code || a.postalCode || ''),
                is_default: Boolean(a.is_default ?? a.isMain ?? (i === 0)),
                address_type: a.address_type || a.addressType || (i === 0 ? 'REGISTERED' : 'CONTACT'),
                country: a.country || 'Thailand',
                contact_person: a.contact_person || a.contactPerson || '',
                phone: a.phone || '',
                phone_extension: a.phone_extension || a.phoneExtension || '',
                email: a.email || '',
                is_active: Boolean(a.is_active ?? true)
            };
            return addrPayload;
        });

    // Map Contacts (Handles both API mapped format or Frontend mapped format)
    const contacts = [];
    if (data.contacts && data.contacts.length > 0) {
        contacts.push(...data.contacts.map((c: any) => ({
            contact_name: c.contact_name || c.name || '',
            email: c.email || '',
            phone: c.phone || '',
            mobile: c.mobile || '',
            position: c.position || '',
            is_primary: Boolean(c.is_primary ?? c.isMain ?? false)
        })));
    } else {
        if ((data.contactName || '').trim() !== '') {
            contacts.push({
                contact_name: data.contactName,
                email: data.email || '',
                phone: data.phone || '',
                mobile: data.mobile || '',
                position: '',
                is_primary: true
            });
        }
        if (data.additionalContacts) {
            contacts.push(...data.additionalContacts
                .filter((c: any) => (c.name || '').trim() !== '')
                .map((c: any) => ({
                    contact_name: c.name || '',
                    email: c.email || '',
                    phone: c.phone || '',
                    mobile: c.mobile || '',
                    position: c.position || '',
                    is_primary: Boolean(c.isMain ?? false)
                }))
            );
        }
    }
    payload.contacts = contacts.filter((c: any) => c.contact_name);

    // Map Bank Accounts
    const banks = data.bank_accounts || data.bankAccounts || [];
    payload.bank_accounts = banks
        .filter((b: any) => (b.bank_name || b.bankName || b.account_no || b.accountNumber))
        .map((b: any, i: number) => ({
            bank_name: b.bank_name || b.bankName || '',
            bank_branch: b.bank_branch || b.branchName || '',
            account_no: b.account_no || b.accountNumber || '',
            account_name: b.account_name || b.accountName || '',
            account_type: b.account_type || b.accountType || 'SAVING',
            swift_code: b.swift_code || b.swiftCode || '',
            is_default: Boolean(b.is_default ?? b.isMain ?? (i === 0))
        }));

    return payload;
}

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
      const response = await api.get<VendorListResponse | VendorListItem[]>('/vendors');
      
      // Handle raw array response (Real API) or standard paginated response
      if (Array.isArray(response)) {
        return {
          items: response,
          total: response.length,
          page: 1,
          limit: Math.max(response.length, 100)
        };
      }
      
      return response as VendorListResponse;
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

  getById: async (vendorId: number): Promise<VendorMaster | null> => {
    if (USE_MOCK) {
      const mockVendor = localVendorData.find((v: VendorMaster) => v.vendor_id === vendorId);
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

  create: async (data: any): Promise<VendorResponse> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Creating Vendor', data);
        
        // Simulate Backend ID Generation
        const newId = Math.floor(Math.random() * 100000);
        
        // Map Request to Master (Mock)
        const newVendor: VendorMaster = {
            id: newId,
            vendor_id: newId, 
            vendor_code: data.vendor_code || String(newId),
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
            addresses: data.addresses.map((a: any, i: number) => ({
                vendor_address_id: Math.floor(Math.random() * 10000),
                vendor_id: newId,
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
            
            contacts: data.contacts.map((c: any) => ({
                contact_id: Math.floor(Math.random() * 10000),
                vendor_id: newId,
                contact_name: c.contact_name || '',
                position: c.position,
                phone: c.phone,
                mobile: c.mobile,
                email: c.email,
                is_primary: c.is_primary || false
            })),

            bank_accounts: data.bank_accounts.map((b: any) => ({
                bank_account_id: Math.floor(Math.random() * 10000),
                vendor_id: newId,
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
            phone_extension: data.phone_extension || data.mobile,
            email: data.email,
            website: data.website,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            updated_by: 1, // System Admin ID
            
            is_blocked: false,
            is_on_hold: false,
            payment_term_days: data.payment_term_days,
            credit_limit: data.credit_limit
        };

        localVendorData.unshift(newVendor);
        return { success: true, data: newVendor };
    }

    try {
      // Map to exact payload needed by the new backend structure
      const payload = mapVendorToApi(data); // โหมดสร้างใหม่
      const response = await api.post<any>('/vendors', payload);
      return { success: true, data: response } as any;
    } catch (error: any) {
      logger.error('[VendorService] create error:', error);
      const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'เกิดข้อผิดพลาดในการสร้าง Vendor';
      const finalMsg = Array.isArray(msg) ? msg.join(', ') : msg;
      return { success: false, message: finalMsg };
    }
  },

  update: async (vendorId: number, data: any): Promise<VendorResponse> => {
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
      // Only transform if it's a full update payload, ignore if it's a simple status toggle
      const isFullUpdate = data.vendor_name || data.vendorNameTh || data.vendor_code || data.vendorCode;
      const payload = isFullUpdate ? mapVendorToApi(data) : data; // โหมดแก้ไข
      const response = await api.patch<any>(`/vendors/${vendorId}`, payload);
      return { success: true, data: response } as any;
    } catch (error: any) {
      logger.error('[VendorService] update error:', error);
      const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'เกิดข้อผิดพลาดในการอัปเดต Vendor';
      const finalMsg = Array.isArray(msg) ? msg.join(', ') : msg;
      return { success: false, message: finalMsg };
    }
  },

  delete: async (vendorId: number): Promise<{ success: boolean; message?: string }> => {
    if (USE_MOCK) {
        const initialLength = localVendorData.length;
        // Simulate Dependency Conflict for vendor-001 (Safe Delete Test)
        if (vendorId === 1) {
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

  block: async (vendorId: number, remark?: string): Promise<VendorResponse> => {
    if (USE_MOCK) {
        const index = localVendorData.findIndex(v => v.vendor_id === vendorId);
        if (index !== -1) {
            localVendorData[index].is_blocked = true;
            localVendorData[index].remarks = remark; // simplified
            return { success: true, data: localVendorData[index] };
        }
    }
    try {
      const response = await api.post<any>(`/vendors/${vendorId}/block`, { remark });
      return { success: true, data: response } as any;
    } catch (error) {
      logger.error('[VendorService] block error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการ Block Vendor' };
    }
  },

  unblock: async (vendorId: number): Promise<VendorResponse> => {
    try {
      const response = await api.post<any>(`/vendors/${vendorId}/unblock`);
      return { success: true, data: response } as any;
    } catch (error) {
      logger.error('[VendorService] unblock error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการ Unblock Vendor' };
    }
  },

  setOnHold: async (vendorId: number, onHold: boolean): Promise<VendorResponse> => {
    try {
      const response = await api.post<any>(`/vendors/${vendorId}/hold`, { on_hold: onHold });
      return { success: true, data: response } as any;
    } catch (error) {
      logger.error('[VendorService] setOnHold error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ Hold' };
    }
  },

  updateStatus: async (vendorId: number, status: string): Promise<VendorResponse> => {
    if (USE_MOCK) {
        const index = localVendorData.findIndex(v => v.vendor_id === vendorId);
        if (index !== -1) {
            localVendorData[index].status = status as VendorStatus;
            return { success: true, data: localVendorData[index] };
        }
        return { success: false, message: 'Vendor not found' };
    }
    try {
        const response = await api.patch<any>(`/vendors/${vendorId}/status`, { status });
        return { success: true, data: response } as any;
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
