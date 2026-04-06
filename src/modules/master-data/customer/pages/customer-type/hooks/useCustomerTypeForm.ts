import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from 'react';
import { CustomerTypeService } from '@customer/services/customer-type.service';
import { initialCustomerTypeFormData, type CustomerTypeFormData } from '@customer/types/customer-type.types';
import { toast } from 'react-hot-toast';

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
      console.error('[useCustomerTypeForm] fetchDetail error:', error);
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
      }
    }
  }, [isOpen, id, fetchDetail]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const setStatus = (isActive: boolean) => {
    setFormData(prev => ({ ...prev, is_active: isActive }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
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
      console.error('[useCustomerTypeForm] handleSubmit error:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    isSubmitting,
    isLoading,
    isEdit,
    handleChange,
    handleSubmit,
    setStatus,
  };
}
