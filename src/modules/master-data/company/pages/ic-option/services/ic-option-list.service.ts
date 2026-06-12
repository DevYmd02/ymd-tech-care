/**
 * @deprecated This file is kept for backward compatibility.
 * All exports now come from the global shared module: `@/shared/ic-option`
 */

export type { ICOptionListItem, ICOptionListFormData } from '@/shared/ic-option';
export {
    icOptionListSchema,
    NEGATIVE_STOCK_CHECK_OPTIONS,
    NEGATIVE_STOCK_MODE_OPTIONS,
    QUANTITY_VALIDATION_OPTIONS,
    ICOptionListService,
} from '@/shared/ic-option';

// SystemDocument is also used in this context
export type { SystemDocument } from '@/shared/ic-option';
