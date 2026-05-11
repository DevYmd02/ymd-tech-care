import { useFormContext } from 'react-hook-form';
import { CreditCard } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { CustomerSchemaType } from '@customer/customer-master/types/customer-schema';
import { useState, useEffect } from 'react';
import { PriceLevelNameService } from '@sales-master/pages/price-level-name/services/price-level-name.service';
import type { PriceLevelName } from '@sales-master/pages/price-level-name/types/price-level-name.types';
import { logger } from '@/shared/utils';

export function CustomerPaymentConditions() {
    const { register, setValue, getValues, formState: { errors } } = useFormContext<CustomerSchemaType>();
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

    // Re-sync values once options are loaded
    useEffect(() => {
        if (priceLevels.length > 0) {
            setValue('price_level_id', getValues('price_level_id'));
        }
    }, [priceLevels, setValue, getValues]);

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
                        {...register('credit_term')}
                        type="number"
                        onFocus={(e) => e.target.select()}
                        className={`${styles.input} ${errors.credit_term ? 'border-red-500' : ''}`} 
                        placeholder="0" 
                    />
                    {errors.credit_term && <p className="text-xs text-red-500">{errors.credit_term.message}</p>}
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>Credit Limit (Amount)</label>
                    <input 
                        {...register('credit_limit')}
                        type="number"
                        onFocus={(e) => e.target.select()}
                        className={`${styles.input} ${errors.credit_limit ? 'border-red-500' : ''}`} 
                        placeholder="0" 
                    />
                    {errors.credit_limit && <p className="text-xs text-red-500">{errors.credit_limit.message}</p>}
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>วิธีชำระเงิน</label>
                    <input 
                        {...register('payment_method_id')}
                        className={styles.input} 
                        placeholder="เงินโอน / เช็ค" 
                    />
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>ระดับการขาย</label>
                    <select 
                        {...register('price_level_id')}
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
