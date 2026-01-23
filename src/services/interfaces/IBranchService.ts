/**
 * @file IBranchService.ts
 * @description Interface for Branch Service - defines standard methods for both Mock and Real implementations
 */

import type { BranchListItem, BranchDropdownItem } from '../../types/master-data-types';

export interface BranchCreateRequest {
  branch_code: string;
  branch_name: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
}

export interface BranchUpdateRequest extends Partial<BranchCreateRequest> {
  branch_id: string;
}

export interface IBranchService {
  getList(): Promise<BranchListItem[]>;
  getDropdown(): Promise<BranchDropdownItem[]>;
  getById(id: string): Promise<BranchListItem | null>;
  create(data: BranchCreateRequest): Promise<{ success: boolean; message?: string }>;
  update(data: BranchUpdateRequest): Promise<{ success: boolean; message?: string }>;
  delete(id: string): Promise<boolean>;
}
