import React, { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { ShieldCheck, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { WindowFormLayout } from '@ui';
import { ConfirmationModal } from '@system/ConfirmationModal';
import { useRequisitionApproveForm } from '../hooks/useRequisitionApproveForm';
import { RequisitionApproveHeader } from './RequisitionApproveHeader';
import { RequisitionApproveFormLines } from './RequisitionApproveFormLines';
import { RequisitionApproveFormSummary } from './RequisitionApproveFormSummary';

interface RequisitionApproveFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    requisitionId?: string | null;
    onSuccess?: () => void;
    readOnly?: boolean;
}

const cardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden';

export const RequisitionApproveFormModal: React.FC<RequisitionApproveFormModalProps> = ({
    isOpen,
    onClose,
    requisitionId,
    onSuccess,
    readOnly = false,
}) => {
    const {
        formMethods,
        employees,
        isLoading,
        isSaving,
        handleApprove,
        handleReject,
    } = useRequisitionApproveForm({ isOpen, onClose, requisitionId, onSuccess });

    const { watch, setValue } = formMethods;

    const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
    const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);

    const status = watch('status') as string;
    const rejectReason = watch('reject_reason') || '';

    // Checks if the requisition status is already finalized
    const isFinalized = readOnly || status === 'APPROVED' || status === 'REJECTED';

    const handleRejectClick = () => {
        if (status !== 'REJECTED') {
            setValue('status', 'REJECTED');
            return;
        }

        if (!rejectReason.trim()) {
            formMethods.setError('reject_reason', {
                type: 'manual',
                message: 'กรุณาระบุเหตุผลในการปฏิเสธการอนุมัติ',
            });
            return;
        }

        setIsRejectConfirmOpen(true);
    };

    const handleConfirmReject = () => {
        handleReject(rejectReason);
        setIsRejectConfirmOpen(false);
    };

    const handleApproveClick = () => {
        setValue('status', 'APPROVED');
        setIsApproveConfirmOpen(true);
    };

    const handleConfirmApprove = () => {
        handleApprove();
        setIsApproveConfirmOpen(false);
    };

    const handleCancelRejectMode = () => {
        setValue('status', 'PENDING');
        setValue('reject_reason', '');
        formMethods.clearErrors('reject_reason');
    };

    const modalFooter = (
        <div className="flex justify-between items-center w-full bg-slate-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
            <div />
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSaving}
                    className="h-10 px-6 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                    ปิด
                </button>

                {!isFinalized && (
                    <>
                        {status === 'REJECTED' && (
                            <button
                                type="button"
                                onClick={handleCancelRejectMode}
                                disabled={isSaving}
                                className="h-10 px-6 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                            >
                                ยกเลิกปฏิเสธ
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleRejectClick}
                            disabled={isSaving}
                            className="h-10 px-6 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/35 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                        >
                            <XCircle size={18} />
                            {status === 'REJECTED' ? 'ยืนยันการปฏิเสธ' : 'ปฏิเสธ (Reject)'}
                        </button>
                        {status !== 'REJECTED' && (
                            <button
                                type="button"
                                onClick={handleApproveClick}
                                disabled={isSaving}
                                className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                อนุมัติ (Approve)
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    return (
        <>
            <WindowFormLayout
                isOpen={isOpen}
                onClose={onClose}
                title="พิจารณาอนุมัติใบขอเบิก (Requisition Approval)"
                headerColor="bg-emerald-700"
                footer={modalFooter}
                titleIcon={
                    <div className="bg-white/20 p-1.5 rounded shadow-sm text-white">
                        <ShieldCheck size={16} strokeWidth={3} />
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
                                <Loader2 className="animate-spin text-emerald-600" size={32} />
                            </div>
                        ) : (
                            <div className="w-full space-y-6">
                                <div className={cardClass}>
                                    <div className="p-6">
                                        <RequisitionApproveHeader
                                            empOptions={employees.map(e => ({
                                                id: String(e.employee_id || e.id || ''),
                                                name: e.employee_fullname || e.employee_name || '',
                                            }))}
                                        />
                                    </div>
                                </div>

                                <div className={cardClass}>
                                    <div className="p-6">
                                        <RequisitionApproveFormLines />
                                    </div>
                                </div>

                                <div className={cardClass}>
                                    <div className="p-6">
                                        <RequisitionApproveFormSummary />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </FormProvider>
            </WindowFormLayout>

            <ConfirmationModal
                isOpen={isApproveConfirmOpen}
                onClose={() => setIsApproveConfirmOpen(false)}
                onConfirm={handleConfirmApprove}
                title="ยืนยันการอนุมัติใบขอเบิก"
                description="คุณต้องการอนุมัติใบขอเบิกใบนี้ใช่หรือไม่? เมื่ออนุมัติแล้วข้อมูลจะถูกบันทึกและไม่สามารถแก้ไขได้"
                confirmText="ยืนยันอนุมัติ"
                cancelText="ยกเลิก"
                variant="success"
                isLoading={isSaving}
            />

            <ConfirmationModal
                isOpen={isRejectConfirmOpen}
                onClose={() => setIsRejectConfirmOpen(false)}
                onConfirm={handleConfirmReject}
                title="ยืนยันการปฏิเสธใบขอเบิก"
                description="คุณต้องการปฏิเสธใบขอเบิกใบนี้ใช่หรือไม่? สถานะของเอกสารจะเปลี่ยนเป็น 'ไม่อนุมัติ'"
                confirmText="ยืนยันปฏิเสธ"
                cancelText="ยกเลิก"
                variant="danger"
                isLoading={isSaving}
            />
        </>
    );
};
