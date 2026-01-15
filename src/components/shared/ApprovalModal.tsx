/**
 * @file ApprovalModal.tsx
 * @description Modal ยืนยันการอนุมัติ/ปฏิเสธ ใบขอซื้อ
 * @usage ใช้ใน PRListPage สำหรับ Batch Approval
 */

import React, { useState } from 'react';
import { styles } from '../../constants';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

interface ApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (remark: string) => void;
    action: 'approve' | 'reject';
    count: number;
}

// ====================================================================================
// COMPONENT - ApprovalModal
// ====================================================================================

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    action,
    count
}) => {
    const [remark, setRemark] = useState('');

    if (!isOpen) return null;

    const isApprove = action === 'approve';
    const title = isApprove ? 'ยืนยันการอนุมัติ' : 'ยืนยันการปฏิเสธ';
    const buttonColor = isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';
    const buttonText = isApprove ? 'อนุมัติ' : 'ปฏิเสธ';

    const handleConfirm = () => {
        if (!isApprove && !remark.trim()) {
            alert('กรุณาระบุเหตุผลในการปฏิเสธ');
            return;
        }
        onConfirm(remark);
        setRemark('');
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modalContent} w-full max-w-md p-6`}>
                {/* Title */}
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{title}</h2>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                    คุณต้องการ{isApprove ? 'อนุมัติ' : 'ปฏิเสธ'} <strong>{count}</strong> รายการ ใช่หรือไม่?
                </p>

                {/* Remark Input */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        หมายเหตุ {!isApprove && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        className={styles.textarea}
                        rows={3}
                        placeholder={isApprove ? 'หมายเหตุ (ถ้ามี)' : 'กรุณาระบุเหตุผล'}
                    />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className={styles.btnSecondary}
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-4 py-2 ${buttonColor} text-white rounded-lg font-semibold transition-colors`}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};
