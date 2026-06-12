import { describe, it, expect } from 'vitest';
import { validateStock, type ICOption, DEFAULT_IC_OPTIONS } from './stock-validation';

describe('validateStock', () => {

  const baseOptions: ICOption = {
    negative_stock_check: 0,
    quantity_validation_flag: 0,
    negative_stock_mode: 0,
  };

  describe('1. Negative Stock Rule', () => {
    it('returns error when check === 1 (BLOCK) and qty > available', () => {
      const options: ICOption = { ...baseOptions, negative_stock_check: 1 };
      const result = validateStock(10, 5, 'W1', 'L1', options);
      
      expect(result.isValid).toBe(false);
      expect(result.type).toBe('error');
      expect(result.code).toBe('NEGATIVE_STOCK_NOT_ALLOWED');
    });

    it('returns warning when check === 2 (ALLOW) and qty > available', () => {
      const options: ICOption = { ...baseOptions, negative_stock_check: 2 };
      const result = validateStock(10, 5, 'W1', 'L1', options);
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('warning');
      expect(result.code).toBe('NEGATIVE_STOCK_ALLOWED');
    });

    it('returns warning when check === 3 (WARN) and qty > available', () => {
      const options: ICOption = { ...baseOptions, negative_stock_check: 3 };
      const result = validateStock(10, 5, 'W1', 'L1', options);
      
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('warning');
      expect(result.code).toBe('INSUFFICIENT_STOCK_WARNING');
    });

    it('passes if qty <= available regardless of check flag', () => {
      const options: ICOption = { ...baseOptions, negative_stock_check: 1 };
      const result = validateStock(5, 10, 'W1', 'L1', options);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('2. QTY Validation Rule', () => {
    it('returns error if qty <= 0 and flag === 1', () => {
      const options: ICOption = { ...baseOptions, quantity_validation_flag: 1 };
      
      // qty = 0
      const res1 = validateStock(0, 10, 'W1', 'L1', options);
      expect(res1.isValid).toBe(false);
      expect(res1.code).toBe('INVALID_QTY');

      // qty = -5
      const res2 = validateStock(-5, 10, 'W1', 'L1', options);
      expect(res2.isValid).toBe(false);
      expect(res2.code).toBe('INVALID_QTY');
    });

    it('passes if qty > 0 and flag === 1', () => {
      const options: ICOption = { ...baseOptions, quantity_validation_flag: 1 };
      const result = validateStock(1, 10, 'W1', 'L1', options);
      
      expect(result.isValid).toBe(true);
    });

    it('passes if qty <= 0 but flag !== 1', () => {
      const options: ICOption = { ...baseOptions, quantity_validation_flag: 0 };
      const result = validateStock(0, 10, 'W1', 'L1', options);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('3. Warehouse / Location Scope Rule', () => {
    it('returns error if mode === 2 and no warehouse provided', () => {
      const options: ICOption = { ...baseOptions, negative_stock_mode: 2 };
      
      const result = validateStock(5, 10, null, 'L1', options);
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('WAREHOUSE_REQUIRED');
    });

    it('passes if mode === 2 and warehouse is provided', () => {
      const options: ICOption = { ...baseOptions, negative_stock_mode: 2 };
      
      const result = validateStock(5, 10, 'W1', null, options);
      expect(result.isValid).toBe(true);
    });

    it('returns error if mode === 3 and no warehouse provided', () => {
      const options: ICOption = { ...baseOptions, negative_stock_mode: 3 };
      
      const result = validateStock(5, 10, null, 'L1', options);
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('WAREHOUSE_LOCATION_REQUIRED');
    });

    it('returns error if mode === 3 and no location provided', () => {
      const options: ICOption = { ...baseOptions, negative_stock_mode: 3 };
      
      const result = validateStock(5, 10, 'W1', null, options);
      expect(result.isValid).toBe(false);
      expect(result.code).toBe('WAREHOUSE_LOCATION_REQUIRED');
    });

    it('passes if mode === 3 and both warehouse and location are provided', () => {
      const options: ICOption = { ...baseOptions, negative_stock_mode: 3 };
      
      const result = validateStock(5, 10, 'W1', 'L1', options);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Happy Path', () => {
    it('passes with DEFAULT_IC_OPTIONS for valid input', () => {
      const result = validateStock(5, 10, 'W1', 'L1', DEFAULT_IC_OPTIONS);
      expect(result.isValid).toBe(true);
    });
  });

});
