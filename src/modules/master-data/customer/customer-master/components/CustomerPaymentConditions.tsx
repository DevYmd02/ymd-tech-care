import { type ChangeEvent } from 'react';
import { CreditCard } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { CustomerFormData } from '@customer/customer-master/types/customer-types';
import { useState, useEffect } from 'react';
import { PriceLevelNameService } from '@sales-master/pages/price-level-name/services/price-level-name.service';
import type { PriceLevelName } from '@sales-master/pages/price-level-name/types/price-level-name.types';
import { logger } from '@/shared/utils/logger';

interface CustomerPaymentConditionsProps {
    formData: CustomerFormData;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function CustomerPaymentConditions({ formData, onChange }: CustomerPaymentConditionsProps) {
    const [priceLevels, setPriceLevels] = useState<PriceLevelName[]>([]);

    useEffect(() => {
        const fetchLevels = async () => {
            try {
                const response = await PriceLevelNameService.getList();
                const data = Array.isArray(response) ? response : [];
                setPriceLevels(data.sort((a, b) => (a.level_no || 0) - (b.level_no || 0)));
            } catch (error) {
                logger.error('Failed to fetch price levels for customer form', error);
            }
        };
        fetchLevels();
    }, []);

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
                <div className="space-y-1">
                    <label className={styles.label}>ระดับการขาย</label>
                    <select 
                        name="price_level_id" 
                        value={formData.price_level_id} 
                        onChange={onChange} 
                        className={styles.input}
                    >
                        <option value="">-- เลือก --</option>
                        {priceLevels.map(level => (
                            <option key={level.id} value={level.id}>
                                ระดับที่ {level.level_no} ({level.name})
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </section>
    );
}
