/**
 * @file useStandardCostForm.ts
 * @description Hook for managing Standard Cost Form logic
 */

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { StandardCostService } from '../services/standard-cost.service';
import type { StandardCostFormData, StandardCostLineFormData } from '../types/standard-cost.types';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { logger } from '@/shared/utils/logger';

export const useStandardCostForm = (editId: number | null, onSuccess: () => void, isOpen: boolean) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<StandardCostFormData>({
        defaultValues: {
            costCode: '',
            costName: '',
            startDate: new Date().toISOString().split('T')[0],
            expireDate: '',
            remarks: '',
            isActive: true,
            itemBrandId: null,
            itemId: null,
            permitEmpId: null,
            saveEmpId: user?.id || null, 
            docuDate: new Date().toISOString().split('T')[0],
            lines: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'lines'
    });

    // Reset when modal opens or editId changes
    useEffect(() => {
        if (isOpen) {
            if (editId) {
                const fetchDetail = async () => {
                    setIsLoading(true);
                    try {
                        const response = await StandardCostService.get(editId);
                        if (response) {
                            // Map API snake_case to Form camelCase
                            reset({
                                costId: response.cost_id,
                                costCode: response.cost_code,
                                costName: response.cost_name,
                                startDate: response.start_date,
                                expireDate: response.expire_date,
                                remarks: response.remarks,
                                isActive: response.is_active,
                                itemBrandId: response.item_brand_id,
                                itemId: response.item_id,
                                permitEmpId: response.permit_emp_id,
                                saveEmpId: response.save_emp_id || user?.id || null,
                                docuDate: response.docu_date,
                                lines: [] // response.lines mapping logic
                            });
                        }
                    } catch (error) {
                        logger.error('Failed to fetch detail:', error);
                    } finally {
                        setIsLoading(false);
                    }
                };
                fetchDetail();
            } else {
                reset({
                    costCode: '',
                    costName: '',
                    startDate: new Date().toISOString().split('T')[0],
                    expireDate: '',
                    remarks: '',
                    isActive: true,
                    itemBrandId: null,
                    itemId: null,
                    permitEmpId: null,
                    saveEmpId: user?.id || null,
                    docuDate: new Date().toISOString().split('T')[0],
                    lines: []
                });
            }
        }
    }, [isOpen, editId, reset, user]);

    const onSubmit = async (data: StandardCostFormData) => {
        try {
            let result;
            if (editId) {
                result = await StandardCostService.update(editId, data);
            } else {
                result = await StandardCostService.create(data);
            }

            if (result.success) {
                alert('บันทึกข้อมูลเรียบร้อยแล้ว');
                onSuccess();
            } else {
                alert(result.message || 'บันทึกไม่สำเร็จ');
            }
        } catch (error) {
            logger.error('Submit error:', error);
            alert('ชื่อมต่อเซิร์ฟเวอร์ผิดพลาด');
        }
    };

    const addLine = (line: StandardCostLineFormData) => {
        append(line);
    };

    return {
        register,
        handleSubmit: handleSubmit(onSubmit),
        errors,
        isSubmitting,
        isLoading,
        fields,
        addLine,
        removeLine: remove,
        setValue,
        watch,
        control,
        user
    };
};
