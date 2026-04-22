import { describe, it, expect } from 'vitest';
import { 
  calculateDiscountAmount, 
  calculateVatAmount, 
  calculateNetTotal, 
  calculateLineTotal 
} from './sales-calculations';

describe('Sales Calculations', () => {
  describe('calculateDiscountAmount', () => {
    it('should calculate percentage discount correctly', () => {
      expect(calculateDiscountAmount(1000, '10%')).toBe(100);
      expect(calculateDiscountAmount(4012.80, '10%')).toBe(401.28);
    });

    it('should calculate flat discount correctly', () => {
      expect(calculateDiscountAmount(1000, '50')).toBe(50);
      expect(calculateDiscountAmount(1000, 50)).toBe(50);
    });

    it('should round to 2 decimal places', () => {
      // 33.33% of 100 is 33.33333... should be 33.33
      expect(calculateDiscountAmount(100, '33.333%')).toBe(33.33);
    });
  });

  describe('calculateVatAmount', () => {
    it('should calculate 7% VAT correctly', () => {
      expect(calculateVatAmount(1000, 7)).toBe(70);
    });

    it('should round VAT to 2 decimal places (Critical Case)', () => {
      // 4012.80 * 0.07 = 280.896 -> should be 280.90
      expect(calculateVatAmount(4012.80, 7)).toBe(280.90);
    });

    it('should return 0 for zero or negative tax rate', () => {
      expect(calculateVatAmount(1000, 0)).toBe(0);
      expect(calculateVatAmount(1000, -1)).toBe(0);
    });
  });

  describe('calculateNetTotal', () => {
    it('should sum values correctly with rounding', () => {
      // 4012.80 - 0 + 280.90 = 4293.70
      expect(calculateNetTotal(4012.80, 0, 280.90)).toBe(4293.70);
    });
  });

  describe('calculateLineTotal', () => {
    it('should calculate line total correctly', () => {
      expect(calculateLineTotal(10, 100, 50)).toBe(950);
    });

    it('should round line total to 2 decimal places', () => {
      // (3 * 33.333) - 0 = 99.999 -> should be 100.00
      expect(calculateLineTotal(3, 33.333333, 0)).toBe(100);
    });
  });

  describe('Edge Cases & Robustness', () => {
    it('should handle invalid discount expressions gracefully', () => {
      expect(calculateDiscountAmount(1000, 'abc')).toBe(0);
      expect(calculateDiscountAmount(1000, '')).toBe(0);
      expect(calculateDiscountAmount(1000, null as unknown as string)).toBe(0);
    });

    it('should handle floating point precision correctly', () => {
      // 14.357 * 0.07 = 1.00499 -> should be 1.00
      expect(calculateVatAmount(14.357, 7)).toBe(1.00); 
      
      // Test the threshold: 1.005 should be 1.01
      // We use a base that results in exactly 1.005 (or slightly above due to float)
      expect(calculateVatAmount(14.35715, 7)).toBe(1.01); // 1.0050005
    });
    
    it('should handle zero base amount', () => {
      expect(calculateDiscountAmount(0, '10%')).toBe(0);
      expect(calculateVatAmount(0, 7)).toBe(0);
    });
  });
});
