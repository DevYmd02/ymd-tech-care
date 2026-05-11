import { useState, useEffect } from 'react';
import { RefreshCcw, Search, Save, RotateCcw } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { logger } from '@/shared/utils';
import { useQuery } from '@tanstack/react-query';
import { UnitService } from '@/modules/master-data/inventory/services/unit.service';
import { mockUOMConversions } from '@/modules/master-data/mocks/masterDataMocks';
import type { UOMConversionFormData, ItemListItem } from '@/modules/master-data/types/master-data-types';
import { initialUOMConversionFormData } from '@/modules/master-data/types/master-data-types';
import { DialogFormLayout } from '@ui';
import { ProductSearchModal } from '@/modules/master-data/inventory/components/ProductSearchModal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: number | null;
    onSuccess?: () => void;
}

export function UOMConversionFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const [formData, setFormData] = useState<UOMConversionFormData>(initialUOMConversionFormData);
    const [isItemSearchOpen, setIsItemSearchOpen] = useState(false);

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

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (editId) {
                const existing = mockUOMConversions.find(c => c.conversion_id === editId);
                if (existing) {
                    setFormData({
                        itemCode: existing.item_code,
                        itemName: existing.item_name,
                        fromUnit: existing.from_unit_name,
                        toUnit: existing.to_unit_name,
                        conversionFactor: existing.conversion_factor,
                        isPurchaseUnit: existing.is_purchase_unit,
                        isActive: existing.is_active,
                    });
                }
            } else {
                setFormData(initialUOMConversionFormData);
            }
        }
    }, [isOpen, editId]);

    const handleInputChange = (field: keyof UOMConversionFormData, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFindItem = () => {
        setIsItemSearchOpen(true);
    };

    const handleProductSelect = (product: ItemListItem) => {
        // Find the unit code for the product's base unit (Base UOM)
        // Search by ID first, then fallback to name matching for robustness
        const baseUnit = units.find(u => 
            u.unit_id === product.uom_id || 
            u.unit_id === product.unit_id ||
            u.unit_name === product.uom_name ||
            u.unit_name === product.unit_name ||
            product.uom_name?.includes(u.unit_name) ||
            product.unit_name?.includes(u.unit_name)
        );
        
        setFormData(prev => ({
            ...prev,
            itemCode: product.item_code,
            itemName: product.item_name,
            toUnit: baseUnit?.unit_code || '', // Auto-fill with Base UOM code (e.g. 'PCS')
        }));
        setIsItemSearchOpen(false);
    };

    const handleSave = () => {
        if (!formData.itemCode.trim() || !formData.fromUnit || !formData.toUnit) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        
        logger.log('Save UOM Conversion:', formData);
        alert(editId ? 'บันทึกการแก้ไขสำเร็จ' : 'เพิ่มการแปลงหน่วยใหม่สำเร็จ');
        if (onSuccess) onSuccess();
        onClose();
    };

    const handleReset = () => {
        setFormData(initialUOMConversionFormData);
    };

    const Footer = (
        <div className="flex justify-end gap-3">
            <button onClick={handleReset} className={`${styles.btnSecondary} flex items-center gap-2`}>
                <RotateCcw size={18} />
                ล้างข้อมูล
            </button>
            <button onClick={handleSave} className={`${styles.btnPrimary} flex items-center gap-2`}>
                <Save size={18} />
                บันทึก
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
                                value={formData.itemCode}
                                onChange={(e) => handleInputChange('itemCode', e.target.value)}
                                className={`${styles.input} pr-12 focus:ring-purple-500`}
                                placeholder="ระบุรหัสสินค้า"
                            />
                            <button
                                onClick={handleFindItem}
                                title="ค้นหาสินค้า"
                                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-all flex items-center justify-center"
                            >
                                <Search size={16} />
                            </button>
                        </div>
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
                                value={formData.fromUnit} 
                                onChange={(e) => handleInputChange('fromUnit', e.target.value)} 
                                className={styles.inputSelect}
                            >
                                <option value="">-- เลือกหน่วย --</option>
                                {activeUnits.map(u => (
                                    <option key={u.unit_id} value={u.unit_code}>{u.unit_name} ({u.unit_code})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={styles.label}>หน่วยปลายทาง (To)</label>
                            <select 
                                value={formData.toUnit} 
                                onChange={(e) => handleInputChange('toUnit', e.target.value)} 
                                className={`${styles.inputSelect} ${formData.itemCode ? 'border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                            >
                                <option value="">-- เลือกหน่วย --</option>
                                {activeUnits.map(u => (
                                    <option key={u.unit_id} value={u.unit_code}>{u.unit_name} ({u.unit_code})</option>
                                ))}
                            </select>
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
                                    value={formData.conversionFactor || ''}
                                    onChange={(e) => handleInputChange('conversionFactor', parseFloat(e.target.value) || 0)}
                                    className={`${styles.input} font-mono`}
                                    placeholder="0.000000"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                                    Decimal (6)
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3 pb-1">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPurchaseUnit}
                                        onChange={(e) => handleInputChange('isPurchaseUnit', e.target.checked)}
                                        className="w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 transition-colors">ใช้หน่วยนี้ในการซื้อ (Purchase Unit)</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
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
                                <span className="font-mono font-bold text-lg">{formData.conversionFactor.toFixed(6)}</span>
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
