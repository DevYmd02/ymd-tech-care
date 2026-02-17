import { useState, useEffect } from 'react';
import { Layers, Search, Save, RotateCcw } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { logger } from '@/shared/utils/logger';
import { mockItemTypes } from '@/modules/master-data/mocks/masterDataMocks';
import type { ItemTypeFormData } from '@/modules/master-data/types/master-data-types';
import { initialItemTypeFormData } from '@/modules/master-data/types/master-data-types';
import { DialogFormLayout } from '@ui';

interface Props { 
    isOpen: boolean; 
    onClose: () => void; 
    editId?: string | null;
    onSuccess?: () => void;
}

export function ItemTypeFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
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
        logger.log('Save item type:', formData);
        alert(editId ? 'บันทึกการแก้ไขสำเร็จ' : 'เพิ่มประเภทสินค้าใหม่สำเร็จ');
        if (onSuccess) onSuccess();
        onClose();
    };

    const handleReset = () => { setFormData(initialItemTypeFormData); };

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
            title="กำหนดรหัสประเภทสินค้า (Item Type)"
            titleIcon={<Layers size={24} />}
            footer={Footer}
            isLoading={isSearching}
        >
            <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className={styles.label}>รหัสประเภท</label><input type="text" value={formData.itemTypeCodeSearch} readOnly className={`${styles.input} bg-gray-100 dark:bg-gray-600`} /></div>
                        <div><label className={styles.label}>ชื่อประเภท</label><input type="text" value={formData.itemTypeName} readOnly className={`${styles.input} bg-gray-100 dark:bg-gray-600`} /></div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={styles.label}>รหัสประเภท</label>
                            <div className="flex gap-2">
                                <input type="text" value={formData.itemTypeCodeSearch} onChange={(e) => handleInputChange('itemTypeCodeSearch', e.target.value)} className={styles.input} />
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
                        <div><label className={styles.label}>ชื่อประเภท</label><input type="text" value={formData.itemTypeName} onChange={(e) => handleInputChange('itemTypeName', e.target.value)} className={styles.input} /></div>
                        <div><label className={styles.label}>ชื่อประเภท (EN)</label><input type="text" value={formData.itemTypeNameEn} onChange={(e) => handleInputChange('itemTypeNameEn', e.target.value)} className={styles.input} /></div>
                    </div>
                </div>
            </div>
        </DialogFormLayout>
    );
}
