import { useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { DialogFormLayout } from '@/shared/components/ui/layout/DialogFormLayout';
import { useCostCenterForm } from '../../hooks/useCostCenterForm';
import type { CostCenter } from '@/modules/master-data/types/master-data-types';

interface CostCenterFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: number | null;
    initialData?: CostCenter | null;
    onSuccess?: () => void;
}

export function CostCenterFormModal({ 
    isOpen, 
    onClose, 
    editId, 
    initialData, 
    onSuccess 
}: CostCenterFormModalProps) {
    const {
        register,
        formData,
        errors,
        isSaving,
        handleSave,
        clearForm
    } = useCostCenterForm(editId || null, initialData, () => {
        if (onSuccess) onSuccess();
        onClose();
    });

    // Ensure strict form reset on close to prevent data leakage (Vendor Rule)
    useEffect(() => {
        if (!isOpen) {
            clearForm();
        }
    }, [isOpen, clearForm]);

    const title = editId ? `แก้ไขศูนย์ต้นทุน: ${formData.cost_center_code}` : 'เพิ่มศูนย์ต้นทุนใหม่';

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            titleIcon={<DollarSign className="w-5 h-5 text-purple-600" />}
            width="max-w-2xl"
            isLoading={isSaving}
            footer={
                <div className="flex items-center justify-end gap-2 w-full">
                    <button 
                        onClick={onClose}
                        type="button"
                        className="px-4 py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {isSaving ? 'กำลังบันทึก...' : (editId ? 'บันทึกการแก้ไข' : 'บันทึก')}
                    </button>
                </div>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                            รหัสศูนย์ต้นทุน (Code) *
                        </label>
                        <input 
                            {...register('cost_center_code')}
                            className={`w-full h-9 bg-white dark:bg-gray-700 border ${errors.cost_center_code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 text-sm focus:ring-1 focus:ring-purple-500 outline-none`}
                            placeholder="เช่น CC-IT"
                            disabled={!!editId}
                        />
                        {errors.cost_center_code && <p className="text-[10px] text-red-500 mt-1">{errors.cost_center_code.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                            ชื่อศูนย์ต้นทุน (Name) *
                        </label>
                        <input 
                            {...register('cost_center_name')}
                            className={`w-full h-9 bg-white dark:bg-gray-700 border ${errors.cost_center_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 text-sm focus:ring-1 focus:ring-purple-500 outline-none`}
                            placeholder="เช่น แผนกเทคโนโลยีสารสนเทศ"
                        />
                        {errors.cost_center_name && <p className="text-[10px] text-red-500 mt-1">{errors.cost_center_name.message}</p>}
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                            งบประมาณ (Budget)
                        </label>
                        <input 
                            {...register('budget_amount', { valueAsNumber: true })}
                            type="number"
                            className={`w-full h-9 bg-white dark:bg-gray-700 border ${errors.budget_amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 text-sm focus:ring-1 focus:ring-purple-500 outline-none`}
                            placeholder="0.00"
                        />
                        {errors.budget_amount && <p className="text-[10px] text-red-500 mt-1">{errors.budget_amount.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                            ผู้รับผิดชอบ (Manager) *
                        </label>
                        <input 
                            {...register('manager_name')}
                            className={`w-full h-9 bg-white dark:bg-gray-700 border ${errors.manager_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 text-sm focus:ring-1 focus:ring-purple-500 outline-none`}
                            placeholder="ชื่อ-นามสกุล"
                        />
                        {errors.manager_name && <p className="text-[10px] text-red-500 mt-1">{errors.manager_name.message}</p>}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                        คำอธิบายเพิ่มเติม (Description)
                    </label>
                    <textarea 
                        {...register('description')}
                        rows={3}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-purple-500 outline-none resize-none"
                        placeholder="รายละเอียดศูนย์ต้นทุน..."
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer group w-fit">
                        <input 
                            type="checkbox"
                            {...register('is_active')}
                            className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:dark:text-white transition-colors">
                            เปิดใช้งาน (Active)
                        </span>
                    </label>
                </div>
            </div>
        </DialogFormLayout>
    );
}
