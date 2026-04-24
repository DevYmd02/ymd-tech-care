import React from 'react';
import { StatusBadge } from '@ui/feedback/StatusBadge';

const SQ_STATUS_CONFIG: Record<string, { label: string; colorClass: string }> = {
  // Backend standard (Uppercase)
  DRAFT: {
    label: 'แบบร่าง',
    colorClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  },
  PENDING: {
    label: 'รออนุมัติ',
    colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  SENT: {
    label: 'ส่งแล้ว',
    colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  ACCEPTED: {
    label: 'อนุมัติแล้ว',
    colorClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  EXPIRED: {
    label: 'หมดอายุ',
    colorClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
  REJECTED: {
    label: 'ไม่อนุมัติ',
    colorClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  CANCELLED: {
    label: 'ยกเลิก',
    colorClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  APPROVED: {
    label: 'อนุมัติแล้ว',
    colorClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  // UI/Legacy fallbacks
  Draft: {
    label: 'แบบร่าง',
    colorClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  },
  Sent: {
    label: 'รออนุมัติ',
    colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  Approved: {
    label: 'อนุมัติแล้ว',
    colorClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  Rejected: {
    label: 'ไม่อนุมัติ',
    colorClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
};

export const SQStatusBadge: React.FC<{ status: string; className?: string }> = ({ 
  status, 
  className = '' 
}) => {
  const config = SQ_STATUS_CONFIG[status] || {
    label: status,
    colorClass: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <StatusBadge 
      label={config.label} 
      colorClass={config.colorClass} 
      className={className} 
    />
  );
};
