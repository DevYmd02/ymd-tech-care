import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from 'react';
import { BillingGroupService } from '../services/billing-group.service';
import { initialBillingGroupFormData, type BillingGroupFormData } from '../types/billing-group.types';
import { toast } from 'react-hot-toast';
import { logger } from '@/shared/utils/logger';
import { extractErrorMessage } from '@/core/api/api';
import { useDebounce } from '@/shared/hooks';

interface UseBillingGroupFormProps {
  id?: string | number;
  onSuccess?: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export function useBillingGroupForm({ id, onSuccess, onClose, isOpen }: UseBillingGroupFormProps) {
  const [formData, setFormData] = useState<BillingGroupFormData>(initialBillingGroupFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedCode = useDebounce(formData.bill_group_code, 500);

  const isEdit = !!id;

  const fetchDetail = useCallback(async (targetId: string | number) => {
    setIsLoading(true);
    try {
      const data = await BillingGroupService.getById(targetId);
      if (data) {
        setFormData({
          bill_group_code: data.bill_group_code || '',
          bill_group_name: data.bill_group_name || '',
          bill_group_nameeng: data.bill_group_nameeng || '',
          remark: data.remark || '',
          is_active: data.is_active ?? true,
        });
      }
    } catch (error) {
      logger.error('[useBillingGroupForm] fetchDetail error:', error);
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
        setFormData(initialBillingGroupFormData);
        setError(null);
      }
    }
  }, [isOpen, id, fetchDetail]);

  // [VALIDATION] Real-time duplicate check
  useEffect(() => {
    const checkDuplicateRealTime = async () => {
      if (!debouncedCode || isEdit) return;
      
      try {
        const existing = await BillingGroupService.getList({ search: debouncedCode });
        const isDuplicate = existing.data.some(
          item => item.bill_group_code.toLowerCase() === debouncedCode.toLowerCase()
        );
        
        if (isDuplicate) {
          setError(`รหัส "${debouncedCode}" มีอยู่ในระบบแล้ว`);
        } else {
          setError(null);
        }
      } catch (err) {
        logger.error('Real-time validation error:', err);
      }
    };

    checkDuplicateRealTime();
  }, [debouncedCode, isEdit]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    if (name === 'bill_group_code') setError(null);
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
        const existing = await BillingGroupService.getList({ search: formData.bill_group_code });
        if (existing.data.some(item => item.bill_group_code.toLowerCase() === formData.bill_group_code.toLowerCase())) {
          const errMsg = `รหัสกลุ่มวางบิล "${formData.bill_group_code}" มีอยู่ในระบบแล้ว`;
          setError(errMsg);
          toast.error(errMsg);
          setIsSubmitting(false);
          return;
        }
      }

      if (isEdit && id) {
        const response = await BillingGroupService.update(id, formData);
        if (response.success) {
          toast.success('บันทึกการแก้ไขสำเร็จ');
          onSuccess?.();
          onClose();
        } else {
          toast.error(response.message || 'บันทึกการแก้ไขไม่สำเร็จ');
        }
      } else {
        const response = await BillingGroupService.create(formData);
        if (response.success) {
          toast.success('เพิ่มข้อมูลสำเร็จ');
          onSuccess?.();
          onClose();
        } else {
          toast.error(response.message || 'เพิ่มข้อมูลไม่สำเร็จ');
        }
      }
    } catch (error) {
      logger.error('[useBillingGroupForm] handleSubmit error:', error);
      const msg = extractErrorMessage(error);
      if (msg.includes('รหัส') || msg.toLowerCase().includes('duplicate') || msg.includes('ซ้ำ')) {
        const errMsg = `รหัส "${formData.bill_group_code}" มีอยู่ในระบบแล้ว`;
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
