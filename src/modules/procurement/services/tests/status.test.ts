import { describe, it, expect } from 'vitest';
import { applyClientFilters } from '@/shared/utils/clientFilterUtils';
import type { PRHeader } from '@/modules/procurement/types';

describe('PR Status and Sorting Logic', () => {
  const mockData: Partial<PRHeader>[] = [
    { pr_id: 1, pr_no: 'PR-001', status: 'DRAFT' },
    { pr_id: 2, pr_no: 'PR-002', status: 'APPROVED' },
    { pr_id: 3, pr_no: 'PR-003', status: 'PARTIAL' },
    { pr_id: 4, pr_no: 'PR-004', status: 'PENDING' },
  ];

  it('should filter by PARTIAL status', () => {
    const params = { status: 'PARTIAL' };
    const result = applyClientFilters(mockData as PRHeader[], params);
    
    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe('PARTIAL');
    expect(result.data[0].pr_no).toBe('PR-003');
  });

  it('should sort by status ascending', () => {
    const params = { sort: 'status:asc' };
    const result = applyClientFilters(mockData as PRHeader[], params);
    
    // Alphabetical: APPROVED, DRAFT, PARTIAL, PENDING
    expect(result.data[0].status).toBe('APPROVED');
    expect(result.data[1].status).toBe('DRAFT');
    expect(result.data[2].status).toBe('PARTIAL');
    expect(result.data[3].status).toBe('PENDING');
  });

  it('should sort by status descending', () => {
    const params = { sort: 'status:desc' };
    const result = applyClientFilters(mockData as PRHeader[], params);
    
    // Alphabetical Reversed: PENDING, PARTIAL, DRAFT, APPROVED
    expect(result.data[0].status).toBe('PENDING');
    expect(result.data[1].status).toBe('PARTIAL');
    expect(result.data[2].status).toBe('DRAFT');
    expect(result.data[3].status).toBe('APPROVED');
  });
});
