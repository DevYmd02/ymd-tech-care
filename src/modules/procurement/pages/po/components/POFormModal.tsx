/**
 * @file POFormModal.tsx
 * @description High-fidelity PO Form Modal — VQ-Style 3-column layout
 *  Line Items Table (preserved from original)
 *  Summary + Remarks
 *
 *  Business logic extracted to usePOForm hook.
 */
import { useMemo, useState } from 'react';
import { FormProvider, useWatch, Controller, type Control } from 'react-hook-form';
import { 
    Save, Search, Trash2, FileText,
    Loader2, Plus, X as XIcon
} from 'lucide-react';

import { WindowFormLayout } from '@/shared/components/ui/layout/WindowFormLayout';
import { CustomDateInput } from '@/shared/components/forms/CustomDateInput';
import { ConfirmationModal } from '@/shared/components/system/ConfirmationModal';
import { VendorSearchModal } from '@/modules/master-data/vendor/components/selector/VendorSearchModal';
import { ProductSearchModal } from '@/modules/master-data/inventory/components/ProductSearchModal';
import { DocumentSourceSelectorModal } from './DocumentSourceSelectorModal';
import { calculatePricingSummary } from '@/modules/procurement/utils/pricing.utils';

import type { POFormData, POLine } from '@/modules/procurement/schemas/po-schemas';
import { usePOForm } from '../hooks/usePOForm';
import type {
    BranchListItem,
    WarehouseListItem,
    UnitListItem,
    Currency
} from '@/modules/master-data/types/master-data-types';


// Mock constants removed. Data is now fetched via hooks in usePOForm.

// ====================================================================================
// STYLE CONSTANTS  (Match VQ pattern, blue accent for PO module)
// ====================================================================================

// Local Tailwind shorthand (renamed to avoid conflict with CSS module import 's')
const ui = {
    label:      'text-sm font-medium text-blue-700 dark:text-blue-300 mb-1 block',
    input:      'w-full h-8 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed',
    inputRO:    'w-full h-8 px-3 text-sm bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg cursor-not-allowed font-medium',
    select:     'w-full h-8 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed',
    searchBtn:  'px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shrink-0 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1',
    error:      'text-red-500 text-[10px] mt-0.5 font-medium',
    hint:       'text-xs text-gray-400 dark:text-gray-500 mt-1',
};

// ====================================================================================
// SUB-COMPONENT: Row Total (isolated watch for performance)
// ====================================================================================

const RowTotal = ({ control, index }: { control: Control<POFormData>; index: number }) => {
    const qty   = useWatch({ control, name: `po_lines.${index}.qty_ordered` }) ?? 0;
    const price = useWatch({ control, name: `po_lines.${index}.unit_price` }) ?? 0;
    const disc  = useWatch({ control, name: `po_lines.${index}.discount_amount` }) ?? 0;
    const total = qty * price - disc;
    return <>{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
};

// ====================================================================================
// SUB-COMPONENT: Summary Panel
// ====================================================================================

const POSummaryPanel = ({ control }: { control: Control<POFormData> }) => {
    const poLines = useWatch({ control, name: 'po_lines' });
    const { beforeTax, taxAmount, totalAmount } = useMemo(() => {
        const items = (poLines ?? []).map((l: POLine) => ({
            qty:        Number(l.qty_ordered || l.qty),
            unit_price: Number(l.unit_price),
            discount:   Number(l.discount_amount || 0),
        }));
        return calculatePricingSummary(items, 7, false);
    }, [poLines]);

    return (
        <div className="w-80 space-y-3 bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">รวมเป็นเงิน</span>
                <span className="font-medium text-gray-900 dark:text-white">
                    {beforeTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">ภาษีมูลค่าเพิ่ม 7%</span>
                <span className="font-medium text-gray-900 dark:text-white">
                    {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
            <div className="border-t border-gray-200 dark:border-slate-700 pt-3 flex justify-between items-baseline">
                <span className="text-base font-bold text-gray-800 dark:text-slate-200">รวมสุทธิ</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
        </div>
    );
};

// ====================================================================================
// PROPS
// ====================================================================================

interface POFormModalProps {
    isOpen:         boolean;
    onClose:        () => void;
    onSuccess?:     () => void;
    /** Post ID for edit/view */
    poId?:          number;
    /** Pre-fill from QC winner selection */
    initialValues?: Partial<POFormData>;
    /** Read-only view */
    isViewMode?:    boolean;
}

// ====================================================================================
// MAIN MODAL
// ====================================================================================

export default function POFormModal({
    isOpen,
    onClose,
    onSuccess,
    poId,
    initialValues,
    isViewMode = false,
}: POFormModalProps) {

    const {
        formMethods,
        control,
        register,
        handleSubmit,
        errors,
        fields, // This is from useFieldArray, which uses 'po_lines'
        remove,
        setValue,
        watchVendorName,
        watchPrNo,
        watchCurrencyCode,
        watchIsMulticurrency,
        handleSelectReferenceDoc,
        handleVendorSelect,
        handleAddLine,
        onSubmit,
        onInvalidSubmit,
        isVendorModalOpen,
        setIsVendorModalOpen,
        isPRModalOpen,
        setIsPRModalOpen,
        isHydrating,
        // Data
        branches,
        isLoadingBranches,
        warehouses,
        isLoadingWarehouses,
        currencies,
        isLoadingCurrencies,
        handleSelectItemMaster,
        isInherited,
        // Confirmation Flow
        handleConfirmSave,
        isConfirmModalOpen,
        setIsConfirmModalOpen,
        isSubmitting,
        units,
        isLoadingUnits,
    } = usePOForm({ isOpen, onClose, onSuccess, poId, initialValues, isViewMode });

    const [itemSearchConfig, setItemSearchConfig] = useState({ isOpen: false, index: -1 });

    if (!isOpen) return null;

    const isView = isViewMode;

    return (
        <FormProvider {...formMethods}>
            {/* 🔍 Search Modals */}
            <DocumentSourceSelectorModal
                isOpen={isPRModalOpen}
                onClose={() => setIsPRModalOpen(false)}
                onSelectSource={(sourceType, prId, qcId, vendorId, winningVqId) => {
                    if (prId) {
                        const type = sourceType === 'QC' ? 'QC' : 'PR';
                        handleSelectReferenceDoc(prId, type, qcId, vendorId, winningVqId);
                    }
                    setIsPRModalOpen(false);
                }}
            />

            <VendorSearchModal
                isOpen={isVendorModalOpen}
                onClose={() => setIsVendorModalOpen(false)}
                onSelect={handleVendorSelect}
            />

            <ProductSearchModal
                isOpen={itemSearchConfig.isOpen}
                onClose={() => setItemSearchConfig({ ...itemSearchConfig, isOpen: false })}
                onSelect={(product) => {
                    handleSelectItemMaster(itemSearchConfig.index, product);
                    setItemSearchConfig({ ...itemSearchConfig, isOpen: false });
                }}
            />

            <WindowFormLayout
                isOpen={isOpen}
                onClose={onClose}
                title={isView ? 'รายละเอียดใบสั่งซื้อ (VIEW PO)' : 'สร้างใบสั่งซื้อ (CREATE PURCHASE ORDER)'}
                titleIcon={
                    <div className="bg-white/20 p-1 rounded-md shadow-sm">
                        <FileText size={14} strokeWidth={3} className="text-white" />
                    </div>
                }
                headerColor="bg-blue-600"
                footer={
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end items-center bg-slate-100 dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors"
                        >
                            {isView ? 'ปิด' : 'ยกเลิก'}
                        </button>
                        {!isView && (
                            <button
                                type="button"
                                onClick={handleSubmit(onSubmit, onInvalidSubmit)}
                                disabled={isHydrating}
                                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isHydrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={14} />} 
                                {isHydrating ? 'กำลังประมวลผล...' : 'บันทึก'}
                            </button>
                        )}
                    </div>
                }
            >
                <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6">

                    {/* ════════════════════════════════════════════════════════
                        CARD 1 — PO Header
                    ════════════════════════════════════════════════════════ */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                        <div className="p-5 space-y-4">
                            {/* Card Title */}
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 border-b border-gray-200 dark:border-gray-700 pb-3">
                                <FileText size={18} />
                                <span className="font-semibold">ส่วนหัวเอกสาร — Header PO (Purchase Order)</span>
                            </div>

                            {/* ── Row 1: เลขที่ PO | วันที่ PO | อ้างอิง PR/QC ── */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={ui.label}>เลขที่ PO </label>
                                    <input {...register('po_no')} className={ui.inputRO} readOnly placeholder="ระบบจะสร้างอัตโนมัติ" />
                                    <p className={ui.hint}>ระบบจะแสดงเลขที่เมื่อบันทึก</p>
                                </div>
                                <div>
                                    <label className={ui.label}>วันที่ PO <span className="text-red-500">*</span></label>
                                    <div className="h-8">
                                        <Controller
                                            name="po_date"
                                            control={control}
                                            render={({ field }) => (
                                                <CustomDateInput
                                                    value={field.value || ''}
                                                    onChange={field.onChange}
                                                    disabled={isView}
                                                    className={`${ui.input} ${errors.po_date ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                                />
                                            )}
                                        />
                                    </div>
                                    {errors.po_date && <p className={ui.error}>{errors.po_date.message}</p>}
                                </div>
                                <div>
                                    <label className={ui.label}>อ้างอิง PR </label>
                                    <div className="flex gap-2">
                                        <input {...register('pr_no')} className={ui.inputRO} readOnly placeholder="PR2024-xxx" />
                                        {!isView && (
                                            <button 
                                                type="button" 
                                                title="ค้นหา PR" 
                                                className={ui.searchBtn} 
                                                onClick={() => setIsPRModalOpen(true)}
                                                disabled={isHydrating}
                                            >
                                                {isHydrating ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                            </button>
                                        )}
                                        {watchPrNo && !isView && (
                                            <button type="button" onClick={() => { setValue('pr_id', undefined); setValue('pr_no', ''); }}
                                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-800/50" title="ล้างข้อมูล PR">
                                                <XIcon size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Row 2: ผู้ขาย | สาขา | คลังสินค้าปลายทาง ── */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={ui.label}>ผู้ขาย <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <input value={watchVendorName ?? ''} readOnly className={`flex-1 ${ui.inputRO}`} placeholder="-- เลือกผู้ขาย --" />
                                        {!isView && (
                                            <button 
                                                type="button" 
                                                onClick={() => setIsVendorModalOpen(true)} 
                                                className={ui.searchBtn}
                                                disabled={isInherited}
                                                title={isInherited ? "ไม่สามารถเปลี่ยนผู้ขายได้เนื่องจากสืบทอดมาจากใบเสนอราคา" : "เลือกผู้ขาย"}
                                            >
                                                <Search size={14} /> เลือก
                                            </button>
                                        )}
                                    </div>
                                    {errors.vendor_id && <p className={ui.error}>{errors.vendor_id.message}</p>}
                                </div>
                                <div>
                                    <label className={ui.label}>สาขา <span className="text-red-500">*</span></label>
                                    <select {...register('branch_id', { valueAsNumber: true })} className={`${ui.select} ${errors.branch_id ? 'border-red-500' : ''}`} disabled={isView || isLoadingBranches}>
                                        <option value="">{isLoadingBranches ? 'กำลังโหลด...' : '— เลือกสาขา —'}</option>
                                        {branches.map((o: BranchListItem) => <option key={o.branch_id} value={o.branch_id}>{o.branch_name}</option>)}
                                    </select>
                                    {errors.branch_id && <p className={ui.error}>{errors.branch_id.message}</p>}
                                </div>
                                <div>
                                    <label className={ui.label}>คลังสินค้าปลายทาง <span className="text-red-500">*</span></label>
                                    <select {...register('ship_to_warehouse_id', { valueAsNumber: true })} className={`${ui.select} ${errors.ship_to_warehouse_id ? 'border-red-500' : ''}`} disabled={isView || isLoadingWarehouses}>
                                        <option value="">{isLoadingWarehouses ? 'กำลังโหลด...' : '— เลือกคลังสินค้า —'}</option>
                                        {warehouses.map((o: WarehouseListItem) => <option key={o.warehouse_id} value={o.warehouse_id}>{o.warehouse_name}</option>)}
                                    </select>
                                    {errors.ship_to_warehouse_id && <p className={ui.error}>{errors.ship_to_warehouse_id.message}</p>}
                                </div>
                            </div>

                            {/* ── Row 3: เครดิตเทอม | กำหนดส่งของ | -- ช่องว่าง -- ── */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={ui.label}>เครดิตเทอม (วัน)</label>
                                    <input type="number" {...register('payment_term_days', { valueAsNumber: true })}
                                        className={`${ui.input} text-right`} disabled={isView} placeholder="30" />
                                    {errors.payment_term_days && <p className={ui.error}>{errors.payment_term_days.message}</p>}
                                </div>
                                <div>
                                    <label className={ui.label}>กำหนดส่งของ</label>
                                    <div className="h-8">
                                        <Controller
                                            name="delivery_date"
                                            control={control}
                                            render={({ field }) => (
                                                <CustomDateInput 
                                                    value={field.value || ''} 
                                                    onChange={field.onChange} 
                                                    disabled={isView} 
                                                    className={`${ui.input} ${errors.delivery_date ? 'border-red-500 ring-1 ring-red-500' : ''}`} 
                                                />
                                            )}
                                        />
                                    </div>
                                    {errors.delivery_date && <p className={ui.error}>{errors.delivery_date.message}</p>}
                                </div>
                                <div>
                                    {/* Tax code removed from header as requested */}
                                </div>
                            </div>

                            {/* ── Row 4: Multicurrency Toggle (full-width) ── */}
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="is_multicurrency"
                                    {...register('is_multicurrency')}
                                    disabled={isView}
                                    className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
                                />
                                <label htmlFor="is_multicurrency" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                    ระบุสกุลเงินต่างประเทศ (Multicurrency)
                                </label>
                                {!watchIsMulticurrency && (
                                    <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                                        สกุลเงินปัจจุบัน: <strong className="text-gray-600 dark:text-gray-300">THB - บาท</strong>
                                    </span>
                                )}
                            </div>

                            {/* ── Row 5: Multicurrency Detail Fields (conditional) ── */}
                            {watchIsMulticurrency && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/50 rounded-lg">
                                    <div>
                                        <label className={ui.label}>วันที่อัตราแลกเปลี่ยน</label>
                                        <div className="h-8">
                                            <Controller
                                                name="exchange_rate_date"
                                                control={control}
                                                render={({ field }) => (
                                                    <CustomDateInput value={field.value || ''} onChange={field.onChange} disabled={isView} className={ui.input} />
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={ui.label}>รหัสสกุลเงิน <span className="text-red-500">*</span></label>
                                        <select {...register('currency_code')} className={ui.select} disabled={isView || isLoadingCurrencies}>
                                            <option value="">{isLoadingCurrencies ? 'โหลด...' : 'เลือก'}</option>
                                            {currencies.map((o: Currency) => <option key={o.currency_code} value={o.currency_code}>{o.currency_code} - {o.name_en}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={ui.label}>ไปที่สกุลเงิน (Target)</label>
                                        <select {...register('target_currency')} className={ui.select} disabled={isView || isLoadingCurrencies}>
                                            <option value="">{isLoadingCurrencies ? 'โหลด...' : 'เลือกสกุลเงิน'}</option>
                                            {currencies.filter((o: Currency) => o.currency_code !== watchCurrencyCode).map((o: Currency) => <option key={o.currency_code} value={o.currency_code}>{o.currency_code} - {o.name_en}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={ui.label}>อัตราแลกเปลี่ยน <span className="text-red-500">*</span></label>
                                        <input type="number" step="0.0001" {...register('exchange_rate', { valueAsNumber: true })}
                                            className={`${ui.input} text-right`} disabled={isView} placeholder="1" />
                                        {errors.exchange_rate && <p className={ui.error}>{errors.exchange_rate.message}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ════════════════════════════════════════════════════════
                        CARD 2 — Line Items
                    ════════════════════════════════════════════════════════ */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                        <div className="p-4">
                            {/* Card Title */}
                            <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                    <FileText size={18} />
                                    <span className="font-semibold">รายการสินค้า — Line Items</span>
                                </div>
                                {!isView && (
                                    <button
                                        type="button"
                                        onClick={handleAddLine}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
                                    >
                                        <Plus size={16} /> เพิ่มรายการ
                                    </button>
                                )}
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                                <table className="w-full min-w-[1200px] border-collapse bg-white dark:bg-gray-900 text-sm border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[13px] dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800">
                                        <tr>
                                            <th className="px-2 py-2 text-center w-12 border-r border-slate-200 dark:border-slate-800">ลำดับ</th>
                                            <th className="px-3 py-2 text-left w-56 border-r border-slate-200 dark:border-slate-800 font-medium">
                                                รหัสสินค้า <br />
                                            </th>
                                            <th className="px-3 py-2 text-left w-64 border-r border-slate-200 dark:border-slate-800 font-medium whitespace-nowrap">
                                                ชื่อสินค้า/บริการ<br />
                                            </th>
                                            <th className="px-2 py-2 text-center w-24 border-r border-slate-200 dark:border-slate-800 font-medium">
                                                จำนวนสั่ง<br />
                                            </th>
                                            <th className="px-2 py-2 text-center w-20 border-r border-slate-200 dark:border-slate-800 font-medium">
                                                หน่วย<br />
                                            </th>
                                            <th className="px-2 py-2 text-center w-28 border-r border-slate-200 dark:border-slate-800 font-medium">
                                                ราคา/หน่วย<br />
                                            </th>
                                            <th className="px-2 py-2 text-center w-24 border-r border-slate-200 dark:border-slate-800 font-medium">
                                                ส่วนลด<br />
                                            </th>
                                            <th className="px-2 py-2 text-center w-32 border-r border-slate-200 dark:border-slate-800 font-medium">
                                                ยอดสุทธิ<br />
                                            </th>
                                            <th className="px-2 py-2 text-center w-28 border-r border-slate-200 dark:border-slate-800 font-medium">
                                                ประเภท<br />
                                            </th>
                                            {!isView && <th className="px-2 py-2 text-center w-12"></th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields.length === 0 && (
                                            <tr>
                                                <td colSpan={isView ? 10 : 11} className="px-4 py-12 text-center text-gray-400">
                                                    <FileText size={40} className="mx-auto mb-2 text-gray-300" />
                                                    <p>ยังไม่มีรายการสินค้า</p>
                                                    {!isView && (
                                                        <button type="button" onClick={handleAddLine} className="text-blue-500 hover:underline text-sm mt-1">
                                                            คลิกเพื่อเพิ่มรายการ
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                        {fields.map((field: POLine & { id: string }, idx: number) => (
                                            <tr key={field.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-3 py-2 text-center text-[13px] text-gray-600 font-medium border-r border-gray-200 dark:border-gray-700">{idx + 1}</td>
                                                <td className="px-1.5 py-1 border-r border-gray-200 dark:border-gray-700">
                                                    <div className="flex gap-1.5 items-stretch">
                                                        <input
                                                            value={field.code || field.item_code || ''}
                                                            className={`${ui.inputRO} flex-1 !h-9 text-[13px] shadow-sm`}
                                                            placeholder="ค้นหารหัส..."
                                                            readOnly
                                                        />
                                                        {/* Hidden fields needed for form submission/State sync */}
                                                        <input type="hidden" {...register(`po_lines.${idx}.item_code`)} />
                                                        <input type="hidden" {...register(`po_lines.${idx}.id`)} />
                                                        <input type="hidden" {...register(`po_lines.${idx}.item_id`)} />
                                                        <input type="hidden" {...register(`po_lines.${idx}.item_name`)} />
                                                        {!isView && (
                                                            <button
                                                                type="button"
                                                                className="px-2.5 bg-slate-50 border border-slate-300 rounded hover:bg-slate-100 shadow-sm shrink-0 transition-colors"
                                                                title="ค้นหาสินค้า"
                                                                onClick={() => {
                                                                    setItemSearchConfig({ isOpen: true, index: idx });
                                                                }}
                                                            >
                                                                <Search size={15} className="text-slate-600" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {errors?.po_lines?.[idx]?.item_id && (
                                                        <p className={ui.error}>{errors.po_lines[idx]?.item_id?.message}</p>
                                                    )}
                                                </td>
                                                <td className="px-1.5 py-1 border-r border-gray-200 dark:border-gray-700">
                                                    <input
                                                        {...register(`po_lines.${idx}.description`)}
                                                        className={`${ui.input} !h-9 text-[13px] border-slate-300 shadow-sm`}
                                                        placeholder="รายละเอียดเพิ่มเติม"
                                                        readOnly={isView}
                                                    />
                                                </td>
                                                <td className="px-1.5 py-1 border-r border-gray-200 dark:border-gray-700">
                                                    <input
                                                        type="number" step="any"
                                                        {...register(`po_lines.${idx}.qty_ordered`, { valueAsNumber: true })}
                                                        className={`${ui.input} !h-9 text-center text-[13px] border-slate-300 shadow-sm`}
                                                        placeholder="0.000"
                                                        readOnly={isView}
                                                    />
                                                </td>
                                                <td className="px-1.5 py-1 border-r border-gray-200 dark:border-gray-700">
                                                    <select
                                                        {...register(`po_lines.${idx}.uom_id`, { valueAsNumber: true })}
                                                        className={`${ui.select} !h-9 text-center px-1 text-[13px] border-slate-300 shadow-sm`}
                                                        disabled={isView || isLoadingUnits}
                                                    >
                                                        <option value="">{isLoadingUnits ? 'โหลด...' : 'หน่วย'}</option>
                                                        {units.map((u: UnitListItem) => <option key={u.uom_id} value={u.uom_id}>{u.uom_name || u.unit_name}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-1.5 py-1 border-r border-gray-200 dark:border-gray-700">
                                                    <input
                                                        type="number" step="any"
                                                        {...register(`po_lines.${idx}.unit_price`, { valueAsNumber: true })}
                                                        className={`${ui.input} !h-9 text-right text-[13px] border-slate-300 shadow-sm`}
                                                        placeholder="0.0000"
                                                        readOnly={isView}
                                                    />
                                                </td>
                                                <td className="px-1.5 py-1 border-r border-gray-200 dark:border-gray-700">
                                                    <input
                                                        type="number" step="any"
                                                        {...register(`po_lines.${idx}.discount_amount`, { valueAsNumber: true })}
                                                        className={`${ui.input} !h-9 text-right text-[13px] border-slate-300 shadow-sm`}
                                                        placeholder="0.00"
                                                        readOnly={isView}
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right font-semibold text-slate-800 dark:text-slate-200 border-r border-gray-200 dark:border-gray-700 text-[13px] bg-slate-50/50 dark:bg-slate-900/50">
                                                    <RowTotal control={control} index={idx} />
                                                </td>
                                                <td className="px-1.5 py-1 border-r border-gray-200 dark:border-gray-700">
                                                    <select
                                                        {...register(`po_lines.${idx}.receipt_type`)}
                                                        className={`${ui.select} !h-9 text-center px-1 text-[13px] border-slate-300 shadow-sm bg-white dark:bg-slate-800`}
                                                        disabled={isView}
                                                    >
                                                        <option value="GOODS">GOODS</option>
                                                        <option value="SERVICE">SERVICE</option>
                                                    </select>
                                                </td>
                                                {!isView && (
                                                    <td className="px-1 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={handleAddLine}
                                                                className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-full transition-colors"
                                                                title="เพิ่มรายการ"
                                                            >
                                                                <Plus size={16} strokeWidth={2.5} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => remove(idx)}
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                                                                title="ลบรายการ"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Items error */}
                            {errors.po_lines && (
                                <p className="px-2 pt-2 text-red-500 text-sm">
                                    {errors.po_lines.root?.message ?? errors.po_lines.message}
                                </p>
                            )}
                        </div>

                        {/* Summary Footer */}
                        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 flex justify-end">
                            <POSummaryPanel control={control} />
                        </div>
                    </div>
                </div>
            </WindowFormLayout>

            {/* ── Confirmation Modal ────────────────────────────────────────── */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmSave}
                title="ยืนยันการบันทึกใบสั่งซื้อ"
                description="คุณต้องการบันทึกข้อมูลใบสั่งซื้อนี้ใช่หรือไม่? เมื่อบันทึกแล้วระบบจะสร้างเลขที่เอกสารอัตโนมัติ"
                confirmText="ยืนยันบันทึก"
                cancelText="ยกเลิก"
                variant="info"
                isLoading={isSubmitting}
            />
        </FormProvider>
    );
}