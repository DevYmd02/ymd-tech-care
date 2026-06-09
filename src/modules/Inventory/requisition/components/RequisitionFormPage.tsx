/**
 * @file RequisitionFormPage.tsx
 * @description หน้าฟอร์มสร้าง/แก้ไขใบขอเบิก (Issue Requisition)
 * @pattern ตาม Sales module pattern (Card-based, Animation, Footer styling)
 */

import React, { useState } from 'react';
import { FormProvider, type SubmitHandler } from 'react-hook-form';
import { ClipboardList, Save, Loader2 } from 'lucide-react';
import { WindowFormLayout } from '@ui';
import { ConfirmationModal } from '@system/ConfirmationModal';
import { RequisitionFormHeader } from '../components/RequisitionFormHeader';
import { RequisitionFormLines } from '../components/RequisitionFormLines';
import { useRequisitionForm } from '../hooks/useRequisitionForm';
import type { RequisitionHeaderFormData, RequisitionLineFormData } from '../schemas/requisition.schemas';
import { ProductSearchModal, type Product } from '@Inventory/shared/components/ProductSearchModal';
import { WarehouseSearchModal } from '@Inventory/shared/components/WarehouseSearchModal';
import { LocationSearchModal } from '@Inventory/shared/components/LocationSearchModal';
import { LotSearchModal } from '@Inventory/shared/components/LotSearchModal';
import type { WarehouseListItem } from '@master-data/inventory/types/warehouse-types';
import type { Location, LotNo } from '@master-data/inventory/types/inventory-master.types';
import { LocationService } from '@master-data/inventory/services/inventory-master.service';
import { useQuery } from '@tanstack/react-query';
import { UOMPickerModal, type UOMPickerItem } from '@/shared/components/ui/feedback/UOMPickerModal';
import { UOMConversionService } from '@inventory/services/uom-conversion.service';
import { ItemBarcodeService } from '@inventory/services/item-barcode.service';
import { ItemMasterService } from '@inventory/services/item-master.service';

interface RequisitionFormPageProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
    readOnly?: boolean;
}

const cardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden';

export const RequisitionFormPage: React.FC<RequisitionFormPageProps> = ({
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
        docLinks,
        branches,
        departments,
        employees,
        projects,
        uoms,
    } = useRequisitionForm({ isOpen, onClose, editId, onSuccess });

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<RequisitionHeaderFormData | null>(null);

    // 🔍 Product Search Modal State
    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);

    const handleOpenProductSearch = (index: number) => {
        setActiveLineIndex(index);
        setIsProductSearchOpen(true);
    };

    // 🔍 UOM Picker Modal State & Queries
    const [activeUomRowIndex, setActiveUomRowIndex] = useState<number | null>(null);
    const watchedLinesForUom = formMethods.watch('lines') || [];
    const activeUomLine = activeUomRowIndex !== null ? watchedLinesForUom[activeUomRowIndex] : null;
    const activeUomItemId = activeUomLine ? Number(activeUomLine.item_id || 0) : 0;

    // Fetch conversions for selected item
    const { data: conversionData, isLoading: isLoadingConversions } = useQuery({
        queryKey: ['requisition-uom-conversions', activeUomItemId],
        queryFn: () => UOMConversionService.getByItemId(activeUomItemId),
        enabled: !!activeUomItemId && activeUomItemId > 0,
        staleTime: 2 * 60 * 1000,
    });

    // Fetch barcodes for selected item
    const { data: barcodeData } = useQuery({
        queryKey: ['requisition-item-barcodes', activeUomItemId],
        queryFn: () => ItemBarcodeService.getAll({ item_id: activeUomItemId }),
        enabled: !!activeUomItemId && activeUomItemId > 0,
        staleTime: 2 * 60 * 1000,
    });

    // Map UOM conversions to UOMPickerItem[]
    const uomPickerItems = React.useMemo((): UOMPickerItem[] => {
        const conversions = conversionData?.items || [];
        const barcodes = barcodeData?.items || [];
        return conversions.map(conv => {
            const uomInfo = uoms.find(u => Number(u.uom_id || u.id) === Number(conv.from_unit_id));
            const matchedBarcode = barcodes.find(b => Number(b.uom_id) === Number(conv.conversion_id));
            return {
                conversion_id: conv.conversion_id,
                from_unit_id: conv.from_unit_id,
                from_unit_name: conv.from_unit_name || uomInfo?.uom_name || String(conv.from_unit_id),
                from_unit_name_en: uomInfo?.uom_name_en || uomInfo?.uom_nameeng || uomInfo?.uom_code || undefined,
                conversion_factor: conv.conversion_factor,
                barcode: matchedBarcode?.barcode || undefined,
            };
        });
    }, [conversionData, uoms, barcodeData]);

    const handleSelectUom = (item: UOMPickerItem) => {
        if (activeUomRowIndex !== null) {
            updateLine(activeUomRowIndex, null, {
                ...fields[activeUomRowIndex],
                uom_id: String(item.from_unit_id),
                item_uom_id: String(item.conversion_id),
            } as RequisitionLineFormData);
        }
        setActiveUomRowIndex(null);
    };

    const handleSelectProduct = async (product: Product) => {
        if (activeLineIndex !== null) {
            let targetUomId = '';
            let targetItemUomId = '';

            try {
                // Fetch the full product master detail to get the base_uom_id directly
                const itemDetail = await ItemMasterService.getById(Number(product.item_id || product.id));
                const dbBaseUomId = itemDetail?.base_uom_id;

                const convs = await UOMConversionService.getByItemId(Number(product.item_id || product.id));
                const convList = convs?.items || [];
                
                // Prioritize conversion with factor === 1 (Base UOM)
                const baseConv = convList.find(c => Number(c.conversion_factor) === 1);
                
                if (baseConv) {
                    targetUomId = String(baseConv.from_unit_id);
                    targetItemUomId = String(baseConv.conversion_id);
                } else {
                    // Determine the Base UOM ID
                    let baseUomId = dbBaseUomId ? String(dbBaseUomId) : '';
                    if (!baseUomId && convList.length > 0) {
                        baseUomId = String(convList[0].to_unit_id);
                    }
                    if (!baseUomId) {
                        baseUomId = String(product.base_uom_id || product.uom_id || product.purchasing_unit_id || '');
                    }
                    if (!baseUomId || baseUomId === '0') {
                        const foundUom = uoms.find(u => 
                            u.uom_name && (u.uom_name === product.uom_name)
                        );
                        if (foundUom) {
                            baseUomId = String(foundUom.uom_id || foundUom.id);
                        }
                    }

                    targetUomId = baseUomId;
                    targetItemUomId = targetUomId;
                    
                    const matchedConv = convList.find(c => String(c.from_unit_id) === targetUomId);
                    if (matchedConv) {
                        targetItemUomId = String(matchedConv.conversion_id);
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch default UOM conversion for selected product:', err);
                targetUomId = String(product.base_uom_id || product.uom_id || product.purchasing_unit_id || '');
                targetItemUomId = targetUomId;
            }

            // อัปเดตข้อมูลทั้งแถวในครั้งเดียวเพื่อป้องกันการเขียนทับข้อมูลกัน (Race Condition)
            updateLine(activeLineIndex, null, {
                ...fields[activeLineIndex],
                item_id: String(product.item_id || product.id || ''),
                item_code: product.item_code || '',
                item_name: product.item_name || '',
                uom_id: targetUomId,
                item_uom_id: targetItemUomId,
                warehouse_id: product.warehouse_id ? String(product.warehouse_id) : fields[activeLineIndex].warehouse_id,
                warehouse_name: product.warehouse || fields[activeLineIndex].warehouse_name,
            } as RequisitionLineFormData);
        }
        setIsProductSearchOpen(false);
    };

    // 🔍 Warehouse Search Modal State
    const [isWarehouseSearchOpen, setIsWarehouseSearchOpen] = useState(false);
    const handleOpenWarehouseSearch = (index: number) => {
        setActiveLineIndex(index);
        setIsWarehouseSearchOpen(true);
    };
    const handleSelectWarehouse = async (warehouse: WarehouseListItem) => {
        if (activeLineIndex !== null) {
            let locId = '';
            let locName = '';
            try {
                const res = await LocationService.getAll({ 
                    warehouse_id: warehouse.warehouse_id, 
                    limit: 100 
                });
                const firstLoc = res?.items?.find(
                    loc => Number(loc.warehouse_id) === Number(warehouse.warehouse_id)
                );
                if (firstLoc) {
                    locId = String(firstLoc.location_id);
                    locName = firstLoc.name_th || firstLoc.code || '';
                }
            } catch (err) {
                console.error('Failed to fetch first location:', err);
            }

            updateLine(activeLineIndex, null, {
                ...fields[activeLineIndex],
                warehouse_id: String(warehouse.warehouse_id),
                warehouse_name: warehouse.warehouse_name,
                location_id: locId,
                location_name: locName,
            } as RequisitionLineFormData);
        }
        setIsWarehouseSearchOpen(false);
    };

    // 🔍 Location Search Modal State
    const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);
    const [activeWarehouseId, setActiveWarehouseId] = useState<string | number | undefined>(undefined);
    const handleOpenLocationSearch = (index: number, warehouseId?: string | number) => {
        setActiveLineIndex(index);
        setActiveWarehouseId(warehouseId);
        setIsLocationSearchOpen(true);
    };
    const handleSelectLocation = (location: Location) => {
        if (activeLineIndex !== null) {
            updateLine(activeLineIndex, null, {
                ...fields[activeLineIndex],
                location_id: String(location.location_id),
                location_name: location.name_th,
            } as RequisitionLineFormData);
        }
        setIsLocationSearchOpen(false);
    };

    // 🔍 Lot Search Modal State
    const [isLotSearchOpen, setIsLotSearchOpen] = useState(false);
    const [activeItemId, setActiveItemId] = useState<string | number | undefined>(undefined);
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
            } as RequisitionLineFormData);
        }
        setIsLotSearchOpen(false);
    };

    // 💾 Form Submission Handler
    const onFormSubmit: SubmitHandler<RequisitionHeaderFormData> = (data) => {
        setPendingData(data);
        setIsConfirmOpen(true);
    };

    const handleConfirmSave = async () => {
        if (!pendingData || isSaving) return;
        // 🎯 Note: We don't close the confirm modal here. 
        // The isSaving status will show a loader in the modal, and the successful mutation 
        // will call onClose() which unmounts the entire page anyway.
        await onSubmit(pendingData);
    };

    // ── Title ──────────────────────────────────────────────────────────────────────
    const formTitle = readOnly
        ? 'รายละเอียดใบขอเบิก (VIEW Issue Requisition)'
        : isEditMode
            ? 'แก้ไขใบขอเบิก (EDIT Issue Requisition)'
            : 'สร้างใบขอเบิกใหม่ (CREATE Issue Requisition)';

    // ── Footer ─────────────────────────────────────────────────────────────────────
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
                        form="requisition-form"
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
                        <form id="requisition-form" onSubmit={formMethods.handleSubmit(onFormSubmit, handleFormError)} className="w-full space-y-6">
                            {/* 1. Header Section */}
                            <div className={cardClass}>
                                <div className="p-6">
                                    <RequisitionFormHeader
                                        docLinks={docLinks}
                                        deptOptions={departments.map(d => {
                                            const item = d as unknown as Record<string, unknown>;
                                            return { 
                                                id: String(d.emp_dept_id || d.department_id || item.id || ''), 
                                                name: d.emp_dept_name || d.department_name || String(item.dept_name || '') 
                                            };
                                        })}
                                        jobOptions={projects.map(p => {
                                            const item = p as unknown as Record<string, unknown>;
                                            return { 
                                                id: String(p.project_id || item.id || ''), 
                                                name: p.project_name || String(item.name || '') 
                                            };
                                        })}
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
                                    <RequisitionFormLines
                                        fields={fields}
                                        addLine={addLine}
                                        removeLine={removeLine}
                                        updateLine={updateLine}
                                        readOnly={readOnly}
                                        uomOptions={uoms.map(u => {
                                            const item = u as unknown as Record<string, unknown>;
                                            const uId = String(u.uom_id ?? u.uom_id ?? item.id ?? '');
                                            return { 
                                                id: uId, 
                                                name: u.uom_name || u.uom_name || String(item.name || '') 
                                            };
                                        })}
                                        onSearchProduct={handleOpenProductSearch}
                                        onSearchWarehouse={handleOpenWarehouseSearch}
                                        onSearchLocation={handleOpenLocationSearch}
                                        onSearchLot={handleOpenLotSearch}
                                        onOpenUomPicker={(idx) => setActiveUomRowIndex(idx)}
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
                description="คุณต้องการบันทึกข้อมูลใบขอเบิกนี้ใช่หรือไม่?"
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
                warehouseId={activeLineIndex !== null ? (fields[activeLineIndex]?.warehouse_id || undefined) : undefined}
                locationId={activeLineIndex !== null ? (fields[activeLineIndex]?.location_id || undefined) : undefined}
                itemName={activeLineIndex !== null ? fields[activeLineIndex]?.item_name : undefined}
                itemCode={activeLineIndex !== null ? fields[activeLineIndex]?.item_code : undefined}
            />

            <UOMPickerModal
                isOpen={activeUomRowIndex !== null}
                onClose={() => setActiveUomRowIndex(null)}
                onSelect={handleSelectUom}
                items={uomPickerItems}
                isLoading={isLoadingConversions}
                selectedFromUnitId={activeUomLine ? Number(activeUomLine.uom_id || 0) : undefined}
                title={`เลือกหน่วยนับสำหรับ ${activeUomLine?.item_name || 'สินค้า'}`}
            />
        </WindowFormLayout>
    );
};
