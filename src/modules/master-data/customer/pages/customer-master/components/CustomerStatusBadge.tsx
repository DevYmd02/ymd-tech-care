import { type FC } from 'react';
import type { CustomerStatus } from '@customer/types/customer-types';

const customerStatusConfig: Record<CustomerStatus, { label: string; colorClass: string; dotColor: string }> = {
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
};

export const CustomerStatusBadge: FC<{ status: CustomerStatus; className?: string }> = ({ status, className = '' }) => {
  const config = customerStatusConfig[status] || customerStatusConfig.INACTIVE;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold rounded-full border shadow-sm transition-all duration-200 whitespace-nowrap ${config.colorClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${config.dotColor}`} />
      {config.label}
    </span>
  );
};
