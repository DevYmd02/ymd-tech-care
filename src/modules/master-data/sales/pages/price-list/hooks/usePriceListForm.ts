/**
 * @file usePriceListForm.ts
 * @description Hook for managing Price List form logic
 */

import { useEffect, useCallback } from 'react';
import { useForm, useFieldArray, type SubmitHandler, type Path, type PathValue, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PriceListService } from '@master-data/sales/pages/price-list/services/price-list.service';
import type { PriceListFormData } from '../types/price-list.types';
import toast from 'react-hot-toast';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { EmployeeService } from '@master-data/employee/services/employee.service';
import { ItemMasterService } from '@inventory/services/item-master.service';
import { UOMService } from '@/modules/master-data/inventory/services/uom.service';
import type { IEmployee } from '@/modules/master-data/company/types/employee-types';
import type { FieldErrors } from 'react-hook-form';
import { logger } from '@/shared/utils';

const priceListItemSchema = z.object({
    priceListItemId: z.string().optional(),
    itemId: z.string().min(1, 'กรุณาเลือกสินค้า'),
    uomId: z.string().nullable().refine(val => val !== null && val !== '', 'กรุณาเลือกหน่วยนับ'),
    unitPrice: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ'),
    lineDiscount: z.union([z.coerce.number(), z.string()]),
    lineDiscountAmnt: z.coerce.number(),
    unitPriceNet: z.coerce.number(),
    remark: z.string(),
    itemBrandId: z.union([z.string(), z.number()]).optional(),
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
    itemBrandId: z.string().optional(),
    empDeptId: z.string().min(1, 'กรุณาเลือกแผนก'),
    itemId: z.string(),
    permitEmpId: z.string().min(1, 'กรุณาเลือกผู้อนุมัติ'),
    saveEmpId: z.string(),
    remark: z.string(),
    priceListFlag: z.enum(['+', '-']).nullable(),
    customerCode: z.string().optional(),
    customerName: z.string().optional(),
    permitEmpName: z.string().optional(),
    saveEmpName: z.string().optional(),
    items: z.array(priceListItemSchema),
}).superRefine((data, ctx) => {
    // Check for duplicate Item + UOM pairs
    const seen = new Set<string>();
    data.items.forEach((item, index) => {
        if (!item.itemId || !item.uomId) return;
        
        const pairKey = `${item.itemId}-${item.uomId}`;
        if (seen.has(pairKey)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'หน่วยนับซ้ำกันกับสินค้า',
                path: ['items', index, 'uomId'],
            });
        }
        seen.add(pairKey);
    });
});

// Standardize on Zod-inferred types for 100% type safety with zodResolver
type FormValues = z.infer<typeof priceListSchema>;
type ItemValues = z.infer<typeof priceListItemSchema>;

const initialValues: FormValues = {
    priceListNo: '',
    priceListName: '',
    priceListDate: new Date().toISOString().split('T')[0],
    isActive: true,
    beginDate: null,
    endDate: null,
    branchId: '',
    customerGroupId: '',
    customerId: '',
    itemBrandId: '',
    empDeptId: '',
    itemId: '',
    permitEmpId: '',
    saveEmpId: '',
    remark: '',
    priceListFlag: null,
    customerCode: '',
    customerName: '',
    permitEmpName: '',
    saveEmpName: '',
    items: [],
};

export function usePriceListForm(editId: string | null, onSuccess?: () => void, isOpen?: boolean) {
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
    } = useForm<FormValues>({
        resolver: zodResolver(priceListSchema) as Resolver<FormValues>,
        defaultValues: initialValues,
        mode: 'onChange'
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    // Fetch data for editing
    useEffect(() => {
        if (!isOpen) return;

        if (editId) {
            logger.debug('🔄 Fetching Price List for Edit:', editId);
            const fetchDetail = async () => {
                try {
                    // Step 1: Fetch basic Price List detail and all employees for lookups
                    const [data, employees] = await Promise.all([
                        PriceListService.get(editId),
                        EmployeeService.getAll()
                    ]);
                    
                    logger.info('✅ Base Price List fetched:', data);

                    // Step 2: Hydrate Customer information
                    const customerIdNum = Number(data.customer_id || data.customer_code || 0);
                    const customer = customerIdNum ? await CustomerService.getById(customerIdNum) : null;
                    
                    // Step 3: Resolve Recorder and Approver names from employee list with fallback matching
                    const recorder = (employees as (IEmployee & { employee_id?: number | string })[]).find(
                        e => Number(e.id) === Number(data.save_emp_id) || Number(e.employee_id) === Number(data.save_emp_id)
                    );
                    const approver = (employees as (IEmployee & { employee_id?: number | string })[]).find(
                        e => Number(e.id) === Number(data.permit_emp_id) || Number(e.employee_id) === Number(data.permit_emp_id)
                    );

                    const resolveEmpName = (emp: (Partial<IEmployee> & { employee_id?: number | string; employee_name?: string; employee_fullname?: string; employee_firstname_th?: string; employee_lastname_th?: string; employee_code?: string; first_name?: string; last_name?: string }) | undefined) => {
                        if (!emp) return '';
                        if (typeof emp.employee_name === 'string') return emp.employee_name;
                        if (typeof emp.employee_fullname === 'string') return emp.employee_fullname;
                        if (typeof emp.employee_firstname_th === 'string') {
                            return `${emp.employee_firstname_th} ${typeof emp.employee_lastname_th === 'string' ? emp.employee_lastname_th : ''}`.trim();
                        }
                        if (typeof emp.first_name === 'string') {
                            return `${emp.first_name} ${typeof emp.last_name === 'string' ? emp.last_name : ''}`.trim();
                        }
                        return String(emp.employee_code || '');
                    };

                    // Step 4: Hydrate Item Details for the table (Codes and Names)
                    const rawLines = data.priceListItemLines || data.price_list_lines || data.items || [];
                    const hydratedItems = await Promise.all(rawLines.map(async (line) => {
                        const itmId = Number(line.item_id || 0);
                        const uomId = Number(line.uom_id || 0);
                        
                        // Fetch item and unit details in parallel for each row
                        const [itemDetail, unitDetail] = await Promise.all([
                            itmId ? ItemMasterService.getById(itmId) : Promise.resolve(null),
                            uomId ? UOMService.get(uomId) : Promise.resolve(null)
                        ]);

                        return {
                            priceListItemId: String(line.price_list_item_id || ''),
                            itemId: String(itmId),
                            uomId: String(uomId),
                            unitPrice: Number(line.unit_price || 0),
                            lineDiscount: line.line_discount_rate || Number(line.line_discount || 0),
                            lineDiscountAmnt: Number(line.line_discount_amount || line.line_discount_amnt || 0),
                            unitPriceNet: Number(line.unit_price_net || 0),
                            remark: line.remarks || line.remark || '',
                            itemCode: itemDetail?.item_code || line.item_code || '',
                            itemName: itemDetail?.item_name || line.item_name || '',
                            uomName: unitDetail?.uom_name || unitDetail?.uom_name || line.uom_name || '-'
                        };
                    }));

                    // Step 5: Reset form with fully hydrated information
                    reset({
                        priceListNo: data.price_list_no,
                        priceListName: data.price_list_name,
                        priceListDate: data.price_list_date?.split('T')[0],
                        isActive: data.is_active,
                        beginDate: data.begin_date ? data.begin_date.split('T')[0] : null,
                        endDate: data.end_date ? data.end_date.split('T')[0] : null,
                        branchId: String(data.branch_id || ''),
                        customerId: String(customerIdNum || ''),
                        customerCode: customer?.customer_code || String(customerIdNum || ''),
                        customerName: customer?.customer_name_th || customer?.customer_name || data.customer_name || '',
                        empDeptId: String(data.emp_dept_id || ''),
                        itemBrandId: String(data.item_brand_id || ''),
                        itemId: String(data.item_id || ''),
                        permitEmpId: String(data.permit_emp_id || ''),
                        permitEmpName: resolveEmpName(approver),
                        saveEmpId: String(data.save_emp_id || ''),
                        saveEmpName: resolveEmpName(recorder),
                        customerGroupId: String(data.customer_group_id || ''),
                        remark: data.remark || '',
                        priceListFlag: data.price_list_flag === 'A' ? '+' : data.price_list_flag === 'S' ? '-' : null,
                        items: hydratedItems,
                    });
                } catch (error) {
                    logger.error('Failed to fetch price list detail:', error);
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
    }, [editId, reset, user, isOpen]);

    const onSubmit: SubmitHandler<FormValues> = async (formData) => {
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
            } satisfies PriceListFormData;

            logger.debug('📝 Form Submission Data:', submissionData);

            const result = editId 
                ? await PriceListService.update(editId, submissionData)
                : await PriceListService.create(submissionData);
            
            if (result.success) {
                toast.success(editId ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มข้อมูลสำเร็จ');
                if (onSuccess) onSuccess();
            } else {
                toast.error(result.message || 'บันทึกไม่สำเร็จ');
            }
        } catch (error) {
            logger.error('Submit error:', error);
            toast.error('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    const onInvalid = (errors: FieldErrors<FormValues>) => {
        logger.warn('Form Validation Errors:', errors);
        const firstErrorField = Object.keys(errors)[0] as keyof FormValues;
        if (firstErrorField) {
            const error = errors[firstErrorField] as { message?: string };
            const message = error?.message || `กรุณตรวจสอบฟิลด์ ${String(firstErrorField)}`;
            toast.error(message);
        }
    };

    const onSubmitWithValidation = handleSubmit(onSubmit, onInvalid);

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

    const handleItemChange = <K extends keyof ItemValues>(
        index: number, 
        field: K, 
        value: ItemValues[K]
    ) => {
        // Use Path casting instead of any to satisfy TS and RHF requirements
        const path = `items.${index}.${field}` as Path<FormValues>;
        setValue(path, value as PathValue<FormValues, Path<FormValues>>, { 
            shouldDirty: true,
            shouldValidate: true // 🚀 Force validation to trigger duplicate check immediately
        });
        
        if (field === 'unitPrice' || field === 'lineDiscount') {
            const items = getValues('items');
            const item = items[index];
            const unitPrice = field === 'unitPrice' ? (parseFloat(String(value)) || 0) : (Number(item.unitPrice) || 0);
            const lineDiscount = field === 'lineDiscount' ? String(value) : String(item.lineDiscount);
            const { discountAmnt, unitPriceNet } = calculateNetPrice(unitPrice, lineDiscount);
            
            // Limit to reasonable ERP values to prevent UI overflow bugs
            const safeNet = Math.max(0, Math.min(unitPriceNet, 999999999999.99));
            const safeDisc = Math.max(0, Math.min(discountAmnt, unitPrice));
            
            setValue(`items.${index}.lineDiscountAmnt` as Path<FormValues>, safeDisc as PathValue<FormValues, Path<FormValues>>, { shouldDirty: true, shouldValidate: true });
            setValue(`items.${index}.unitPriceNet` as Path<FormValues>, safeNet as PathValue<FormValues, Path<FormValues>>, { shouldDirty: true, shouldValidate: true });
        }
    };

    return {
        register,
        handleSubmit: onSubmitWithValidation,
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
