import { useState, useEffect, useRef } from 'react';
import { useForm, type Path, type SubmitHandler, type FieldErrors, type FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VendorService } from '../services/vendor.service';
import { useConfirmation } from '@/shared/hooks/useConfirmation';
import { useQueryClient } from '@tanstack/react-query';
import type { 
    VendorFormData,
    VendorBankAccount,
    VendorContactPerson,
    VendorAddressFormItem,
    VendorMaster
} from '../types/vendor-types';
import { 
    initialVendorFormData, 
    toVendorFormData as mapToFormData, 
    toVendorCreateRequest,
} from '../types/vendor-types';
import { logger } from '@/shared/utils/logger';
import { VendorSchema } from '../types/vendor-schemas';


interface UseVendorFormProps {
    isOpen: boolean;
    onClose: () => void;
    vendorId?: string;
    initialData?: VendorMaster | null;
    onSuccess?: () => void;
    predictedVendorId?: string;
    toast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function useVendorForm({ 
    isOpen, 
    onClose, 
    vendorId, 
    initialData, 
    onSuccess, 
    predictedVendorId,
    toast
}: UseVendorFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [headerTitle, setHeaderTitle] = useState('เพิ่มเจ้าหนี้ใหม่');
    
    // RHF Setup
    const { 
        watch, 
        setValue, 
        handleSubmit: rhfHandleSubmit, 
        reset, 
        getValues,
        formState: { errors, isSubmitting } 
    } = useForm<VendorFormData>({
        resolver: zodResolver(VendorSchema),
        defaultValues: initialVendorFormData,
        mode: 'onChange' 
    });

    const formData = watch();

    const prevIsOpenRef = useRef(isOpen);
    
    const { confirm } = useConfirmation();
    const queryClient = useQueryClient();

    // Fetch/Reset data when modal opens
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            
            if (initialData) {
                setHeaderTitle('แก้ไขข้อมูลเจ้าหนี้');
                const converted = mapToFormData(initialData);
                reset({
                    ...converted,
                    vendorCodeSearch: '',
                });
            } else if (vendorId) {
                setHeaderTitle('แก้ไขข้อมูลเจ้าหนี้');
                const fetchData = async () => {
                    setIsLoading(true);
                    try {
                        const vendor = await VendorService.getById(vendorId);
                        if (vendor) {
                            const apiData = mapToFormData(vendor);
                            reset({
                                ...apiData,
                                vendorCodeSearch: '',
                            });
                        }
                    } catch (error) {
                        logger.error('Error fetching vendor:', error);
                    } finally {
                        setIsLoading(false);
                    }
                };
                fetchData();
            } else {
                setHeaderTitle('เพิ่มเจ้าหนี้ใหม่');
                reset({
                    ...initialVendorFormData,
                    vendorCode: predictedVendorId || initialVendorFormData.vendorCode || ''
                });
            }
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, vendorId, initialData, predictedVendorId, reset]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        let checked = false;
        if (type === 'checkbox') {
            checked = (e.target as HTMLInputElement).checked;
        }

        let finalValue: string | boolean = value;
        
        // Input Masking Logic
        if (['phone', 'mobile', 'taxId', 'postalCode'].includes(name)) {
            finalValue = value.replace(/[^0-9]/g, '');
        }
        
        // Special case for boolean checkboxes
        if (type === 'checkbox') {
            finalValue = checked;
        }

        setValue(name as Path<VendorFormData>, finalValue, { shouldValidate: true, shouldDirty: true });
    };

    const addBankAccount = () => {
        const current = getValues('bankAccounts') || [];
        const newAccount: VendorBankAccount = {
            id: Date.now().toString(),
            bankName: '',
            branchName: '',
            accountNumber: '',
            accountName: formData.vendorNameTh,
            accountType: 'SAVING',
            swiftCode: '',
            isMain: current.length === 0
        };
        setValue('bankAccounts', [...current, newAccount], { shouldDirty: true });
    };

    const removeBankAccount = (id: string) => {
        const current = getValues('bankAccounts');
        setValue('bankAccounts', current.filter(acc => acc.id !== id), { shouldDirty: true });
    };

    const updateBankAccount = (id: string, field: keyof VendorBankAccount, value: string | boolean) => {
        let finalValue = value;
        if (typeof value === 'string' && field === 'accountNumber') {
            finalValue = value.replace(/[^0-9]/g, '');
        }
        
        const current = getValues('bankAccounts');
        const updated = current.map(acc => 
            acc.id === id ? { ...acc, [field]: finalValue } : acc
        );
        setValue('bankAccounts', updated, { shouldDirty: true, shouldValidate: true });
    };

    const addContactPerson = () => {
        const current = getValues('additionalContacts') || [];
        const newContact: VendorContactPerson = {
            id: Date.now().toString(),
            name: '',
            position: '',
            phone: '',
            mobile: '',
            email: '',
            isMain: current.length === 0
        };
        setValue('additionalContacts', [...current, newContact], { shouldDirty: true });
    };

    const removeContactPerson = (id: string) => {
        const current = getValues('additionalContacts');
        setValue('additionalContacts', current.filter(c => c.id !== id), { shouldDirty: true });
    };

    const updateContactPerson = (id: string, field: keyof VendorContactPerson, value: string | boolean) => {
        let finalValue = value;
        if (typeof value === 'string' && (field === 'phone' || field === 'mobile')) {
            finalValue = value.replace(/[^0-9]/g, '');
        }
        
        const current = getValues('additionalContacts');
        const updated = current.map(c => 
            c.id === id ? { ...c, [field]: finalValue } : c
        );
        setValue('additionalContacts', updated, { shouldDirty: true, shouldValidate: true });
    };

    const addAddress = () => {
        const id = Date.now().toString();
        const current = getValues('addresses') || [];
        const newAddress: VendorAddressFormItem = {
            id,
            address: '',
            subDistrict: '',
            district: '',
            province: '',
            postalCode: '',
            country: '',
            isMain: false,
            addressType: 'SHIPPING'
        };
        setValue('addresses', [...current, newAddress], { shouldDirty: true });
        
        setTimeout(() => {
            const element = document.getElementById(`address-block-${id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const removeAddress = (index: number) => {
        if (index < 2) return;
        const current = getValues('addresses');
        setValue('addresses', current.filter((_, i) => i !== index), { shouldDirty: true });
    };

    const updateAddress = (index: number, field: keyof VendorAddressFormItem, value: string | boolean) => {
        let finalValue = value;
        
        if (typeof value === 'string' && ['postalCode', 'phone', 'phoneExtension'].includes(field)) {
            finalValue = value.replace(/[^0-9]/g, '');
        }
        
        const current = [...getValues('addresses')];
        if (current[index]) {
            current[index] = { ...current[index], [field]: finalValue };
            
            const isSameAsRegistered = getValues('sameAsRegistered');
            
            if (index === 0 && isSameAsRegistered && 
                !['isMain', 'addressType', 'id'].includes(field)) {
                current[1] = { ...current[1], [field]: finalValue };
            }
        }
        setValue('addresses', current, { shouldDirty: true, shouldValidate: true });
    };

    const handleSameAsRegisteredChange = (checked: boolean) => {
        const current = [...getValues('addresses')];
        
        if (checked) {
            const registeredAddr = current[0];
            if (registeredAddr) {
                current[1] = {
                    ...registeredAddr,
                    id: current[1]?.id || 'contact-addr',
                    isMain: false,
                    addressType: 'CONTACT'
                };
            }
        } else {
            current[1] = {
                id: current[1]?.id || 'contact-addr',
                address: '',
                subDistrict: '',
                district: '',
                province: '',
                postalCode: '',
                country: '',
                contactPerson: '',
                phone: '',
                phoneExtension: '',
                email: '',
                isMain: false,
                addressType: 'CONTACT'
            };
        }

        setValue('sameAsRegistered', checked, { shouldDirty: true });
        setValue('addresses', current, { shouldDirty: true });
    };

    const handleCreditLimitChange = (value: number) => {
        setValue('creditLimit', value, { shouldDirty: true, shouldValidate: true });
    };

    const onSubmit: SubmitHandler<VendorFormData> = async (data) => {
        const isConfirmed = await confirm({
            title: headerTitle === 'แก้ไขข้อมูลเจ้าหนี้' ? 'ยืนยันการแก้ไข' : 'ยืนยันการบันทึก',
            description: headerTitle === 'แก้ไขข้อมูลเจ้าหนี้' 
                ? 'คุณต้องการบันทึกการแก้ไขข้อมูลเจ้าหนี้ใช่หรือไม่?' 
                : 'คุณต้องการบันทึกข้อมูลเจ้าหนี้ใช่หรือไม่?',
            confirmText: headerTitle === 'แก้ไขข้อมูลเจ้าหนี้' ? 'ยืนยันการแก้ไข' : 'ยืนยัน',
            cancelText: 'ยกเลิก',
            variant: 'info'
        });

        if (!isConfirmed) return;

        try {
            const request = toVendorCreateRequest(data);
            const targetId = vendorId || initialData?.vendor_id;

            let response;
            if (targetId) {
                response = await VendorService.update(targetId, request);
            } else {
                response = await VendorService.create(request);
            }

            if (response.success) {
                await confirm({
                    title: 'บันทึกสำเร็จ!',
                    description: 'ข้อมูลเจ้าหนี้ถูกบันทึกเรียบร้อยแล้ว',
                    confirmText: 'ตกลง',
                    hideCancel: true,
                    variant: 'success'
                });
                
                await queryClient.invalidateQueries({ queryKey: ['vendors'] });

                onSuccess?.();
                onClose();
            } else {
                throw new Error(response.message || 'บันทึกไม่สำเร็จ');
            }

        } catch (error: unknown) {
            logger.error('Error saving vendor:', error);
            let errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ';
            if (error instanceof Error) errorMessage = error.message;
            
            await confirm({
                title: 'บันทึกไม่สำเร็จ',
                description: errorMessage,
                confirmText: 'ตกลง',
                hideCancel: true,
                variant: 'danger'
            });
        }
    };
    
    // Wrapper for form submission to handle validation errors
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        await rhfHandleSubmit(onSubmit, (invalidErrors) => {
            console.error('Validation Errors:', invalidErrors);
            toast('กรุณาตรวจสอบข้อมูลสีแดงในแบบฟอร์ม', 'error');
            
            setTimeout(() => {
                const firstErrorKey = Object.keys(invalidErrors)[0];
                if (firstErrorKey) {
                    const element = document.querySelector(`[name="${firstErrorKey}"]`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        (element as HTMLElement).focus();
                    }
                }
            }, 100);
        })(e);
    };

    const flattenErrors = (rootErrors: FieldErrors<VendorFormData>): Record<string, string> => {
        const result: Record<string, string> = {};
        
        const extractMessage = (path: string, error: FieldError | undefined | null | object) => {
            if (error && typeof error === 'object' && 'message' in error) {
                 const msg = (error as { message: unknown }).message;
                 if (typeof msg === 'string') {
                     result[path] = msg;
                 }
            }
        };

        // 1. Root fields (Exclude arrays)
        const rootKeys = Object.keys(rootErrors) as Array<keyof VendorFormData>;
        rootKeys.forEach(key => {
            if (key === 'addresses' || key === 'bankAccounts' || key === 'additionalContacts') return;
            // Safe to treat as FieldError for primitive fields in this specific form
            extractMessage(String(key), rootErrors[key]);
        });

        // 2. Explicit Array Handling (Addresses)
        if (rootErrors.addresses && Array.isArray(rootErrors.addresses)) {
            rootErrors.addresses.forEach((addrErrors, index) => {
                if (!addrErrors) return;
                const keys = Object.keys(addrErrors) as Array<keyof typeof addrErrors>;
                keys.forEach(key => {
                    if (key === 'ref' || key === 'type') return;
                    extractMessage(`addresses[${index}].${String(key)}`, addrErrors[key]);
                });
            });
        }

        // 3. Bank Accounts
        if (rootErrors.bankAccounts && Array.isArray(rootErrors.bankAccounts)) {
            rootErrors.bankAccounts.forEach((bankErrors, index) => {
                if (!bankErrors) return;
                const keys = Object.keys(bankErrors) as Array<keyof typeof bankErrors>;
                keys.forEach(key => {
                     if (key === 'ref' || key === 'type') return;
                     extractMessage(`bankAccounts[${index}].${String(key)}`, bankErrors[key]);
                });
            });
        }

        // 4. Additional Contacts
        if (rootErrors.additionalContacts && Array.isArray(rootErrors.additionalContacts)) {
            rootErrors.additionalContacts.forEach((contactErrors, index) => {
                if (!contactErrors) return;
                const keys = Object.keys(contactErrors) as Array<keyof typeof contactErrors>;
                keys.forEach(key => {
                    if (key === 'ref' || key === 'type') return;
                    extractMessage(`additionalContacts[${index}].${String(key)}`, contactErrors[key]);
                });
            });
        }

        return result;
    };



    const flatErrors = flattenErrors(errors);

    return {
        formData,
        setFormData: (data: VendorFormData | ((prev: VendorFormData) => VendorFormData)) => {
            if (typeof data === 'function') {
                const current = getValues();
                const newData = data(current);
                reset(newData);
            } else {
                reset(data);
            }
        },
        errors: flatErrors,
        isLoading,
        isSubmitting,

        headerTitle,
        handleChange,
        addBankAccount,
        removeBankAccount,
        updateBankAccount,
        addContactPerson,
        removeContactPerson,
        updateContactPerson,
        addAddress,
        removeAddress,
        updateAddress,
        handleSameAsRegisteredChange,
        handleCreditLimitChange,
        handleSubmit
    };
}
