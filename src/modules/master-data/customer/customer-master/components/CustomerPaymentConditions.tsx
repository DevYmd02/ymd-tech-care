import { type ChangeEvent } from 'react';
import { CreditCard } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { CustomerFormData } from '@customer/customer-master/types/customer-types';

interface CustomerPaymentConditionsProps {
    formData: CustomerFormData;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function CustomerPaymentConditions({ formData, onChange }: CustomerPaymentConditionsProps) {
    return (
        <section>
            <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                <CreditCard size={20} />
                <h3 className="font-semibold text-lg">เงื่อนไขการชำระเงิน</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                    <label className={styles.label}>Credit Term (Day)</label>
                    <input 
                        name="credit_term" 
                        type="number"
                        value={formData.credit_term === 0 ? '' : formData.credit_term} 
                        onChange={onChange} 
                        onFocus={(e) => e.target.select()}
                        className={styles.input} 
                        placeholder="0" 
                    />
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>Credit Limit (Amount)</label>
                    <input 
                        name="credit_limit" 
                        type="number"
                        value={formData.credit_limit === 0 ? '' : formData.credit_limit} 
                        onChange={onChange} 
                        onFocus={(e) => e.target.select()}
                        className={styles.input} 
                        placeholder="0" 
                    />
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>วิธีชำระเงิน</label>
                    <input 
                        name="payment_method_id" 
                        value={formData.payment_method_id} 
                        onChange={onChange} 
                        className={styles.input} 
                        placeholder="เงินโอน / เช็ค" 
                    />
                </div>
                
                <div className="pt-7">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                name="is_active" 
                                checked={formData.is_active} 
                                onChange={onChange} 
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-green-500 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-green-500 transition-colors">
                            สถานะการใช้งาน (Active)
                        </span>
                    </label>
                </div>
            </div>
        </section>
    );
}
