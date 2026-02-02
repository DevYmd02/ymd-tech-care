import React from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { styles, ADDRESS_TYPES } from '@/constants';
import type { VendorFormData, VendorAddressFormItem } from '@project-types/vendor-types';

interface VendorAddressListProps {
    formData: VendorFormData;
    errors: { [key: string]: string };
    addAddress: () => void;
    removeAddress: (index: number) => void;
    updateAddress: (index: number, field: keyof VendorAddressFormItem, value: string | boolean) => void;
    handleSameAsRegisteredChange: (checked: boolean) => void;
}

export const VendorAddressList: React.FC<VendorAddressListProps> = ({
    formData,
    errors,
    addAddress,
    removeAddress,
    updateAddress,
    handleSameAsRegisteredChange
}) => {
    return (
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
                                onChange={(e) => updateAddress(0, 'address', e.target.value)}
                                className={styles.input} 
                                rows={2}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={styles.label}>แขวง/ตำบล</label>
                            <input 
                                value={formData.addresses[0].subDistrict}
                                onChange={(e) => updateAddress(0, 'subDistrict', e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={styles.label}>เขต/อำเภอ</label>
                            <input 
                                value={formData.addresses[0].district}
                                onChange={(e) => updateAddress(0, 'district', e.target.value)}
                                className={styles.input}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={styles.label}>จังหวัด <span className="text-red-500">*</span></label>
                            <input 
                                value={formData.addresses[0].province}
                                onChange={(e) => updateAddress(0, 'province', e.target.value)}
                                className={styles.input} 
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={styles.label}>รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                            <input 
                                value={formData.addresses[0].postalCode}
                                onChange={(e) => updateAddress(0, 'postalCode', e.target.value)}
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
                                    onChange={(e) => updateAddress(0, 'contactPerson', e.target.value)}
                                    className={styles.input} 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>โทรศัพท์/ต่อ</label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <input 
                                            value={formData.addresses[0].phone || ''}
                                            onChange={(e) => updateAddress(0, 'phone', e.target.value)}
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
                                            onChange={(e) => updateAddress(0, 'phoneExtension', e.target.value)}
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
                                    onChange={(e) => updateAddress(0, 'country', e.target.value)}
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
                                onChange={(e) => updateAddress(1, 'address', e.target.value)}
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
                                onChange={(e) => updateAddress(1, 'subDistrict', e.target.value)}
                                className={styles.input} 
                                disabled={formData.sameAsRegistered}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={styles.label}>เขต/อำเภอ</label>
                            <input 
                                value={formData.addresses[1].district}
                                onChange={(e) => updateAddress(1, 'district', e.target.value)}
                                className={styles.input} 
                                disabled={formData.sameAsRegistered}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={styles.label}>จังหวัด <span className="text-red-500">*</span></label>
                            <input 
                                value={formData.addresses[1].province}
                                onChange={(e) => updateAddress(1, 'province', e.target.value)}
                                className={styles.input} 
                                disabled={formData.sameAsRegistered}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={styles.label}>รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                            <input 
                                value={formData.addresses[1].postalCode}
                                onChange={(e) => updateAddress(1, 'postalCode', e.target.value)}
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
                                    onChange={(e) => updateAddress(1, 'contactPerson', e.target.value)}
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
                                            onChange={(e) => updateAddress(1, 'phone', e.target.value)}
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
                                            onChange={(e) => updateAddress(1, 'phoneExtension', e.target.value)}
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
                                    onChange={(e) => updateAddress(1, 'country', e.target.value)}
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
                                        {ADDRESS_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
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
    );
};
