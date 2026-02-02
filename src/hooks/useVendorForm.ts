import { useState, useEffect, useRef } from 'react';
import { vendorService } from '@services/VendorService';
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
    taxId: z.string().regex(/^[0-9]{13}$/, 'เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก').optional().or(z.literal('')),
    email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
    addresses: z.array(z.object({
        address: z.string().min(1, 'กรุณากรอกที่อยู่'),
        district: z.string().min(1, 'กรุณากรอกเขต/อำเภอ'),
        province: z.string().min(1, 'กรุณากรอกจังหวัด'),
        postalCode: z.string().regex(/^[0-9]{5}$/, 'รหัสไปรษณีย์ต้องมี 5 หลัก'),
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
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const prevIsOpenRef = useRef(isOpen);

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
                        const vendor = await vendorService.getById(vendorId);
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Perform Validation before showing confirmation
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
            
            // Scroll to the first error
            const element = document.getElementsByName(result.error.issues[0].path[result.error.issues[0].path.length - 1] as string)[0];
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                (element as HTMLElement).focus();
            }
            
            return;
        }

        setErrors({}); // Clear errors if valid
        setShowConfirmModal(true);
    };

    const handleConfirmSave = async () => {
        setIsSubmitting(true);
        try {
            const request = toVendorCreateRequest(formData);
            const targetId = vendorId || initialData?.vendor_id;

            if (targetId) {
                await vendorService.update(targetId, request);
            } else {
                await vendorService.create(request);
            }

            alert('บันทึกข้อมูลสำเร็จ');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error saving vendor:', error);
            alert('บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsSubmitting(false);
            setShowConfirmModal(false);
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
        showConfirmModal,
        setShowConfirmModal,
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
        handleSubmit,
        handleConfirmSave
    };
}
