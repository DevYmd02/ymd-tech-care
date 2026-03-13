import { useEffect } from 'react';
import { Package } from 'lucide-react';
import { DialogFormLayout } from '@ui';
import { useItemForm } from './hooks/useItemForm';
import { ItemGeneralInfo } from './components/ItemGeneralInfo';
import { ItemAttributes } from './components/ItemAttributes';
import { ItemStockDetails } from './components/ItemStockDetails';
import { ItemFinancials } from './components/ItemFinancials';
import { ItemStatusControl } from './components/ItemStatusControl';
import { useMasterData } from './hooks/useMasterData';

interface ItemMasterFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: number | null;
    onSuccess?: () => void;
}

/**
 * @component ItemMasterFormModal
 * @description Standardized Modal for Item Master Management
 * Uses DialogFormLayout with max-w-7xl for the complex 3-column layout
 */
export function ItemMasterFormModal({ isOpen, onClose, editId, onSuccess }: ItemMasterFormModalProps) {
    const {
        formData,
        isSaving,
        errors,
        handleInputChange,
        handleSave,
        clearForm,
        categories
    } = useItemForm(editId ?? null, () => {
        if (onSuccess) onSuccess();
        onClose();
    });

    // Fetch Master Data
    const { 
        itemTypes, 
        itemGroups, 
        itemBrands, 
        itemPatterns, 
        itemDesigns,
        itemGrades,
        itemClasses,
        itemSizes,
        itemColors,
        uom,
        taxCodes
    } = useMasterData(isOpen);

    // Handle strict form reset on close to prevent data bleed
    // This implements the "Vendor Rule" for API-Readiness
    useEffect(() => {
        if (!isOpen) {
            clearForm();
        }
    }, [isOpen, clearForm]);

    const title = editId 
        ? `แก้ไขสินค้า: ${formData.item_code || '...'}` 
        : 'กำหนดรหัสสินค้าและบริการ (Item Master)';

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            titleIcon={<Package className="w-5 h-5" />}
            width="max-w-7xl"
            isLoading={isSaving}
            footer={
                <div className="flex items-center justify-end gap-2 w-full">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving} 
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {isSaving ? 'กำลังบันทึก...' : (editId ? 'บันทึกการแก้ไข' : 'บันทึก')}
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                {/* 1. Header Section - Primary Identifiers */}
                <ItemGeneralInfo 
                    formData={formData} 
                    onChange={handleInputChange} 
                    editMode={!!editId}
                    errors={errors}
                />

                {/* 2. Details Section - 3 Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Column 1: Attributes */}
                    <div className="lg:col-span-4">
                        <ItemAttributes 
                            formData={formData} 
                            onChange={handleInputChange} 
                            categories={categories}
                            itemTypes={itemTypes}
                            itemGroups={itemGroups}
                            itemBrands={itemBrands}
                            itemPatterns={itemPatterns}
                            itemDesigns={itemDesigns}
                            itemGrades={itemGrades}
                            itemClasses={itemClasses}
                            itemSizes={itemSizes}
                            itemColors={itemColors}
                        />
                    </div>

                    {/* Column 2: Stock & Cost */}
                    <div className="lg:col-span-4">
                        <ItemStockDetails 
                            formData={formData} 
                            onChange={handleInputChange}
                            errors={errors}
                            uom={uom}
                        />
                    </div>

                    {/* Column 3: Financial & Status */}
                    <div className="lg:col-span-4 space-y-4">
                        <ItemFinancials 
                            formData={formData} 
                            onChange={handleInputChange} 
                            taxCodes={taxCodes}
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
