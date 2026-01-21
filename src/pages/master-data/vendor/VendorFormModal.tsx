/**
 * @file VendorFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลเจ้าหนี้ (Vendor Master Data) - Refactored to use shared components and standard styling
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
    FileText, Search, Info, MoreHorizontal, Star, AlignLeft, History, Check,
} from 'lucide-react';
import { vendorService } from '../../../services/vendorService';
import type { VendorFormData } from '../../../types/vendor-types';
import { toVendorCreateRequest } from '../../../types/vendor-types';
import { WindowFormLayout, TabPanel } from '../../../components/shared';
import { SystemAlert } from '../../../components/shared/SystemAlert';
import { VendorFooter } from './VendorFooter';

// ====================================================================================
// LOCAL TYPES
// ====================================================================================

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
    remarks: '',
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
// MAIN COMPONENT
// ====================================================================================

export const VendorFormModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const prevIsOpenRef = useRef(false);
    const [isSaving, setIsSaving] = useState(false);
    const [alert, setAlert] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

    // Form State
    const [formData, setFormData] = useState<ModalFormData>(initialFormData);
    const [activeTab, setActiveTab] = useState<string>('detail');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen && !prevIsOpenRef.current) {
            const timer = setTimeout(() => {
                setFormData(initialFormData);
                setActiveTab('detail');
                setAlert({ show: false, message: '' });
            }, 0);
            return () => clearTimeout(timer);
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen]);

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
            setAlert({ show: true, message: 'กรุณากรอกชื่อผู้ขาย' });
            return;
        }

        setIsSaving(true);
        setAlert({ show: false, message: '' });

        try {
            const request = toVendorCreateRequest(formData);
            const result = await vendorService.create(request);
            
            if (result.success) {
                onClose();
            } else {
                setAlert({ show: true, message: result.message || 'เกิดข้อผิดพลาดในการบันทึก' });
            }
        } catch {
            setAlert({ show: true, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
        } finally {
            setIsSaving(false);
        }
    };

    // Shared styles matching RFQ/PR
    const cardClass = 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden';
    const inputStyle = "w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-all";

    // Tabs configuration - EXACTLY matching RFQ/PR
    const tabs = [
        { id: 'detail', label: 'Detail', icon: <Info size={16} /> },
        { id: 'more', label: 'More', icon: <MoreHorizontal size={16} /> },
        { id: 'rate', label: 'Rate', icon: <Star size={16} /> },
        { id: 'description', label: 'Description', icon: <AlignLeft size={16} /> },
        { id: 'history', label: 'History', icon: <History size={16} /> },
    ];

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="กำหนดรหัสเจ้าหนี้ (Vendor Master)"
            titleIcon={<div className="bg-red-500 p-1 rounded-md shadow-sm"><FileText size={14} strokeWidth={3} /></div>}
            headerColor="bg-blue-600"
            footer={<VendorFooter onSave={handleSave} onClose={onClose} isSaving={isSaving} />}
        >
            {/* System Alert */}
            {alert.show && (
                <SystemAlert 
                    message={alert.message} 
                    onClose={() => setAlert({ ...alert, show: false })} 
                />
            )}

            <div className="space-y-4 p-1.5">
                {/* 1. Header Information Panel */}
                <div className={cardClass}>
                    <div className="p-4 space-y-4">
                        
                        {/* Row 1: Vendor Code & Vendor Name */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                            {/* Left: Vendor Code */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <label className="w-full sm:w-32 xl:w-40 text-left sm:text-right font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">รหัสผู้ขาย</label>
                                <input 
                                    type="text" 
                                    value={formData.vendorCode} 
                                    placeholder="Auto Generate"
                                    readOnly
                                    className={`${inputStyle} bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400`}
                                />
                            </div>
                            {/* Right: Vendor Name */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <label className="w-full sm:w-32 xl:w-40 text-left sm:text-right font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">ชื่อผู้ขาย</label>
                                <input 
                                    type="text" 
                                    value={formData.vendorName}
                                    onChange={(e) => handleInputChange('vendorName', e.target.value)}
                                    className={inputStyle}
                                />
                            </div>
                        </div>

                        {/* Row 2: Vendor Code Search & Status */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* Left: Vendor Code Search */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <label className="w-full sm:w-32 xl:w-40 text-left sm:text-right font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">รหัสผู้ขาย</label>
                                <div className="flex-1 relative h-8">
                                    <input 
                                        type="text" 
                                        value={formData.vendorCodeSearch}
                                        onChange={(e) => handleInputChange('vendorCodeSearch', e.target.value)}
                                        className={inputStyle} 
                                    />
                                    <button className="absolute top-0 right-0 h-8 w-8 bg-purple-600 text-white rounded-r-lg flex items-center justify-center hover:bg-purple-700 transition-colors shadow-sm">
                                        <Search size={16} />
                                    </button>
                                </div>
                            </div>
                            {/* Right: Status Interface */}
                            <div className="flex items-center gap-6 pl-0 sm:pl-[8.5rem] xl:pl-[11rem]">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" checked={formData.onHold} onChange={(e) => handleInputChange('onHold', e.target.checked)} className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">On Hold</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" checked={formData.blocked} onChange={(e) => handleInputChange('blocked', e.target.checked)} className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Block</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input type="checkbox" checked={formData.inactive} onChange={(e) => handleInputChange('inactive', e.target.checked)} className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800" />
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
                                    className={inputStyle} 
                                />
                            </div>
                            {/* Right: Revenue Button */}
                            <div className="flex items-center pl-0 sm:pl-[8.5rem] xl:pl-[11rem]">
                                <button className="h-8 px-4 bg-orange-500 text-white rounded-lg font-medium shadow-sm hover:bg-orange-600 transition-colors whitespace-nowrap flex items-center gap-2 text-sm">
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
                                    className={inputStyle} 
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* 2. Address & Contact Section (Replaces Address Tab) */}
                <div className={cardClass}>
                    <div className="p-4 space-y-6">
                        {/* 2. Address - PP.20 */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">ที่อยู่ ภพ.20</h3>
                            
                            <div className="space-y-4">
                                {/* Row 1: ที่อยู่ */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">ที่อยู่</label>
                                        <input type="text" value={formData.addressLine1} onChange={e => handleInputChange('addressLine1', e.target.value)} className={inputStyle} />
                                    </div>
                                </div>
                                
                                {/* Row 2: ที่อยู่ (line 2) */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0"></label>
                                        <input type="text" value={formData.addressLine2} onChange={e => handleInputChange('addressLine2', e.target.value)} className={inputStyle} />
                                    </div>
                                </div>
                                
                                {/* Row 3: แขวง/ตำบล | เขต/อำเภอ */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">แขวง/ตำบล</label>
                                        <input type="text" value={formData.subDistrict} onChange={e => handleInputChange('subDistrict', e.target.value)} className={inputStyle} />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">เขต/อำเภอ</label>
                                        <input type="text" value={formData.district} onChange={e => handleInputChange('district', e.target.value)} className={inputStyle} />
                                    </div>
                                </div>
                                
                                {/* Row 4: จังหวัด | รหัสไปรษณีย์ */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">จังหวัด</label>
                                        <input type="text" value={formData.province} onChange={e => handleInputChange('province', e.target.value)} className={inputStyle} />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">รหัสไปรษณีย์</label>
                                        <input type="text" value={formData.postalCode} onChange={e => handleInputChange('postalCode', e.target.value)} className={inputStyle} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Contact Address */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                             <div className="flex items-center gap-4 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                                <h3 className="text-base font-bold text-gray-800 dark:text-white">ที่อยู่ที่ติดต่อ (ตามที่อยู่ ภพ.20)</h3>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.useAddressPP20} 
                                            onChange={handleCheckboxChange}
                                            className="peer sr-only"
                                        />
                                        <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded peer-checked:bg-green-500 peer-checked:border-green-500 transition-all flex items-center justify-center">
                                            <Check size={10} className={`text-white transition-opacity ${formData.useAddressPP20 ? 'opacity-100' : 'opacity-0'}`} />
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div className="space-y-4">
                                {/* Row 1: ที่อยู่ */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">ที่อยู่</label>
                                        <input type="text" value={formData.contactAddressLine1} onChange={e => handleInputChange('contactAddressLine1', e.target.value)} className={inputStyle} />
                                    </div>
                                </div>
                                
                                {/* Row 2: ที่อยู่ (line 2) */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0"></label>
                                        <input type="text" value={formData.contactAddressLine2} onChange={e => handleInputChange('contactAddressLine2', e.target.value)} className={inputStyle} />
                                    </div>
                                </div>
                                
                                {/* Row 3: แขวง/ตำบล | เขต/อำเภอ */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">แขวง/ตำบล</label>
                                        <input type="text" value={formData.contactSubDistrict} onChange={e => handleInputChange('contactSubDistrict', e.target.value)} className={inputStyle} />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">เขต/อำเภอ</label>
                                        <input type="text" value={formData.contactDistrict} onChange={e => handleInputChange('contactDistrict', e.target.value)} className={inputStyle} />
                                    </div>
                                </div>
                                
                                {/* Row 4: จังหวัด | รหัสไปรษณีย์ */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">จังหวัด</label>
                                        <input type="text" value={formData.contactProvince} onChange={e => handleInputChange('contactProvince', e.target.value)} className={inputStyle} />
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">รหัสไปรษณีย์</label>
                                        <input type="text" value={formData.contactPostalCode} onChange={e => handleInputChange('contactPostalCode', e.target.value)} className={inputStyle} />
                                    </div>
                                </div>
                                
                                {/* Row 5: โทรศัพท์ | Email */}
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">โทรศัพท์</label>
                                        <div className="flex-1 flex items-center gap-2">
                                            <input type="text" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} className={inputStyle} />
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">ต่อ</span>
                                            <input type="text" value={formData.phoneExt} onChange={e => handleInputChange('phoneExt', e.target.value)} className={`w-20 ${inputStyle}`} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                        <label className="w-full sm:w-32 text-left sm:text-right text-gray-700 dark:text-gray-300 flex-shrink-0">Email</label>
                                        <input type="text" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} className={inputStyle} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Panel Section - Standardized to match RFQ/PR/User Request */}
                <div className={cardClass}>
                    <div className="p-4">
                        <TabPanel
                            tabs={tabs}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            variant="underline"
                        >
                            {/* DETAIL TAB */}
                            {activeTab === 'detail' && (
                                <div className="space-y-4 pt-4">
                                    <textarea
                                        value={formData.remarks || ''}
                                        onChange={(e) => handleInputChange('remarks', e.target.value)}
                                        placeholder="กรอกหมายเหตุเพิ่มเติม..."
                                        className={`w-full h-32 p-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-all resize-none`}
                                    />
                                </div>
                            )}

                            {/* OTHER TABS (Placeholders for now, mirroring RFQ structure) */}
                            {activeTab === 'more' && (
                                <div className="text-gray-500 dark:text-gray-400 text-sm p-4 text-center">
                                    ข้อมูลเพิ่มเติม (More Information)
                                </div>
                            )}
                            {activeTab === 'rate' && (
                                <div className="text-gray-500 dark:text-gray-400 text-sm p-4 text-center">
                                    อัตราแลกเปลี่ยน (Exchange Rate)
                                </div>
                            )}
                            {activeTab === 'description' && (
                                <div className="text-gray-500 dark:text-gray-400 text-sm p-4 text-center">
                                    รายละเอียดเพิ่มเติม (Description)
                                </div>
                            )}
                            {activeTab === 'history' && (
                                <div className="text-gray-500 dark:text-gray-400 text-sm p-4 text-center">
                                    ประวัติการแก้ไข (History)
                                </div>
                            )}
                        </TabPanel>
                    </div>
                </div>

            </div>
        </WindowFormLayout>
    );
};
