/**
 * @file usePriceListForm.ts
 * @description Hook for managing Price List form logic
 */

import { useEffect, useCallback } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PriceListService } from '@master-data/sales/pages/price-list/services/price-list.service';
import type { PriceListFormData, PriceListItemFormData } from '@master-data/sales/pages/price-list/types/price-list.types';
import toast from 'react-hot-toast';

const priceListItemSchema = z.object({
    priceListItemId: z.string().optional(),
    itemId: z.string().min(1, 'กรุณาเลือกสินค้า'),
    uomId: z.string().nullable(),
    unitPrice: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
    lineDiscount: z.number().min(0, 'ส่วนลดต้องไม่ติดลบ'),
    lineDiscountAmnt: z.number(),
    unitPriceNet: z.number(),
    remark: z.string(),
    itemCode: z.string().optional(),
    itemName: z.string().optional(),
    uomName: z.string().optional(),
});

const priceListSchema = z.object({
    priceListNo: z.string().min(1, 'กรุณากรอกเลขที่ Price List'),
    priceListName: z.string().min(1, 'กรุณากรอกชื่อ Price List'),
    priceListDate: z.string().min(1, 'กรุณากรอกวันที่'),
    isActive: z.boolean(),
    beginDate: z.string().nullable(),
    endDate: z.string().nullable(),
    branchId: z.string().min(1, 'กรุณาเลือกสาขา'),
    customerGroupId: z.string(),
    customerId: z.string(),
    empDeptId: z.string(),
    itemBrandId: z.string(),
    itemId: z.string(),
    permitEmpId: z.string(),
    remark: z.string(),
    priceListFlag: z.string().nullable(),
    items: z.array(priceListItemSchema),
});

const initialValues: PriceListFormData = {
    priceListNo: '',
    priceListName: '',
    priceListDate: new Date().toISOString().split('T')[0],
    isActive: true,
    beginDate: null,
    endDate: null,
    branchId: '',
    customerGroupId: '',
    customerId: '',
    empDeptId: '',
    itemBrandId: '',
    itemId: '',
    permitEmpId: '',
    remark: '',
    priceListFlag: null,
    items: [],
};

export function usePriceListForm(editId: string | null, onSuccess?: () => void) {
    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        watch,
        getValues,
        formState: { errors, isSubmitting }
    } = useForm<PriceListFormData>({
        resolver: zodResolver(priceListSchema),
        defaultValues: initialValues,
    });

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: 'items',
    });

    // Fetch data for editing
    useEffect(() => {
        if (editId) {
            const fetchDetail = async () => {
                try {
                    const data = await PriceListService.get(editId);
                    reset({
                        priceListNo: data.price_list_no,
                        priceListName: data.price_list_name,
                        priceListDate: data.price_list_date?.split('T')[0],
                        isActive: data.is_active,
                        beginDate: data.begin_date ? data.begin_date.split('T')[0] : null,
                        endDate: data.end_date ? data.end_date.split('T')[0] : null,
                        branchId: data.branch_id,
                        customerGroupId: data.customer_group_id || '',
                        customerId: data.customer_id || '',
                        empDeptId: data.emp_dept_id || '',
                        itemBrandId: data.item_brand_id || '',
                        itemId: data.item_id || '',
                        permitEmpId: data.permit_emp_id || '',
                        remark: data.remark || '',
                        priceListFlag: data.price_list_flag,
                        items: (data.items || []).map(item => ({
                            priceListItemId: item.price_list_item_id,
                            itemId: item.item_id,
                            uomId: item.uom_id,
                            unitPrice: Number(item.unit_price),
                            lineDiscount: Number(item.line_discount),
                            lineDiscountAmnt: Number(item.line_discount_amnt),
                            unitPriceNet: Number(item.unit_price_net),
                            remark: item.remark || '',
                            itemCode: item.item_code,
                            itemName: item.item_name,
                            uomName: item.uom_name,
                        })),
                    });
                } catch (error) {
                    console.error('Failed to fetch price list detail:', error);
                    toast.error('ไม่สามารถดึงข้อมูลได้');
                }
            };
            fetchDetail();
        } else {
            reset(initialValues);
        }
    }, [editId, reset]);

    const onSubmit: SubmitHandler<PriceListFormData> = async (formData) => {
        try {
            const result = editId 
                ? await PriceListService.update(editId, formData)
                : await PriceListService.create(formData);
            
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

    const calculateNetPrice = useCallback((unitPrice: number, lineDiscount: number) => {
        return unitPrice - lineDiscount;
    }, []);

    const handleItemChange = (index: number, field: keyof PriceListItemFormData, value: string | number | boolean | null) => {
        const item = (getValues('items'))[index];
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'unitPrice' || field === 'lineDiscount') {
            const unitPrice = field === 'unitPrice' ? Number(value) : Number(item.unitPrice);
            const lineDiscount = field === 'lineDiscount' ? Number(value) : Number(item.lineDiscount);
            updatedItem.unitPriceNet = calculateNetPrice(unitPrice, lineDiscount);
        }
        
        update(index, updatedItem);
    };

    return {
        register,
        handleSubmit: handleSubmit(onSubmit),
        control,
        errors,
        isSubmitting,
        fields,
        append,
        remove,
        handleItemChange,
        setValue,
        watch,
    };
}
