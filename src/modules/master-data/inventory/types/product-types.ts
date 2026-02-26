/**
 * @file product-types.ts
 * @description Product catalog types (Category, Item Type, Unit, Item Master, UOM Conversion, Barcode)
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

// ====================================================================================
// PRODUCT CATEGORY - กำหนดรหัสหมวดสินค้า
// ====================================================================================

export interface ProductCategoryMaster extends BaseMasterData {
    category_id: string;
    category_code: string;
    category_name: string;
    category_name_en?: string;
}

export interface ProductCategoryFormData {
    categoryCode: string;
    categoryCodeSearch: string;
    categoryName: string;
    categoryNameEn: string;
    isActive: boolean;
}

export interface ProductCategoryListItem {
    category_id: string;
    category_code: string;
    category_name: string;
    category_name_en?: string;
    is_active: boolean;
    created_at: string;
}

export const initialProductCategoryFormData: ProductCategoryFormData = {
    categoryCode: '',
    categoryCodeSearch: '',
    categoryName: '',
    categoryNameEn: '',
    isActive: true,
};

export interface ProductCategoryCreateRequest {
    category_code: string;
    category_name: string;
    category_name_en?: string;
    is_active?: boolean;
}

export interface ProductCategoryUpdateRequest extends Partial<ProductCategoryCreateRequest> {
    category_id: string;
}

// ====================================================================================
// ITEM TYPE - กำหนดรหัสประเภทสินค้า
// ====================================================================================

export interface ItemTypeMaster extends BaseMasterData {
    item_type_id: string;
    item_type_code: string;
    item_type_name: string;
    item_type_name_en?: string;
}

export interface ItemTypeFormData {
    itemTypeCode: string;
    itemTypeCodeSearch: string;
    itemTypeName: string;
    itemTypeNameEn: string;
    isActive: boolean;
}

export interface ItemTypeListItem {
    item_type_id: string;
    item_type_code: string;
    item_type_name: string;
    item_type_name_en?: string;
    is_active: boolean;
    created_at: string;
}

export const initialItemTypeFormData: ItemTypeFormData = {
    itemTypeCode: '',
    itemTypeCodeSearch: '',
    itemTypeName: '',
    itemTypeNameEn: '',
    isActive: true,
};

export interface ItemTypeCreateRequest {
    item_type_code: string;
    item_type_name: string;
    item_type_name_en?: string;
    is_active?: boolean;
}

export interface ItemTypeUpdateRequest extends Partial<ItemTypeCreateRequest> {
    item_type_id: string;
}

// ====================================================================================
// UNIT OF MEASURE - กำหนดรหัสหน่วยนับ
// ====================================================================================

export interface UnitMaster extends BaseMasterData {
    unit_id: string;
    unit_code: string;
    unit_name: string;
    unit_name_en?: string;
}

export interface UnitFormData {
    unitCode: string;
    unitCodeSearch: string;
    unitName: string;
    unitNameEn: string;
    isActive: boolean;
}

export interface UnitListItem {
    unit_id: string;
    unit_code: string;
    unit_name: string;
    unit_name_en?: string;
    is_active: boolean;
    created_at: string;
}

export const initialUnitFormData: UnitFormData = {
    unitCode: '',
    unitCodeSearch: '',
    unitName: '',
    unitNameEn: '',
    isActive: true,
};

export interface UnitCreateRequest {
    unit_code: string;
    unit_name: string;
    unit_name_en?: string;
    is_active?: boolean;
}

export interface UnitUpdateRequest extends Partial<UnitCreateRequest> {
    unit_id: string;
}

// ====================================================================================
// ITEM MASTER - กำหนดรหัสสินค้า
// ====================================================================================

export interface ItemMaster extends BaseMasterData {
    item_id: string;
    item_code: string;
    item_name: string;
    item_name_en?: string;
    marketing_name?: string;
    billing_name?: string;
    description?: string;
    warehouse?: string;
    location?: string;
    standard_cost?: number;
    barcode?: string;
    category_id?: string;
    category_name: string;
    item_type_id?: string;
    item_type_code?: string;
    item_type_name?: string;
    unit_id?: string;
    unit_name: string;
    purchasing_unit_id?: string;
    purchasing_unit_name?: string;
    sales_unit_id?: string;
    sales_unit_name?: string;
    tax_code?: string;
    is_active: boolean;
}

export interface ItemMasterFormData {
    item_code: string;
    item_name: string;
    item_name_en: string;
    marketing_name: string;
    billing_name: string;
    category_id: string;
    good_class_id: string;
    good_brand_id: string;
    good_pattern_id: string;
    good_design_id: string;
    good_size_id: string;
    good_model_id?: string;
    good_grade_id?: string;
    good_color_id?: string;
    base_uom_id: string;
    item_type_code: string;
    costing_method?: string;
    default_tax_code: string;
    tax_rate?: number;
    barcode?: string;
    is_active: boolean;
    is_on_hold?: boolean;
    nature_id?: string;
    product_subtype_id?: string;
    commission_type?: string;
    std_amount?: number;
    discount_amount?: string;
    is_buddy?: boolean;
}

export interface ItemListItem {
    item_id: string;
    item_code: string;
    item_name: string;
    item_name_en?: string;
    marketing_name?: string;
    billing_name?: string;
    description?: string;
    warehouse?: string;
    location?: string;
    standard_cost?: number;
    category_name: string;
    item_type_code?: string;
    unit_name: string;
    unit_id?: string;
    preferred_vendor_id?: string;
    is_active: boolean;
    created_at: string;
    // W-01: Extended fields for proper PR mapping
    warehouse_id?: string;
    warehouse_code?: string;
    purchasing_unit_id?: string;
    purchasing_unit_name?: string;
    purchasing_conversion_factor?: number;  // conversion_factor for purchasing unit
    stock_qty?: number; // Mock field for PR Product Search Modal
}

export const initialItemMasterFormData: ItemMasterFormData = {
    item_code: '',
    item_name: '',
    item_name_en: '',
    marketing_name: '',
    billing_name: '',
    category_id: '',
    good_class_id: '',
    good_brand_id: '',
    good_pattern_id: '',
    good_design_id: '',
    good_size_id: '',
    good_model_id: '',
    good_grade_id: '',
    good_color_id: '',
    base_uom_id: '',
    item_type_code: '',
    costing_method: '',
    default_tax_code: 'VAT7',
    barcode: '',
    is_active: true,
    is_on_hold: false,
    nature_id: '',
    product_subtype_id: '',
    commission_type: '',
    std_amount: 0,
    discount_amount: '',
    is_buddy: false,
};

// ====================================================================================
// ITEM UOM CONVERSION - แปลงหน่วย (หลายหน่วยนับ)
// ====================================================================================

export interface ItemUOMConversion {
    conversion_id: string;
    item_id: string;
    item_code: string;
    item_name: string;
    from_unit_id: string;
    from_unit_name: string;
    to_unit_id: string;
    to_unit_name: string;
    conversion_factor: number;
    is_purchase_unit: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface UOMConversionFormData {
    itemCode: string;
    itemName: string;
    fromUnit: string;
    toUnit: string;
    conversionFactor: number;
    isPurchaseUnit: boolean;
    isActive: boolean;
}

export interface UOMConversionListItem {
    conversion_id: string;
    item_code: string;
    item_name: string;
    from_unit_name: string;
    to_unit_name: string;
    conversion_factor: number;
    is_purchase_unit: boolean;
    is_active: boolean;
    created_at: string;
}

export const initialUOMConversionFormData: UOMConversionFormData = {
    itemCode: '',
    itemName: '',
    fromUnit: '',
    toUnit: '',
    conversionFactor: 0,
    isPurchaseUnit: false,
    isActive: true,
};

// ====================================================================================
// ITEM BARCODE - บาร์โค้ดหลายรายการ/หลายหน่วย
// ====================================================================================

export interface ItemBarcode {
    barcode_id: string;
    item_id: string;
    item_code: string;
    item_name: string;
    barcode: string;
    unit_id?: string;
    unit_name?: string;
    is_primary: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface ItemBarcodeFormData {
    itemCode: string;
    itemName: string;
    barcode: string;
    linkedUnit: string;
    isPrimary: boolean;
    isActive: boolean;
}

export interface ItemBarcodeListItem {
    barcode_id: string;
    item_code: string;
    item_name: string;
    barcode: string;
    unit_name?: string;
    is_primary: boolean;
    is_active: boolean;
    created_at: string;
}

export const initialItemBarcodeFormData: ItemBarcodeFormData = {
    itemCode: '',
    itemName: '',
    barcode: '',
    linkedUnit: '',
    isPrimary: false,
    isActive: true,
};
