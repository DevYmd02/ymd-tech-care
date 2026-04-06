import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from 'react';
import { BusinessTypeService } from '@customer/business-type/services/business-type.service';
import { initialBusinessTypeFormData, type BusinessTypeFormData } from '@customer/business-type/types/business-type.types';
import { toast } from 'react-hot-toast';
import { extractErrorMessage } from '@/core/api/api';
import { useDebounce } from '@/shared/hooks';

interface UseBusinessTypeFormProps {
  id?: string | number;
  onSuccess?: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export function useBusinessTypeForm({ id, onSuccess, onClose, isOpen }: UseBusinessTypeFormProps) {
  const [formData, setFormData] = useState<BusinessTypeFormData>(initialBusinessTypeFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedCode = useDebounce(formData.business_type_code, 500);

  const isEdit = !!id;

  const fetchDetail = useCallback(async (targetId: string | number) => {
    setIsLoading(true);
    try {
      const data = await BusinessTypeService.getById(targetId);
      if (data) {
        setFormData({
          business_type_code: data.business_type_code || '',
          business_type_name: data.business_type_name || '',
          business_type_nameeng: data.business_type_nameeng || '',
          remark: data.remark || '',
          is_active: data.is_active ?? true,
        });
      }
    } catch (error) {
      console.error('[useBusinessTypeForm] fetchDetail error:', error);
      toast.error('ไม่สามารถดึงข้อมูลได้');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (id) {
        fetchDetail(id);
      } else {
        setFormData(initialBusinessTypeFormData);
        setError(null);
      }
    }
  }, [isOpen, id, fetchDetail]);

  // [VALIDATION] Real-time duplicate check
  useEffect(() => {
    const checkDuplicateRealTime = async () => {
      if (!debouncedCode || isEdit) return;
      
      try {
        const existing = await BusinessTypeService.getList({ search: debouncedCode });
        const isDuplicate = existing.data.some(
          item => item.business_type_code.toLowerCase() === debouncedCode.toLowerCase()
        );
        
        if (isDuplicate) {
          setError(`รหัส "${debouncedCode}" มีอยู่ในระบบแล้ว`);
        } else {
          setError(null);
        }
      } catch (err) {
        console.error('Real-time validation error:', err);
      }
    };

    checkDuplicateRealTime();
  }, [debouncedCode, isEdit]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    if (name === 'business_type_code') setError(null);
  };

  const setStatus = (isActive: boolean) => {
    setFormData(prev => ({ ...prev, is_active: isActive }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (error) {
        toast.error('กรุณาแก้ไขข้อผิดพลาดก่อนบันทึก');
        return;
    }

    setIsSubmitting(true);
    try {
      // Re-verify duplicate on submit
      if (!isEdit) {
        const existing = await BusinessTypeService.getList({ search: formData.business_type_code });
        if (existing.data.some(item => item.business_type_code.toLowerCase() === formData.business_type_code.toLowerCase())) {
          const errMsg = `รหัสประเภทธุรกิจ "${formData.business_type_code}" มีอยู่ในระบบแล้ว`;
          setError(errMsg);
          toast.error(errMsg);
          setIsSubmitting(false);
          return;
        }
      }

      if (isEdit && id) {
        const response = await BusinessTypeService.update(id, formData);
        if (response.success) {
          toast.success('บันทึกการแก้ไขสำเร็จ');
          onSuccess?.();
          onClose();
        } else {
          toast.error(response.message || 'บันทึกการแก้ไขไม่สำเร็จ');
        }
      } else {
        const response = await BusinessTypeService.create(formData);
        if (response.success) {
          toast.success('เพิ่มข้อมูลสำเร็จ');
          onSuccess?.();
          onClose();
        } else {
          toast.error(response.message || 'เพิ่มข้อมูลไม่สำเร็จ');
        }
      }
    } catch (error) {
      console.error('[useBusinessTypeForm] handleSubmit error:', error);
      const msg = extractErrorMessage(error);
      if (msg.includes('รหัส') || msg.toLowerCase().includes('duplicate') || msg.includes('ซ้ำ')) {
        const errMsg = `รหัส "${formData.business_type_code}" มีอยู่ในระบบแล้ว`;
        setError(errMsg);
        toast.error(errMsg);
      } else {
        toast.error(msg || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    isLoading,
    isEdit,
    error,
    handleChange,
    handleSubmit,
    setStatus,
  };
}
