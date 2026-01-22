/**
 * @file QCFooter.tsx
 * @description Footer สำหรับ Quote Comparison Modal - 2 ปุ่ม: ยกเลิก + บันทึกใบเปรียบเทียบราคา
 */

import React from 'react';
import { X, Save } from 'lucide-react';

interface QCFooterProps {
  onSave: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const QCFooter: React.FC<QCFooterProps> = ({ onSave, onCancel, isLoading = false }) => {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center gap-3">
      {/* ปุ่มยกเลิก */}
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
      >
        <X size={16} />
        ยกเลิก
      </button>

      {/* ปุ่มบันทึกใบเปรียบเทียบราคา */}
      <button
        type="button"
        onClick={onSave}
        disabled={isLoading}
        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
      >
        <Save size={16} />
        {isLoading ? 'กำลังบันทึก...' : 'บันทึกใบเปรียบเทียบราคา'}
      </button>
    </div>
  );
};
