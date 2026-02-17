import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from 'react';
import type { 
    CustomerFormData,
    CustomerMaster,
    CustomerAddressFormItem
} from '@customer/types/customer-types';
import { initialCustomerFormData, toCustomerFormData } from '@customer/types/customer-types';
import { CustomerService } from '@customer/services/customer.service';
import { logger } from '@/shared/utils/logger';

interface UseCustomerFormProps {
    isOpen: boolean;
    onClose: () => void;
    id?: string;
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
            country: 'Thailand',
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

    const updateAddress = (index: number, field: keyof CustomerAddressFormItem, value: string | boolean) => {
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
            console.log('Submit Customer:', formData);
            // API Call logic
            toast('บันทึกข้อมูลลูกค้าเรียบร้อยแล้ว', 'success');
            onSuccess?.();
            onClose();
        } catch (error) {
            logger.error('Error saving customer:', error);
            toast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
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
