import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { sanitizePayload, cleanPayload } from '../payload.utils';

describe('payload.utils', () => {
  describe('sanitizePayload', () => {
    it('should return input as-is if not an object or null', () => {
      expect(sanitizePayload(null, [])).toBe(null);
      expect(sanitizePayload('string', [])).toBe('string');
    });

    it('should sanitize object using a list of whitelisted keys', () => {
      const data = { id: 1, name: 'Pen', ignoredField: 'hack', status: 'ACTIVE' };
      const whitelist = ['id', 'name', 'status'];
      expect(sanitizePayload(data, whitelist)).toEqual({
        id: 1,
        name: 'Pen',
        status: 'ACTIVE'
      });
    });

    it('should sanitize object using a Zod schema shape keys', () => {
      const data = { id: 1, title: 'Item', extra: 'bad-property' };
      const schema = z.object({
        id: z.number(),
        title: z.string()
      });
      expect(sanitizePayload(data, schema)).toEqual({
        id: 1,
        title: 'Item'
      });
    });
  });

  describe('cleanPayload', () => {
    it('should deeply remove null, undefined, and empty string properties', () => {
      const data = {
        name: 'Test',
        emptyStr: '',
        nullVal: null,
        undefVal: undefined,
        nested: {
          id: 10,
          empty: '',
          valid: 0 // 0 should be preserved as it is not null, undefined, or empty string
        }
      };
      expect(cleanPayload(data)).toEqual({
        name: 'Test',
        nested: {
          id: 10,
          valid: 0
        }
      });
    });

    it('should clean arrays recursively and filter out undefined results', () => {
      const data = [
        { id: 1, name: '' },
        { id: 2, name: 'Valid' }
      ];
      expect(cleanPayload(data)).toEqual([
        { id: 1 },
        { id: 2, name: 'Valid' }
      ]);
    });
  });
});
