import { useFormContext } from 'react-hook-form';
import { UserCircle } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { CustomerSchemaType } from '@customer/customer-master/types/customer-schema';

export function CustomerContactInfo() {
    const { register, formState: { errors } } = useFormContext<CustomerSchemaType>();
    
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
                        {...register('contact_name')}
                        className={styles.input} 
                        placeholder="เช่น คุณสมชาย" 
                    />
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>เบอร์โทรศัพท์</label>
                    <input 
                        {...register('phone')}
                        className={styles.input} 
                        placeholder="02-XXX-XXXX" 
                    />
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>อีเมล</label>
                    <input 
                        {...register('email')}
                        type="email"
                        className={`${styles.input} ${errors.email ? 'border-red-500' : ''}`} 
                        placeholder="example@mail.com" 
                    />
                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>เว็บไซต์</label>
                    <input 
                        {...register('website')}
                        className={`${styles.input} ${errors.website ? 'border-red-500' : ''}`} 
                        placeholder="www.example.com" 
                    />
                    {errors.website && <p className="text-xs text-red-500">{errors.website.message}</p>}
                </div>
            </div>
        </section>
    );
}
