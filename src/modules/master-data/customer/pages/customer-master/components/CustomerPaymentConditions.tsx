import { type ChangeEvent } from 'react';
import { CreditCard } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { CustomerFormData } from '@customer/types/customer-types';

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
                        value={formData.credit_term} 
                        onChange={onChange} 
                        className={styles.input} 
                        placeholder="30" 
                    />
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>Credit Limit (Amount)</label>
                    <input 
                        name="credit_limit" 
                        type="number"
                        value={formData.credit_limit} 
                        onChange={onChange} 
                        className={styles.input} 
                        placeholder="100000" 
                    />
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>สกุลเงิน</label>
                    <input 
                        name="currency_id" 
                        value={formData.currency_id} 
                        onChange={onChange} 
                        className={styles.input} 
                        placeholder="THB" 
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
            </div>
        </section>
    );
}
