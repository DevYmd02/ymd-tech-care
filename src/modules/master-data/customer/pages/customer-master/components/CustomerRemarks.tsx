import { type ChangeEvent } from 'react';
import { FileText } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { CustomerFormData } from '@customer/types/customer-types';

interface CustomerRemarksProps {
    formData: CustomerFormData;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function CustomerRemarks({ formData, onChange }: CustomerRemarksProps) {
    return (
        <section>
            <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                <FileText size={20} />
                <h3 className="font-semibold text-lg">หมายเหตุเพิ่มเติม</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="space-y-1">
                    <label className={styles.label}>หมายเหตุ</label>
                    <textarea 
                        name="note" 
                        value={formData.note} 
                        onChange={onChange} 
                        className={styles.textarea} 
                        placeholder="ข้อมูลเพิ่มเติม..."
                        rows={4}
                    />
                </div>
            </div>
        </section>
    );
}
