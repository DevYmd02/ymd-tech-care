import { useState, useEffect } from 'react';
import { Tag, Search, Save, RotateCcw } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { logger } from '@/shared/utils/logger';
import { mockProductCategories } from '@/modules/master-data/mocks/masterDataMocks';
import type { ProductCategoryFormData } from '@/modules/master-data/types/master-data-types';
import { initialProductCategoryFormData } from '@/modules/master-data/types/master-data-types';
import { DialogFormLayout } from '@ui';

interface Props { 
    isOpen: boolean; 
    onClose: () => void; 
    editId?: string | null;
    onSuccess?: () => void;
}

export function ProductCategoryFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
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
        if (onSuccess) onSuccess();
        onClose();
    };

    const handleReset = () => { setFormData(initialProductCategoryFormData); };

    const Footer = (
        <div className="flex justify-end gap-3">
            <button onClick={handleReset} className={`${styles.btnSecondary} flex items-center gap-2`}><RotateCcw size={18} />ล้างข้อมูล</button>
            <button onClick={handleSave} className={`${styles.btnPrimary} flex items-center gap-2`}><Save size={18} />บันทึก</button>
        </div>
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="กำหนดรหัสหมวดสินค้า"
            titleIcon={<Tag size={24} />}
            footer={Footer}
            isLoading={isSearching}
        >
            <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className={styles.label}>รหัสหมวดสินค้า</label><input type="text" value={formData.categoryCodeSearch} readOnly className={`${styles.input} bg-gray-100 dark:bg-gray-600`} /></div>
                        <div><label className={styles.label}>ชื่อหมวด</label><input type="text" value={formData.categoryName} readOnly className={`${styles.input} bg-gray-100 dark:bg-gray-600`} /></div>
                    </div>
                </div>

                <div className="space-y-4">
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
            </div>
        </DialogFormLayout>
    );
}
