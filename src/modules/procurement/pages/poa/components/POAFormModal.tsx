import { FormProvider, useWatch, Controller } from 'react-hook-form';
import { 
    CheckCircle, XCircle, FileText, Loader2
} from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { parseDiscountAmount } from '@/modules/procurement/utils/pricing.utils';
import { useMemo } from 'react';

import { WindowFormLayout } from '@/shared/components/ui/layout/WindowFormLayout';
import { ConfirmationModal } from '@/shared/components/system/ConfirmationModal';
import { usePOAForm } from '../hooks/usePOAForm';
import type { POListItem } from '@/modules/procurement/types';

const ui = {
    label: 'text-sm font-medium text-blue-700 dark:text-blue-300 mb-1 block',
    input: 'w-full h-8 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all',
    inputRO: 'w-full h-8 px-3 text-sm bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg cursor-not-allowed font-medium',
    error: 'text-red-500 text-[10px] mt-0.5 font-medium',
};

const POSummaryPanel = ({ control, detailData }: { control: any; detailData: any }) => {
    const poLines = useWatch({ control, name: 'po_lines' });

    const { grossTotal, totalDiscount, taxAmount, totalAmount, taxRate } = useMemo(() => {
        const approvedLines = (poLines ?? []).filter((l: any) => !!l.is_approved);
        const grossTotal = approvedLines.reduce((sum: number, l: any) => sum + (Number(l.qty_ordered ?? 0) * Number(l.unit_price ?? 0)), 0);
        const totalDiscount = approvedLines.reduce((sum: number, l: any) => {
            const lineGross = Number(l.qty_ordered ?? 0) * Number(l.unit_price ?? 0);
            return sum + parseDiscountAmount(l.discount_expression || '0', lineGross);
        }, 0);
        const subtotal = grossTotal - totalDiscount;
        const taxRate = detailData?.tax_code?.tax_rate ?? detailData?.tax_rate ?? 7;
        const taxAmount = subtotal * (Number(taxRate) / 100);
        return { grossTotal, totalDiscount, taxAmount, totalAmount: subtotal + taxAmount, taxRate };
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
            <div className="border-t border-gray-200 dark:border-slate-700 pt-3 flex justify-between items-baseline">
                <span className="text-base font-bold text-gray-800 dark:text-slate-200">รวมสุทธิ</span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
        </div>
    );
};

interface POAFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    poId?: number;
    initialValues?: Partial<POListItem>;
}

export const POAFormModal = ({
    isOpen,
    onClose,
    onSuccess,
    poId,
    initialValues,
}: POAFormModalProps) => {

    const {
        formMethods,
        control,
        register,
        handleSubmit,
        fields,
        onSubmit,
        onInvalidSubmit,
        isConfirmModalOpen,
        setIsConfirmModalOpen,
        handleConfirmApprove,
        isRejectModalOpen,
        setIsRejectModalOpen,
        openRejectModal,
        handleConfirmReject,
        isSubmitting,
        detailData,
        isLoadingDetail,
    } = usePOAForm({ isOpen, onClose, onSuccess, poId, initialValues });

    const poLinesValues = useWatch({ control, name: 'po_lines' });

    if (!isOpen) return null;

    return (
        <FormProvider {...formMethods}>
            <WindowFormLayout
                isOpen={isOpen}
                onClose={onClose}
                title={'พิจารณาอนุมัติใบสั่งซื้อ (Purchase Order Approval)'}
                titleIcon={
                    <div className="bg-white/20 p-1 rounded-md shadow-sm">
                        <CheckCircle size={14} strokeWidth={3} className="text-white" />
                    </div>
                }
                headerColor="bg-emerald-600"
                footer={
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end items-center bg-slate-100 dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md text-sm font-medium transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                onClick={openRejectModal}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <XCircle size={14} /> ปฏิเสธ (Reject)
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit(onSubmit, onInvalidSubmit)}
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-md text-sm font-medium shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle size={14} />} 
                                {isSubmitting ? 'กำลังประมวลผล...' : 'อนุมัติ (Approve)'}
                            </button>
                        </div>
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
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border-b border-gray-200 dark:border-gray-700 pb-3">
                                <FileText size={18} />
                                <span className="font-semibold">ส่วนหัวเอกสาร — Header PO (Purchase Order)</span>
                            </div>

                            {isLoadingDetail ? (
                                <div className="flex justify-center items-center py-12">
                                    <Loader2 className="animate-spin text-emerald-600 mr-2" size={20} />
                                    <span className="text-sm text-slate-500 font-medium">กำลังโหลดข้อมูล...</span>
                                </div>
                            ) : (
                                <>
                                    {/* ── Row 1: เลขที่ PO | วันที่ PO | อ้างอิง PR | อ้างอิง QC ── */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className={ui.label}>เลขที่ PO</label>
                                            <input value={detailData?.po_no || '-'} className={ui.inputRO} readOnly placeholder="ระบบจะสร้างอัตโนมัติ" />
                                        </div>
                                        <div>
                                            <label className={ui.label}>วันที่ PO</label>
                                            <input value={detailData?.po_date ? formatThaiDate(detailData.po_date) : '-'} className={ui.inputRO} readOnly />
                                        </div>
                                        <div>
                                            <label className={ui.label}>อ้างอิง PR</label>
                                            <input value={detailData?.pr_no || '-'} className={ui.inputRO} readOnly placeholder="-" />
                                        </div>
                                        <div>
                                            <label className={ui.label}>อ้างอิง QC</label>
                                            <input value={detailData?.qc_no || '-'} className={ui.inputRO} readOnly placeholder="-" />
                                        </div>
                                    </div>

                                    {/* ── Row 2: ผู้ขาย | สาขา | คลังสินค้าปลายทาง ── */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className={ui.label}>ผู้ขาย</label>
                                            <input value={detailData?.vendor_name || '-'} className={ui.inputRO} readOnly />
                                        </div>
                                        <div>
                                            <label className={ui.label}>สาขา</label>
                                            <input value={(detailData as any)?.branch?.branch_name || (detailData as any)?.branch_name || '-'} className={ui.inputRO} readOnly />
                                        </div>
                                        <div>
                                            <label className={ui.label}>คลังสินค้าปลายทาง</label>
                                            <input value={(detailData as any)?.ship_to_warehouse?.warehouse_name || (detailData as any)?.ship_to_warehouse_name || '-'} className={ui.inputRO} readOnly />
                                        </div>
                                    </div>

                                    {/* ── Row 3: เครดิตเทอม | กำหนดส่งของ | ประเภทภาษี | ผู้จัดทำ ── */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className={ui.label}>เครดิตเทอม (วัน)</label>
                                            <input value={(detailData as any)?.payment_term_days || '-'} className={`${ui.inputRO} text-right`} readOnly />
                                        </div>
                                        <div>
                                            <label className={ui.label}>กำหนดส่งของ</label>
                                            <input value={(detailData as any)?.delivery_date ? formatThaiDate((detailData as any).delivery_date) : '-'} className={ui.inputRO} readOnly />
                                        </div>
                                        <div>
                                            <label className={ui.label}>ประเภทภาษี</label>
                                            <input value={(detailData as any)?.tax_code?.tax_name || (detailData as any)?.tax_name || '-'} className={ui.inputRO} readOnly />
                                        </div>
                                        <div>
                                            <label className={ui.label}>ผู้จัดทำ</label>
                                            <input value={(detailData as any)?.created_by_name || '-'} className={ui.inputRO} readOnly />
                                        </div>
                                    </div>

                                    {/* ── Row 4: Currency Detail Fields ── */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg">
                                        <div>
                                            <label className={ui.label}>วันที่อัตราแลกเปลี่ยน</label>
                                            <input value={(detailData as any)?.exchange_rate_date ? formatThaiDate((detailData as any).exchange_rate_date) : '-'} className={ui.inputRO} readOnly />
                                        </div>
                                        <div>
                                            <label className={ui.label}>รหัสสกุลเงิน</label>
                                            <input value={detailData?.currency_code || 'THB'} className={ui.inputRO} readOnly />
                                        </div>
                                        <div>
                                            <label className={ui.label}>อัตราแลกเปลี่ยน</label>
                                            <input value={(detailData as any)?.exchange_rate || '1'} className={`${ui.inputRO} text-right`} readOnly />
                                        </div>
                                    </div>

                                    {/* Remarks */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className={ui.label}>หมายเหตุ (แก้ไขได้)</label>
                                            <textarea 
                                                {...register('remarks')} 
                                                className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white min-h-[60px]"
                                                placeholder="ระบุหมายเหตุสำหรับการอนุมัติ..."
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Lines */}
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
                                            <th className="px-3 py-2 text-left border-r border-blue-500/40 font-semibold">
                                                ชื่อสินค้า/บริการ
                                            </th>
                                            <th className="px-2 py-2 text-center w-24 border-r border-blue-500/40 font-semibold">
                                                จำนวนที่สั่ง
                                            </th>
                                            <th className="px-2 py-2 text-center w-28 border-r border-blue-500/40 bg-emerald-500 text-white font-semibold">
                                                ยอดอนุมัติ
                                            </th>
                                            <th className="px-2 py-2 text-center w-28 border-r border-blue-500/40 font-semibold">
                                                ราคา/หน่วย
                                            </th>
                                            <th className="px-2 py-2 text-center w-32 border-r border-blue-500/40 font-semibold">
                                                ยอดสุทธิ
                                            </th>
                                            <th className="px-2 py-2 text-center w-48 font-semibold">
                                                หมายเหตุ
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                                                    กำลังโหลดรายการสินค้า...
                                                </td>
                                            </tr>
                                        )}
                                        {fields.map((field, idx: number) => {
                                            const lineVal = poLinesValues?.[idx] || {};
                                            const qty = lineVal.qty_ordered ?? 0;
                                            const price = lineVal.unit_price ?? 0;
                                            const total = (Number(qty) || 0) * (Number(price) || 0);
                                            const isApproved = !!lineVal.is_approved;

                                            return (
                                                <tr key={field.id} className={`border-b border-gray-100 dark:border-gray-800 transition-colors ${!isApproved ? 'bg-gray-100/50 dark:bg-gray-800/50 opacity-60' : ''}`}>
                                                    <td className="px-2 py-2 text-center border-r border-gray-200 dark:border-gray-700">
                                                        <Controller
                                                            name={`po_lines.${idx}.is_approved`}
                                                            control={control}
                                                            render={({ field: { value, onChange } }) => (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!value}
                                                                    onChange={e => onChange(e.target.checked)}
                                                                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                                                                />
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-[13px] text-gray-600 font-medium border-r border-gray-200 dark:border-gray-700">{idx + 1}</td>
                                                    <td className="px-3 py-2 border-r border-gray-200 dark:border-gray-700 text-slate-700 dark:text-slate-300">
                                                         {field.item_name || field.description || field.item_code}
                                                     </td>

                                                     {/* จำนวนที่ขอ */}
                                                     <td className="px-2 py-2 text-center border-r border-gray-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 font-medium">
                                                         {(detailData as any)?.po_lines?.[idx]?.qty_ordered ?? (detailData as any)?.lines?.[idx]?.qty_ordered ?? field.qty_ordered ?? '0'}
                                                     </td>

                                                     <td className="px-2 py-2 border-r border-gray-200 dark:border-gray-700">
                                                        <Controller
                                                            name={`po_lines.${idx}.qty_ordered`}
                                                            control={control}
                                                            render={({ field: { value, onChange } }) => (
                                                                <input
                                                                    type="number" step="any"
                                                                    value={value ?? ''}
                                                                    onChange={e => onChange(e.target.valueAsNumber)}
                                                                    disabled={!isApproved}
                                                                    className={`${ui.input} !h-9 text-center text-[14px] font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm disabled:opacity-50`}
                                                                />
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-right border-r border-gray-200 dark:border-gray-700 text-slate-700 dark:text-slate-300">
                                                        {Number(field.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-semibold text-emerald-700 dark:text-emerald-400 text-[13px] bg-emerald-50/10 dark:bg-emerald-900/10 border-r border-gray-200 dark:border-gray-700">
                                                        {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <Controller
                                                            name={`po_lines.${idx}.line_remark`}
                                                            control={control}
                                                            render={({ field: { value, onChange } }) => (
                                                                <input
                                                                    type="text"
                                                                    value={value ?? ''}
                                                                    onChange={onChange}
                                                                    disabled={!isApproved}
                                                                    placeholder="หมายเหตุ..."
                                                                    className={`${ui.input} !h-9 text-sm disabled:opacity-50`}
                                                                />
                                                            )}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Footer Panel */}
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
                    title="ยืนยันการอนุมัติใบสั่งซื้อ"
                    description="คุณแน่ใจหรือไม่ว่าต้องการอนุมัติใบสั่งซื้อนี้? ข้อมูลจะถูกบันทึกและเปลี่ยนสถานะเป็นอนุมัติแล้ว"
                    confirmText="ยืนยันอนุมัติ"
                />

                <ConfirmationModal
                    isOpen={isRejectModalOpen}
                    onClose={() => setIsRejectModalOpen(false)}
                    onConfirm={handleConfirmReject}
                    title="ปฏิเสธการอนุมัติใบสั่งซื้อ"
                    description="กรุณาระบุเหตุผลการปฏิเสธในช่องหมายเหตุก่อนกดยืนยัน"
                    confirmText="ยืนยันปฏิเสธ"
                />

            </WindowFormLayout>
        </FormProvider>
    );
};

