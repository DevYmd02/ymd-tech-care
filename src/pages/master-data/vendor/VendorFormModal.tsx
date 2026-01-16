/**
 * @file VendorFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลเจ้าหนี้ (Vendor Master Data)
 */

import React, { useState, useEffect } from 'react';
import { 
    FileText, Minimize2, Maximize2, X, Save, Search, Plus, Trash2, Copy,
    Home, ClipboardList, CreditCard, Settings, Phone, DollarSign, Building2, Check,
    Loader2
} from 'lucide-react';
import { vendorService } from '../../../services/vendorService';
import type { VendorFormData } from '../../../types/vendor-types';
import { toVendorCreateRequest } from '../../../types/vendor-types';

// ====================================================================================
// LOCAL TYPES
// ====================================================================================

type VendorTabType = 'address' | 'detail' | 'credit' | 'general' | 'contact' | 'account' | 'branch';

// Extended form data for modal (includes search field)
interface ModalFormData extends VendorFormData {
    vendorCodeSearch: string;
    vendorNameTh: string;
}

const initialFormData: ModalFormData = {
    vendorCode: '',
    vendorCodeSearch: '',
    vendorName: '',
    vendorNameTh: '',
    vendorNameEn: '',
    taxId: '',
    vendorType: 'COMPANY',
    addressLine1: '',
    addressLine2: '',
    subDistrict: '',
    district: '',
    province: '',
    postalCode: '',
    useAddressPP20: false,
    contactAddressLine1: '',
    contactAddressLine2: '',
    contactSubDistrict: '',
    contactDistrict: '',
    contactProvince: '',
    contactPostalCode: '',
    phone: '',
    phoneExt: '',
    email: '',
    onHold: false,
    blocked: false,
    inactive: false,
};

// ====================================================================================
// COMPONENT PROPS
// ====================================================================================

interface Props {
    isOpen: boolean;
    onClose: () => void;
    vendorId?: string; // For edit mode
}

// ====================================================================================
// TAB CONFIGURATION
// ====================================================================================

const tabs: { key: VendorTabType; label: string; icon: React.ReactNode }[] = [
    { key: 'address', label: 'Address', icon: <Home size={16} /> },
    { key: 'detail', label: 'Detail', icon: <ClipboardList size={16} /> },
    { key: 'credit', label: 'Credit', icon: <CreditCard size={16} /> },
    { key: 'general', label: 'General', icon: <Settings size={16} /> },
    { key: 'contact', label: 'Contact', icon: <Phone size={16} /> },
    { key: 'account', label: 'Account', icon: <DollarSign size={16} /> },
    { key: 'branch', label: 'Branch', icon: <Building2 size={16} /> },
];

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export const VendorFormModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isMaximized, setIsMaximized] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<ModalFormData>(initialFormData);
    const [activeTab, setActiveTab] = useState<VendorTabType>('address');

    // Animation Effect
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isOpen) {
            timer = setTimeout(() => {
                setIsClosing(false);
                setIsAnimating(true);
            }, 10);
        } else {
            timer = setTimeout(() => {
                setIsAnimating(false);
            }, 0);
        }
        return () => clearTimeout(timer);
    }, [isOpen]);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                setFormData(initialFormData);
                setActiveTab('address');
                setSaveError(null);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setIsAnimating(false);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    const handleInputChange = (field: keyof ModalFormData, value: string | boolean) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            
            // Auto-sync contact address if checkbox is checked
            if (prev.useAddressPP20) {
                if (field === 'addressLine1') updated.contactAddressLine1 = value as string;
                else if (field === 'addressLine2') updated.contactAddressLine2 = value as string;
                else if (field === 'subDistrict') updated.contactSubDistrict = value as string;
                else if (field === 'district') updated.contactDistrict = value as string;
                else if (field === 'province') updated.contactProvince = value as string;
                else if (field === 'postalCode') updated.contactPostalCode = value as string;
            }

            return updated;
        });
    };

    const handleCheckboxChange = () => {
        setFormData(prev => {
            const newUseAddressPP20 = !prev.useAddressPP20;
            if (newUseAddressPP20) {
                // Copy values when checked
                return {
                    ...prev,
                    useAddressPP20: newUseAddressPP20,
                    contactAddressLine1: prev.addressLine1,
                    contactAddressLine2: prev.addressLine2,
                    contactSubDistrict: prev.subDistrict,
                    contactDistrict: prev.district,
                    contactProvince: prev.province,
                    contactPostalCode: prev.postalCode,
                };
            } else {
                // Clear values when unchecked
                return { 
                    ...prev, 
                    useAddressPP20: newUseAddressPP20,
                    contactAddressLine1: '',
                    contactAddressLine2: '',
                    contactSubDistrict: '',
                    contactDistrict: '',
                    contactProvince: '',
                    contactPostalCode: '',
                };
            }
        });
    };

    // Save handler - call API
    const handleSave = async () => {
        if (!formData.vendorName.trim()) {
            setSaveError('กรุณากรอกชื่อผู้ขาย');
            return;
        }

        setIsSaving(true);
        setSaveError(null);

        try {
            const request = toVendorCreateRequest(formData);
            const result = await vendorService.create(request);
            
            if (result.success) {
                handleClose();
            } else {
                setSaveError(result.message || 'เกิดข้อผิดพลาดในการบันทึก');
            }
        } catch {
            setSaveError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen && !isClosing) return null;

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-300 font-sans ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div className={`
                flex flex-col overflow-hidden bg-white dark:bg-gray-900 shadow-2xl border-4 border-blue-600 dark:border-blue-500 transition-all duration-300 ease-out origin-center
                ${isMaximized 
                    ? 'w-full h-full rounded-none border-0 scale-100' 
                    : 'w-full max-w-7xl h-[85vh] scale-100 rounded-2xl'
                }
                ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}>
                {/* ================= HEADER BAR ================= */}
                <div className="bg-blue-600 text-white px-3 py-1.5 font-bold text-sm flex justify-between items-center select-none flex-shrink-0">
                    <div className="flex items-center space-x-2">
                        <div className="bg-red-500 p-1 rounded-md shadow-sm">
                            <FileText size={14} strokeWidth={3} />
                        </div>
                        <span>กำหนดรหัสเจ้าหนี้</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <button 
                            type="button" 
                            onClick={() => setIsMaximized(false)} 
                            className={`w-6 h-6 bg-blue-500 hover:bg-blue-400 rounded-sm flex items-center justify-center ${!isMaximized ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Minimize2 size={12} strokeWidth={3} />
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setIsMaximized(true)} 
                            className={`w-6 h-6 bg-blue-500 hover:bg-blue-400 rounded-sm flex items-center justify-center ${isMaximized ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Maximize2 size={12} strokeWidth={3} />
                        </button>
                        <button 
                            type="button" 
                            onClick={handleClose} 
                            className="w-6 h-6 bg-red-600 hover:bg-red-500 rounded-sm flex items-center justify-center"
                        >
                            <X size={14} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-800 p-4 text-sm">
                    <div className="w-full space-y-4">
                        
                        {/* 1. Header Information Panel */}
                        <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
                            
                            {/* Row 1: Vendor Code & Vendor Name */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 border-b pb-4">
                                {/* Left: Vendor Code */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <label className="w-full sm:w-32 xl:w-40 text-left sm:text-right font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">รหัสผู้ขาย</label>
                                    <input 
                                        type="text" 
                                        value={formData.vendorCode} 
                                        placeholder="Auto Generate"
                                        readOnly
                                        className="flex-1 h-9 px-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none text-gray-500 dark:text-gray-400"
                                    />
                                </div>
                                {/* Right: Vendor Name */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <label className="w-full sm:w-32 xl:w-40 text-left sm:text-right font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">ชื่อผู้ขาย</label>
                                    <input 
                                        type="text" 
                                        value={formData.vendorName}
                                        onChange={(e) => handleInputChange('vendorName', e.target.value)}
                                        className="flex-1 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Vendor Code Search & Status */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {/* Left: Vendor Code Search */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <label className="w-full sm:w-32 xl:w-40 text-left sm:text-right font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">รหัสผู้ขาย</label>
                                    <div className="flex-1 relative h-9">
                                        <input 
                                            type="text" 
                                            value={formData.vendorCodeSearch}
                                            onChange={(e) => handleInputChange('vendorCodeSearch', e.target.value)}
                                            className="w-full h-full px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" 
                                        />
                                        <button className="absolute top-0 -right-11 h-9 w-9 bg-purple-600 text-white rounded flex items-center justify-center hover:bg-purple-700 transition-colors shadow-sm">
                                            <Search size={16} />
                                        </button>
                                    </div>
                                </div>
                                {/* Right: Status Interface */}
                                <div className="flex items-center gap-6 pl-0 sm:pl-[8.5rem] xl:pl-[11rem]">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" checked={formData.onHold} onChange={(e) => handleInputChange('onHold', e.target.checked)} className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800" />
                                        <span className="font-medium text-gray-700 dark:text-gray-300">On Hold</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" checked={formData.blocked} onChange={(e) => handleInputChange('blocked', e.target.checked)} className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800" />
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Block</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" checked={formData.inactive} onChange={(e) => handleInputChange('inactive', e.target.checked)} className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800" />
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Inactive</span>
                                    </label>
                                </div>
                            </div>

                            {/* Row 3: Name TH & Revenue Button */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {/* Left: Name TH */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <label className="w-full sm:w-32 xl:w-40 text-left sm:text-right font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">ชื่อผู้ขาย</label>
                                    <input 
                                        type="text" 
                                        value={formData.vendorNameTh}
                                        onChange={(e) => handleInputChange('vendorNameTh', e.target.value)}
                                        className="flex-1 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                                {/* Right: Revenue Button */}
                                <div className="flex items-center pl-0 sm:pl-[8.5rem] xl:pl-[11rem]">
                                    <button className="h-9 px-4 bg-orange-500 text-white rounded font-medium shadow-sm hover:bg-orange-600 transition-colors whitespace-nowrap flex items-center gap-2">
                                        ค้นหาข้อมูลจากสรรพากร
                                    </button>
                                </div>
                            </div>

                            {/* Row 4: Name EN */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {/* Left: Name EN */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <label className="w-full sm:w-32 xl:w-40 text-left sm:text-right font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">ชื่อผู้ขาย (Eng)</label>
                                    <input 
                                        type="text" 
                                        value={formData.vendorNameEn}
                                        onChange={(e) => handleInputChange('vendorNameEn', e.target.value)}
                                        className="flex-1 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                                {/* Right: Empty Spacer */}
                                <div className="hidden xl:block"></div>
                            </div>

                        </div>

                        {/* 2. Addresses */}
                        <div className="space-y-6">
                            
                            {/* 2. Address - PP.20 */}
                        <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">ที่อยู่ ภพ.20</h3>
                            
                            <div className="space-y-4">
                                {/* Row 1: ที่อยู่ | (empty) */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-4 md:gap-x-8 xl:gap-x-12 gap-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">ที่อยู่</label>
                                        <input type="text" value={formData.addressLine1} onChange={e => handleInputChange('addressLine1', e.target.value)} className="flex-1 min-w-0 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="hidden xl:block"></div>
                                </div>
                                
                                {/* Row 2: ที่อยู่ (line 2) | (empty) */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-4 md:gap-x-8 xl:gap-x-12 gap-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0"></label>
                                        <input type="text" value={formData.addressLine2} onChange={e => handleInputChange('addressLine2', e.target.value)} className="flex-1 min-w-0 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="hidden xl:block"></div>
                                </div>
                                
                                {/* Row 3: แขวง/ตำบล | เขต/อำเภอ */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-4 md:gap-x-8 xl:gap-x-12 gap-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">แขวง/ตำบล</label>
                                        <input type="text" value={formData.subDistrict} onChange={e => handleInputChange('subDistrict', e.target.value)} className="flex-1 min-w-0 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">เขต/อำเภอ</label>
                                        <input type="text" value={formData.district} onChange={e => handleInputChange('district', e.target.value)} className="flex-1 min-w-0 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                
                                {/* Row 4: จังหวัด | รหัสไปรษณีย์ */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-4 md:gap-x-8 xl:gap-x-12 gap-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">จังหวัด</label>
                                        <input type="text" value={formData.province} onChange={e => handleInputChange('province', e.target.value)} className="flex-1 min-w-0 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">รหัสไปรษณีย์</label>
                                        <input type="text" value={formData.postalCode} onChange={e => handleInputChange('postalCode', e.target.value)} className="flex-1 min-w-0 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Contact Address */}
                        <div className="bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                             <div className="flex items-center gap-4 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">ที่อยู่ที่ติดต่อ (ตามที่อยู่ ภพ.20)</h3>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.useAddressPP20} 
                                            onChange={handleCheckboxChange}
                                            className="peer sr-only"
                                        />
                                        <div className="w-5 h-5 bg-white border-2 border-gray-300 rounded peer-checked:bg-green-500 peer-checked:border-green-500 transition-all flex items-center justify-center">
                                            <Check size={12} className={`text-white transition-opacity ${formData.useAddressPP20 ? 'opacity-100' : 'opacity-0'}`} />
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div className="space-y-4">
                                {/* Row 1: ที่อยู่ | (empty) */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-4 md:gap-x-8 xl:gap-x-12 gap-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">ที่อยู่</label>
                                        <input type="text" value={formData.contactAddressLine1} onChange={e => handleInputChange('contactAddressLine1', e.target.value)} className="flex-1 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="hidden xl:block"></div>
                                </div>
                                
                                {/* Row 2: ที่อยู่ (line 2) | (empty) */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-4 md:gap-x-8 xl:gap-x-12 gap-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0"></label>
                                        <input type="text" value={formData.contactAddressLine2} onChange={e => handleInputChange('contactAddressLine2', e.target.value)} className="flex-1 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="hidden xl:block"></div>
                                </div>
                                
                                {/* Row 3: แขวง/ตำบล | เขต/อำเภอ */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-4 md:gap-x-8 xl:gap-x-12 gap-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">แขวง/ตำบล</label>
                                        <input type="text" value={formData.contactSubDistrict} onChange={e => handleInputChange('contactSubDistrict', e.target.value)} className="flex-1 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">เขต/อำเภอ</label>
                                        <input type="text" value={formData.contactDistrict} onChange={e => handleInputChange('contactDistrict', e.target.value)} className="flex-1 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                
                                {/* Row 4: จังหวัด | รหัสไปรษณีย์ */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-4 md:gap-x-8 xl:gap-x-12 gap-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">จังหวัด</label>
                                        <input type="text" value={formData.contactProvince} onChange={e => handleInputChange('contactProvince', e.target.value)} className="flex-1 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">รหัสไปรษณีย์</label>
                                        <input type="text" value={formData.contactPostalCode} onChange={e => handleInputChange('contactPostalCode', e.target.value)} className="flex-1 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                
                                {/* Row 5: โทรศัพท์ | Email */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-4 md:gap-x-8 xl:gap-x-12 gap-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">โทรศัพท์</label>
                                        <div className="flex-1 flex items-center gap-2">
                                            <input type="text" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} className="flex-1 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">ต่อ</span>
                                            <input type="text" value={formData.phoneExt} onChange={e => handleInputChange('phoneExt', e.target.value)} className="w-24 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">Email</label>
                                        <input type="text" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} className="flex-1 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>

                        {/* 3. Tabs */}
                        <div className="mt-8">
                            <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold transition-all
                                            ${activeTab === tab.key
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                            }
                                        `}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-b-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center text-gray-500 dark:text-gray-400">
                                <span>ข้อมูลที่อยู่ถูกแสดงในส่วนด้านบนแล้ว</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center gap-4 shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                   <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 font-bold transition-all text-sm">
                            <Plus size={16} /> New
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                            {isSaving ? 'กำลังบันทึก...' : 'Save'}
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/30 font-bold transition-all text-sm">
                            <Trash2 size={16} /> Delete
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 font-bold transition-all text-sm">
                            <Search size={16} /> Find
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 font-bold transition-all text-sm">
                            <Copy size={16} /> Copy
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 font-bold transition-all text-sm">
                            <FileText size={16} /> Preview
                        </button>
                        {saveError && <span className="text-red-500 text-sm ml-2">{saveError}</span>}
                   </div>
                   
                   <div>
                        <button onClick={handleClose} className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 font-bold transition-colors text-sm flex items-center gap-2">
                            <X size={16} /> Close
                        </button>
                   </div>
                </div>

            </div>
        </div>
    );
};
