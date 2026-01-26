/**
 * @file VendorFormModal.tsx
 * @description Modal สำหรับ เพิ่ม/แก้ไข ข้อมูล Vendor (UI Refactor)
 * @purpose ใช้สำหรับ Quick Edit หรือ Add New จากหน้า Dashboard
 * @design Vertical layout with grouped sections (General, Contact, Address, Payment, Bank, etc.)
 */

import { useState, useEffect, useRef } from 'react';
import { 
    X, Save, Building2, Phone, MapPin, Database, CreditCard, 
    Plus, Trash2, User
} from 'lucide-react';
import { styles } from '../../../constants';
import { vendorService } from '../../../services/vendorService';
import type { 
    VendorFormData,
    VendorBankAccount,
    VendorContactPerson
} from '../../../types/vendor-types';
import { 
    initialVendorFormData, 
    toVendorFormData as mapToFormData, 
    toVendorCreateRequest,
} from '../../../types/vendor-types';

interface VendorFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    vendorId?: string; // If provided, edit mode
}

export function VendorFormModal({ isOpen, onClose, vendorId }: VendorFormModalProps) {
    const [formData, setFormData] = useState<VendorFormData>(initialVendorFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [headerTitle, setHeaderTitle] = useState('เพิ่มเจ้าหนี้ใหม่');
    const prevIsOpenRef = useRef(isOpen);

    // Fetch data if vendorId is provided
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            const timer = setTimeout(async () => {
                if (vendorId) {
                    setHeaderTitle('เพิ่มเจ้าหนี้ใหม่');
                    setIsLoading(true);
                    try {
                        const vendor = await vendorService.getById(vendorId);
                        if (vendor) {
                            const apiData = mapToFormData(vendor);
                            setFormData({
                                ...apiData,
                                vendorCodeSearch: '',
                            });
                        } else {
                            console.error('Vendor not found');
                            // Handle not found (optional: close modal or show alert using window.alert or existing UI if restored)
                        }
                    } catch (error) {
                        console.error('Error fetching vendor:', error);
                    } finally {
                        setIsLoading(false);
                    }
                } else {
                    setHeaderTitle('เพิ่มเจ้าหนี้ใหม่');
                    setFormData(initialVendorFormData);
                }
            }, 0);
            return () => clearTimeout(timer);
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, vendorId, setHeaderTitle]);



    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        let checked = false;
        if (type === 'checkbox') {
            checked = (e.target as HTMLInputElement).checked;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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
        setFormData(prev => ({
            ...prev,
            bankAccounts: prev.bankAccounts.map(acc => 
                acc.id === id ? { ...acc, [field]: value } : acc
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
        setFormData(prev => ({
            ...prev,
            additionalContacts: prev.additionalContacts.map(c => 
                c.id === id ? { ...c, [field]: value } : c
            )
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const request = toVendorCreateRequest(formData);
            
            if (vendorId) {
                await vendorService.update(vendorId, request);
            } else {
                await vendorService.create(request);
            }
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
                                            disabled={!!vendorId}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={styles.label}>ชื่อเจ้าหนี้ (ไทย) <span className="text-red-500">*</span></label>
                                        <input 
                                            name="vendorNameTh" 
                                            value={formData.vendorNameTh} 
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
                                                name="vendorType" 
                                                value={formData.vendorType} 
                                                onChange={handleChange} 
                                                className={styles.inputSelect}
                                            >
                                                <option value="COMPANY">ผู้จัดจำหน่าย (Distributor)</option>
                                                <option value="INDIVIDUAL">บุคคลธรรมดา (Individual)</option>
                                                <option value="GOVERNMENT">หน่วยงานราชการ (Government)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Business Category & Tax ID */}
                                    <div className="space-y-1">
                                        <label className={styles.label}>หมวดหมู่ธุรกิจ <span className="text-red-500">*</span></label>
                                        <select 
                                            name="businessCategory" 
                                            value={formData.businessCategory} 
                                            onChange={handleChange} 
                                            className={styles.inputSelect}
                                        >
                                            <option value="">เลือกหมวดหมู่...</option>
                                            <option value="IT">อุปกรณ์ไอที</option>
                                            <option value="OFFICE">อุปกรณ์สำนักงาน</option>
                                            <option value="SERVICE">บริการ</option>
                                            <option value="CONST">รับเหมาก่อสร้าง</option>
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
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={styles.label}>สกุลเงิน</label>
                                        <select 
                                            name="currency" 
                                            value={formData.currency} 
                                            onChange={handleChange} 
                                            className={styles.inputSelect}
                                        >
                                            <option value="THB">THB - บาท</option>
                                            <option value="USD">USD - ดอลลาร์สหรัฐ</option>
                                            <option value="EUR">EUR - ยูโร</option>
                                            <option value="JPY">JPY - เยน</option>
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
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={styles.label}>โทรศัพท์ <span className="text-red-500">*</span></label>
                                        <input 
                                            name="phone" 
                                            value={formData.phone} 
                                            onChange={handleChange} 
                                            className={styles.input} 
                                            placeholder="02-123-4567" 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={styles.label}>มือถือ</label>
                                        <input 
                                            name="mobile" 
                                            value={formData.mobile} 
                                            onChange={handleChange} 
                                            className={styles.input} 
                                            placeholder="081-234-5678" 
                                        />
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

                            {/* 3. Address */}
                            <section>
                                <div className="flex items-center gap-2 mb-4 text-red-600 dark:text-red-400">
                                    <MapPin size={20} />
                                    <h3 className="font-semibold text-lg">ที่อยู่</h3>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                                    <div className="space-y-1">
                                        <label className={styles.label}>ที่อยู่ <span className="text-red-500">*</span></label>
                                        <input 
                                            name="addressLine1" 
                                            value={formData.addressLine1} 
                                            onChange={handleChange} 
                                            className={styles.input} 
                                            placeholder="123 ถนนสุขุมวิท แขวงคลองตัน" 
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className={styles.label}>เขต/อำเภอ</label>
                                            <input 
                                                name="district" 
                                                value={formData.district} 
                                                onChange={handleChange} 
                                                className={styles.input} 
                                                placeholder="คลองเตย" 
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={styles.label}>จังหวัด <span className="text-red-500">*</span></label>
                                            <input 
                                                name="province" 
                                                value={formData.province} 
                                                onChange={handleChange} 
                                                className={styles.input} 
                                                placeholder="กรุงเทพมหานคร" 
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={styles.label}>รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                                            <input 
                                                name="postalCode" 
                                                value={formData.postalCode} 
                                                onChange={handleChange} 
                                                className={styles.input} 
                                                placeholder="10110" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={styles.label}>ประเทศ <span className="text-red-500">*</span></label>
                                        <input 
                                            name="country" 
                                            value={formData.country} 
                                            onChange={handleChange} 
                                            className={styles.input} 
                                            placeholder="Thailand" 
                                        />
                                    </div>
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
                                        >
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
                                            placeholder="0.00" 
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
                                                        placeholder="ธนาคารกสิกรไทย" 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>สาขา</label>
                                                    <input 
                                                        value={account.branchName} 
                                                        onChange={(e) => updateBankAccount(account.id, 'branchName', e.target.value)} 
                                                        className={styles.input} 
                                                        placeholder="สาขาสุขุมวิท" 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>เลขที่บัญชี</label>
                                                    <input 
                                                        value={account.accountNumber} 
                                                        onChange={(e) => updateBankAccount(account.id, 'accountNumber', e.target.value)} 
                                                        className={styles.input} 
                                                        placeholder="123-4-56789-0" 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>ชื่อบัญชี</label>
                                                    <input 
                                                        value={account.accountName} 
                                                        onChange={(e) => updateBankAccount(account.id, 'accountName', e.target.value)} 
                                                        className={styles.input} 
                                                        placeholder="บริษัท ABC จำกัด" 
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
                                                        placeholder="KASITHBK" 
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
                                                        placeholder="คุณสมชาย ใจดี" 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>ตำแหน่ง</label>
                                                    <input 
                                                        value={contact.position} 
                                                        onChange={(e) => updateContactPerson(contact.id, 'position', e.target.value)} 
                                                        className={styles.input} 
                                                        placeholder="Sales Manager" 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>โทรศัพท์</label>
                                                    <input 
                                                        value={contact.phone} 
                                                        onChange={(e) => updateContactPerson(contact.id, 'phone', e.target.value)} 
                                                        className={styles.input} 
                                                        placeholder="02-123-4567" 
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={styles.label}>มือถือ</label>
                                                    <input 
                                                        value={contact.mobile} 
                                                        onChange={(e) => updateContactPerson(contact.id, 'mobile', e.target.value)} 
                                                        className={styles.input} 
                                                        placeholder="081-234-5678" 
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-1">
                                                    <label className={styles.label}>อีเมล</label>
                                                    <input 
                                                        value={contact.email} 
                                                        onChange={(e) => updateContactPerson(contact.id, 'email', e.target.value)} 
                                                        className={styles.input} 
                                                        placeholder="somchai@example.com" 
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
                                        placeholder="หมายเหตุเพิ่มเติม..." 
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
