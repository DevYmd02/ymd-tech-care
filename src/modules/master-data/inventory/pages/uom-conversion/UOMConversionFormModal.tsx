import { useState, useEffect } from 'react';
import { RefreshCcw, Search, Save, RotateCcw } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { useQuery } from '@tanstack/react-query';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';
import { UOMConversionService } from '@/modules/master-data/inventory/services/uom-conversion.service';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import type { ItemListItem } from '@/modules/master-data/types/master-data-types';
import { DialogFormLayout } from '@ui';
import { ProductSearchModal } from '@/modules/master-data/inventory/components/ProductSearchModal';
import { useUOMConversionForm } from '../../hooks/useUOMConversionForm';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: number | null;
    onSuccess?: () => void;
}

export function UOMConversionFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const [isItemSearchOpen, setIsItemSearchOpen] = useState(false);

    // Fetch details for edit mode
    const { data: existingData, isLoading: isFetchingDetail } = useQuery({
        queryKey: ['uom-conversion', editId],
        queryFn: () => editId ? UOMConversionService.getById(editId) : null,
        enabled: !!editId && isOpen,
    });

    const {
        formData,
        errors,
        register,
        isSaving,
        handleSave,
        setValue,
        clearForm,
    } = useUOMConversionForm(editId || null, existingData, () => {
        if (onSuccess) onSuccess();
        onClose();
    });

    // Fetch Units from API
    const { data: unitsResponse } = useQuery({
        queryKey: ['units', 'active-list'],
        queryFn: async () => {
            const res = await UnitService.getAll();
            return res.items || [];
        },
        enabled: isOpen,
    });

    const units = unitsResponse || [];
    const activeUnits = units.filter(u => u.is_active);

    // Fetch Item details if missing (for edit mode)
    const itemIdToFetch = formData.item_id;
    const { data: itemDetail } = useQuery({
        queryKey: ['item-detail', itemIdToFetch],
        queryFn: () => itemIdToFetch ? ItemMasterService.getById(itemIdToFetch) : null,
        enabled: !!itemIdToFetch && !formData.itemCode && isOpen,
    });

    // Auto-fill item info when fetched
    useEffect(() => {
        if (itemDetail && !formData.itemCode) {
            setValue('itemCode', itemDetail.item_code);
            setValue('itemName', itemDetail.item_name);
        }
    }, [itemDetail, formData.itemCode, setValue]);

    // Auto-fill unit names if missing
    useEffect(() => {
        if (activeUnits.length > 0) {
            if (formData.from_uom_id && !formData.fromUnit) {
                const unit = activeUnits.find(u => u.unit_id === formData.from_uom_id);
                if (unit) setValue('fromUnit', unit.unit_code);
            }
            if (formData.to_uom_id && !formData.toUnit) {
                const unit = activeUnits.find(u => u.unit_id === formData.to_uom_id);
                if (unit) setValue('toUnit', unit.unit_code);
            }
        }
    }, [activeUnits, formData.from_uom_id, formData.fromUnit, formData.to_uom_id, formData.toUnit, setValue]);

    const handleFindItem = () => {
        setIsItemSearchOpen(true);
    };

    const handleProductSelect = (product: ItemListItem) => {
        // Find the unit code for the product's base unit (Base UOM)
        const baseUnit = units.find(u => 
            u.unit_id === product.uom_id || 
            u.unit_id === product.unit_id ||
            u.unit_name === product.uom_name ||
            u.unit_name === product.unit_name
        );
        
        setValue('item_id', product.item_id || product.id);
        setValue('itemCode', product.item_code);
        setValue('itemName', product.item_name);
        
        if (baseUnit) {
            setValue('to_uom_id', baseUnit.unit_id);
            setValue('toUnit', baseUnit.unit_code);
        }
        
        setIsItemSearchOpen(false);
    };

    const handleReset = () => {
        clearForm();
    };

    const Footer = (
        <div className="flex justify-end gap-3">
            <button 
                onClick={handleReset} 
                className={`${styles.btnSecondary} flex items-center gap-2`}
                disabled={isSaving}
            >
                <RotateCcw size={18} />
                ล้างข้อมูล
            </button>
            <button 
                onClick={handleSave} 
                className={`${styles.btnPrimary} flex items-center gap-2`}
                disabled={isSaving || isFetchingDetail}
            >
                <Save size={18} />
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
        </div>
    );

    return (
        <>
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="กำหนดการแปลงหน่วย (UOM Conversion)"
            titleIcon={<RefreshCcw size={24} />}
            footer={Footer}
        >
            <div className="space-y-6">
                {/* Item Selection Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                        <label className={styles.label}>รหัสสินค้า</label>
                        <div className="relative group">
                            <input
                                type="text"
                                {...register('itemCode')}
                                className={`${styles.input} pr-12 focus:ring-purple-500 ${errors.itemCode ? 'border-red-500' : ''}`}
                                placeholder="ระบุรหัสสินค้า"
                                readOnly
                            />
                            <button
                                onClick={handleFindItem}
                                title="ค้นหาสินค้า"
                                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-all flex items-center justify-center"
                            >
                                <Search size={16} />
                            </button>
                        </div>
                        {errors.itemCode && <p className="text-red-500 text-xs mt-1">{errors.itemCode.message}</p>}
                    </div>
                    <div>
                        <label className={styles.label}>ชื่อสินค้า</label>
                        <div className={`${styles.input} bg-gray-50/50 dark:bg-gray-800/30 border-dashed text-gray-500 dark:text-gray-400 min-h-[42px] flex items-center px-3 truncate`}>
                            {formData.itemName || 'เลือกสินค้าเพื่อแสดงชื่อสินค้า'}
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-700" />

                {/* Conversion Logic Section */}
                <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={styles.label}>หน่วยต้นทาง (From)</label>
                            <select 
                                value={formData.from_uom_id || ''} 
                                onChange={(e) => {
                                    const id = parseInt(e.target.value);
                                    const unit = activeUnits.find(u => u.unit_id === id);
                                    setValue('from_uom_id', id);
                                    setValue('fromUnit', unit?.unit_code || '');
                                }} 
                                className={`${styles.inputSelect} ${errors.from_uom_id ? 'border-red-500' : ''}`}
                            >
                                <option value="">-- เลือกหน่วย --</option>
                                {activeUnits.map(u => (
                                    <option key={u.unit_id} value={u.unit_id}>{u.unit_name} ({u.unit_code})</option>
                                ))}
                            </select>
                            {errors.from_uom_id && <p className="text-red-500 text-xs mt-1">{errors.from_uom_id.message}</p>}
                        </div>
                        <div>
                            <label className={styles.label}>หน่วยปลายทาง (To)</label>
                            <select 
                                value={formData.to_uom_id || ''} 
                                onChange={(e) => {
                                    const id = parseInt(e.target.value);
                                    const unit = activeUnits.find(u => u.unit_id === id);
                                    setValue('to_uom_id', id);
                                    setValue('toUnit', unit?.unit_code || '');
                                }} 
                                className={`${styles.inputSelect} ${formData.itemCode ? 'border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10' : ''} ${errors.to_uom_id ? 'border-red-500' : ''}`}
                            >
                                <option value="">-- เลือกหน่วย --</option>
                                {activeUnits.map(u => (
                                    <option key={u.unit_id} value={u.unit_id}>{u.unit_name} ({u.unit_code})</option>
                                ))}
                            </select>
                            {errors.to_uom_id && <p className="text-red-500 text-xs mt-1">{errors.to_uom_id.message}</p>}
                        </div>
                    </div>

                    {/* Factor & Checkboxes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div>
                            <label className={styles.label}>อัตราแปลง (Factor)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.000001"
                                    {...register('conversionFactor', { valueAsNumber: true })}
                                    className={`${styles.input} font-mono ${errors.conversionFactor ? 'border-red-500' : ''}`}
                                    placeholder="0.000000"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                                    Decimal (6)
                                </div>
                            </div>
                            {errors.conversionFactor && <p className="text-red-500 text-xs mt-1">{errors.conversionFactor.message}</p>}
                        </div>
                        <div className="space-y-3 pb-1">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        {...register('isPurchaseUnit')}
                                        className="w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">ใช้หน่วยนี้ในการซื้อ (Purchase Unit)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        {...register('isActive')}
                                        className="w-5 h-5 text-green-600 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 cursor-pointer"
                                    />
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-green-600 transition-colors">สถานะการใช้งาน (Active)</span>
                            </label>
                        </div>
                    </div>

                    {/* Logic Helper Preview */}
                    {(formData.fromUnit || formData.toUnit) && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                <span className="font-bold underline decoration-blue-400">สรุปหลักการ:</span>
                                <span>1 {formData.fromUnit || '...'} = </span>
                                <span className="font-mono font-bold text-lg">{(formData.conversionFactor || 0).toFixed(6)}</span>
                                <span> {formData.toUnit || '...'}</span>
                            </p>
                            <p className="text-[11px] text-blue-500 dark:text-blue-400 mt-1 italic">
                                * หมายถึง 1 {formData.fromUnit || 'หน่วยต้นทาง'} จะมีค่าเท่ากับ {formData.conversionFactor} {formData.toUnit || 'หน่วยหลัก'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DialogFormLayout>

        <ProductSearchModal 
            isOpen={isItemSearchOpen}
            onClose={() => setIsItemSearchOpen(false)}
            onSelect={handleProductSelect}
        />
        </>
    );
}
