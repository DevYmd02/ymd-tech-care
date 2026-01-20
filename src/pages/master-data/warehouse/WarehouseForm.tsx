/**
 * @file WarehouseForm.tsx
 * @description หน้าฟอร์มจัดการข้อมูลคลังสินค้า (Warehouse Master Data)
 * @route /master-data/warehouse
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Warehouse, Search, Plus, Save, Trash2, X, Loader2 } from 'lucide-react';
import { styles } from '../../../constants';
import { logger } from '../../../utils/logger';
import { mockWarehouses, mockBranchDropdown } from '../../../__mocks__/masterDataMocks';
import type { WarehouseFormData } from '../../../types/master-data-types';
import { initialWarehouseFormData } from '../../../types/master-data-types';

export default function WarehouseForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('id');
    
    const [formData, setFormData] = useState<WarehouseFormData>(initialWarehouseFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (editId) {
            const existing = mockWarehouses.find(w => w.warehouse_id === editId);
            if (existing) {
                setFormData({
                    warehouseCode: existing.warehouse_code,
                    warehouseCodeSearch: existing.warehouse_code,
                    warehouseName: existing.warehouse_name,
                    branchId: '',
                    branchName: existing.branch_name || '',
                    address: '',
                    isActive: existing.is_active,
                });
            }
        }
    }, [editId]);

    const handleInputChange = (field: keyof WarehouseFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNew = () => {
        setFormData(initialWarehouseFormData);
        setSaveError(null);
        navigate('/master-data/warehouse');
    };

    const handleSave = async () => {
        if (!formData.warehouseCode.trim() || !formData.warehouseName.trim()) {
            setSaveError('กรุณากรอกรหัสและชื่อคลังสินค้า');
            return;
        }
        setIsSaving(true);
        setSaveError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            logger.log('Save warehouse:', formData);
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
        if (!formData.warehouseCodeSearch.trim()) return;
        const found = mockWarehouses.find(w => w.warehouse_code.toLowerCase() === formData.warehouseCodeSearch.toLowerCase());
        if (found) {
            setFormData({
                warehouseCode: found.warehouse_code,
                warehouseCodeSearch: found.warehouse_code,
                warehouseName: found.warehouse_name,
                branchId: '',
                branchName: found.branch_name || '',
                address: '',
                isActive: found.is_active,
            });
            navigate(`/master-data/warehouse?id=${found.warehouse_id}`);
        } else {
            alert('ไม่พบรหัสคลังสินค้าที่ค้นหา');
        }
    };

    return (
        <div className={styles.pageContainer}>
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg p-4 flex items-center gap-3 shadow-md">
                <Warehouse size={24} className="text-white" />
                <h1 className="text-lg font-semibold text-white">กำหนดรหัสคลังสินค้า (Warehouse Master)</h1>
            </div>

            {/* Main Form Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Quick Search Row */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">รหัสคลังสินค้า</label>
                        <input type="text" value={formData.warehouseCode} readOnly className={`${styles.inputFlex} bg-gray-100 dark:bg-gray-600`} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">ชื่อคลังสินค้า</label>
                        <input type="text" value={formData.warehouseName} readOnly className={`${styles.inputFlex} bg-gray-100 dark:bg-gray-600`} />
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">รหัสคลังสินค้า </label>
                            <div className="flex gap-2 min-w-0 flex-1">
                                <input type="text" value={formData.warehouseCodeSearch} onChange={(e) => handleInputChange('warehouseCodeSearch', e.target.value)} className={styles.inputFlex} />
                                <button onClick={handleFind} className="px-3 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors shrink-0">
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.isActive} onChange={(e) => handleInputChange('isActive', e.target.checked)} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">สถานะใช้งาน</span>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">ชื่อคลังสินค้า</label>
                            <input type="text" value={formData.warehouseName} onChange={(e) => handleInputChange('warehouseName', e.target.value)} className={styles.inputFlex} />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">สาขา</label>
                            <select value={formData.branchId} onChange={(e) => handleInputChange('branchId', e.target.value)} className={styles.inputSelect}>
                                <option value="">-- เลือกสาขา --</option>
                                {mockBranchDropdown.map(b => (
                                    <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0 pt-2">ที่อยู่</label>
                            <textarea value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} className={`${styles.inputFlex} min-h-[80px]`} placeholder="ที่อยู่คลังสินค้า (ไม่บังคับ)" />
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
