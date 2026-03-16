/**
 * @file tax.types.ts
 * @description Type definitions for Tax Master Data entities
 */

import type { IBaseMaster, IBaseFormData } from '@/shared/types/common-master.types';

export interface TaxGroup extends IBaseMaster {
    tax_group_id: number;
    tax_type: string;
    tax_rate: string;
}

export interface TaxGroupFormData extends IBaseFormData {
    tax_type: string;
    tax_rate: string;
}
