/**
 * @file product-types.ts
 * @description Product catalog types (Category, Item Type, Unit, Item Master, UOM Conversion, Barcode)
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

// ====================================================================================
// PRODUCT CATEGORY - กำหนดรหัสหมวดสินค้า
// ====================================================================================

export interface ProductCategoryMaster extends BaseMasterData {
    category_id: number;
    category_code: string;
    category_name: string;
    category_nameeng?: string;
}

export interface ProductCategoryFormData {
    categoryCode: string;
    categoryCodeSearch: string;
    categoryName: string;
    categoryNameEn: string;
    isActive: boolean;
}

export interface ProductCategoryListItem {
    id: number;
    category_id: number;
    category_code: string;
    category_name: string;
    category_nameeng: string;
    is_active: boolean;
    created_at: string;
    [key: string]: string | number | boolean;
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
    category_nameeng?: string;
    is_active?: boolean;
}

export interface ProductCategoryUpdateRequest extends Partial<ProductCategoryCreateRequest> {
    category_id: number;
}

// ====================================================================================
// ITEM TYPE - กำหนดรหัสประเภทสินค้า
// ====================================================================================

export interface ItemTypeMaster extends BaseMasterData {
    item_type_id: number;
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
    item_type_id: number;
    item_type_code: string;
    item_type_name: string;
    item_type_nameeng: string;
    is_active: boolean;
    created_at: string;

    [key: string]: string | number | boolean;
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
    item_type_nameeng?: string;
    is_active?: boolean;
}

export interface ItemTypeUpdateRequest extends Partial<ItemTypeCreateRequest> {
    item_type_id: number;
}

// ====================================================================================
// ITEM GROUP - กลุ่มสินค้า
// ====================================================================================

export interface ItemGroup extends BaseMasterData {
    item_group_id: number;
    item_group_code: string;
    item_group_name: string;
    item_group_nameeng?: string;
}

export interface ItemGroupFormData {
    item_group_code: string;
    item_group_name: string;
    item_group_nameeng: string;
    is_active: boolean;
}

export interface ItemGroupListItem {
    item_group_id: number;
    item_group_code: string;
    item_group_name: string;
    item_group_nameeng: string;
    item_group_is_active: boolean;

     [key: string]: string | number | boolean;
}

export const initialItemGroupFormData: ItemGroupFormData = {
    item_group_code: '',
    item_group_name: '',
    item_group_nameeng: '',
    is_active: true,
};

export interface ItemGroupCreateRequest {
    item_group_code: string;
    item_group_name: string;
    item_group_nameeng?: string;
    is_active?: boolean;
}

export interface ItemGroupUpdateRequest extends Partial<ItemGroupCreateRequest> {
    item_group_id: number;
}

// ====================================================================================
// ITEM BRAND - ยี่ห้อสินค้า
// ====================================================================================

export interface ItemBrandMaster extends BaseMasterData {
    item_brand_id: number;
    item_brand_code: string;
    item_brand_name: string;
    item_brand_nameeng?: string;
}

export interface ItemBrandOption {
    item_brand_id: number;
    item_brand_code: string;
    item_brand_name: string;
    item_brand_nameeng?: string;
}

export interface ItemBrandFormData {
    item_brand_code: string;
    item_brand_name: string;
    item_brand_nameeng: string;
    is_active: boolean;
}       

export interface ItemBrandListItem {
    item_brand_id: number;
    item_brand_code: string; 
    item_brand_name: string;
    item_brand_nameeng: string;
    is_active: boolean;

    [key: string]: string | number | boolean;
}

export const initialItemBrandFormData: ItemBrandFormData = {
    item_brand_code: '',
    item_brand_name: '',
    item_brand_nameeng: '',
    is_active: true,
};


// ====================================================================================
// ITEM PATTERN - ลายสินค้า
// ====================================================================================
export interface ItemPatternMaster extends BaseMasterData {
    item_pattern_id: number;
    item_pattern_code: string;
    item_pattern_name: string;
    item_pattern_nameeng?: string;
}

export interface ItemPatternFormData {
    item_pattern_code: string;
    item_pattern_name: string;
    item_pattern_nameeng: string;
    is_active: boolean;
}

export interface ItemPatternListItem {
    item_pattern_id: number;
    item_pattern_code: string;
    item_pattern_name: string;
    item_pattern_nameeng: string;
    is_active: boolean;

    [key: string]: string | number | boolean;
}

export const initialItemPatternFormData: ItemPatternFormData = {
    item_pattern_code: '',
    item_pattern_name: '',
    item_pattern_nameeng: '',
    is_active: true,
};

// ====================================================================================
// ITEM MASTER - กำหนดรหัสสินค้า
// ====================================================================================
export interface ItemDesignMaster extends BaseMasterData {
    item_design_id: number;
    item_design_code: string;
    item_design_name: string;
    item_design_nameeng?: string;
}

export interface ItemDesignFormData {
    item_design_code: string;
    item_design_name: string;
    item_design_nameeng: string;
    is_active: boolean;
}

export interface ItemDesignListItem {
    item_design_id: number;
    item_design_code: string;
    item_design_name: string;
    item_design_nameeng: string;
    is_active: boolean;

    [key: string]: string | number | boolean;
}

export const initialItemDesignFormData: ItemDesignFormData = {
    item_design_code: '',
    item_design_name: '',
    item_design_nameeng: '',
    is_active: true,
}


// ====================================================================================
// ITEM GRADE - เกรดสินค้า
// ====================================================================================
export interface ItemGradeMaster extends BaseMasterData {
    item_grade_id: number;
    item_grade_code: string;
    item_grade_name: string;
    item_grade_nameeng?: string;
}

export interface ItemGradeFormData {
    item_grade_code: string;
    item_grade_name: string;
    item_grade_nameeng: string;
    is_active: boolean;
}

export interface ItemGradeListItem {
    item_grade_id: number;
    item_grade_code: string;
    item_grade_name: string;
    item_grade_nameeng: string;
    is_active: boolean;

    [key: string]: string | number | boolean;
}

export const initialItemGradeFormData: ItemGradeFormData = {
    item_grade_code: '',
    item_grade_name: '',
    item_grade_nameeng: '',
    is_active: true,
};

// ====================================================================================
// ITEM CLASS - ชนิดสินค้า (รุ่นสินค้า)
// ====================================================================================
export interface ItemClassMaster extends BaseMasterData {
    item_class_id: number;
    item_class_code: string;
    item_class_name: string;
    item_class_nameeng?: string;
}

export interface ItemClassFormData {
    item_class_code: string;
    item_class_name: string;
    item_class_nameeng: string;
    is_active: boolean;
}

export interface ItemClassListItem {
    item_class_id: number;
    item_class_code: string;
    item_class_name: string;
    item_class_nameeng: string;
    is_active: boolean;

    [key: string]: string | number | boolean;
}

export const initialItemClassFormData: ItemClassFormData = {
    item_class_code: '',
    item_class_name: '',
    item_class_nameeng: '',
    is_active: true,
};

// ====================================================================================
// ITEM SIZE - ขนาดสินค้า
// ====================================================================================
export interface ItemSizeMaster extends BaseMasterData {
    item_size_id: number;
    item_size_code: string;
    item_size_name: string;
    item_size_nameeng?: string;
}

export interface ItemSizeFormData {
    item_size_code: string;
    item_size_name: string;
    item_size_nameeng: string;
    is_active: boolean;
}

export interface ItemSizeListItem {
    item_size_id: number;
    item_size_code: string;
    item_size_name: string;
    item_size_nameeng: string;
    is_active: boolean;

    [key: string]: string | number | boolean;
}

export const initialItemSizeFormData: ItemSizeFormData = {
    item_size_code: '',
    item_size_name: '',
    item_size_nameeng: '',
    is_active: true,
};

// ====================================================================================
// ITEM COLOR - สีสินค้า
// ====================================================================================
export interface ItemColorMaster extends BaseMasterData {
    item_color_id: number;
    item_color_code: string;
    item_color_name: string;
    item_color_nameeng?: string;
}

export interface ItemColorFormData {
    item_color_code: string;
    item_color_name: string;
    item_color_nameeng: string;
    is_active: boolean;
}

export interface ItemColorListItem {
    item_color_id: number;
    item_color_code: string;
    item_color_name: string;
    item_color_nameeng: string;
    is_active: boolean;

    [key: string]: string | number | boolean;
}

export const initialItemColorFormData: ItemColorFormData = {
    item_color_code: '',
    item_color_name: '',
    item_color_nameeng: '',
    is_active: true,
};


// ====================================================================================
// UOM - หน่วยนับ    
// ====================================================================================
export interface UOMMaster extends BaseMasterData {
    uom_id: number;
    uom_code: string;
    uom_name: string;
    uom_nameeng?: string;
}

export interface UOMFormData {
    uom_code: string;
    uom_name: string;
    uom_nameeng: string;
    is_active: boolean;
}   

export interface UOMListItem {
    uom_id: number;
    uom_code: string;
    uom_name: string;
    uom_nameeng: string;
    is_active: boolean;

    [key: string]: string | number | boolean;
}

export const initialUOMFormData: UOMFormData = {
    uom_code: '',
    uom_name: '',
    uom_nameeng: '',
    is_active: true,
};

// ====================================================================================
// TAX CODE - รหัสภาษี
// ====================================================================================
export interface TaxCodeMaster extends BaseMasterData {
    tax_code_id: number;
    tax_code: string;
    tax_name: string;
    tax_nameeng?: string;
}

export interface TaxCodeFormData {
    tax_code: string;
    tax_name: string;
    tax_nameeng: string;
    is_active: boolean;
}

export interface TaxCodeListItem {
    tax_code_id: number;
    tax_code: string;
    tax_name: string;
    tax_nameeng: string;
    is_active: boolean;

    [key: string]: string | number | boolean;
}

export const initialTaxCodeFormData: TaxCodeFormData = {
    tax_code: '',
    tax_name: '',
    tax_nameeng: '',
    is_active: true,
};



// ====================================================================================
// UNIT OF MEASURE - กำหนดรหัสหน่วยนับ
// ====================================================================================

export interface UnitMaster extends BaseMasterData {
    unit_id: number;
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
    id: number;
    unit_id: number;
    unit_code: string;
    unit_name: string;
    unit_name_en?: string;
    is_active: boolean;
    created_at: string;
    // Backend API mapping
    uom_id?: number;
    uom_code?: string;
    uom_name?: string;
    uom_nameeng?: string;
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
    unit_id: number;
}

// ====================================================================================
// ITEM MASTER - กำหนดรหัสสินค้า
// ====================================================================================

export interface ItemMaster extends BaseMasterData {
    item_id: number;
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
    category_id?: number;
    category_name: string;
    item_type_id?: number;
    item_type_code?: string;
    item_type_name?: string;
    unit_id?: number;
    unit_name: string;
    purchasing_unit_id?: number;
    purchasing_unit_name?: string;
    sales_unit_id?: number;
    sales_unit_name?: string;
    tax_code?: string;
    is_active: boolean;
}

export interface ItemMasterFormData {
    item_id: number;
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
    category_id?: number;
    category_name: string;
    item_type_id?: number;
    item_type_code?: string;
    item_type_name?: string;
    unit_id?: number;
    unit_name: string;
    purchasing_unit_id?: number;
    purchasing_unit_name?: string;
    sales_unit_id?: number;
    sales_unit_name?: string;
    tax_code?: string;
    is_active: boolean;
    costing_method: string;
    default_tax_code: string;
    item_group_id?: number;
    item_category_id?: number;
    base_uom_id?: number;
    purchase_uom_id?: number;
    sale_uom_id?: number;
    tax_code_id?: number;
    barcode_default?: string;
    is_batch_control?: boolean;
    is_expiry_control?: boolean;
    is_serial_control?: boolean;
    shelf_life_days?: number;
    default_issue_policy?: string;
    lot_tracking_level?: string;
    serial_tracking_level?: string;
    item_brand_id?: number;
    item_pattern_id?: number;
    item_design_id?: number;
    item_class_id?: number;
    item_size_id?: number;
    item_color_id?: number;
    item_grade_id?: number;
}

export interface ItemListItem {
    id: number;
    item_id: number;
    item_code: string;
    item_name: string;
    item_name_en?: string;
    marketing_name?: string;
    billing_name?: string;
    description?: string;
    warehouse?: string;
    location?: string;
    standard_cost?: number;
    category_id: number;
    category_name: string;
    item_type_code?: string;
    unit_name: string;
    unit_id?: number;
    preferred_vendor_id?: number;
    is_active: boolean;
    created_at: string;
    // W-01: Extended fields for proper PR mapping
    uom_id: number;
    uom_name?: string;
    warehouse_id?: number;
    warehouse_code?: string;
    purchasing_unit_id?: number;
    purchasing_unit_name?: string;
    purchasing_conversion_factor?: number;  // conversion_factor for purchasing unit
    stock_qty?: number; // Mock field for PR Product Search Modal
}

export const initialItemMasterFormData: ItemMasterFormData = {
item_id: 0,
item_code: '',
item_name: '',
item_name_en: '',
marketing_name: '',
billing_name: '',
description: '',
warehouse: '',
location: '',
standard_cost: 0,
barcode: '',
category_id: 0,
category_name: '',
item_type_id: 0,
item_type_code: '',
item_type_name: '',
unit_id: 0,
unit_name: '',
purchasing_unit_id: 0,
purchasing_unit_name: '',
sales_unit_id: 0,
sales_unit_name: '',
tax_code: '',
is_active: true,
costing_method: '',
default_tax_code: '',
};

// ====================================================================================
// ITEM UOM CONVERSION - แปลงหน่วย (หลายหน่วยนับ)
// ====================================================================================

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
    itemCode: string;
    itemName: string;
    fromUnit: string;
    toUnit: string;
    conversionFactor: number;
    isPurchaseUnit: boolean;
    isActive: boolean;
}

export interface UOMConversionListItem {
    id: number;
    conversion_id: number;
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
    barcode_id: number;
    item_id: number;
    item_code: string;
    item_name: string;
    barcode: string;
    unit_id?: number;
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
    id: number;
    barcode_id: number;
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
