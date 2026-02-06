/**
 * @file UnitFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขหน่วยนับ
 */

import { useState, useEffect } from 'react';
import { X, Ruler, Search, Save, RotateCcw } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { logger } from '@/shared/utils/logger';
import { mockUnits } from '@/modules/master-data/mocks/masterDataMocks';
import type { UnitFormData } from '@/modules/master-data/types/master-data-types';
import { initialUnitFormData } from '@/modules/master-data/types/master-data-types';

interface Props { isOpen: boolean; onClose: () => void; editId?: string | null; }

export function UnitFormModal({ isOpen, onClose, editId }: Props) {
    const [formData, setFormData] = useState<UnitFormData>(initialUnitFormData);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editId) {
                const existing = mockUnits.find(u => u.unit_id === editId);
                if (existing) {
                    setFormData({
                        unitCode: existing.unit_code,
                        unitCodeSearch: existing.unit_code,
                        unitName: existing.unit_name,
                        unitNameEn: existing.unit_name_en || '',
                        isActive: existing.is_active,
                    });
                }
            } else {
                setFormData(initialUnitFormData);
            }
        }
    }, [isOpen, editId]);

    if (!isOpen) return null;

    const handleInputChange = (field: keyof UnitFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSearch = () => {
        if (!formData.unitCodeSearch.trim()) return;
        setIsSearching(true);
        setTimeout(() => {
            const found = mockUnits.find(u => u.unit_code.toLowerCase() === formData.unitCodeSearch.toLowerCase());
            if (found) {
                setFormData({
                    unitCode: found.unit_code,
                    unitCodeSearch: found.unit_code,
                    unitName: found.unit_name,
                    unitNameEn: found.unit_name_en || '',
                    isActive: found.is_active,
                });
            } else { alert('ไม่พบรหัสหน่วยนับที่ค้นหา'); }
            setIsSearching(false);
        }, 300);
    };

    const handleSave = () => {
        if (!formData.unitCode.trim() || !formData.unitName.trim()) { alert('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
        logger.log('Save unit:', formData);
        alert(editId ? 'บันทึกการแก้ไขสำเร็จ' : 'เพิ่มหน่วยนับใหม่สำเร็จ');
        onClose();
    };

    const handleReset = () => { setFormData(initialUnitFormData); };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 transition-opacity" onClick={onClose}></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl mx-auto transform transition-all">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3"><Ruler className="text-white" size={24} /><span className="text-white font-semibold">กำหนดรหัสหน่วยนับ (Unit of Measure)</span></div>
                            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X size={24} /></button>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={styles.label}>โค้ดหน่วย</label><input type="text" value={formData.unitCodeSearch} readOnly className={`${styles.input} bg-gray-100 dark:bg-gray-600`} /></div>
                            <div><label className={styles.label}>ชื่อหน่วย</label><input type="text" value={formData.unitName} readOnly className={`${styles.input} bg-gray-100 dark:bg-gray-600`} /></div>
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={styles.label}>โค้ดหน่วย</label>
                                <div className="flex gap-2">
                                    <input type="text" value={formData.unitCodeSearch} onChange={(e) => handleInputChange('unitCodeSearch', e.target.value)} className={styles.input} />
                                    <button onClick={handleSearch} disabled={isSearching} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"><Search size={18} /></button>
                                </div>
                            </div>
                            <div>
                                <label className={styles.label}>ชื่อหน่วย (EN)</label>
                                <input type="text" value={formData.unitNameEn} onChange={(e) => handleInputChange('unitNameEn', e.target.value)} className={styles.input} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={styles.label}>ชื่อหน่วย</label>
                                <input type="text" value={formData.unitName} onChange={(e) => handleInputChange('unitName', e.target.value)} className={styles.input} />
                            </div>
                            <div></div>
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
