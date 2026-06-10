import { useState, useEffect, useRef } from 'react';
import { logger } from '@utils';
import { ICOptionService } from '@/modules/master-data/sales/pages/ic-option/services/ic-option.service';
import { ICOptionListService } from '@/modules/master-data/sales/pages/ic-option/services/ic-option-list.service';
import { SystemDocumentService } from '@/modules/master-data/sales/pages/ic-option/services/system-document.service';
import {
    DEFAULT_INVENTORY_IC_OPTIONS,
    type InventoryICOption,
} from '../utils/stock-validation';

/**
 * ============================================================
 * useInventoryICOptions — Centralized IC Option Resolver
 * (Inventory Module Edition)
 * ============================================================
 * 
 * Resolves the effective Inventory Control (IC) stock validation
 * options for a given branch + document type combination.
 * 
 * ## Fallback Hierarchy (Priority high → low):
 * 
 * 1. **IC Option List (Document-specific)**
 *    Tab "IC Option List" → per-document overrides (e.g. ISSUE_REQ)
 *    If value = 0 (Default), falls through to ↓
 * 
 * 2. **Branch General Settings**
 *    Tab "ตั้งค่าทั่วไป" → branch-wide defaults
 *    Fields: check_deficit, check_deficit_option, check_qty_flag
 *    If value = 0 (Default) or missing, falls through to ↓
 * 
 * 3. **Global System Default**
 *    Hardcoded safe defaults from stock-validation.ts
 *    negative_stock_check: 1 (BLOCK), negative_stock_mode: 2 (WAREHOUSE), quantity_validation_flag: 1
 * 
 * ## Usage:
 * ```ts
 * // ใบขอเบิก
 * const { icOptions } = useInventoryICOptions(selectedBranchId, 'ISSUE_REQ');
 * // ใบอนุมัติเบิก
 * const { icOptions } = useInventoryICOptions(selectedBranchId, 'APPV_ISSUE');
 * // ใบเบิก
 * const { icOptions } = useInventoryICOptions(selectedBranchId, 'ISSUE');
 * // ใบโอน
 * const { icOptions } = useInventoryICOptions(selectedBranchId, 'TRANSFER');
 * ```
 * 
 * @param branchId - The selected branch ID from the form
 * @param documentCode - System document code (e.g. 'ISSUE_REQ', 'APPV_ISSUE', 'ISSUE', 'TRANSFER')
 */
export function useInventoryICOptions(
    branchId: string | number | undefined | null,
    documentCode: string
) {
    const [icOptions, setIcOptions] = useState<InventoryICOption>(DEFAULT_INVENTORY_IC_OPTIONS);
    const [isLoading, setIsLoading] = useState(false);

    // Prevent duplicate fetches for the same branchId + documentCode
    const lastFetchedRef = useRef<string | null>(null);

    useEffect(() => {
        // Reset to safe defaults when no branch is selected
        if (!branchId) {
            setIcOptions(DEFAULT_INVENTORY_IC_OPTIONS);
            lastFetchedRef.current = null;
            return;
        }

        const fetchKey = `${branchId}-${documentCode}`;
        if (lastFetchedRef.current === fetchKey) return;

        let cancelled = false;

        const resolve = async () => {
            setIsLoading(true);
            try {
                // ─── Step 1: Fetch all branch IC Option configs ───
                const allOptions = await ICOptionService.getICOptions();
                const branchOption = allOptions.find(
                    (opt) => String(opt.branch_id) === String(branchId)
                );

                if (!branchOption) {
                    // No IC Option configured for this branch → use global defaults
                    if (!cancelled) {
                        setIcOptions(DEFAULT_INVENTORY_IC_OPTIONS);
                        lastFetchedRef.current = fetchKey;
                    }
                    return;
                }

                // ─── Step 2: Fetch document-specific overrides (IC Option List) ───
                const branchOptionId = branchOption.ic_option_id || (branchOption as Record<string, unknown>).id;
                let docSpecificOption: Record<string, number> | undefined;

                if (branchOptionId) {
                    const [listItems, systemDocs] = await Promise.all([
                        ICOptionListService.getByICOptionId(branchOptionId as string),
                        SystemDocumentService.getAll(),
                    ]);

                    // Find the system_document matching the requested document code
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
                const resolved: InventoryICOption = {
                    negative_stock_check: resolveField(
                        docSpecificOption?.negative_stock_check,
                        branchOption.check_deficit,
                        DEFAULT_INVENTORY_IC_OPTIONS.negative_stock_check
                    ),
                    negative_stock_mode: resolveField(
                        docSpecificOption?.negative_stock_mode,
                        branchOption.check_deficit_option,
                        DEFAULT_INVENTORY_IC_OPTIONS.negative_stock_mode
                    ),
                    quantity_validation_flag: resolveField(
                        docSpecificOption?.quantity_validation_flag,
                        branchOption.check_qty_flag,
                        DEFAULT_INVENTORY_IC_OPTIONS.quantity_validation_flag
                    ),
                };

                if (!cancelled) {
                    setIcOptions(resolved);
                    lastFetchedRef.current = fetchKey;

                    logger.debug(
                        `[useInventoryICOptions] Resolved for branch=${branchId} doc=${documentCode}:`,
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
                }
            } catch (error) {
                logger.error(
                    `[useInventoryICOptions] Failed for branch=${branchId} doc=${documentCode}:`,
                    error
                );
                if (!cancelled) {
                    setIcOptions(DEFAULT_INVENTORY_IC_OPTIONS);
                    lastFetchedRef.current = fetchKey;
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        resolve();

        return () => {
            cancelled = true;
        };
    }, [branchId, documentCode]);

    return { icOptions, isLoading };
}

// ─── Helper ───────────────────────────────────────────────────
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
