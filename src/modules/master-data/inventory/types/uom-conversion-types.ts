/**
 * @file uom-conversion-types.ts
 * @description Unit of Measure (UOM) Conversion types
 */

export interface ItemUOMConversion {
    conversion_id: number;
    item_id: number;
    item_code: string;
    item_name: string;
    from_unit_id: number;
    from_unit_name: string;
    to_unit_id: number;
    to_unit_name: string;
    conversion_factor: number;
    is_purchase_unit: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface UOMConversionFormData {
    item_id: number;
    itemCode: string;
    itemName: string;
    from_uom_id: number;
    fromUnit: string;
    to_uom_id: number;
    toUnit: string;
    conversionFactor: number;
    isPurchaseUnit: boolean;
    isActive: boolean;
}

export interface UOMConversionListItem {
    id: number;
    conversion_id: number;
    item_id: number;
    item_code: string;
    item_name: string;
    from_unit_id: number;
    from_unit_name: string;
    from_unit_name_en?: string;
    to_unit_id: number;
    to_unit_name: string;
    to_unit_name_en?: string;
    conversion_factor: number;
    is_purchase_unit: boolean;
    is_active: boolean;
    created_at: string;
}

export const initialUOMConversionFormData: UOMConversionFormData = {
    item_id: 0,
    itemCode: '',
    itemName: '',
    from_uom_id: 0,
    fromUnit: '',
    to_uom_id: 0,
    toUnit: '',
    conversionFactor: 0,
    isPurchaseUnit: false,
    isActive: true,
};

export interface UOMConversionCreateRequest {
    item_uom_id: number;
    item_id: number;
    from_uom_id: number;
    to_uom_id: number;
    factor: number;
    is_purchase_uom: boolean;
    is_active: boolean;
}

export interface UOMConversionUpdateRequest extends Partial<UOMConversionCreateRequest> {
    item_uom_id: number;
}
