import { type ChangeEvent } from 'react';
import { UserCircle } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { CustomerFormData } from '@customer/types/customer-types';

interface CustomerContactInfoProps {
    formData: CustomerFormData;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function CustomerContactInfo({ formData, onChange }: CustomerContactInfoProps) {
    return (
        <section>
            <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                <UserCircle size={20} />
                <h3 className="font-semibold text-lg">ผู้ติดต่อประสานงาน</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                    <label className={styles.label}>ชื่อผู้ติดต่อ</label>
                    <input 
                        name="contact_name" 
                        value={formData.contact_name} 
                        onChange={onChange} 
                        className={styles.input} 
                        placeholder="เช่น คุณสมชาย" 
                    />
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>เบอร์โทรศัพท์</label>
                    <input 
                        name="phone" 
                        value={formData.phone} 
                        onChange={onChange} 
                        className={styles.input} 
                        placeholder="02-XXX-XXXX" 
                    />
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>อีเมล</label>
                    <input 
                        name="email" 
                        type="email"
                        value={formData.email} 
                        onChange={onChange} 
                        className={styles.input} 
                        placeholder="example@mail.com" 
                    />
                </div>
                <div className="space-y-1">
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
}
