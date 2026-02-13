import { useState, useEffect } from 'react';
import { RefreshCcw, Search, Save, RotateCcw } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { logger } from '@/shared/utils/logger';
import { mockItems, mockUnits, mockUOMConversions } from '@/modules/master-data/mocks/masterDataMocks';
import type { UOMConversionFormData } from '@/modules/master-data/types/master-data-types';
import { initialUOMConversionFormData } from '@/modules/master-data/types/master-data-types';
import { DialogFormLayout } from '@ui';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

export function UOMConversionFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const [formData, setFormData] = useState<UOMConversionFormData>(initialUOMConversionFormData);
    const [isSearching, setIsSearching] = useState(false);

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
        if (!formData.itemCode.trim()) return;
        setIsSearching(true);
        setTimeout(() => {
            const found = mockItems.find(i => i.item_code.toLowerCase() === formData.itemCode.toLowerCase());
            if (found) {
                setFormData(prev => ({
                    ...prev,
                    itemCode: found.item_code,
                    itemName: found.item_name,
                }));
            } else {
                alert('ไม่พบรหัสสินค้าที่ค้นหา');
            }
            setIsSearching(false);
        }, 300);
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
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="กำหนดการแปลงหน่วย (UOM Conversion)"
            titleIcon={<RefreshCcw size={24} />}
            footer={Footer}
            isLoading={isSearching}
        >
            <div className="space-y-6">
                {/* Quick Search Header */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={styles.label}>รหัสสินค้า</label>
                            <input type="text" value={formData.itemCode} readOnly className={`${styles.input} bg-gray-100 dark:bg-gray-600`} />
                        </div>
                        <div>
                            <label className={styles.label}>ชื่อสินค้า</label>
                            <input type="text" value={formData.itemName || 'แสดงชื่อสินค้าอัตโนมัติ'} readOnly className={`${styles.input} bg-gray-100 dark:bg-gray-600`} />
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="space-y-4">
                    {/* Item Code Search */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={styles.label}>รหัสสินค้า</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.itemCode}
                                    onChange={(e) => handleInputChange('itemCode', e.target.value)}
                                    className={styles.input}
                                    placeholder="ระบุรหัสสินค้า"
                                />
                                <button
                                    onClick={handleFindItem}
                                    disabled={isSearching}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                >
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Units */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={styles.label}>หน่วยต้นทาง (From)</label>
                            <select 
                                value={formData.fromUnit} 
                                onChange={(e) => handleInputChange('fromUnit', e.target.value)} 
                                className={styles.inputSelect}
                            >
                                <option value="">-- เลือกหน่วย --</option>
                                {mockUnits.filter(u => u.is_active).map(u => (
                                    <option key={u.unit_id} value={u.unit_code}>{u.unit_name} ({u.unit_code})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={styles.label}>หน่วยปลายทาง (To)</label>
                            <select 
                                value={formData.toUnit} 
                                onChange={(e) => handleInputChange('toUnit', e.target.value)} 
                                className={styles.inputSelect}
                            >
                                <option value="">-- เลือกหน่วย --</option>
                                {mockUnits.filter(u => u.is_active).map(u => (
                                    <option key={u.unit_id} value={u.unit_code}>{u.unit_name} ({u.unit_code})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Factor & Checkboxes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={styles.label}>อัตราแปลง (Factor)</label>
                            <input
                                type="number"
                                step="0.000001"
                                value={formData.conversionFactor || ''}
                                onChange={(e) => handleInputChange('conversionFactor', parseFloat(e.target.value) || 0)}
                                className={styles.input}
                                placeholder="0.000000"
                            />
                        </div>
                        <div className="flex flex-col gap-2 pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isPurchaseUnit}
                                    onChange={(e) => handleInputChange('isPurchaseUnit', e.target.checked)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">ใช้หน่วยนี้ในการซื้อหรือไม่</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300 font-medium">สถานะใช้งาน</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </DialogFormLayout>
    );
}
