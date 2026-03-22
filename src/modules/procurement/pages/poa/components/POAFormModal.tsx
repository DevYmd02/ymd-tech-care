import { FormProvider, useWatch, Controller } from 'react-hook-form';
import { 
    CheckCircle, XCircle, FileText, Loader2
} from 'lucide-react';

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
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center bg-slate-100 dark:bg-gray-900 sticky bottom-0 z-10 gap-x-2">
                        <button
                            type="button"
                            onClick={openRejectModal}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <XCircle size={14} /> ปฏิเสธการอนุมัติ (Reject)
                        </button>
                        
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

                    {/* Header */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 border-b border-gray-200 dark:border-gray-700 pb-3">
                                <FileText size={18} />
                                <span className="font-semibold">ข้อมูลใบสั่งซื้อ</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className={ui.label}>เลขที่ PO</label>
                                    <input {...register('po_no')} className={ui.inputRO} readOnly />
                                </div>
                                <div>
                                    <label className={ui.label}>เอกสารอ้างอิง</label>
                                    <input value={initialValues?.qc_no || initialValues?.pr_no || '-'} className={ui.inputRO} readOnly />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={ui.label}>ชื่อผู้ขาย</label>
                                    <input {...register('vendor_name')} className={ui.inputRO} readOnly />
                                </div>
                            </div>
                            
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
                                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[13px] dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800">
                                        <tr>
                                            <th className="px-2 py-2 text-center w-12 border-r border-slate-200 dark:border-slate-800">ลำดับ</th>
                                            <th className="px-3 py-2 text-left w-48 border-r border-slate-200 dark:border-slate-800 font-medium whitespace-nowrap">
                                                ชื่อสินค้า/บริการ
                                            </th>
                                            <th className="px-3 py-2 text-center w-32 border-r border-slate-200 dark:border-slate-800 font-medium">
                                                จำนวนสั่ง (แก้ไขได้)
                                            </th>
                                            <th className="px-2 py-2 text-center w-24 border-r border-slate-200 dark:border-slate-800 font-medium">
                                                ราคา/หน่วย
                                            </th>
                                            <th className="px-2 py-2 text-center w-32 border-slate-200 dark:border-slate-800 font-medium">
                                                ยอดสุทธิ
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                                    กำลังโหลดรายการสินค้า...
                                                </td>
                                            </tr>
                                        )}
                                        {fields.map((field, idx: number) => {
                                            const lineVal = poLinesValues?.[idx] || {};
                                            const qty = lineVal.qty_ordered ?? 0;
                                            const price = lineVal.unit_price ?? 0;
                                            const total = (Number(qty) || 0) * (Number(price) || 0);

                                            return (
                                                <tr key={field.id} className="border-b border-gray-100 dark:border-gray-800">
                                                    <td className="px-3 py-2 text-center text-[13px] text-gray-600 font-medium border-r border-gray-200 dark:border-gray-700">{idx + 1}</td>
                                                    <td className="px-3 py-2 border-r border-gray-200 dark:border-gray-700 text-slate-700 dark:text-slate-300">
                                                        {field.item_name || field.description || field.item_code}
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
                                                                    className={`${ui.input} !h-9 text-center text-[13px] border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm`}
                                                                />
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-right border-r border-gray-200 dark:border-gray-700 text-slate-700 dark:text-slate-300">
                                                        {Number(field.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-semibold text-emerald-700 dark:text-emerald-400 text-[13px] bg-emerald-50/10 dark:bg-emerald-900/10">
                                                        {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
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
