/**
 * @file SalesOrderFormModal.tsx
 * @description Modal ฟอร์มสร้าง/แก้ไขคำสั่งขาย (Sales Order)
 * @tables sale_order_header (D9) + sale_order_line (D10)
 */

import { useState } from 'react';
import { Save, ShoppingCart, Printer, Loader2 } from 'lucide-react';
import { logger } from '@utils/logger';
import { FormProvider } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { WindowFormLayout } from '@ui';
import { MasterDataService } from '@master-data';
import { CustomerService } from '@customer/customer-master/services/customer.service';
import { UnitService } from '@inventory/services/unit.service';
import { TaxCodeService } from '@master-data/tax/services/tax-code.service';
import { WarehouseService } from '@inventory/services/warehouse.service';
import { LocationService } from '@inventory/services/inventory-master.service';
import { useSalesOrderForm } from '../hooks';
import type { SalesOrderFormValues } from '../schemas/sales-order.schemas';
import { SalesOrderHeaderForm } from './SalesOrderHeaderForm';
import { SalesOrderLineTable } from './SalesOrderLineTable';
import { SalesOrderSummary } from './SalesOrderSummary';
import { CustomerSearchModal } from '@sales/quotation/components/CustomerSearchModal';
import { ProductSearchModal } from '@sales/quotation/components/ProductSearchModal';
import { SaleAreaService } from '@sales-master/pages/area/services/area.service';
import type { ItemListItem } from '@inventory/types/product-types';
import { ReservationSearchModal } from './ReservationSearchModal';

// ============================================================
// Props
// ============================================================
interface SalesOrderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    id?: string;
    initialData?: Partial<SalesOrderFormValues>;
    onSuccess?: () => void;
}

const cardClass =
    'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden';

// ============================================================
// Component
// ============================================================
export function SalesOrderFormModal({
    isOpen,
    onClose,
    id,
    initialData,
    onSuccess,
}: SalesOrderFormModalProps) {
    const isEdit = !!id;
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search Modals
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const [isReservationSearchOpen, setIsReservationSearchOpen] = useState(false);
    const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
    const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);

    // --------------------------------------------------------
    // Data Fetching
    // --------------------------------------------------------
    const { data: branches = [] } = useQuery({
        queryKey: ['master-branches'],
        queryFn: MasterDataService.getBranches,
        enabled: isOpen,
    });
    const { data: currencies = [] } = useQuery({
        queryKey: ['master-currencies'],
        queryFn: MasterDataService.getCurrencies,
        enabled: isOpen,
    });
    const { data: customerResponse } = useQuery({
        queryKey: ['master-customers'],
        queryFn: () => CustomerService.getList({ limit: 100 }),
        enabled: isOpen,
    });
    const customers = customerResponse?.data || [];

    const { data: taxCodes = [] } = useQuery({
        queryKey: ['master-tax-codes'],
        queryFn: TaxCodeService.getTaxCodes,
        enabled: isOpen,
    });
    const { data: departments = [] } = useQuery({
        queryKey: ['master-departments'],
        queryFn: MasterDataService.getDepartments,
        enabled: isOpen,
    });
    const { data: projects = [] } = useQuery({
        queryKey: ['master-projects'],
        queryFn: MasterDataService.getProjects,
        enabled: isOpen,
    });
    const { data: itemTypes = [] } = useQuery({
        queryKey: ['master-item-types'],
        queryFn: MasterDataService.getItemTypes,
        enabled: isOpen,
    });

    const { data: saleAreas = [] } = useQuery({
        queryKey: ['master-sale-areas'],
        queryFn: () => SaleAreaService.getList(),
        enabled: isOpen,
    });

    const { data: uomResponse } = useQuery({
        queryKey: ['master-units'],
        queryFn: () => UnitService.getAll({ limit: 1000 }),
        enabled: isOpen,
    });
    const uoms = uomResponse?.items || [];

    const { data: warehouseResponse } = useQuery({
        queryKey: ['master-warehouses'],
        queryFn: () => WarehouseService.getAll(),
        enabled: isOpen,
    });
    const warehouses = warehouseResponse?.items || [];

    const { data: locationResponse } = useQuery({
        queryKey: ['master-locations'],
        queryFn: () => LocationService.getAll({ limit: 1000 }),
        enabled: isOpen,
    });
    const locations = locationResponse?.items || [];

    // --------------------------------------------------------
    // Hooks
    // --------------------------------------------------------
    const {
        methods,
        formData,
        totals,
        handleAddLine,
        handleRemoveLine,
        handleLineChange,
        handleSelectCustomer,
        handleSelectProduct,
        handleSelectReservation,
    } = useSalesOrderForm({
        isOpen,
        initialData,
        currencies,
        taxCodes,
        uoms,
    });

    const { handleSubmit } = methods;

    // --------------------------------------------------------
    // Form Submit
    // --------------------------------------------------------
    const onFormSubmit = async (data: SalesOrderFormValues) => {
        setIsSubmitting(true);
        logger.debug('Submitting Sales Order:', data);
        await new Promise((r) => setTimeout(r, 1000));
        setIsSubmitting(false);
        onSuccess?.();
        onClose();
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
                        พิมพ์ใบคำสั่งขาย
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
                <button
                    type="submit"
                    form="so-form"
                    disabled={isSubmitting}
                    className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Save size={18} />
                    )}
                    {isEdit ? 'บันทึกการแก้ไข' : 'ยืนยันสร้างคำสั่งขาย'}
                </button>
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
                isEdit
                    ? 'รายละเอียดคำสั่งขาย (Sales Order)'
                    : 'สร้างคำสั่งขายใหม่ (Create Sales Order)'
            }
            headerColor="bg-emerald-600"
            footer={ModalFooter}
            titleIcon={
                <div className="bg-white/20 p-1.5 rounded shadow-sm">
                    <ShoppingCart size={16} strokeWidth={3} className="text-white" />
                </div>
            }
        >
            <FormProvider {...methods}>
                <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6">
                    <form
                        id="so-form"
                        onSubmit={handleSubmit(onFormSubmit)}
                        className="max-w-[1400px] mx-auto space-y-6"
                    >
                        {/* 1. Header */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <SalesOrderHeaderForm
                                    branches={branches}
                                    currencies={currencies}
                                    customers={customers}
                                    taxCodes={taxCodes}
                                    departments={departments}
                                    projects={projects}
                                    itemTypes={itemTypes}
                                    saleAreas={saleAreas}
                                    onSearchCustomer={() => setIsCustomerSearchOpen(true)}
                                    onSearchReservation={() => setIsReservationSearchOpen(true)}
                                />
                            </div>
                        </div>

                        {/* 2. Lines */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <SalesOrderLineTable
                                    lines={formData.lines}
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
                                />
                            </div>
                        </div>

                        {/* 3. Summary */}
                        <div className={cardClass}>
                            <div className="p-6">
                                <SalesOrderSummary
                                    subTotal={totals.subTotal}
                                    discountInput={formData.discount_input}
                                    discountAmount={formData.discount_amount}
                                    taxRate={totals.taxRate}
                                    vatAmount={totals.vatAmount}
                                    totalAmount={totals.totalAmount}
                                    currencySymbol={
                                        formData.isMulticurrency
                                            ? formData.base_currency_code || 'บาท'
                                            : 'บาท'
                                    }
                                    lineCount={formData.lines.length}
                                    onDiscountChange={(val: string) =>
                                        methods.setValue('discount_input', val, { shouldDirty: true })
                                    }
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </FormProvider>

            {/* Search Modals */}
            <CustomerSearchModal
                isOpen={isCustomerSearchOpen}
                onClose={() => setIsCustomerSearchOpen(false)}
                onSelect={handleSelectCustomer}
            />
            <ProductSearchModal
                isOpen={isProductSearchOpen}
                onClose={() => setIsProductSearchOpen(false)}
                onSelect={(product: ItemListItem) => activeLineIndex !== null && handleSelectProduct(activeLineIndex, product)}
            />
            <ReservationSearchModal
                isOpen={isReservationSearchOpen}
                onClose={() => setIsReservationSearchOpen(false)}
                onSelect={handleSelectReservation}
            />
        </WindowFormLayout>
    );
}
