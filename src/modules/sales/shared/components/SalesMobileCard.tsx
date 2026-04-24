import React from 'react';
import { MobileListCard } from '@/shared/components/ui/data-display/MobileListCard';

interface SalesMobileCardProps {
    docNo: string;
    customerName: string;
    date: string;
    amount: number | string;
    statusBadge: React.ReactNode;
    onClick?: () => void;
    actions?: React.ReactNode;
    // Additional fields common in sales
    saleArea?: string;
    employeeName?: string;
}

/**
 * SalesMobileCard
 * A specialized version of MobileListCard tailored for the Sales module.
 */
export const SalesMobileCard: React.FC<SalesMobileCardProps> = ({
    docNo,
    customerName,
    date,
    amount,
    statusBadge,
    onClick,
    actions,
    saleArea,
    employeeName
}) => {
    const details = [
        { label: 'ลูกค้า', value: customerName },
        { label: 'เขตการขาย', value: saleArea || '-' },
        { label: 'พนักงานขาย', value: employeeName || '-' },
    ].filter(d => d.value !== undefined);

    const formattedAmount = typeof amount === 'number' 
        ? new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount)
        : amount;

    return (
        <div onClick={onClick} className="cursor-pointer active:scale-[0.98] transition-transform">
            <MobileListCard
                title={docNo}
                subtitle={date}
                statusBadge={statusBadge}
                details={details}
                amountLabel="ยอดรวมสุทธิ"
                amountValue={<span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">{formattedAmount}</span>}
                actions={actions}
            />
        </div>
    );
};
