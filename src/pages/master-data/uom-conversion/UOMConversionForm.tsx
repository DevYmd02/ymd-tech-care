/**
 * @file UOMConversionForm.tsx
 * @description หน้าฟอร์มจัดการข้อมูลการแปลงหน่วย (Item UOM Conversion)
 * @route /master-data/uom-conversion
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRightLeft, Search, Plus, Save, Trash2, X, Loader2 } from 'lucide-react';
import { styles } from '../../../constants';
import { logger } from '../../../utils/logger';
import { mockItems, mockUnits, mockUOMConversions } from '../../../__mocks__/masterDataMocks';
import type { UOMConversionFormData } from '../../../types/master-data-types';
import { initialUOMConversionFormData } from '../../../types/master-data-types';

export default function UOMConversionForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('id');
    
    const [formData, setFormData] = useState<UOMConversionFormData>(initialUOMConversionFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
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
                });
            }
        }
    }, [editId]);

    const handleInputChange = (field: keyof UOMConversionFormData, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNew = () => {
        setFormData(initialUOMConversionFormData);
        setSaveError(null);
        navigate('/master-data/uom-conversion');
    };

    const handleSave = async () => {
        if (!formData.itemCode.trim() || !formData.fromUnit || !formData.toUnit) {
            setSaveError('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        setIsSaving(true);
        setSaveError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            logger.log('Save UOM Conversion:', formData);
            navigate('/master-data');
        } catch {
            setSaveError('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        if (confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) {
            navigate('/master-data');
        }
    };

    const handleFindItem = () => {
        if (!formData.itemCode.trim()) return;
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
    };

    return (
        <div className={styles.pageContainer}>
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg p-4 flex items-center gap-3 shadow-md">
                <ArrowRightLeft size={24} className="text-white" />
                <h1 className="text-lg font-semibold text-white">แปลงหน่วย (หลายหน่วยนับ) - Item UOM Conversion</h1>
            </div>

            {/* Note Banner */}
            <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg px-4 py-2 text-sm text-orange-700 dark:text-orange-300">
                ตัวอย่าง: 1 ลัง = 12 แพ็ค, 1 แพ็ค = 6 ชิ้น
            </div>

            {/* Main Form Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Quick Search Row */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">รหัสสินค้า</label>
                        <input type="text" value={formData.itemCode} readOnly className={`${styles.inputFlex} bg-gray-100 dark:bg-gray-600`} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">ชื่อสินค้า</label>
                        <input type="text" value={formData.itemName} readOnly className={`${styles.inputFlex} bg-gray-100 dark:bg-gray-600`} />
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-4 sm:p-6 space-y-6">
                    {/* Row 1: Item Code Search + Item Name (Auto) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">รหัสสินค้า</label>
                            <div className="flex gap-2 min-w-0 flex-1">
                                <input type="text" value={formData.itemCode} onChange={(e) => handleInputChange('itemCode', e.target.value)} className={styles.inputFlex} placeholder="Item Code" />
                                <button onClick={handleFindItem} className="px-3 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors shrink-0">
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">ชื่อสินค้า</label>
                            <input type="text" value={formData.itemName || 'แสดงชื่อสินค้าอัตโนมัติ'} readOnly className={`${styles.inputFlex} bg-gray-100 dark:bg-gray-600 text-gray-500`} />
                        </div>
                    </div>

                    {/* Row 2: From Unit -> To Unit */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">หน่วยต้นทาง (From)</label>
                            <div className="flex gap-2 min-w-0 flex-1">
                                <select value={formData.fromUnit} onChange={(e) => handleInputChange('fromUnit', e.target.value)} className={styles.inputFlex}>
                                    <option value="">-- เลือกหน่วย --</option>
                                    {mockUnits.filter(u => u.is_active).map(u => (
                                        <option key={u.unit_id} value={u.unit_code}>{u.unit_name} ({u.unit_code})</option>
                                    ))}
                                </select>
                                <button className="px-3 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors shrink-0">
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">หน่วยปลายทาง (To)</label>
                            <div className="flex gap-2 min-w-0 flex-1">
                                <select value={formData.toUnit} onChange={(e) => handleInputChange('toUnit', e.target.value)} className={styles.inputFlex}>
                                    <option value="">-- เลือกหน่วย --</option>
                                    {mockUnits.filter(u => u.is_active).map(u => (
                                        <option key={u.unit_id} value={u.unit_code}>{u.unit_name} ({u.unit_code})</option>
                                    ))}
                                </select>
                                <button className="px-3 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors shrink-0">
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Conversion Factor + Is Purchase Unit */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">อัตราแปลง (Factor)</label>
                            <input 
                                type="number" 
                                step="0.000001" 
                                value={formData.conversionFactor || ''} 
                                onChange={(e) => handleInputChange('conversionFactor', parseFloat(e.target.value) || 0)} 
                                className={styles.inputFlex} 
                                placeholder="0.000000" 
                            />
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.isPurchaseUnit} onChange={(e) => handleInputChange('isPurchaseUnit', e.target.checked)} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ใช้หน่วยนี้ในการซื้อหรือไม่</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-green-500 hover:text-white hover:border-green-500 transition-all">
                            <Plus size={16} />New
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50">
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {isSaving ? 'กำลังบันทึก...' : 'Save'}
                        </button>
                        <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                            <Trash2 size={16} />Delete
                        </button>
                        <button onClick={handleFindItem} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all">
                            <Search size={16} />Find
                        </button>
                        {saveError && <span className="text-red-500 text-sm ml-2">{saveError}</span>}
                    </div>
                    <button type="button" onClick={() => navigate('/master-data')} className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">
                        <X size={16} />Close
                    </button>
                </div>
            </div>
        </div>
    );
}
