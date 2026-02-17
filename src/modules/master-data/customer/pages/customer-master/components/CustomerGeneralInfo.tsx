import { type ChangeEvent } from 'react';
import { Users } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { CustomerFormData } from '@customer/types/customer-types';

interface CustomerGeneralInfoProps {
    formData: CustomerFormData;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    errors: { [key: string]: string };
}

export function CustomerGeneralInfo({ formData, onChange, errors }: CustomerGeneralInfoProps) {
    return (
        <section>
            <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                <Users size={20} />
                <h3 className="font-semibold text-lg">ข้อมูลทั่วไป</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Customer Code & Tax ID */}
                <div className="space-y-1">
                    <label className={styles.label}>รหัสลูกค้า <span className="text-red-500">*</span></label>
                    <input 
                        name="customer_code" 
                        value={formData.customer_code} 
                        onChange={onChange} 
                        className={styles.input} 
                        placeholder="Auto Generated" 
                        disabled={true}
                    />
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>เลขประจำตัวผู้เสียภาษี</label>
                    <input 
                        name="tax_id" 
                        value={formData.tax_id} 
                        onChange={onChange} 
                        className={styles.input} 
                        placeholder="13 digits" 
                    />
                </div>

                {/* Name TH & EN */}
                <div className="space-y-1">
                    <label className={styles.label}>ชื่อลูกค้า (ไทย) <span className="text-red-500">*</span></label>
                    <input 
                        name="customer_name_th" 
                        value={formData.customer_name_th} 
                        onChange={onChange} 
                        className={`${styles.input} ${errors.customer_name_th ? 'border-red-500' : ''}`} 
                        placeholder="บริษัท เอบีซี จำกัด" 
                        required
                    />
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>ชื่อลูกค้า (อังกฤษ)</label>
                    <input 
                        name="customer_name_en" 
                        value={formData.customer_name_en} 
                        onChange={onChange} 
                        className={styles.input} 
                        placeholder="ABC Company Limited" 
                    />
                </div>

                {/* Registration Checkbox */}
                <div className="md:col-span-2 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                name="vat_registered" 
                                checked={formData.vat_registered} 
                                onChange={onChange} 
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">
                            จดทะเบียนภาษีมูลค่าเพิ่ม (VAT Registered)
                        </span>
                    </label>
                </div>
            </div>
        </section>
    );
}
