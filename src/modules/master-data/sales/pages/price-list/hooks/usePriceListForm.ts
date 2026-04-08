/**
 * @file usePriceListForm.ts
 * @description Hook for managing Price List form logic
 */

import { useEffect, useCallback } from 'react';
import { useForm, useFieldArray, type SubmitHandler, type Path, type PathValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PriceListService } from '@master-data/sales/pages/price-list/services/price-list.service';
import type { PriceListFormData, PriceListItemFormData } from '@master-data/sales/pages/price-list/types/price-list.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/core/auth/contexts/AuthContext';

const priceListItemSchema = z.object({
    priceListItemId: z.string().optional(),
    itemId: z.string().min(1, 'กรุณาเลือกสินค้า'),
    uomId: z.string().nullable(),
    unitPrice: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
    lineDiscount: z.union([z.number(), z.string()]),
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
    saveEmpId: z.string(),
    remark: z.string(),
    priceListFlag: z.enum(['+', '-']).nullable(),
    customerName: z.string().optional(),
    permitEmpName: z.string().optional(),
    saveEmpName: z.string().optional(),
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
    saveEmpId: '',
    remark: '',
    priceListFlag: null,
    customerName: '',
    permitEmpName: '',
    saveEmpName: '',
    items: [],
};

export function usePriceListForm(editId: string | null, onSuccess?: () => void) {
    const { user } = useAuth();
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

    const { fields, append, remove } = useFieldArray({
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
                        saveEmpId: data.save_emp_id || '',
                        remark: data.remark || '',
                        priceListFlag: data.price_list_flag,
                        customerName: data.customer_name || '',
                        permitEmpName: data.permit_emp_name || '',
                        saveEmpName: data.save_emp_name || '',
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
            // Default 'Recorder' to current user in create mode
            reset({
                ...initialValues,
                saveEmpId: user?.employee?.employee_id ? String(user.employee.employee_id) : '',
                saveEmpName: user?.employee?.employee_fullname || ''
            });
        }
    }, [editId, reset, user]);

    const onSubmit: SubmitHandler<PriceListFormData> = async (formData) => {
        try {
            // Convert any percentage/string discounts to absolute amounts for the API
            const submissionData = {
                ...formData,
                items: formData.items.map(item => {
                    let finalDiscount = 0;
                    if (typeof item.lineDiscount === 'string' && item.lineDiscount.endsWith('%')) {
                        const percent = parseFloat(item.lineDiscount.replace('%', '')) || 0;
                        finalDiscount = (item.unitPrice * percent) / 100;
                    } else {
                        finalDiscount = Number(item.lineDiscount) || 0;
                    }

                    return {
                        ...item,
                        lineDiscount: finalDiscount, // API expects number
                        lineDiscountAmnt: finalDiscount
                    };
                })
            };

            const result = editId 
                ? await PriceListService.update(editId, submissionData as PriceListFormData)
                : await PriceListService.create(submissionData as PriceListFormData);
            
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

    const calculateNetPrice = useCallback((unitPrice: number, lineDiscount: string | number) => {
        let discountAmnt = 0;
        if (typeof lineDiscount === 'string' && lineDiscount.endsWith('%')) {
            const percent = parseFloat(lineDiscount.replace('%', '')) || 0;
            discountAmnt = (unitPrice * percent) / 100;
        } else {
            discountAmnt = Number(lineDiscount) || 0;
        }
        return {
            discountAmnt,
            unitPriceNet: unitPrice - discountAmnt
        };
    }, []);

    const handleItemChange = <K extends keyof PriceListItemFormData>(
        index: number, 
        field: K, 
        value: PriceListItemFormData[K]
    ) => {
        // Use Path casting instead of any to satisfy TS and RHF requirements
        const path = `items.${index}.${field}` as Path<PriceListFormData>;
        setValue(path, value as PathValue<PriceListFormData, Path<PriceListFormData>>, { shouldDirty: true });
        
        if (field === 'unitPrice' || field === 'lineDiscount') {
            const items = getValues('items');
            const item = items[index];
            const unitPrice = field === 'unitPrice' ? (parseFloat(String(value)) || 0) : (Number(item.unitPrice) || 0);
            const lineDiscount = field === 'lineDiscount' ? String(value) : String(item.lineDiscount);
            const { discountAmnt, unitPriceNet } = calculateNetPrice(unitPrice, lineDiscount);
            
            // Limit to reasonable ERP values to prevent UI overflow bugs
            const safeNet = Math.max(0, Math.min(unitPriceNet, 999999999999.99));
            const safeDisc = Math.max(0, Math.min(discountAmnt, unitPrice));
            
            setValue(`items.${index}.lineDiscountAmnt` as Path<PriceListFormData>, safeDisc as PathValue<PriceListFormData, Path<PriceListFormData>>, { shouldDirty: true });
            setValue(`items.${index}.unitPriceNet` as Path<PriceListFormData>, safeNet as PathValue<PriceListFormData, Path<PriceListFormData>>, { shouldDirty: true });
        }
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
