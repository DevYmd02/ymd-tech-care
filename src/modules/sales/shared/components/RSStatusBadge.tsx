import React from 'react';
import { StatusBadge } from '@ui/feedback/StatusBadge';

const RS_STATUS_CONFIG: Record<string, { label: string; colorClass: string }> = {
  DRAFT: {
    label: 'แบบร่าง',
    colorClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  },
  CONFIRMED: {
    label: 'ยืนยันแล้ว',
    colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  POSTED: {
    label: 'ดำเนินการแล้ว',
    colorClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  RELEASED: {
    label: 'จ่ายของแล้ว',
    colorClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  EXPIRED: {
    label: 'หมดอายุ',
    colorClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
  CANCELLED: {
    label: 'ยกเลิก',
    colorClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
};

export const RSStatusBadge: React.FC<{ status: string; className?: string }> = ({ 
  status, 
  className = '' 
}) => {
  const config = RS_STATUS_CONFIG[status] || {
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
