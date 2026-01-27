/**
 * @file useVendorForm.ts
 * @description Custom hook สำหรับจัดการ state และ logic ของ Vendor Form
 * @module hooks/useVendorForm
 * 
 * @purpose Share form logic ระหว่าง VendorForm (page) และ VendorFormModal (modal)
 */

import { useState, useCallback } from 'react';
import { vendorService } from '../services/vendorService';
import type { VendorFormData } from '../types/vendor-types';
import { toVendorCreateRequest, initialVendorFormData } from '../types/vendor-types';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

/**
 * Extended form data สำหรับ Vendor form
 */
export interface VendorFormState extends VendorFormData {
  /** รหัสผู้ขายสำหรับค้นหา */
  vendorCodeSearch: string;
  /** ชื่อผู้ขาย (ภาษาไทย) - alias */
  vendorNameTh: string;
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
  ...initialVendorFormData,
  contactEmail: '',
  vendorCodeSearch: '',
  vendorNameTh: '',
};

// ====================================================================================
// MAIN HOOK
// ====================================================================================

/**
 * Custom hook สำหรับจัดการ Vendor Form
 */
export function useVendorForm(options: UseVendorFormOptions = {}): UseVendorFormReturn {
  const { onSuccess } = options;

  // State
  const [formData, setFormData] = useState<VendorFormState>(initialVendorFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /**
   * Handle input change
   */
  const handleInputChange = useCallback((
    field: keyof VendorFormState, 
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    handleReset,
    handleSave,
    clearError,
  };
}

export default useVendorForm;
