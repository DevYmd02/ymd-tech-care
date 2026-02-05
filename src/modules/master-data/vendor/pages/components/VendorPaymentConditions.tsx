import React from 'react';
import { CreditCard } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { PAYMENT_TERMS } from '@/modules/master-data/vendor/constants/vendorConstants';
import type { VendorFormData } from '@/modules/master-data/vendor/types/vendor-types';

interface VendorPaymentConditionsProps {
    formData: VendorFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onCreditLimitChange: (value: number) => void;
    errors: { [key: string]: string };
}

export const VendorPaymentConditions: React.FC<VendorPaymentConditionsProps> = ({
    formData,
    onChange,
    onCreditLimitChange,
    errors
}) => {
    return (
        <section>
            <div className="flex items-center gap-2 mb-4 text-purple-600 dark:text-purple-400">
                <CreditCard size={20} />
                <h3 className="font-semibold text-lg">เงื่อนไขการชำระเงิน</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className={styles.label}>เงื่อนไขการชำระเงิน <span className="text-red-500">*</span></label>
                    <select 
                        name="paymentTerms" 
                        value={formData.paymentTerms} 
                        onChange={onChange} 
                        className={`${styles.inputSelect} ${errors.paymentTerms ? 'border-red-500 focus:ring-red-500' : ''}`}
                        required
                    >
                        <option value="" disabled>เลือก</option>
                        {PAYMENT_TERMS.map(term => (
                            <option key={term.value} value={term.value}>{term.label}</option>
                        ))}
                    </select>
                    {errors.paymentTerms && <p className="text-red-500 text-xs mt-1">{errors.paymentTerms}</p>}
                </div>
                <div className="space-y-1">
                    <label className={styles.label}>วงเงินเครดิต (THB)</label>
                    <input 
                        type="text"
                        inputMode="numeric"
                        name="creditLimit" 
                        value={formData.creditLimit || ''} 
                        onChange={(e) => {
                            const val = e.target.value;
                            // Allow strictly only digits
                            if (val && !/^\d*$/.test(val)) return;
                            
                            // Remove leading zeros
                            const cleanVal = val.replace(/^0+(?=\d)/, '');
                            onCreditLimitChange(cleanVal === '' ? 0 : Number(cleanVal));
                        }} 
                        className={`${styles.input} ${errors.creditLimit ? 'border-red-500 focus:ring-red-500' : ''}`} 
                        placeholder="0"
                    />
                    {errors.creditLimit && <p className="text-red-500 text-xs mt-1">{errors.creditLimit}</p>}
                </div>
            </div>
        </section>
    );
};
