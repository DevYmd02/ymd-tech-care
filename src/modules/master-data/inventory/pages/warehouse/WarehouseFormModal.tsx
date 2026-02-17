import { useState, useEffect } from 'react';
import { Warehouse, Search, Save, RotateCcw } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { logger } from '@/shared/utils/logger';
import { mockWarehouses, mockBranchDropdown } from '@/modules/master-data/mocks/masterDataMocks';
import type { WarehouseFormData } from '@/modules/master-data/types/master-data-types';
import { initialWarehouseFormData } from '@/modules/master-data/types/master-data-types';
import { DialogFormLayout } from '@ui';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

export function WarehouseFormModal({ isOpen, onClose, editId, onSuccess }: Props) {
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
        
        logger.log('Save warehouse:', formData);
        alert(editId ? 'บันทึกการแก้ไขสำเร็จ' : 'เพิ่มคลังสินค้าใหม่สำเร็จ');
        if (onSuccess) onSuccess();
        onClose();
    };

    const handleReset = () => {
        setFormData(initialWarehouseFormData);
    };

    const Footer = (
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
    );

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title="กำหนดรหัสคลังสินค้า"
            titleIcon={<Warehouse size={24} />}
            footer={Footer}
            isLoading={isSearching}
        >
            <div className="space-y-6">
                {/* Quick Search Header */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
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
                <div className="space-y-4">
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
            </div>
        </DialogFormLayout>
    );
}
