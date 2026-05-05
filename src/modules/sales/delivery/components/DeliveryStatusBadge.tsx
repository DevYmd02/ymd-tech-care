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
            className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700',
        },
        SHIPPED: {
            label: 'จัดส่งแล้ว',
            className: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        },
        DELIVERED: {
            label: 'ถึงปลายทาง',
            className: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        },
        CANCELLED: {
            label: 'ยกเลิก',
            className: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
        },
    };

    const config = CONFIG[s] || CONFIG['DRAFT'];

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${config.className} whitespace-nowrap`}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 shrink-0" />
            {config.label}
        </span>
    );
}
