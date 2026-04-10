/**
 * @file usePriceLevelNameForm.ts
 * @description Hook for managing Price Level Name form logic
 */

import { useEffect } from 'react';
import { useForm, type SubmitHandler, type Resolver, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PriceLevelNameService } from '../services/price-level-name.service';
import type { PriceLevelNameFormData } from '../types/price-level-name.types';
import type { ApiPriceLevelName } from '../types/price-level-name.types';
import toast from 'react-hot-toast';
import { logger } from '@/shared/utils/logger';

const priceLevelNameSchema = z.object({
  code: z.string().min(1, 'กรุณากรอกรหัส'),
  name: z.string().min(1, 'กรุณากรอกชื่อระดับราคา'),
  levelNo: z.union([z.string(), z.number()]).refine(
    val => val !== '' && !isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 10,
    'กรุณาเลือกหมายเลขระดับ (1-10)'
  ),
});

const initialValues: PriceLevelNameFormData = {
  code: '',
  name: '',
  levelNo: '',
};

export function usePriceLevelNameForm(
  editId: string | number | null,
  onSuccess?: () => void,
  isOpen?: boolean
) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PriceLevelNameFormData>({
    resolver: zodResolver(priceLevelNameSchema) as Resolver<PriceLevelNameFormData>,
    defaultValues: initialValues,
  });

  // Fetch data for editing
  useEffect(() => {
    if (!isOpen) return;

    if (editId) {
      const fetchDetail = async () => {
        try {
          const responseData = await PriceLevelNameService.get(editId);
          const rawData = (Array.isArray(responseData) ? responseData[0] : responseData) as ApiPriceLevelName;

          if (!rawData) {
            toast.error('ไม่พบข้อมูล');
            return;
          }

          reset({
            code: rawData.code || '',
            name: rawData.name || '',
            levelNo: rawData.level_no ?? rawData.levelNo ?? '',
          });
        } catch (error: unknown) {
          logger.error('Failed to fetch price level name detail:', error);
          toast.error('ไม่สามารถดึงข้อมูลได้');
        }
      };
      fetchDetail();
    } else {
      reset(initialValues);
    }
  }, [editId, reset, isOpen]);

  const onSubmit: SubmitHandler<PriceLevelNameFormData> = async (formData) => {
    try {
      const result = editId
        ? await PriceLevelNameService.update(editId, formData)
        : await PriceLevelNameService.create(formData);

      if (result.success) {
        toast.success(editId ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มข้อมูลสำเร็จ');
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.message || 'บันทึกไม่สำเร็จ');
      }
    } catch (error: unknown) {
      logger.error('Submit error:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const onValidationError = (validationErrors: FieldErrors<PriceLevelNameFormData>) => {
    logger.error('❌ Form Validation Errors:', validationErrors);
    toast.error('กรุณาตรวจสอบข้อมูลให้ถูกต้อง');
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit, onValidationError),
    errors,
    isSubmitting,
    setValue,
    reset,
    watch,
  };
}
