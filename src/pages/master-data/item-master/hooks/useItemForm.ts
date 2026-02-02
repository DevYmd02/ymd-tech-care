import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import Swal from 'sweetalert2';
import { logger } from '@utils/logger';
import { ItemMasterService } from '@/services/ItemMasterService';
import { ITEM_CATEGORIES, ITEM_UOMS } from '@/constants';

// Zod Schema for Item Master
export const itemMasterSchema = z.object({
    item_code: z.string().min(1, 'กรุณากรอกรหัสสินค้า'),
    item_name: z.string().min(1, 'กรุณากรอกชื่อสินค้า'),
    item_name_en: z.string().optional().default(''),
    marketing_name: z.string().optional().default(''),
    billing_name: z.string().optional().default(''),
    category_id: z.string().optional().default(''),
    good_class_id: z.string().optional().default(''),
    good_brand_id: z.string().optional().default(''),
    good_pattern_id: z.string().optional().default(''),
    good_design_id: z.string().optional().default(''),
    good_size_id: z.string().optional().default(''),
    good_model_id: z.string().optional().default(''),
    good_grade_id: z.string().optional().default(''),
    good_color_id: z.string().optional().default(''),
    base_uom_id: z.string().min(1, 'กรุณากรอกหน่วยนับหลัก'),
    item_type_code: z.string().optional().default(''),
    costing_method: z.string().optional().default(''),
    default_tax_code: z.string().optional().default('VAT7'),
    tax_rate: z.number().optional().default(7),
    barcode: z.string().optional().default(''),
    is_active: z.boolean().default(true),
    is_on_hold: z.boolean().optional().default(false),
    nature_id: z.string().optional().default(''),
    product_subtype_id: z.string().optional().default(''),
    commission_type: z.string().optional().default(''),
    std_amount: z.number().optional().default(0),
    discount_amount: z.string().optional().default(''),
    is_buddy: z.boolean().optional().default(false),
});

// Derived Type using z.infer
export type ItemFormData = z.infer<typeof itemMasterSchema>;

// Strict Change Handler Type
export type ItemFormChangeHandler = (field: keyof ItemFormData, value: string | number | boolean) => void;

const initialFormData: ItemFormData = {
    item_code: '',
    item_name: '',
    item_name_en: '',
    marketing_name: '',
    billing_name: '',
    category_id: '',
    good_class_id: '',
    good_brand_id: '',
    good_pattern_id: '',
    good_design_id: '',
    good_size_id: '',
    good_model_id: '',
    good_grade_id: '',
    good_color_id: '',
    base_uom_id: '',
    item_type_code: '',
    costing_method: '',
    default_tax_code: 'VAT7',
    tax_rate: 7,
    barcode: '',
    is_active: true,
    is_on_hold: false,
    nature_id: '',
    product_subtype_id: '',
    commission_type: '',
    std_amount: 0,
    discount_amount: '',
    is_buddy: false,
};

/**
 * Custom Hook for Item Master Form Logic
 */
export function useItemForm(editId: string | null) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<ItemFormData>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof ItemFormData, string>>>({});

    // Load data if editing
    useEffect(() => {
        if (editId) {
            const loadData = async () => {
                try {
                    const existing = await ItemMasterService.getById(editId);
                    if (existing) {
                        // Reverse Lookup for Dropdowns (Name -> ID) to match legacy logic
                        const categoryId = ITEM_CATEGORIES.find(c => (existing.category_name || '').includes(c.name))?.id || '';
                        const unitName = (existing.unit_name || '').split(' (')[0];
                        const unitId = ITEM_UOMS.find(u => u.name === unitName)?.id || '';

                        setFormData({
                            item_code: existing.item_code,
                            item_name: existing.item_name,
                            item_name_en: existing.item_name_en || '',
                            marketing_name: existing.marketing_name || '',
                            billing_name: existing.billing_name || '',
                            category_id: categoryId,
                            base_uom_id: unitId,
                            item_type_code: existing.item_type_code || 'FG',
                            product_subtype_id: 'NORMAL',
                            costing_method: '',
                            commission_type: 'NONE',
                            nature_id: 'LOT',
                            is_active: existing.is_active,
                            std_amount: existing.standard_cost || 0,
                            good_brand_id: '',
                            good_class_id: '',
                            good_pattern_id: '',
                            good_design_id: '',
                            good_grade_id: '',
                            good_model_id: '',
                            good_size_id: '',
                            good_color_id: '',
                            default_tax_code: 'VAT7',
                            tax_rate: 7,
                            barcode: '',
                            discount_amount: '',
                            is_buddy: false,
                            is_on_hold: false
                        });
                    }
                } catch (error) {
                    logger.error('Failed to load item data:', error);
                }
            };
            loadData();
        } else {
            setFormData(initialFormData);
        }
    }, [editId]);

    const handleInputChange: ItemFormChangeHandler = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [errors]);

    const validate = (): boolean => {
        try {
            itemMasterSchema.parse(formData);
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Partial<Record<keyof ItemFormData, string>> = {};
                error.issues.forEach(issue => {
                    const path = issue.path[0] as keyof ItemFormData;
                    newErrors[path] = issue.message;
                });
                setErrors(newErrors);
                
                // Show first error message in saveError for visibility
                const firstError = error.issues[0]?.message;
                if (firstError) {
                    setSaveError(firstError);
                    setTimeout(() => setSaveError(null), 3000);
                }
            }
            return false;
        }
    };

    const handleSave = async () => {
        if (!validate()) return;

        const result = await Swal.fire({
            title: editId ? 'ยืนยันการแก้ไข?' : 'ยืนยันการบันทึก?',
            text: editId ? 'ข้อมูลสินค้าจะถูกแก้ไขในระบบ' : 'ข้อมูลสินค้าจะถูกบันทึกในระบบ',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: editId ? 'บันทึกการแก้ไข (Update)' : 'บันทึก (Save)',
            cancelButtonText: 'ยกเลิก (Cancel)',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            background: '#1f2937',
            color: '#ffffff'
        });

        if (!result.isConfirmed) return;

        setIsSaving(true);
        setSaveError(null);

        try {
            if (editId) {
                await ItemMasterService.update(editId, formData);
            } else {
                await ItemMasterService.create(formData);
            }
            
            await Swal.fire({
                icon: 'success',
                title: 'บันทึกสำเร็จ!',
                text: 'ระบบได้ทำการบันทึกข้อมูลเรียบร้อยแล้ว',
                timer: 1500,
                showConfirmButton: false,
                background: '#1f2937',
                color: '#ffffff'
            });
            
            navigate('/master-data?tab=item');
        } catch (error) {
            logger.error('Save item error:', error);
            setSaveError('เกิดข้อผิดพลาดในการบันทึก');
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
                background: '#1f2937',
                color: '#ffffff'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFind = () => {
        const newId = prompt("Enter Item Code/ID to switch to:");
        if (newId) {
            navigate(`/master-data/item-form?id=${newId}`);
        }
    };

    return {
        formData,
        isSaving,
        saveError,
        errors,
        handleInputChange,
        handleSave,
        handleFind
    };
}
