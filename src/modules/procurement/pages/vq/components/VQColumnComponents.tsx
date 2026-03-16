/**
 * @file VQColumnComponents.tsx
 * @description Micro-components for VQ columns data hydration
 */

import { useQuery } from '@tanstack/react-query';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import { PRService } from '@/modules/procurement/services/pr.service';

/** Display RFQ Number with React Query hydration */
export const RFQNoDisplay = ({ rfqId }: { rfqId: number }) => {
    const { data: rfq, isLoading } = useQuery({
        queryKey: ['rfq', rfqId],
        queryFn: () => RFQService.getById(rfqId),
        enabled: !!rfqId,
        staleTime: 5 * 60 * 1000,
    });
    if (isLoading) return <span className="text-slate-400 font-normal italic text-xs">กำลังโหลด...</span>;
    return <span>{rfq?.rfq_no || `รออัปเดตเลข RFQ (ID: ${rfqId})`}</span>;
};

/** Display PR Number with React Query hydration */
export const PRNoDisplay = ({ prId }: { prId: number }) => {
    const { data: pr, isLoading } = useQuery({
        queryKey: ['pr', prId],
        queryFn: () => PRService.getDetail(prId),
        enabled: !!prId,
        staleTime: 5 * 60 * 1000,
    });
    if (isLoading) return <span className="text-slate-400 font-normal italic text-xs">กำลังโหลด...</span>;
    return <span>{pr?.pr_no || `PR ID: ${prId}`}</span>;
};
