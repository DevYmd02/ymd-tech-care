import { useEffect, useState } from 'react';
import { Package, ScanBarcode, RefreshCcw } from 'lucide-react';
import { DialogFormLayout, TabPanel } from '@ui';
import { useItemForm } from './hooks/useItemForm';
import { ItemGeneralInfo } from './components/ItemGeneralInfo';
import { ItemAttributes } from './components/ItemAttributes';
import { ItemStockDetails } from './components/ItemStockDetails';
import { ItemFinancials } from './components/ItemFinancials';
import { ItemStatusControl } from './components/ItemStatusControl';
import { useMasterData } from './hooks/useMasterData';
import { ItemBarcodeFieldArray } from './components/ItemBarcodeFieldArray';
import { ItemUOMConversionFieldArray } from './components/ItemUOMConversionFieldArray';

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
    const [activeTab, setActiveTab] = useState('general');

    const {
        formData,
        isSaving,
        errors,
        handleInputChange,
        handleSave,
        clearForm,
        register,
        categories,
        control,
        setValue,
        getValues,
        onClose: handleCloseAttempt
    } = useItemForm(editId ?? null, isOpen, onClose, onSuccess);

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
        } else {
            setActiveTab('general');
        }
    }, [isOpen, clearForm]);

    const title = editId 
        ? `แก้ไขสินค้า: ${formData.item_code || '...'}` 
        : 'กำหนดรหัสสินค้าและบริการ (Item Master)';

    const tabs = [
        { id: 'general', label: 'ข้อมูลสินค้า', icon: <Package className="w-4 h-4" /> },
        ...(editId ? [
            { id: 'uom-conversion', label: 'กำหนดแปลงหน่วย', icon: <RefreshCcw className="w-4 h-4" /> },
            { id: 'barcode', label: 'กำหนดบาร์โค้ดสินค้า', icon: <ScanBarcode className="w-4 h-4" /> }
        ] : [])
    ];

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={handleCloseAttempt}
            title={title}
            titleIcon={<Package className="w-5 h-5" />}
            width="max-w-7xl"
            isLoading={isSaving}
            footer={
                <div className="flex items-center justify-end gap-2 w-full">
                    <button 
                        onClick={handleCloseAttempt} 
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
            <TabPanel 
                tabs={tabs} 
                activeTab={activeTab} 
                onTabChange={setActiveTab} 
                variant="underline"
            >
                {activeTab === 'general' && (
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
                                    editId={editId}
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
                )}

                {activeTab === 'uom-conversion' && (
                    <div className="space-y-4">
                        <ItemUOMConversionFieldArray 
                            control={control}
                            register={register}
                            getValues={getValues}
                            setValue={setValue}
                            errors={errors}
                            units={uom}
                            editId={editId}
                        />
                    </div>
                )}

                {activeTab === 'barcode' && (
                    <div className="space-y-4">
                        {/* 3. Barcode Management Section */}
                        <ItemBarcodeFieldArray 
                            control={control}
                            register={register}
                            setValue={setValue}
                            getValues={getValues}
                            errors={errors}
                            units={uom}
                            editId={editId}
                        />
                    </div>
                )}
            </TabPanel>
        </DialogFormLayout>
    );
}
