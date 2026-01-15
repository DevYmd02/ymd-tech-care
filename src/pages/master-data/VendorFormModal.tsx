/**
 * @file VendorFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลเจ้าหนี้ (Vendor Master Data)
 */

import React, { useState, useEffect } from 'react';
import { 
    FileText, Minimize2, Maximize2, X, Save, Search, Plus, Trash2, Copy,
    Home, ClipboardList, CreditCard, Settings, Phone, DollarSign, Building2, Check
} from 'lucide-react';


interface Props {
    isOpen: boolean;
    onClose: () => void;
}

interface VendorFormData {
    vendorCode: string;
    vendorCodeSearch: string;
    vendorName: string;
    vendorNameTh: string;
    vendorNameEn: string;
    // Address PP.20
    addressLine1: string;
    addressLine2: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
    // Contact Address
    useAddressPP20: boolean;
    contactAddressLine1: string;
    contactAddressLine2: string;
    contactSubDistrict: string;
    contactDistrict: string;
    contactProvince: string;
    contactPostalCode: string;
    contactEmail: string;
    phone: string;
    phoneExt: string;
    // Status
    onHold: boolean;
    blocked: boolean;
    inactive: boolean;
}

type TabType = 'address' | 'detail' | 'credit' | 'general' | 'contact' | 'account' | 'branch';

const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'address', label: 'Address', icon: <Home size={16} /> },
    { key: 'detail', label: 'Detail', icon: <ClipboardList size={16} /> },
    { key: 'credit', label: 'Credit', icon: <CreditCard size={16} /> },
    { key: 'general', label: 'General', icon: <Settings size={16} /> },
    { key: 'contact', label: 'Contact', icon: <Phone size={16} /> },
    { key: 'account', label: 'Account', icon: <DollarSign size={16} /> },
    { key: 'branch', label: 'Branch', icon: <Building2 size={16} /> },
];

const initialFormData: VendorFormData = {
    vendorCode: '',
    vendorCodeSearch: '',
    vendorName: '',
    vendorNameTh: '',
    vendorNameEn: '',
    addressLine1: '',
    addressLine2: '',
    subDistrict: '',
    district: '',
    province: '',
    postalCode: '',
    useAddressPP20: true,
    contactAddressLine1: '',
    contactAddressLine2: '',
    contactSubDistrict: '',
    contactDistrict: '',
    contactProvince: '',
    contactPostalCode: '',
    contactEmail: '',
    phone: '',
    phoneExt: '',
    onHold: false,
    blocked: false,
    inactive: false,
};

export const VendorFormModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isMaximized, setIsMaximized] = useState(true);

    // Form State
    const [formData, setFormData] = useState<VendorFormData>(initialFormData);
    const [activeTab, setActiveTab] = useState<TabType>('address');

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
            // Use setTimeout to avoid synchronous state update warning during render phase
            const timer = setTimeout(() => {
                setFormData(initialFormData);
                setActiveTab('address');
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

    const handleInputChange = (field: keyof VendorFormData, value: string | boolean) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            return updated;
        });
    };

    const handleCheckboxChange = () => {
        setFormData(prev => {
            const newUseAddressPP20 = !prev.useAddressPP20;
            if (newUseAddressPP20) {
                // Sync all fields immediately when checked
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
            }
            return { ...prev, useAddressPP20: newUseAddressPP20 };
        });
    };

    if (!isOpen && !isClosing) return null;

    return (
        <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300 font-sans ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div className={`
                flex flex-col overflow-hidden bg-white shadow-2xl border-4 border-blue-600 transition-all duration-300 ease-out origin-center
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
                        <span>Vendor Master Data</span>
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
                <div className="flex-1 overflow-auto bg-[#F8F9FA] p-4 text-sm">
                    <div className="w-full space-y-4">
                        
                        {/* 1. Header Information Panel */}
                        <div className="bg-white rounded-md border border-gray-200 p-6 shadow-sm space-y-4">
                            
                            {/* Row 1: Vendor Code & Vendor Name */}
                            <div className="flex flex-col xl:flex-row gap-6">
                                {/* Left: Vendor Code */}
                                <div className="flex-1 flex items-center gap-4">
                                    <label className="w-32 xl:w-40 text-right font-semibold text-gray-700 flex-shrink-0">Vendor Code</label>
                                    <input 
                                        type="text" 
                                        value={formData.vendorCode} 
                                        placeholder="Auto Generate"
                                        readOnly
                                        className="flex-1 h-9 px-3 bg-white border border-gray-300 rounded focus:outline-none text-gray-500"
                                    />
                                </div>
                                {/* Right: Vendor Name */}
                                <div className="flex-1 flex items-center gap-4">
                                    <label className="w-32 xl:w-40 text-right font-semibold text-gray-700 flex-shrink-0">Vendor Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.vendorName}
                                        onChange={(e) => handleInputChange('vendorName', e.target.value)}
                                        className="flex-1 h-9 px-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Vendor Code Search & Status */}
                            <div className="flex flex-col xl:flex-row gap-6">
                                {/* Left: Vendor Code Search */}
                                <div className="flex-1 flex items-center gap-4">
                                    <label className="w-32 xl:w-40 text-right font-semibold text-gray-700 flex-shrink-0">Vendor Code</label>
                                    <div className="flex-1 flex gap-2">
                                        <input 
                                            type="text" 
                                            value={formData.vendorCodeSearch}
                                            onChange={(e) => handleInputChange('vendorCodeSearch', e.target.value)}
                                            className="flex-1 h-9 px-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" 
                                        />
                                        <button className="h-9 w-9 bg-purple-600 text-white rounded flex items-center justify-center hover:bg-purple-700 transition-colors shrink-0">
                                            <Search size={16} />
                                        </button>
                                    </div>
                                </div>
                                {/* Right: Status Interface */}
                                <div className="flex-1 flex items-center gap-6 pl-[8.5rem] xl:pl-[11rem]">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" checked={formData.onHold} onChange={(e) => handleInputChange('onHold', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white" />
                                        <span className="font-medium text-gray-700">On Hold</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" checked={formData.blocked} onChange={(e) => handleInputChange('blocked', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white" />
                                        <span className="font-medium text-gray-700">Block</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox" checked={formData.inactive} onChange={(e) => handleInputChange('inactive', e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white" />
                                        <span className="font-medium text-gray-700">Inactive</span>
                                    </label>
                                </div>
                            </div>

                            {/* Row 3: Name TH & Revenue Button */}
                            <div className="flex flex-col xl:flex-row gap-6">
                                {/* Left: Name TH */}
                                <div className="flex-1 flex items-center gap-4">
                                    <label className="w-32 xl:w-40 text-right font-semibold text-gray-700 flex-shrink-0">Vendor Name <span className="text-xs text-gray-400 font-normal">(Thai)</span></label>
                                    <input 
                                        type="text" 
                                        value={formData.vendorNameTh}
                                        onChange={(e) => handleInputChange('vendorNameTh', e.target.value)}
                                        className="flex-1 h-9 px-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                                {/* Right: Revenue Button */}
                                <div className="flex-1 flex items-center pl-[8.5rem] xl:pl-[11rem]">
                                    <button className="h-9 px-4 bg-orange-500 text-white rounded font-medium shadow-sm hover:bg-orange-600 transition-colors whitespace-nowrap flex items-center gap-2">
                                        <Search size={16} />
                                        Search from Revenue Dept.
                                    </button>
                                </div>
                            </div>

                            {/* Row 4: Name EN */}
                            <div className="flex flex-col xl:flex-row gap-6">
                                {/* Left: Name EN */}
                                <div className="flex-1 flex items-center gap-4">
                                    <label className="w-32 xl:w-40 text-right font-semibold text-gray-700 flex-shrink-0">Vendor Name (Eng)</label>
                                    <input 
                                        type="text" 
                                        value={formData.vendorNameEn}
                                        onChange={(e) => handleInputChange('vendorNameEn', e.target.value)}
                                        className="flex-1 h-9 px-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" 
                                    />
                                </div>
                                {/* Right: Empty Spacer */}
                                <div className="flex-1 hidden xl:block"></div>
                            </div>

                        </div>

                        {/* 2. Addresses */}
                        <div className="space-y-6">
                            
                            {/* 2. Address - PP.20 */}
                        <div className="bg-white rounded-md border border-gray-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Address PP.20</h3>
                            
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-4">
                                {/* Left Column */}
                                <div className="space-y-4">
                                     {/* Address Line 1 */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-right text-gray-700 flex-shrink-0">Address</label>
                                        <input type="text" value={formData.addressLine1} onChange={e => handleInputChange('addressLine1', e.target.value)} className="flex-1 min-w-0 h-9 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    {/* Address Line 2 */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-right text-gray-700 flex-shrink-0"></label>
                                        <input type="text" value={formData.addressLine2} onChange={e => handleInputChange('addressLine2', e.target.value)} className="flex-1 min-w-0 h-9 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    {/* SubDistrict */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-right text-gray-700 flex-shrink-0">Sub-district</label>
                                        <input type="text" value={formData.subDistrict} onChange={e => handleInputChange('subDistrict', e.target.value)} className="flex-1 min-w-0 h-9 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    {/* Province */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-right text-gray-700 flex-shrink-0">Province</label>
                                        <input type="text" value={formData.province} onChange={e => handleInputChange('province', e.target.value)} className="flex-1 min-w-0 h-9 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                     {/* District */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-right text-gray-700 flex-shrink-0">District</label>
                                        <input type="text" value={formData.district} onChange={e => handleInputChange('district', e.target.value)} className="flex-1 min-w-0 h-9 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                     {/* Postal Code */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-right text-gray-700 flex-shrink-0">Postal Code</label>
                                        <input type="text" value={formData.postalCode} onChange={e => handleInputChange('postalCode', e.target.value)} className="flex-1 min-w-0 h-9 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Contact Address */}
                        <div className="bg-white rounded-md border border-gray-200 p-6 shadow-sm">
                             <div className="flex items-center gap-4 mb-4 border-b pb-2">
                                <h3 className="text-lg font-bold text-gray-800">Contact Address (Same as PP.20)</h3>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.useAddressPP20} 
                                            onChange={handleCheckboxChange}
                                            className="peer sr-only"
                                        />
                                        <div className="w-5 h-5 bg-white border-2 border-gray-300 rounded peer-checked:bg-green-500 peer-checked:border-green-500 transition-all flex items-center justify-center">
                                            <Check size={12} className="text-white opacity-0 peer-checked:opacity-100" />
                                        </div>
                                    </div>
                                </label>
                            </div>

                             <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-4">
                                {/* Left Column */}
                                <div className="space-y-4">
                                     {/* Address Line 1 */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-right text-gray-700 flex-shrink-0">Address</label>
                                        <input type="text" value={formData.contactAddressLine1} onChange={e => handleInputChange('contactAddressLine1', e.target.value)} className="flex-1 h-9 px-3 border border-gray-300 rounded bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    {/* Address Line 2 */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-right text-gray-700 flex-shrink-0"></label>
                                        <input type="text" value={formData.contactAddressLine2} onChange={e => handleInputChange('contactAddressLine2', e.target.value)} className="flex-1 h-9 px-3 border border-gray-300 rounded bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    {/* SubDistrict */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-right text-gray-700 flex-shrink-0">Sub-district</label>
                                        <input type="text" value={formData.contactSubDistrict} onChange={e => handleInputChange('contactSubDistrict', e.target.value)} className="flex-1 h-9 px-3 border border-gray-300 rounded bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    {/* Province */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-right text-gray-700 flex-shrink-0">Province</label>
                                        <input type="text" value={formData.contactProvince} onChange={e => handleInputChange('contactProvince', e.target.value)} className="flex-1 h-9 px-3 border border-gray-300 rounded bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    {/* Phone */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-right text-gray-700 flex-shrink-0">Phone</label>
                                        <div className="flex-1 flex items-center gap-2">
                                            <input type="text" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} className="flex-1 h-9 px-3 border border-gray-300 rounded bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                            <span className="text-gray-700 font-medium">Ext.</span>
                                            <input type="text" value={formData.phoneExt} onChange={e => handleInputChange('phoneExt', e.target.value)} className="w-24 h-9 px-3 border border-gray-300 rounded bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                     {/* District */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-right text-gray-700 flex-shrink-0">District</label>
                                        <input type="text" value={formData.contactDistrict} onChange={e => handleInputChange('contactDistrict', e.target.value)} className="flex-1 h-9 px-3 border border-gray-300 rounded bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                     {/* Postal Code */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-right text-gray-700 flex-shrink-0">Postal Code</label>
                                        <input type="text" value={formData.contactPostalCode} onChange={e => handleInputChange('contactPostalCode', e.target.value)} className="flex-1 h-9 px-3 border border-gray-300 rounded bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                     {/* Email */}
                                    <div className="flex items-center gap-4">
                                        <label className="w-32 text-right text-gray-700 flex-shrink-0">Email</label>
                                        <input type="text" value={formData.contactEmail} onChange={e => handleInputChange('contactEmail', e.target.value)} className="flex-1 min-w-0 h-9 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                            <div className="h-48 bg-gray-100 rounded-lg border border-gray-200 p-6 flex items-center justify-center text-gray-400">
                                <span>Content for {tabs.find(t => t.key === activeTab)?.label}</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-white border-t border-gray-200 p-3 flex justify-between items-center gap-4 shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                   <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-bold transition-all text-sm">
                            <Plus size={16} /> New
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-bold transition-all text-sm">
                            <Save size={16} /> Save
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50 font-bold transition-all text-sm">
                            <Trash2 size={16} /> Delete
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-bold transition-all text-sm">
                            <Search size={16} /> Find
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-bold transition-all text-sm">
                            <Copy size={16} /> Copy
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-bold transition-all text-sm">
                            <FileText size={16} /> Preview
                        </button>
                   </div>
                   
                   <div>
                        <button onClick={handleClose} className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-bold transition-colors text-sm flex items-center gap-2">
                            <X size={16} /> Close
                        </button>
                   </div>
                </div>

            </div>
        </div>
    );
};
