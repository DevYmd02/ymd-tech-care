/**
 * @file ItemBarcodeFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลบาร์โค้ดสินค้า
 */

import { useState, useEffect } from 'react';
import { X, ScanBarcode, Search, Save, RotateCcw } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { logger } from '@/shared/utils/logger';
import { mockItems, mockUnits, mockItemBarcodes } from '@/modules/master-data/mocks/masterDataMocks';
import type { ItemBarcodeFormData } from '@/modules/master-data/types/master-data-types';
import { initialItemBarcodeFormData } from '@/modules/master-data/types/master-data-types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

export function ItemBarcodeFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
    const [formData, setFormData] = useState<ItemBarcodeFormData>(initialItemBarcodeFormData);
    const [isSearching, setIsSearching] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (editId) {
                const existing = mockItemBarcodes.find(b => b.barcode_id === editId);
                if (existing) {
                    setFormData({
                        itemCode: existing.item_code,
                        itemName: existing.item_name,
                        barcode: existing.barcode,
                        linkedUnit: existing.unit_name || '',
                        isPrimary: existing.is_primary,
                        isActive: existing.is_active,
                    });
                }
            } else {
                setFormData(initialItemBarcodeFormData);
            }
        }
    }, [isOpen, editId]);

    if (!isOpen) return null;

    const handleInputChange = (field: keyof ItemBarcodeFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFindItem = () => {
        if (!formData.itemCode.trim()) return;
        setIsSearching(true);
        // Simulate API delay
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

    const handleSave = async () => {
        if (!formData.itemCode.trim() || !formData.barcode.trim()) {
            alert('กรุณากรอกรหัสสินค้าและบาร์โค้ด');
            return;
        }
        
        try {
            // In a real app, this would call the service
            // await ItemBarcodeService.create(formData); or .update(editId, formData);
            logger.log('Save Item Barcode:', formData);
            alert(editId ? 'บันทึกการแก้ไขสำเร็จ' : 'เพิ่มบาร์โค้ดใหม่สำเร็จ');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving item barcode:', error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    const handleReset = () => {
        setFormData(initialItemBarcodeFormData);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 transition-opacity" onClick={onClose}></div>

                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl mx-auto transform transition-all">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ScanBarcode className="text-white" size={24} />
                                <span className="text-white font-semibold">กำหนดรหัสบาร์โค้ดสินค้า</span>
                            </div>
                            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Quick Search Header */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
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
                    <div className="p-6 space-y-4">
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
                            
                            {/* Barcode */}
                            <div>
                                <label className={styles.label}>รหัสบาร์โค้ด</label>
                                <input
                                    type="text"
                                    value={formData.barcode}
                                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                                    className={styles.input}
                                    placeholder="ระบุบาร์โค้ด"
                                />
                            </div>
                        </div>

                        {/* Linked Unit & checkboxes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={styles.label}>บาร์โค้ดผูกหน่วย</label>
                                <select 
                                    value={formData.linkedUnit} 
                                    onChange={(e) => handleInputChange('linkedUnit', e.target.value)} 
                                    className={styles.inputSelect}
                                >
                                    <option value="">-- เลือกหน่วย --</option>
                                    {mockUnits.filter(u => u.is_active).map(u => (
                                        <option key={u.unit_id} value={u.unit_code}>{u.unit_name} ({u.unit_code})</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex flex-col gap-2 pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isPrimary}
                                        onChange={(e) => handleInputChange('isPrimary', e.target.checked)}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">บาร์โค้ดหลัก</span>
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

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
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
                    </div>
                </div>
            </div>
        </div>
    );
}
