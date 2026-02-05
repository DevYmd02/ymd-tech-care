/**
 * @file ProductCategoryFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขหมวดสินค้า
 */

import { useState, useEffect } from 'react';
import { X, Tag, Search, Save, RotateCcw } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { logger } from '@/shared/utils/logger';
import { mockProductCategories } from '@/modules/master-data/mocks/masterDataMocks';
import type { ProductCategoryFormData } from '@/modules/master-data/types/master-data-types';
import { initialProductCategoryFormData } from '@/modules/master-data/types/master-data-types';

interface Props { isOpen: boolean; onClose: () => void; editId?: string | null; }

export function ProductCategoryFormModal({ isOpen, onClose, editId }: Props) {
    const [formData, setFormData] = useState<ProductCategoryFormData>(initialProductCategoryFormData);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editId) {
                const existing = mockProductCategories.find(c => c.category_id === editId);
                if (existing) {
                    setFormData({
                        categoryCode: existing.category_code,
                        categoryCodeSearch: existing.category_code,
                        categoryName: existing.category_name,
                        categoryNameEn: existing.category_name_en || '',
                        isActive: existing.is_active,
                    });
                }
            } else {
                setFormData(initialProductCategoryFormData);
            }
        }
    }, [isOpen, editId]);

    if (!isOpen) return null;

    const handleInputChange = (field: keyof ProductCategoryFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSearch = () => {
        if (!formData.categoryCodeSearch.trim()) return;
        setIsSearching(true);
        setTimeout(() => {
            const found = mockProductCategories.find(c => c.category_code.toLowerCase() === formData.categoryCodeSearch.toLowerCase());
            if (found) {
                setFormData({
                    categoryCode: found.category_code,
                    categoryCodeSearch: found.category_code,
                    categoryName: found.category_name,
                    categoryNameEn: found.category_name_en || '',
                    isActive: found.is_active,
                });
            } else { alert('ไม่พบรหัสหมวดสินค้าที่ค้นหา'); }
            setIsSearching(false);
        }, 300);
    };

    const handleSave = () => {
        if (!formData.categoryCode.trim() || !formData.categoryName.trim()) { alert('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
        logger.log('Save category:', formData);
        alert(editId ? 'บันทึกการแก้ไขสำเร็จ' : 'เพิ่มหมวดสินค้าใหม่สำเร็จ');
        onClose();
    };

    const handleReset = () => { setFormData(initialProductCategoryFormData); };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 transition-opacity" onClick={onClose}></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl mx-auto transform transition-all">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3"><Tag className="text-white" size={24} /><span className="text-white font-semibold">กำหนดรหัสหมวดสินค้า</span></div>
                            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X size={24} /></button>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={styles.label}>รหัสหมวดสินค้า</label><input type="text" value={formData.categoryCodeSearch} readOnly className={`${styles.input} bg-gray-100 dark:bg-gray-600`} /></div>
                            <div><label className={styles.label}>ชื่อหมวด</label><input type="text" value={formData.categoryName} readOnly className={`${styles.input} bg-gray-100 dark:bg-gray-600`} /></div>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={styles.label}>รหัสหมวดสินค้า</label>
                                <div className="flex gap-2">
                                    <input type="text" value={formData.categoryCodeSearch} onChange={(e) => handleInputChange('categoryCodeSearch', e.target.value)} className={styles.input} />
                                    <button onClick={handleSearch} disabled={isSearching} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"><Search size={18} /></button>
                                </div>
                            </div>
                            <div className="flex items-end pb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.isActive} onChange={(e) => handleInputChange('isActive', e.target.checked)} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">ใช้งานอยู่</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={styles.label}>ชื่อหมวด</label><input type="text" value={formData.categoryName} onChange={(e) => handleInputChange('categoryName', e.target.value)} className={styles.input} /></div>
                            <div><label className={styles.label}>ชื่อหมวด (EN)</label><input type="text" value={formData.categoryNameEn} onChange={(e) => handleInputChange('categoryNameEn', e.target.value)} className={styles.input} /></div>
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
