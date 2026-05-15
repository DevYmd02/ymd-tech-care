/**
 * @file POFormModal.tsx
 * @description High-fidelity PO Form Modal — VQ-Style 3-column layout
 *  Line Items Table (preserved from original)
 *  Summary + Remarks
 *
 *  Business logic extracted to usePOForm hook.
 */
import { useState } from 'react';
import { FormProvider, useWatch, Controller } from 'react-hook-form';
import { SavingOverlay } from '@/shared/components/ui/feedback/SavingOverlay';
import { ProcurementFormSkeleton } from '@/modules/procurement/shared/components/ProcurementFormSkeleton';
import { ErrorBoundary } from '@/shared/components/system/ErrorBoundary';
import { 
    Save, Search, FileText,
    Loader2, Plus, X as XIcon, Printer
} from 'lucide-react';
import { POStatusBadge } from '@ui';

import { WindowFormLayout } from '@/shared/components/ui/layout/WindowFormLayout';
import { CustomDateInput } from '@ui';
import { ConfirmationModal } from '@/shared/components/system/ConfirmationModal';
import { MulticurrencyWrapper } from '@/shared/components/forms/MulticurrencyWrapper';

import { VendorSearchModal } from '@/modules/master-data/vendor/components/selector/VendorSearchModal';
import { ProductSearchModal } from './ProductSearchModal';
import { PRSearchModal } from './PRSearchModal';
import { POFormLineRow } from './POFormLineRow';
import { POSummaryPanel } from './POSummaryPanel';
// pricing utils moved to sub-components
import { cn } from '@/shared/utils';


import type { POFormData } from '@/modules/procurement/schemas/po-schemas';
import { usePOForm } from '../hooks/usePOForm';
import type {
    Currency
} from '@/modules/master-data/types/master-data-types';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';


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
    error:      'text-red-500 text-[11px] mt-1 font-semibold flex items-center gap-1',
    hint:       'text-xs text-gray-400 dark:text-gray-500 mt-1',
};

// Performance Optimized: Sub-components (POFormLineRow, POSummaryPanel) moved to separate files.

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
        handleSelectReferenceDoc,
        handleClearReference,
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
        taxCodes,
        isLoadingTaxCodes,
        existingPO,
        onClose: handleClose,
    } = usePOForm({ isOpen, onClose, onSuccess, poId, initialValues, isViewMode });

    const watchQcNo = useWatch({ control, name: 'qc_no' });
    // const watchedLines = useWatch({ control, name: 'po_lines' }); // 🚀 Optimization: Removed global watch

    // 🔒 Audit Lock: Lock prices & quantity if this PO is associated with a winning QC
    const isLockedByQC = !!watchQcNo && watchQcNo !== 'ไม่ได้ผ่าน QC';

    const isRejected = existingPO?.status === 'REJECTED';

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null);

    const handleOpenProductSearch = (index: number) => {
        setActiveSearchIndex(index);
        setIsProductModalOpen(true);
    };

    if (!isOpen) return null;

    const isView = isViewMode;

    return (
        <FormProvider {...formMethods}>
            {/* 🔍 Search Modals */}
            {/* Modals moved inside WindowFormLayout for correct Portal Stacking context */}

            {/* Modal mounted at the bottom of JSX to prevent z-index/overflow issues */}

            <WindowFormLayout
                isOpen={isOpen}
                onClose={handleClose}
                title={
                    isView 
                        ? 'รายละเอียดใบสั่งซื้อ (VIEW PO)' 
                        : poId 
                            ? 'แก้ไขใบสั่งซื้อ (EDIT PURCHASE ORDER)' 
                            : watchQcNo 
                                ? 'สร้างใบสั่งซื้อจากใบ QC (CREATE PO FROM QC)' 
                                : 'สร้างใบสั่งซื้อ (CREATE PURCHASE ORDER)'
                }
                titleIcon={
                    <div className="bg-white/20 p-1 rounded-md shadow-sm">
                        <FileText size={14} strokeWidth={3} className="text-white" />
                    </div>
                }
                headerColor="bg-blue-600"
                footer={
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-slate-100 dark:bg-gray-900 sticky bottom-0 z-10">
                        <div className="flex items-center gap-2">
                            {isView && existingPO?.status && ['APPROVED', 'PARTIAL', 'ISSUED', 'COMPLETED'].includes(existingPO.status.toUpperCase()) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                                        window.open(`${apiUrl}/po/${poId}/pdf`, '_blank');
                                    }}
                                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md text-sm font-medium flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 transition-all"
                                >
                                    <Printer size={16} /> พิมพ์ใบสั่งซื้อ
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors"
                            >
                                {isView ? 'ปิด' : 'ยกเลิก'}
                            </button>
                            {!isView && (
                                <button
                                    type="button"
                                    onClick={handleSubmit(onSubmit, onInvalidSubmit)}
                                    disabled={isHydrating || isSubmitting}
                                    className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {(isHydrating || isSubmitting) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={14} />} 
                                    {(isHydrating || isSubmitting) ? 'กำลังประมวลผล...' : (isRejected ? 'บันทึกและส่งอนุมัติใหม่' : 'บันทึก')}
                                </button>
                            )}
                        </div>
                    </div>
                }
            >
                <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6 relative">
                    <SavingOverlay isVisible={isSubmitting} />
                    {isHydrating ? (
                        <ProcurementFormSkeleton />
                    ) : (
                        <ErrorBoundary>

                    {/* ════════════════════════════════════════════════════════
                        CARD 1 — PO Header
                    ════════════════════════════════════════════════════════ */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                        <div className="p-5 space-y-4">
                            {/* Card Title */}
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                    <FileText size={18} />
                                    <span className="font-semibold">ส่วนหัวเอกสาร — Header PO (Purchase Order)</span>
                                </div>
                                {existingPO?.status && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">สถานะเอกสาร</span>
                                        <POStatusBadge status={existingPO.status} className="scale-90 shadow-sm" />
                                    </div>
                                )}
                            </div>

                            {/* ── Row 1: เลขที่ PO | วันที่ PO | อ้างอิง PR/QC ── */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className={ui.label}>เลขที่ PO </label>
                                    <input {...register('po_no')} className={ui.inputRO} readOnly placeholder="ระบบจะสร้างอัตโนมัติ" />
                                    <p className={ui.hint}>ระบบจะแสดงเลขที่เมื่อบันทึก</p>
                                </div>
                                <div>
                                    <label className={ui.label}>วันที่ PO <span className="text-red-500">*</span></label>
                                    <div className="h-8">
                                        <Controller<POFormData, 'po_date'>
                                            name="po_date"
                                            control={control}
                                            render={({ field }) => (
                                                <CustomDateInput
                                                    value={field.value || ''}
                                                    onChange={field.onChange}
                                                    disabled={isView}
                                                    className={cn(
                                                        ui.input,
                                                        errors.po_date && "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                                    )}
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
                                            <button type="button" onClick={handleClearReference}
                                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-800/50" title="ล้างข้อมูล PR">
                                                <XIcon size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className={ui.label}>อ้างอิง QC </label>
                                    <input 
                                        value={watchQcNo || (isHydrating ? "กำลังโหลด..." : (watchPrNo ? "ไม่ได้ผ่าน QC" : "-"))} 
                                        className={ui.inputRO} 
                                        readOnly 
                                        placeholder="-" 
                                    />
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
                                    <label className={ui.label}>สาขา</label>
                                    <select 
                                        {...register('branch_id', { valueAsNumber: true })} 
                                        className={cn(
                                            ui.select, 
                                            errors.branch_id && "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                        )} 
                                        disabled={isView || isLoadingBranches}
                                    >
                                        <option value="">{isLoadingBranches ? 'กำลังโหลด...' : '— เลือกสาขา —'}</option>
                                        {Array.isArray(branches) && branches.map((o) => <option key={o.branch_id} value={o.branch_id}>{o.branch_name}</option>)}
                                    </select>
                                    {errors.branch_id && <p className={ui.error}>{errors.branch_id.message}</p>}
                                </div>
                                <div>
                                    <label className={ui.label}>ผู้จัดทำ</label>
                                    <input {...register('created_by_name')} className={ui.inputRO} readOnly placeholder="-" />
                                </div>
                            </div>

                            {/* ── Row 3: เครดิตเทอม | กำหนดส่งของ | ประเภทภาษี ── */}
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
                                        <Controller<POFormData, 'delivery_date'>
                                            name="delivery_date"
                                            control={control}
                                            render={({ field }) => (
                                                <CustomDateInput 
                                                    value={field.value || ''} 
                                                    onChange={field.onChange} 
                                                    disabled={isView} 
                                                    className={cn(
                                                        ui.input, 
                                                        errors.delivery_date && "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                                    )} 
                                                />

                                            )}
                                        />
                                    </div>
                                    {errors.delivery_date && <p className={ui.error}>{errors.delivery_date.message}</p>}
                                </div>
                                <div>
                                    <label className={ui.label}>ประเภทภาษี</label>
                                    <div className="h-8">
                                        <Controller<POFormData, 'tax_code_id'>
                                            name="tax_code_id"
                                            control={control}
                                            render={({ field }) => (
                                                <select
                                                    {...field}
                                                    value={field.value || ''}
                                                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                                                    className={cn(
                                                        ui.select, 
                                                        errors.tax_code_id && "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                                    )}
                                                    disabled={isView || isLoadingTaxCodes}

                                                >
                                                    <option value="">{isLoadingTaxCodes ? 'กำลังโหลด...' : '— เลือกประเภทภาษี —'}</option>
                                                    {Array.isArray(taxCodes) && taxCodes.map((o: TaxCode) => (
                                                        <option key={o.tax_code_id} value={o.tax_code_id}>
                                                            {o.tax_code}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        />
                                    </div>
                                    {errors.tax_code_id && <p className={ui.error}>{errors.tax_code_id.message}</p>}
                                </div>

                            </div>

                            {/* ── Row 4: Currency Detail Fields (Conditional via MulticurrencyWrapper) ── */}
                            <MulticurrencyWrapper
                                name="is_multicurrency"
                                label="ระบุสกุลเงินต่างประเทศ (Multicurrency)"
                                control={control}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg">
                                    <div>
                                        <label className={ui.label}>วันที่อัตราแลกเปลี่ยน</label>
                                        <div className="h-8">
                                            <Controller<POFormData, 'exchange_rate_date'>
                                                name="exchange_rate_date"
                                                control={control}
                                                render={({ field }) => (
                                                    <CustomDateInput 
                                                        value={field.value || ''} 
                                                        onChange={field.onChange} 
                                                        disabled={isView} 
                                                        className={cn(
                                                            ui.input,
                                                            errors.exchange_rate_date && "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                                        )} 
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={ui.label}>รหัสสกุลเงิน <span className="text-red-500">*</span></label>
                                        <select 
                                            {...register('currency_code')} 
                                            className={cn(
                                                ui.select,
                                                errors.currency_code && "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                            )} 
                                            disabled={isView || isLoadingCurrencies}
                                        >
                                            <option value="">{isLoadingCurrencies ? 'โหลด...' : 'เลือกสกุลเงิน'}</option>
                                            {Array.isArray(currencies) && currencies.map((o: Currency) => <option key={o.currency_code} value={o.currency_code}>{o.currency_code} - {o.name_th}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={ui.label}>ไปที่สกุลเงิน (Target)</label>
                                        <select 
                                            {...register('target_currency')} 
                                            className={cn(
                                                ui.select,
                                                errors.target_currency && "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                            )} 
                                            disabled={isView || isLoadingCurrencies}
                                        >
                                            <option value="">{isLoadingCurrencies ? 'โหลด...' : 'เลือกสกุลเงิน'}</option>
                                            {Array.isArray(currencies) && currencies.map((o: Currency) => <option key={o.currency_code} value={o.currency_code}>{o.currency_code} - {o.name_th}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={ui.label}>อัตราแลกเปลี่ยน <span className="text-red-500">*</span></label>
                                        <input 
                                            type="number" step="0.0001" 
                                            {...register('exchange_rate', { valueAsNumber: true })} 
                                            className={cn(
                                                ui.input,
                                                errors.exchange_rate && "border-red-500 focus:ring-red-500/20 focus:border-red-500"
                                            )}
                                            disabled={isView}
                                            placeholder="1"
                                        />
                                        {errors.exchange_rate && <p className={ui.error}>{errors.exchange_rate.message}</p>}
                                    </div>
                                </div>
                            </MulticurrencyWrapper>

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
                                {!isView && !isLockedByQC && (
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
                                            {!isView && !isLockedByQC && <th className="px-2 py-2 text-center w-12 text-[11px] uppercase tracking-wider"></th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                            {fields.length === 0 && (
                                            <tr>
                                                <td colSpan={isView || isLockedByQC ? 10 : 11} className="px-4 py-12 text-center text-gray-400">
                                                    <FileText size={40} className="mx-auto mb-2 text-gray-300" />
                                                    <p>ยังไม่มีรายการสินค้า</p>
                                                    {!isView && !isLockedByQC && (
                                                        <button type="button" onClick={handleAddLine} className="text-blue-500 hover:underline text-sm mt-1">
                                                            คลิกเพื่อเพิ่มรายการ
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                        {fields.map((field, idx) => (
                                            <POFormLineRow
                                                key={field.id}
                                                idx={idx}
                                                isView={isView}
                                                isLockedByQC={isLockedByQC}
                                                isLoadingUnits={isLoadingUnits}
                                                units={units}
                                                handleOpenProductSearch={handleOpenProductSearch}
                                                remove={remove}
                                                handleAddLine={handleAddLine}
                                                register={register}
                                                errors={errors}
                                                setValue={setValue}
                                                control={control}
                                            />
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
                            <POSummaryPanel control={control} taxCodes={taxCodes} isView={isView} />
                        </div>
                    </div>

                    {/* ── Modals Inside WindowFormLayout for Portal Stacking ── */}
                    <PRSearchModal
                        isOpen={isPRModalOpen}
                        onClose={() => setIsPRModalOpen(false)}
                        onSelect={(record) => {
                            const firstQC = record.qcHeaders?.[0];
                            if (firstQC) {
                                handleSelectReferenceDoc(
                                    record.pr_id, 
                                    'QC', 
                                    firstQC.qc_id, 
                                    firstQC.winning_vendor_id ? Number(firstQC.winning_vendor_id) : undefined, 
                                    firstQC.winning_vq_id ? Number(firstQC.winning_vq_id) : undefined, 
                                    firstQC.qc_no, 
                                    record.approval_no || undefined
                                );
                            } else {
                                handleSelectReferenceDoc(record.pr_id, 'PR', undefined, undefined, undefined, undefined, record.approval_no || undefined);
                            }
                            setIsPRModalOpen(false);
                        }}
                    />


                    <VendorSearchModal
                        isOpen={isVendorModalOpen}
                        onClose={() => setIsVendorModalOpen(false)}
                        onSelect={handleVendorSelect}
                    />

                    <ConfirmationModal
                        isOpen={isConfirmModalOpen}
                        onClose={() => setIsConfirmModalOpen(false)}
                        onConfirm={handleConfirmSave}
                        title="ยืนยันการบันทึกใบสั่งซื้อ"
                        description="คุณต้องการบันทึกข้อมูลใบสั่งซื้อนี้ใช่หรือไม่? เมื่อบันทึกแล้วระบบจะสร้างเลขที่เอกสารอัตโนมัติ"
                    />

                    <ProductSearchModal
                        isOpen={isProductModalOpen}
                        onClose={() => setIsProductModalOpen(false)}
                        onSelect={(product) => {
                            if (activeSearchIndex !== null) {
                                handleSelectItemMaster(activeSearchIndex, product);
                            }
                            setIsProductModalOpen(false);
                        }}
                    />
                    </ErrorBoundary>
            )}
        </div>
    </WindowFormLayout>
        </FormProvider>
    );
}