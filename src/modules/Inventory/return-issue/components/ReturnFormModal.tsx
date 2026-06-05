/**
 * @file ReturnFormModal.tsx
 * @description หน้าต่างฟอร์มสร้าง/แก้ไข/ดูรายละเอียดใบรับคืนจากการเบิก (Return Issue Stock Form Modal)
 */

import React, { useState } from 'react';
import { FormProvider, type SubmitHandler } from 'react-hook-form';
import { ClipboardList, Save, Loader2 } from 'lucide-react';
import { WindowFormLayout } from '@ui';
import { ConfirmationModal } from '@system/ConfirmationModal';
import { ReturnFormHeader } from './ReturnFormHeader';
import { ReturnFormLines } from './ReturnFormLines';
import { useReturnForm } from '../hooks/useReturnForm';
import type { ReturnIssueHeaderFormData, ReturnIssueLineFormData } from '../schemas/return.schemas';
import { ProductSearchModal, type Product } from '@Inventory/shared/components/ProductSearchModal';
import { WarehouseSearchModal } from '@Inventory/shared/components/WarehouseSearchModal';
import { LocationSearchModal } from '@Inventory/shared/components/LocationSearchModal';
import { LotSearchModal } from '@Inventory/shared/components/LotSearchModal';
import type { WarehouseListItem } from '@master-data/inventory/types/warehouse-types';
import type { Location, LotNo } from '@master-data/inventory/types/inventory-master.types';
import { LocationService } from '@master-data/inventory/services/inventory-master.service';

interface ReturnFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    onSuccess?: () => void;
    readOnly?: boolean;
}

const cardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden';

export const ReturnFormModal: React.FC<ReturnFormModalProps> = ({
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
        departments,
        employees,
        projects,
        uoms,
    } = useReturnForm({ isOpen, onClose, editId, onSuccess });

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<ReturnIssueHeaderFormData | null>(null);

    // 🔍 Search Modals state
    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
    const [isWarehouseSearchOpen, setIsWarehouseSearchOpen] = useState(false);
    const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);
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
                warehouse_id: product.warehouse_id ? String(product.warehouse_id) : fields[activeLineIndex].warehouse_id,
                warehouse_name: product.warehouse || fields[activeLineIndex].warehouse_name,
                unit_cost: product.standard_cost || 0,
                qty_ic: 10, // Mock จำนวนเบิกเดิม หรือตั้งค่าเริ่มต้น
                qty_return_ic: '',
            } as ReturnIssueLineFormData);
        }
        setIsProductSearchOpen(false);
    };

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

            updateLine(activeLineIndex, null, {
                ...fields[activeLineIndex],
                warehouse_id: String(warehouse.warehouse_id),
                warehouse_name: warehouse.warehouse_name,
                location_id: locId,
                location_name: locName,
            } as ReturnIssueLineFormData);
        }
        setIsWarehouseSearchOpen(false);
    };

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
            } as ReturnIssueLineFormData);
        }
        setIsLocationSearchOpen(false);
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
            } as ReturnIssueLineFormData);
        }
        setIsLotSearchOpen(false);
    };

    const onFormSubmit: SubmitHandler<ReturnIssueHeaderFormData> = (data) => {
        setPendingData(data);
        setIsConfirmOpen(true);
    };

    const handleConfirmSave = async () => {
        if (!pendingData || isSaving) return;
        await onSubmit(pendingData);
    };

    const formTitle = readOnly
        ? 'รายละเอียดใบรับคืนจากการเบิก (VIEW Return Issue)'
        : isEditMode
            ? 'แก้ไขใบรับคืนจากการเบิก (EDIT Return Issue)'
            : 'สร้างใบรับคืนจากการเบิกใหม่ (CREATE Return Issue)';

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
                        form="return-issue-form"
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
                            <form id="return-issue-form" onSubmit={formMethods.handleSubmit(onFormSubmit, handleFormError)} className="w-full space-y-6">
                                {/* 1. Header Section */}
                                <div className={cardClass}>
                                    <div className="p-6">
                                        <ReturnFormHeader
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
                                        <ReturnFormLines
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
                                            onSearchWarehouse={handleOpenWarehouseSearch}
                                            onSearchLocation={handleOpenLocationSearch}
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
                    description="คุณต้องการบันทึกข้อมูลใบรับคืนจากการเบิกนี้ใช่หรือไม่?"
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
            </WindowFormLayout>
        </>
    );
};
