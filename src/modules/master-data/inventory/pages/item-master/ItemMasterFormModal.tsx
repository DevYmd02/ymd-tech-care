import { Package } from 'lucide-react';
import { DialogFormLayout } from '@/shared/components/layout/DialogFormLayout';
import { useItemForm } from './hooks/useItemForm';
import { ItemGeneralInfo } from './components/ItemGeneralInfo';
import { ItemAttributes } from './components/ItemAttributes';
import { ItemStockDetails } from './components/ItemStockDetails';
import { ItemFinancials } from './components/ItemFinancials';
import { ItemStatusControl } from './components/ItemStatusControl';

interface ItemMasterFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
}

/**
 * @component ItemMasterFormModal
 * @description Standardized Modal for Item Master Management
 * Uses DialogFormLayout with max-w-7xl for the complex 3-column layout
 */
export function ItemMasterFormModal({ isOpen, onClose, editId, onSuccess }: ItemMasterFormModalProps) {
    // Wrapper to handle success callback from hook
    const handleSuccessCallback = () => {
        if (onSuccess) onSuccess();
        onClose();
    };

    const {
        formData,
        isSaving,
        saveError,
        errors,
        handleInputChange,
        handleSave,
        handleFind
    } = useItemForm(editId ?? null, handleSuccessCallback);

    // No need for separate onSave wrapper anymore since hook handles it


    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={editId ? `แก้ไขสินค้า: ${formData.item_code}` : 'กำหนดรหัสสินค้าและบริการ (Item Master)'}
            titleIcon={<Package className="w-5 h-5" />}
            width="max-w-7xl"
            isLoading={isSaving}

            footer={
                <div className="flex items-center justify-between w-full">
                    <div className="flex-1 mr-4">
                        {saveError && (
                            <div className="text-red-500 text-sm font-medium animate-pulse">
                                Error: {saveError}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium">
                            ยกเลิก
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                            {isSaving ? 'กำลังบันทึก...' : (editId ? 'บันทึกการแก้ไข' : 'บันทึก')}
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                {/* 1. Header Section - Primary Identifiers */}
                <ItemGeneralInfo 
                    formData={formData} 
                    onChange={handleInputChange} 
                    onFind={handleFind} 
                    editMode={!!editId}
                    errors={errors}
                />

                {/* 2. Details Section - 3 Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Column 1: Attributes */}
                    <ItemAttributes 
                        formData={formData} 
                        onChange={handleInputChange} 
                    />

                    {/* Column 2: Stock & Cost */}
                    <ItemStockDetails 
                        formData={formData} 
                        onChange={handleInputChange}
                        errors={errors}
                    />

                    {/* Column 3: Financial & Status */}
                    <div className="lg:col-span-4 space-y-4">
                        <ItemFinancials 
                            formData={formData} 
                            onChange={handleInputChange} 
                        />
                        
                        <ItemStatusControl 
                            formData={formData} 
                            onChange={handleInputChange} 
                        />
                    </div>
                </div>
            </div>
        </DialogFormLayout>
    );
}
