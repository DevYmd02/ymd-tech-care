/**
 * @file VendorForm.tsx
 * @description หน้าฟอร์มจัดการข้อมูลผู้ขาย (Vendor Master Data)
 * @route /master-data/vendor
 * @purpose กำหนดรหัสเจ้าหนี้ และจัดการข้อมูลผู้ขาย
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText,
    Search,
    Plus,
    Save,
    Trash2,
    Copy,
    Eye,
    X,
    Home,
    ClipboardList,
    CreditCard,
    Settings,
    Phone,
    DollarSign,
    Building2,
    Check
} from 'lucide-react';
import { styles } from '../../constants';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

interface VendorFormData {
    vendorCode: string;
    vendorCodeSearch: string;
    vendorName: string;
    vendorNameTh: string;
    vendorNameEn: string;
    // Address PP.20
    addressPP20Line1: string;
    addressPP20Line2: string;
    subDistrictPP20: string;
    districtPP20: string;
    provincePP20: string;
    postalCodePP20: string;
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

// ====================================================================================
// TAB CONFIGURATION
// ====================================================================================

const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
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

export default function VendorForm() {
    const navigate = useNavigate();
    // Form state
    const [formData, setFormData] = useState<VendorFormData>({
        vendorCode: '',
        vendorCodeSearch: '',
        vendorName: '',
        vendorNameTh: '',
        vendorNameEn: '',
        addressPP20Line1: '',
        addressPP20Line2: '',
        subDistrictPP20: '',
        districtPP20: '',
        provincePP20: '',
        postalCodePP20: '',
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
    });

    const [activeTab, setActiveTab] = useState<TabType>('branch');

    // Handle input change
    const handleInputChange = (field: keyof VendorFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Handle form actions
    const handleNew = () => {
        setFormData({
            vendorCode: '',
            vendorCodeSearch: '',
            vendorName: '',
            vendorNameTh: '',
            vendorNameEn: '',
            addressPP20Line1: '',
            addressPP20Line2: '',
            subDistrictPP20: '',
            districtPP20: '',
            provincePP20: '',
            postalCodePP20: '',
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
        });
    };

    const handleSave = () => {
        // TODO: Implement save logic with API call
    };

    const handleDelete = () => {
        // TODO: Implement delete logic with API call
    };

    const handleFind = () => {
        // TODO: Implement find logic
    };

    const handleCopy = () => {
        // TODO: Implement copy logic
    };

    const handlePreview = () => {
        // TODO: Implement preview logic
    };

    const handleSearchRevenue = () => {
        // TODO: Implement Revenue Department search
    };

    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <div className={styles.pageContainer}>
            {/* ==================== HEADER BANNER ==================== */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg p-4 flex items-center gap-3 shadow-md">
                <FileText size={24} className="text-white" />
                <h1 className="text-lg font-semibold text-white">กำหนดรหัสเจ้าหนี้</h1>
            </div>

            {/* ==================== MAIN FORM CARD ==================== */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Quick Search Row */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">รหัสผู้ขาย</label>
                        <input
                            type="text"
                            value={formData.vendorCode}
                            onChange={(e) => handleInputChange('vendorCode', e.target.value)}
                            className={styles.inputFlex}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">ชื่อผู้ขาย</label>
                        <input
                            type="text"
                            value={formData.vendorName}
                            onChange={(e) => handleInputChange('vendorName', e.target.value)}
                            className={styles.inputFlex}
                        />
                    </div>
                </div>

                {/* Main Form Content */}
                <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* ==================== LEFT COLUMN ==================== */}
                        <div className="space-y-4">
                            {/* Vendor Code Search */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">รหัสผู้ขาย</label>
                                <div className="flex gap-2 min-w-0 flex-1">
                                    <input
                                        type="text"
                                        value={formData.vendorCodeSearch}
                                        onChange={(e) => handleInputChange('vendorCodeSearch', e.target.value)}
                                        className={styles.inputFlex}
                                    />
                                    <button
                                        onClick={handleFind}
                                        className="px-3 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors shrink-0"
                                    >
                                        <Search size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Vendor Name Thai */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">ชื่อผู้ขาย</label>
                                <input
                                    type="text"
                                    value={formData.vendorNameTh}
                                    onChange={(e) => handleInputChange('vendorNameTh', e.target.value)}
                                    className={styles.inputFlex}
                                />
                            </div>

                            {/* Vendor Name English */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">ชื่อผู้ขาย (Eng)</label>
                                <input
                                    type="text"
                                    value={formData.vendorNameEn}
                                    onChange={(e) => handleInputChange('vendorNameEn', e.target.value)}
                                    className={styles.inputFlex}
                                />
                            </div>
                        </div>

                        {/* ==================== RIGHT COLUMN - Status & Search ==================== */}
                        <div>
                            {/* Status Checkboxes */}
                            <div className="flex flex-wrap gap-4 sm:gap-6 mb-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.onHold}
                                        onChange={(e) => handleInputChange('onHold', e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">On Hold</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.blocked}
                                        onChange={(e) => handleInputChange('blocked', e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Block</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.inactive}
                                        onChange={(e) => handleInputChange('inactive', e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Inactive</span>
                                </label>
                            </div>

                            {/* Search from Revenue Department Button */}
                            <button
                                onClick={handleSearchRevenue}
                                className="w-full sm:w-auto px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-md"
                            >
                                ค้นหาข้อมูลจากสรรพากร
                            </button>
                        </div>
                    </div>

                    {/* ==================== DIVIDER ==================== */}
                    <hr className="my-6 border-gray-200 dark:border-gray-700" />

                    {/* ==================== PP.20 Address Section ==================== */}
                    <div>
                        <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-4">ที่อยู่ ภพ.20</h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Address Line 1 */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-28 shrink-0">ที่อยู่</label>
                                <input
                                    type="text"
                                    value={formData.addressPP20Line1}
                                    onChange={(e) => handleInputChange('addressPP20Line1', e.target.value)}
                                    className={styles.inputFlex}
                                />
                            </div>
                            <div className="hidden lg:block"></div>

                            {/* Address Line 2 */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-28 shrink-0"></label>
                                <input
                                    type="text"
                                    value={formData.addressPP20Line2}
                                    onChange={(e) => handleInputChange('addressPP20Line2', e.target.value)}
                                    className={styles.inputFlex}
                                />
                            </div>
                            <div className="hidden lg:block"></div>

                            {/* แขวง/ตำบล */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-28 shrink-0">แขวง/ตำบล</label>
                                <input
                                    type="text"
                                    value={formData.subDistrictPP20}
                                    onChange={(e) => handleInputChange('subDistrictPP20', e.target.value)}
                                    className={styles.inputFlex}
                                />
                            </div>
                            {/* เขต/อำเภอ */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-28 shrink-0">เขต/อำเภอ</label>
                                <input
                                    type="text"
                                    value={formData.districtPP20}
                                    onChange={(e) => handleInputChange('districtPP20', e.target.value)}
                                    className={styles.inputFlex}
                                />
                            </div>

                            {/* จังหวัด */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-28 shrink-0">จังหวัด</label>
                                <input
                                    type="text"
                                    value={formData.provincePP20}
                                    onChange={(e) => handleInputChange('provincePP20', e.target.value)}
                                    className={styles.inputFlex}
                                />
                            </div>
                            {/* รหัสไปรษณีย์ */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-28 shrink-0">รหัสไปรษณีย์</label>
                                <input
                                    type="text"
                                    value={formData.postalCodePP20}
                                    onChange={(e) => handleInputChange('postalCodePP20', e.target.value)}
                                    className={styles.inputFlex}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ==================== DIVIDER ==================== */}
                    <hr className="my-6 border-gray-200 dark:border-gray-700" />

                    {/* ==================== Contact Address Section ==================== */}
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <h3 className="text-base font-semibold text-gray-800 dark:text-white">ที่อยู่ที่ติดต่อ (ตามที่อยู่ ภพ.20)</h3>
                            <button
                                onClick={() => handleInputChange('useAddressPP20', !formData.useAddressPP20)}
                                className={`w-7 h-7 rounded flex items-center justify-center text-white transition-colors ${formData.useAddressPP20 ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 hover:bg-gray-400'}`}
                            >
                                {formData.useAddressPP20 && <Check size={16} />}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Contact Address Line 1 */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-28 shrink-0">ที่อยู่</label>
                                <input
                                    type="text"
                                    value={formData.contactAddressLine1}
                                    onChange={(e) => handleInputChange('contactAddressLine1', e.target.value)}
                                    className={styles.inputDisabled}
                                    disabled={formData.useAddressPP20}
                                />
                            </div>
                            <div className="hidden lg:block"></div>

                            {/* Contact Address Line 2 */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-28 shrink-0"></label>
                                <input
                                    type="text"
                                    value={formData.contactAddressLine2}
                                    onChange={(e) => handleInputChange('contactAddressLine2', e.target.value)}
                                    className={styles.inputDisabled}
                                    disabled={formData.useAddressPP20}
                                />
                            </div>
                            <div className="hidden lg:block"></div>

                            {/* แขวง/ตำบล */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-28 shrink-0">แขวง/ตำบล</label>
                                <input
                                    type="text"
                                    value={formData.contactSubDistrict}
                                    onChange={(e) => handleInputChange('contactSubDistrict', e.target.value)}
                                    className={styles.inputDisabled}
                                    disabled={formData.useAddressPP20}
                                />
                            </div>
                            {/* เขต/อำเภอ */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-28 shrink-0">เขต/อำเภอ</label>
                                <input
                                    type="text"
                                    value={formData.contactDistrict}
                                    onChange={(e) => handleInputChange('contactDistrict', e.target.value)}
                                    className={styles.inputDisabled}
                                    disabled={formData.useAddressPP20}
                                />
                            </div>

                            {/* จังหวัด */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-28 shrink-0">จังหวัด</label>
                                <input
                                    type="text"
                                    value={formData.contactProvince}
                                    onChange={(e) => handleInputChange('contactProvince', e.target.value)}
                                    className={styles.inputDisabled}
                                    disabled={formData.useAddressPP20}
                                />
                            </div>
                            {/* รหัสไปรษณีย์ */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-28 shrink-0">รหัสไปรษณีย์</label>
                                <input
                                    type="text"
                                    value={formData.contactPostalCode}
                                    onChange={(e) => handleInputChange('contactPostalCode', e.target.value)}
                                    className={styles.inputDisabled}
                                    disabled={formData.useAddressPP20}
                                />
                            </div>

                            {/* โทรศัพท์ */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-28 shrink-0">โทรศัพท์</label>
                                <div className="flex gap-2 min-w-0 flex-1">
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className={styles.inputFlex}
                                    />
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0 self-center">ต่อ</label>
                                    <input
                                        type="text"
                                        value={formData.phoneExt}
                                        onChange={(e) => handleInputChange('phoneExt', e.target.value)}
                                        className="w-16 sm:w-20 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            {/* E-mail */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-28 shrink-0">E-mail</label>
                                <input
                                    type="email"
                                    value={formData.contactEmail}
                                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                                    className={styles.inputFlex}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ==================== TABS ==================== */}
                    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 -mx-4 sm:mx-0 px-4 sm:px-0">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${activeTab === tab.key
                                            ? 'bg-blue-600 text-white rounded-t-lg'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {tab.icon}
                                    <span className="hidden xs:inline sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg min-h-[120px]">
                            {activeTab === 'branch' && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">ข้อมูลสาขา</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">ไม่มีข้อมูลสาขา</p>
                                </div>
                            )}
                            {activeTab === 'address' && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">ที่อยู่เพิ่มเติม</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">ไม่มีข้อมูลที่อยู่เพิ่มเติม</p>
                                </div>
                            )}
                            {activeTab === 'detail' && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">รายละเอียดเพิ่มเติม</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">ไม่มีข้อมูลรายละเอียดเพิ่มเติม</p>
                                </div>
                            )}
                            {activeTab === 'credit' && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">ข้อมูลเครดิต</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">ไม่มีข้อมูลเครดิต</p>
                                </div>
                            )}
                            {activeTab === 'general' && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">ข้อมูลทั่วไป</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">ไม่มีข้อมูลทั่วไป</p>
                                </div>
                            )}
                            {activeTab === 'contact' && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">ผู้ติดต่อ</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">ไม่มีข้อมูลผู้ติดต่อ</p>
                                </div>
                            )}
                            {activeTab === 'account' && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">ข้อมูลบัญชี</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">ไม่มีข้อมูลบัญชี</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ==================== ACTION BUTTONS ==================== */}
                <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            onClick={handleNew}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-green-500 hover:text-white hover:border-green-500 dark:hover:bg-green-600 dark:hover:border-green-600 transition-all duration-200"
                        >
                            <Plus size={16} />
                            New
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-blue-500 hover:text-white hover:border-blue-500 dark:hover:bg-blue-600 dark:hover:border-blue-600 transition-all duration-200"
                        >
                            <Save size={16} />
                            Save
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600 transition-all duration-200"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                        <button
                            onClick={handleFind}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-purple-500 hover:text-white hover:border-purple-500 dark:hover:bg-purple-600 dark:hover:border-purple-600 transition-all duration-200"
                        >
                            <Search size={16} />
                            Find
                        </button>
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-cyan-500 hover:text-white hover:border-cyan-500 dark:hover:bg-cyan-600 dark:hover:border-cyan-600 transition-all duration-200"
                        >
                            <Copy size={16} />
                            Copy
                        </button>
                        <button
                            onClick={handlePreview}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-indigo-500 hover:text-white hover:border-indigo-500 dark:hover:bg-indigo-600 dark:hover:border-indigo-600 transition-all duration-200"
                        >
                            <Eye size={16} />
                            Preview
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/master-data')}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 dark:hover:bg-red-600 dark:hover:border-red-600 transition-all duration-200"
                    >
                        <X size={16} />
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
