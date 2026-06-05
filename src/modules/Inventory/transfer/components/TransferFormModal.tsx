/**
 * @file TransferFormModal.tsx
 * @description หน้าต่างฟอร์มสร้าง/แก้ไข/ดูรายละเอียดใบขอโอนย้ายสินค้า (Transfer Requisition Form Modal)
 */

import React, { useState } from 'react';
import { FormProvider, type SubmitHandler } from 'react-hook-form';
import { ClipboardList, Save, Loader2 } from 'lucide-react';
import { WindowFormLayout } from '@ui';
import { ConfirmationModal } from '@system/ConfirmationModal';
import { TransferFormHeader } from './TransferFormHeader';
import { TransferFormLines } from './TransferFormLines';
import { useTransferForm } from '../hooks/useTransferForm';
import type { TransferHeaderFormData, TransferLineFormData } from '../schemas/transfer.schemas';
import { ProductSearchModal, type Product } from '@Inventory/shared/components/ProductSearchModal';
import { WarehouseSearchModal } from '@Inventory/shared/components/WarehouseSearchModal';
import { LocationSearchModal } from '@Inventory/shared/components/LocationSearchModal';
import { LotSearchModal } from '@Inventory/shared/components/LotSearchModal';
import type { WarehouseListItem } from '@master-data/inventory/types/warehouse-types';
import type { Location, LotNo } from '@master-data/inventory/types/inventory-master.types';
import { LocationService } from '@master-data/inventory/services/inventory-master.service';

interface TransferFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
    readOnly?: boolean;
}

const cardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden';

export const TransferFormModal: React.FC<TransferFormModalProps> = ({
    isOpen,
    onClose,
    editId,
    onSuccess,
    readOnly = false,
}) => {
    const {
        formMethods,
        onSubmit,
        handleFormError,
        isSaving,
        isLoading,
        isEditMode,
        fields,
        addLine,
        removeLine,
        updateLine,
        branches,
        employees,
        uoms,
    } = useTransferForm({ isOpen, onClose, editId, onSuccess });

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<TransferHeaderFormData | null>(null);

    // 🔍 Search Modals state
    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
    const [isWarehouseSearchOpen, setIsWarehouseSearchOpen] = useState(false);
    const [warehouseSearchTarget, setWarehouseSearchTarget] = useState<'source' | 'dest' | null>(null);
    const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);
    const [locationSearchTarget, setLocationSearchTarget] = useState<'source' | 'dest' | null>(null);
    const [activeWarehouseId, setActiveWarehouseId] = useState<string | number | undefined>(undefined);
    const [isLotSearchOpen, setIsLotSearchOpen] = useState(false);
    const [activeItemId, setActiveItemId] = useState<string | number | undefined>(undefined);

    const handleOpenProductSearch = (index: number) => {
        setActiveLineIndex(index);
        setIsProductSearchOpen(true);
    };

    const handleSelectProduct = (product: Product) => {
        if (activeLineIndex !== null) {
            let targetUomId = String(product.uom_id || product.base_uom_id || product.purchasing_unit_id || '');
            
            if (!targetUomId || targetUomId === '0') {
                const foundUom = uoms.find(u => 
                    (u.uom_name && (u.uom_name === product.uom_name))
                );
                if (foundUom) {
                    targetUomId = String(foundUom.uom_id || foundUom.id);
                }
            }

            updateLine(activeLineIndex, null, {
                ...fields[activeLineIndex],
                item_id: String(product.item_id || product.id || ''),
                item_code: product.item_code || '',
                item_name: product.item_name || '',
                uom_id: targetUomId,
                qty_ic: '',
            } as TransferLineFormData);
        }
        setIsProductSearchOpen(false);
    };

    const handleOpenSourceWarehouseSearch = (index: number) => {
        setActiveLineIndex(index);
        setWarehouseSearchTarget('source');
        setIsWarehouseSearchOpen(true);
    };

    const handleOpenDestWarehouseSearch = (index: number) => {
        setActiveLineIndex(index);
        setWarehouseSearchTarget('dest');
        setIsWarehouseSearchOpen(true);
    };

    const handleSelectWarehouse = async (warehouse: WarehouseListItem) => {
        if (activeLineIndex !== null && warehouseSearchTarget) {
            let locId = '';
            let locName = '';
            try {
                const res = await LocationService.getAll({ 
                    warehouse_id: warehouse.warehouse_id, 
                    limit: 1 
                });
                const firstLoc = res?.items?.[0];
                if (firstLoc) {
                    locId = String(firstLoc.location_id);
                    locName = firstLoc.name_th || firstLoc.code || '';
                }
            } catch (err) {
                console.error('Failed to fetch first location:', err);
            }

            if (warehouseSearchTarget === 'source') {
                updateLine(activeLineIndex, null, {
                    ...fields[activeLineIndex],
                    income_inve_id: String(warehouse.warehouse_id),
                    income_inve_name: warehouse.warehouse_name,
                    income_loca_id: locId,
                    income_loca_name: locName,
                } as TransferLineFormData);
            } else {
                updateLine(activeLineIndex, null, {
                    ...fields[activeLineIndex],
                    out_inve_id: String(warehouse.warehouse_id),
                    out_inve_name: warehouse.warehouse_name,
                    out_loca_id: locId,
                    out_loca_name: locName,
                } as TransferLineFormData);
            }
        }
        setIsWarehouseSearchOpen(false);
        setWarehouseSearchTarget(null);
    };

    const handleOpenSourceLocationSearch = (index: number, warehouseId?: string | number) => {
        setActiveLineIndex(index);
        setLocationSearchTarget('source');
        setActiveWarehouseId(warehouseId);
        setIsLocationSearchOpen(true);
    };

    const handleOpenDestLocationSearch = (index: number, warehouseId?: string | number) => {
        setActiveLineIndex(index);
        setLocationSearchTarget('dest');
        setActiveWarehouseId(warehouseId);
        setIsLocationSearchOpen(true);
    };

    const handleSelectLocation = (location: Location) => {
        if (activeLineIndex !== null && locationSearchTarget) {
            if (locationSearchTarget === 'source') {
                updateLine(activeLineIndex, null, {
                    ...fields[activeLineIndex],
                    income_loca_id: String(location.location_id),
                    income_loca_name: location.name_th,
                } as TransferLineFormData);
            } else {
                updateLine(activeLineIndex, null, {
                    ...fields[activeLineIndex],
                    out_loca_id: String(location.location_id),
                    out_loca_name: location.name_th,
                } as TransferLineFormData);
            }
        }
        setIsLocationSearchOpen(false);
        setLocationSearchTarget(null);
    };

    const handleOpenLotSearch = (index: number, itemId?: string | number) => {
        setActiveLineIndex(index);
        setActiveItemId(itemId);
        setIsLotSearchOpen(true);
    };

    const handleSelectLot = (lot: LotNo) => {
        if (activeLineIndex !== null) {
            updateLine(activeLineIndex, null, {
                ...fields[activeLineIndex],
                lot_id: String(lot.lot_no_id),
                lot_no: lot.code,
            } as TransferLineFormData);
        }
        setIsLotSearchOpen(false);
    };

    const onFormSubmit: SubmitHandler<TransferHeaderFormData> = (data) => {
        setPendingData(data);
        setIsConfirmOpen(true);
    };

    const handleConfirmSave = async () => {
        if (!pendingData || isSaving) return;
        await onSubmit(pendingData);
    };

    const formTitle = readOnly
        ? 'รายละเอียดใบขอโอนย้ายสินค้า (VIEW Transfer Requisition)'
        : isEditMode
            ? 'แก้ไขใบขอโอนย้ายสินค้า (EDIT Transfer Requisition)'
            : 'สร้างใบขอโอนย้ายสินค้าใหม่ (CREATE Transfer Requisition)';

    const ModalFooter = (
        <div className="flex justify-between items-center w-full bg-slate-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
            <div />
            <div className="flex gap-2">
                <button 
                    type="button" 
                    onClick={onClose}
                    disabled={isSaving}
                    className="h-10 px-6 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                    {isEditMode ? 'ปิด' : 'ยกเลิก'}
                </button>
                {!readOnly && (
                    <button 
                        type="submit" 
                        form="transfer-form"
                        disabled={isSaving}
                        className="h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? 'กำลังบันทึก...' : (isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล')}
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <>
            <WindowFormLayout
                isOpen={isOpen}
                onClose={onClose}
                title={formTitle}
                headerColor={readOnly ? 'bg-slate-600' : 'bg-blue-600'}
                footer={ModalFooter}
                titleIcon={
                    <div className="bg-white/20 p-1.5 rounded shadow-sm text-white">
                        <ClipboardList size={16} strokeWidth={3} />
                    </div>
                }
            >
                <FormProvider {...formMethods}>
                    <style dangerouslySetInnerHTML={{ __html: `
                        @keyframes formFadeIn {
                            from { opacity: 0; transform: translateY(8px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        .animate-form-fade-in {
                            animation: formFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        }
                    `}} />
                    <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6 animate-form-fade-in">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="animate-spin text-blue-600" size={32} />
                            </div>
                        ) : (
                            <form id="transfer-form" onSubmit={formMethods.handleSubmit(onFormSubmit, handleFormError)} className="w-full space-y-6">
                                {/* 1. Header Section */}
                                <div className={cardClass}>
                                    <div className="p-6">
                                        <TransferFormHeader
                                            branchOptions={branches.map(b => {
                                                const item = b as unknown as Record<string, unknown>;
                                                return { 
                                                    id: String(b.branch_id || item.id || ''), 
                                                    name: b.branch_name || String(item.name || '') 
                                                };
                                            })}
                                            empOptions={employees.map(e => {
                                                const item = e as unknown as Record<string, unknown>;
                                                return { 
                                                    id: String(e.employee_id || item.id || ''), 
                                                    name: e.employee_fullname || String(item.name || '') 
                                                };
                                            })}
                                            readOnly={readOnly}
                                        />
                                    </div>
                                </div>

                                {/* 2. Line Items Section */}
                                <div className={cardClass}>
                                    <div className="p-6">
                                        <TransferFormLines
                                            fields={fields}
                                            addLine={addLine}
                                            removeLine={removeLine}
                                            updateLine={updateLine}
                                            readOnly={readOnly}
                                            uomOptions={uoms.map(u => {
                                                const item = u as unknown as Record<string, unknown>;
                                                const uId = String(u.uom_id ?? item.id ?? '');
                                                return { 
                                                    id: uId, 
                                                    name: u.uom_name || String(item.name || '') 
                                                };
                                            })}
                                            onSearchProduct={handleOpenProductSearch}
                                            onSearchSourceWarehouse={handleOpenSourceWarehouseSearch}
                                            onSearchSourceLocation={handleOpenSourceLocationSearch}
                                            onSearchDestWarehouse={handleOpenDestWarehouseSearch}
                                            onSearchDestLocation={handleOpenDestLocationSearch}
                                            onSearchLot={handleOpenLotSearch}
                                        />
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </FormProvider>

                <ConfirmationModal 
                    isOpen={isConfirmOpen}
                    onClose={() => !isSaving && setIsConfirmOpen(false)}
                    onConfirm={handleConfirmSave}
                    title="ยืนยันการบันทึกข้อมูล"
                    description="คุณต้องการบันทึกข้อมูลใบขอโอนย้ายนี้ใช่หรือไม่?"
                    confirmText="ยืนยันการบันทึก"
                    cancelText="ยกเลิก"
                    variant="info"
                    isLoading={isSaving}
                />

                <ProductSearchModal
                    isOpen={isProductSearchOpen}
                    onClose={() => setIsProductSearchOpen(false)}
                    onSelect={handleSelectProduct}
                />

                <WarehouseSearchModal
                    isOpen={isWarehouseSearchOpen}
                    onClose={() => setIsWarehouseSearchOpen(false)}
                    onSelect={handleSelectWarehouse}
                />

                <LocationSearchModal
                    isOpen={isLocationSearchOpen}
                    onClose={() => setIsLocationSearchOpen(false)}
                    onSelect={handleSelectLocation}
                    warehouseId={activeWarehouseId}
                />

                <LotSearchModal
                    isOpen={isLotSearchOpen}
                    onClose={() => setIsLotSearchOpen(false)}
                    onSelect={handleSelectLot}
                    itemId={activeItemId}
                    warehouseId={activeLineIndex !== null ? (fields[activeLineIndex]?.income_inve_id || undefined) : undefined}
                    locationId={activeLineIndex !== null ? (fields[activeLineIndex]?.income_loca_id || undefined) : undefined}
                    itemName={activeLineIndex !== null ? fields[activeLineIndex]?.item_name : undefined}
                    itemCode={activeLineIndex !== null ? fields[activeLineIndex]?.item_code : undefined}
                />
            </WindowFormLayout>
        </>
    );
};
