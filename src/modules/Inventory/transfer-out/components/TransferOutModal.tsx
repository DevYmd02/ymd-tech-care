/**
 * @file TransferOutModal.tsx
 * @description Form Modal สำหรับ Transfer Out (ใบโอนย้ายสินค้าออก)
 */

import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { Save, X, Loader2, ClipboardList } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { WindowFormLayout, FormSkeleton } from '@ui';
import { ConfirmationModal } from '@system/ConfirmationModal';
import { useTransferOut } from '../hooks/useTransferOut';
import { TransferOutFormHeader } from './TransferOutFormHeader';
import { TransferOutFormLines } from './TransferOutFormLines';

import type { PendingTransferOutItem } from '../types/transfer-out.types';

interface TransferOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    editId?: string | null;
    readOnly?: boolean;
    pendingData?: PendingTransferOutItem | null;
    onSuccess?: () => void;
}

export function TransferOutModal({
    isOpen,
    onClose,
    editId,
    readOnly = false,
    pendingData,
    onSuccess,
}: TransferOutModalProps) {
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
    } = useTransferOut({ isOpen, onClose, editId, pendingData, onSuccess });

    const { getValues } = formMethods;
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const formTitle = isEditMode ? (readOnly ? "ดูรายละเอียดใบโอนย้ายออก" : "แก้ไขใบโอนย้ายออก") : "สร้างใบโอนย้ายออก";

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
                        onClick={handleSubmit(() => setIsConfirmOpen(true), (err) => {
                            console.error('Validation Errors:', err);
                            toast.error('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
                        })}
                        disabled={isSaving || isLoading}
                        className="h-10 px-8 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
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
            headerColor={readOnly ? 'bg-slate-600' : 'bg-amber-600'}
        >
            {isLoading ? (
                <div className="p-6">
                    <FormSkeleton rows={4} />
                </div>
            ) : (
                <FormProvider {...formMethods}>
                    <div className="flex flex-col h-[calc(100vh-140px)] bg-gray-50 dark:bg-gray-900 overflow-y-auto">
                        <form noValidate onSubmit={handleSubmit(onSubmit, (err) => {
                            console.error('Validation Errors:', err);
                            toast.error('กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง');
                        })} className="p-6 space-y-6 flex-1 flex flex-col min-h-0">
                            {/* 1. Header Section */}
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
                                <div className="p-6">
                                    <TransferOutFormHeader readOnly={readOnly} pendingData={pendingData} branches={branches} employees={employees} departments={departments} projects={projects} />
                                </div>
                            </div>

                            {/* 2. Line Items Section */}
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col min-h-0 shrink-0">
                                <div className="p-6 flex-1 flex flex-col min-h-0">
                                    <TransferOutFormLines readOnly={readOnly} warehouses={warehouses} uoms={uoms} icOptions={icOptions} />
                                </div>
                            </div>
                        </form>
                    </div>
                </FormProvider>
            )}

            <ConfirmationModal 
                isOpen={isConfirmOpen}
                onClose={() => !isSaving && setIsConfirmOpen(false)}
                onConfirm={() => {
                    onSubmit(getValues());
                    setIsConfirmOpen(false);
                }}
                title="ยืนยันการบันทึกข้อมูล"
                description="คุณต้องการบันทึกข้อมูลใบโอนย้ายสินค้าออกนี้ใช่หรือไม่?"
                confirmText="ยืนยันการบันทึก"
                cancelText="ยกเลิก"
                variant="info"
                isLoading={isSaving}
            />
        </WindowFormLayout>
    );
}
