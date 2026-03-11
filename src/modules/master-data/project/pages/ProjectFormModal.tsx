import { useEffect } from 'react';
import { FolderKanban } from 'lucide-react';
import { DialogFormLayout } from '@/shared/components/ui/layout/DialogFormLayout';
import { useProjectForm } from '../hooks/useProjectForm';
import { CostCenterService } from '../../accounting/services/cost-center.service';
import { useQuery } from '@tanstack/react-query';
import type { Project } from '@/modules/master-data/types/master-data-types';

interface ProjectFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: number | null;
    initialData?: Project | null;
    onSuccess?: () => void;
}

export function ProjectFormModal({ 
    isOpen, 
    onClose, 
    editId, 
    initialData, 
    onSuccess 
}: ProjectFormModalProps) {
    const {
        register,
        formData,
        errors,
        isSaving,
        handleSave,
        clearForm
    } = useProjectForm(editId || null, initialData, () => {
        if (onSuccess) onSuccess();
        onClose();
    });

    // Fetch Cost Centers for dropdown
    const { data: costCenters = [] } = useQuery({
        queryKey: ['cost-centers'],
        queryFn: () => CostCenterService.getList(),
        enabled: isOpen,
    });

    // Ensure strict form reset on close to prevent data leakage (Vendor Rule)
    useEffect(() => {
        if (!isOpen) {
            clearForm();
        }
    }, [isOpen, clearForm]);

    const title = editId ? `แก้ไขโครงการ: ${formData.project_code}` : 'เพิ่มโครงการใหม่ (New Project)';

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            titleIcon={<FolderKanban className="w-5 h-5 text-blue-600" />}
            width="max-w-4xl"
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
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {isSaving ? 'กำลังบันทึก...' : (editId ? 'บันทึกการแก้ไข' : 'บันทึก')}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* section: General Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                                รหัสโครงการ (Project Code) *
                            </label>
                            <input 
                                {...register('project_code')}
                                className={`w-full h-9 bg-white dark:bg-gray-700 border ${errors.project_code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none`}
                                placeholder="เช่น PRJ-2024-001"
                                disabled={!!editId}
                            />
                            {errors.project_code && <p className="text-[10px] text-red-500 mt-1">{errors.project_code.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                                ชื่อโครงการ (Project Name) *
                            </label>
                            <input 
                                {...register('project_name')}
                                className={`w-full h-9 bg-white dark:bg-gray-700 border ${errors.project_name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none`}
                                placeholder="เช่น ปรับปรุงระบบ ERP Phase 1"
                            />
                            {errors.project_name && <p className="text-[10px] text-red-500 mt-1">{errors.project_name.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                                ศูนย์ต้นทุน (Cost Center) *
                            </label>
                            <select 
                                {...register('cost_center_id')}
                                className={`w-full h-9 bg-white dark:bg-gray-700 border ${errors.cost_center_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none`}
                            >
                                <option value="">-- เลือกศูนย์ต้นทุน --</option>
                                {costCenters.map(cc => (
                                    <option key={cc.cost_center_id} value={cc.cost_center_id}>
                                        {cc.cost_center_code} - {cc.cost_center_name}
                                    </option>
                                ))}
                            </select>
                            {errors.cost_center_id && <p className="text-[10px] text-red-500 mt-1">{errors.cost_center_id.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                                งบประมาณโครงการ (Budget)
                            </label>
                            <input 
                                {...register('budget_amount', { valueAsNumber: true })}
                                type="number"
                                className={`w-full h-9 bg-white dark:bg-gray-700 border ${errors.budget_amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none`}
                                placeholder="0.00"
                            />
                            {errors.budget_amount && <p className="text-[10px] text-red-500 mt-1">{errors.budget_amount.message}</p>}
                        </div>
                    </div>
                </div>

                {/* section: Timeline & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                            วันที่เริ่ม (Start Date) *
                        </label>
                        <input 
                            {...register('start_date')}
                            type="date"
                            className={`w-full h-9 bg-white dark:bg-gray-700 border ${errors.start_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none`}
                        />
                        {errors.start_date && <p className="text-[10px] text-red-500 mt-1">{errors.start_date.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                            วันที่สิ้นสุด (End Date) *
                        </label>
                        <input 
                            {...register('end_date')}
                            type="date"
                            className={`w-full h-9 bg-white dark:bg-gray-700 border ${errors.end_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none`}
                        />
                        {errors.end_date && <p className="text-[10px] text-red-500 mt-1">{errors.end_date.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                            สถานะโครงการ (Status)
                        </label>
                        <select 
                            {...register('status')}
                            className="w-full h-9 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="ON_HOLD">On Hold</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                        รายละเอียดโครงการ (Description)
                    </label>
                    <textarea 
                        {...register('description')}
                        rows={3}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                        placeholder="รายละเอียดหรือวัตถุประสงค์ของโครงการ..."
                    />
                </div>

                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group w-fit">
                        <input 
                            type="checkbox"
                            {...register('is_active')}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:dark:text-white transition-colors">
                            สถานะการใช้งาน (Active)
                        </span>
                    </label>
                </div>
            </div>
        </DialogFormLayout>
    );
}
