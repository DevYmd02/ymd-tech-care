import { ShoppingBag, Save, X } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { useSalesChannelForm } from './hooks/useSalesChannelForm';

// ====================================================================================
// PROPS
// ====================================================================================

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

// ====================================================================================
// COMPONENT
// ====================================================================================

export function SalesChannelFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        errors,
        isSubmitting
    } = useSalesChannelForm({ isOpen, onClose, editId, onSuccess });

    // ==================== RENDERING ====================
    
    // Header Icon
    const TitleIcon = <ShoppingBag size={24} className="text-white" />;

    // Footer Actions
    const FormFooter = (
        <div className="flex justify-end gap-3 p-4">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors border border-gray-300"
            >
                <X size={18} />
                ยกเลิก
            </button>
            <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
                <Save size={18} />
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={editId ? 'แก้ไขช่องทางการขาย' : 'เพิ่มช่องทางการขายใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                
                {/* Code */}
                <div>
                    <label className={styles.label}>
                        รหัสช่องทางการขาย <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('channelCode')}
                        type="text"
                        placeholder="กรอกรหัสช่องทางการขาย (เช่น CH-001)"
                        className={`${styles.input} ${errors.channelCode ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.channelCode && (
                        <p className="text-red-500 text-xs mt-1">{errors.channelCode.message}</p>
                    )}
                </div>

                {/* Name TH */}
                <div>
                    <label className={styles.label}>
                        ชื่อช่องทางการขาย (ไทย) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('channelName')}
                        type="text"
                        placeholder="กรอกชื่อช่องทางการขาย (เช่น ขายปลีก)"
                        className={`${styles.input} ${errors.channelName ? 'border-red-500 focus:ring-red-200' : ''}`}
                    />
                    {errors.channelName && (
                        <p className="text-red-500 text-xs mt-1">{errors.channelName.message}</p>
                    )}
                </div>

                {/* Name EN */}
                <div>
                    <label className={styles.label}>
                        ชื่อช่องทางการขาย (Eng)
                    </label>
                    <input
                        {...register('channelNameEn')}
                        type="text"
                        placeholder="e.g. Retail"
                        className={styles.input}
                    />
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors group cursor-pointer">
                    <input
                        {...register('isActive')}
                        type="checkbox"
                        id="sales_channel_is_active"
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <label 
                        htmlFor="sales_channel_is_active" 
                        className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer"
                    >
                        สถานะใช้งาน (Active)
                    </label>
                </div>
            </div>
        </DialogFormLayout>
    );
}
