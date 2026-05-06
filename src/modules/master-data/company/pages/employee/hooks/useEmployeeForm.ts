/**
 * @file useEmployeeForm.ts
 * @description Hook for managing Employee form logic with React Query and React Hook Form
 */

import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, type SubmitHandler, type Resolver, useWatch, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OrgEmployeeService } from '@company/services/employee.service';
import { EmployeeDeptService } from '@company/services/employee-dept.service';
import { PositionService } from '@company/services/org-position.service';
import { EmployeeGroupService } from '@company/services/employee-group.service';
import type { EmployeeFormData, EmployeeSignature } from '@company/types/employee.types';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { logger } from '@/shared/utils';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import React from 'react';

export const employeeSchema = z.object({
    // ข้อมูลพื้นฐาน
    employeeCode:   z.string().min(1, 'กรุณากรอกรหัสพนักงาน').max(25, 'รหัสพนักงานต้องไม่เกิน 25 ตัวอักษร'),
    taxIdCard:      z.string().min(1, 'กรุณากรอกเลขประจำตัวประชาชน').max(25).regex(/^\d+$/, 'กรุณากรอกเฉพาะตัวเลข'),
    empTitle:       z.string().min(1, 'กรุณาเลือกคำนำหน้า').max(50),
    empTitleEng:    z.string().max(255).or(z.literal('')),
    empName:        z.string().min(1, 'กรุณากรอกชื่อพนักงาน').max(255),
    empNameEng:     z.string().max(255).or(z.literal('')),
    tel:            z.string().min(1, 'กรุณากรอกเบอร์โทรศัพท์').max(255).regex(/^\d+$/, 'กรุณากรอกเฉพาะตัวเลข'),
    email:          z.string().email('รูปแบบอีเมลไม่ถูกต้อง').or(z.literal('')),

    // ที่อยู่
    address:        z.string().min(1, 'กรุณากรอกที่อยู่').max(5000),
    district:       z.string().min(1, 'กรุณากรอกตำบล').max(100),
    amphur:         z.string().min(1, 'กรุณากรอกอำเภอ').max(100),
    province:       z.string().min(1, 'กรุณากรอกจังหวัด').max(100),
    postCode:       z.string().min(1, 'กรุณากรอกรหัสไปรษณีย์').max(25).regex(/^\d+$/, 'กรุณากรอกเฉพาะตัวเลข'),

    // ข้อมูลองค์กร
    deptId:         z.string().min(1, 'กรุณาเลือกแผนก'),
    deptCode:       z.string().max(25).or(z.literal('')),
    postId:         z.string().min(1, 'กรุณาเลือกตำแหน่ง'),
    positionCode:   z.string().max(25).or(z.literal('')),
    empGroupId:     z.string().min(1, 'กรุณาเลือกกลุ่มพนักงาน'),
    empGroupCode:   z.string().max(25).or(z.literal('')),
    empHead:        z.string().or(z.literal('')),
    empHeadCode:    z.string().max(25).or(z.literal('')),
    empType:        z.string().or(z.literal('')),
    taxId:          z.string().max(25).or(z.literal('')),

    // วันที่สำคัญ
    empStartDate:   z.string().or(z.literal('')),
    empResignDate:  z.string().or(z.literal('')),
    empStatus:      z.string().or(z.literal('')),

    // อื่นๆ
    empSignature:   z.string().max(255).or(z.literal('')),
    signatures:     z.array(z.object({
        emp_signature_id: z.number().optional(),
        emp_id:         z.number().optional(),
        signature_url:  z.string(),
        signature_name: z.string().optional(),
        is_active:      z.boolean().default(true),
        is_deleted:     z.boolean().default(false),
        file:           z.any().optional(),
        previewUrl:     z.string().optional(),
    })).optional(),
    remark:         z.string().max(255).or(z.literal('')),

    // Legacy (compat)
    firstName:      z.string().or(z.literal('')),
    lastName:       z.string().or(z.literal('')),
    positionId:     z.number(),
    sideId:         z.union([z.string(), z.number()]),
    isActive:       z.boolean(),
});

export const initialEmployeeData: EmployeeFormData = {
    employeeCode: '',
    taxIdCard: '',
    empTitle: '',
    empTitleEng: '',
    empName: '',
    empNameEng: '',
    tel: '',
    email: '',
    address: '',
    district: '',
    amphur: '',
    province: '',
    postCode: '',
    deptId: '',
    deptCode: '',
    postId: '',
    positionCode: '',
    empGroupId: '',
    empGroupCode: '',
    empHead: '',
    empHeadCode: '',
    empType: 'G',
    taxId: '',
    empStartDate: '',
    empResignDate: '',
    empStatus: '1',
    empSignature: '',
    signatures: [],
    remark: '',
    // Legacy
    firstName: '',
    lastName: '',
    positionId: 0,
    sideId: 0,
    isActive: true,
};

export function useEmployeeForm(editId: number | null, isOpen: boolean, onSuccess?: () => void) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const isEdit = !!editId;

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        setValue,
        control,
        setError,
        clearErrors,
        formState: { errors }
    } = useForm<EmployeeFormData>({
        resolver: zodResolver(employeeSchema) as Resolver<EmployeeFormData>,
        defaultValues: initialEmployeeData,
    });

    const { fields: signatureFields, append: appendSignature, remove: removeSignature } = useFieldArray({
        control,
        name: 'signatures'
    });

    // Fetch dependencies
    const { data: deptsData } = useQuery({
        queryKey: ['employee-departments-dropdown'],
        queryFn: () => EmployeeDeptService.getList({ page: 1, limit: 1000 }),
        enabled: isOpen,
    });

    const { data: positionsData } = useQuery({
        queryKey: ['positions-dropdown'],
        queryFn: () => PositionService.getList({ page: 1, limit: 1000 }),
        enabled: isOpen,
    });

    const { data: empGroupsData } = useQuery({
        queryKey: ['employee-groups-dropdown'],
        queryFn: () => EmployeeGroupService.getList({ page: 1, limit: 1000 }),
        enabled: isOpen,
    });

    const { data: headsData } = useQuery({
        queryKey: ['employees-head-dropdown'],
        queryFn: () => OrgEmployeeService.getList({ page: 1, limit: 1000 }),
        enabled: isOpen,
    });

    const departments = useMemo(() => (deptsData?.items || []).filter(item => item.is_active !== false), [deptsData]);
    const positions = useMemo(() => (positionsData || []).filter(item => item.is_active !== false), [positionsData]);
    const employeeGroups = useMemo(() => (empGroupsData?.items || []).filter(item => item.is_active !== false), [empGroupsData]);
    const heads = useMemo(() => (headsData?.items || []).filter(item => item.is_active !== false), [headsData]);
    
    // Real-time Duplicate Check
    const codeValue = useWatch({ control, name: 'employeeCode' });
    const debouncedCode = useDebounce(codeValue, 500);

    useEffect(() => {
        const checkDuplicate = async () => {
            if (!debouncedCode || isEdit) {
                if (!isEdit) clearErrors('employeeCode');
                return;
            }
            
            try {
                // ค้นหาพนักงานที่มีรหัสตรงกัน
                const res = await OrgEmployeeService.getList({ search: debouncedCode });
                const isDuplicate = res.items.some(emp => emp.employee_code === debouncedCode);
                
                if (isDuplicate) {
                    setError('employeeCode', { 
                        type: 'manual', 
                        message: 'รหัสพนักงานนี้มีอยู่ในระบบแล้ว' 
                    });
                } else {
                    // ตรวจสอบว่าไม่มี error อื่น (เช่น min length) ก่อน clear
                    if (debouncedCode.length >= 1 && debouncedCode.length <= 25) {
                        clearErrors('employeeCode');
                    }
                }
            } catch (error) {
                logger.error('Error checking duplicate employee code:', error);
            }
        };

        void checkDuplicate();
    }, [debouncedCode, isEdit, setError, clearErrors]);

    // Fetch data for edit
    const { data: initialData } = useQuery({
        queryKey: ['employee', editId],
        queryFn: () => (editId ? OrgEmployeeService.get(editId) : null),
        enabled: isOpen && isEdit && !!editId,
    });

    // Hydrate form when data is fetched
    useEffect(() => {
        if (isOpen && isEdit && initialData) {
            // หลีกเลี่ยง any โดยใช้ unknown cast ก่อนแปลงเป็น Record
            const d = initialData as unknown as Record<string, unknown>;
            reset({
                employeeCode:  (d['emp_code'] as string)         || (d['employee_code'] as string) || '',
                taxIdCard:     (d['tax_idcard'] as string)        || '',
                empTitle:      (d['emp_title'] as string)         || '',
                empTitleEng:   (d['emp_titleeng'] as string)      || '',
                empName:       (d['emp_name'] as string)          || (d['employee_name'] as string) || '',
                empNameEng:    (d['emp_nameeng'] as string)       || '',
                tel:           (d['tel'] as string)               || (d['phone'] as string) || '',
                email:         (d['email'] as string)             || '',
                address:       (d['address'] as string)           || '',
                district:      (d['district'] as string)          || '',
                amphur:        (d['amphur'] as string)            || '',
                province:      (d['province'] as string)          || '',
                postCode:      (d['post_code'] as string)         || '',
                deptId:        String(d['dept_id'] || ''),
                deptCode:      (d['dept_code'] as string)         || '',
                postId:        String(d['post_id'] || ''),
                positionCode:  (d['position_code'] as string)     || '',
                empGroupId:    String(d['emp_group_id'] || ''),
                empGroupCode:  (d['emp_group_code'] as string)    || '',
                empHead:       String(d['emp_head'] || ''),
                empHeadCode:   (d['emp_head_code'] as string)     || '',
                empType:       (d['emp_type'] as string)          || 'G',
                taxId:         (d['tax_id'] as string)            || '',
                empStartDate:  (d['emp_startdate'] as string)     || '',
                empResignDate: (d['emp_resigndate'] as string)    || '',
                empStatus:     String(d['emp_status'] ?? '1'),
                empSignature:  (d['emp_signature'] as string)     || '',
                signatures:    ((d['signatures'] as EmployeeSignature[]) || []).map(s => ({
                    ...s,
                    previewUrl: s.signature_url // ใช้ url เป็น preview เบื้องต้น
                })),
                remark:        (d['remark'] as string)            || '',
                // Legacy
                firstName:     (d['first_name'] as string)        || '',
                lastName:      (d['last_name'] as string)         || '',
                positionId:    Number(d['position_id'] || 0),
                sideId:        (d['side_id'] || d['department_id'] || 0) as string | number,
                isActive:      d['is_active'] !== undefined ? Boolean(d['is_active']) : true,
            });
        } else if (isOpen && !isEdit) {
            reset(initialEmployeeData);
        }
    }, [isOpen, isEdit, initialData, reset]);

    const saveMutation = useMutation({
        mutationFn: async (data: EmployeeFormData) => {
            if (isEdit && editId) {
                return OrgEmployeeService.update(editId, data);
            }
            return OrgEmployeeService.create(data);
        },
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ['employees'] });
                if (onSuccess) onSuccess();
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: (error: Error) => {
            logger.error('Error saving employee:', error);
        }
    });

    // --- Signature Mutations (Immediate Upload/Delete) ---
    const uploadSignatureMutation = useMutation({
        mutationFn: async ({ file }: { file: File }) => {
            if (!editId) throw new Error('พนักงานต้องถูกบันทึกก่อนจัดการลายเซ็นต์');
            return OrgEmployeeService.uploadSignature(editId, file);
        },
        onSuccess: (res) => {
            if (res.success && res.data) {
                appendSignature({
                    emp_signature_id: res.data.emp_signature_id,
                    signature_url: res.data.signature_url,
                    previewUrl: res.data.signature_url,
                    is_active: true,
                    is_deleted: false
                });
                queryClient.invalidateQueries({ queryKey: ['employee', editId] });
            }
        }
    });

    const deleteSignatureMutation = useMutation({
        mutationFn: async ({ signatureId }: { signatureId: number }) => {
            if (!editId) return;
            return OrgEmployeeService.deleteSignature(editId, signatureId);
        },
        onSuccess: (res, variables) => {
            if (res?.success) {
                const index = signatureFields.findIndex(f => f.emp_signature_id === variables.signatureId);
                if (index !== -1) removeSignature(index);
                queryClient.invalidateQueries({ queryKey: ['employee', editId] });
            }
        }
    });

    const handleSave: SubmitHandler<EmployeeFormData> = async (data) => {
        // บันทึกเฉพาะข้อมูลพนักงานหลัก (ตามคำแนะนำ Backend)
        // ลายเซ็นต์จะถูกจัดการแยกต่างหากผ่านปุ่ม Upload ในโหมดแก้ไข
        const { signatures: _signatures, ...employeeData } = data;
        void _signatures; // Destructured to exclude from employeeData payload
        saveMutation.mutate(employeeData as EmployeeFormData);
    };

    const onInvalidSubmit = (invalidErrors: FieldErrors<EmployeeFormData>) => {
        logger.error('Validation Errors:', invalidErrors);

        // 1. 🎯 Auto-Scroll to first error field
        const firstErrorKey = Object.keys(invalidErrors)[0];
        if (firstErrorKey) {
            // Try to find element by name attribute
            const errorElement = document.getElementsByName(firstErrorKey)[0] || 
                               document.querySelector(`[name="${firstErrorKey}"]`);
            
            if (errorElement) {
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if ('focus' in errorElement) (errorElement as HTMLElement).focus();
            }
        }

        // 2. 📝 Human-friendly Error Summary
        const extractMessages = (errs: Record<string, unknown>): string[] => {
            let messages: string[] = [];
            for (const key in errs) {
                const error = errs[key];
                if (error && typeof error === 'object') {
                    const errObj = error as Record<string, unknown>;
                    if (typeof errObj.message === 'string') {
                        messages.push(errObj.message);
                    } else {
                        messages = messages.concat(extractMessages(errObj));
                    }
                }
            }
            return Array.from(new Set(messages));
        };

        const errorMessages = extractMessages(invalidErrors as unknown as Record<string, unknown>);

        if (errorMessages.length > 0) {
            const ErrorToastUI = () => React.createElement('div', { className: 'flex flex-col gap-1 text-left' },
                React.createElement('span', { className: 'font-semibold text-sm' }, 'พบข้อมูลไม่ถูกต้อง:'),
                React.createElement('ul', { className: 'list-disc pl-4 text-xs' },
                    errorMessages.map((msg: string, i: number) => React.createElement('li', { key: i }, msg))
                )
            );
            toast(React.createElement(ErrorToastUI) as React.ReactNode, 'error');
        } else {
            toast('กรุณาตรวจสอบข้อมูลที่ระบุให้ครบถ้วน', 'error');
        }
    };

    return {
        register,
        errors,
        departments,
        positions,
        employeeGroups,
        heads,
        signatureFields,
        isSubmitting: saveMutation.isPending,
        isUploading: uploadSignatureMutation.isPending,
        isDeleting: deleteSignatureMutation.isPending,
        handleSave: rhfHandleSubmit(handleSave, onInvalidSubmit),
        handleUploadSignature: (file: File) => uploadSignatureMutation.mutate({ file }),
        handleDeleteSignature: (signatureId: number) => deleteSignatureMutation.mutate({ signatureId }),
        removeSignature, // เก็บไว้สำหรับเคสลบ local (ถ้ามี)
        setValue,
        reset,
        control
    };
}
