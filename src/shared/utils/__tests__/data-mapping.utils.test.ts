import { describe, it, expect } from 'vitest';
import {
  normalizeCustomerName,
  normalizeItemName,
  normalizeItemCode,
  normalizeId,
  normalizeDate
} from '../data-mapping.utils';

describe('data-mapping.utils', () => {
  describe('normalizeCustomerName', () => {
    it('should return empty string if input is null or undefined or not an object', () => {
      expect(normalizeCustomerName(null)).toBe('');
      expect(normalizeCustomerName(undefined)).toBe('');
      expect(normalizeCustomerName('just-a-string')).toBe('');
    });

    it('should extract direct customer_name', () => {
      const entity = { customer_name: 'บริษัท ทดสอบ จำกัด' };
      expect(normalizeCustomerName(entity)).toBe('บริษัท ทดสอบ จำกัด');
    });

    it('should extract customer_name_th or name_th from nested customer object', () => {
      const entity1 = { customer: { customer_name_th: 'บริษัท ก' } };
      const entity2 = { customer: { name_th: 'บริษัท ข' } };
      expect(normalizeCustomerName(entity1)).toBe('บริษัท ก');
      expect(normalizeCustomerName(entity2)).toBe('บริษัท ข');
    });

    it('should extract customer_name or name from nested customer_header or customer_ref object', () => {
      const entity1 = { customer_header: { name_th: 'บริษัท ค' } };
      const entity2 = { customer_ref: { name: 'Company D' } };
      expect(normalizeCustomerName(entity1)).toBe('บริษัท ค');
      expect(normalizeCustomerName(entity2)).toBe('Company D');
    });

    it('should fallback to name_en / name if name_th is not available', () => {
      const entity = { customer: { name: 'Test Customer Ltd.' } };
      expect(normalizeCustomerName(entity)).toBe('Test Customer Ltd.');
    });
  });

  describe('normalizeItemName', () => {
    it('should return empty string if input is null/undefined/non-object', () => {
      expect(normalizeItemName(null)).toBe('');
      expect(normalizeItemName(123)).toBe('');
    });

    it('should extract direct item_name', () => {
      const entity = { item_name: 'ปากกาเคมี' };
      expect(normalizeItemName(entity)).toBe('ปากกาเคมี');
    });

    it('should extract item name from nested item_master or item_header', () => {
      const entity1 = { item_master: { name_th: 'กระดาษ A4' } };
      const entity2 = { item: { item_name: 'สมุดบันทึก' } };
      expect(normalizeItemName(entity1)).toBe('กระดาษ A4');
      expect(normalizeItemName(entity2)).toBe('สมุดบันทึก');
    });
  });

  describe('normalizeItemCode', () => {
    it('should return empty string if invalid', () => {
      expect(normalizeItemCode(null)).toBe('');
    });

    it('should extract direct item_code', () => {
      const entity = { item_code: 'ITEM-001' };
      expect(normalizeItemCode(entity)).toBe('ITEM-001');
    });

    it('should extract code from nested item or item_master using code or no', () => {
      const entity1 = { item: { code: 'ITM-XYZ' } };
      const entity2 = { item_master: { no: 'ITM-999' } };
      expect(normalizeItemCode(entity1)).toBe('ITM-XYZ');
      expect(normalizeItemCode(entity2)).toBe('ITM-999');
    });
  });

  describe('normalizeId', () => {
    it('should return empty string for null, undefined, 0, "0"', () => {
      expect(normalizeId(null)).toBe('');
      expect(normalizeId(undefined)).toBe('');
      expect(normalizeId(0)).toBe('');
      expect(normalizeId('0')).toBe('');
    });

    it('should convert number or string ID to string', () => {
      expect(normalizeId(1024)).toBe('1024');
      expect(normalizeId('555')).toBe('555');
    });
  });

  describe('normalizeDate', () => {
    it('should return empty string for empty input', () => {
      expect(normalizeDate(null)).toBe('');
      expect(normalizeDate('')).toBe('');
    });

    it('should extract only the date portion from ISO string', () => {
      expect(normalizeDate('2026-05-27T02:00:00Z')).toBe('2026-05-27');
      expect(normalizeDate('2026-12-31')).toBe('2026-12-31');
    });
  });
});
