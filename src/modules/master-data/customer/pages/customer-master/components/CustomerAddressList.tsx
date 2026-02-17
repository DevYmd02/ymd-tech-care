import { type ChangeEvent } from 'react';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { CustomerFormData, CustomerAddressFormItem } from '@customer/types/customer-types';

interface CustomerAddressListProps {
    formData: CustomerFormData;
    errors: { [key: string]: string };
    addAddress: () => void;
    removeAddress: (index: number) => void;
    updateAddress: (index: number, field: keyof CustomerAddressFormItem, value: string | boolean) => void;
    handleSameAsRegisteredChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function CustomerAddressList({ 
    formData, 
    addAddress, 
    removeAddress, 
    updateAddress,
    handleSameAsRegisteredChange
}: CustomerAddressListProps) {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <MapPin size={20} />
                    <h3 className="font-semibold text-lg">ข้อมูลที่อยู่</h3>
                </div>
                <button 
                    type="button" 
                    onClick={addAddress}
                    className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                    <Plus size={16} /> บันทึกที่อยู่เพิ่ม
                </button>
            </div>

            <div className="space-y-4">
                {formData.addresses.map((addr, index) => (
                    <div key={addr.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative">
                        {index > 1 && (
                            <button 
                                type="button"
                                onClick={() => removeAddress(index)}
                                className="absolute top-4 right-4 text-red-500 hover:text-red-600"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        
                        <div className="flex items-center gap-2 mb-4">
                            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                                {addr.addressType === 'REGISTERED' ? 'ที่อยู่ตามทะเบียนภาษี' : addr.addressType === 'CONTACT' ? 'ที่อยู่ติดต่อ' : 'ที่อยู่จัดส่ง'}
                            </span>
                            {addr.addressType === 'CONTACT' && (
                                <label className="flex items-center gap-2 cursor-pointer ml-4">
                                    <input 
                                        type="checkbox" 
                                        name="same_as_registered"
                                        checked={formData.same_as_registered}
                                        onChange={handleSameAsRegisteredChange}
                                        className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-gray-500 italic">เหมือนกับที่อยู่ตามทะเบียน</span>
                                </label>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-1">
                                <label className={styles.label}>ที่อยู่ (เลขที่, อาคาร, ถนน) <span className="text-red-500">*</span></label>
                                <textarea 
                                    value={addr.address}
                                    onChange={(e) => updateAddress(index, 'address', e.target.value)}
                                    className={`${styles.textarea} h-20`}
                                    placeholder="กรอกข้อมูลที่อยู่..."
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>ตำบล/แขวง</label>
                                <input 
                                    value={addr.subDistrict}
                                    onChange={(e) => updateAddress(index, 'subDistrict', e.target.value)}
                                    className={styles.input}
                                    placeholder="กรอกตำบล"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>อำเภอ/เขต <span className="text-red-500">*</span></label>
                                <input 
                                    value={addr.district}
                                    onChange={(e) => updateAddress(index, 'district', e.target.value)}
                                    className={styles.input}
                                    placeholder="กรอกอำเภอ"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>จังหวัด <span className="text-red-500">*</span></label>
                                <input 
                                    value={addr.province}
                                    onChange={(e) => updateAddress(index, 'province', e.target.value)}
                                    className={styles.input}
                                    placeholder="กรอกจังหวัด"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className={styles.label}>รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                                <input 
                                    value={addr.postalCode}
                                    onChange={(e) => updateAddress(index, 'postalCode', e.target.value)}
                                    className={styles.input}
                                    placeholder="XXXXX"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
