import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/core/api/api';
import { PRService } from '../pr.service';
import type { CreatePRPayload } from '@/modules/procurement/types/pr-types';

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

      const result = await PRService.getList();

      expect(result.items).toEqual([]);
      expect(result.total).toEqual(0);
    });
  });

  describe('getById', () => {
    it('should fetch a single PR by ID', async () => {
      const mockPR = { pr_id: '1', pr_no: 'PR-001' };
      vi.mocked(api.get).mockResolvedValue(mockPR);

      const result = await PRService.getById('1');

      expect(api.get).toHaveBeenCalledWith('/pr/1');
      expect(result).toEqual(mockPR);
    });

    it('should return null on getById error', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Not Found'));
      const result = await PRService.getById('999');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should post new PR with correct payload mapping', async () => {
      const payload = {
        pr_date: '2024-02-09',
        requester_name: 'John Doe',
        items: [
          { item_id: '101', item_code: 'ITM-01', item_name: 'Item 1', qty: 2, price: 500, uom_id: '1' }
        ]
      };

      const mockCreatedPR = { pr_id: 'PR-NEW', ...payload };
      vi.mocked(api.post).mockResolvedValue(mockCreatedPR);

      const result = await PRService.create(payload as CreatePRPayload);

      expect(api.post).toHaveBeenCalledWith('/pr', expect.objectContaining({
        pr_date: payload.pr_date,
        total_amount: 1000,
        lines: expect.arrayContaining([
          expect.objectContaining({ item_code: 'ITM-01', qty: 2 })
        ])
      }));
      expect(result).toEqual(mockCreatedPR);
    });
  });

  describe('update', () => {
    it('should put updated PR data', async () => {
      const mockUpdatedPR = { pr_id: '1', requester_name: 'Modified' };
      vi.mocked(api.put).mockResolvedValue(mockUpdatedPR);

      const result = await PRService.update('1', { requester_name: 'Modified' });

      expect(api.put).toHaveBeenCalledWith('/pr/1', { requester_name: 'Modified' });
      expect(result).toEqual(mockUpdatedPR);
    });
  });

  describe('Workflow Actions', () => {
    it('should call submit endpoint', async () => {
      const mockSuccess = { success: true, message: 'Done' };
      vi.mocked(api.post).mockResolvedValue(mockSuccess);

      const result = await PRService.submit('123');

      expect(api.post).toHaveBeenCalledWith('/pr/123/submit');
      expect(result).toEqual(mockSuccess);
    });

    it('should call approve endpoint', async () => {
      vi.mocked(api.post).mockResolvedValue({ success: true });

      const result = await PRService.approve('123');

      expect(api.post).toHaveBeenCalledWith('/pr/123/approve', { action: 'APPROVE' });
      expect(result).toBe(true);
    });

    it('should call reject endpoint', async () => {
      vi.mocked(api.post).mockResolvedValue({ success: true });

      await PRService.reject('123', 'Wrong data');

      expect(api.post).toHaveBeenCalledWith('/pr/123/reject', { action: 'REJECT', reason: 'Wrong data' });
    });

    it('should call cancel endpoint', async () => {
        const mockSuccess = { success: true, message: 'Cancelled' };
        vi.mocked(api.post).mockResolvedValue(mockSuccess);
  
        const result = await PRService.cancel('123', 'No longer needed');
  
        expect(api.post).toHaveBeenCalledWith('/pr/123/cancel', { remark: 'No longer needed' });
        expect(result).toEqual(mockSuccess);
      });
  
      it('should call convert endpoint', async () => {
        const mockResponse = { success: true, document_id: 'PO-001' };
        vi.mocked(api.post).mockResolvedValue(mockResponse);
  
        const result = await PRService.convert({ pr_id: '123', convert_to: 'PO', line_ids: ['L1'] });
  
        expect(api.post).toHaveBeenCalledWith('/pr/123/convert', { convert_to: 'PO', line_ids: ['L1'] });
        expect(result).toEqual(mockResponse);
      });
  });

  describe('generateNextDocumentNo', () => {
    it('should generate sequence 0002 when PR-202602-0001 exists', async () => {
        const fixedDate = new Date('2026-02-09T12:00:00Z');
        vi.setSystemTime(fixedDate);

        vi.mocked(api.get).mockResolvedValue({
            items: [{ pr_no: 'PR-202602-0001' }],
            total: 1
        });

        const result = await PRService.generateNextDocumentNo();
        expect(result).toBe('PR-202602-0002');
    });

    it('should generate sequence 0001 when no PR exists for current month', async () => {
        const fixedDate = new Date('2026-02-09T12:00:00Z');
        vi.setSystemTime(fixedDate);

        vi.mocked(api.get).mockResolvedValue({ items: [], total: 0 });

        const result = await PRService.generateNextDocumentNo();
        expect(result).toBe('PR-202602-0001');
    });
  });

  describe('delete', () => {
    it('should call delete endpoint and return true', async () => {
      vi.mocked(api.delete).mockResolvedValue({ success: true });

      const result = await PRService.delete('123');

      expect(api.delete).toHaveBeenCalledWith('/pr/123');
      expect(result).toBe(true);
    });

    it('should return false on delete error', async () => {
      vi.mocked(api.delete).mockRejectedValue(new Error('Delete failed'));

      const result = await PRService.delete('123');

      expect(result).toBe(false);
    });
  });
});