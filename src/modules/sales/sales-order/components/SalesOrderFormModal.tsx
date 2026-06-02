/**
 * @file SalesOrderFormModal.tsx
 * @description Modal ฟอร์มสร้าง/แก้ไขใบสั่งขาย (Sales Order)
 * @tables sale_order_header (D9) + sale_order_line (D10)
 */

import { useState } from 'react';
import { Save, ShoppingCart, Printer, Loader2 } from 'lucide-react';
import { logger } from '@utils';
import { FormProvider } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@ui/feedback/Toast';
import { WindowFormLayout } from '@ui';
import { useBranches, useUnits, useWarehouses, useLocations, useCurrencies, useTaxCodes, useDepartments, useProjects, useSaleAreas } from '@master-data/hooks/useMasterData';
import { extractErrorMessage } from '@/core/api/api';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { usePriceLevelName } from '@sales-master/pages/price-level-name/hooks/usePriceLevelName';
import { useSalesOrderForm } from '../hooks';
import { SalesOrderService } from '../services/sales-order.service';
import type { SalesOrderFormValues } from '../schemas/sales-order.schemas';
import type { SalesOrderFormData } from '../types/sales-order.types';
import type { Currency, UOMListItem } from '@master-data/types/master-data-types';
import type { TaxCode } from '@master-data/tax/types/tax-types';
import type { EmployeeDeptMaster } from '@master-data/company/types/employee-dept.types';
import type { Project } from '@master-data/project/types/project-types';
import type { SaleAreaMaster } from '@sales-master/pages/area/types/area.types';
import { SalesOrderHeaderForm } from './SalesOrderHeaderForm';
import { SalesOrderLineTable } from './SalesOrderLineTable';
import { SalesOrderSummary } from './SalesOrderSummary';
import { CustomerSearchModal } from '@sales/quotation/components/CustomerSearchModal';
import { ProductSearchModal } from '@sales/quotation/components/ProductSearchModal';
import type { ItemListItem } from '@inventory/types/product-types';
import { ReservationSearchModal } from './ReservationSearchModal';
import { EmployeeSearchModal } from '@master-data/employee/components/EmployeeSearchModal';
import type { IEmployee } from '@master-data/company/types/employee-types';
import { WarehouseSearchModal } from '@sales/shared/components/search-modals/WarehouseSearchModal';
import { LocationSearchModal } from '@sales/shared/components/search-modals/LocationSearchModal';
import { LotSearchModal } from './LotSearchModal';
import type { LotNo } from '@inventory/types/inventory-master.types';
import { useConfirmation } from '@hooks/useConfirmation';
import { ErrorBoundary } from '@/shared/components/system/ErrorBoundary';

// ============================================================
// Props
// ============================================================
interface SalesOrderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    id?: string;
    isViewOnly?: boolean;
    initialData?: Partial<SalesOrderFormValues>;
    onSuccess?: () => void;
}

const cardClass =
    'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden';

// ============================================================
// Component
// ============================================================
import { SalesFormSkeleton } from '@sales/shared/components/SalesFormSkeleton';

export function SalesOrderFormModal({
    isOpen,
    onClose,
    id,
    isViewOnly = false,
    initialData,
    onSuccess,
}: SalesOrderFormModalProps) {
    const { toast } = useToast();
    const isEdit = !!id;
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search Modals
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [isReservationSearchOpen, setIsReservationSearchOpen] = useState(false);
    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [isEmployeeSearchOpen, setIsEmployeeSearchOpen] = useState(false);
    const [isWarehouseSearchOpen, setIsWarehouseSearchOpen] = useState(false);
    const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);
    const [isLotSearchOpen, setIsLotSearchOpen] = useState(false);
    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);

    // --------------------------------------------------------
    // Data Fetching
    // --------------------------------------------------------
    const { data: branches = [] } = useBranches(isOpen);
    const { data: currencies = [] } = useCurrencies(isOpen) as { data: Currency[] | undefined };
    const { data: customerResponse } = useQuery({
        queryKey: ['master-customers'],
        queryFn: () => CustomerService.getList({ limit: 100 }),
        enabled: isOpen,
    });
    const customers = customerResponse?.data || [];

    const { data: taxCodes = [] } = useTaxCodes(isOpen) as { data: TaxCode[] | undefined };
    const { data: departments = [] } = useDepartments(isOpen) as { data: EmployeeDeptMaster[] | undefined };
    const { data: projects = [] } = useProjects(isOpen) as { data: Project[] | undefined };
    const { data: saleAreas = [] } = useSaleAreas(isOpen) as { data: SaleAreaMaster[] | undefined };


    const { data: uomResponse } = useUnits(isOpen);
    const uoms = uomResponse?.items || [];

    const { data: warehouseResponse } = useWarehouses(isOpen);
    const warehouses = warehouseResponse?.items || [];

    const { data: locationResponse } = useLocations(isOpen);
    const locations = locationResponse?.items || [];

    const { allItems: priceLevelNames } = usePriceLevelName(isOpen);

    // 💡 Load Sales Order Detail when editing
    const { data: soDetail, isFetching: isFetchingDetail } = useQuery({
        queryKey: ['sales-order', id],
        queryFn: () => SalesOrderService.getById(id!),
        enabled: isOpen && !!id,
    });

    // 🛡️ Safety: Force view-only if status is not editable (e.g., APPROVED, CONFIRMED)
    const currentStatus = (soDetail?.status || '').toUpperCase();
    const isStatusEditable = !id || currentStatus === 'DRAFT' || currentStatus === 'REJECTED' || currentStatus === 'PENDING';
    const effectiveIsViewOnly = isViewOnly || !isStatusEditable;

    // --------------------------------------------------------
    // Hooks
    // --------------------------------------------------------
    const {
        methods,
        discount_input,
        discount_amount,
        status,
        base_currency_code,
        isMulticurrency,
        totals,
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleSelectCustomer,
        handleSelectProduct,
        handleSelectReservation,
        handleSubmit,
        onInvalidSubmit,
        onClose: handleClose,
    } = useSalesOrderForm({
        isOpen,
        id,
        initialData: (soDetail || initialData) as Partial<SalesOrderFormValues>,
        currencies: (currencies || []) as Currency[],
        taxCodes: (taxCodes || []) as TaxCode[],
        uoms: (uoms || []) as UOMListItem[],
        onClose,
        readOnly: isViewOnly,
    });

    const { watch } = methods;

    const handleSelectEmployee = (emp: IEmployee) => {
        methods.setValue('emp_sale_id', emp.id, { shouldDirty: true });
        methods.setValue('emp_sale_name', `${emp.employee_firstname_th} ${emp.employee_lastname_th}`, { shouldDirty: true });
    };

    const { confirm } = useConfirmation();

    // --------------------------------------------------------
    // Form Submit
    // --------------------------------------------------------
    const onFormSubmit = async (data: SalesOrderFormValues) => {
        setIsSubmitting(true);
        try {
            logger.debug('Submitting Sales Order:', data);
            
            if (isEdit && id) {
                const submitData = { ...data };
                const isResubmitting = submitData.status === 'REJECTED';
                
                // 1. Save modified data
                await SalesOrderService.update(id, submitData as unknown as SalesOrderFormData);
                
                // 2. Explicitly trigger status update for re-approval
                if (isResubmitting) {
                    logger.debug('Re-submitting Sales Order to PENDING status...');
                    await SalesOrderService.updateStatus(id, 'PENDING');
                }
            } else {
                await SalesOrderService.create(data as unknown as SalesOrderFormData);
            }
            
            toast(`บันทึกใบสั่งขาย ${isEdit ? 'สำเร็จ' : 'เรียบร้อยแล้ว'}`, 'success');
            onSuccess?.();
            onClose();
        } catch (error) {
            logger.error('Failed to submit sales order:', error);
            toast(extractErrorMessage(error), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveClick = async () => {
        const isResubmit = isEdit && status === 'REJECTED';
        const isConfirmed = await confirm({
            title: isResubmit ? 'ยืนยันการแก้ไขและส่งอนุมัติใหม่' : (isEdit ? 'ยืนยันการแก้ไข' : 'ยืนยันการสร้างใบสั่งขาย'),
            description: isResubmit
                ? 'คุณแน่ใจหรือไม่ว่าต้องการบันทึกการแก้ไขและส่งอนุมัติใบสั่งขายนี้ใหม่อีกครั้ง?'
                : (isEdit 
                    ? 'คุณแน่ใจหรือไม่ว่าต้องการบันทึกการแก้ไขใบสั่งขายนี้?' 
                    : 'คุณต้องการสร้างใบสั่งขายใหม่จากรายการนี้ใช่หรือไม่?'),
            variant: 'warning',
            confirmText: 'ตกลง',
            cancelText: 'ยกเลิก'
        });

        if (isConfirmed) {
            handleSubmit(onFormSubmit, onInvalidSubmit)();
        }
    };

    // --------------------------------------------------------
    // Footer
    // --------------------------------------------------------
    const ModalFooter = (
        <div className="flex justify-between items-center w-full bg-slate-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-4">
                {isEdit && (
                    <button
                        type="button"
                        className="h-10 px-6 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg text-sm font-bold flex items-center gap-2 border border-purple-200 dark:border-purple-800 transition-all"
                    >
                        <Printer size={18} />
                        พิมพ์ใบสั่งขาย
                    </button>
                )}
            </div>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="h-10 px-6 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                    ยกเลิก
                </button>
                {!effectiveIsViewOnly && (
                    <button
                        type="button"
                        onClick={handleSaveClick}
                        disabled={isSubmitting}
                        className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {isEdit 
                            ? (status === 'REJECTED' ? 'บันทึกและส่งอนุมัติใหม่' : 'บันทึกการแก้ไข') 
                            : 'ยืนยันสร้างใบสั่งขาย'
                        }
                    </button>
                )}
            </div>
        </div>
    );

    // --------------------------------------------------------
    // Render
    // --------------------------------------------------------
    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={handleClose}
            title={
                isViewOnly 
                    ? 'รายละเอียดใบสั่งขาย (Sales Order)'
                    : isEdit
                        ? 'แก้ไขใบสั่งขาย (Edit Sales Order)'
                        : 'สร้างใบสั่งขายใหม่ (Create Sales Order)'
            }
            headerColor={effectiveIsViewOnly ? "bg-slate-700" : "bg-indigo-600"}
            footer={ModalFooter}
            titleIcon={
                <div className="bg-white/20 p-1.5 rounded shadow-sm">
                    <ShoppingCart size={16} strokeWidth={3} className="text-white" />
                </div>
            }
        >
            <FormProvider {...methods}>
                {isFetchingDetail && !watch('so_no') ? (
                    <SalesFormSkeleton />
                ) : (
                    <ErrorBoundary>
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
                        <form
                            id="so-form"
                            onSubmit={handleSubmit(onFormSubmit, onInvalidSubmit)}
                            className={`max-w-[1400px] mx-auto space-y-6 ${effectiveIsViewOnly ? 'opacity-90' : ''}`}
                        >
                            {/* 1. Header */}
                            <div className={cardClass}>
                                <div className="p-6">
                                    <SalesOrderHeaderForm
                                        branches={branches}
                                        currencies={(currencies || []) as Currency[]}
                                        customers={customers}
                                        taxCodes={(taxCodes || []) as TaxCode[]}
                                        departments={(departments || []) as EmployeeDeptMaster[]}
                                        projects={(projects || []) as Project[]}
                                        saleAreas={saleAreas}
                                        readOnly={effectiveIsViewOnly}
                                        onSearchCustomer={() => setIsCustomerSearchOpen(true)}
                                        onSearchReservation={() => setIsReservationSearchOpen(true)}
                                        onSearchEmployee={() => setIsEmployeeSearchOpen(true)}
                                    />
                                </div>
                            </div>

                            {/* 2. Lines */}
                            <div className={cardClass}>
                                <div className="p-6">
                                    <SalesOrderLineTable
                                        uoms={uoms}
                                        warehouses={warehouses}
                                        locations={locations}
                                        priceLevelNames={priceLevelNames}
                                        readOnly={effectiveIsViewOnly}
                                        onAddLine={handleAddLine}
                                        onRemoveLine={handleRemoveLine}
                                        onLineChange={handleLineChange}
                                        onSearchProduct={(index: number) => {
                                            setActiveLineIndex(index);
                                            setIsProductSearchOpen(true);
                                        }}
                                        onSearchLocation={(index: number) => {
                                            setActiveLineIndex(index);
                                            setIsLocationSearchOpen(true);
                                        }}
                                        onSearchWarehouse={(index: number) => {
                                            setActiveLineIndex(index);
                                            setIsWarehouseSearchOpen(true);
                                        }}
                                        onSearchLot={(index: number) => {
                                            setActiveLineIndex(index);
                                            setIsLotSearchOpen(true);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* 3. Summary */}
                            <div className={cardClass}>
                                <div className="p-6">
                                    <SalesOrderSummary
                                        subTotal={totals.subTotal}
                                        discountInput={discount_input}
                                        discountAmount={discount_amount}
                                        taxRate={totals.taxRate}
                                        vatAmount={totals.vatAmount}
                                        totalAmount={totals.totalAmount}
                                        currencySymbol={
                                            isMulticurrency
                                                ? base_currency_code || 'บาท'
                                                : 'บาท'
                                        }
                                        lineCount={watch('lines')?.length || 0}
                                        readOnly={effectiveIsViewOnly}
                                        onDiscountChange={(val: string) =>
                                            methods.setValue('discount_input', val, { shouldDirty: true })
                                        }
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                    </ErrorBoundary>
                )}
            </FormProvider>

            {/* Search Modals */}
            <CustomerSearchModal
                isOpen={isCustomerSearchOpen}
                onClose={() => setIsCustomerSearchOpen(false)}
                onSelect={handleSelectCustomer}
                headerColor="bg-indigo-600"
            />
            <ProductSearchModal
                isOpen={isProductSearchOpen}
                onClose={() => setIsProductSearchOpen(false)}
                onSelect={(product: ItemListItem) => activeLineIndex !== null && handleSelectProduct(activeLineIndex, product)}
                headerColor="bg-indigo-600"
            />
            <ReservationSearchModal
                isOpen={isReservationSearchOpen}
                onClose={() => setIsReservationSearchOpen(false)}
                onSelect={handleSelectReservation}
                headerColor="bg-indigo-600"
            />
            <EmployeeSearchModal
                isOpen={isEmployeeSearchOpen}
                onClose={() => setIsEmployeeSearchOpen(false)}
                onSelect={handleSelectEmployee}
                headerColor="bg-indigo-600"
                filterType="S"
            />
            
            <WarehouseSearchModal
                isOpen={isWarehouseSearchOpen}
                onClose={() => setIsWarehouseSearchOpen(false)}
                warehouses={warehouses}
                itemId={activeLineIndex !== null ? methods.getValues(`lines.${activeLineIndex}.item_id`) || null : null}
                onSelect={(warehouse) => {
                    if (activeLineIndex !== null) {
                        handleLineChange(activeLineIndex, 'warehouse_id', String(warehouse.warehouse_id));
                        // Auto-map first location for this warehouse if available
                        const firstLoc = locations.find(loc => String(loc.warehouse_id) === String(warehouse.warehouse_id));
                        if (firstLoc) {
                            handleLineChange(activeLineIndex, 'location_id', String(firstLoc.location_id));
                        }
                    }
                }}
                accentColor="indigo"
            />
            
            <LocationSearchModal
                isOpen={isLocationSearchOpen}
                onClose={() => setIsLocationSearchOpen(false)}
                warehouseId={activeLineIndex !== null ? String(methods.getValues(`lines.${activeLineIndex}.warehouse_id`) || '') : null}
                itemId={activeLineIndex !== null ? methods.getValues(`lines.${activeLineIndex}.item_id`) || null : null}
                locations={locations}
                onSelect={(location) => {
                    if (activeLineIndex !== null) {
                        handleLineChange(activeLineIndex, 'location_id', String(location.location_id));
                    }
                }}
                accentColor="indigo"
            />

            <LotSearchModal
                isOpen={isLotSearchOpen}
                onClose={() => setIsLotSearchOpen(false)}
                onSelect={(lot: LotNo) => {
                    if (activeLineIndex !== null) {
                        // Update lot info
                        handleLineChange(activeLineIndex, 'lot_no', lot.code || '');
                        handleLineChange(activeLineIndex, 'lot_id', String(lot.lot_id || lot.lot_no_id || lot.id || ''));

                        // 💡 Sync warehouse & location to match the selected LOT
                        // Critical when user picks from "Show All Stock" (different warehouse)
                        if (lot.warehouse_id) {
                            handleLineChange(activeLineIndex, 'warehouse_id', String(lot.warehouse_id));
                        }
                        if (lot.location_id) {
                            handleLineChange(activeLineIndex, 'location_id', String(lot.location_id));
                        }
                        setIsLotSearchOpen(false);
                    }
                }}
                warehouseId={activeLineIndex !== null ? String(methods.getValues(`lines.${activeLineIndex}.warehouse_id`) || '') : undefined}
                locationId={activeLineIndex !== null ? String(methods.getValues(`lines.${activeLineIndex}.location_id`) || '') : undefined}
                itemId={activeLineIndex !== null ? String(methods.getValues(`lines.${activeLineIndex}.item_id`) || '') : undefined}
            />
        </WindowFormLayout>
    );
}