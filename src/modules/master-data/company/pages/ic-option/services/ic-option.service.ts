/**
 * @deprecated This file is kept for backward compatibility.
 * All exports now come from the global shared module: `@/shared/ic-option`
 *
 * Please update imports to:
 * ```ts
 * import { ICOptionService, ICOptionListService, SystemDocumentService } from '@/shared/ic-option';
 * import type { ICOptionBranchConfig, ICOptionListItem, SystemDocument } from '@/shared/ic-option';
 * ```
 */

export type { ICOptionBranchConfig as ICOption, ICOptionFilters } from '@/shared/ic-option';
export { icOptionSchema } from '@/shared/ic-option';
export { ICOptionService } from '@/shared/ic-option';
