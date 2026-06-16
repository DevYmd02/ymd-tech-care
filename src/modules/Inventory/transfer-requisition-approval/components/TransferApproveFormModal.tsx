/**
 * @file TransferApproveFormModal.tsx
 * @description หน้าต่างฟอร์มอนุมัติใบขอโอนย้ายสินค้า (Transfer Requisition Approval Form Modal)
 */

import React, { useState } from 'react';
import { FormProvider, type SubmitHandler } from 'react-hook-form';
import { ClipboardList, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { WindowFormLayout } from '@ui';
import { ConfirmationModal } from '@system/ConfirmationModal';
import { TransferApproveHeader } from './TransferApproveHeader';
import { TransferApproveFormLines } from './TransferApproveFormLines';
import { TransferSearchModal } from './TransferSearchModal';
import { useTransferApprovalForm } from '../hooks/useTransferApprovalForm';
import type { TransferApprovalFormData } from '../schemas/transfer-approval.schemas';
import type { TransferRequisitionListItem } from '../../transfer-requisition/types/transfer.types';
import type {
    BranchListItem,
    EmployeeListItem,
    UOMListItem,
} from '@/modules/master-data/types/master-data-types';

interface TransferApproveFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    requisitionId?: string | null;
    onSuccess?: () => void;
    readOnly?: boolean;
}

const cardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden';

export const TransferApproveFormModal: React.FC<TransferApproveFormModalProps> = ({
    isOpen,
    onClose,
    editId,
    requisitionId,
    onSuccess,
    readOnly = false,
}) => {
    const [selectedRequisitionId, setSelectedRequisitionId] = useState<string | null>(null);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    const {
        formMethods,
        onSubmit,
        handleFormError,
        isSaving,
        isLoading,
        isEditMode,
        fields,
        branches,
        employees,
        uoms,
        icOptions,
        setValue,
    } = useTransferApprovalForm({ 
        isOpen, 
        onClose, 
        editId, 
        requisitionId: requisitionId || selectedRequisitionId, 
        onSuccess 
    });

    const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
    const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<TransferApprovalFormData | null>(null);
    const [isPartialApproval, setIsPartialApproval] = useState(false);

    const appvFlag = formMethods.watch('appv_flag');
    const rejectReason = formMethods.watch('reject_reason') || '';

    const handleSelectRequisition = (reqId: string, item?: TransferRequisitionListItem) => {
        setSelectedRequisitionId(reqId);
        if (item) {
            setValue('transfer_req_no', item.transfer__req_no);
        }
    };

    const onFormSubmit: SubmitHandler<TransferApprovalFormData> = (data) => {
        if (data.appv_flag === 'N') {
            setIsRejectConfirmOpen(true);
        } else {
            const partial = data.lines.some(l => Number(l.appv_stock_qty) < Number(l.qty_ic));
            setIsPartialApproval(partial);
            setIsApproveConfirmOpen(true);
        }
        setPendingData(data);
    };

    const handleRejectClick = () => {
        if (appvFlag !== 'N') {
            setValue('appv_flag', 'N');
            return;
        }

        if (!rejectReason.trim()) {
            formMethods.setError('reject_reason', {
                type: 'manual',
                message: 'กรุณาระบุเหตุผลในการปฏิเสธการอนุมัติ',
            });
            return;
        }

        formMethods.handleSubmit(onFormSubmit, handleFormError)();
    };

    const handleCancelRejectMode = () => {
        setValue('appv_flag', 'Y');
        setValue('reject_reason', '');
        formMethods.clearErrors('reject_reason');
    };

    const handleConfirmSave = async () => {
        if (!pendingData || isSaving) return;
        const dataToSubmit = { ...pendingData };
        if (dataToSubmit.appv_flag === 'N') {
            dataToSubmit.lines = dataToSubmit.lines.map(line => ({ ...line, appv_stock_qty: 0 }));
        }
        await onSubmit(dataToSubmit);
    };

    const formTitle = readOnly
        ? 'รายละเอียดการอนุมัติใบขอโอนย้ายสินค้า (VIEW Transfer Requisition Approval)'
        : isEditMode
            ? 'แก้ไขข้อมูลการอนุมัติใบขอโอนย้ายสินค้า (EDIT Transfer Requisition Approval)'
            : 'สร้างรายการอนุมัติใบขอโอนย้ายสินค้าใหม่ (CREATE Transfer Requisition Approval)';

    const ModalFooter = (
        <div className="flex justify-between items-center w-full bg-slate-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
            <div />
            <div className="flex gap-2">
                <button 
                    type="button" 
                    onClick={onClose}
                    disabled={isSaving}
                    className="h-10 px-6 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                    {isEditMode ? 'ปิด' : 'ยกเลิก'}
                </button>
                {!readOnly && (
                    <>
                        {appvFlag === 'N' && (
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
                            {appvFlag === 'N' ? 'ยืนยันการปฏิเสธ' : 'ปฏิเสธ (Reject)'}
                        </button>
                        {appvFlag !== 'N' && (
                            <button
                                type="submit"
                                form="transfer-approve-form"
                                disabled={isSaving}
                                className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                {isSaving ? 'กำลังบันทึก...' : (isEditMode ? 'บันทึกการแก้ไข' : 'อนุมัติ (Approve)')}
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
                title={formTitle}
                headerColor={readOnly ? 'bg-slate-600' : 'bg-emerald-600'}
                footer={ModalFooter}
                titleIcon={
                    <div className="bg-white/20 p-1.5 rounded shadow-sm text-white">
                        <ClipboardList size={16} strokeWidth={3} />
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
                            <form id="transfer-approve-form" onSubmit={formMethods.handleSubmit(onFormSubmit, handleFormError)} className="w-full space-y-6">
                                {/* 1. Header Section */}
                                <div className={cardClass}>
                                    <div className="p-6">
                                        <TransferApproveHeader
                                            branchOptions={branches.map((b: BranchListItem) => ({
                                                id: String(b.branch_id || b.id || ''),
                                                name: b.branch_name || ''
                                            }))}
                                            empOptions={employees.map((e: EmployeeListItem) => ({
                                                id: String(e.employee_id || e.id || ''),
                                                name: e.employee_fullname || e.employee_name || ''
                                            }))}
                                            readOnly={readOnly}
                                        />
                                    </div>
                                </div>

                                {/* 2. Line Items Section */}
                                <div className={cardClass}>
                                    <div className="p-6">
                                        <TransferApproveFormLines
                                            fields={fields}
                                            readOnly={readOnly}
                                            uomOptions={uoms.map((u: UOMListItem) => ({
                                                id: String(u.uom_id ?? u.id ?? ''),
                                                name: u.uom_name || ''
                                            }))}
                                            icOptions={icOptions}
                                        />
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </FormProvider>

                <ConfirmationModal 
                    isOpen={isApproveConfirmOpen}
                    onClose={() => !isSaving && setIsApproveConfirmOpen(false)}
                    onConfirm={handleConfirmSave}
                    title={isPartialApproval ? 'ยืนยันการอนุมัติบางส่วน' : 'ยืนยันการอนุมัติข้อมูล'}
                    description={isPartialApproval
                        ? 'จำนวนอนุมัติน้อยกว่าจำนวนที่ขอในบางรายการ เอกสารนี้จะถูกบันทึกเป็นสถานะ "อนุมัติบางส่วน" และสามารถอนุมัติส่วนที่เหลือได้ภายหลัง ต้องการดำเนินการต่อหรือไม่?'
                        : 'คุณต้องการบันทึกข้อมูลการอนุมัติใบขอโอนย้ายนี้ใช่หรือไม่?'
                    }
                    confirmText={isPartialApproval ? 'ยืนยันอนุมัติบางส่วน' : 'ยืนยันการบันทึก'}
                    cancelText="ยกเลิก"
                    variant={isPartialApproval ? 'warning' : 'info'}
                    isLoading={isSaving}
                />

                <ConfirmationModal
                    isOpen={isRejectConfirmOpen}
                    onClose={() => !isSaving && setIsRejectConfirmOpen(false)}
                    onConfirm={handleConfirmSave}
                    title="ยืนยันการปฏิเสธการโอนย้าย"
                    description="คุณต้องการปฏิเสธใบขอโอนย้ายนี้ใช่หรือไม่? สถานะของเอกสารจะเปลี่ยนเป็น 'ไม่อนุมัติ' และจำนวนที่ถูกอนุมัติจะเป็น 0 ทั้งหมด"
                    confirmText="ยืนยันปฏิเสธ"
                    cancelText="ยกเลิก"
                    variant="danger"
                    isLoading={isSaving}
                />

                <TransferSearchModal
                    isOpen={isSearchModalOpen}
                    onClose={() => setIsSearchModalOpen(false)}
                    onSelect={handleSelectRequisition}
                />
            </WindowFormLayout>
        </>
    );
};
