import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBranchICOptions } from '../useBranchICOptions';
import { ICOptionService } from '@/modules/master-data/sales/pages/ic-option/services/ic-option.service';
import { ICOptionListService } from '@/modules/master-data/sales/pages/ic-option/services/ic-option-list.service';
import { SystemDocumentService } from '@/modules/master-data/sales/pages/ic-option/services/system-document.service';
import { DEFAULT_IC_OPTIONS } from '@sales/shared/utils/stock-validation';

// Mock the services
vi.mock('@/modules/master-data/sales/pages/ic-option/services/ic-option.service', () => ({
    ICOptionService: {
        getICOptions: vi.fn(),
    },
}));

vi.mock('@/modules/master-data/sales/pages/ic-option/services/ic-option-list.service', () => ({
    ICOptionListService: {
        getByICOptionId: vi.fn(),
    },
}));

vi.mock('@/modules/master-data/sales/pages/ic-option/services/system-document.service', () => ({
    SystemDocumentService: {
        getAll: vi.fn(),
    },
}));

describe('useBranchICOptions Hook Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return DEFAULT_IC_OPTIONS when branchId is falsy', async () => {
        const { result } = renderHook(() => useBranchICOptions(null, 'RSV'));
        expect(result.current.icOptions).toEqual(DEFAULT_IC_OPTIONS);
        expect(result.current.isLoading).toBe(false);
    });

    it('should resolve with docSpecific override when configured', async () => {
        // 1. Mock ICOptionService.getICOptions
        vi.mocked(ICOptionService.getICOptions).mockResolvedValue([
            {
                ic_option_id: 'opt-123',
                branch_id: 1,
                check_deficit: 1, // BLOCK (Tab 1 General Setting)
                check_deficit_option: 2,
                check_qty_flag: 1,
                aging_expire: '30 วัน',
                set_price1: 0,
                set_price2: 0,
                set_price3: 0,
                set_price4: 0,
                auto_perpetual_cost: 'N',
                barcode_flag: 'N',
                check_max_qty: 'N',
                check_min_qty: 'N',
                check_standcost: 'N',
                expire_alert_flag: 'N',
                order_alert_flag: 'N',
                post_cost_flag: 'N',
                reorder_flag: 'N',
                set_autopost: 'N',
                set_costcn: 'N',
                set_costcn_ap: 'N',
                set_costcn_ap_refinv: 'N',
                set_costcn_refinv: 'N',
                set_cost_return_issueref: 'N',
                set_goodqty: 'N',
                set_inve: 'N',
                set_price: 'N',
                set_price_ic: 'N',
                set_price_pack: 'N',
                set_price_po: 'N',
                trasfer_cost_flag: 'N',
            },
        ]);

        // 2. Mock SystemDocumentService.getAll
        vi.mocked(SystemDocumentService.getAll).mockResolvedValue([
            {
                system_document_id: 5,
                system_document_code: 'RSV',
                system_document_name: 'ใบสั่งจอง',
            },
        ]);

        // 3. Mock ICOptionListService.getByICOptionId
        vi.mocked(ICOptionListService.getByICOptionId).mockResolvedValue([
            {
                option_list_id: 100,
                ic_option_id: 123,
                system_document_id: 5,
                negative_stock_check: 2, // ALLOW (Tab 2 Override)
                negative_stock_mode: 0,  // Default
                quantity_validation_flag: 0, // Default
                sort_order: 1,
            },
        ]);

        const { result } = renderHook(() => useBranchICOptions(1, 'RSV'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // negative_stock_check: should be 2 (ALLOW) because of docSpecificOverride
        // negative_stock_mode: should be 2 because docSpecific is 0 (Default), branchGeneral is 2 (Tab 1), which is not 0, so we use 2
        // quantity_validation_flag: should be 1 because docSpecific is 0 (Default), branchGeneral is 1 (Tab 1), which is not 0, so we use 1
        expect(result.current.icOptions).toEqual({
            negative_stock_check: 2,
            negative_stock_mode: 2,
            quantity_validation_flag: 1,
        });
    });
});
