/**
 * @file BranchFormModal.tsx
 * @description Modal สำหรับสร้าง/แก้ไขข้อมูลสาขา
 */

import { useState, useEffect } from 'react';
import { X, Building2, Search, Save, RotateCcw } from 'lucide-react';
import { styles } from '../../../constants';
import { mockBranches } from '../../../__mocks__/masterDataMocks';
import type { BranchFormData } from '../../../types/master-data-types';
import { initialBranchFormData } from '../../../types/master-data-types';

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

export function BranchFormModal({ isOpen, onClose, editId }: Props) {
    const [formData, setFormData] = useState<BranchFormData>(initialBranchFormData);
    const [isSearching, setIsSearching] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            if (editId) {
                // Load existing data for edit
                const existing = mockBranches.find(b => b.branch_id === editId);
                if (existing) {
                    setFormData({
                        branchCode: existing.branch_code,
                        branchCodeSearch: existing.branch_code,
                        branchName: existing.branch_name,
                        isActive: existing.is_active,
                    });
                }
            } else {
                setFormData(initialBranchFormData);
            }
        }
    }, [isOpen, editId]);

    if (!isOpen) return null;

    // Handle input change
    const handleInputChange = (field: keyof BranchFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Handle search
    const handleSearch = () => {
        if (!formData.branchCodeSearch.trim()) return;
        
        setIsSearching(true);
        setTimeout(() => {
            const found = mockBranches.find(
                b => b.branch_code.toLowerCase() === formData.branchCodeSearch.toLowerCase()
            );
            if (found) {
                setFormData({
                    branchCode: found.branch_code,
                    branchCodeSearch: found.branch_code,
                    branchName: found.branch_name,
                    isActive: found.is_active,
                });
            } else {
                alert('ไม่พบรหัสสาขาที่ค้นหา');
            }
            setIsSearching(false);
        }, 300);
    };

    // Handle save
    const handleSave = () => {
        if (!formData.branchCode.trim() || !formData.branchName.trim()) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        
        // Mock save
        console.log('Save branch:', formData);
        alert(editId ? 'บันทึกการแก้ไขสำเร็จ' : 'เพิ่มสาขาใหม่สำเร็จ');
        onClose();
    };

    // Handle reset
    const handleReset = () => {
        setFormData(initialBranchFormData);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                {/* Backdrop */}
                <div 
                    className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 transition-opacity"
                    onClick={onClose}
                ></div>

                {/* Modal Panel */}
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl mx-auto transform transition-all">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Building2 className="text-white" size={24} />
                                <span className="text-white font-semibold">
                                    กำหนดรหัสสาขา
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={styles.label}>รหัสสาขา</label>
                                <input
                                    type="text"
                                    value={formData.branchCodeSearch}
                                    readOnly
                                    className={`${styles.input} bg-gray-100 dark:bg-gray-600`}
                                    placeholder="ไม่ข้า"
                                />
                            </div>
                            <div>
                                <label className={styles.label}>ชื่อสาขา</label>
                                <input
                                    type="text"
                                    value={formData.branchName}
                                    readOnly
                                    className={`${styles.input} bg-gray-100 dark:bg-gray-600`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Branch Code with Search */}
                            <div>
                                <label className={styles.label}>รหัสสาขา</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.branchCodeSearch}
                                        onChange={(e) => handleInputChange('branchCodeSearch', e.target.value)}
                                        className={styles.input}
                                        placeholder="ไม่ข้า"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        disabled={isSearching}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Search size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Is Active Checkbox */}
                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                                        ใช้งานอยู่หรือไม่
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Branch Name */}
                        <div>
                            <label className={styles.label}>ชื่อสาขา</label>
                            <input
                                type="text"
                                value={formData.branchName}
                                onChange={(e) => handleInputChange('branchName', e.target.value)}
                                className={styles.input}
                                placeholder="กรอกชื่อสาขา"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleReset}
                                className={`${styles.btnSecondary} flex items-center gap-2`}
                            >
                                <RotateCcw size={18} />
                                ล้างข้อมูล
                            </button>
                            <button
                                onClick={handleSave}
                                className={`${styles.btnPrimary} flex items-center gap-2`}
                            >
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
