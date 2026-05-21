import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/core/api/api';
import { PRService, type PRUpdatePayload } from '@/modules/procurement/services/pr.service';
import type { CreatePRPayload } from '@/modules/procurement/types';

// Mock the API Client and USE_MOCK flag
vi.mock('@/core/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  USE_MOCK: false, // Force real API logic in the service
}));

describe('PRService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default implementations for parallel calls in hydration logic
    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/vendors') {
        return Promise.resolve({ items: [], total: 0 });
      }
      if (url === '/pr-approval') {
        return Promise.resolve({ data: [], total: 0 });
      }
      return Promise.resolve(null);
    });
  });

  describe('getList', () => {
    it('should fetch PR list with correct mapping and endpoint', async () => {
      const mockResponse = {
        data: [
          { pr_id: 1, pr_no: 'PR-001', requester_name: 'Test user', status: 'DRAFT' }
        ],
        total: 1,
        page: 1,
        limit: 10
      };

      vi.mocked(api.get).mockImplementation((url) => {
        if (url === '/pr') return Promise.resolve(mockResponse);
        if (url === '/vendors') return Promise.resolve({ items: [] });
        if (url === '/pr-approval') return Promise.resolve({ data: [] });
        return Promise.resolve(null);
      });

      const params = { pr_no: 'PR-001', page: 1, limit: 10 };
      const result = await PRService.getList(params);

      // Verify endpoint and mapped parameters (expansion strips pr_no, set limit to 500)
      expect(api.get).toHaveBeenCalledWith('/pr', {
        params: expect.objectContaining({
          limit: 500,
          page: 1
        })
      });
      expect(result.data[0]).toEqual(expect.objectContaining(mockResponse.data[0]));
      expect(result.total).toEqual(1);
    });

    it('should handle getList error gracefully', async () => {
      vi.mocked(api.get).mockImplementation((url) => {
        if (url === '/pr') return Promise.reject(new Error('API Error'));
        return Promise.resolve({ items: [] });
      });

      await expect(PRService.getList()).rejects.toThrow('API Error');
    });
  });

  describe('getDetail', () => {
    it('should fetch a single PR by ID', async () => {
      const mockPR = { pr_id: 1, pr_no: 'PR-001' };
      
      vi.mocked(api.get).mockImplementation((url) => {
        if (url === '/pr/1') return Promise.resolve(mockPR);
        if (url === '/pr-approval') return Promise.resolve({ data: [] });
        return Promise.resolve(null);
      });

      const result = await PRService.getDetail(1);

      expect(api.get).toHaveBeenCalledWith('/pr/1', undefined);
      expect(result).toEqual(expect.objectContaining(mockPR));
    });

    it('should return null or throw on getDetail error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not Found'));
      await expect(PRService.getDetail(999)).rejects.toThrow('Not Found');
    });
  });

  describe('create', () => {
    it('should post new PR with correct harmonized payload', async () => {
      const payload: CreatePRPayload = {
        pr_date: '2024-02-09',
        need_by_date: '2024-02-20',
        requester_user_id: 1,
        branch_id: 1,
        pr_tax_code_id: 1,
        remark: 'Test PR',
        status: 'DRAFT',
        pr_base_currency_code: 'THB',
        pr_quote_currency_code: 'THB',
        pr_exchange_rate: 1,
        pr_exchange_rate_date: '2024-02-09',
        payment_term_days: 30,
        credit_days: 30,
        vendor_quote_no: '',
        shipping_method: '',
        pr_discount_raw: '0%',
        lines: [
          { item_id: 101, qty: 2, est_unit_price: 500, uom_id: 1 }
        ]
      };

      const mockCreatedPR = { pr_id: 1, pr_no: 'PR-001' };
      vi.mocked(api.post).mockResolvedValue(mockCreatedPR);

      const result = await PRService.create(payload);

      expect(api.post).toHaveBeenCalledWith('/pr', expect.objectContaining({
        pr_date: payload.pr_date,
        requester_user_id: 1,
        branch_id: 1,
        lines: expect.arrayContaining([
          expect.objectContaining({ item_id: 101, qty: 2 })
        ])
      }), undefined);
      expect(result).toEqual(mockCreatedPR);
    });
  });

  describe('update', () => {
    it('should patch updated PR data', async () => {
      const mockUpdatedPR = { pr_id: 1, remark: 'Modified' };
      vi.mocked(api.patch).mockResolvedValue(mockUpdatedPR);

      const payload: PRUpdatePayload = { remark: 'Modified' };
      const result = await PRService.update(1, payload);

      expect(api.patch).toHaveBeenCalledWith('/pr/1', expect.any(Object), undefined);
      expect(result).toEqual(mockUpdatedPR);
    });
  });

  describe('Workflow Actions', () => {
    it('should call cancel endpoint', async () => {
      const mockSuccess = { success: true, message: 'Cancelled' };
      vi.mocked(api.post).mockResolvedValue({ data: mockSuccess });

      const result = await PRService.cancel(123);

      expect(api.post).toHaveBeenCalledWith('/pr/123/cancel', {}, undefined);
      expect(result).toEqual(mockSuccess);
    });

    it('should call convert endpoint', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { success: true } });

      const request = { pr_id: 123, convert_to: 'PO' as const, line_ids: [1] };
      const result = await PRService.convert(123, request);

      expect(api.post).toHaveBeenCalledWith('/pr/123/convert', request, undefined);
      expect(result).toEqual(true);
    });
  });

  describe('delete', () => {
    it('should call delete endpoint and return success response', async () => {
      vi.mocked(api.delete).mockResolvedValue(true);

      const result = await PRService.delete(123);

      expect(api.delete).toHaveBeenCalledWith('/pr/123', undefined);
      expect(result).toEqual(true);
    });

    it('should throw on delete error', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Delete failed'));

      await expect(PRService.delete(123)).rejects.toThrow('Delete failed');
    });
  });
});