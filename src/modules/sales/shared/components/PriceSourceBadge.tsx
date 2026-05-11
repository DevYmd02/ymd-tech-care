import { memo } from 'react';
import { Tag } from 'lucide-react';
import type { PriceLevelName } from '@sales-master/pages/price-level-name/types/price-level-name.types';

interface PriceSourceBadgeProps {
    priceSource?: number | string | null;
    priceSourceName?: string | null;
    priceLevelPriority?: number | string | null;
    priceLevelNames?: PriceLevelName[];
    unitPrice?: number | string | null;
}

const PRICE_SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
    PRICE_LIST: { 
        label: 'Price List',  
        cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50' 
    },
    PRICE_LEVEL: { 
        label: 'Price Level', 
        cls: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/50' 
    },
    MANUAL: { 
        label: 'Manual',      
        cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50' 
    },
};

export const PriceSourceBadge = memo(({
    priceSourceName,
    priceLevelPriority,
    priceLevelNames = [],
    unitPrice = 0
}: PriceSourceBadgeProps) => {
    if (!priceSourceName || Number(unitPrice) <= 0) return null;

    const normalizedSource = String(priceSourceName).toUpperCase().replace(/\s+/g, '_');
    const sourceInfo = PRICE_SOURCE_BADGE[normalizedSource];

    if (!sourceInfo) return null;

    const getFullLabel = () => {
        if (normalizedSource === 'PRICE_LEVEL' && priceLevelPriority) {
            const priority = Number(priceLevelPriority);
            const levelName = priceLevelNames.find(n => 
                (Number(n.level_no) || Number(n.levelNo)) === priority
            )?.name;
            return `Price Level ${priority}${levelName ? ` - ${levelName}` : ''}`;
        }
        return sourceInfo.label;
    };

    const label = getFullLabel();

    return (
        <div
            className={`inline-flex items-center gap-0.5 mt-0.5 px-1.5 py-0 rounded text-[9px] font-semibold border whitespace-nowrap ${sourceInfo.cls}`}
            title={label}
        >
            <Tag size={8} />
            {label}
        </div>
    );
});

PriceSourceBadge.displayName = 'PriceSourceBadge';
