/**
 * @file POAFormModal.tsx
 * @description High-fidelity POA Form Modal — VQ-Style 3-column layout
 *  Header synchronization from PO (Vendor, Branch, Warehouse, etc.)
 */
import { FormProvider, useWatch, Controller } from 'react-hook-form';
import { 
    CheckCircle, XCircle, FileText, Loader2, Search, Package, Clock, Printer
} from 'lucide-react';
import React from 'react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { parseDiscountAmount } from '@/modules/procurement/utils/pricing.utils';
import { useMemo, useState } from 'react';

import { WindowFormLayout } from '@/shared/components/ui/layout/WindowFormLayout';
import { ConfirmationModal } from '@/shared/components/system/ConfirmationModal';
import { usePOAForm } from '../hooks/usePOAForm';
import { POSearchModal } from './POSearchModal';
import { CustomDateInput } from '@ui';
import { POAHistoryModal } from './POAHistoryModal';
import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import type { Currency } from '@/modules/master-data/types/master-data-types';
import type { POAFormData } from '@/modules/procurement/schemas/poa-schemas';
import { cn } from '@/shared/utils';


const ui = {
    label: 'text-sm font-medium text-blue-700 dark:text-blue-300 mb-1 block',
    input: 'w-full h-8 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all',
    inputRO: 'w-full h-8 px-3 text-sm bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg cursor-not-allowed font-medium',
    select: 'w-full h-8 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white cursor-pointer transition-all',
    searchBtn: 'px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shrink-0 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1',
    error: 'text-red-500 text-[10px] mt-0.5 font-medium',
};

const POSummaryPanel = ({ control, detailData }: { control: Control<POAFormData>; detailData?: Record<string, any> }) => {
    const poLines = useWatch({ control, name: 'po_lines' });

    const { grossTotal, totalDiscount, taxAmount, totalAmount, taxRate } = useMemo(() => {
        const approvedLines = (poLines ?? []).filter((l) => !!l.is_approved);
        const grossTotal = approvedLines.reduce((sum: number, l) => sum + (Number(l.qty_ordered ?? 0) * Number(l.unit_price ?? 0)), 0);
        const totalDiscount = approvedLines.reduce((sum: number, l) => {
            const lineGross = Number(l.qty_ordered ?? 0) * Number(l.unit_price ?? 0);
            return sum + parseDiscountAmount(l.discount_expression || '0', lineGross);
        }, 0);
        
        const subtotal = Math.max(0, grossTotal - totalDiscount);
        const rawRate = Number((detailData as Record<string, any>)?.tax_code?.tax_rate ?? (detailData as Record<string, any>)?.tax_rate ?? 7);
        const normalizedRate = (rawRate > 0 && rawRate < 1) ? (rawRate * 100) : rawRate;
        const taxRate = parseFloat(normalizedRate.toFixed(4));
        
        const taxAmount   = Math.round(subtotal * (taxRate / 100) * 100) / 100;
        const totalAmount = Math.max(0, Math.round((subtotal + taxAmount) * 100) / 100);

        return {
            grossTotal:    Math.round(grossTotal    * 100) / 100,
            totalDiscount: Math.round(totalDiscount * 100) / 100,
            taxAmount,
            totalAmount,
            taxRate
        };
    }, [poLines, detailData]);

    return (
        <div className="w-80 space-y-2 bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm ml-auto">
            <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">รวมเป็นเงิน</span>
                <span className="font-medium text-gray-900 dark:text-white">{grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">ส่วนลด</span>
                <span className={`font-medium ${totalDiscount > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{totalDiscount > 0 ? '-' : ''}{totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-slate-400">ภาษีมูลค่าเพิ่ม ({taxRate}%)</span>
                <span className="font-medium text-gray-900 dark:text-white">{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-gray-100 dark:border-slate-700 pt-2 flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-700 dark:text-slate-300">รวมสุทธิ</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
        </div>
    );
};

interface POLineRowProps {
    field: POAFormData['po_lines'][number];
    idx: number;
    control: Control<POAFormData>;
    isReadOnly: boolean;
    detailData?: any;
    errors: FieldErrors<POAFormData>;
    setValue: UseFormSetValue<POAFormData>;
}

const POLineRow: React.FC<POLineRowProps> = ({ field, idx, control, isReadOnly, detailData, errors, setValue }) => {
    const lineVal = useWatch({ control, name: `po_lines.${idx}` as any });
    const isProcessed = !!(lineVal?.is_processed ?? field.is_processed);
    
    // Derived values
    const qty = lineVal?.qty_ordered ?? field.qty_ordered ?? 0;
    const price = lineVal?.unit_price ?? field.unit_price ?? 0;
    const total = (Number(qty) || 0) * (Number(price) || 0);
    const isApproved = !!(lineVal?.is_approved ?? field.is_approved);

    // Row-level disable logic
    // 🎯 Logic: Lock if it's a historical record (isReadOnly) 
    // OR if it's already fully approved in a PREVIOUS round (isProcessed).
    const isDisabled = isReadOnly || isProcessed;

    return (
        <tr
            className={cn(
                "border-b border-gray-100 dark:border-gray-800 transition-colors",
                // 1. Processed = Already approved/rejected in previous round OR Document is ReadOnly.
                // 🎯 UI: Processed rows are dimmed and non-interactive to prevent double-processing.
                (isReadOnly || isProcessed) && "bg-slate-200/50 dark:bg-slate-900/40 opacity-50 grayscale-[0.4] pointer-events-none select-none border-l-[3px] border-l-slate-400/50",
                // ✅ USER REQUEST: Unchecked items that are active should look clearly inactive/pending
                !isProcessed && !isApproved && !isReadOnly && "opacity-75 bg-slate-50/10 dark:bg-slate-900/5",
                // ✅ Highlight active row
                !isProcessed && isApproved && !isReadOnly && "bg-emerald-50/5 dark:bg-emerald-900/5"
            )}
            data-line-idx={idx}
            data-testid={`po-line-${idx}`}
        >
            {/* 1. Selection */}
            <td data-col="1" data-label="Check" className="px-2 py-2 text-center border-r border-gray-200 dark:border-gray-700 w-10 min-w-[40px]">
                <Controller
                    name={`po_lines.${idx}.is_approved`}
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <input 
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 transition-all border-slate-300 dark:border-slate-700"
                            checked={!!value}
                            onChange={(e) => {
                                const isChecked = e.target.checked;
                                onChange(isChecked);
                                
                                // 🎯 UX Sync: If checked and qty is 0, default to full remaining
                                const currentQty = Number(control._formValues.po_lines[idx].qty_ordered || 0);
                                const remQty     = Number(field.remaining_qty || 0);
                                
                                if (isChecked && currentQty === 0) {
                                    setValue(`po_lines.${idx}.qty_ordered`, remQty, { shouldValidate: true });
                                } else if (!isChecked) {
                                    setValue(`po_lines.${idx}.qty_ordered`, 0, { shouldValidate: true });
                                }
                            }}
                            disabled={isDisabled}
                        />
                    )}
                />
            </td>
            
            {/* 2. Order Number */}
            <td data-col="2" data-label="Idx" className="px-3 py-2 text-center text-[13px] text-gray-600 font-medium border-r border-gray-200 dark:border-gray-700 w-12 min-w-[48px]">
                {idx + 1}
            </td>
            
            {/* 3. Item Code */}
            <td data-col="3" data-label="Code" className="px-3 py-2 border-r border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 text-xs w-28 min-w-[112px] text-nowrap">
                {field.item_code || '-'}
            </td>

            {/* 4. Item Name */}
            <td data-col="4" data-label="Name" className="px-3 py-2 border-r border-gray-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 min-w-[200px]">
                {field.item_name || field.description || '-'}
            </td>

            {/* 5. Ordered Qty (จาก PO) */}
            <td data-col="5" data-label="OrderedQty" className="px-2 py-2 text-center border-r border-gray-200 dark:border-gray-700 text-slate-500 dark:text-slate-500 text-xs w-20 min-w-[80px]">
                {detailData?.po_lines?.[idx]?.qty ?? field.qty ?? '0'}
            </td>


            {/* 6. Unit */}
            <td data-col="6" data-label="Unit" className="px-2 py-2 text-center border-r border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 text-xs text-nowrap w-20 min-w-[80px]">
                {field.uom_name || '-'}
            </td>

            <td data-col="7" data-label="ApproveQty" className="px-2 py-2 border-r border-gray-200 dark:border-gray-700 bg-emerald-50/10 w-24 min-w-[96px]">
                <Controller
                    name={`po_lines.${idx}.qty_ordered`}
                    control={control}
                    render={({ field: { value, onChange } }) => {
                        // 🎯 Robust Detection: Find the limit from any available source
                        const val = Number(value || 0);
                        const qtyFromData = Number(detailData?.po_lines?.[idx]?.qty || 0);
                        const remFromField = Number(lineVal?.remaining_qty ?? field?.remaining_qty ?? 0);
                        
                        // Use remaining_qty if available (>0), otherwise fallback to original qty
                        const limit = remFromField > 0 ? remFromField : (qtyFromData > 0 ? qtyFromData : 999999);
                        
                        const isOver = val > limit;
                        const hasError = !!errors.po_lines?.[idx]?.qty_ordered || isOver;

                        return (
                            <div className="relative">
                                {hasError && (
                                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3 h-5 bg-red-600 rounded-full z-20 shadow-[0_0_8px_rgba(220,38,38,0.5)] animate-pulse" />
                                )}
                                <input
                                    type="number" step="any"
                                    value={value ?? ''}
                                    onChange={e => {
                                        const newVal = e.target.valueAsNumber || 0;
                                        onChange(newVal);
                                        // 🎯 UX Sync: If input > 0, auto-check the approve checkbox
                                        if (newVal > 0) {
                                            setValue(`po_lines.${idx}.is_approved`, true, { shouldValidate: true });
                                        } else if (newVal === 0) {
                                            setValue(`po_lines.${idx}.is_approved`, false, { shouldValidate: true });
                                        }
                                    }}
                                    disabled={isDisabled}
                                    className={cn(
                                        (isApproved && !isDisabled) ? ui.input : ui.inputRO,
                                        '!h-8 text-center text-sm font-bold transition-all duration-200',
                                        hasError && '!border-red-600 !ring-2 !ring-red-500/30 !text-red-600 dark:!text-red-400 !bg-red-50/10 dark:!bg-red-900/20'
                                    )}
                                />
                            </div>
                        );
                    }}
                />
            </td>

            {/* 8. Unit Price */}
            <td data-col="8" data-label="Price" className="px-3 py-2 text-right border-r border-gray-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 w-24 min-w-[96px]">
                {Number(field.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </td>

            {/* 9. Discount */}
            <td data-col="9" data-label="Disc" className="px-2 py-2 text-center border-r border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-400 text-xs w-20 min-w-[80px]">
                {field.discount_expression || '0'}
            </td>

            {/* 10. Net Total */}
            <td data-col="10" data-label="Total" className="px-3 py-2 text-right font-semibold text-emerald-700 dark:text-emerald-400 text-[13px] bg-emerald-50/10 dark:bg-emerald-900/10 border-r border-gray-200 dark:border-gray-700 w-28 min-w-[112px]">
                {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </td>

            {/* 11. Type */}
            <td data-col="11" data-label="Type" className="px-2 py-2 text-center border-r border-gray-200 dark:border-gray-700 text-slate-500 dark:text-slate-500 text-[10px] font-bold w-20 min-w-[80px]">
                {field.receipt_type || 'GOODS'}
            </td>

            {/* 12. Remark */}
            <td data-col="12" data-label="Remark" className="px-2 py-2 w-40 min-w-[160px]">
                <Controller
                    name={`po_lines.${idx}.line_remark`}
                    control={control}
                    render={({ field: { value, onChange } }) => (
                        <input
                            type="text"
                            value={value ?? ''}
                            onChange={onChange}
                            disabled={isDisabled}
                            placeholder={isDisabled ? '' : 'หมายเหตุ...'}
                            className={cn(
                                ui.input,
                                '!h-8 text-xs',
                                isDisabled && ui.inputRO,
                                errors.po_lines?.[idx]?.line_remark && 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                            )}
                        />
                    )}
                />
            </td>
        </tr>
    );
};


interface POAFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    poId?: number;
    initialValues?: any;
    readOnly?: boolean;
}

export default function POAFormModal({
    isOpen,
    onClose,
    onSuccess,
    poId,
    initialValues,
    readOnly,
}: POAFormModalProps) {
    const {
        formMethods,
        control,
        register,
        handleSubmit,
        errors,
        fields,
        onSubmit,
        onInvalidSubmit,
        setValue,

        isConfirmModalOpen,
        setIsConfirmModalOpen,
        handleConfirmApprove,

        isRejectModalOpen,
        setIsRejectModalOpen,
        handleRejectInit,
        handleConfirmReject,

        isSubmitting,
        detailData,
        isLoadingDetail,

        isPOSearchModalOpen,
        setIsPOSearchModalOpen,
        handlePOSelect,

        currencies,
        isLoadingCurrencies,
        isReadOnly,
        isPartialApproval,
    } = usePOAForm({ isOpen, onClose, onSuccess, poId, initialValues, readOnly });

    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const formValues = useWatch({ control });

    if (!isOpen) return null;

    return (
        <FormProvider {...formMethods}>
            <WindowFormLayout
                isOpen={isOpen}
                onClose={onClose}
                title="รายการอนุมัติใบสั่งซื้อ (Purchase Order Approval)"
                titleIcon={
                    <div className="bg-white/20 p-1 rounded-md shadow-sm">
                        <FileText size={14} strokeWidth={3} className="text-white" />
                    </div>
                }
                headerColor="bg-blue-600"
                footer={
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-slate-100 dark:bg-gray-900 sticky bottom-0 z-10">
                        <div className="flex items-center gap-2">
                             {/* 🎯 AV PATTERN: Approval History Button on bottom-left */}
                             {(poId || detailData?.po_id || initialValues?.po_id) && (
                                <div className="flex items-center gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsHistoryOpen(true)}
                                        className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-md text-sm font-medium flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800"
                                    >
                                        <Clock size={16} /> ประวัติการอนุมัติ
                                    </button>

                                    {/* Print POA Button */}
                                    {(detailData?.status === 'APPROVED' || detailData?.status === 'PARTIAL') && (detailData as any)?.approval_id && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                                                const approvalId = (detailData as any).approval_id;
                                                window.open(`${apiUrl}/po-approval/${approvalId}/pdf`, '_blank');
                                            }}
                                            className="px-3 py-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md text-sm font-medium flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 transition-all"
                                        >
                                            <Printer size={16} /> พิมพ์ใบอนุมัติ
                                        </button>
                                    )}
                                </div>
                             )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-medium"
                            >
                                {isReadOnly ? 'ปิดหน้าต่าง' : 'ยกเลิก'}
                            </button>
                            {!isReadOnly && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleRejectInit}
                                        disabled={isSubmitting || !formValues?.po_no || fields.length === 0}
                                        className="px-6 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <XCircle size={18} />
                                        ไม่อนุมัติ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit(onSubmit, onInvalidSubmit)}
                                        disabled={isSubmitting || !formValues?.po_no || fields.length === 0}
                                        className="px-8 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <CheckCircle size={18} />
                                        )}
                                        อนุมัติรายการ
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                }
            >
                <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0b1120] p-6 space-y-6">
                    {/* Header Card */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                        <div className="p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                    <FileText size={18} />
                                    <span className="font-semibold">ข้อมูลทั่วไป (General Information)</span>
                                </div>
                                {(detailData?.status || initialValues?.status) && (
                                    <div className="flex items-center">
                                        <label className="text-[10px] text-gray-400 uppercase tracking-wider mr-2 font-medium">สถานะหลัก</label>
                                        <div className={cn(
                                            "px-2 py-0.5 rounded text-[11px] font-bold uppercase border shadow-sm",
                                            detailData?.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800" :
                                            detailData?.status === 'PARTIAL' ? "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-800" :
                                            detailData?.status === 'REJECTED' ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" :
                                            "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                                        )}>
                                            {detailData?.status === 'APPROVED' ? 'อนุมัติแล้ว' : 
                                             detailData?.status === 'PARTIAL' ? 'อนุมัติบางส่วน' :
                                             detailData?.status === 'REJECTED' ? 'ไม่อนุมัติ' :
                                             (detailData?.status === 'PENDING_APPROVAL' || initialValues?.status === 'PENDING_APPROVAL') ? 'รออนุมัติ' :
                                             detailData?.status || initialValues?.status || 'รอดำเนินการ'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isLoadingDetail ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                    <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Row 1 */}
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
                                        <div>
                                            <label className={ui.label}>เลขที่ PO</label>
                                            <div className="flex gap-2">
                                                <input value={detailData?.po_no || initialValues?.po_no || '-'} className={ui.inputRO} readOnly placeholder="-" />
                                                {!isReadOnly && (
                                                    <button 
                                                        type="button" 
                                                        className={ui.searchBtn} 
                                                        title="ค้นหารายการ PO"
                                                        onClick={() => setIsPOSearchModalOpen(true)}
                                                    >
                                                        <Search size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className={ui.label}>เลขที่อนุมัติ POA</label>
                                            <input value={detailData?.poa_no || '-'} className={ui.inputRO} readOnly />
                                        </div>
                                        <div>
                                            <label className={ui.label}>วันที่ PO</label>
                                            <input value={detailData?.po_date ? formatThaiDate(detailData.po_date) : '-'} className={ui.inputRO} readOnly />
                                        </div>
                                        <div>
                                            <label className={ui.label}>อ้างอิง PR</label>
                                            <input value={detailData?.pr_no || '-'} className={ui.inputRO} readOnly />
                                        </div>
                                        <div>
                                            <label className={ui.label}>อ้างอิง QC</label>
                                            <input value={detailData?.qc_no || '-'} className={ui.inputRO} readOnly />
                                        </div>
                                    </div>

                                    {/* Row 2: Vendor | Branch | Warehouse */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-50 dark:border-gray-800 pt-4">
                                        <div>
                                            <label className={ui.label}>ผู้ขาย (Vendor)</label>
                                            <input value={formValues.vendor_name || '-'} className={ui.inputRO} readOnly />
                                        </div>
                                        <div>
                                            <label className={ui.label}>สาขา (Branch)</label>
                                            <input value={formValues.branch_name || '-'} className={ui.inputRO} readOnly />
                                        </div>
                                    </div>

                                    {/* Row 3: Prepared By | Credit Term | Delivery Date | Tax Type */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-gray-50 dark:border-gray-800 pt-4">
                                        <div>
                                            <label className={ui.label}>ผู้จัดทำ (Prepared By)</label>
                                            <input value={formValues.created_by_name || '-'} className={ui.inputRO} readOnly />
                                        </div>
                                        <div>
                                            <label className={ui.label}>เครดิตเทอม (วัน)</label>
                                            <input value={formValues.payment_term_days ?? '-'} className={`${ui.inputRO} text-right`} readOnly />
                                        </div>
                                        <div>
                                            <label className={ui.label}>กำหนดส่งของ</label>
                                            <input value={formValues.delivery_date ? formatThaiDate(formValues.delivery_date) : '-'} className={ui.inputRO} readOnly />
                                        </div>
                                        <div>
                                            <label className={ui.label}>ประเภทภาษี</label>
                                            <input value={formValues.tax_name || '-'} className={ui.inputRO} readOnly />
                                        </div>
                                    </div>

                                    {/* Row 4: Currency Selection */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg">
                                        <div>
                                            <label className={ui.label}>วันที่อัตราแลกเปลี่ยน</label>
                                            <div className="h-8">
                                                <Controller
                                                    name="exchange_rate_date"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <CustomDateInput 
                                                            value={field.value || ''} 
                                                            onChange={field.onChange} 
                                                            disabled={isReadOnly} 
                                                            className={cn(ui.input, errors.exchange_rate_date && "border-red-500 focus:ring-red-500/20 focus:border-red-500")} 
                                                        />
                                                    )}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={ui.label}>รหัสสกุลเงิน <span className="text-red-500">*</span></label>
                                            <select 
                                                {...register('currency_code')} 
                                                className={cn(ui.select, errors.currency_code && "border-red-500 focus:ring-red-500/20 focus:border-red-500")} 
                                                disabled={isLoadingCurrencies || isReadOnly}
                                            >
                                                <option value="">{isLoadingCurrencies ? 'โหลด...' : 'เลือกสกุลเงิน'}</option>
                                                {currencies.map((o: Currency) => (
                                                    <option key={o.currency_code} value={o.currency_code}>
                                                        {o.currency_code} - {o.name_th}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={ui.label}>ไปที่สกุลเงิน (Target)</label>
                                            <select 
                                                {...register('target_currency')} 
                                                className={cn(ui.select, errors.target_currency && "border-red-500 focus:ring-red-500/20 focus:border-red-500")} 
                                                disabled={isLoadingCurrencies || isReadOnly}
                                            >
                                                <option value="">{isLoadingCurrencies ? 'โหลด...' : 'เลือกสกุลเงิน'}</option>
                                                {currencies.map((o: Currency) => (
                                                    <option key={o.currency_code} value={o.currency_code}>
                                                        {o.currency_code} - {o.name_th}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={ui.label}>อัตราแลกเปลี่ยน <span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <input 
                                                    type="number" step="0.0001" 
                                                    {...register('exchange_rate', { valueAsNumber: true })}
                                                    className={cn(ui.input, "text-right pr-8", errors.exchange_rate && "border-red-500 focus:ring-red-500/20 focus:border-red-500")} 
                                                    placeholder="1" 
                                                    disabled={isReadOnly}
                                                />
                                            </div>
                                            {errors.exchange_rate && <p className={ui.error}>{errors.exchange_rate.message}</p>}
                                        </div>
                                    </div>

                                    {/* Remarks Section (Previous Reject Reason) */}
                                    <div>
                                        <label className={ui.label}>หมายเหตุ (Remarks)</label>
                                        <textarea
                                            {...register('reject_reason')}
                                            disabled={isReadOnly}
                                            className={cn(
                                                "w-full min-h-[60px] p-3 text-sm text-gray-900 dark:text-white bg-slate-50 dark:bg-slate-900 border rounded-lg focus:outline-none focus:ring-2 transition-all",
                                                isReadOnly && "bg-slate-50/50 dark:bg-slate-950/30 !text-slate-500 dark:!text-slate-400 cursor-not-allowed",
                                                errors.reject_reason 
                                                ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" 
                                                : "border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500"
                                            )}
                                            placeholder={isReadOnly ? "" : "ระบุหมายเหตุหรือเหตุผลการอนุมัติ/ไม่อนุมัติ..."}
                                        />
                                        {errors.reject_reason && <p className="text-red-500 text-[12px] mt-1 ml-1">{errors.reject_reason.message}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Lines Card */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                        <div className="p-4">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                                <FileText size={18} />
                                <span className="font-semibold">รายการสินค้า (ตรวจสอบและสามารถปรับแก้จำนวนการสั่งซื้อได้)</span>
                            </div>

                            <div className="overflow-x-auto bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                                <table className="w-full min-w-[800px] border-collapse bg-white dark:bg-gray-900 text-sm border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <thead className="bg-blue-600 text-white text-[13px] dark:bg-blue-800">
                                        <tr>
                                            <th className="px-2 py-2 w-10 text-center border-r border-blue-500/40 font-semibold">✓</th>
                                            <th className="px-2 py-2 text-center w-12 border-r border-blue-500/40 font-semibold">ลำดับ</th>
                                            <th className="px-3 py-2 text-left w-28 border-r border-blue-500/40 font-semibold">รหัสสินค้า</th>
                                            <th className="px-3 py-2 text-left border-r border-blue-500/40 font-semibold">ชื่อสินค้า/บริการ</th>
                                            <th className="px-2 py-2 text-center w-20 border-r border-blue-500/40 font-semibold text-[11px]">
                                                {isReadOnly ? 'ยอดอนุมัติเดิม' : (
                                                    // 🎯 AV PATTERN: If any line has been partially approved (rem < total), show "ยอดคงเหลือ"
                                                    fields.some(f => Number((f as any).remaining_qty || 0) < Number((f as any).qty || 0))
                                                    ? 'ยอดคงเหลือ' 
                                                    : 'จำนวนสั่งซื้อ'
                                                )}
                                            </th>
                                            <th className="px-2 py-2 text-center w-20 border-r border-blue-500/40 font-semibold text-[11px]">หน่วย</th>
                                            <th className="px-2 py-2 text-center w-24 border-r border-blue-500/40 bg-emerald-500 text-white font-bold text-[11px]">ยอดอนุมัติ</th>
                                            <th className="px-2 py-2 text-center w-24 border-r border-blue-500/40 font-semibold text-[11px]">ราคา/หน่วย</th>
                                            <th className="px-2 py-2 text-center w-20 border-r border-blue-500/40 font-semibold">ส่วนลด</th>
                                            <th className="px-2 py-2 text-center w-28 border-r border-blue-500/40 font-semibold">ยอดสุทธิ</th>
                                            <th className="px-2 py-2 text-center w-20 border-r border-blue-500/40 font-semibold">ประเภท</th>
                                            <th className="px-2 py-2 text-center w-40 font-semibold">หมายเหตุ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields.length === 0 ? (
                                            <tr>
                                                <td colSpan={12} className="px-4 py-12 text-center text-gray-400">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Package className="w-8 h-8 opacity-20 mb-1" />
                                                        <span className="font-medium">
                                                            {isLoadingDetail ? "กำลังโหลดรายการสินค้า..." : "ไม่พบรายการสินค้า"}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (() => {
                                            const renderedLines = fields.map((field, idx: number) => {
                                                const isProcessed = !!(field as any).is_processed;
                                                const isHidden = !isReadOnly && isProcessed;
                                                if (isHidden) return null;

                                                return (
                                                    <POLineRow
                                                        key={field.id}
                                                        field={field as any}
                                                        idx={idx}
                                                        control={control}
                                                        isReadOnly={isReadOnly}
                                                        detailData={detailData}
                                                        errors={errors}
                                                        setValue={setValue}
                                                    />
                                                );
                                            }).filter(Boolean);

                                            if (renderedLines.length === 0 && !isReadOnly && fields.length > 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan={12} className="px-10 py-16 text-center text-gray-500 bg-slate-50/10 dark:bg-slate-900/10 italic font-medium">
                                                            <div className="flex flex-col items-center gap-3">
                                                                <CheckCircle className="w-10 h-10 text-emerald-500/50" />
                                                                <span>ไม่มีรายการรออนุมัติ (ดำเนินการอนุมัติครบถ้วนแล้ว)</span>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => setIsHistoryOpen(true)}
                                                                    className="mt-2 text-blue-500 hover:text-blue-600 underline text-sm"
                                                                >
                                                                    ดูประวัติการอนุมัติที่นี่
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                            return renderedLines;
                                        })()}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/10 rounded-b-lg">
                                <POSummaryPanel control={control} detailData={detailData} />
                            </div>
                        </div>
                    </div>

                </div>


                {/* Modals */}
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={handleConfirmApprove}
                    title={isPartialApproval ? "ยืนยันการอนุมัติบางส่วน" : "ยืนยันการอนุมัติใบสั่งซื้อ"}
                    description={isPartialApproval 
                        ? "คุณแน่ใจหรือไม่ว่าต้องการอนุมัติใบสั่งซื้อนี้แบบบางส่วน? รายการที่ไม่เลือกหรือมียอดลดลงจะถูกบันทึกตามจริง" 
                        : "คุณแน่ใจหรือไม่ว่าต้องการอนุมัติใบสั่งซื้อนี้? ข้อมูลจะถูกบันทึกและเปลี่ยนสถานะเป็นอนุมัติแล้ว"
                    }
                    confirmText={isPartialApproval ? "ยืนยันอนุมัติบางส่วน" : "ยืนยันอนุมัติ"}
                />

                <ConfirmationModal
                    isOpen={isRejectModalOpen}
                    onClose={() => setIsRejectModalOpen(false)}
                    onConfirm={handleConfirmReject}
                    title="ยืนยันการไม่อนุมัติใบสั่งซื้อ"
                    description="คุณต้องการไม่อนุมัติรายการที่เลือกใช่หรือไม่? ข้อมูลจะถูกบันทึกและเปลี่ยนสถานะเป็นไม่อนุมัติ"
                    confirmText="ยืนยันการไม่อนุมัติ"
                    isLoading={isSubmitting}
                    variant="danger"
                />

                <POSearchModal
                    isOpen={isPOSearchModalOpen}
                    onClose={() => setIsPOSearchModalOpen(false)}
                    onSelect={handlePOSelect}
                />

                <POAHistoryModal
                    isOpen={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                    poId={poId || detailData?.po_id || initialValues?.po_id}
                    poNo={detailData?.po_no || initialValues?.po_no}
                />
            </WindowFormLayout>
        </FormProvider>
    );
}
