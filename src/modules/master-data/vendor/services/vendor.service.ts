import api, { USE_MOCK } from '@/core/api/api';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import type {
  VendorMaster,
  VendorListItem,
  VendorListResponse,
  VendorResponse,
  VendorDropdownItem,
  VendorFormData,
  VendorCreateRequest,
  VendorType,
  VendorAddressType,
  VendorContact,
  VendorAddressFormItem,
} from '../types/vendor-types';
import { logger } from '@/shared/utils';
import { 
  MOCK_VENDORS, 
} from '@/modules/master-data/vendor/mocks/vendorMocks';
import type { SuccessResponse } from '@/shared/types/api.types';

// Local in-memory store for mocks (persists during session)
let localVendorData: VendorMaster[] = [...MOCK_VENDORS];

// 🔄 Helper function: Format payload to match the new backend JSON specification
function mapVendorToApi(data: VendorFormData, isUpdate: boolean = false): VendorCreateRequest {
    // Helper to identify real DB IDs vs temp UI IDs (Date.now() or Math.random())
    const isRealId = (id: unknown): id is number => 
        typeof id === 'number' && id > 0 && id < 1000000000;

    const payload: VendorCreateRequest = {
        vendor_code: data.vendorCode || '',
        vendor_name: data.vendorNameTh || '',
        vendor_nameeng: data.vendorNameEn || '',
        vat_registration_no: data.taxId || '',
        is_vat_registered: Boolean(data.vatRegistered ?? false),
        payment_term_days: Number(data.paymentTerms || 0),
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',

        vendor_type_id: Number(data.vendorTypeId) || 0,
        vendor_group_id: Number(data.vendorGroupId) || 0,
        currency_id: Number(data.currencyId) || 0,
        addresses: [],
        contacts: [],
        bank_accounts: []
    };

    // Filter and Map Addresses
    const rawAddresses = (data.addresses || []) as VendorAddressFormItem[];
    payload.addresses = rawAddresses
        .filter((a) => (a.address || '').trim() !== '')
        .map((a, i: number) => ({
            // For POST (Create), we MUST NOT send IDs. For PATCH (Update), we only send "real" IDs.
            vendor_address_id: isUpdate && isRealId(a.id) ? a.id : undefined,
            address: a.address || '',
            sub_district: a.subDistrict || '',
            province: a.province || '',
            district: a.district || '',
            postal_code: String(a.postalCode || ''),
            is_default: Boolean(a.isMain ?? (i === 0)),
            address_type: (a.addressType || (i === 0 ? 'REGISTERED' : 'CONTACT')) as VendorAddressType,
            country: a.country || 'Thailand',
            contact_person: a.contactPerson || '',
            phone: a.phone || '',
            phone_extension: a.phoneExtension || '',
            email: a.email || '',
            is_active: true
        }));

    // Map Contacts
    const contacts: Partial<VendorContact>[] = [];
    if (data.additionalContacts && data.additionalContacts.length > 0) {
        contacts.push(...data.additionalContacts.map((c) => ({
            contact_id: isUpdate && isRealId(c.id) ? c.id : undefined,
            contact_name: c.name || '',
            position: c.position || '',
            phone: c.phone || '',
            mobile: c.mobile || '',
            email: c.email || '',
            is_primary: c.isMain || false
        })));
    }
    
    if ((String(data.contactName) || '').trim() !== '') {
        contacts.push({
            contact_id: undefined, 
            contact_name: data.contactName,
            email: data.email || '',
            phone: data.phone || '',
            mobile: data.mobile || '',
            position: 'Main Contact',
            is_primary: true
        });
    }
    
    payload.contacts = contacts.filter((c) => c.contact_name);

    // Map Bank Accounts
    const banks = data.bankAccounts || [];
    payload.bank_accounts = banks
        .filter((b) => (b.bankName || b.accountNumber))
        .map((b, i: number) => ({
            bank_account_id: isUpdate && isRealId(b.id) ? b.id : undefined,
            bank_name: b.bankName || '',
            bank_branch: b.branchName || '',
            account_no: b.accountNumber || '',
            account_name: b.accountName || '',
            account_type: (b.accountType || 'SAVING') as 'SAVING' | 'CURRENT',
            swift_code: b.swiftCode || '',
            is_default: Boolean(b.isMain ?? (i === 0))
        }));

    return payload;
}

export const VendorService = {
  getList: async (config?: AxiosRequestConfig): Promise<VendorListResponse> => {
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
      const response = await api.get<VendorListResponse | VendorListItem[]>('/vendors', config);
      
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

  getById: async (vendorId: number, config?: AxiosRequestConfig): Promise<VendorMaster | null> => {
    if (USE_MOCK) {
      const mockVendor = localVendorData.find((v: VendorMaster) => v.vendor_id === vendorId);
      if (mockVendor) {
        logger.info(`🎭 [Mock Mode] Serving Vendor Detail: ${vendorId}`);
        return mockVendor;
      }
      return null;
    }
    try {
      return await api.get<VendorMaster>(`/vendors/${vendorId}`, config);
    } catch (error) {
      logger.error('[VendorService] getById error:', error);
      return null;
    }
  },

  getDropdown: async (config?: AxiosRequestConfig): Promise<VendorDropdownItem[]> => {
    if (USE_MOCK) {
      logger.info('🎭 [Mock Mode] Serving Vendor Dropdown');
      return localVendorData.filter(v => v.status === 'ACTIVE').map((v: VendorMaster) => ({
        vendor_id: v.vendor_id,
        vendor_code: v.vendor_code,
        vendor_name: v.vendor_name
      }));
    }
    try {
      return await api.get<VendorDropdownItem[]>('/vendors/dropdown', config);
    } catch (error) {
      logger.error('[VendorService] getDropdown error:', error);
      return [];
    }
  },

  create: async (data: VendorFormData, config?: AxiosRequestConfig): Promise<VendorResponse> => {
    if (USE_MOCK) {
        logger.info('🎭 [Mock Mode] Creating Vendor', data);
        const newId = Math.floor(Math.random() * 100000);
        const newVendor: VendorMaster = {
            id: newId,
            vendor_id: newId, 
            vendor_code: data.vendorCode || String(newId),
            vendor_name: data.vendorNameTh,
            vendor_name_en: data.vendorNameEn,
            tax_id: data.taxId,
            vendor_type: (data.vendorTypeId === 2 ? 'INDIVIDUAL' : 'COMPANY') as VendorType,
            status: 'ACTIVE',
            vendor_type_id: data.vendorTypeId,
            vendor_group_id: data.vendorGroupId,
            currency_id: data.currencyId,
            addresses: [], // simplified for mock
            contacts: [],
            bank_accounts: [],
            is_active: true,
            is_blocked: false,
            is_on_hold: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        localVendorData.unshift(newVendor);
        return { success: true, data: newVendor };
    }

    try {
      const payload = mapVendorToApi(data);
      const response = await api.post<VendorMaster>('/vendors', payload, config);
      return { success: true, data: response };
    } catch (error: unknown) {
      logger.error('[VendorService] create error:', error);
      const axiosError = error as AxiosError<{ message?: string | string[]; error?: string }>;
      const msg = axiosError?.response?.data?.message || axiosError?.response?.data?.error || axiosError?.message || 'เกิดข้อผิดพลาดในการสร้าง Vendor';
      const finalMsg = Array.from(new Set(Array.isArray(msg) ? msg : [msg])).join(', ');
      return { success: false, message: finalMsg };
    }
  },

  update: async (vendorId: number, data: Partial<VendorFormData>, config?: AxiosRequestConfig): Promise<VendorResponse> => {
    if (USE_MOCK) {
        const index = localVendorData.findIndex(v => v.vendor_id === vendorId);
        if (index !== -1) {
            localVendorData[index] = {
                ...localVendorData[index],
                vendor_name: data.vendorNameTh || localVendorData[index].vendor_name,
                updated_at: new Date().toISOString(),
            };
            return { success: true, data: localVendorData[index] };
        }
        return { success: false, message: 'Vendor not found' };
    }

    try {
      const isFullUpdate = data.vendorNameTh || data.vendorCode;
      const payload = isFullUpdate ? mapVendorToApi(data as VendorFormData, true) : data;
      const response = await api.patch<VendorMaster>(`/vendors/${vendorId}`, payload, config);
      return { success: true, data: response };
    } catch (error: unknown) {
      logger.error('[VendorService] update error:', error);
      const axiosError = error as AxiosError<{ message?: string | string[]; error?: string }>;
      const msg = axiosError?.response?.data?.message || axiosError?.response?.data?.error || axiosError?.message || 'เกิดข้อผิดพลาดในการอัปเดต Vendor';
      const finalMsg = Array.from(new Set(Array.isArray(msg) ? msg : [msg])).join(', ');
      return { success: false, message: finalMsg };
    }
  },

  delete: async (vendorId: number, config?: AxiosRequestConfig): Promise<{ success: boolean; message?: string }> => {
    if (USE_MOCK) {
        const initialLength = localVendorData.length;
        if (vendorId === 1) {
             return { 
                 success: false, 
                 message: 'ไม่สามารถลบผู้ขายรายนี้ได้ เนื่องจากมีการใช้งานอยู่ในเอกสาร PR/PO (Simulation)' 
             };
        }
        localVendorData = localVendorData.filter(v => v.vendor_id !== vendorId);
        return { success: localVendorData.length < initialLength };
    }
    
    try {
      await api.delete<SuccessResponse>(`/vendors/${vendorId}`, config);
      return { success: true };
    } catch (error) {
      logger.error('[VendorService] delete error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการลบ Vendor' };
    }
  },

  block: async (vendorId: number, remark?: string, config?: AxiosRequestConfig): Promise<VendorResponse> => {
    try {
      const response = await api.post<VendorMaster>(`/vendors/${vendorId}/block`, { remark }, config);
      return { success: true, data: response };
    } catch (error) {
      logger.error('[VendorService] block error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการ Block Vendor' };
    }
  },

  unblock: async (vendorId: number, config?: AxiosRequestConfig): Promise<VendorResponse> => {
    try {
      const response = await api.post<VendorMaster>(`/vendors/${vendorId}/unblock`, {}, config);
      return { success: true, data: response };
    } catch (error) {
      logger.error('[VendorService] unblock error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการ Unblock Vendor' };
    }
  },

  setOnHold: async (vendorId: number, onHold: boolean, config?: AxiosRequestConfig): Promise<VendorResponse> => {
    try {
      const response = await api.post<VendorMaster>(`/vendors/${vendorId}/hold`, { on_hold: onHold }, config);
      return { success: true, data: response };
    } catch (error) {
      logger.error('[VendorService] setOnHold error:', error);
      return { success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ Hold' };
    }
  },

  updateStatus: async (vendorId: number, status: string, config?: AxiosRequestConfig): Promise<VendorResponse> => {
    try {
        const response = await api.patch<VendorMaster>(`/vendors/${vendorId}/status`, { status }, config);
        return { success: true, data: response };
    } catch (error) {
        logger.error('[VendorService] updateStatus error:', error);
        return { success: false, message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ' };
    }
  },

  search: async (query: string, config?: AxiosRequestConfig): Promise<VendorMaster[]> => {
    try {
      return await api.get<VendorMaster[]>('/vendors/search', { ...config, params: { ...config?.params, q: query } });
    } catch (error) {
      logger.error('[VendorService] search error:', error);
      return [];
    }
  }
};
