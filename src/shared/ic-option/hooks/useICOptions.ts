/**
 * @file useICOptions.ts
 * @description Global IC Option resolver hook — shared across all modules.
 *
 * Replaces:
 *   - `sales/shared/hooks/useBranchICOptions.ts`
 *   - `Inventory/shared/hooks/useInventoryICOptions.ts`
 *
 * ## Fallback Hierarchy (Priority high → low):
 *
 * 1. **IC Option List (Document-specific)**
 *    Tab "IC Option List" → per-document overrides (e.g. RSV = "สินค้าติดลบได้")
 *    If value = 0 (Default), falls through to ↓
 *
 * 2. **Branch General Settings**
 *    Tab "ตั้งค่าทั่วไป" → branch-wide defaults
 *    Fields: check_deficit, check_deficit_option, check_qty_flag
 *    If value = 0 (Default) or missing, falls through to ↓
 *
 * 3. **Global System Default**
 *    Hardcoded safe defaults from DEFAULT_IC_OPTIONS
 *    negative_stock_check: 1 (BLOCK), negative_stock_mode: 2 (WAREHOUSE), quantity_validation_flag: 1 (POSITIVE)
 *
 * ## Usage:
 * ```ts
 * // Sales — ใบสั่งจอง
 * const { icOptions } = useICOptions(branchId, 'RSV');
 *
 * // Inventory — ใบขอเบิก
 * const { icOptions } = useICOptions(branchId, 'ISSUE_REQ');
 *
 * // Inventory — ใบเบิก
 * const { icOptions } = useICOptions(branchId, 'ISSUE');
 *
 * // Inventory — ใบขอโอน
 * const { icOptions } = useICOptions(branchId, 'TRANSFER');
 *
 * // Purchase — ใบสั่งซื้อ (อนาคต)
 * const { icOptions } = useICOptions(branchId, 'PO');
 * ```
 *
 * @param branchId     - The selected branch ID from the form
 * @param documentCode - System document code (e.g. 'RSV', 'ISSUE_REQ', 'ISSUE', 'TRANSFER', 'PO')
 */

import { useQuery } from '@tanstack/react-query';
import { logger } from '@/shared/utils';
import { ICOptionService } from '../services/ic-option.service';
import { ICOptionListService } from '../services/ic-option-list.service';
import { SystemDocumentService } from '../services/system-document.service';
import { DEFAULT_IC_OPTIONS } from '../utils/stock-validation';
import type { ICOption } from '../types/ic-option.types';

export function useICOptions(
    branchId: string | number | undefined | null,
    documentCode: string
) {
    const fetchKey = branchId ? `${branchId}-${documentCode}` : null;

    const { data: icOptions = DEFAULT_IC_OPTIONS, isLoading } = useQuery({
        queryKey: ['ic-options', fetchKey],
        queryFn: async (): Promise<ICOption> => {
            if (!branchId) return DEFAULT_IC_OPTIONS;

            try {
                // ─── Step 1: Fetch all branch IC Option configs ───
                const allOptions = await ICOptionService.getICOptions();
                const branchOption = allOptions.find(
                    (opt) => String(opt.branch_id) === String(branchId)
                );

                if (!branchOption) {
                    return DEFAULT_IC_OPTIONS;
                }

                // ─── Step 2: Fetch document-specific overrides (IC Option List) ───
                const branchOptionId = branchOption.ic_option_id || (branchOption as Record<string, unknown>).id;
                let docSpecificOption: Record<string, number> | undefined;

                if (branchOptionId) {
                    const [listItems, systemDocs] = await Promise.all([
                        ICOptionListService.getByICOptionId(branchOptionId as string),
                        SystemDocumentService.getAll(),
                    ]);

                    const matchedDoc = systemDocs.find(
                        (doc) =>
                            doc.system_document_code?.trim().toUpperCase() ===
                            documentCode.trim().toUpperCase()
                    );

                    if (matchedDoc) {
                        docSpecificOption = listItems.find(
                            (item) =>
                                Number(item.system_document_id) ===
                                Number(matchedDoc.system_document_id)
                        ) as unknown as Record<string, number> | undefined;
                    }
                }

                // ─── Step 3: Resolve with hierarchy fallback ───
                const resolved: ICOption = {
                    negative_stock_check: resolveField(
                        docSpecificOption?.negative_stock_check,
                        branchOption.check_deficit,
                        DEFAULT_IC_OPTIONS.negative_stock_check
                    ),
                    negative_stock_mode: resolveField(
                        docSpecificOption?.negative_stock_mode,
                        branchOption.check_deficit_option,
                        DEFAULT_IC_OPTIONS.negative_stock_mode
                    ),
                    quantity_validation_flag: resolveField(
                        docSpecificOption?.quantity_validation_flag,
                        branchOption.check_qty_flag,
                        DEFAULT_IC_OPTIONS.quantity_validation_flag
                    ),
                };

                logger.debug(
                    `[useICOptions] Resolved for branch=${branchId} doc=${documentCode}:`,
                    resolved,
                    {
                        docSpecific: docSpecificOption,
                        branchGeneral: {
                            check_deficit: branchOption.check_deficit,
                            check_deficit_option: branchOption.check_deficit_option,
                            check_qty_flag: branchOption.check_qty_flag,
                        },
                    }
                );

                return resolved;
            } catch (error) {
                logger.error(`[useICOptions] Failed for branch=${branchId} doc=${documentCode}:`, error);
                return DEFAULT_IC_OPTIONS;
            }
        },
        enabled: !!branchId && !!documentCode,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    return { icOptions, isLoading };
}

// ─── Legacy aliases ───────────────────────────────────────────────────────────
/** @deprecated Use `useICOptions` instead */
export const useBranchICOptions = useICOptions;
/** @deprecated Use `useICOptions` instead */
export const useInventoryICOptions = useICOptions;

// ─── Helper ───────────────────────────────────────────────────────────────────
/**
 * Resolves a single IC option field using the 3-tier hierarchy.
 * A value of `0` means "Default" (not configured), so we fall through.
 */
function resolveField(
    docSpecificValue: number | undefined | null,
    branchGeneralValue: number | undefined | null,
    globalDefault: number
): number {
    // Tier 1: Document-specific override (IC Option List tab)
    if (docSpecificValue !== undefined && docSpecificValue !== null && docSpecificValue !== 0) {
        return docSpecificValue;
    }
    // Tier 2: Branch general settings (ตั้งค่าทั่วไป tab)
    if (branchGeneralValue !== undefined && branchGeneralValue !== null && branchGeneralValue !== 0) {
        return branchGeneralValue;
    }
    // Tier 3: Global system default
    return globalDefault;
}
