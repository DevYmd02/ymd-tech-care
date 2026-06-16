/**
 * @file TransferInModal.tsx
 * @description Form Modal สำหรับ Transfer In (ใบโอนย้ายสินค้าเข้า)
 */

import { FormProvider } from 'react-hook-form';
import { Save, X, Loader2, ClipboardList } from 'lucide-react';
import { WindowFormLayout, FormSkeleton } from '@ui';
import { useTransferIn } from '../hooks/useTransferIn';
import { TransferInFormHeader } from './TransferInFormHeader';
import { TransferInFormLines } from './TransferInFormLines';
import { useConfirmation } from '@/shared/hooks/useConfirmation';

import type { PendingTransferInItem } from '../types/transfer-in.types';

interface TransferInModalProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    readOnly?: boolean;
    pendingData?: PendingTransferInItem | null;
    onSuccess?: () => void;
}

export function TransferInModal({
    isOpen,
    onClose,
    editId,
    readOnly = false,
    pendingData,
    onSuccess,
}: TransferInModalProps) {
    const {
        formMethods,
        handleSubmit,
        onSubmit,
        isSaving,
        isLoading,
        isEditMode,
        onClose: handleSafeClose,
        branches,
        employees,
        warehouses,
        departments,
        projects,
        uoms,
        icOptions,
    } = useTransferIn({ isOpen, onClose, editId, pendingData, onSuccess });

    const { confirm } = useConfirmation();

    const formTitle = isEditMode ? (readOnly ? "ดูรายละเอียดใบโอนย้ายเข้า" : "แก้ไขใบโอนย้ายเข้า") : "สร้างใบโอนย้ายเข้า";

    const handleSaveClick = handleSubmit(async (data) => {
        const isConfirmed = await confirm({
            title: 'ยืนยันการบันทึกข้อมูล',
            description: isEditMode 
                ? 'คุณต้องการบันทึกการแก้ไขใบโอนย้ายสินค้าเข้าใช่หรือไม่?' 
                : 'คุณต้องการบันทึกใบโอนย้ายสินค้าเข้าใช่หรือไม่?',
            confirmText: 'บันทึกข้อมูล',
            cancelText: 'ยกเลิก',
            variant: 'info'
        });

        if (isConfirmed) {
            onSubmit(data);
        }
    });

    const ModalFooter = (
        <div className="flex justify-between items-center w-full bg-slate-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
            <div />
            <div className="flex gap-2">
                <button
                    onClick={handleSafeClose}
                    disabled={isSaving}
                    className="h-10 px-6 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                >
                    <X size={16} className="inline mr-1" /> ยกเลิก
                </button>
                {!readOnly && (
                    <button
                        type="button"
                        onClick={handleSaveClick}
                        disabled={isSaving || isLoading}
                        className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} บันทึก
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <WindowFormLayout
            isOpen={isOpen}
            onClose={handleSafeClose}
            title={formTitle}
            titleIcon={<ClipboardList size={16} strokeWidth={3} className="text-white" />}
            footer={ModalFooter}
            headerColor={readOnly ? 'bg-slate-600' : 'bg-emerald-600'}
        >
            {isLoading ? (
                <div className="p-6">
                    <FormSkeleton rows={4} />
                </div>
            ) : (
                <FormProvider {...formMethods}>
                    <div className="flex flex-col h-[calc(100vh-140px)] bg-gray-50 dark:bg-gray-900 overflow-y-auto">
                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 flex-1 flex flex-col min-h-0">
                            {/* 1. Header Section */}
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
                                <div className="p-6">
                                    <TransferInFormHeader readOnly={readOnly} pendingData={pendingData} branches={branches} employees={employees} departments={departments} projects={projects} />
                                </div>
                            </div>

                            {/* 2. Line Items Section */}
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col min-h-0 shrink-0">
                                <div className="p-6 flex-1 flex flex-col min-h-0">
                                    <TransferInFormLines readOnly={readOnly} warehouses={warehouses} uoms={uoms} icOptions={icOptions} />
                                </div>
                            </div>
                        </form>
                    </div>
                </FormProvider>
            )}
        </WindowFormLayout>
    );
}
