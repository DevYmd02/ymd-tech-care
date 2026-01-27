/**
 * @file UnitForm.tsx
 * @description หน้าฟอร์มจัดการข้อมูลหน่วยนับ (Unit of Measure Master Data)
 * @route /master-data/unit
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Ruler, Search, Plus, Save, Trash2, X, Loader2 } from 'lucide-react';
import { styles } from '@/constants';
import { logger } from '@utils/logger';
import { mockUnits } from '@/__mocks__/masterDataMocks';
import type { UnitFormData } from '@project-types/master-data-types';
import { initialUnitFormData } from '@project-types/master-data-types';

export default function UnitForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('id');
    
    const [formData, setFormData] = useState<UnitFormData>(initialUnitFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
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
        }
    }, [editId]);

    const handleInputChange = (field: keyof UnitFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNew = () => {
        setFormData(initialUnitFormData);
        setSaveError(null);
        navigate('/master-data/unit');
    };

    const handleSave = async () => {
        if (!formData.unitCode.trim() || !formData.unitName.trim()) {
            setSaveError('กรุณากรอกรหัสและชื่อหน่วยนับ');
            return;
        }
        setIsSaving(true);
        setSaveError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            logger.log('Save unit:', formData);
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

    const handleFind = () => {
        if (!formData.unitCodeSearch.trim()) return;
        const found = mockUnits.find(u => u.unit_code.toLowerCase() === formData.unitCodeSearch.toLowerCase());
        if (found) {
            setFormData({
                unitCode: found.unit_code,
                unitCodeSearch: found.unit_code,
                unitName: found.unit_name,
                unitNameEn: found.unit_name_en || '',
                isActive: found.is_active,
            });
            navigate(`/master-data/unit?id=${found.unit_id}`);
        } else {
            alert('ไม่พบรหัสหน่วยนับที่ค้นหา');
        }
    };

    return (
        <div className={styles.pageContainer}>
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg p-4 flex items-center gap-3 shadow-md">
                <Ruler size={24} className="text-white" />
                <h1 className="text-lg font-semibold text-white">กำหนดรหัสหน่วยนับ (Unit of Measure)</h1>
            </div>

            {/* Main Form Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Quick Search Row */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">รหัสหน่วยนับ</label>
                        <input type="text" value={formData.unitCode} readOnly className={`${styles.inputFlex} bg-gray-100 dark:bg-gray-600`} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">ชื่อหน่วยนับ</label>
                        <input type="text" value={formData.unitName} readOnly className={`${styles.inputFlex} bg-gray-100 dark:bg-gray-600`} />
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">รหัสหน่วยนับ</label>
                            <div className="flex gap-2 min-w-0 flex-1">
                                <input type="text" value={formData.unitCodeSearch} onChange={(e) => handleInputChange('unitCodeSearch', e.target.value)} className={styles.inputFlex} placeholder="ชิ้น/แท่ง/กิโลกรัม" />
                                <button onClick={handleFind} className="px-3 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors shrink-0">
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.isActive} onChange={(e) => handleInputChange('isActive', e.target.checked)} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ใช้งานอยู่</span>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">ชื่อหน่วยนับ</label>
                            <input type="text" value={formData.unitName} onChange={(e) => handleInputChange('unitName', e.target.value)} className={styles.inputFlex} />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">ชื่อหน่วยนับ (EN)</label>
                            <input type="text" value={formData.unitNameEn} onChange={(e) => handleInputChange('unitNameEn', e.target.value)} className={styles.inputFlex} />
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
                        <button onClick={handleFind} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all">
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
