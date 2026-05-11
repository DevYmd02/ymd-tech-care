/**
 * @file DeliveryFormModal.tsx
 * @description Modal ฟอร์มสร้าง/แก้ไขใบจัดส่งสินค้า
 * @tables delivery_header (D11) + delivery_line (D12)
 */

import { useState } from 'react';
import { Save, Truck, Printer, Loader2 } from 'lucide-react';
import { logger } from '@utils';
import { FormProvider } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@ui/feedback/Toast';
import { WindowFormLayout } from '@ui';
import { extractErrorMessage } from '@/core/api/api';
import { useBranches, useUnits, useWarehouses, useLocations } from '@master-data/hooks/useMasterData';
import { EmployeeSearchModal } from '@master-data/employee/components/EmployeeSearchModal';
import { ProductSearchModal } from '@sales/quotation/components/ProductSearchModal';
import { WarehouseSearchModal } from '@sales/shared/components/search-modals/WarehouseSearchModal';
import { LocationSearchModal } from '@sales/shared/components/search-modals/LocationSearchModal';
import { LotSearchModal } from '@sales/reservation/components/search-modals/LotSearchModal';
import { SalesFormSkeleton } from '@sales/shared/components/SalesFormSkeleton';
import { useConfirmation } from '@hooks/useConfirmation';
import { useDeliveryForm } from '../hooks';
import { DeliveryService } from '../services/delivery.service';
import { DeliveryHeaderForm } from './DeliveryHeaderForm';
import { DeliveryLineTable } from './DeliveryLineTable';
import type { DeliveryFormValues } from '../schemas/delivery.schemas';
import type { DeliveryFormData } from '../types/delivery.types';
import type { ItemListItem } from '@inventory/types/product-types';
import type { LotNo } from '@inventory/types/inventory-master.types';
import type { IEmployee } from '@master-data/company/types/employee-types';
import { SalesOrderSearchModal } from '@sales/delivery/components/SalesOrderSearchModal';
import type { SalesOrderHeader } from '@sales/sales-order/services/sales-order.service';
import { CustomerAddressSearchModal } from './CustomerAddressSearchModal';

// ============================================================
// Props
// ============================================================
interface DeliveryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    id?: string;
    isViewOnly?: boolean;
    onSuccess?: () => void;
}

const cardClass =
    'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden';

// ============================================================
// Component
// ============================================================
export function DeliveryFormModal({
    isOpen,
    onClose,
    id,
    isViewOnly = false,
    onSuccess,
}: DeliveryFormModalProps) {
    const { toast } = useToast();
    const isEdit = !!id;
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search Modal State
    const [isSalesOrderSearchOpen, setIsSalesOrderSearchOpen] = useState(false);
    const [isEmployeeSearchOpen, setIsEmployeeSearchOpen] = useState(false);
    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [isWarehouseSearchOpen, setIsWarehouseSearchOpen] = useState(false);
    const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);
    const [isLotSearchOpen, setIsLotSearchOpen] = useState(false);
    const [isAddressSearchOpen, setIsAddressSearchOpen] = useState(false);
    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);

    // --------------------------------------------------------
    // Master Data
    // --------------------------------------------------------
    const { data: branches = [] } = useBranches(isOpen);
    const { data: uomResponse } = useUnits(isOpen);
    const uoms = uomResponse?.items || [];

    const { data: warehouseResponse } = useWarehouses(isOpen);
    const warehouses = warehouseResponse?.items || [];

    const { data: locationResponse } = useLocations(isOpen);
    const locations = locationResponse?.items || [];

    // --------------------------------------------------------
    // Load existing delivery when editing
    // --------------------------------------------------------
    const { data: deliveryDetail, isFetching: isFetchingDetail } = useQuery({
        queryKey: ['delivery', id],
        queryFn: () => DeliveryService.getById(id!),
        enabled: isOpen && !!id,
    });

    // --------------------------------------------------------
    // Form Hook
    // --------------------------------------------------------
    const {
        methods,
        lines,
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleSelectProduct,
        handleSelectSalesOrder,
    } = useDeliveryForm({
        isOpen,
        id,
        initialData: (deliveryDetail || undefined) as Partial<DeliveryFormValues>,
        uoms,
    });

    const { watch } = methods;

    const handleSelectEmployee = (emp: IEmployee) => {
        const empId = String(emp.id || '');
        methods.setValue('ship_by_emp', empId, { shouldDirty: true, shouldValidate: true });
        methods.setValue(
            'ship_by_emp_name',
            `${emp.employee_firstname_th || ''} ${emp.employee_lastname_th || ''}`.trim(),
            { shouldDirty: true, shouldValidate: true }
        );
    };

    const { confirm } = useConfirmation();
    const { handleSubmit } = methods;
    const queryClient = useQueryClient();

    // --------------------------------------------------------
    // Form Submit
    // --------------------------------------------------------
    const onFormSubmit = async (data: DeliveryFormValues) => {
        setIsSubmitting(true);
        try {
            logger.debug('[DeliveryFormModal] Submitting:', data);
            if (isEdit && id) {
                await DeliveryService.update(id, data as unknown as DeliveryFormData);
            } else {
                await DeliveryService.create(data as unknown as DeliveryFormData);
            }

            // 🚀 CRITICAL: Invalidate cache to ensure fresh data on next open
            if (id) {
                queryClient.invalidateQueries({ queryKey: ['delivery', id] });
            }
            queryClient.invalidateQueries({ queryKey: ['deliveries'] });

            toast(`บันทึกรายการจัดส่งสินค้า ${isEdit ? 'สำเร็จ' : 'เรียบร้อยแล้ว'}`, 'success');
            onSuccess?.();
            onClose();
        } catch (error) {
            logger.error('[DeliveryFormModal] Submit failed:', error);
            toast(extractErrorMessage(error), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveClick = async () => {
        const isConfirmed = await confirm({
            title: isEdit ? 'ยืนยันการแก้ไขรายการจัดส่ง' : 'ยืนยันการสร้างรายการจัดส่งสินค้า',
            description: isEdit
                ? 'คุณแน่ใจหรือไม่ว่าต้องการบันทึกการแก้ไขรายการจัดส่งนี้?'
                : 'คุณต้องการสร้างรายการจัดส่งสินค้าใหม่ใช่หรือไม่?',
            variant: 'warning',
            confirmText: 'ตกลง',
            cancelText: 'ยกเลิก',
        });

        if (isConfirmed) {
            handleSubmit(onFormSubmit, (errors) => {
                logger.error('[DeliveryFormModal] Validation failed:', errors);
                toast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'error');
            })();
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
                        พิมพ์ใบจัดส่ง
                    </button>
                )}
            </div>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="h-10 px-6 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                    ยกเลิก
                </button>
                {!isViewOnly && (
                    <button
                        type="button"
                        onClick={handleSaveClick}
                        disabled={isSubmitting}
                        className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isEdit ? 'บันทึกการแก้ไข' : 'ยืนยันสร้างรายการจัดส่ง'}
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
            onClose={onClose}
            title={
                isViewOnly
                    ? 'รายละเอียดรายการจัดส่งสินค้า (Delivery Order)'
                    : isEdit
                        ? 'แก้ไขรายการจัดส่งสินค้า (Edit Delivery)'
                        : 'สร้างรายการจัดส่งสินค้าใหม่ (Create Delivery)'
            }
            headerColor={isViewOnly ? 'bg-slate-700' : 'bg-amber-600'}
            footer={ModalFooter}
            titleIcon={
                <div className="bg-white/20 p-1.5 rounded shadow-sm">
                    <Truck size={16} strokeWidth={3} className="text-white" />
                </div>
            }
        >
            <FormProvider {...methods}>
                {isFetchingDetail && !watch('delivery_no') ? (
                    <SalesFormSkeleton />
                ) : (
                    <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6">
                        <form
                            id="delivery-form"
                            onSubmit={handleSubmit(onFormSubmit)}
                            className={`max-w-[1400px] mx-auto space-y-6 ${isViewOnly ? 'opacity-95' : ''}`}
                        >
                            {/* 1. Header */}
                            <div className={cardClass}>
                                <div className="p-6">
                                    <DeliveryHeaderForm
                                        branches={branches}
                                        onSearchSalesOrder={() => setIsSalesOrderSearchOpen(true)}
                                        onSearchEmployee={() => setIsEmployeeSearchOpen(true)}
                                        onSearchAddress={() => setIsAddressSearchOpen(true)}
                                    />
                                </div>
                            </div>

                            {/* 2. Lines */}
                            <div className={cardClass}>
                                <div className="p-6">
                                    <DeliveryLineTable
                                        lines={lines}
                                        uoms={uoms}
                                        warehouses={warehouses}
                                        locations={locations}
                                        onAddLine={handleAddLine}
                                        onRemoveLine={handleRemoveLine}
                                        onLineChange={handleLineChange}
                                        onSearchProduct={(index: number) => {
                                            setActiveLineIndex(index);
                                            setIsProductSearchOpen(true);
                                        }}
                                        onSearchWarehouse={(index: number) => {
                                            setActiveLineIndex(index);
                                            setIsWarehouseSearchOpen(true);
                                        }}
                                        onSearchLocation={(index: number) => {
                                            setActiveLineIndex(index);
                                            setIsLocationSearchOpen(true);
                                        }}
                                        onSearchLot={(index: number) => {
                                            setActiveLineIndex(index);
                                            setIsLotSearchOpen(true);
                                        }}
                                        isViewOnly={isViewOnly}
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </FormProvider>

            {/* ---- Search Modals ---- */}
            <SalesOrderSearchModal
                isOpen={isSalesOrderSearchOpen}
                onClose={() => setIsSalesOrderSearchOpen(false)}
                onSelect={(so: SalesOrderHeader) => {
                    const rawSo = so as unknown as Record<string, unknown>;
                    handleSelectSalesOrder(
                        String(so.so_id),
                        so.so_no,
                        String(so.customer_id),
                        so.customer_name,
                        String(rawSo.branch_id || '')
                    );
                    setIsSalesOrderSearchOpen(false);
                }}
                headerColor="bg-amber-600"
            />

            <EmployeeSearchModal
                isOpen={isEmployeeSearchOpen}
                onClose={() => setIsEmployeeSearchOpen(false)}
                onSelect={handleSelectEmployee}
                headerColor="bg-amber-600"
            />

            <ProductSearchModal
                isOpen={isProductSearchOpen}
                onClose={() => setIsProductSearchOpen(false)}
                onSelect={(product: ItemListItem) =>
                    activeLineIndex !== null && handleSelectProduct(activeLineIndex, product)
                }
                headerColor="bg-amber-600"
            />

            <WarehouseSearchModal
                isOpen={isWarehouseSearchOpen}
                onClose={() => setIsWarehouseSearchOpen(false)}
                warehouses={warehouses}
                itemId={activeLineIndex !== null ? lines[activeLineIndex]?.item_id || null : null}
                onSelect={(warehouse) => {
                    if (activeLineIndex !== null) {
                        handleLineChange(activeLineIndex, 'warehouse_id', String(warehouse.warehouse_id));
                        const firstLoc = locations.find(
                            (loc) => String(loc.warehouse_id) === String(warehouse.warehouse_id)
                        );
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
                warehouseId={
                    activeLineIndex !== null
                        ? String(lines[activeLineIndex]?.warehouse_id || '')
                        : null
                }
                itemId={activeLineIndex !== null ? lines[activeLineIndex]?.item_id || null : null}
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
                        handleLineChange(activeLineIndex, 'lot_no', lot.code || '');
                        if (lot.lot_id) handleLineChange(activeLineIndex, 'lot_id', String(lot.lot_id));
                        if (lot.warehouse_id) {
                            handleLineChange(activeLineIndex, 'warehouse_id', String(lot.warehouse_id));
                        }
                        if (lot.location_id) {
                            handleLineChange(activeLineIndex, 'location_id', String(lot.location_id));
                        }
                        setIsLotSearchOpen(false);
                    }
                }}
                warehouseId={
                    activeLineIndex !== null
                        ? String(lines[activeLineIndex]?.warehouse_id || '')
                        : undefined
                }
                locationId={
                    activeLineIndex !== null
                        ? String(lines[activeLineIndex]?.location_id || '')
                        : undefined
                }
                itemId={
                    activeLineIndex !== null
                        ? String(lines[activeLineIndex]?.item_id || '')
                        : undefined
                }
                itemName={
                    activeLineIndex !== null
                        ? String(lines[activeLineIndex]?.item_name || '')
                        : undefined
                }
                itemCode={
                    activeLineIndex !== null
                        ? String(lines[activeLineIndex]?.item_code || '')
                        : undefined
                }
            />

            <CustomerAddressSearchModal
                isOpen={isAddressSearchOpen}
                onClose={() => setIsAddressSearchOpen(false)}
                customerId={watch('customer_id')}
                onSelect={(address) => {
                    methods.setValue('ship_to_address', address, { shouldDirty: true, shouldValidate: true });
                }}
                headerColor="bg-amber-600"
            />
        </WindowFormLayout>
    );
}
