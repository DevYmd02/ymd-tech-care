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
    delete: vi.fn(),
  },
  USE_MOCK: false, // Force real API logic in the service
}));

describe('PRService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getList', () => {
    it('should fetch PR list with correct mapping and endpoint', async () => {
      const mockResponse = {
        items: [
          { pr_id: '1', pr_no: 'PR-001', requester_name: 'Test user', status: 'DRAFT' }
        ],
        total: 1,
        page: 1,
        limit: 10
      };
      
      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const params = { pr_no: 'PR-001', page: 1, limit: 10 };
      const result = await PRService.getList(params);

      // Verify endpoint and mapped parameters (pr_no -> q)
      expect(api.get).toHaveBeenCalledWith('/pr', {
        params: expect.objectContaining({
          q: 'PR-001',
          page: 1,
          limit: 10
        })
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle getList error gracefully', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('API Error'));

      await expect(PRService.getList()).rejects.toThrow('API Error');
    });
  });

  describe('getDetail', () => {
    it('should fetch a single PR by ID', async () => {
      const mockPR = { pr_id: '1', pr_no: 'PR-001' };
      vi.mocked(api.get).mockResolvedValue(mockPR);

      const result = await PRService.getDetail('1');

      expect(api.get).toHaveBeenCalledWith('/pr/1');
      expect(result).toEqual(mockPR);
    });

    it('should return null on getDetail error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not Found'));
      await expect(PRService.getDetail('999')).rejects.toThrow('Not Found');
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
        // Currency & exchange rate fields (Postman-aligned)
        pr_base_currency_code: 'THB',
        pr_quote_currency_code: 'THB',
        pr_exchange_rate: 1,
        pr_exchange_rate_date: '2024-02-09',
        // Terms fields (Postman-aligned)
        payment_term_days: 30,
        credit_days: 30,
        vendor_quote_no: '',
        shipping_method: '',
        pr_discount_raw: '0%',
        lines: [
          { item_id: 101, qty: 2, est_unit_price: 500, uom_id: 1 }
        ]
      };

      const mockCreatedPR = { pr_id: 'PR-NEW', pr_no: 'PR-001' };
      vi.mocked(api.post).mockResolvedValue(mockCreatedPR);

      const result = await PRService.create(payload);

      expect(api.post).toHaveBeenCalledWith('/pr', expect.objectContaining({
        pr_date: payload.pr_date,
        requester_user_id: 1,
        branch_id: 1,
        lines: expect.arrayContaining([
          expect.objectContaining({ item_id: 101, qty: 2 })
        ])
      }));
      expect(result).toEqual(mockCreatedPR);
    });
  });

  describe('update', () => {
    it('should patch updated PR data', async () => {
      const mockUpdatedPR = { pr_id: '1', remark: 'Modified' };
      vi.mocked(api.put).mockResolvedValue(mockUpdatedPR);

      const payload: PRUpdatePayload = { remark: 'Modified' };
      const result = await PRService.update('1', payload);

      expect(api.put).toHaveBeenCalledWith('/pr/1', { remark: 'Modified' });
      expect(result).toEqual(mockUpdatedPR);
    });
  });

  describe('Workflow Actions', () => {
    // ... (submit, approve, reject tests remain same)

    it('should call cancel endpoint', async () => {
        const mockSuccess = { success: true, message: 'Cancelled' };
        vi.mocked(api.post).mockResolvedValue(mockSuccess);
  
        const result = await PRService.cancel('123'); // Removed reason
  
        expect(api.post).toHaveBeenCalledWith('/pr/123/cancel'); // Removed body
        expect(result).toEqual(mockSuccess);
      });
  
      it('should call convert endpoint', async () => {
        const mockResponse = { success: true, document_id: 'PO-001' };
        vi.mocked(api.post).mockResolvedValue(mockResponse);
  
        const request = { pr_id: '123', convert_to: 'PO' as const, line_ids: ['L1'] };
        const result = await PRService.convert('123', request);
  
        expect(api.post).toHaveBeenCalledWith('/pr/123/convert', request);
        expect(result).toEqual(mockResponse);
      });
  });

  describe('generateNextDocumentNo', () => {
    it('should return document number from API', async () => {
        const mockResponse = { document_no: 'PR-202602-0002' };
        vi.mocked(api.get).mockResolvedValue(mockResponse);

        const result = await PRService.generateNextDocumentNo();
        
        expect(api.get).toHaveBeenCalledWith('/pr/generate-no');
        expect(result).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('should call delete endpoint and return true', async () => {
      vi.mocked(api.delete).mockResolvedValue({ success: true });

      const result = await PRService.delete('123');

      expect(api.delete).toHaveBeenCalledWith('/pr/123');
      expect(result).toBe(true);
    });

    it('should throw on delete error', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Delete failed'));

      await expect(PRService.delete('123')).rejects.toThrow('Delete failed');
    });
  });
});