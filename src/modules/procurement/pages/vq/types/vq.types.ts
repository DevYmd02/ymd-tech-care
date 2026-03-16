/**
 * @file vq.types.ts
 * @description Types for Vendor Quotation (VQ) module components
 */

import type { RFQHeader } from '@/modules/procurement/types';

export interface VQColumnsContext {
    vendorMap: Record<string, string>;
    filters: { page: number; limit: number };
    totalAmount: number;
    handleOpenView: (vqId: number) => void;
    handleOpenEdit: (vqId: number) => void;
    handleOpenTracking: (rfqId: number | null | undefined, rfqNo: string | null | undefined) => void;
    setInitialRFQForCreate?: (rfq: RFQHeader) => void;
    setIsVqModalOpen?: (open: boolean) => void;
    setSelectedVqId?: (id: number | null) => void;
    setIsViewMode?: (view: boolean) => void;
}
