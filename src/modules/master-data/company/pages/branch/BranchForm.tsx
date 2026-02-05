/**
 * @file BranchForm.tsx
 * @description หน้าฟอร์มจัดการข้อมูลสาขา (Branch Master Data)
 * @route /master-data/branch
 * @purpose กำหนดรหัสสาขา และจัดการข้อมูลสาขา
 * @module company
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Search, Plus, Save, Trash2, X, Loader2 } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { logger } from '@/shared/utils/logger';
import { mockBranches } from '@/modules/master-data/mocks/masterDataMocks';
import type { BranchFormData } from '@/modules/master-data/types/master-data-types';
import { initialBranchFormData } from '@/modules/master-data/types/master-data-types';

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function BranchForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('id');
    
    // Form state
    const [formData, setFormData] = useState<BranchFormData>(initialBranchFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Load data if editing
    useEffect(() => {
        if (editId) {
            const existing = mockBranches.find(b => b.branch_id === editId);
            if (existing) {
                setFormData({
                    branchCode: existing.branch_code,
                    branchCodeSearch: existing.branch_code,
                    branchName: existing.branch_name,
                    isActive: existing.is_active,
                });
            }
        }
    }, [editId]);

    // Handle input change
    const handleInputChange = (field: keyof BranchFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Handle form actions
    const handleNew = () => {
        setFormData(initialBranchFormData);
        setSaveError(null);
        navigate('/master-data/branch');
    };

    const handleSave = async () => {
        if (!formData.branchCode.trim() || !formData.branchName.trim()) {
            setSaveError('กรุณากรอกรหัสและชื่อสาขา');
            return;
        }

        setIsSaving(true);
        setSaveError(null);

        try {
            // Mock save
            await new Promise(resolve => setTimeout(resolve, 500));
            logger.log('Save branch:', formData);
            navigate('/master-data');
        } catch {
            setSaveError('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        if (confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) {
            logger.log('Delete branch:', editId);
            navigate('/master-data');
        }
    };

    const handleFind = () => {
        if (!formData.branchCodeSearch.trim()) return;
        const found = mockBranches.find(b => b.branch_code.toLowerCase() === formData.branchCodeSearch.toLowerCase());
        if (found) {
            setFormData({
                branchCode: found.branch_code,
                branchCodeSearch: found.branch_code,
                branchName: found.branch_name,
                isActive: found.is_active,
            });
            navigate(`/master-data/branch?id=${found.branch_id}`);
        } else {
            alert('ไม่พบรหัสสาขาที่ค้นหา');
        }
    };

    // ====================================================================================
    // RENDER
    // ====================================================================================

    return (
        <div className={styles.pageContainer}>
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg p-4 flex items-center gap-3 shadow-md">
                <Building2 size={24} className="text-white" />
                <h1 className="text-lg font-semibold text-white">กำหนดรหัสสาขา (Branch Master)</h1>
            </div>

            {/* Main Form Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Quick Search Row */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">รหัสสาขา</label>
                        <input
                            type="text"
                            value={formData.branchCode}
                            readOnly
                            className={`${styles.inputFlex} bg-gray-100 dark:bg-gray-600`}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">ชื่อสาขา</label>
                        <input
                            type="text"
                            value={formData.branchName}
                            readOnly
                            className={`${styles.inputFlex} bg-gray-100 dark:bg-gray-600`}
                        />
                    </div>
                </div>

                {/* Main Form Content */}
                <div className="p-4 sm:p-6 space-y-6">
                    {/* Branch Code Search */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">รหัสสาขา</label>
                            <div className="flex gap-2 min-w-0 flex-1">
                                <input
                                    type="text"
                                    value={formData.branchCodeSearch}
                                    onChange={(e) => handleInputChange('branchCodeSearch', e.target.value)}
                                    className={styles.inputFlex}
                                />
                                <button
                                    onClick={handleFind}
                                    className="px-3 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors shrink-0"
                                >
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Active Status */}
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ใช้งานอยู่</span>
                            </label>
                        </div>
                    </div>

                    {/* Branch Name */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:w-32 shrink-0">ชื่อสาขา</label>
                            <input
                                type="text"
                                value={formData.branchName}
                                onChange={(e) => handleInputChange('branchName', e.target.value)}
                                className={styles.inputFlex}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <button
                            onClick={handleNew}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-green-500 hover:text-white hover:border-green-500 transition-all"
                        >
                            <Plus size={16} />
                            New
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {isSaving ? 'กำลังบันทึก...' : 'Save'}
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                        <button
                            onClick={handleFind}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all"
                        >
                            <Search size={16} />
                            Find
                        </button>
                        {saveError && <span className="text-red-500 text-sm ml-2">{saveError}</span>}
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/master-data')}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                    >
                        <X size={16} />
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
