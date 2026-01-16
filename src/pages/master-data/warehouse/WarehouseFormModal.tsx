/**
 * @file WarehouseFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลคลังสินค้า
 */

import { useState, useEffect } from 'react';
import { X, Warehouse, Search, Save, RotateCcw } from 'lucide-react';
import { styles } from '../../../constants';
import { mockWarehouses, mockBranchDropdown } from '../../../__mocks__/masterDataMocks';
import type { WarehouseFormData } from '../../../types/master-data-types';
import { initialWarehouseFormData } from '../../../types/master-data-types';

// ====================================================================================
// COMPONENT PROPS
// ====================================================================================

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
}

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export function WarehouseFormModal({ isOpen, onClose, editId }: Props) {
    const [formData, setFormData] = useState<WarehouseFormData>(initialWarehouseFormData);
    const [isSearching, setIsSearching] = useState(false);
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
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
            } else {
                setFormData(initialWarehouseFormData);
            }
        }
    }, [isOpen, editId]);

    if (!isOpen) return null;

    const handleInputChange = (field: keyof WarehouseFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSearch = () => {
        if (!formData.warehouseCodeSearch.trim()) return;
        
        setIsSearching(true);
        setTimeout(() => {
            const found = mockWarehouses.find(
                w => w.warehouse_code.toLowerCase() === formData.warehouseCodeSearch.toLowerCase()
            );
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
            } else {
                alert('ไม่พบรหัสคลังสินค้าที่ค้นหา');
            }
            setIsSearching(false);
        }, 300);
    };

    const handleBranchSearch = () => {
        setShowBranchDropdown(!showBranchDropdown);
    };

    const handleSelectBranch = (branchId: string, branchName: string) => {
        setFormData(prev => ({
            ...prev,
            branchId,
            branchName,
        }));
        setShowBranchDropdown(false);
    };

    const handleSave = () => {
        if (!formData.warehouseCode.trim() || !formData.warehouseName.trim()) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        
        console.log('Save warehouse:', formData);
        alert(editId ? 'บันทึกการแก้ไขสำเร็จ' : 'เพิ่มคลังสินค้าใหม่สำเร็จ');
        onClose();
    };

    const handleReset = () => {
        setFormData(initialWarehouseFormData);
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
                                <Warehouse className="text-white" size={24} />
                                <span className="text-white font-semibold">กำหนดรหัสคลังสินค้า</span>
                            </div>
                            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={styles.label}>รหัสคลังสินค้า</label>
                                <input type="text" value={formData.warehouseCodeSearch} readOnly className={`${styles.input} bg-gray-100 dark:bg-gray-600`} />
                            </div>
                            <div>
                                <label className={styles.label}>ชื่อคลังสินค้า</label>
                                <input type="text" value={formData.warehouseName} readOnly className={`${styles.input} bg-gray-100 dark:bg-gray-600`} />
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Warehouse Code with Search */}
                            <div>
                                <label className={styles.label}>รหัสคลังสินค้า</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.warehouseCodeSearch}
                                        onChange={(e) => handleInputChange('warehouseCodeSearch', e.target.value)}
                                        className={styles.input}
                                    />
                                    <button
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                    >
                                        <Search size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Is Active */}
                            <div className="flex items-end pb-2">
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

                        {/* Warehouse Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={styles.label}>ชื่อคลังสินค้า</label>
                                <input
                                    type="text"
                                    value={formData.warehouseName}
                                    onChange={(e) => handleInputChange('warehouseName', e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                            
                            {/* Branch Reference */}
                            <div className="relative">
                                <label className={styles.label}>สาขา</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.branchName}
                                        readOnly
                                        className={`${styles.input} bg-gray-50 dark:bg-gray-700`}
                                    />
                                    <button
                                        onClick={handleBranchSearch}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                    >
                                        <Search size={18} />
                                    </button>
                                </div>
                                
                                {/* Branch Dropdown */}
                                {showBranchDropdown && (
                                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {mockBranchDropdown.map(branch => (
                                            <button
                                                key={branch.branch_id}
                                                onClick={() => handleSelectBranch(branch.branch_id, branch.branch_name)}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                                            >
                                                <span className="font-medium text-blue-600">{branch.branch_code}</span>
                                                <span className="text-gray-600 dark:text-gray-400 ml-2">{branch.branch_name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className={styles.label}>ที่อยู่</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                className={`${styles.input} min-h-[80px]`}
                            />
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
