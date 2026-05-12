/**
 * @file pricing.utils.ts
 * @description Shared business logic for calculating PR/PO totals, VAT, and Discounts.
 */

/**
 * Helper to round to 2 decimal places to ensure financial consistency
 */
const round = (val: number): number => {
    return Math.round((val + Number.EPSILON) * 100) / 100;
};

export interface PricingItem {
    qty: number;
    unit_price: number;
    discount?: number;
}

export interface PricingSummary {
    subtotal: number;     // Sum of (qty * price) - discount
    beforeTax: number;    // Amount basis for tax calculation
    taxAmount: number;    // Calculated VAT
    totalAmount: number;  // Grand Total (Net Impl)
}

/**
 * Calculates the line total for a single item.
 */
export const calculateLineTotal = (qty: number, price: number, discount: number = 0): number => {
    return round(Math.max(0, (qty * price) - discount));
};

/**
 * Calculates the full summary (Subtotal, Tax, Total) based on items and tax rules.
 */
export const calculatePricingSummary = (
    items: PricingItem[], 
    taxRate: number = 7, 
    isVatIncluded: boolean = false,
    globalDiscountAmount: number = 0
): PricingSummary => {
    const subtotal = round(items.reduce((sum, item) => {
        return sum + calculateLineTotal(item.qty, item.unit_price, item.discount || 0);
    }, 0));

    let taxAmount = 0;
    let totalAmount = 0;
    const beforeTax = round(Math.max(0, subtotal - globalDiscountAmount));

    if (isVatIncluded) {
        // Formula: Total = Subtotal (inclusive)
        // Tax = Total * Rate / (100 + Rate)
        // Before Tax = Total - Tax
        totalAmount = beforeTax; // discount reduces the beforeTax base
        taxAmount = round((totalAmount * taxRate) / (100 + taxRate));
    } else {
        // Formula: Tax = Subtotal * Rate / 100
        // Total = Subtotal + Tax
        taxAmount = round(beforeTax * (taxRate / 100));
        totalAmount = round(beforeTax + taxAmount);
    }

    return {
        subtotal,
        beforeTax,
        taxAmount,
        totalAmount
    };
};


/**
 * Parses a discount string (e.g., "10%", "500") and returns the discount amount.
 * Supports percentage-based (e.g., "10%" → baseAmount * 0.10) and fixed values.
 */
export const parseDiscountAmount = (raw: string | number | undefined, baseAmount: number): number => {
    if (!raw) return 0;
    const str = String(raw).trim();
    if (str.endsWith('%')) {
        const percent = parseFloat(str.replace('%', ''));
        return isNaN(percent) ? 0 : round(baseAmount * (percent / 100));
    }
    const val = parseFloat(str);
    return isNaN(val) ? 0 : round(val);
};

