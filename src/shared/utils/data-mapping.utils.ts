/**
 * @file data-mapping.utils.ts
 * @description Utilities for normalizing inconsistent API responses into standard frontend interfaces.
 */

/**
 * Extracts a customer name from various potential nested structures
 */
export const normalizeCustomerName = (entity: unknown): string => {
  if (!entity || typeof entity !== 'object') return '';
  
  const obj = entity as Record<string, unknown>;
  
  // Direct property
  const directName = obj['customer_name'];
  if (typeof directName === 'string') return directName;
  
  // Nested structures
  const sub = (obj['customer'] || obj['customer_header'] || obj['customer_ref'] || obj) as Record<string, unknown>;
  
  const nameTh = sub['customer_name_th'] || sub['name_th'];
  const nameEn = sub['customer_name'] || sub['name'];
  
  return String(nameTh || nameEn || '').trim();
};

/**
 * Extracts an item/product name from various potential nested structures
 */
export const normalizeItemName = (entity: unknown): string => {
  if (!entity || typeof entity !== 'object') return '';
  
  const obj = entity as Record<string, unknown>;
  
  const directName = obj['item_name'];
  if (typeof directName === 'string') return directName;
  
  const sub = (obj['item'] || obj['item_master'] || obj['item_header'] || obj) as Record<string, unknown>;
  
  const nameTh = sub['item_name_th'] || sub['name_th'];
  const nameEn = sub['item_name'] || sub['name'];
  
  return String(nameTh || nameEn || '').trim();
};

/**
 * Extracts an item/product code
 */
export const normalizeItemCode = (entity: unknown): string => {
  if (!entity || typeof entity !== 'object') return '';
  
  const obj = entity as Record<string, unknown>;
  
  const directCode = obj['item_code'];
  if (typeof directCode === 'string') return directCode;
  
  const sub = (obj['item'] || obj['item_master'] || obj['item_header'] || obj) as Record<string, unknown>;
  
  const code = sub['item_code'] || sub['code'] || sub['no'];
  
  return String(code || '').trim();
};

/**
 * Standardizes ID fields to String for consistency in Forms/Zod
 */
export const normalizeId = (id: unknown): string => {
  if (id === null || id === undefined || id === 0 || id === '0') return '';
  return String(id);
};

/**
 * Standardizes Date strings to YYYY-MM-DD
 */
export const normalizeDate = (dateInput: unknown): string => {
  if (!dateInput) return '';
  try {
    return String(dateInput).split('T')[0];
  } catch {
    return '';
  }
};
