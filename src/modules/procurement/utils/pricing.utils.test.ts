import { describe, it, expect } from 'vitest';
import { 
    calculateLineTotal, 
    calculatePricingSummary, 
    parseDiscountAmount 
} from './pricing.utils';

describe('Procurement Pricing Utils', () => {
    describe('calculateLineTotal', () => {
        it('should calculate line total correctly', () => {
            expect(calculateLineTotal(10, 100, 50)).toBe(950);
        });

        it('should never return negative values', () => {
            expect(calculateLineTotal(1, 100, 150)).toBe(0);
        });

        it('should round to 2 decimal places', () => {
            expect(calculateLineTotal(3, 33.3333, 0)).toBe(100);
        });
    });

    describe('calculatePricingSummary', () => {
        const items = [
            { qty: 2, unit_price: 100, discount: 10 }, // 190
            { qty: 1, unit_price: 50, discount: 0 }    // 50
        ];

        it('should calculate summary correctly (VAT Exclusive)', () => {
            const summary = calculatePricingSummary(items, 7, false, 0);
            expect(summary.subtotal).toBe(240);
            expect(summary.beforeTax).toBe(240);
            expect(summary.taxAmount).toBe(16.8); // 240 * 0.07
            expect(summary.totalAmount).toBe(256.8);
        });

        it('should calculate summary correctly (VAT Inclusive)', () => {
            const summary = calculatePricingSummary(items, 7, true, 0);
            expect(summary.subtotal).toBe(240);
            expect(summary.beforeTax).toBe(240);
            expect(summary.totalAmount).toBe(240);
            expect(summary.taxAmount).toBe(15.7); // 240 * 7 / 107 = 15.7009... -> 15.7
        });

        it('should handle global discount correctly', () => {
            const summary = calculatePricingSummary(items, 7, false, 40);
            expect(summary.subtotal).toBe(240);
            expect(summary.beforeTax).toBe(200); // 240 - 40
            expect(summary.taxAmount).toBe(14); // 200 * 0.07
            expect(summary.totalAmount).toBe(214);
        });

        it('should round all results to 2 decimal places', () => {
            // 4012.80 * 0.07 = 280.896 -> 280.90
            const itemsWithDecimals = [{ qty: 1, unit_price: 4012.80 }];
            const summary = calculatePricingSummary(itemsWithDecimals, 7, false, 0);
            expect(summary.taxAmount).toBe(280.90);
            expect(summary.totalAmount).toBe(4293.70);
        });
    });

    describe('parseDiscountAmount', () => {
        it('should parse percentage correctly', () => {
            expect(parseDiscountAmount('10%', 1000)).toBe(100);
        });

        it('should parse flat amount correctly', () => {
            expect(parseDiscountAmount('50', 1000)).toBe(50);
            expect(parseDiscountAmount(50, 1000)).toBe(50);
        });

        it('should handle invalid input gracefully', () => {
            expect(parseDiscountAmount('', 1000)).toBe(0);
            expect(parseDiscountAmount(undefined, 1000)).toBe(0);
            expect(parseDiscountAmount('abc', 1000)).toBe(0);
        });

        it('should round parsed percentage', () => {
            expect(parseDiscountAmount('33.333%', 100)).toBe(33.33);
        });
    });
});
