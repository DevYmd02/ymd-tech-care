import { describe, it, expect } from 'vitest';
import {
  unwrapResponseData,
  normalizeListResponse,
  extractLinesArray
} from '../apiUtils';

describe('apiUtils', () => {
  describe('unwrapResponseData', () => {
    it('should return input as-is if not an object or null', () => {
      expect(unwrapResponseData(null)).toBe(null);
      expect(unwrapResponseData('string')).toBe('string');
      expect(unwrapResponseData(123)).toBe(123);
    });

    it('should unwrap single-level .data envelope', () => {
      const response = { success: true, data: { id: 1, name: 'Item A' } };
      expect(unwrapResponseData(response)).toEqual({ id: 1, name: 'Item A' });
    });

    it('should recursively unwrap multi-level .data envelopes', () => {
      const response = { success: true, data: { data: { id: 99, title: 'Deep Data' } } };
      expect(unwrapResponseData(response)).toEqual({ id: 99, title: 'Deep Data' });
    });

    it('should unwrap .header property if it contains no lines/items siblings', () => {
      const response = {
        header: { id: 42, docNo: 'PR-2026-001' }
      };
      expect(unwrapResponseData(response)).toEqual({ id: 42, docNo: 'PR-2026-001' });
    });

    it('should flatten .header and preserve sibling lines/items', () => {
      const response = {
        header: { id: 42, docNo: 'PR-2026-001' },
        lines: [{ lineNo: 1, qty: 10 }]
      };
      expect(unwrapResponseData(response)).toEqual({
        id: 42,
        docNo: 'PR-2026-001',
        header: { id: 42, docNo: 'PR-2026-001' },
        lines: [{ lineNo: 1, qty: 10 }]
      });
    });
  });

  describe('normalizeListResponse', () => {
    it('should return standard structure if response is empty', () => {
      expect(normalizeListResponse(null)).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 10
      });
    });

    it('should normalize direct array response', () => {
      const response = [{ id: 1 }, { id: 2 }];
      expect(normalizeListResponse(response)).toEqual({
        items: [{ id: 1 }, { id: 2 }],
        total: 2,
        page: 1,
        limit: 2
      });
    });

    it('should normalize response having .items array', () => {
      const response = {
        items: [{ id: 10 }, { id: 20 }],
        total: 100,
        page: 2,
        limit: 2
      };
      expect(normalizeListResponse(response)).toEqual({
        items: [{ id: 10 }, { id: 20 }],
        total: 100,
        page: 2,
        limit: 2
      });
    });

    it('should normalize response having .data array (Master Data style)', () => {
      const response = {
        success: true,
        data: {
          data: [{ id: 30 }, { id: 40 }],
          total: 50
        }
      };
      expect(normalizeListResponse(response)).toEqual({
        items: [{ id: 30 }, { id: 40 }],
        total: 50,
        page: 1,
        limit: 2
      });
    });
  });

  describe('extractLinesArray', () => {
    it('should return empty array if input is not an object', () => {
      expect(extractLinesArray(null)).toEqual([]);
      expect(extractLinesArray(123)).toEqual([]);
    });

    it('should extract lines from various common property names', () => {
      expect(extractLinesArray({ lines: [1, 2] })).toEqual([1, 2]);
      expect(extractLinesArray({ pr_lines: ['a'] })).toEqual(['a']);
      expect(extractLinesArray({ vqLines: [true] })).toEqual([true]);
    });

    it('should fall back to empty array if no array properties match', () => {
      expect(extractLinesArray({ someOtherProp: [1, 2, 3] })).toEqual([]);
    });
  });
});
