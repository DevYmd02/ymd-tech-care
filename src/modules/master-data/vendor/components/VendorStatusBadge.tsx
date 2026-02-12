import React from 'react';
import type { VendorStatus } from '@/modules/master-data/vendor/types/vendor-types';

const vendorStatusConfig: Record<VendorStatus, { label: string; colorClass: string; dotColor: string }> = {
  ACTIVE: {
    label: 'ใช้งาน',
    colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    dotColor: 'bg-emerald-500',
  },
  INACTIVE: {
    label: 'ไม่ใช้งาน',
    colorClass: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
    dotColor: 'bg-slate-400',
  },
  SUSPENDED: {
    label: 'ระงับชั่วคราว',
    colorClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    dotColor: 'bg-amber-500',
  },
  BLACKLISTED: {
    label: 'บัญชีดำ',
    colorClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
    dotColor: 'bg-rose-500',
  },
};

export const VendorStatusBadge: React.FC<{ status: VendorStatus; className?: string }> = ({ status, className = '' }) => {
  const config = vendorStatusConfig[status] || vendorStatusConfig.INACTIVE;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-full border shadow-sm transition-all duration-200 whitespace-nowrap ${config.colorClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${config.dotColor}`} />
      {config.label}
    </span>
  );
};
