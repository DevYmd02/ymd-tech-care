/**
 * @file ItemMasterForm.tsx
 * @description หน้าฟอร์มจัดการข้อมูลสินค้าและบริการ (Item Master Data)
 * @route /master-data/item
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Search, Plus, Save, Trash2, X, Loader2 } from 'lucide-react';
import { styles } from '../../../constants';
import { mockItems, mockProductCategories, mockItemTypes, mockUnits } from '../../../__mocks__/masterDataMocks';
import type { ItemMasterFormData } from '../../../types/master-data-types';
import { initialItemMasterFormData } from '../../../types/master-data-types';

export default function ItemMasterForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('id');
    
    const [formData, setFormData] = useState<ItemMasterFormData>(initialItemMasterFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (editId) {
            const existing = mockItems.find(i => i.item_id === editId);
            if (existing) {
                setFormData({
                    itemCode: existing.item_code,
                    itemCodeSearch: existing.item_code,
                    itemName: existing.item_name,
                    barcode: '',
                    mainUnit: '',
                    productCategory: '',
                    itemType: '',
                    purchasingUnit: '',
                    salesUnit: '',
                    taxCode: '',
                    isActive: existing.is_active,
                });
            }
        }
    }, [editId]);

    const handleInputChange = (field: keyof ItemMasterFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNew = () => {
        setFormData(initialItemMasterFormData);
        setSaveError(null);
        navigate('/master-data/item');
    };

    const handleSave = async () => {
        if (!formData.itemCode.trim() || !formData.itemName.trim()) {
            setSaveError('กรุณากรอกรหัสและชื่อสินค้า');
            return;
        }
        setIsSaving(true);
        setSaveError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Save item:', formData);
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
        if (!formData.itemCodeSearch.trim()) return;
        const found = mockItems.find(i => i.item_code.toLowerCase() === formData.itemCodeSearch.toLowerCase());
        if (found) {
            setFormData({
                itemCode: found.item_code,
                itemCodeSearch: found.item_code,
                itemName: found.item_name,
                barcode: '',
                mainUnit: '',
                productCategory: '',
                itemType: '',
                purchasingUnit: '',
                salesUnit: '',
                taxCode: '',
                isActive: found.is_active,
            });
            navigate(`/master-data/item?id=${found.item_id}`);
        } else {
            alert('ไม่พบรหัสสินค้าที่ค้นหา');
        }
    };

    return (
        <div className={styles.pageContainer}>
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg p-4 flex items-center gap-3 shadow-md">
                <Package size={24} className="text-white" />
                <h1 className="text-lg font-semibold text-white">กำหนดรหัสสินค้าและบริการ (Item Master)</h1>
            </div>

            {/* Main Form Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Quick Search Row */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">โค้ดสินค้า</label>
                        <input type="text" value={formData.itemCode} readOnly className={`${styles.inputFlex} bg-gray-100 dark:bg-gray-600`} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">ชื่อสินค้า</label>
                        <input type="text" value={formData.itemName} readOnly className={`${styles.inputFlex} bg-gray-100 dark:bg-gray-600`} />
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-4 sm:p-6 space-y-6">
                    {/* Row 1: Item Code Search + Barcode */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">โค้ดสินค้า</label>
                            <div className="flex gap-2 min-w-0 flex-1">
                                <input type="text" value={formData.itemCodeSearch} onChange={(e) => handleInputChange('itemCodeSearch', e.target.value)} className={styles.inputFlex} placeholder="ไม่ซ้ำ" />
                                <button onClick={handleFind} className="px-3 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors shrink-0">
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">บาร์โค้ดสินค้า</label>
                            <input type="text" value={formData.barcode} onChange={(e) => handleInputChange('barcode', e.target.value)} className={styles.inputFlex} placeholder="EAN/UPC/Code128" />
                        </div>
                    </div>

                    {/* Row 2: Item Name + Main Unit */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">ชื่อสินค้า</label>
                            <input type="text" value={formData.itemName} onChange={(e) => handleInputChange('itemName', e.target.value)} className={styles.inputFlex} placeholder="varchar(255)" />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">หน่วยนับหลัก</label>
                            <div className="flex gap-2 min-w-0 flex-1">
                                <select value={formData.mainUnit} onChange={(e) => handleInputChange('mainUnit', e.target.value)} className={styles.inputFlex}>
                                    <option value="">-- เลือก --</option>
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

                    {/* Row 3: Product Category + Item Type */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">หมวดสินค้า</label>
                            <div className="flex gap-2 min-w-0 flex-1">
                                <select value={formData.productCategory} onChange={(e) => handleInputChange('productCategory', e.target.value)} className={styles.inputFlex}>
                                    <option value="">-- เลือกหมวดสินค้า --</option>
                                    {mockProductCategories.filter(c => c.is_active).map(c => (
                                        <option key={c.category_id} value={c.category_code}>{c.category_name}</option>
                                    ))}
                                </select>
                                <button className="px-3 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors shrink-0">
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">ประเภทสินค้า</label>
                            <select value={formData.itemType} onChange={(e) => handleInputChange('itemType', e.target.value)} className={styles.inputFlex}>
                                <option value="">-- เลือก --</option>
                                {mockItemTypes.filter(t => t.is_active).map(t => (
                                    <option key={t.item_type_id} value={t.item_type_code}>{t.item_type_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 4: Purchasing Unit + Sales Unit */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">หน่วยซื้อ</label>
                            <div className="flex gap-2 min-w-0 flex-1">
                                <select value={formData.purchasingUnit} onChange={(e) => handleInputChange('purchasingUnit', e.target.value)} className={styles.inputFlex}>
                                    <option value="">-- เลือก --</option>
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
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">หน่วยขาย</label>
                            <div className="flex gap-2 min-w-0 flex-1">
                                <select value={formData.salesUnit} onChange={(e) => handleInputChange('salesUnit', e.target.value)} className={styles.inputFlex}>
                                    <option value="">-- เลือก --</option>
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

                    {/* Row 5: Tax Code + isActive */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">รหัสภาษีเริ่มต้น</label>
                            <select value={formData.taxCode} onChange={(e) => handleInputChange('taxCode', e.target.value)} className={styles.inputFlex}>
                                <option value="">-- เลือก --</option>
                                <option value="VAT7">VAT 7%</option>
                                <option value="VAT0">VAT 0%</option>
                                <option value="EXEMPT">ยกเว้นภาษี</option>
                            </select>
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.isActive} onChange={(e) => handleInputChange('isActive', e.target.checked)} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ใช้งานอยู่</span>
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
