/**
 * @file usePriceLevelForm.ts
 * @description Hook for managing Price Level form logic
 */

import { useEffect } from 'react';
import { useForm, type SubmitHandler, type Resolver, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PriceLevelService } from '../services/price-level.service';
import type { PriceLevelFormData } from '../types/price-level.types';
import toast from 'react-hot-toast';

import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import type { ApiPriceLevel } from '../types/price-level.types';
import { logger } from '@/shared/utils/logger';

const nullableNumber = z.preprocess((val) => {
  if (val === '' || val === undefined || val === null) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}, z.number().nullable());

const priceLevelSchema = z.object({
  itemId: z.union([z.string(), z.number()]).refine(val => val !== '', 'กรุณาเลือกสินค้า'),
  uomId: z.union([z.string(), z.number()]).refine(val => val !== '', 'กรุณาเลือกหน่วยนับ'),
  itemFromQty: nullableNumber,
  itemToQty: nullableNumber,
  itemPrice1: nullableNumber,
  itemPrice2: nullableNumber,
  itemPrice3: nullableNumber,
  itemPrice4: nullableNumber,
  itemPrice5: nullableNumber,
  itemPrice6: nullableNumber,
  itemPrice7: nullableNumber,
  itemPrice8: nullableNumber,
  itemPrice9: nullableNumber,
  itemPrice10: nullableNumber,
  listno: nullableNumber,
  itemName: z.string().optional(),
  itemNameEn: z.string().optional(),
  itemCode: z.string().optional(),
  uomName: z.string().optional(),
});

const initialValues: PriceLevelFormData = {
  itemId: '',
  uomId: '',
  itemFromQty: null,
  itemToQty: null,
  itemPrice1: null,
  itemPrice2: null,
  itemPrice3: null,
  itemPrice4: null,
  itemPrice5: null,
  itemPrice6: null,
  itemPrice7: null,
  itemPrice8: null,
  itemPrice9: null,
  itemPrice10: null,
  listno: null,
  itemName: '',
  itemNameEn: '',
  itemCode: '',
  uomName: '',
};

export function usePriceLevelForm(editId: string | number | null, onSuccess?: () => void, isOpen?: boolean) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<PriceLevelFormData>({
    resolver: zodResolver(priceLevelSchema) as Resolver<PriceLevelFormData>,
    defaultValues: initialValues,
  });

  // Fetch data for editing
  useEffect(() => {
    if (!isOpen) return;

    if (editId) {
      const fetchDetail = async () => {
        try {
          const responseData = await PriceLevelService.get(editId);
          logger.debug('🔍 PriceLevel Detail:', responseData);

          // Handle array response (if backend returns an array for detail)
          const rawData = (Array.isArray(responseData) ? responseData[0] : responseData) as ApiPriceLevel;

          if (!rawData) {
            toast.error('ไม่พบข้อมูล');
            return;
          }

          // Defensive helper to extract numeric values safely (now preserves null)
          const num = (val: number | string | null | undefined): number | null => {
            if (val === null || val === undefined) return null;
            const parsed = Number(val);
            return isNaN(parsed) ? null : parsed;
          };

          // Fallback for missing item info: fetch from item service if not present in joined response
          let itemInfo = {
            item_code: rawData.item_code || '',
            item_name: rawData.item_name || '',
            item_name_en: rawData.item_name_en || '',
          };

          const itemId = rawData.item_id || rawData.itemId;
          const uomId = rawData.uom_id || rawData.uomId;

          if (itemId && (!itemInfo.item_code || !itemInfo.item_name)) {
            try {
              const item = await ItemMasterService.getById(Number(itemId));
              if (item) {
                itemInfo = {
                  item_code: item.item_code || itemInfo.item_code,
                  item_name: item.item_name || itemInfo.item_name,
                  item_name_en: item.item_name_en || itemInfo.item_name_en,
                };
              }
            } catch (err) {
              logger.warn('Could not fetch additional item info:', err);
            }
          }

          reset({
            itemId: itemId ?? '',
            uomId: uomId ?? '',
            itemFromQty: num(rawData.item_from_qty ?? rawData.itemFromQty),
            itemToQty: num(rawData.item_to_qty ?? rawData.itemToQty),
            itemPrice1: rawData.item_price1 !== null && rawData.item_price1 !== undefined ? num(rawData.item_price1) : null,
            itemPrice2: rawData.item_price2 !== null && rawData.item_price2 !== undefined ? num(rawData.item_price2) : null,
            itemPrice3: rawData.item_price3 !== null && rawData.item_price3 !== undefined ? num(rawData.item_price3) : null,
            itemPrice4: rawData.item_price4 !== null && rawData.item_price4 !== undefined ? num(rawData.item_price4) : null,
            itemPrice5: rawData.item_price5 !== null && rawData.item_price5 !== undefined ? num(rawData.item_price5) : null,
            itemPrice6: rawData.item_price6 !== null && rawData.item_price6 !== undefined ? num(rawData.item_price6) : null,
            itemPrice7: rawData.item_price7 !== null && rawData.item_price7 !== undefined ? num(rawData.item_price7) : null,
            itemPrice8: rawData.item_price8 !== null && rawData.item_price8 !== undefined ? num(rawData.item_price8) : null,
            itemPrice9: rawData.item_price9 !== null && rawData.item_price9 !== undefined ? num(rawData.item_price9) : null,
            itemPrice10: rawData.item_price10 !== null && rawData.item_price10 !== undefined ? num(rawData.item_price10) : null,
            listno: num(rawData.listno),
            itemName: itemInfo.item_name,
            itemNameEn: itemInfo.item_name_en,
            itemCode: itemInfo.item_code,
            uomName: rawData.uom_name || '',
          });
        } catch (error: unknown) {
          logger.error('Failed to fetch price level detail:', error);
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
    } catch (error: unknown) {
      logger.error('Submit error:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const onValidationError = (validationErrors: FieldErrors<PriceLevelFormData>) => {
    logger.error('❌ Form Validation Errors:', validationErrors);
    toast.error('กรุณาตรวจสอบข้อมูลให้ถูกต้อง');
  };

  return {
    register,
    handleSubmit: handleSubmit(onSubmit, onValidationError),
    control,
    errors,
    isSubmitting,
    setValue,
    watch,
    reset,
  };
}
