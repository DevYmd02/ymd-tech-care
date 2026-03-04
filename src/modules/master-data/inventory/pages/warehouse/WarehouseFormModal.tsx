import { Warehouse as WarehouseIcon, Save, X, RotateCcw } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { DialogFormLayout } from '@ui';
import { useWarehouseForm } from '../../hooks/useWarehouseForm';
import type { WarehouseMaster } from '@/modules/master-data/types/master-data-types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    initialData?: WarehouseMaster | null;
    onSuccess?: () => void;
}

export function WarehouseFormModal({ isOpen, onClose, editId, initialData, onSuccess }: Props) {
    const {
        register,
        errors,
        branches,
        isSaving,
        handleSave,
        clearForm
    } = useWarehouseForm(editId || null, initialData, onSuccess);

    const handleClose = () => {
        clearForm();
        onClose();
    };

    const TitleIcon = <WarehouseIcon size={24} className="text-white" />;

    const FormFooter = (
        <div className="flex justify-end gap-3 p-4">
            <button
                type="button"
                onClick={clearForm}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors border border-gray-300"
            >
                <RotateCcw size={18} />
                ล้างฟอร์ม (Clear)
            </button>
            <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 transition-colors border border-gray-300"
            >
                <X size={18} />
                ยกเลิก
            </button>
            <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
                <Save size={18} />
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={handleClose}
            title={editId ? 'แก้ไขข้อมูลคลังสินค้า' : 'เพิ่มคลังสินค้าใหม่'}
            titleIcon={TitleIcon}
            footer={FormFooter}
        >
            <div className="p-6 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Warehouse Code */}
                    <div>
                        <label className={styles.label}>
                            รหัสคลังสินค้า <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('warehouse_code')}
                            type="text"
                            placeholder="กรอกรหัสคลังสินค้า"
                            className={`${styles.input} ${errors.warehouse_code ? 'border-red-500 focus:ring-red-200' : ''}`}
                        />
                        {errors.warehouse_code && (
                            <p className="text-red-500 text-xs mt-1">{errors.warehouse_code.message}</p>
                        )}
                    </div>

                    {/* Is Active */}
                    <div className="flex items-end pb-2">
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 w-full">
                            <input
                                {...register('is_active')}
                                type="checkbox"
                                id="warehouse_is_active"
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="warehouse_is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                สถานะใช้งาน (Active)
                            </label>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Warehouse Name */}
                    <div>
                        <label className={styles.label}>
                            ชื่อคลังสินค้า <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('warehouse_name')}
                            type="text"
                            placeholder="กรอกชื่อคลังสินค้า"
                            className={`${styles.input} ${errors.warehouse_name ? 'border-red-500 focus:ring-red-200' : ''}`}
                        />
                        {errors.warehouse_name && (
                            <p className="text-red-500 text-xs mt-1">{errors.warehouse_name.message}</p>
                        )}
                    </div>
                    
                    {/* Branch Selection */}
                    <div>
                        <label className={styles.label}>
                            สาขา <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...register('branch_id')}
                            className={`${styles.input} ${errors.branch_id ? 'border-red-500 focus:ring-red-200' : ''}`}
                        >
                            <option value="">-- เลือกสาขา --</option>
                            {branches.map(branch => (
                                <option key={branch.branch_id} value={branch.branch_id}>
                                    {branch.branch_code} - {branch.branch_name}
                                </option>
                            ))}
                        </select>
                        {errors.branch_id && (
                            <p className="text-red-500 text-xs mt-1">{errors.branch_id.message}</p>
                        )}
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className={styles.label}>ที่อยู่ / รายละเอียด</label>
                    <textarea
                        {...register('address')}
                        className={`${styles.input} min-h-[80px] mt-1`}
                        placeholder="กรอกข้อมูลที่อยู่ (ถ้ามี)"
                    />
                </div>

            </div>
        </DialogFormLayout>
    );
}
