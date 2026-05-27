/**
 * @file useEmployeeForm.ts
 * @description Hook for managing Employee form logic with React Query and React Hook Form
 */

import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, type SubmitHandler, type Resolver, useWatch, type FieldErrors, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OrgEmployeeService } from '@company/services/employee.service';
import { EmployeeDeptService } from '@company/services/employee-dept.service';
import { PositionService } from '@company/services/org-position.service';
import { EmployeeGroupService } from '@company/services/employee-group.service';
import { BranchService } from '@company/services/org-branch.service';
import api from '@/core/api/api';
import { type AxiosError } from 'axios';
import type { EmployeeFormData, EmployeeAddress, EmployeeMaster } from '@company/types/employee.types';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { logger } from '@/shared/utils';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import React from 'react';

export const employeeSchema = z.object({
    // ข้อมูลพื้นฐาน
    branch_id:             z.number({ message: 'กรุณาเลือกสาขา' }),
    employee_code:         z.string().trim().min(1, 'กรุณากรอกรหัสพนักงาน').max(25, 'รหัสพนักงานต้องไม่เกิน 25 ตัวอักษร'),
    employee_title_th:     z.string().min(1, 'กรุณาเลือกคำนำหน้า (ไทย)').max(50),
    employee_title_en:     z.string().max(255).or(z.literal('')),
    employee_firstname_th: z.string().min(1, 'กรุณากรอกชื่อ (ไทย)').max(200),
    employee_lastname_th:  z.string().min(1, 'กรุณากรอกนามสกุล (ไทย)').max(200),
    employee_firstname_en: z.string().max(200).or(z.literal('')),
    employee_lastname_en:  z.string().max(200).or(z.literal('')),
    
    phone:                 z.string().min(1, 'กรุณากรอกเบอร์โทรศัพท์').max(255).regex(/^\d+$/, 'กรุณากรอกเฉพาะตัวเลข'),
    email:                 z.string().email('รูปแบบอีเมลไม่ถูกต้อง').or(z.literal('')),
    tax_id:                z.string().max(13, 'เลขประจำตัวผู้เสียภาษีต้องไม่เกิน 13 หลัก').or(z.literal('')),

    // ที่อยู่ (Array)
    addresses: z.array(z.object({
        address_type:   z.string().min(1, 'กรุณาเลือกประเภทที่อยู่'),
        address:        z.string().min(1, 'กรุณากรอกที่อยู่'),
        sub_district:   z.string().max(255).or(z.literal('')).optional(),
        district:       z.string().min(1, 'กรุณากรอกอำเภอ'),
        province:       z.string().min(1, 'กรุณากรอกจังหวัด'),
        postal_code:    z.string().min(1, 'กรุณากรอกรหัสไปรษณีย์'),
        country:        z.string().min(1, 'กรุณากรอกประเทศ'),
        contact_person: z.string().max(255).or(z.literal('')),
    })),

    // ข้อมูลองค์กร
    emp_dept_id:      z.number({ message: 'กรุณาเลือกแผนก' }),
    position_id:      z.number({ message: 'กรุณาเลือกตำแหน่ง' }),
    employee_head_id: z.number().nullable(),
    emp_type:         z.string().or(z.literal('')),

    // วันที่สำคัญ
    employee_startdate:   z.string().min(1, 'กรุณาเลือกวันที่เริ่มงาน'),
    employee_resigndate:  z.string().nullable().or(z.literal('')),
    employee_status:      z.number().default(1),

    // อื่นๆ
    is_active:      z.boolean().default(true),
    remark:         z.string().max(255).or(z.literal('')),
});

export const userAccountSchema = z.object({
    username: z.string().min(4, 'Username ต้องมีอย่างน้อย 4 ตัวอักษร').max(50),
    password: z.string().min(6, 'Password ต้องมีอย่างน้อย 6 ตัวอักษร'),
    confirmPassword: z.string().min(6, 'กรุณายืนยันรหัสผ่าน'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
});

export type UserAccountFormData = z.infer<typeof userAccountSchema>;

export const initialEmployeeData: EmployeeFormData = {
    branch_id: null as unknown as number, // Force null for default selection
    employee_code: '',
    employee_title_th: '',
    employee_title_en: '',
    employee_firstname_th: '',
    employee_lastname_th: '',
    employee_firstname_en: '',
    employee_lastname_en: '',
    employee_startdate: '',
    employee_resigndate: null,
    employee_status: 1,
    phone: '',
    email: '',
    remark: '',
    tax_id: '',
    emp_type: 'G',
    position_id: null,
    emp_dept_id: null,
    is_active: true,
    employee_head_id: null,
    addresses: [
        {
            address_type: 'CONTACT',
            address: '',
            district: '',
            province: '',
            postal_code: '',
            country: '',
            contact_person: ''
        }
    ],
};

import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard';

const FIELD_MAP: Record<string, string> = {
    email: 'อีเมล',
    phone: 'เบอร์โทรศัพท์',
    username: 'ชื่อผู้ใช้งาน',
    password: 'รหัสผ่าน',
    employee_code: 'รหัสพนักงาน',
    branch_id: 'สาขา',
    emp_dept_id: 'แผนก',
    position_id: 'ตำแหน่ง',
    employee_startdate: 'วันที่เริ่มงาน',
    tax_id: 'เลขประจำตัวผู้เสียภาษี',
};

function translateError(msg: unknown): string {
    if (!msg) return 'ข้อมูลไม่ถูกต้อง';
    
    const translateSingle = (str: string): string => {
        const lowerStr = str.toLowerCase();
        // Intercept duplicate or internal database constraint/server errors
        if (lowerStr.includes('internal server error') || lowerStr.includes('duplicate') || lowerStr.includes('unique') || lowerStr.includes('ซ้ำ')) {
            return 'รหัสพนักงานซ้ำในระบบ';
        }
        // Intercept selection type/constraint errors and return localized select messages directly
        if (lowerStr.includes('conforming to the specified constraints') || lowerStr.includes('must be a number')) {
            if (lowerStr.includes('position')) {
                return 'กรุณาเลือกตำแหน่ง';
            }
            if (lowerStr.includes('dept') || lowerStr.includes('department')) {
                return 'กรุณาเลือกแผนก';
            }
            if (lowerStr.includes('branch')) {
                return 'กรุณาเลือกสาขา';
            }
            if (lowerStr.includes('head')) {
                return 'กรุณาเลือกผู้บังคับบัญชา';
            }
        }

        let res = str;
        // Translate phrases
        res = res.replace(/must be shorter than or equal to (\d+) characters/gi, 'ต้องมีขนาดไม่เกิน $1 ตัวอักษร');
        res = res.replace(/must be longer than or equal to (\d+) characters/gi, 'ต้องมีขนาดอย่างน้อย $1 ตัวอักษร');
        res = res.replace(/must be an email/gi, 'รูปแบบอีเมลไม่ถูกต้อง');
        res = res.replace(/should not be empty/gi, 'กรุณาระบุข้อมูล');
        res = res.replace(/must be a number/gi, 'ต้องเป็นตัวเลข');
        res = res.replace(/must be a string/gi, 'ต้องเป็นข้อความ');
        
        // Translate fields
        Object.entries(FIELD_MAP).forEach(([eng, thai]) => {
            const regex = new RegExp(`\\b${eng}\\b`, 'gi');
            res = res.replace(regex, thai);
        });
        
        return res;
    };

    if (Array.isArray(msg)) {
        return msg.map(item => translateSingle(String(item))).join(', ');
    }
    
    if (typeof msg === 'string') {
        if (msg.includes(',') || msg.includes('.')) {
            const parts = msg.split(/[.,]/).map(p => p.trim()).filter(Boolean);
            if (parts.length > 1) {
                return parts.map(translateSingle).join(', ');
            }
        }
        return translateSingle(msg);
    }
    
    return translateSingle(String(msg));
}

export function useEmployeeForm(editId: number | null, isOpen: boolean, onClose: () => void, onSuccess?: () => void, readOnly: boolean = false) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const isEdit = !!editId;

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [createdEmployee, setCreatedEmployee] = useState<EmployeeMaster | null>(null);

    const methods = useForm<EmployeeFormData>({
        resolver: zodResolver(employeeSchema) as unknown as Resolver<EmployeeFormData>,
        defaultValues: initialEmployeeData,
    });

    const {
        register,
        handleSubmit: rhfHandleSubmit,
        reset,
        setValue,
        control,
        setError,
        clearErrors,
        formState: { errors, isDirty: isEmployeeDirty }
    } = methods;

    // --- Second Form for Account ---
    const accountForm = useForm<UserAccountFormData>({
        resolver: zodResolver(userAccountSchema),
        defaultValues: { username: '', password: '', confirmPassword: '' }
    });

    const { isDirty: isAccountDirty } = accountForm.formState;

    // 🛡️ Unsaved Changes Guard
    const { handleCloseAttempt, blocker } = useUnsavedChangesGuard({
        isDirty: (isEmployeeDirty || isAccountDirty) && !readOnly,
        enabled: isOpen,
        onSafeClose: onClose
    });

    const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
        control,
        name: 'addresses'
    });

    // Fetch dependencies
    const { data: branchesData } = useQuery({
        queryKey: ['branches-dropdown'],
        queryFn: () => BranchService.getList({ page: 1, limit: 1000 }),
        enabled: isOpen,
    });

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

    const branches = useMemo(() => (branchesData?.items || []).filter(item => item.is_active !== false), [branchesData]);
    const departments = useMemo(() => (deptsData?.items || []).filter(item => item.is_active !== false), [deptsData]);
    const positions = useMemo(() => (positionsData || []).filter(item => item.is_active !== false), [positionsData]);
    const employeeGroups = useMemo(() => (empGroupsData?.items || []).filter(item => item.is_active !== false), [empGroupsData]);
    const heads = useMemo(() => (headsData?.items || []).filter(item => item.is_active !== false), [headsData]);
    
    // Real-time Duplicate Check
    const codeValue = useWatch({ control, name: 'employee_code' });
    const debouncedCode = useDebounce(codeValue, 500);

    useEffect(() => {
        let active = true;

        const checkDuplicate = async () => {
            const trimmedCode = debouncedCode?.trim();
            if (!trimmedCode || isEdit) {
                if (!isEdit && active) clearErrors('employee_code');
                return;
            }
            
            try {
                // ค้นหาพนักงานที่มีรหัสตรงกัน
                const res = await OrgEmployeeService.getList({ search: trimmedCode });
                
                if (!active) return; // Prevent state updates if the hook instance has changed or unmounted
                
                const items = Array.isArray(res) ? res : (res?.items || []);
                
                // ตรวจสอบความถูกต้องโดยการ trim ทั้งคู่
                const isDuplicate = items.some(emp => emp.employee_code?.trim() === trimmedCode);
                
                if (isDuplicate) {
                    setError('employee_code', { 
                        type: 'manual', 
                        message: 'รหัสพนักงานนี้มีอยู่ในระบบแล้ว' 
                    });
                } else {
                    // ตรวจสอบว่าไม่มี error อื่น (เช่น min length) ก่อน clear
                    if (trimmedCode.length >= 1 && trimmedCode.length <= 25) {
                        clearErrors('employee_code');
                    }
                }
            } catch (error) {
                if (active) {
                    logger.error('Error checking duplicate employee code:', error);
                }
            }
        };

        void checkDuplicate();

        return () => {
            active = false; // Flag as inactive when component unmounts or input changes
        };
    }, [debouncedCode, isEdit, setError, clearErrors]);

    // Fetch data for edit
    const { data: initialData } = useQuery({
        queryKey: ['employee', editId],
        queryFn: () => (editId ? OrgEmployeeService.get(editId) : null),
        enabled: isOpen && isEdit && !!editId,
    });

    // Fetch auth data separately (because it might not be joined in the employee object)
    const { data: authData } = useQuery({
        queryKey: ['employee-auth', editId],
        queryFn: async () => {
            if (!editId) return null;
            try {
                const res = await api.get<{ username?: string; data?: { username?: string } }>(`/auth/employees/${editId}/auth`);
                // Backend might return the object directly or wrapped in data
                return res.data || res;
            } catch (error) {
                logger.error('Error fetching employee auth:', error);
                return null;
            }
        },
        enabled: isOpen && isEdit && !!editId,
    });

    // Hydrate form when data is fetched
    useEffect(() => {
        if (isOpen && isEdit && initialData) {
            logger.info('📦 LOADING EMPLOYEE DATA FOR EDIT:', initialData);
            
            // แปลงเป็น Record<string, unknown> ผ่าน unknown เพื่อหลีกเลี่ยง overlap error
            const raw = initialData as unknown as Record<string, unknown>;
            
            reset({
                branch_id:             Number(raw['branch_id'] || 1),
                employee_code:         (raw['employee_code'] as string) || '',
                employee_title_th:     (raw['employee_title_th'] as string) || (raw['title_name'] as string) || '',
                employee_title_en:     (raw['employee_title_en'] as string) || '',
                employee_firstname_th: (raw['employee_firstname_th'] as string) || (raw['first_name'] as string) || '',
                employee_lastname_th:  (raw['employee_lastname_th'] as string) || (raw['last_name'] as string) || '',
                employee_firstname_en: (raw['employee_firstname_en'] as string) || '',
                employee_lastname_en:  (raw['employee_lastname_en'] as string) || '',
                employee_startdate:    raw['employee_startdate'] ? new Date(raw['employee_startdate'] as string).toISOString().split('T')[0] : '',
                employee_resigndate:   raw['employee_resigndate'] ? new Date(raw['employee_resigndate'] as string).toISOString().split('T')[0] : null,
                employee_status:       Number(raw['employee_status'] ?? 1),
                phone:                 (raw['phone'] as string) || '',
                email:                 (raw['email'] as string) || '',
                remark:                (raw['remark'] as string) || '',
                tax_id:                (raw['tax_id'] as string) || '',
                emp_type:              ((raw['emp_type'] as string) || 'G').trim(),
                position_id:           raw['position_id'] ? Number(raw['position_id']) : raw['pos_id'] ? Number(raw['pos_id']) : null,
                emp_dept_id:           raw['emp_dept_id'] ? Number(raw['emp_dept_id']) : raw['department_id'] ? Number(raw['department_id']) : raw['dept_id'] ? Number(raw['dept_id']) : null,
                is_active:             raw['is_active'] !== undefined ? Boolean(raw['is_active']) : true,
                employee_head_id:      raw['employee_head_id'] ? Number(raw['employee_head_id']) : null,
                addresses:             ((raw['addresses'] as EmployeeAddress[]) || (raw['employee_addresses'] as EmployeeAddress[]) || (raw['employeeAddresses'] as EmployeeAddress[]) || []).map((addr) => ({
                    address_type:   addr.address_type || 'CONTACT',
                    address:        addr.address || '',
                    district:       addr.district || '',
                    province:       addr.province || '',
                    postal_code:    addr.postal_code || '',
                    country:        addr.country || '',
                    contact_person: addr.contact_person || '',
                    sub_district:   addr.sub_district || ''
                })),
            });

            // --- Hydrate Account Form (Initial check from employee object) ---
            const userObj = raw['user'] as Record<string, unknown> | undefined;
            const authObj = raw['auth'] as Record<string, unknown> | undefined;
            const empAuthArr = raw['employee_auth'] as Record<string, unknown>[] | undefined;

            const existingUsername = (raw['username'] as string) || 
                                 (userObj ? (userObj['username'] as string) : '') || 
                                 (authObj ? (authObj['username'] as string) : '') || 
                                 (empAuthArr && empAuthArr[0] ? (empAuthArr[0]['username'] as string) : '');
            
            if (existingUsername) {
                accountForm.setValue('username', existingUsername);
            }
        } else if (isOpen && !isEdit) {
            reset(initialEmployeeData);
            accountForm.reset({ username: '', password: '', confirmPassword: '' });
        }
    }, [isOpen, isEdit, initialData, reset, accountForm]);

    // แยก useEffect สำหรับ authData โดยเฉพาะ เพื่อให้ชัวร์ว่าเมื่อข้อมูลบัญชีมาถึง มันจะอัปเดตฟอร์มทันที
    useEffect(() => {
        if (isOpen && isEdit && authData) {
            logger.info('🔑 AUTH DATA RECEIVED:', authData);
            const a = authData as unknown as Record<string, unknown>;
            const aData = a['data'] as Record<string, unknown> | undefined;
            
            const username = (a['username'] as string) || 
                           (aData ? (aData['username'] as string) : '') || 
                           (a['user_name'] as string); // เผื่อกรณีใช้ snake_case

            if (username) {
                logger.info('✅ SETTING USERNAME TO:', username);
                accountForm.setValue('username', username);
            }
        }
    }, [isOpen, isEdit, authData, accountForm]);

    const saveMutation = useMutation({
        mutationFn: async (data: EmployeeFormData) => {
            // Remove calculated fields that should not be sent to backend
            const { employee_fullname, employee_fullname_en, ...restData } = data;
            void employee_fullname;
            void employee_fullname_en;

            const payload = {
                ...restData,
                // Ensure IDs are coerced to native numbers or null
                employee_head_id: data.employee_head_id ? Number(data.employee_head_id) : null,
                emp_dept_id: data.emp_dept_id ? Number(data.emp_dept_id) : null,
                position_id: data.position_id ? Number(data.position_id) : null,
                email: data.email && data.email.trim() ? data.email.trim() : undefined,
                
                employee_startdate: data.employee_startdate ? new Date(data.employee_startdate).toISOString() : null,
                employee_resigndate: data.employee_resigndate ? new Date(data.employee_resigndate).toISOString() : null,
                // Ensure tax_id is not longer than 13 chars
                tax_id: data.tax_id ? data.tax_id.substring(0, 13) : '',
                addresses: data.addresses.map(addr => {
                    // Type-safe extraction
                    const { id, sub_district, address, ...rest } = addr as (EmployeeAddress & { id?: string });
                    void id;
                    void sub_district;
                    return {
                        ...rest,
                        address: address
                    };
                })
            };

            console.log('🚀 PAYLOAD TO SEND:', JSON.stringify(payload, null, 2));

            if (isEdit && editId) {
                return api.patch<EmployeeMaster & { success?: boolean; data?: EmployeeMaster; message?: string }>(`/employees/${editId}`, payload, { skipToast: true });
            }
            return api.post<EmployeeMaster & { success?: boolean; data?: EmployeeMaster; message?: string }>('/employees', payload, { skipToast: true });
        },
        onSuccess: (res) => {
            console.log('📥 RESPONSE FROM SERVER:', res);
            
            // Treat as success if we get an ID back (Backend returns the object directly)
            if (res.success || res.data || res.employee_id || res.id) {
                queryClient.invalidateQueries({ queryKey: ['employees'] });
                if (editId) {
                    queryClient.invalidateQueries({ queryKey: ['employee', editId] });
                    queryClient.invalidateQueries({ queryKey: ['employee-auth', editId] });
                }
                
                // If Creating new, go to Step 2
                if (!isEdit) {
                    // Use the response itself if res.data is missing
                    const employeeData = res.data || res;
                    setCreatedEmployee(employeeData);
                    setStep(2);
                    toast('สร้างข้อมูลพนักงานสำเร็จ กรุณากำหนด Username/Password', 'success');
                } else {
                    // If Editing, just finish
                    if (onSuccess) onSuccess();
                }
            } else {
                throw new Error(res.message || 'บันทึกไม่สำเร็จ');
            }
        },
        onError: (error: AxiosError<{ message?: unknown }>) => {
            logger.error('Error saving employee:', error);
            if (error.response?.data) {
                const backendMsg = error.response.data.message;
                logger.error('Backend validation errors:', backendMsg);
                
                // Show the translated toast
                toast(`เกิดข้อผิดพลาด: ${translateError(backendMsg || 'ข้อมูลไม่ถูกต้อง')}`, 'error');

                // Parse backend error messages and map them back to RHF fields to trigger red borders and auto-scroll
                let firstErrorKey: string | null = null;
                const errorList: string[] = Array.isArray(backendMsg) 
                    ? backendMsg.map(String)
                    : typeof backendMsg === 'string' 
                        ? [backendMsg] 
                        : [];

                let isDuplicate = false;
                errorList.forEach((msg) => {
                    const lowerMsg = msg.toLowerCase();
                    if (lowerMsg.includes('internal server error') || lowerMsg.includes('duplicate') || lowerMsg.includes('ซ้ำ') || lowerMsg.includes('unique')) {
                        isDuplicate = true;
                    }

                    Object.keys(FIELD_MAP).forEach((fieldKey) => {
                        const regex = new RegExp(`\\b${fieldKey}\\b`, 'i');
                        if (regex.test(msg)) {
                            if (fieldKey === 'username' || fieldKey === 'password') {
                                accountForm.setError(fieldKey as Path<UserAccountFormData>, {
                                    type: 'backend',
                                    message: translateError(msg)
                                });
                            } else {
                                setError(fieldKey as Path<EmployeeFormData>, {
                                    type: 'backend',
                                    message: translateError(msg)
                                });
                            }
                            if (!firstErrorKey) {
                                firstErrorKey = fieldKey;
                            }
                        }
                    });
                });

                if (isDuplicate) {
                    setError('employee_code' as Path<EmployeeFormData>, {
                        type: 'backend',
                        message: 'รหัสพนักงานซ้ำในระบบ'
                    });
                    if (!firstErrorKey) {
                        firstErrorKey = 'employee_code';
                    }
                }

                // Smooth scroll and focus to the first backend validation failure field
                if (firstErrorKey) {
                    setTimeout(() => {
                        const errorElement = document.getElementsByName(firstErrorKey!)[0] || 
                                           document.querySelector(`[name="${firstErrorKey!}"]`);
                        if (errorElement) {
                            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            if ('focus' in errorElement) (errorElement as HTMLElement).focus();
                        }
                    }, 100);
                }
            } else {
                toast('บันทึกไม่สำเร็จ', 'error');
            }
        }
    });

    const accountMutation = useMutation({
        mutationFn: async (data: UserAccountFormData) => {
            const empId = createdEmployee?.employee_id || createdEmployee?.id;
            if (!empId) {
                throw new Error('ไม่พบข้อมูลพนักงานสำหรับสร้างบัญชี');
            }

            // ใช้เส้นทางที่ถูกต้องตามที่วิเคราะห์มา: /auth/employees/{id}/auth
            return api.post(`/auth/employees/${empId}/auth`, {
                username: data.username,
                password: data.password
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            if (editId) {
                queryClient.invalidateQueries({ queryKey: ['employee', editId] });
                queryClient.invalidateQueries({ queryKey: ['employee-auth', editId] });
            }
            toast('ตั้งค่าบัญชีผู้ใช้สำเร็จ', 'success');
            if (onSuccess) onSuccess();
            onClose();
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            logger.error('Error creating account:', error);
            toast(error?.response?.data?.message || 'ไม่สามารถตั้งค่าบัญชีได้', 'error');
        }
    });

    const handleSave: SubmitHandler<EmployeeFormData> = async (data) => {
        saveMutation.mutate(data);
    };

    const handleSaveAccount: SubmitHandler<UserAccountFormData> = async (data) => {
        accountMutation.mutate(data);
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
                        let msg = errObj.message;
                        const lowerMsg = msg.toLowerCase();
                        if (lowerMsg.includes('invalid input') || lowerMsg.includes('expected number') || lowerMsg.includes('received string') || lowerMsg.includes('expected string') || lowerMsg.includes('received null')) {
                            msg = 'กรุณาระบุข้อมูลให้ถูกต้อง';
                        }
                        messages.push(msg);
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
        branches,
        departments,
        positions,
        employeeGroups,
        heads,
        addressFields,
        appendAddress,
        removeAddress,
        isSubmitting: saveMutation.isPending || accountMutation.isPending,
        handleSave: rhfHandleSubmit(handleSave, onInvalidSubmit),
        handleSaveAccount: accountForm.handleSubmit(handleSaveAccount),
        accountForm,
        step,
        createdEmployee,
        setValue,
        resetAll: () => {
            reset(initialEmployeeData);
            accountForm.reset();
            setStep(1);
            setCreatedEmployee(null);
        },
        control,
        setStep,
        setCreatedEmployee,
        initialData,
        onClose: handleCloseAttempt,
        blocker
    };
}
