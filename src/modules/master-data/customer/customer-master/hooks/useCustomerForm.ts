import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import type { 
    CustomerFormData,
    CustomerMaster,
    CustomerAddressFormItem
} from '@customer/customer-master/types/customer-types';
import { initialCustomerFormData, toCustomerFormData } from '@customer/customer-master/types/customer-types';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { logger } from '@/shared/utils/logger';

interface UseCustomerFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: number;
    initialData?: CustomerMaster | null;
    onSuccess?: () => void;
    toast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function useCustomerForm({ 
    isOpen, 
    onClose, 
    id, 
    initialData, 
    onSuccess, 
    toast 
}: UseCustomerFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [headerTitle, setHeaderTitle] = useState('เพิ่มลูกค้าใหม่');
    
    const [formData, setFormData] = useState<CustomerFormData>(initialCustomerFormData);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const prevIsOpenRef = useRef(isOpen);

    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            if (initialData) {
                setHeaderTitle('แก้ไขข้อมูลลูกค้า');
                setFormData(toCustomerFormData(initialData));
            } else if (id) {
                setHeaderTitle('แก้ไขข้อมูลลูกค้า');
                const fetchData = async () => {
                    setIsLoading(true);
                    try {
                        const customer = await CustomerService.getById(id);
                        if (customer) {
                            setFormData(toCustomerFormData(customer));
                        }
                    } catch (error) {
                        logger.error('Error fetching customer:', error);
                    } finally {
                        setIsLoading(false);
                    }
                };
                fetchData();
            } else {
                setHeaderTitle('เพิ่มลูกค้าใหม่');
                setFormData(initialCustomerFormData);
                setErrors({});
            }
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, id, initialData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        let finalValue: string | boolean | number = value;
        
        if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            finalValue = Number(value);
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSameAsRegisteredChange = (e: ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setFormData(prev => {
            const updated = [...prev.addresses];
            if (checked && updated[0]) {
                updated[1] = {
                    ...updated[0],
                    id: updated[1].id,
                    isMain: false,
                    addressType: 'CONTACT'
                };
            }
            return {
                ...prev,
                same_as_registered: checked,
                addresses: updated
            };
        });
    };

    const addAddress = () => {
        const id = Date.now().toString();
        const newAddress: CustomerAddressFormItem = {
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
        setFormData(prev => ({ 
            ...prev, 
            addresses: [...prev.addresses, newAddress] 
        }));
    };

    const removeAddress = (index: number) => {
        if (index <= 1) return; // Prevent removing Registered/Contact
        setFormData(prev => ({ 
            ...prev, 
            addresses: prev.addresses.filter((_, i) => i !== index) 
        }));
    };

    const updateAddress = (index: number, field: string, value: string | boolean) => {
        setFormData(prev => {
            const updated = [...prev.addresses];
            if (updated[index]) {
                updated[index] = { ...updated[index], [field]: value };
                
                // If syncing is on and we update the registered address, update contact too
                if (index === 0 && prev.same_as_registered && updated[1]) {
                    updated[1] = {
                        ...updated[0],
                        id: updated[1].id,
                        isMain: false,
                        addressType: 'CONTACT'
                    };
                }
            }
            return { ...prev, addresses: updated };
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Pre-submit validation for addresses (backend DTO has email as @IsNotEmpty @IsString)
            for (let i = 0; i < formData.addresses.length; i++) {
                const addr = formData.addresses[i];
                const typeLabel = addr.addressType === 'REGISTERED' ? 'ที่อยู่ตามทะเบียน' : addr.addressType === 'CONTACT' ? 'ที่อยู่ติดต่อ' : `ที่อยู่อื่นๆ (${i + 1})`;
                
                // If specific address email is empty, we will fallback to formData.email or placeholder in mapping
                // But let's check if the OVERALL email source is available if we want to be strict
                const finalEmail = addr.email || formData.email || 'no-email@ymd.com';
                if (!finalEmail || finalEmail.trim() === '') {
                    toast(`กรุณากรอก "อีเมล" ในส่วน ${typeLabel}`, 'error');
                    setIsSubmitting(false);
                    return;
                }
            }

            // Map addresses - aligned with CreateCustomerAddressDto
            const mappedAddresses = formData.addresses.map(a => ({
                address_type:    a.addressType || 'REGISTERED' as const,
                address:         a.address || '',
                sub_district:    a.subDistrict || undefined,
                district:        a.district || '',
                province:        a.province || '',
                postal_code:     a.postalCode || '',
                country:         a.country || 'Thailand',
                contact_person:  a.contactPerson || '',
                phone:           a.phone || undefined,
                phone_extension: a.phoneExtension || undefined,
                email:           a.email || formData.email || 'no-email@ymd.com', // Fallback cascade
                is_default:      a.isMain ?? false,
                is_active:       true
            }));

            let response;

            if (id) {
                // ===== UPDATE Payload =====
                const updatePayload = {
                    customer_code:          formData.customer_code, // Added this
                    customer_name:          formData.customer_name_th,
                    customer_nameeng:       formData.customer_name_en,
                    tax_id:                 formData.tax_id,
                    is_vat_registered:      formData.vat_registered,
                    business_type_id:       formData.business_type_id ? Number(formData.business_type_id) : undefined,
                    customer_type_id:       formData.customer_type_id ? Number(formData.customer_type_id) : undefined,
                    customer_group_id:      formData.customer_group_id ? Number(formData.customer_group_id) : undefined,
                    bill_group_id:          formData.billing_group_id ? Number(formData.billing_group_id) : undefined,
                    credit_limit:           Number(formData.credit_limit || 0),
                    payment_term_days:      Number(formData.credit_term || 0),
                    payment_method_default: formData.payment_method_id,
                    contact_name:           formData.contact_name,
                    phone:                  formData.phone,
                    email:                  formData.email,
                    website:                formData.website,
                    is_active:              formData.is_active,
                    addresses:              mappedAddresses, // Changed from customerAddresses
                };
                response = await CustomerService.update(id, updatePayload as unknown as Partial<CustomerMaster>);
            } else {
                // ===== CREATE Payload - aligned with CreateCustomerMasterDto =====
                const createPayload = {
                    customer_code:          formData.customer_code,
                    customer_name:          formData.customer_name_th,
                    customer_nameeng:       formData.customer_name_en || undefined,
                    tax_id:                 formData.tax_id || undefined,
                    is_vat_registered:      formData.vat_registered,
                    // Required fields - must be numbers
                    customer_type_id:       Number(formData.customer_type_id) || 0,
                    customer_group_id:      Number(formData.customer_group_id) || 0,
                    // Optional number fields
                    bill_group_id:          formData.billing_group_id ? Number(formData.billing_group_id) : undefined,
                    business_type_id:       formData.business_type_id ? Number(formData.business_type_id) : undefined,
                    credit_limit:           formData.credit_limit ? Number(formData.credit_limit) : undefined,
                    payment_term_days:      formData.credit_term ? Number(formData.credit_term) : undefined,
                    payment_method_default: formData.payment_method_id || undefined,
                    contact_name:           formData.contact_name || undefined,
                    phone:                  formData.phone || undefined,
                    email:                  formData.email || undefined,
                    website:                formData.website || undefined,
                    is_active:              formData.is_active,
                    addresses:              mappedAddresses,
                };
                response = await CustomerService.create(createPayload as unknown as Partial<CustomerMaster>);
            }

            if (response.success) {
                toast('บันทึกข้อมูลลูกค้าเรียบร้อยแล้ว', 'success');
                onSuccess?.();
                onClose();
            } else {
                toast(response.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
            }
        } catch (error: unknown) {
            // ---- Detailed Error Extraction ----
            let errorMessage = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { message?: string | string[]; statusCode?: number } } };
                const data = axiosError.response?.data;
                
                if (data) {
                    if (Array.isArray(data.message)) {
                        // NestJS class-validator returns array of errors
                        errorMessage = data.message.join('\n');
                        logger.error('Validation Errors:', data.message);
                    } else if (typeof data.message === 'string') {
                        errorMessage = data.message;
                    }
                }
            }

            logger.error('Error saving customer:', error);
            toast(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        formData,
        errors,
        isLoading,
        isSubmitting,
        headerTitle,
        handleChange,
        handleSameAsRegisteredChange,
        addAddress,
        removeAddress,
        updateAddress,
        handleSubmit
    };
}
