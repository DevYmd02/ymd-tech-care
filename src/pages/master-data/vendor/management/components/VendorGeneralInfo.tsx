import React from 'react';
import { Building2 } from 'lucide-react';
import { styles, VENDOR_TYPES, BUSINESS_CATEGORIES, CURRENCIES } from '@/constants';
import type { VendorFormData } from '@project-types/vendor-types';

interface VendorGeneralInfoProps {
    formData: VendorFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    errors: { [key: string]: string };
}

export const VendorGeneralInfo: React.FC<VendorGeneralInfoProps> = ({ formData, onChange, errors }) => {
    return (
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
                        onChange={onChange} 
                        className={styles.input} 
                        placeholder="Auto Generated" 
                        disabled={true}
                    />
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>ชื่อเจ้าหนี้ (ไทย) <span className="text-red-500">*</span></label>
                    <input 
                        name="vendorNameTh" 
                        value={formData.vendorNameTh} 
                        onChange={onChange} 
                        className={`${styles.input} ${errors.vendorNameTh ? 'border-red-500 focus:ring-red-500' : ''}`} 
                        placeholder="บริษัท เอบีซี จำกัด" 
                        required
                    />
                    {errors.vendorNameTh && <p className="text-red-500 text-xs mt-1">{errors.vendorNameTh}</p>}
                </div>

                {/* Name EN & Vendor Type */}
                <div className="space-y-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className={styles.label}>ชื่อเจ้าหนี้ (อังกฤษ)</label>
                        <input 
                            name="vendorNameEn" 
                            value={formData.vendorNameEn} 
                            onChange={onChange} 
                            className={styles.input} 
                            placeholder="ABC Company Limited" 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className={styles.label}>ประเภทเจ้าหนี้ <span className="text-red-500">*</span></label>
                        <select 
                            name="vendorTypeId" 
                            value={formData.vendorTypeId} 
                            onChange={onChange} 
                            className={`${styles.inputSelect} ${errors.vendorTypeId ? 'border-red-500 focus:ring-red-500' : ''}`}
                            required
                        >
                            <option value="" disabled>เลือกประเภทเจ้าหนี้</option>
                            {VENDOR_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                        {errors.vendorTypeId && <p className="text-red-500 text-xs mt-1">{errors.vendorTypeId}</p>}
                    </div>
                </div>

                {/* Business Category & Tax ID */}
                <div className="space-y-1">
                    <label className={styles.label}>หมวดหมู่ธุรกิจ <span className="text-red-500">*</span></label>
                    <select 
                        name="vendorGroupId" 
                        value={formData.vendorGroupId} 
                        onChange={onChange} 
                        className={`${styles.inputSelect} ${errors.vendorGroupId ? 'border-red-500 focus:ring-red-500' : ''}`}
                        required
                    >
                        <option value="" disabled>เลือกหมวดหมู่</option>
                        {BUSINESS_CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                    {errors.vendorGroupId && <p className="text-red-500 text-xs mt-1">{errors.vendorGroupId}</p>}
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>เลขประจำตัวผู้เสียภาษี <span className="text-red-500">*</span></label>
                    <input 
                        name="taxId" 
                        value={formData.taxId} 
                        onChange={(e) => {
                            // Strict Input Masking
                            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 13);
                            e.target.value = val;
                            onChange(e); 
                        }}
                        maxLength={13}
                        inputMode="numeric"
                        className={`${styles.input} ${errors.taxId ? 'border-red-500 focus:ring-red-500' : ''}`} 
                        placeholder="010555888xxxxx" 
                        required
                    />
                    {errors.taxId && <p className="text-red-500 text-xs mt-1">{errors.taxId}</p>}
                </div>

                {/* Branch & Currency */}
                <div className="space-y-1">
                    <label className={styles.label}>ชื่อสาขา <span className="text-red-500">*</span></label>
                    <input 
                        name="branchName" 
                        value={formData.branchName} 
                        onChange={onChange} 
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
                        onChange={onChange} 
                        className={styles.inputSelect}
                    >
                        {CURRENCIES.map(curr => (
                            <option key={curr.value} value={curr.value}>{curr.label}</option>
                        ))}
                    </select>
                </div>

                {/* Checkboxes */}
                <div className="md:col-span-2 flex gap-6 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            name="vatRegistered"
                            checked={formData.vatRegistered}
                            onChange={onChange}
                            className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">จดทะเบียน VAT</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            name="whtRegistered"
                            checked={formData.whtRegistered}
                            onChange={onChange}
                            className="w-4 h-4 text-gray-800 rounded border-gray-300 focus:ring-gray-800"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">มีการหัก ณ ที่จ่าย (WHT)</span>
                    </label>
                </div>
            </div>
        </section>
    );
};
