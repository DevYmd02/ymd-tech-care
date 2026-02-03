/**
 * @file IGRNService.ts
 * @description Interface for GRN Service
 */
import type { GRNListParams, GRNListResponse, GRNListItem, GRNSummaryCounts, CreateGRNPayload } from '@/types/grn-types';

export interface IGRNService {
    getList(params?: GRNListParams): Promise<GRNListResponse>;
    getById(id: string): Promise<GRNListItem | null>; // Simplified for List View context
    getSummaryCounts(): Promise<GRNSummaryCounts>;
    create(data: CreateGRNPayload): Promise<void>;
}
