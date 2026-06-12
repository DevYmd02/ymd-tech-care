/**
 * @file TransferApproveFormModal.tsx
 * @description หน้าต่างฟอร์มอนุมัติใบขอโอนย้ายสินค้า (Transfer Requisition Approval Form Modal)
 */

import React, { useState } from 'react';
import { FormProvider, type SubmitHandler } from 'react-hook-form';
import { ClipboardList, Save, Loader2 } from 'lucide-react';
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
    DepartmentListItem,
    Project,
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
        departments,
        projects,
        uoms,
        setValue,
    } = useTransferApprovalForm({ 
        isOpen, 
        onClose, 
        editId, 
        requisitionId: requisitionId || selectedRequisitionId, 
        onSuccess 
    });

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingData, setPendingData] = useState<TransferApprovalFormData | null>(null);

    const handleOpenSearch = () => {
        setIsSearchModalOpen(true);
    };

    const handleSelectRequisition = (reqId: string, item?: TransferRequisitionListItem) => {
        setSelectedRequisitionId(reqId);
        if (item) {
            setValue('transfer_req_no', item.transfer__req_no);
        }
    };

    const onFormSubmit: SubmitHandler<TransferApprovalFormData> = (data) => {
        setPendingData(data);
        setIsConfirmOpen(true);
    };

    const handleConfirmSave = async () => {
        if (!pendingData || isSaving) return;
        await onSubmit(pendingData);
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
                    <button 
                        type="submit" 
                        form="transfer-approve-form"
                        disabled={isSaving}
                        className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? 'กำลังบันทึก...' : (isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล')}
                    </button>
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
                                            deptOptions={departments.map((d: DepartmentListItem) => ({
                                                id: String(d.emp_dept_id || d.department_id || d.id || ''),
                                                name: d.emp_dept_name || d.department_name || d.dept_name || ''
                                            }))}
                                            jobOptions={projects.map((p: Project) => ({
                                                id: String(p.project_id || p.id || ''),
                                                name: p.project_name || ''
                                            }))}
                                            empOptions={employees.map((e: EmployeeListItem) => ({
                                                id: String(e.employee_id || e.id || ''),
                                                name: e.employee_fullname || e.employee_name || ''
                                            }))}
                                            readOnly={readOnly}
                                            onSearchTransfer={handleOpenSearch}
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
                                        />
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </FormProvider>

                <ConfirmationModal 
                    isOpen={isConfirmOpen}
                    onClose={() => !isSaving && setIsConfirmOpen(false)}
                    onConfirm={handleConfirmSave}
                    title="ยืนยันการอนุมัติข้อมูล"
                    description="คุณต้องการบันทึกข้อมูลการอนุมัติใบขอโอนย้ายนี้ใช่หรือไม่?"
                    confirmText="ยืนยันการบันทึก"
                    cancelText="ยกเลิก"
                    variant="info"
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
