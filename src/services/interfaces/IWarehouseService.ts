/**
 * @file IWarehouseService.ts
 * @description Interface for Warehouse Service - defines standard methods for both Mock and Real implementations
 */

import type { WarehouseListItem } from '../../types/master-data-types';

export interface WarehouseCreateRequest {
  warehouse_code: string;
  warehouse_name: string;
  branch_id: string;
  address?: string;
  is_active?: boolean;
}

export interface WarehouseUpdateRequest extends Partial<WarehouseCreateRequest> {
  warehouse_id: string;
}

export interface IWarehouseService {
  getList(): Promise<WarehouseListItem[]>;
  getById(id: string): Promise<WarehouseListItem | null>;
  create(data: WarehouseCreateRequest): Promise<{ success: boolean; message?: string }>;
  update(data: WarehouseUpdateRequest): Promise<{ success: boolean; message?: string }>;
  delete(id: string): Promise<boolean>;
}
