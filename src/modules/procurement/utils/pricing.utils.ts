/**
 * @file pricing.utils.ts
 * @description Shared business logic for calculating PR/PO totals, VAT, and Discounts.
 */

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
    return (qty * price) - discount;
};

/**
 * Calculates the full summary (Subtotal, Tax, Total) based on items and tax rules.
 */
export const calculatePricingSummary = (
    items: PricingItem[], 
    taxRate: number = 7, 
    isVatIncluded: boolean = false
): PricingSummary => {
    const subtotal = items.reduce((sum, item) => {
        return sum + calculateLineTotal(item.qty, item.unit_price, item.discount);
    }, 0);

    let taxAmount = 0;
    let totalAmount = 0;
    let beforeTax = subtotal;

    if (isVatIncluded) {
        // Formula: Total = Subtotal (inclusive)
        // Tax = Total * Rate / (100 + Rate)
        // Before Tax = Total - Tax
        totalAmount = subtotal;
        taxAmount = (totalAmount * taxRate) / (100 + taxRate);
        beforeTax = totalAmount - taxAmount;
    } else {
        // Formula: Tax = Subtotal * Rate / 100
        // Total = Subtotal + Tax
        beforeTax = subtotal;
        taxAmount = subtotal * (taxRate / 100);
        totalAmount = subtotal + taxAmount;
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
        return isNaN(percent) ? 0 : baseAmount * (percent / 100);
    }
    const val = parseFloat(str);
    return isNaN(val) ? 0 : val;
};
