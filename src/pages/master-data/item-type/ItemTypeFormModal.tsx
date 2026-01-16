/**
 * @file ItemTypeFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขประเภทสินค้า
 */

import { useState, useEffect } from 'react';
import { X, Layers, Search, Save, RotateCcw } from 'lucide-react';
import { styles } from '../../../constants';
import { mockItemTypes } from '../../../__mocks__/masterDataMocks';
import type { ItemTypeFormData } from '../../../types/master-data-types';
import { initialItemTypeFormData } from '../../../types/master-data-types';

interface Props { isOpen: boolean; onClose: () => void; editId?: string | null; }

export function ItemTypeFormModal({ isOpen, onClose, editId }: Props) {
    const [formData, setFormData] = useState<ItemTypeFormData>(initialItemTypeFormData);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editId) {
                const existing = mockItemTypes.find(i => i.item_type_id === editId);
                if (existing) {
                    setFormData({
                        itemTypeCode: existing.item_type_code,
                        itemTypeCodeSearch: existing.item_type_code,
                        itemTypeName: existing.item_type_name,
                        itemTypeNameEn: existing.item_type_name_en || '',
                        isActive: existing.is_active,
                    });
                }
            } else {
                setFormData(initialItemTypeFormData);
            }
        }
    }, [isOpen, editId]);

    if (!isOpen) return null;

    const handleInputChange = (field: keyof ItemTypeFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSearch = () => {
        if (!formData.itemTypeCodeSearch.trim()) return;
        setIsSearching(true);
        setTimeout(() => {
            const found = mockItemTypes.find(i => i.item_type_code.toLowerCase() === formData.itemTypeCodeSearch.toLowerCase());
            if (found) {
                setFormData({
                    itemTypeCode: found.item_type_code,
                    itemTypeCodeSearch: found.item_type_code,
                    itemTypeName: found.item_type_name,
                    itemTypeNameEn: found.item_type_name_en || '',
                    isActive: found.is_active,
                });
            } else { alert('ไม่พบรหัสประเภทสินค้าที่ค้นหา'); }
            setIsSearching(false);
        }, 300);
    };

    const handleSave = () => {
        if (!formData.itemTypeCode.trim() || !formData.itemTypeName.trim()) { alert('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
        console.log('Save item type:', formData);
        alert(editId ? 'บันทึกการแก้ไขสำเร็จ' : 'เพิ่มประเภทสินค้าใหม่สำเร็จ');
        onClose();
    };

    const handleReset = () => { setFormData(initialItemTypeFormData); };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 transition-opacity" onClick={onClose}></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl mx-auto transform transition-all">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3"><Layers className="text-white" size={24} /><span className="text-white font-semibold">กำหนดรหัสประเภทสินค้า (Item Type)</span></div>
                            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X size={24} /></button>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={styles.label}>รหัสประเภท</label><input type="text" value={formData.itemTypeCodeSearch} readOnly className={`${styles.input} bg-gray-100 dark:bg-gray-600`} placeholder="ไม่ข้า" /></div>
                            <div><label className={styles.label}>ชื่อประเภท</label><input type="text" value={formData.itemTypeName} readOnly className={`${styles.input} bg-gray-100 dark:bg-gray-600`} /></div>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={styles.label}>รหัสประเภท</label>
                                <div className="flex gap-2">
                                    <input type="text" value={formData.itemTypeCodeSearch} onChange={(e) => handleInputChange('itemTypeCodeSearch', e.target.value)} className={styles.input} placeholder="ไม่ข้า (varchar 20)" />
                                    <button onClick={handleSearch} disabled={isSearching} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"><Search size={18} /></button>
                                </div>
                            </div>
                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.isActive} onChange={(e) => handleInputChange('isActive', e.target.checked)} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">ใช้งานอยู่</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={styles.label}>ชื่อประเภท</label><input type="text" value={formData.itemTypeName} onChange={(e) => handleInputChange('itemTypeName', e.target.value)} className={styles.input} placeholder="varchar(100)" /></div>
                            <div><label className={styles.label}>ชื่อประเภท (EN)</label><input type="text" value={formData.itemTypeNameEn} onChange={(e) => handleInputChange('itemTypeNameEn', e.target.value)} className={styles.input} placeholder="varchar(100)" /></div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-end gap-3">
                            <button onClick={handleReset} className={`${styles.btnSecondary} flex items-center gap-2`}><RotateCcw size={18} />ล้างข้อมูล</button>
                            <button onClick={handleSave} className={`${styles.btnPrimary} flex items-center gap-2`}><Save size={18} />บันทึก</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
