/**
 * @file POFormModal.tsx
 * @description High-fidelity PO Form Modal — VQ-Style 3-column layout
 *
 * Layout:
 *  ┌────────────────────────────────────────────────────────────────────────┐
 *  │ Header Card (Blue accent)                                              │
 *  │  Row 1: [เลขที่ PO (auto)] | [วันที่ PO] | [อ้างอิง PR + 🔍]         │
 *  │  Row 2: [ผู้ขาย + 🔍] | [สาขา (select)] | [คลังสินค้าปลายทาง]        │
 *  │  Row 3: [สกุลเงิน]    | [อัตราแลกเปลี่ยน] | [เครดิตเทอม (วัน)]      │
 *  └────────────────────────────────────────────────────────────────────────┘
 *  Line Items Table (preserved from original)
 *  Summary + Remarks
 */

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import type { Control, SubmitHandler, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Plus, Trash2, Search, Save, X as XIcon } from 'lucide-react';
import { WindowFormLayout } from '@ui';
import { POService, VQService } from '@/modules/procurement/services';
import { VendorSearchModal } from '@/modules/master-data/vendor/components/selector/VendorSearchModal';
import type { VendorSearchItem } from '@/modules/master-data/vendor/types/vendor-types';
import { POFormSchema } from '@/modules/procurement/schemas/po-schemas';
import type { POFormData } from '@/modules/procurement/schemas/po-schemas';
import { calculatePricingSummary } from '@/modules/procurement/utils/pricing.utils';
import { logger } from '@/shared/utils/logger';

// ====================================================================================
// STATIC OPTIONS  (branch & warehouse until master-data APIs are wired)
// ====================================================================================

const BRANCH_OPTIONS = [
    { value: '1', label: 'สำนักงานใหญ่ (HQ)' },
    { value: '2', label: 'สาขา สีลม' },
    { value: '3', label: 'สาขา อโศก' },
    { value: '4', label: 'สาขา ลาดพร้าว' },
];

const WAREHOUSE_OPTIONS = [
    { value: 'wh-001', label: 'คลังสินค้าหลัก (Main Warehouse)' },
    { value: 'wh-002', label: 'คลังสินค้าย่อย (Sub Warehouse)' },
    { value: 'wh-003', label: 'คลังสินค้าชั่วคราว (Temp)' },
];

const CURRENCY_OPTIONS = [
    { value: 'THB', label: 'THB - บาท' },
    { value: 'USD', label: 'USD - ดอลลาร์สหรัฐ' },
    { value: 'EUR', label: 'EUR - ยูโร' },
    { value: 'JPY', label: 'JPY - เยน' },
    { value: 'SGD', label: 'SGD - ดอลลาร์สิงคโปร์' },
    { value: 'CNY', label: 'CNY - หยวน' },
];

// ====================================================================================
// STYLE CONSTANTS  (Match VQ pattern, blue accent for PO module)
// ====================================================================================

const s = {
    label:      'text-sm font-medium text-blue-700 dark:text-blue-300 mb-1 block',
    input:      'w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed',
    inputRO:    'w-full h-8 px-3 text-sm bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed font-medium',
    select:     'w-full h-8 px-3 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed',
    searchBtn:  'px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shrink-0 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1',
    error:      'text-red-500 text-[10px] mt-0.5 font-medium',
    hint:       'text-xs text-gray-400 dark:text-gray-500 mt-1',
};

// ====================================================================================
// SUB-COMPONENT: Row Total (isolated watch for performance)
// ====================================================================================

const RowTotal = ({ control, index }: { control: Control<POFormData>; index: number }) => {
    const qty   = useWatch({ control, name: `lines.${index}.qty` }) ?? 0;
    const price = useWatch({ control, name: `lines.${index}.unit_price` }) ?? 0;
    const disc  = useWatch({ control, name: `lines.${index}.discount_amount` }) ?? 0;
    const total = qty * price - disc;
    return <>{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
};

// ====================================================================================
// SUB-COMPONENT: Summary Panel
// ====================================================================================

const POSummaryPanel = ({ control }: { control: Control<POFormData> }) => {
    const lines = useWatch({ control, name: 'lines' });
    const { beforeTax, taxAmount, totalAmount } = useMemo(() => {
        const items = (lines ?? []).map(l => ({
            qty:        Number(l?.qty),
            unit_price: Number(l?.unit_price),
            discount:   Number(l?.discount_amount),
        }));
        return calculatePricingSummary(items, 7, false);
    }, [lines]);

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
    initialValues,
    isViewMode = false,
}: POFormModalProps) {

    // ── UI state ──────────────────────────────────────────────────────────────
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

    // ── Form ──────────────────────────────────────────────────────────────────
    const {
        control,
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<POFormData>({
        resolver: zodResolver(POFormSchema) as Resolver<POFormData>,
        defaultValues: {
            po_no:                '',
            po_date:              new Date().toISOString().split('T')[0],
            qc_id:                '',
            qc_no:                '',
            pr_id:                '',
            pr_no:                '',
            vendor_id:            '',
            vendor_name:          '',
            branch_id:            '',
            ship_to_warehouse_id: '',
            currency_code:        'THB',      // Default: THB
            exchange_rate:        1,          // Default: 1
            payment_term_days:    30,         // Default: 30 days
            remarks:              '',
            lines:                [],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

    const watchVendorName   = useWatch({ control, name: 'vendor_name' });
    const watchPrNo         = useWatch({ control, name: 'pr_no' });
    const watchCurrencyCode = useWatch({ control, name: 'currency_code' });

    // [Cross-Module State Sync]: The Inheritance Enforcer
    // Natively fetches the exact Quotation layout from the prior VQ process
    const { data: inheritedVQ } = useQuery({
        queryKey: ['inherit-vq', initialValues?.qc_id, initialValues?.vendor_id],
        queryFn: async () => {
            if (!initialValues?.qc_id || !initialValues?.vendor_id) return null;
            const res = await VQService.getList({}); // VQ Service handles mocks, fetch all matching VQs manually or properly via params 
            const sourceVQ = res.data.find(vq => vq.qc_id === initialValues.qc_id && vq.vendor_id === initialValues.vendor_id);
            if (sourceVQ?.quotation_id) {
                // Must fetch to get items detail
                return await VQService.getById(sourceVQ.quotation_id);
            }
            return null;
        },
        enabled: isOpen && !!initialValues?.qc_id && !!initialValues?.vendor_id && (!initialValues?.lines || initialValues.lines.length === 0)
    });

    // ── Effects ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            // Priority: Inherited VQ Lines > Provided Values > Empty Array
            const initialLines = inheritedVQ?.lines?.map((l: any) => ({
                item_code:       l.item_code || '',
                item_name:       l.item_name || '',
                qty:             l.qty || 1,
                unit_price:      l.unit_price || 0,
                discount_amount: l.discount_amount || 0,
                uom_name:        l.uom_name || 'PCS',
                line_total:      l.net_amount || 0,
            })) || initialValues?.lines || [];

            reset({
                po_no:                initialValues?.po_no                ?? '',
                po_date:              initialValues?.po_date              ?? new Date().toISOString().split('T')[0],
                qc_id:                initialValues?.qc_id                ?? '',
                qc_no:                initialValues?.qc_no                ?? '',
                pr_id:                inheritedVQ?.pr_id                  || initialValues?.pr_id || '',
                pr_no:                inheritedVQ?.pr_no                  || initialValues?.pr_no || '',
                vendor_id:            initialValues?.vendor_id            ?? '',
                vendor_name:          initialValues?.vendor_name          ?? '',
                branch_id:            initialValues?.branch_id            ?? '',
                ship_to_warehouse_id: initialValues?.ship_to_warehouse_id ?? '',
                currency_code:        inheritedVQ?.currency               || initialValues?.currency_code ?? 'THB',
                exchange_rate:        inheritedVQ?.exchange_rate          || initialValues?.exchange_rate ?? 1,
                payment_term_days:    inheritedVQ?.payment_term_days      || initialValues?.payment_term_days ?? 30,
                remarks:              initialValues?.remarks              ?? '',
                lines:                initialLines,
            });
        }
    }, [isOpen, initialValues, reset, inheritedVQ]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleVendorSelect = (vendor: VendorSearchItem) => {
        setValue('vendor_id',   vendor.vendor_id);
        setValue('vendor_name', vendor.name);
        if (vendor.payment_term_days) {
            setValue('payment_term_days', vendor.payment_term_days);
        }
        setIsVendorModalOpen(false);
    };

    const handleAddLine = () => {
        append({
            item_code:       '',
            item_name:       '',
            qty:             1,
            unit_price:      0,
            discount_amount: 0,
            uom_name:        'PCS',
            line_total:      0,
        });
    };

    const onSubmit: SubmitHandler<POFormData> = async (data) => {
        try {
            const subtotal = data.lines.reduce((s, l) => s + l.qty * l.unit_price - (l.discount_amount ?? 0), 0);
            const tax      = subtotal * 0.07;

            await POService.create({
                qc_id:             data.qc_id ?? '',
                qc_no:             data.qc_no,
                pr_id:             data.pr_id,
                pr_no:             data.pr_no,
                vendor_id:         data.vendor_id,
                vendor_name:       data.vendor_name,
                order_date:        data.po_date,
                payment_term_days: data.payment_term_days,
                currency_code:     data.currency_code,
                exchange_rate:     data.exchange_rate,
                total_amount:      subtotal + tax,
                items: data.lines.map(l => ({
                    item_id:         l.item_id || undefined,
                    item_code:       l.item_code,
                    item_name:       l.item_name,
                    qty:             l.qty,
                    unit_price:      l.unit_price,
                    discount_amount: l.discount_amount ?? 0,
                    uom_name:        l.uom_name,
                    line_total:      l.line_total,
                    description:     l.description,
                })),
                remarks:           data.remarks,
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            logger.error('[POFormModal] onSubmit error:', error);
            window.alert('เกิดข้อผิดพลาดในการบันทึก');
        }
    };

    if (!isOpen) return null;

    const isView = isViewMode;

    return (
        <>
            {/* ── Vendor Search Modal ──────────────────────────────────────── */}
            <VendorSearchModal
                isOpen={isVendorModalOpen}
                onClose={() => setIsVendorModalOpen(false)}
                onSelect={handleVendorSelect}
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
                                onClick={handleSubmit(onSubmit)}
                                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
                            >
                                <Save size={14} /> บันทึก
                            </button>
                        )}
                    </div>
                }
            >
                <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6">

                    {/* ════════════════════════════════════════════════════════
                        CARD 1 — PO Header (3-row × 3-col)
                    ════════════════════════════════════════════════════════ */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                        <div className="p-5">
                            {/* Card Title */}
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-5 border-b border-gray-200 dark:border-gray-700 pb-3">
                                <FileText size={18} />
                                <span className="font-semibold">ส่วนหัวเอกสาร — Header PO (Purchase Order)</span>
                            </div>

                            {/* ── Row 1: เลขที่ PO | วันที่ PO | อ้างอิง PR ────────────── */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

                                {/* เลขที่ PO (auto-generated, display only) */}
                                <div>
                                    <label className={s.label}>เลขที่ PO <span className="text-gray-400 font-normal text-xs">(po_no)</span></label>
                                    <input
                                        {...register('po_no')}
                                        className={s.inputRO}
                                        readOnly
                                        placeholder="ระบบจะสร้างอัตโนมัติ"
                                    />
                                    <p className={s.hint}>ระบบจะแสดงเลขที่เมื่อบันทึก</p>
                                </div>

                                {/* วันที่ PO */}
                                <div>
                                    <label className={s.label}>วันที่ PO <span className="text-red-500">*</span> <span className="text-gray-400 font-normal text-xs">(po_date)</span></label>
                                    <input
                                        type="date"
                                        {...register('po_date')}
                                        className={`${s.input} ${errors.po_date ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                        disabled={isView}
                                    />
                                    {errors.po_date && <p className={s.error}>{errors.po_date.message}</p>}
                                </div>

                                {/* อ้างอิง PR + Search Icon */}
                                <div>
                                    <label className={s.label}>อ้างอิง PR <span className="text-gray-400 font-normal text-xs">(pr_id FK)</span></label>
                                    <div className="flex gap-2">
                                        <input
                                            {...register('pr_no')}
                                            className={s.inputRO}
                                            readOnly
                                            placeholder="PR2024-xxx"
                                        />
                                        {!isView && (
                                            <button
                                                type="button"
                                                title="ค้นหา PR"
                                                className={s.searchBtn}
                                                onClick={() => window.alert('PR Search — coming soon')}
                                            >
                                                <Search size={14} />
                                            </button>
                                        )}
                                        {watchPrNo && !isView && (
                                            <button
                                                type="button"
                                                onClick={() => { setValue('pr_id', ''); setValue('pr_no', ''); }}
                                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-800/50"
                                                title="ล้างข้อมูล PR"
                                            >
                                                <XIcon size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Row 2: ผู้ขาย | สาขา | คลังสินค้าปลายทาง ────────────── */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

                                {/* ผู้ขาย + VendorSearchModal */}
                                <div>
                                    <label className={s.label}>ผู้ขาย <span className="text-red-500">*</span> <span className="text-gray-400 font-normal text-xs">(vendor_id FK)</span></label>
                                    <div className="flex gap-2">
                                        <input
                                            value={watchVendorName ?? ''}
                                            readOnly
                                            className={`flex-1 ${s.inputRO}`}
                                            placeholder="-- เลือกผู้ขาย --"
                                        />
                                        {!isView && (
                                            <button
                                                type="button"
                                                onClick={() => setIsVendorModalOpen(true)}
                                                className={s.searchBtn}
                                            >
                                                <Search size={14} /> เลือก
                                            </button>
                                        )}
                                    </div>
                                    {errors.vendor_id && <p className={s.error}>{errors.vendor_id.message}</p>}
                                </div>

                                {/* สาขา */}
                                <div>
                                    <label className={s.label}>สาขา <span className="text-red-500">*</span> <span className="text-gray-400 font-normal text-xs">(branch_id FK)</span></label>
                                    <select
                                        {...register('branch_id')}
                                        className={`${s.select} ${errors.branch_id ? 'border-red-500' : ''}`}
                                        disabled={isView}
                                    >
                                        <option value="">-- เลือกสาขา --</option>
                                        {BRANCH_OPTIONS.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                    {errors.branch_id && <p className={s.error}>{errors.branch_id.message}</p>}
                                </div>

                                {/* คลังสินค้าปลายทาง */}
                                <div>
                                    <label className={s.label}>คลังสินค้าปลายทาง <span className="text-red-500">*</span> <span className="text-gray-400 font-normal text-xs">(ship_to_warehouse_id)</span></label>
                                    <select
                                        {...register('ship_to_warehouse_id')}
                                        className={`${s.select} ${errors.ship_to_warehouse_id ? 'border-red-500' : ''}`}
                                        disabled={isView}
                                    >
                                        <option value="">-- เลือกคลังสินค้า --</option>
                                        {WAREHOUSE_OPTIONS.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                    {errors.ship_to_warehouse_id && <p className={s.error}>{errors.ship_to_warehouse_id.message}</p>}
                                </div>
                            </div>

                            {/* ── Row 3: สกุลเงิน | อัตราแลกเปลี่ยน | เครดิตเทอม ───────── */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                {/* สกุลเงิน */}
                                <div>
                                    <label className={s.label}>สกุลเงิน <span className="text-red-500">*</span> <span className="text-gray-400 font-normal text-xs">(currency_code)</span></label>
                                    <select
                                        {...register('currency_code')}
                                        className={s.select}
                                        disabled={isView}
                                    >
                                        {CURRENCY_OPTIONS.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* อัตราแลกเปลี่ยน */}
                                <div>
                                    <label className={s.label}>อัตราแลกเปลี่ยน <span className="text-red-500">*</span> <span className="text-gray-400 font-normal text-xs">(exchange_rate)</span></label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        {...register('exchange_rate', { valueAsNumber: true })}
                                        className={`${s.input} text-right ${watchCurrencyCode === 'THB' ? 'bg-gray-100/70 dark:bg-gray-800/70 cursor-not-allowed' : ''}`}
                                        disabled={isView || watchCurrencyCode === 'THB'}
                                        placeholder="1"
                                    />
                                    {errors.exchange_rate && <p className={s.error}>{errors.exchange_rate.message}</p>}
                                </div>

                                {/* เครดิตเทอม (วัน) */}
                                <div>
                                    <label className={s.label}>เครดิตเทอม (วัน) <span className="text-red-500">*</span> <span className="text-gray-400 font-normal text-xs">(payment_term_days)</span></label>
                                    <input
                                        type="number"
                                        {...register('payment_term_days', { valueAsNumber: true })}
                                        className={`${s.input} text-right`}
                                        disabled={isView}
                                        placeholder="30"
                                    />
                                    {errors.payment_term_days && <p className={s.error}>{errors.payment_term_days.message}</p>}
                                </div>
                            </div>
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
                                <table className="w-full min-w-[900px] border-collapse bg-white dark:bg-gray-900 text-sm border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <thead className="bg-blue-700 text-white text-xs dark:bg-blue-900">
                                        <tr>
                                            <th className="px-3 py-2 text-center w-12 border-r border-blue-600">ลำดับ</th>
                                            <th className="px-3 py-2 text-center w-36 border-r border-blue-600">รหัสสินค้า</th>
                                            <th className="px-3 py-2 text-left border-r border-blue-600">รายละเอียด</th>
                                            <th className="px-3 py-2 text-center w-24 border-r border-blue-600">จำนวน</th>
                                            <th className="px-3 py-2 text-center w-20 border-r border-blue-600">หน่วย</th>
                                            <th className="px-3 py-2 text-center w-32 border-r border-blue-600">ราคา/หน่วย</th>
                                            <th className="px-3 py-2 text-center w-28 border-r border-blue-600">ส่วนลด</th>
                                            <th className="px-3 py-2 text-center w-32 border-r border-blue-600">รวมเงิน</th>
                                            {!isView && <th className="px-3 py-2 text-center w-14">จัดการ</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields.length === 0 && (
                                            <tr>
                                                <td colSpan={isView ? 8 : 9} className="px-4 py-12 text-center text-gray-400">
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
                                        {fields.map((field, idx) => (
                                            <tr key={field.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                                                <td className="px-3 py-2 text-center text-xs text-gray-500 border-r border-gray-200 dark:border-gray-700">{idx + 1}</td>
                                                <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                                    <input
                                                        {...register(`lines.${idx}.item_code`)}
                                                        className={s.input}
                                                        placeholder="Code"
                                                        readOnly={isView}
                                                    />
                                                </td>
                                                <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                                    <input
                                                        {...register(`lines.${idx}.item_name`)}
                                                        className={s.input}
                                                        placeholder="Description"
                                                        readOnly={isView}
                                                    />
                                                </td>
                                                <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                                    <input
                                                        type="number" step="any"
                                                        {...register(`lines.${idx}.qty`, { valueAsNumber: true })}
                                                        className={`${s.input} text-center`}
                                                        readOnly={isView}
                                                    />
                                                </td>
                                                <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                                    <input
                                                        {...register(`lines.${idx}.uom_name`)}
                                                        className={`${s.input} text-center`}
                                                        placeholder="PCS"
                                                        readOnly={isView}
                                                    />
                                                </td>
                                                <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                                    <input
                                                        type="number" step="any"
                                                        {...register(`lines.${idx}.unit_price`, { valueAsNumber: true })}
                                                        className={`${s.input} text-right`}
                                                        placeholder="0.00"
                                                        readOnly={isView}
                                                    />
                                                </td>
                                                <td className="px-1 py-1 border-r border-gray-200 dark:border-gray-700">
                                                    <input
                                                        type="number" step="any"
                                                        {...register(`lines.${idx}.discount_amount`, { valueAsNumber: true })}
                                                        className={`${s.input} text-right`}
                                                        placeholder="0.00"
                                                        readOnly={isView}
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right font-bold text-blue-600 dark:text-blue-400 border-r border-gray-200 dark:border-gray-700">
                                                    <RowTotal control={control} index={idx} />
                                                </td>
                                                {!isView && (
                                                    <td className="px-3 py-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => remove(idx)}
                                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 rounded"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Items error */}
                            {errors.lines && (
                                <p className="px-2 pt-2 text-red-500 text-sm">
                                    {errors.lines.root?.message ?? errors.lines.message}
                                </p>
                            )}
                        </div>

                        {/* Summary Footer */}
                        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 flex flex-col md:flex-row justify-between items-start gap-6">
                            <div className="space-y-2">
                                <label className={s.label}>หมายเหตุ (Remarks)</label>
                                <textarea
                                    {...register('remarks')}
                                    rows={3}
                                    disabled={isView}
                                    className="w-80 p-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white resize-none disabled:opacity-70"
                                    placeholder="ระบุหมายเหตุเพิ่มเติม..."
                                />
                            </div>
                            <POSummaryPanel control={control} />
                        </div>
                    </div>
                </div>
            </WindowFormLayout>
        </>
    );
}
