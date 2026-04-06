import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from 'react';
import { CustomerGroupService } from '@customer/customer-group/services/customer-group.service';
import { initialCustomerGroupFormData, type CustomerGroupFormData } from '@customer/customer-group/types/customer-group.types';
import { toast } from 'react-hot-toast';
import { extractErrorMessage } from '@/core/api/api';
import { useDebounce } from '@/shared/hooks';

interface UseCustomerGroupFormProps {
  id?: string | number;
  onSuccess?: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export function useCustomerGroupForm({ id, onSuccess, onClose, isOpen }: UseCustomerGroupFormProps) {
  const [formData, setFormData] = useState<CustomerGroupFormData>(initialCustomerGroupFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedCode = useDebounce(formData.customer_group_code, 500);

  const isEdit = !!id;

  const fetchDetail = useCallback(async (targetId: string | number) => {
    setIsLoading(true);
    try {
      const data = await CustomerGroupService.getById(targetId);
      if (data) {
        setFormData({
          customer_group_code: data.customer_group_code || '',
          customer_group_name: data.customer_group_name || '',
          customer_group_nameeng: data.customer_group_nameeng || '',
          is_active: data.is_active ?? true,
        });
      }
    } catch (error) {
      console.error('[useCustomerGroupForm] fetchDetail error:', error);
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
        setFormData(initialCustomerGroupFormData);
        setError(null);
      }
    }
  }, [isOpen, id, fetchDetail]);

  // [VALIDATION] Real-time duplicate check
  useEffect(() => {
    const checkDuplicateRealTime = async () => {
      if (!debouncedCode || isEdit) return;
      
      try {
        const existing = await CustomerGroupService.getList({ search: debouncedCode });
        const isDuplicate = existing.data.some(
          item => item.customer_group_code.toLowerCase() === debouncedCode.toLowerCase()
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
    if (name === 'customer_group_code') setError(null);
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
      // Re-verify duplicate on submit for reliability
      if (!isEdit) {
        const existing = await CustomerGroupService.getList({ search: formData.customer_group_code });
        if (existing.data.some(item => item.customer_group_code.toLowerCase() === formData.customer_group_code.toLowerCase())) {
          const errMsg = `รหัสกลุ่มลูกค้า "${formData.customer_group_code}" มีอยู่ในระบบแล้ว`;
          setError(errMsg);
          toast.error(errMsg);
          setIsSubmitting(false);
          return;
        }
      }

      if (isEdit && id) {
        const response = await CustomerGroupService.update(id, formData);
        if (response.success) {
          toast.success('บันทึกการแก้ไขสำเร็จ');
          onSuccess?.();
          onClose();
        } else {
          toast.error(response.message || 'บันทึกการแก้ไขไม่สำเร็จ');
        }
      } else {
        const response = await CustomerGroupService.create(formData);
        if (response.success) {
          toast.success('เพิ่มข้อมูลสำเร็จ');
          onSuccess?.();
          onClose();
        } else {
          toast.error(response.message || 'เพิ่มข้อมูลไม่สำเร็จ');
        }
      }
    } catch (error) {
      console.error('[useCustomerGroupForm] handleSubmit error:', error);
      const msg = extractErrorMessage(error);
      if (msg.includes('รหัส') || msg.toLowerCase().includes('duplicate') || msg.includes('ซ้ำ')) {
        const errMsg = `รหัส "${formData.customer_group_code}" มีอยู่ในระบบแล้ว`;
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
