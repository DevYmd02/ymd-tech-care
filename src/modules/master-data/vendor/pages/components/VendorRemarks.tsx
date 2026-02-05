import React from 'react';
import { Database } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import type { VendorFormData } from '@/modules/master-data/vendor/types/vendor-types';

interface VendorRemarksProps {
    formData: VendorFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    errors: { [key: string]: string };
}

export const VendorRemarks: React.FC<VendorRemarksProps> = ({ formData, onChange, errors }) => {
    return (
        <section>
            <div className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-400">
                <Database size={20} />
                <h3 className="font-semibold text-lg">หมายเหตุ</h3>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <textarea 
                    name="remarks"
                    value={formData.remarks} 
                    onChange={onChange} 
                    className={`${styles.input} ${errors.remarks ? 'border-red-500 focus:ring-red-500' : ''}`} 
                    rows={3}
                />
                {errors.remarks && <p className="text-red-500 text-xs mt-1">{errors.remarks}</p>}
            </div>
        </section>
    );
};
