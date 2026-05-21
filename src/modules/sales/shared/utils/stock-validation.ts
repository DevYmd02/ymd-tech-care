export interface ICOption {
  negative_stock_check: number; // 1 = ห้าม, 2 = อนุญาต, 3 = เตือน
  quantity_validation_flag: number; // 1 = ห้าม <= 0
  negative_stock_mode: number; // 2 = ต้องมีคลัง, 3 = ต้องมีคลัง+ที่เก็บ
}

export interface StockValidationResult {
  isValid: boolean;             // false = ห้ามบันทึก, true = บันทึกได้
  type?: 'error' | 'warning';   // error (แดง) หรือ warning (เหลือง)
  message?: string;             // ข้อความสำหรับแสดงใน UI
  code?: 
    | 'INVALID_QTY' 
    | 'NEGATIVE_STOCK_NOT_ALLOWED' 
    | 'NEGATIVE_STOCK_ALLOWED'
    | 'INSUFFICIENT_STOCK_WARNING' 
    | 'WAREHOUSE_REQUIRED' 
    | 'WAREHOUSE_LOCATION_REQUIRED';
}

const NEGATIVE_STOCK = {
  BLOCK: 1,  // ห้ามติดลบ
  ALLOW: 2,  // อนุญาตติดลบ
  WARN:  3,  // เตือนก่อนใช้
} as const;

const STOCK_MODE = {
  ITEM_LEVEL:                  0,
  TOTAL:                       1,
  WAREHOUSE_REQUIRED:          2,
  WAREHOUSE_LOCATION_REQUIRED: 3,
} as const;

const QTY_FLAG = {
  MUST_BE_POSITIVE: 1,
} as const;

/**
 * Default IC Options to fallback to if not provided by backend.
 * Generally, it's safer to prevent negative stock and require a warehouse.
 */
export const DEFAULT_IC_OPTIONS: ICOption = {
    negative_stock_check: 1, 
    quantity_validation_flag: 1, 
    negative_stock_mode: 2 
};

/**
 * Validates stock quantity against Inventory Control (IC) options.
 * Used for both Form validation (blocking submission) and UI feedback (showing warnings).
 */
export const validateLineStock = (
  qty: number, 
  availableQty: number, 
  warehouseId: number | string | null | undefined, 
  locationId: number | string | null | undefined, 
  options: ICOption = DEFAULT_IC_OPTIONS
): StockValidationResult => {
  
  // 1. Negative Stock Rule
  if (qty > availableQty) {
      // check === 1: ห้ามติดลบ -> error
      if (options.negative_stock_check === NEGATIVE_STOCK.BLOCK) {
          return { 
            isValid: false, 
            type: 'error', 
            code: 'NEGATIVE_STOCK_NOT_ALLOWED', 
            message: 'สต็อกไม่เพียงพอ (ห้ามติดลบ)' 
          };
      }
      // check === 2: อนุญาตติดลบ -> warning
      if (options.negative_stock_check === NEGATIVE_STOCK.ALLOW) {
          return { 
            isValid: true, 
            type: 'warning', 
            code: 'NEGATIVE_STOCK_ALLOWED', 
            message: 'สต็อกไม่พอ (อนุญาตให้ติดลบได้)' 
          };
      }
      // check === 3: เตือนก่อนใช้ -> warning
      if (options.negative_stock_check === NEGATIVE_STOCK.WARN) {
          return { 
            isValid: true, 
            type: 'warning', 
            code: 'INSUFFICIENT_STOCK_WARNING', 
            message: 'สต็อกไม่พอ (ระบบจะตัดสต็อกติดลบ)' 
          };
      }
  }

  // 2. QTY Validation Rule
  if (options.quantity_validation_flag === QTY_FLAG.MUST_BE_POSITIVE && qty <= 0) {
     return { isValid: false, type: 'error', code: 'INVALID_QTY', message: 'จำนวนสินค้าต้องมากกว่า 0' };
  }

  // 3. Warehouse / Location Scope Rule
  if (options.negative_stock_mode === STOCK_MODE.WAREHOUSE_REQUIRED && !warehouseId) {
      return { isValid: false, type: 'error', code: 'WAREHOUSE_REQUIRED', message: 'กรุณาระบุคลังสินค้า' };
  }
  if (options.negative_stock_mode === STOCK_MODE.WAREHOUSE_LOCATION_REQUIRED && (!warehouseId || !locationId)) {
      return { isValid: false, type: 'error', code: 'WAREHOUSE_LOCATION_REQUIRED', message: 'กรุณาระบุคลังและที่เก็บ' };
  }

  // Valid
  return { isValid: true };
};
