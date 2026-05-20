import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from 'react';
import { CustomerTypeService } from '@customer/customer-type/services/customer-type.service';
import { initialCustomerTypeFormData, type CustomerTypeFormData } from '@customer/customer-type/types/customer-type.types';
import { toast } from 'react-hot-toast';
import { logger } from '@/shared/utils';
import { extractErrorMessage } from '@/core/api/api';
import { useDebounce } from '@/shared/hooks';

interface UseCustomerTypeFormProps {
  id?: string;
  onSuccess?: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export function useCustomerTypeForm({ id, onSuccess, onClose, isOpen }: UseCustomerTypeFormProps) {
  const [formData, setFormData] = useState<CustomerTypeFormData>(initialCustomerTypeFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedCode = useDebounce(formData.customer_type_code, 500);

  const isEdit = !!id;

  const fetchDetail = useCallback(async (targetId: string) => {
    setIsLoading(true);
    try {
      const data = await CustomerTypeService.getById(targetId);
      if (data) {
        setFormData({
          customer_type_code: data.customer_type_code || '',
          customer_type_name: data.customer_type_name || '',
          customer_type_nameeng: data.customer_type_nameeng || '',
          is_active: data.is_active ?? true,
        });
      }
    } catch (error) {
      logger.error('[useCustomerTypeForm] fetchDetail error:', error);
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
        setFormData(initialCustomerTypeFormData);
        setError(null);
      }
    }
  }, [isOpen, id, fetchDetail]);

  // [VALIDATION] Real-time duplicate check
  useEffect(() => {
    let active = true;

    const checkDuplicateRealTime = async () => {
      if (!debouncedCode || isEdit) return; // Skip for edit mode to avoid self-collision (or add logic to check against original)
      
      try {
        const existing = await CustomerTypeService.getList({ search: debouncedCode });
        if (!active) return;

        const isDuplicate = existing.data.some(
          item => item.customer_type_code.toLowerCase() === debouncedCode.toLowerCase()
        );
        
        if (isDuplicate) {
          setError(`รหัส "${debouncedCode}" มีอยู่ในระบบแล้ว`);
        } else {
          setError(null);
        }
      } catch (err) {
        if (active) {
          logger.error('Real-time validation error:', err);
        }
      }
    };

    checkDuplicateRealTime();

    return () => {
      active = false;
    };
  }, [debouncedCode, isEdit]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    if (name === 'customer_type_code') setError(null); // Clear error when typing
  };

  const setStatus = (isActive: boolean) => {
    setFormData(prev => ({ ...prev, is_active: isActive }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!isEdit) {
        // [VALIDATION] Check for duplicate code before creating
        const existing = await CustomerTypeService.getList({ search: formData.customer_type_code });
        const isDuplicate = existing.data.some(
          item => item.customer_type_code.toLowerCase() === formData.customer_type_code.toLowerCase()
        );
        
        if (isDuplicate) {
          const errMsg = `รหัสประเภทลูกค้า "${formData.customer_type_code}" มีอยู่ในระบบแล้ว`;
          setError(errMsg);
          toast.error(errMsg);
          setIsSubmitting(false);
          return;
        }
      }

      if (isEdit && id) {
        const response = await CustomerTypeService.update(id, formData);
        if (response.success) {
          toast.success('บันทึกการแก้ไขสำเร็จ');
          onSuccess?.();
          onClose();
        } else {
          toast.error(response.message || 'บันทึกการแก้ไขไม่สำเร็จ');
        }
      } else {
        const response = await CustomerTypeService.create(formData);
        if (response.success) {
          toast.success('เพิ่มข้อมูลสำเร็จ');
          onSuccess?.();
          onClose();
        } else {
          toast.error(response.message || 'เพิ่มข้อมูลไม่สำเร็จ');
        }
      }
    } catch (error) {
      logger.error('[useCustomerTypeForm] handleSubmit error:', error);
      const msg = extractErrorMessage(error);
      
      // Specifically handle database unique constraint errors if the backend returns them
      if (msg.includes('รหัส') || msg.toLowerCase().includes('duplicate') || msg.includes('ซ้ำ')) {
        const errMsg = `รหัส "${formData.customer_type_code}" มีอยู่ในระบบแล้ว`;
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
