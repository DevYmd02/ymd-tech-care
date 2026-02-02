import React from 'react';
import { Phone } from 'lucide-react';
import { styles } from '@/constants';
import type { VendorFormData } from '@project-types/vendor-types';

interface VendorContactInfoProps {
    formData: VendorFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    errors: { [key: string]: string };
}

export const VendorContactInfo: React.FC<VendorContactInfoProps> = ({ formData, onChange, errors }) => {
    return (
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
                        onChange={onChange} 
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
                        onChange={onChange} 
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
                        onChange={onChange} 
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
                        onChange={onChange} 
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
                        onChange={onChange} 
                        className={styles.input} 
                        placeholder="www.example.com" 
                    />
                </div>
            </div>
        </section>
    );
};
