/**
 * @file useVendorForm.ts
 * @description Custom hook สำหรับจัดการ state และ logic ของ Vendor Form
 * @module hooks/useVendorForm
 * 
 * @purpose Share form logic ระหว่าง VendorForm (page) และ VendorFormModal (modal)
 * 
 * @example
 * ```tsx
 * const {
 *   formData,
 *   handleInputChange,
 *   handleSave,
 *   handleReset,
 *   isSaving,
 *   saveError,
 * } = useVendorForm({ onSuccess: () => navigate('/master-data') });
 * ```
 */

import { useState, useCallback } from 'react';
import { vendorService } from '../services/vendorService';
import type { VendorFormData, VendorType } from '../types/vendor-types';
import { toVendorCreateRequest } from '../types/vendor-types';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

/**
 * Extended form data สำหรับ Vendor form
 * รวม fields พิเศษที่ใช้ใน UI เช่น PP20 address aliases
 */
export interface VendorFormState extends VendorFormData {
  /** รหัสผู้ขายสำหรับค้นหา */
  vendorCodeSearch: string;
  /** ชื่อผู้ขาย (ภาษาไทย) - alias */
  vendorNameTh: string;
  /** ที่อยู่ ภพ.20 บรรทัดที่ 1 */
  addressPP20Line1: string;
  /** ที่อยู่ ภพ.20 บรรทัดที่ 2 */
  addressPP20Line2: string;
  /** แขวง/ตำบล (ภพ.20) */
  subDistrictPP20: string;
  /** เขต/อำเภอ (ภพ.20) */
  districtPP20: string;
  /** จังหวัด (ภพ.20) */
  provincePP20: string;
  /** รหัสไปรษณีย์ (ภพ.20) */
  postalCodePP20: string;
  /** Email ที่ติดต่อ */
  contactEmail: string;
}

/**
 * Options สำหรับ useVendorForm hook
 */
export interface UseVendorFormOptions {
  /** Callback เมื่อบันทึกสำเร็จ */
  onSuccess?: () => void;
  /** Initial vendor ID สำหรับ edit mode */
  vendorId?: string;
}

/**
 * Return type ของ useVendorForm hook
 */
export interface UseVendorFormReturn {
  /** State ของฟอร์ม */
  formData: VendorFormState;
  /** กำลังบันทึก */
  isSaving: boolean;
  /** Error message */
  saveError: string | null;
  /** เปลี่ยนค่าใน form field */
  handleInputChange: (field: keyof VendorFormState, value: string | boolean) => void;
  /** Toggle checkbox ใช้ที่อยู่ ภพ.20 */
  handleUseAddressPP20Toggle: () => void;
  /** Reset form */
  handleReset: () => void;
  /** บันทึกข้อมูล */
  handleSave: () => Promise<void>;
  /** Clear error */
  clearError: () => void;
}

// ====================================================================================
// INITIAL STATE
// ====================================================================================

/**
 * ค่าเริ่มต้นของ Vendor Form
 */
export const initialVendorFormState: VendorFormState = {
  vendorCode: '',
  vendorCodeSearch: '',
  vendorName: '',
  vendorNameTh: '',
  vendorNameEn: '',
  taxId: '',
  vendorType: 'COMPANY' as VendorType,
  // PP20 address
  addressLine1: '',
  addressLine2: '',
  subDistrict: '',
  district: '',
  province: '',
  postalCode: '',
  addressPP20Line1: '',
  addressPP20Line2: '',
  subDistrictPP20: '',
  districtPP20: '',
  provincePP20: '',
  postalCodePP20: '',
  // Contact address
  useAddressPP20: false,
  contactAddressLine1: '',
  contactAddressLine2: '',
  contactSubDistrict: '',
  contactDistrict: '',
  contactProvince: '',
  contactPostalCode: '',
  contactEmail: '',
  // Contact info
  phone: '',
  phoneExt: '',
  email: '',
  remarks: '',
  // Status
  onHold: false,
  blocked: false,
  inactive: false,
};

// ====================================================================================
// MAIN HOOK
// ====================================================================================

/**
 * Custom hook สำหรับจัดการ Vendor Form
 * 
 * @description ใช้ share logic ระหว่าง VendorForm.tsx และ VendorFormModal.tsx
 * ประกอบด้วย:
 * - Form state management
 * - Input change handlers
 * - Address sync logic (PP20 → Contact)
 * - Save/validation logic
 * - Error handling
 * 
 * @param options - Configuration options
 * @returns Form state และ handlers
 * 
 * @example
 * ```tsx
 * function VendorCreatePage() {
 *   const navigate = useNavigate();
 *   const {
 *     formData,
 *     handleInputChange,
 *     handleSave,
 *     isSaving,
 *     saveError,
 *   } = useVendorForm({ onSuccess: () => navigate('/master-data') });
 *   
 *   return (
 *     <form>
 *       <input 
 *         value={formData.vendorName} 
 *         onChange={(e) => handleInputChange('vendorName', e.target.value)} 
 *       />
 *       <button onClick={handleSave} disabled={isSaving}>
 *         {isSaving ? 'Saving...' : 'Save'}
 *       </button>
 *       {saveError && <p className="error">{saveError}</p>}
 *     </form>
 *   );
 * }
 * ```
 */
export function useVendorForm(options: UseVendorFormOptions = {}): UseVendorFormReturn {
  const { onSuccess } = options;

  // State
  const [formData, setFormData] = useState<VendorFormState>(initialVendorFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * Handle input change พร้อม auto-sync contact address
   */
  const handleInputChange = useCallback((
    field: keyof VendorFormState, 
    value: string | boolean
  ) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-sync contact address if useAddressPP20 is checked
      if (prev.useAddressPP20) {
        if (field === 'addressLine1' || field === 'addressPP20Line1') {
          updated.contactAddressLine1 = value as string;
        } else if (field === 'addressLine2' || field === 'addressPP20Line2') {
          updated.contactAddressLine2 = value as string;
        } else if (field === 'subDistrict' || field === 'subDistrictPP20') {
          updated.contactSubDistrict = value as string;
        } else if (field === 'district' || field === 'districtPP20') {
          updated.contactDistrict = value as string;
        } else if (field === 'province' || field === 'provincePP20') {
          updated.contactProvince = value as string;
        } else if (field === 'postalCode' || field === 'postalCodePP20') {
          updated.contactPostalCode = value as string;
        }
      }

      return updated;
    });
  }, []);

  /**
   * Toggle ใช้ที่อยู่ ภพ.20 เป็นที่อยู่ติดต่อ
   */
  const handleUseAddressPP20Toggle = useCallback(() => {
    setFormData(prev => {
      const newUseAddressPP20 = !prev.useAddressPP20;
      
      if (newUseAddressPP20) {
        // Copy PP20 address to contact address
        return {
          ...prev,
          useAddressPP20: newUseAddressPP20,
          contactAddressLine1: prev.addressPP20Line1 || prev.addressLine1,
          contactAddressLine2: prev.addressPP20Line2 || prev.addressLine2,
          contactSubDistrict: prev.subDistrictPP20 || prev.subDistrict,
          contactDistrict: prev.districtPP20 || prev.district,
          contactProvince: prev.provincePP20 || prev.province,
          contactPostalCode: prev.postalCodePP20 || prev.postalCode,
        };
      } else {
        // Clear contact address
        return {
          ...prev,
          useAddressPP20: newUseAddressPP20,
          contactAddressLine1: '',
          contactAddressLine2: '',
          contactSubDistrict: '',
          contactDistrict: '',
          contactProvince: '',
          contactPostalCode: '',
        };
      }
    });
  }, []);

  /**
   * Reset form to initial state
   */
  const handleReset = useCallback(() => {
    setFormData(initialVendorFormState);
    setSaveError(null);
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setSaveError(null);
  }, []);

  /**
   * Validate และบันทึกข้อมูล
   */
  const handleSave = useCallback(async () => {
    // Validation
    if (!formData.vendorName.trim() && !formData.vendorNameTh.trim()) {
      setSaveError('กรุณากรอกชื่อผู้ขาย');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Map PP20 fields to standard fields for API
      const apiFormData: VendorFormData = {
        ...formData,
        addressLine1: formData.addressPP20Line1 || formData.addressLine1,
        addressLine2: formData.addressPP20Line2 || formData.addressLine2,
        subDistrict: formData.subDistrictPP20 || formData.subDistrict,
        district: formData.districtPP20 || formData.district,
        province: formData.provincePP20 || formData.province,
        postalCode: formData.postalCodePP20 || formData.postalCode,
        email: formData.contactEmail || formData.email,
      };

      const request = toVendorCreateRequest(apiFormData);
      const result = await vendorService.create(request);

      if (result.success) {
        onSuccess?.();
      } else {
        setSaveError(result.message || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch {
      setSaveError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSaving(false);
    }
  }, [formData, onSuccess]);

  return {
    formData,
    isSaving,
    saveError,
    handleInputChange,
    handleUseAddressPP20Toggle,
    handleReset,
    handleSave,
    clearError,
  };
}

export default useVendorForm;
