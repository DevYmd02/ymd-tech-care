/**
 * @file DeliveryStatusBadge.tsx
 * @description Status Badge สำหรับสถานะใบจัดส่งสินค้า
 * Status: DRAFT | SHIPPED | DELIVERED | CANCELLED
 */

interface DeliveryStatusBadgeProps {
    status?: string;
}

export function DeliveryStatusBadge({ status }: DeliveryStatusBadgeProps) {
    const s = (status || 'DRAFT').toUpperCase();

    const CONFIG: Record<string, { label: string; className: string }> = {
        DRAFT: {
            label: 'แบบร่าง',
            className: 'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-500/30',
        },
        SHIPPED: {
            label: 'จัดส่งแล้ว',
            className: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
        },
        DELIVERED: {
            label: 'ถึงปลายทาง',
            className: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
        },
        CANCELLED: {
            label: 'ยกเลิก',
            className: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300 border-red-200 dark:border-red-500/30',
        },
    };

    const config = CONFIG[s] || CONFIG['DRAFT'];

    return (
        <span
            className={`inline-flex items-center justify-center px-3 py-0.5 rounded-full text-xs font-bold border ${config.className} whitespace-nowrap min-w-[85px] shadow-sm transition-all`}
        >
            {config.label}
        </span>
    );
}
