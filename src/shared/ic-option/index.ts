/**
 * @file index.ts
 * @description Barrel export for the global IC Option shared module.
 *
 * Usage from any module:
 * ```ts
 * import { useICOptions, validateStock, DEFAULT_IC_OPTIONS } from '@/shared/ic-option';
 * import type { ICOption, StockValidationResult } from '@/shared/ic-option';
 * ```
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
    ICOption,
    StockValidationResult,
    ICOptionBranchConfig,
    ICOptionFormData,
    ICOptionFilters,
    ICOptionListItem,
    ICOptionListFormData,
    SystemDocument,
} from './types/ic-option.types';

export {
    icOptionSchema,
    icOptionListSchema,
    NEGATIVE_STOCK_CHECK_OPTIONS,
    NEGATIVE_STOCK_MODE_OPTIONS,
    QUANTITY_VALIDATION_OPTIONS,
} from './types/ic-option.types';

// ─── Utils ────────────────────────────────────────────────────────────────────
export {
    validateStock,
    DEFAULT_IC_OPTIONS,
    // Legacy aliases
    validateLineStock,
    validateInventoryStock,
    DEFAULT_INVENTORY_IC_OPTIONS,
} from './utils/stock-validation';

// ─── Hook ─────────────────────────────────────────────────────────────────────
export {
    useICOptions,
    // Legacy aliases
    useBranchICOptions,
    useInventoryICOptions,
} from './hooks/useICOptions';

// ─── Components ───────────────────────────────────────────────────────────────
export { StockValidationMessage } from './components/StockValidationMessage';
export { ICOptionSummaryBar } from './components/ICOptionSummaryBar';

// ─── Services ─────────────────────────────────────────────────────────────────
export { ICOptionService } from './services/ic-option.service';
export { ICOptionListService } from './services/ic-option-list.service';
export { SystemDocumentService } from './services/system-document.service';
