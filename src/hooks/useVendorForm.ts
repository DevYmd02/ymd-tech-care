import { useState, useEffect, useRef } from 'react';
import { VendorService } from '@/services/procurement/vendor.service';
import { useConfirmation } from '@/hooks/useConfirmation';
import { useQueryClient } from '@tanstack/react-query';
import type { 
    VendorFormData,
    VendorBankAccount,
    VendorContactPerson,
    VendorAddressFormItem,
    VendorMaster
} from '@project-types/vendor-types';
import { 
    initialVendorFormData, 
    toVendorFormData as mapToFormData, 
    toVendorCreateRequest,
} from '@project-types/vendor-types';
import { z } from 'zod';

// Define Validation Schema
const vendorSchema = z.object({
    vendorNameTh: z.string().min(1, 'กรุณากรอกชื่อเจ้าหนี้ (ไทย)'),
    vendorTypeId: z.string().min(1, 'กรุณาเลือกประเภทเจ้าหนี้'),
    vendorGroupId: z.string().min(1, 'กรุณาเลือกกลุ่มเจ้าหนี้'),
    currencyId: z.string().min(1, 'กรุณาเลือกสกุลเงิน'),
    taxId: z.string().length(13, 'เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก').regex(/^\d+$/, 'กรอกได้เฉพาะตัวเลข').optional().or(z.literal('')),
    email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง (เช่น user@example.com)').optional().or(z.literal('')),
    addresses: z.array(z.object({
        address: z.string().min(1, 'กรุณากรอกที่อยู่'),
        subDistrict: z.string().optional().or(z.literal('')),
        district: z.string().optional().or(z.literal('')),
        province: z.string().min(1, 'กรุณากรอกจังหวัด'),
        postalCode: z.string().length(5, 'รหัสไปรษณีย์ต้องมี 5 หลัก').regex(/^\d+$/, 'กรอกได้เฉพาะตัวเลข'),
    })).min(1),
    bankAccounts: z.array(z.object({
        bankName: z.string().min(1, 'กรุณากรอกชื่อธนาคาร'),
        accountNumber: z.string().min(1, 'กรุณากรอกเลขบัญชี'),
        accountName: z.string().min(1, 'กรุณากรอกชื่อบัญชี'),
    })),
});

interface UseVendorFormProps {
    isOpen: boolean;
    onClose: () => void;
    vendorId?: string;
    initialData?: VendorMaster | null;
    onSuccess?: () => void;
    predictedVendorId?: string;
}

export function useVendorForm({ 
    isOpen, 
    onClose, 
    vendorId, 
    initialData, 
    onSuccess, 
    predictedVendorId 
}: UseVendorFormProps) {
    const [formData, setFormData] = useState<VendorFormData>(initialVendorFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [headerTitle, setHeaderTitle] = useState('เพิ่มเจ้าหนี้ใหม่');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [systemAlert, setSystemAlert] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
    const prevIsOpenRef = useRef(isOpen);
    
    const { confirm } = useConfirmation(); // Shared System
    const queryClient = useQueryClient();

    // Fetch/Reset data when modal opens
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            setErrors({}); // Clear errors on open
            if (initialData) {
                setHeaderTitle('แก้ไขข้อมูลเจ้าหนี้');
                const converted = mapToFormData(initialData);
                setFormData({
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
                            setFormData({
                                ...apiData,
                                vendorCodeSearch: '',
                            });
                        }
                    } catch (error) {
                        console.error('Error fetching vendor:', error);
                    } finally {
                        setIsLoading(false);
                    }
                };
                fetchData();
            } else {
                setHeaderTitle('เพิ่มเจ้าหนี้ใหม่');
                setFormData({
                    ...initialVendorFormData,
                    vendorCode: predictedVendorId || initialVendorFormData.vendorCode || ''
                });
            }
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, vendorId, initialData, predictedVendorId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        let checked = false;
        if (type === 'checkbox') {
            checked = (e.target as HTMLInputElement).checked;
        }

        let finalValue = value;
        
        // Input masking (Manual removal of non-numeric, but validation moved to Zod)
        if (['phone', 'mobile', 'taxId', 'postalCode'].includes(name)) {
            finalValue = value.replace(/[^0-9]/g, '');
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : finalValue
        }));
    };

    const addBankAccount = () => {
        const newAccount: VendorBankAccount = {
            id: Date.now().toString(),
            bankName: '',
            branchName: '',
            accountNumber: '',
            accountName: formData.vendorNameTh,
            accountType: 'SAVING',
            swiftCode: '',
            isMain: formData.bankAccounts.length === 0
        };
        setFormData(prev => ({ ...prev, bankAccounts: [...prev.bankAccounts, newAccount] }));
    };

    const removeBankAccount = (id: string) => {
        setFormData(prev => ({ ...prev, bankAccounts: prev.bankAccounts.filter(acc => acc.id !== id) }));
    };

    const updateBankAccount = (id: string, field: keyof VendorBankAccount, value: string | boolean) => {
        let finalValue = value;
        if (typeof value === 'string' && field === 'accountNumber') {
            finalValue = value.replace(/[^0-9]/g, '');
        }
        setFormData(prev => ({
            ...prev,
            bankAccounts: prev.bankAccounts.map(acc => 
                acc.id === id ? { ...acc, [field]: finalValue } : acc
            )
        }));
    };

    const addContactPerson = () => {
        const newContact: VendorContactPerson = {
            id: Date.now().toString(),
            name: '',
            position: '',
            phone: '',
            mobile: '',
            email: '',
            isMain: formData.additionalContacts.length === 0
        };
        setFormData(prev => ({ ...prev, additionalContacts: [...prev.additionalContacts, newContact] }));
    };

    const removeContactPerson = (id: string) => {
        setFormData(prev => ({ ...prev, additionalContacts: prev.additionalContacts.filter(c => c.id !== id) }));
    };

    const updateContactPerson = (id: string, field: keyof VendorContactPerson, value: string | boolean) => {
        let finalValue = value;
        if (typeof value === 'string' && (field === 'phone' || field === 'mobile')) {
            finalValue = value.replace(/[^0-9]/g, '');
        }
        setFormData(prev => ({
            ...prev,
            additionalContacts: prev.additionalContacts.map(c => 
                c.id === id ? { ...c, [field]: finalValue } : c
            )
        }));
    };

    const addAddress = () => {
        const id = Date.now().toString();
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
        setFormData(prev => ({ ...prev, addresses: [...prev.addresses, newAddress] }));
        
        setTimeout(() => {
            const element = document.getElementById(`address-block-${id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const removeAddress = (index: number) => {
        if (index < 2) return;
        setFormData(prev => ({
            ...prev,
            addresses: prev.addresses.filter((_, i) => i !== index)
        }));
    };

    const updateAddress = (index: number, field: keyof VendorAddressFormItem, value: string | boolean) => {
        let finalValue = value;
        
        if (typeof value === 'string' && ['postalCode', 'phone', 'phoneExtension'].includes(field)) {
            finalValue = value.replace(/[^0-9]/g, '');
        }
        
        setFormData(prev => {
            const newAddresses = [...prev.addresses];
            if (newAddresses[index]) {
                newAddresses[index] = { ...newAddresses[index], [field]: finalValue };
                
                if (index === 0 && prev.sameAsRegistered && 
                    !['isMain', 'addressType', 'id'].includes(field)) {
                    newAddresses[1] = { ...newAddresses[1], [field]: finalValue };
                }
            }
            return { ...prev, addresses: newAddresses };
        });
    };

    const handleSameAsRegisteredChange = (checked: boolean) => {
        setFormData(prev => {
            const newAddresses = prev.addresses.map(addr => ({ ...addr }));
            
            if (checked) {
                const registeredAddr = newAddresses[0];
                if (registeredAddr) {
                    newAddresses[1] = {
                        ...registeredAddr,
                        id: newAddresses[1]?.id || 'contact-addr',
                        isMain: false,
                        addressType: 'CONTACT'
                    };
                }
            } else {
                newAddresses[1] = {
                    id: newAddresses[1]?.id || 'contact-addr',
                    address: '',
                    subDistrict: '',
                    district: '',
                    province: '',
                    postalCode: '',
                    country: '',
                    contactPerson: '',
                    phone: '',
                    phoneExtension: '',
                    isMain: false,
                    addressType: 'CONTACT'
                };
            }

            return {
                ...prev,
                sameAsRegistered: checked,
                addresses: newAddresses
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        const result = vendorSchema.safeParse(formData);
        
        if (!result.success) {
            const newErrors: { [key: string]: string } = {};
            result.error.issues.forEach(issue => {
                let path = '';
                issue.path.forEach((p, i) => {
                    if (typeof p === 'number') {
                        path += `[${p}]`;
                    } else {
                        path += (i === 0 ? '' : '.') + p.toString();
                    }
                });
                newErrors[path] = issue.message;
            });
            setErrors(newErrors);
            
            setSystemAlert({ message: 'กรุณาตรวจสอบข้อมูลสีแดงในแบบฟอร์ม', type: 'error' });
            
            setTimeout(() => {
                const firstErrorKey = Object.keys(newErrors)[0];
                if (firstErrorKey) {
                    const element = document.querySelector(`[name="${firstErrorKey}"]`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        (element as HTMLElement).focus();
                    }
                }
            }, 100);
            return;
        }

        setErrors({});

        // Confirmation (Shared System)
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

        // Save Logic
        setIsSubmitting(true);
        try {
            const request = toVendorCreateRequest(formData);
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
                
                // Refetch List
                await queryClient.invalidateQueries({ queryKey: ['vendors'] });

                onSuccess?.();
                onClose();
            } else {
                throw new Error(response.message || 'บันทึกไม่สำเร็จ');
            }

        } catch (error: unknown) {
            console.error('Error saving vendor:', error);
            let errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ';
            if (error instanceof Error) errorMessage = error.message;
            
            await confirm({
                title: 'บันทึกไม่สำเร็จ',
                description: errorMessage,
                confirmText: 'ตกลง',
                hideCancel: true,
                variant: 'danger'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreditLimitChange = (value: number) => {
        setFormData(prev => ({ ...prev, creditLimit: value }));
    };

    return {
        formData,
        setFormData,
        errors,
        isLoading,
        isSubmitting,
        headerTitle,
        systemAlert,
        setSystemAlert,
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