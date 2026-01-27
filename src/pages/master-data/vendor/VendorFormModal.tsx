/**
 * @file VendorFormModal.tsx
 * @description Modal สำหรับ เพิ่ม/แก้ไข ข้อมูล Vendor (UI Refactor)
 * @purpose ใช้สำหรับ Quick Edit หรือ Add New จากหน้า Dashboard
 * @design Vertical layout with grouped sections (General, Contact, Address, Payment, Bank, etc.)
 */

import { useState, useEffect, useRef } from 'react';
import {
    X, Save, Building2, Phone, MapPin, Database, CreditCard,
    Plus, Trash2, User, History
} from 'lucide-react';
// Note: Plus and Trash2 are still used for Bank Accounts and Additional Contacts sections
import { styles } from '@/constants';
import { vendorService } from '@services/vendorService';
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

interface VendorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendorId?: string; // If provided, edit mode
    initialData?: VendorMaster | null; // Pre-filled data for edit mode
    onSuccess?: () => void;
    predictedVendorId?: string; // For Add Mode: Suggested ID
}

export function VendorFormModal({ isOpen, onClose, vendorId, initialData, onSuccess, predictedVendorId }: VendorFormModalProps) {
    const [formData, setFormData] = useState<VendorFormData>(initialVendorFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [headerTitle, setHeaderTitle] = useState('เพิ่มเจ้าหนี้ใหม่');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const prevIsOpenRef = useRef(isOpen);

    // Fetch/Reset data when modal opens
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            setErrors({}); // Clear errors on open
            if (initialData) {
                // If initialData is provided, use it directly (Edit Mode)
                setHeaderTitle('แก้ไขข้อมูลเจ้าหนี้');
                const converted = mapToFormData(initialData);
                setFormData({
                    ...converted,
                    vendorCodeSearch: '',
                });
            } else if (vendorId) {
                // If only vendorId is provided, fetch data (Edit Mode)
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
                // No data provided (Add Mode)
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
        
        // Validation for Numeric Fields
        if (['phone', 'mobile'].includes(name)) {
            // Check for non-numeric characters before replacing (for Error UI)
            if (value && /[^0-9]/.test(value)) {
                setErrors(prev => ({ ...prev, [name]: 'กรุณากรอกเฉพาะตัวเลขเท่านั้น' }));
            } else {
                setErrors(prev => {
                    const next = { ...prev };
                    delete next[name];
                    return next;
                });
            }
            // Strict Prevention: Remove non-numeric characters
            finalValue = value.replace(/[^0-9]/g, '');
        } else if (['taxId', 'postalCode'].includes(name)) {
            finalValue = value.replace(/[^0-9]/g, '');
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : finalValue
        }));
    };

    // Bank Account Handlers
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

    // Contact Person Handlers
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

    // Address Handlers - Fixed 2 items: [0]=REGISTERED, [1]=CONTACT, [2+]=DYNAMIC
    
    // Add a new dynamic address
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
        
        // Auto-scroll to the new address block
        setTimeout(() => {
            const element = document.getElementById(`address-block-${id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    // Remove a dynamic address
    const removeAddress = (index: number) => {
        if (index < 2) return; // Prevent deleting fixed addresses
        setFormData(prev => ({
            ...prev,
            addresses: prev.addresses.filter((_, i) => i !== index)
        }));
    };

    // Generic address update for any index
    const updateAddress = (index: number, field: keyof VendorAddressFormItem, value: string | boolean) => {
        let finalValue = value;
        
        // Validation for Numeric Fields in Address
        if (typeof value === 'string' && ['postalCode', 'phone', 'phoneExtension'].includes(field)) {
            const errorKey = `addresses[${index}].${field}`;
             // Check for non-numeric characters before replacing (for Error UI)
             if (value && /[^0-9]/.test(value)) {
                setErrors(prev => ({ ...prev, [errorKey]: 'กรุณากรอกเฉพาะตัวเลขเท่านั้น' }));
            } else {
                setErrors(prev => {
                    const next = { ...prev };
                    delete next[errorKey];
                    return next;
                });
            }
            finalValue = value.replace(/[^0-9]/g, '');
        }
        
        setFormData(prev => {
            const newAddresses = [...prev.addresses];
            if (newAddresses[index]) {
                newAddresses[index] = { ...newAddresses[index], [field]: finalValue };
                
                // If updating REGISTERED and "Same as Primary" is checked, sync to CONTACT
                if (index === 0 && prev.sameAsRegistered && 
                    !['isMain', 'addressType', 'id'].includes(field)) {
                    newAddresses[1] = { ...newAddresses[1], [field]: finalValue };
                }
            }
            return { ...prev, addresses: newAddresses };
        });
    };

    // Update REGISTERED address (index 0) - Kept for compatibility with existing calls if any
    const updateRegisteredAddress = (field: keyof VendorAddressFormItem, value: string | boolean) => {
        updateAddress(0, field, value);
    };

    // Update CONTACT address (index 1) - Kept for compatibility
    const updateContactAddress = (field: keyof VendorAddressFormItem, value: string | boolean) => {
        updateAddress(1, field, value);
    };

    // Handle "Same as Primary" checkbox toggle
    // Handle "Same as Primary" checkbox toggle
    const handleSameAsRegisteredChange = (checked: boolean) => {
        setFormData(prev => {
            // Create a deep-ish copy of addresses
            const newAddresses = prev.addresses.map(addr => ({ ...addr }));
            
            if (checked) {
                // SYNC: Copy REGISTERED address (index 0) to CONTACT address (index 1)
                const registeredAddr = newAddresses[0];
                if (registeredAddr) {
                    newAddresses[1] = {
                        ...registeredAddr,
                        // Preserve identity of the contact address
                        id: newAddresses[1]?.id || 'contact-addr',
                        isMain: false,
                        addressType: 'CONTACT'
                    };
                }
            } else {
                // CLEAR: Reset CONTACT address (index 1) to empty
                // But keep the ID and Type structure
                newAddresses[1] = {
                    id: newAddresses[1]?.id || 'contact-addr',
                    address: '',
                    subDistrict: '',
                    district: '',
                    province: '',
                    postalCode: '',
                    country: '', // Optional: clear country as well if needed
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
        setIsSubmitting(true);
        try {
            const request = toVendorCreateRequest(formData);
            
            // Determine Create or Update
            // Use vendorId from props OR vendor_id from initialData
            const targetId = vendorId || initialData?.vendor_id;

            if (targetId) {
                console.log('Updating Vendor...', targetId);
                await vendorService.update(targetId, request);
            } else {
                console.log('Creating New Vendor...');
                await vendorService.create(request);
            }

            // Success feedback and close
            alert('บันทึกข้อมูลสำเร็จ');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error saving vendor:', error);
            alert('บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                            {headerTitle}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            กรอกข้อมูลเจ้าหนี้/ซัพพลายเออร์
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50 dark:bg-gray-900/50">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <form id="vendor-form" onSubmit={handleSubmit} className="space-y-8">
                            
                            {/* 1. General Info */}
                            <section>
                                <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                                    <Building2 size={20} />
                                    <h3 className="font-semibold text-lg">ข้อมูลทั่วไป</h3>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                                    
                                    {/* Vendor Code & Name TH */}
                                    <div className="space-y-1">
                                        <label className={styles.label}>รหัสเจ้าหนี้ <span className="text-red-500">*</span></label>
                                        <input 
                                            name="vendorCode" 
                                            value={formData.vendorCode} 
                                            onChange={handleChange} 
                                            className={styles.input} 
                                            placeholder="Auto Generated" 
                                            disabled={true}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={styles.label}>ชื่อเจ้าหนี้ (ไทย) <span className="text-red-500">*</span></label>
                                        <input 
                                            name="vendorName" 
                                            value={formData.vendorName} 
                                            onChange={handleChange} 
                                            className={styles.input} 
                                            placeholder="บริษัท เอบีซี จำกัด" 
                                            required
                                        />
                                    </div>

                                    {/* Name EN & Vendor Type */}
                                    <div className="space-y-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className={styles.label}>ชื่อเจ้าหนี้ (อังกฤษ)</label>
                                            <input 
                                                name="vendorNameEn" 
                                                value={formData.vendorNameEn} 
                                                onChange={handleChange} 
                                                className={styles.input} 
                                                placeholder="ABC Company Limited" 
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={styles.label}>ประเภทเจ้าหนี้ <span className="text-red-500">*</span></label>
                                            <select 
                                                name="vendorTypeId" 
                                                value={formData.vendorTypeId} 
                                                onChange={handleChange} 
                                                className={styles.inputSelect}
                                                required
                                            >
                                                <option value="" disabled>เลือกประเภทเจ้าหนี้</option>
                                                <option value="1">ผู้จัดจำหน่าย (Distributor)</option>
                                                <option value="2">บุคคลธรรมดา (Individual)</option>
                                                <option value="3">หน่วยงานราชการ (Government)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Business Category & Tax ID */}
                                    <div className="space-y-1">
                                        <label className={styles.label}>หมวดหมู่ธุรกิจ <span className="text-red-500">*</span></label>
                                        <select 
                                            name="vendorGroupId" 
                                            value={formData.vendorGroupId} 
                                            onChange={handleChange} 
                                            className={styles.inputSelect}
                                            required
                                        >
                                            <option value="" disabled>เลือกหมวดหมู่</option>
                                            <option value="1">อุปกรณ์ไอที</option>
                                            <option value="2">อุปกรณ์สำนักงาน</option>
                                            <option value="3">บริการ</option>
                                            <option value="4">รับเหมาก่อสร้าง</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={styles.label}>เลขประจำตัวผู้เสียภาษี <span className="text-red-500">*</span></label>
                                        <input 
                                            name="taxId" 
                                            value={formData.taxId} 
                                            onChange={handleChange} 
                                            className={styles.input} 
                                            placeholder="010555888xxxxx" 
                                            required
                                        />
                                    </div>

                                    {/* Branch & Currency */}
                                    <div className="space-y-1">
                                        <label className={styles.label}>ชื่อสาขา <span className="text-red-500">*</span></label>
                                        <input 
                                            name="branchName" 
                                            value={formData.branchName} 
                                            onChange={handleChange} 
                                            className={styles.input} 
                                            placeholder="สำนักงานใหญ่" 
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={styles.label}>สกุลเงิน</label>
                                        <select 
                                            name="currencyId" 
                                            value={formData.currencyId} 
                                            onChange={handleChange} 
                                            className={styles.inputSelect}
                                        >
                                            <option value="1">THB - บาท</option>
                                            <option value="2">USD - ดอลลาร์สหรัฐ</option>
                                            <option value="3">EUR - ยูโร</option>
                                            <option value="4">JPY - เยน</option>
                                            <option value="5">CNY - หยวน</option>
                                        </select>
                                    </div>

                                    {/* Checkboxes */}
                                    <div className="md:col-span-2 flex gap-6 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                name="vatRegistered"
                                                checked={formData.vatRegistered}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">จดทะเบียน VAT</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                name="whtRegistered"
                                                checked={formData.whtRegistered}
                                                onChange={handleChange}
                                                className="w-4 h-4 text-gray-800 rounded border-gray-300 focus:ring-gray-800"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">มีการหัก ณ ที่จ่าย (WHT)</span>
                                        </label>
                                    </div>
                                </div>
                            </section>

                            {/* 2. Contact Info */}
                            <section>
                                <div className="flex items-center gap-2 mb-4 text-green-600 dark:text-green-400">
                                    <Phone size={20} />
                                    <h3 className="font-semibold text-lg">ข้อมูลติดต่อ</h3>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className={styles.label}>ชื่อผู้ติดต่อหลัก <span className="text-red-500">*</span></label>
                                        <input 
                                            name="contactName" 
                                            value={formData.contactName} 
                                            onChange={handleChange} 
                                            className={styles.input} 
                                            placeholder="คุณสมชาย ใจดี" 
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={styles.label}>โทรศัพท์ <span className="text-red-500">*</span></label>
                                        <input 
                                            name="phone" 
                                            value={formData.phone} 
                                            onChange={handleChange} 
                                            onInput={(e) => {
                                                const target = e.currentTarget;
                                                if (/[^0-9]/.test(target.value)) {
                                                    target.setCustomValidity("กรอกได้เฉพาะตัวเลข");
                                                    target.reportValidity();
                                                    target.value = target.value.replace(/[^0-9]/g, "");
                                                    target.setCustomValidity("");
                                                } else {
                                                    target.setCustomValidity("");
                                                }
                                            }}
                                            className={`${styles.input} ${errors.phone ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                            placeholder="02-123-4567" 
                                            required
                                        />
                                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className={styles.label}>มือถือ</label>
                                        <input 
                                            name="mobile" 
                                            value={formData.mobile} 
                                            onChange={handleChange} 
                                            onInput={(e) => {
                                                const target = e.currentTarget;
                                                if (/[^0-9]/.test(target.value)) {
                                                    target.setCustomValidity("กรอกได้เฉพาะตัวเลข");
                                                    target.reportValidity();
                                                    target.value = target.value.replace(/[^0-9]/g, "");
                                                    target.setCustomValidity("");
                                                } else {
                                                    target.setCustomValidity("");
                                                }
                                            }}
                                            className={`${styles.input} ${errors.mobile ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                            placeholder="081-234-5678" 
                                        />
                                        {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className={styles.label}>อีเมล <span className="text-red-500">*</span></label>
                                        <input 
                                            name="email" 
                                            type="email"
                                            value={formData.email} 
                                            onChange={handleChange} 
                                            className={styles.input} 
                                            placeholder="contact@example.com" 
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className={styles.label}>เว็บไซต์</label>
                                        <input 
                                            name="website" 
                                            value={formData.website} 
                                            onChange={handleChange} 
                                            className={styles.input} 
                                            placeholder="www.example.com" 
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* 3. Address - Primary (REGISTERED) + Contact Address with "Same as Primary" checkbox */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                        <MapPin size={20} />
                                        <h3 className="font-semibold text-lg">ที่อยู่</h3>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={addAddress}
                                        className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors border border-blue-100 dark:border-blue-900/30"
                                    >
                                        <Plus size={16} /> <span className="mt-0.5">เพิ่มที่อยู่</span>
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    {/* Registered Address (REGISTERED) */}
                                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded text-xs font-semibold">
                                                REGISTERED
                                            </span>
                                            ที่อยู่จดทะเบียน
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2 space-y-1">
                                                <label className={styles.label}>ที่อยู่ <span className="text-red-500">*</span></label>
                                                <textarea 
                                                    value={formData.addresses[0].address}
                                                    onChange={(e) => updateRegisteredAddress('address', e.target.value)}
                                                    className={styles.input} 
                                                    rows={2}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={styles.label}>แขวง/ตำบล</label>
                                                <input 
                                                    value={formData.addresses[0].subDistrict}
                                                    onChange={(e) => updateRegisteredAddress('subDistrict', e.target.value)}
                                                    className={styles.input}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={styles.label}>เขต/อำเภอ</label>
                                                <input 
                                                    value={formData.addresses[0].district}
                                                    onChange={(e) => updateRegisteredAddress('district', e.target.value)}
                                                    className={styles.input}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={styles.label}>จังหวัด <span className="text-red-500">*</span></label>
                                                <input 
                                                    value={formData.addresses[0].province}
                                                    onChange={(e) => updateRegisteredAddress('province', e.target.value)}
                                                    className={styles.input} 
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={styles.label}>รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                                                <input 
                                                    value={formData.addresses[0].postalCode}
                                                    onChange={(e) => updateRegisteredAddress('postalCode', e.target.value)}
                                                    onInput={(e) => {
                                                        const target = e.currentTarget;
                                                        if (/[^0-9]/.test(target.value)) {
                                                            target.setCustomValidity("กรอกได้เฉพาะตัวเลข");
                                                            target.reportValidity();
                                                            target.value = target.value.replace(/[^0-9]/g, "");
                                                            target.setCustomValidity("");
                                                        } else {
                                                            target.setCustomValidity("");
                                                        }
                                                    }}
                                                    className={`${styles.input} ${errors['addresses[0].postalCode'] ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                                    required
                                                />
                                                {errors['addresses[0].postalCode'] && <p className="text-red-500 text-xs mt-1">{errors['addresses[0].postalCode']}</p>}
                                            </div>
                                            
                                            {/* Address Specific Contact Info */}
                                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                                                <div className="space-y-1">
                                                    <label className={styles.label}>ผู้ติดต่อสาขา</label>
                                                    <input 
                                                        value={formData.addresses[0].contactPerson || ''}
                                                        onChange={(e) => updateRegisteredAddress('contactPerson', e.target.value)}
                                                        className={styles.input} 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>โทรศัพท์/ต่อ</label>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <input 
                                                                value={formData.addresses[0].phone || ''}
                                                                onChange={(e) => updateRegisteredAddress('phone', e.target.value)}
                                                                onInput={(e) => {
                                                                    const target = e.currentTarget;
                                                                    if (/[^0-9]/.test(target.value)) {
                                                                        target.setCustomValidity("กรอกได้เฉพาะตัวเลข");
                                                                        target.reportValidity();
                                                                        target.value = target.value.replace(/[^0-9]/g, "");
                                                                        target.setCustomValidity("");
                                                                    } else {
                                                                        target.setCustomValidity("");
                                                                    }
                                                                }}
                                                                className={`w-full min-w-0 h-10 px-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400 ${errors['addresses[0].phone'] ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                                            />
                                                            {errors['addresses[0].phone'] && <p className="text-red-500 text-xs mt-1">{errors['addresses[0].phone']}</p>}
                                                        </div>
                                                        <div className="w-24">
                                                            <input 
                                                                value={formData.addresses[0].phoneExtension || ''}
                                                                onChange={(e) => updateRegisteredAddress('phoneExtension', e.target.value)}
                                                                onInput={(e) => {
                                                                    const target = e.currentTarget;
                                                                    if (/[^0-9]/.test(target.value)) {
                                                                        target.setCustomValidity("กรอกได้เฉพาะตัวเลข");
                                                                        target.reportValidity();
                                                                        target.value = target.value.replace(/[^0-9]/g, "");
                                                                        target.setCustomValidity("");
                                                                    } else {
                                                                        target.setCustomValidity("");
                                                                    }
                                                                }}
                                                                className={`w-full h-10 px-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400 ${errors['addresses[0].phoneExtension'] ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                                            />
                                                            {errors['addresses[0].phoneExtension'] && <p className="text-red-500 text-xs mt-1">{errors['addresses[0].phoneExtension']}</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 space-y-1">
                                                <label className={styles.label}>ประเทศ</label>
                                                    <input 
                                                        value={formData.addresses[0].country}
                                                        onChange={(e) => updateRegisteredAddress('country', e.target.value)}
                                                        className={styles.input} 
                                                    />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Address (CONTACT) */}
                                    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                            <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">
                                                    CONTACT
                                                </span>
                                                ที่อยู่ที่ติดต่อ
                                            </h4>

                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.sameAsRegistered}
                                                        onChange={(e) => handleSameAsRegisteredChange(e.target.checked)}
                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                        ที่อยู่ที่ติดต่อเหมือนที่อยู่จดทะเบียน
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                        
                                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ${formData.sameAsRegistered ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                            <div className="md:col-span-2 space-y-1">
                                                <label className={styles.label}>ที่อยู่ <span className="text-red-500">*</span></label>
                                                <textarea 
                                                    value={formData.addresses[1].address}
                                                    onChange={(e) => updateContactAddress('address', e.target.value)}
                                                    className={styles.input} 
                                                    rows={2}
                                                    disabled={formData.sameAsRegistered}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={styles.label}>แขวง/ตำบล</label>
                                                <input 
                                                    value={formData.addresses[1].subDistrict}
                                                    onChange={(e) => updateContactAddress('subDistrict', e.target.value)}
                                                    className={styles.input} 
                                                    disabled={formData.sameAsRegistered}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={styles.label}>เขต/อำเภอ</label>
                                                <input 
                                                    value={formData.addresses[1].district}
                                                    onChange={(e) => updateContactAddress('district', e.target.value)}
                                                    className={styles.input} 
                                                    disabled={formData.sameAsRegistered}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={styles.label}>จังหวัด <span className="text-red-500">*</span></label>
                                                <input 
                                                    value={formData.addresses[1].province}
                                                    onChange={(e) => updateContactAddress('province', e.target.value)}
                                                    className={styles.input} 
                                                    disabled={formData.sameAsRegistered}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={styles.label}>รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                                                <input 
                                                    value={formData.addresses[1].postalCode}
                                                    onChange={(e) => updateContactAddress('postalCode', e.target.value)}
                                                    onInput={(e) => {
                                                        const target = e.currentTarget;
                                                        if (/[^0-9]/.test(target.value)) {
                                                            target.setCustomValidity("กรอกได้เฉพาะตัวเลข");
                                                            target.reportValidity();
                                                            target.value = target.value.replace(/[^0-9]/g, "");
                                                            target.setCustomValidity("");
                                                        } else {
                                                            target.setCustomValidity("");
                                                        }
                                                    }}
                                                    className={`${styles.input} ${errors['addresses[1].postalCode'] ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                                    disabled={formData.sameAsRegistered}
                                                    required
                                                />
                                                {errors['addresses[1].postalCode'] && <p className="text-red-500 text-xs mt-1">{errors['addresses[1].postalCode']}</p>}
                                            </div>
                                            
                                            {/* Address Specific Contact Info */}
                                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                                                <div className="space-y-1">
                                                    <label className={styles.label}>ผู้ติดต่อสาขา</label>
                                                    <input 
                                                        value={formData.addresses[1].contactPerson || ''}
                                                        onChange={(e) => updateContactAddress('contactPerson', e.target.value)}
                                                        className={styles.input} 
                                                        disabled={formData.sameAsRegistered}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>โทรศัพท์/ต่อ</label>
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <input 
                                                                value={formData.addresses[1].phone || ''}
                                                                onChange={(e) => updateContactAddress('phone', e.target.value)}
                                                                onInput={(e) => {
                                                                    const target = e.currentTarget;
                                                                    if (/[^0-9]/.test(target.value)) {
                                                                        target.setCustomValidity("กรอกได้เฉพาะตัวเลข");
                                                                        target.reportValidity();
                                                                        target.value = target.value.replace(/[^0-9]/g, "");
                                                                        target.setCustomValidity("");
                                                                    } else {
                                                                        target.setCustomValidity("");
                                                                    }
                                                                }}
                                                                className={`w-full min-w-0 h-10 px-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50 ${errors['addresses[1].phone'] ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                                                disabled={formData.sameAsRegistered}
                                                            />
                                                            {errors['addresses[1].phone'] && <p className="text-red-500 text-xs mt-1">{errors['addresses[1].phone']}</p>}
                                                        </div>
                                                        <div className="w-24">
                                                            <input 
                                                                value={formData.addresses[1].phoneExtension || ''}
                                                                onChange={(e) => updateContactAddress('phoneExtension', e.target.value)}
                                                                onInput={(e) => {
                                                                    const target = e.currentTarget;
                                                                    if (/[^0-9]/.test(target.value)) {
                                                                        target.setCustomValidity("กรอกได้เฉพาะตัวเลข");
                                                                        target.reportValidity();
                                                                        target.value = target.value.replace(/[^0-9]/g, "");
                                                                        target.setCustomValidity("");
                                                                    } else {
                                                                        target.setCustomValidity("");
                                                                    }
                                                                }}
                                                                className={`w-full h-10 px-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400 disabled:opacity-50 ${errors['addresses[1].phoneExtension'] ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                                                disabled={formData.sameAsRegistered}
                                                            />
                                                            {errors['addresses[1].phoneExtension'] && <p className="text-red-500 text-xs mt-1">{errors['addresses[1].phoneExtension']}</p>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 space-y-1">
                                                <label className={styles.label}>ประเทศ</label>
                                                    <input 
                                                        value={formData.addresses[1].country}
                                                        onChange={(e) => updateContactAddress('country', e.target.value)}
                                                        className={styles.input} 
                                                        disabled={formData.sameAsRegistered}
                                                    />
                                            </div>
                                        </div>

                                        
                                    </div>

                                    {/* Dynamic Addresses (Index 2+) */}
                                    {formData.addresses.slice(2).map((addr, idx) => {
                                        const actualIndex = idx + 2;
                                        return (
                                            <div 
                                                key={addr.id} 
                                                id={`address-block-${addr.id}`}
                                                className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative group animate-in slide-in-from-left-2 duration-300"
                                            >
                                                <button 
                                                    type="button"
                                                    onClick={() => removeAddress(actualIndex)}
                                                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                    title="ลบที่อยู่นี้"
                                                >
                                                    <Trash2 size={18} />
                                                </button>

                                                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                                                    <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded text-xs font-semibold">
                                                            ADDITIONAL
                                                        </span>
                                                        ที่อยู่อื่นๆ #{idx + 1}
                                                    </h4>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">ประเภท:</label>
                                                        <select
                                                            value={addr.addressType}
                                                            onChange={(e) => updateAddress(actualIndex, 'addressType', e.target.value)}
                                                            className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                                                        >
                                                            <option value="SHIPPING">Shipping (ส่งของ)</option>
                                                            <option value="BILLING">Billing (วางบิล)</option>
                                                            <option value="WAREHOUSE">Warehouse (คลังสินค้า)</option>
                                                            <option value="OFFICE">Office (สำนักงาน)</option>
                                                            <option value="OTHER">Other (อื่นๆ)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="md:col-span-2 space-y-1">
                                                        <label className={styles.label}>ที่อยู่ <span className="text-red-500">*</span></label>
                                                        <textarea 
                                                            value={addr.address}
                                                            onChange={(e) => updateAddress(actualIndex, 'address', e.target.value)}
                                                            className={styles.input} 
                                                            rows={2}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={styles.label}>แขวง/ตำบล</label>
                                                        <input 
                                                            value={addr.subDistrict}
                                                            onChange={(e) => updateAddress(actualIndex, 'subDistrict', e.target.value)}
                                                            className={styles.input}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={styles.label}>เขต/อำเภอ</label>
                                                        <input 
                                                            value={addr.district}
                                                            onChange={(e) => updateAddress(actualIndex, 'district', e.target.value)}
                                                            className={styles.input}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={styles.label}>จังหวัด <span className="text-red-500">*</span></label>
                                                        <input 
                                                            value={addr.province}
                                                            onChange={(e) => updateAddress(actualIndex, 'province', e.target.value)}
                                                            className={styles.input} 
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className={styles.label}>รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                                                        <input 
                                                            value={addr.postalCode}
                                                            onChange={(e) => updateAddress(actualIndex, 'postalCode', e.target.value)}
                                                            onInput={(e) => {
                                                                const target = e.currentTarget;
                                                                if (/[^0-9]/.test(target.value)) {
                                                                    target.setCustomValidity("กรอกได้เฉพาะตัวเลข");
                                                                    target.reportValidity();
                                                                    target.value = target.value.replace(/[^0-9]/g, "");
                                                                    target.setCustomValidity("");
                                                                } else {
                                                                    target.setCustomValidity("");
                                                                }
                                                            }}
                                                            className={`${styles.input} ${errors[`addresses[${actualIndex}].postalCode`] ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                                            required
                                                        />
                                                        {errors[`addresses[${actualIndex}].postalCode`] && <p className="text-red-500 text-xs mt-1">{errors[`addresses[${actualIndex}].postalCode`]}</p>}
                                                    </div>
                                                    
                                                    {/* Address Specific Contact Info */}
                                                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                                                        <div className="space-y-1">
                                                            <label className={styles.label}>ผู้ติดต่อสาขา</label>
                                                            <input 
                                                                value={addr.contactPerson || ''}
                                                                onChange={(e) => updateAddress(actualIndex, 'contactPerson', e.target.value)}
                                                                className={styles.input} 
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className={styles.label}>โทรศัพท์/ต่อ</label>
                                                            <div className="flex gap-2">
                                                                <div className="flex-1">
                                                                    <input 
                                                                        value={addr.phone || ''}
                                                                        onChange={(e) => updateAddress(actualIndex, 'phone', e.target.value)}
                                                                        onInput={(e) => {
                                                                            const target = e.currentTarget;
                                                                            if (/[^0-9]/.test(target.value)) {
                                                                                target.setCustomValidity("กรอกได้เฉพาะตัวเลข");
                                                                                target.reportValidity();
                                                                                target.value = target.value.replace(/[^0-9]/g, "");
                                                                                target.setCustomValidity("");
                                                                            } else {
                                                                                target.setCustomValidity("");
                                                                            }
                                                                        }}
                                                                        className={`w-full min-w-0 h-10 px-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400 ${errors[`addresses[${actualIndex}].phone`] ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                                                    />
                                                                    {errors[`addresses[${actualIndex}].phone`] && <p className="text-red-500 text-xs mt-1">{errors[`addresses[${actualIndex}].phone`]}</p>}
                                                                </div>
                                                                <div className="w-24">
                                                                    <input 
                                                                        value={addr.phoneExtension || ''}
                                                                        onChange={(e) => updateAddress(actualIndex, 'phoneExtension', e.target.value)}
                                                                        onInput={(e) => {
                                                                            const target = e.currentTarget;
                                                                            if (/[^0-9]/.test(target.value)) {
                                                                                target.setCustomValidity("กรอกได้เฉพาะตัวเลข");
                                                                                target.reportValidity();
                                                                                target.value = target.value.replace(/[^0-9]/g, "");
                                                                                target.setCustomValidity("");
                                                                            } else {
                                                                                target.setCustomValidity("");
                                                                            }
                                                                        }}
                                                                        className={`w-full h-10 px-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400 ${errors[`addresses[${actualIndex}].phoneExtension`] ? 'border-red-500 focus:ring-red-500' : ''}`} 
                                                                    />
                                                                    {errors[`addresses[${actualIndex}].phoneExtension`] && <p className="text-red-500 text-xs mt-1">{errors[`addresses[${actualIndex}].phoneExtension`]}</p>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Add Button at bottom too for convenience */}
                                    {formData.addresses.length >= 3 && (
                                        <div className="flex justify-center pt-2">
                                            <button 
                                                type="button" 
                                                onClick={addAddress}
                                                className="text-sm flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium py-2 px-6 rounded-full border border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300"
                                            >
                                                <Plus size={16} /> เพิ่มที่อยู่อื่นๆ
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* 4. Payment Conditions */}
                            <section>
                                <div className="flex items-center gap-2 mb-4 text-purple-600 dark:text-purple-400">
                                    <CreditCard size={20} />
                                    <h3 className="font-semibold text-lg">เงื่อนไขการชำระเงิน</h3>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className={styles.label}>เงื่อนไขการชำระเงิน <span className="text-red-500">*</span></label>
                                        <select 
                                            name="paymentTerms" 
                                            value={formData.paymentTerms} 
                                            onChange={handleChange} 
                                            className={styles.inputSelect}
                                            required
                                        >
                                            <option value="" disabled>เลือก</option>
                                            <option value="Cash">Cash</option>
                                            <option value="Net 7 Days">Net 7 Days</option>
                                            <option value="Net 15 Days">Net 15 Days</option>
                                            <option value="Net 30 Days">Net 30 Days</option>
                                            <option value="Net 60 Days">Net 60 Days</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={styles.label}>วงเงินเครดิต (THB)</label>
                                        <input 
                                            type="number"
                                            name="creditLimit" 
                                            value={formData.creditLimit} 
                                            onChange={handleChange} 
                                            className={styles.input} 
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* 5. Bank Accounts */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                                        <Database size={20} />
                                        <h3 className="font-semibold text-lg">บัญชีธนาคาร</h3>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={addBankAccount}
                                        className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        <Plus size={16} /> เพิ่มบัญชี
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    {formData.bankAccounts.map((account, index) => (
                                        <div key={account.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative">
                                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 block">บัญชีที่ {index + 1}</h4>
                                            
                                            {/* Delete Button */}
                                            <button 
                                                type="button"
                                                onClick={() => removeBankAccount(account.id)}
                                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                                            >
                                                <Trash2 size={18} />
                                            </button>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className={styles.label}>ชื่อธนาคาร</label>
                                                    <input 
                                                        value={account.bankName} 
                                                        onChange={(e) => updateBankAccount(account.id, 'bankName', e.target.value)} 
                                                        className={styles.input} 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>สาขา</label>
                                                    <input 
                                                        value={account.branchName} 
                                                        onChange={(e) => updateBankAccount(account.id, 'branchName', e.target.value)} 
                                                        className={styles.input} 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>เลขที่บัญชี</label>
                                                    <input 
                                                        value={account.accountNumber} 
                                                        onChange={(e) => updateBankAccount(account.id, 'accountNumber', e.target.value)} 
                                                        className={styles.input} 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>ชื่อบัญชี</label>
                                                    <input 
                                                        value={account.accountName} 
                                                        onChange={(e) => updateBankAccount(account.id, 'accountName', e.target.value)} 
                                                        className={styles.input} 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>ประเภทบัญชี</label>
                                                    <select 
                                                        value={account.accountType} 
                                                        onChange={(e) => updateBankAccount(account.id, 'accountType', e.target.value)} 
                                                        className={styles.inputSelect}
                                                    >
                                                        <option value="SAVING">ออมทรัพย์</option>
                                                        <option value="CURRENT">กระแสรายวัน</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>SWIFT Code</label>
                                                    <input 
                                                        value={account.swiftCode} 
                                                        onChange={(e) => updateBankAccount(account.id, 'swiftCode', e.target.value)} 
                                                        className={styles.input} 
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                 <label className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={account.isMain}
                                                        onChange={(e) => updateBankAccount(account.id, 'isMain', e.target.checked)}
                                                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ตั้งเป็นบัญชีหลัก</span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                    {formData.bankAccounts.length === 0 && (
                                        <div className="text-center py-6 bg-gray-100 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-500">
                                            ยังไม่มีบัญชีธนาคาร
                                        </div>
                                    )}
                                </div>
                            </section>

                             {/* 6. Additional Contacts */}
                             <section>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                        <User size={20} />
                                        <h3 className="font-semibold text-lg">ผู้ติดต่อเพิ่มเติม</h3>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={addContactPerson}
                                        className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        <Plus size={16} /> เพิ่มผู้ติดต่อ
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    {formData.additionalContacts.map((contact, index) => (
                                        <div key={contact.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative">
                                            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 block">ผู้ติดต่อที่ {index + 1}</h4>
                                            
                                            <button 
                                                type="button"
                                                onClick={() => removeContactPerson(contact.id)}
                                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                                            >
                                                <Trash2 size={18} />
                                            </button>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className={styles.label}>ชื่อผู้ติดต่อ</label>
                                                    <input 
                                                        value={contact.name} 
                                                        onChange={(e) => updateContactPerson(contact.id, 'name', e.target.value)} 
                                                        className={styles.input} 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>ตำแหน่ง</label>
                                                    <input 
                                                        value={contact.position} 
                                                        onChange={(e) => updateContactPerson(contact.id, 'position', e.target.value)} 
                                                        className={styles.input} 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>โทรศัพท์</label>
                                                    <input 
                                                        value={contact.phone} 
                                                        onChange={(e) => updateContactPerson(contact.id, 'phone', e.target.value)} 
                                                        className={styles.input} 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>มือถือ</label>
                                                    <input 
                                                        value={contact.mobile} 
                                                        onChange={(e) => updateContactPerson(contact.id, 'mobile', e.target.value)} 
                                                        className={styles.input} 
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <label className={styles.label}>อีเมล</label>
                                                    <input 
                                                        value={contact.email} 
                                                        onChange={(e) => updateContactPerson(contact.id, 'email', e.target.value)} 
                                                        className={styles.input} 
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                 <label className="flex items-center gap-2 cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={contact.isMain}
                                                        onChange={(e) => updateContactPerson(contact.id, 'isMain', e.target.checked)}
                                                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ตั้งเป็นผู้ติดต่อหลัก</span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                    {formData.additionalContacts.length === 0 && (
                                        <div className="text-center py-6 bg-gray-100 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-500">
                                            ไม่มีผู้ติดต่อเพิ่มเติม
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* 7. Remarks */}
                            <section>
                                <div className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-400">
                                    <Database size={20} />
                                    <h3 className="font-semibold text-lg">หมายเหตุ</h3>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <textarea 
                                        name="remarks"
                                        value={formData.remarks} 
                                        onChange={handleChange} 
                                        className={styles.input} 
                                        rows={3}
                                    />
                                </div>
                            </section>

                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0 z-10 flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition"
                    >
                        ยกเลิก
                    </button>
                    
                    {/* Last Modified Footer (Edit Mode Only) */}
                    {initialData && (
                         <div className="mr-auto flex items-center gap-2 text-xs text-gray-400 italic">
                            <History size={14} />
                            <span>
                                แก้ไขล่าสุด: {new Date(initialData.updated_at).toLocaleString('th-TH', { 
                                    year: 'numeric', 
                                    month: '2-digit', 
                                    day: '2-digit', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })} โดย {initialData.updated_by || 'Unknown'}
                            </span>
                        </div>
                    )}

                    <button 
                        type="submit"
                        form="vendor-form"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg hover:shadow-blue-500/30 transition flex items-center gap-2"
                    >
                        <Save size={18} />
                        {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </div>

            </div>
        </div>
    );
}
