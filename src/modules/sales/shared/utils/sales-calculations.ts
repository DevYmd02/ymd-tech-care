/**
 * @file sales-calculations.ts
 * @description Centralized business logic for sales calculations (VAT, Discounts, Totals)
 */

/**
 * Helper to round to 2 decimal places to ensure financial consistency
 */
const round = (val: number): number => {
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates discount amount based on an expression (percent or flat)
 * @param baseAmount The amount to apply discount on (e.g. qty * unit_price)
 * @param expression The discount expression (e.g. '10%', '500')
 * @returns The calculated discount amount
 */
export const calculateDiscountAmount = (baseAmount: number, expression: string | number): number => {
  const expr = String(expression || '0').trim();
  if (expr === '0' || expr === '') return 0;

  if (baseAmount <= 0) return 0;

  if (expr.endsWith('%')) {
    const percent = parseFloat(expr.replace('%', '')) || 0;
    return baseAmount * (percent / 100);
  }

  return parseFloat(expr) || 0;
};

/**
 * Calculates VAT amount
 * @param taxableAmount The amount after discount
 * @param taxRate The tax rate percentage (e.g. 7)
 * @returns The calculated VAT amount
 */
export const calculateVatAmount = (taxableAmount: number, taxRate: number): number => {
  if (!taxRate || taxRate <= 0) return 0;
  return taxableAmount * (taxRate / 100);
};

/**
 * Calculates net total
 * @param subtotal Sum of lines
 * @param discount Header discount amount
 * @param vat VAT amount
 * @returns The final total amount
 */
export const calculateNetTotal = (subtotal: number, discount: number, vat: number): number => {
  return round(subtotal - discount + vat);
};

/**
 * Calculates line total
 * @param qty Quantity
 * @param unitPrice Unit Price
 * @param discountAmount Discount Amount for this line
 * @returns The line total
 */
export const calculateLineTotal = (qty: number, unitPrice: number, discountAmount: number): number => {
  return round((qty * unitPrice) - discountAmount);
};
