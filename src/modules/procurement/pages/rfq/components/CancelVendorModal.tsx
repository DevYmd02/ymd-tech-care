import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface CancelVendorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (remark: string) => void;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export const CancelVendorModal: React.FC<CancelVendorModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'ยกเลิกผู้ขาย (Cancel Vendor)',
    description = 'กรุณาระบุหมายเหตุที่ต้องการยกเลิกผู้ขายรายนี้',
    confirmText = 'ยืนยันยกเลิก',
    cancelText = 'ย้อนกลับ',
    isLoading = false
}) => {
    const [remark, setRemark] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (!remark.trim()) {
            setError('กรุณากรอกหมายเหตุ/เหตุผลในการยกเลิก');
            return;
        }
        setError('');
        onConfirm(remark);
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Backdrop click to close - Disabled when loading */}
            <div className={`absolute inset-0 ${isLoading ? 'pointer-events-none' : ''}`} onClick={onClose} />

            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={24} />
                    </div>

                    <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-4 text-sm whitespace-pre-line">
                        {description}
                    </p>

                    {/* Remark Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            หมายเหตุ / Remark <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={remark}
                            onChange={(e) => {
                                setRemark(e.target.value);
                                if (e.target.value.trim()) setError('');
                            }}
                            rows={3}
                            className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-teal-500'} rounded-lg focus:outline-none focus:ring-2 focus:border-transparent dark:text-white resize-none`}
                            placeholder="ระบุเหตุผล เช่น ติดต่อไม่ได้, ปฏิเสธราคากลาง, etc."
                            disabled={isLoading}
                        />
                        {error && (
                            <p className="mt-1 text-xs text-red-500 font-medium">
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3 justify-center">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded-lg text-white font-medium text-sm shadow-sm transition-colors flex items-center gap-2 bg-red-600 hover:bg-red-700 ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
                        >
                            {isLoading && <Loader2 className="animate-spin" size={16} />}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
