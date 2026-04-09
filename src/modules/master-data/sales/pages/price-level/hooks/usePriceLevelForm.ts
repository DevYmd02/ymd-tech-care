/**
 * @file usePriceLevelForm.ts
 * @description Hook for managing Price Level form logic
 */

import { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PriceLevelService } from '../services/price-level.service';
import type { PriceLevelFormData } from '../types/price-level.types';
import toast from 'react-hot-toast';

const priceLevelSchema = z.object({
  itemId: z.string().min(1, 'กรุณาเลือกสินค้า'),
  uomId: z.string().min(1, 'กรุณาเลือกหน่วยนับ'),
  itemFromQty: z.number().min(0, 'จำนวนเริ่มต้นต้องไม่ติดลบ'),
  itemToQty: z.number().min(0, 'ถึงจำนวนต้องไม่ติดลบ'),
  itemPrice1: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  itemPrice2: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  itemPrice3: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  itemPrice4: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  itemPrice5: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  itemPrice6: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  itemPrice7: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  itemPrice8: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  itemPrice9: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  itemPrice10: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  listno: z.number().optional().default(0),
  itemName: z.string().optional(),
  itemNameEn: z.string().optional(),
  itemCode: z.string().optional(),
  uomName: z.string().optional(),
});

const initialValues: PriceLevelFormData = {
  itemId: '',
  uomId: '',
  itemFromQty: 0,
  itemToQty: 0,
  itemPrice1: 0,
  itemPrice2: 0,
  itemPrice3: 0,
  itemPrice4: 0,
  itemPrice5: 0,
  itemPrice6: 0,
  itemPrice7: 0,
  itemPrice8: 0,
  itemPrice9: 0,
  itemPrice10: 0,
  listno: 0,
  itemName: '',
  itemNameEn: '',
  itemCode: '',
  uomName: '',
};

export function usePriceLevelForm(editId: string | null, onSuccess?: () => void, isOpen?: boolean) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<PriceLevelFormData>({
    resolver: zodResolver(priceLevelSchema),
    defaultValues: initialValues,
  });

  // Fetch data for editing
  useEffect(() => {
    if (!isOpen) return;

    if (editId) {
      const fetchDetail = async () => {
        try {
          const data = await PriceLevelService.get(editId);
          reset({
            itemId: data.item_id,
            uomId: data.uom_id,
            itemFromQty: Number(data.item_from_qty),
            itemToQty: Number(data.item_to_qty),
            itemPrice1: Number(data.item_price1),
            itemPrice2: Number(data.item_price2),
            itemPrice3: Number(data.item_price3),
            itemPrice4: Number(data.item_price4),
            itemPrice5: Number(data.item_price5),
            itemPrice6: Number(data.item_price6),
            itemPrice7: Number(data.item_price7),
            itemPrice8: Number(data.item_price8),
            itemPrice9: Number(data.item_price9),
            itemPrice10: Number(data.item_price10),
            listno: Number(data.listno),
            itemName: data.item_name || '',
            itemNameEn: data.item_name_en || '',
            itemCode: data.item_code || '',
            uomName: data.uom_name || '',
          });
        } catch (error) {
          console.error('Failed to fetch price level detail:', error);
          toast.error('ไม่สามารถดึงข้อมูลได้');
        }
      };
      fetchDetail();
    } else {
      reset(initialValues);
    }
  }, [editId, reset, isOpen]);

  const onSubmit: SubmitHandler<PriceLevelFormData> = async (formData) => {
    try {
      const result = editId 
        ? await PriceLevelService.update(editId, formData)
        : await PriceLevelService.create(formData);
      
      if (result.success) {
        toast.success(editId ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มข้อมูลสำเร็จ');
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.message || 'บันทึกไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit),
    control,
    errors,
    isSubmitting,
    setValue,
    watch,
    reset,
  };
}
