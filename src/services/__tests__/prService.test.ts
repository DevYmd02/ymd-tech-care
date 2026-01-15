/**
 * @file prService.test.ts
 * @description Unit tests for prService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prService } from '../prService';
import api from '../api';

// Mock the api module
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('prService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getList', () => {
    it('should return PR list on success', async () => {
      const mockResponse = {
        data: {
          data: [{ pr_id: '1', pr_no: 'PR-001' }],
          total: 1,
          page: 1,
          limit: 20,
        },
      };
      vi.mocked(api.get).mockResolvedValueOnce(mockResponse);

      const result = await prService.getList();

      expect(api.get).toHaveBeenCalledWith('/pr', { params: undefined });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].pr_no).toBe('PR-001');
    });

    it('should return empty data on error', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

      const result = await prService.getList();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('should return PR details on success', async () => {
      const mockPR = { pr_id: '1', pr_no: 'PR-001', status: 'DRAFT' };
      vi.mocked(api.get).mockResolvedValueOnce({ data: mockPR });

      const result = await prService.getById('1');

      expect(api.get).toHaveBeenCalledWith('/pr/1');
      expect(result?.pr_no).toBe('PR-001');
      expect(result?.pr_id).toBe('1');
    });

    it('should return null on error', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Not found'));

      const result = await prService.getById('invalid');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create PR and return it', async () => {
      const newPR = { pr_no: 'PR-002', requester_name: 'Test' };
      const mockCreated = { pr_id: '2', ...newPR };
      vi.mocked(api.post).mockResolvedValueOnce({ data: mockCreated });

      const result = await prService.create(newPR as Parameters<typeof prService.create>[0]);

      expect(api.post).toHaveBeenCalledWith('/pr', newPR);
      expect(result?.pr_id).toBe('2');
    });

    it('should return null on error', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Validation error'));

      const result = await prService.create({} as Parameters<typeof prService.create>[0]);

      expect(result).toBeNull();
    });
  });
});
