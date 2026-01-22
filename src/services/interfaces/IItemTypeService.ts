/**
 * @file IItemTypeService.ts
 * @description Interface for Item Type Service - defines standard methods for both Mock and Real implementations
 */

import type { ItemTypeListItem } from '../../types/master-data-types';

export interface ItemTypeCreateRequest {
  item_type_code: string;
  item_type_name: string;
  item_type_name_en?: string;
  is_active?: boolean;
}

export interface ItemTypeUpdateRequest extends Partial<ItemTypeCreateRequest> {
  item_type_id: string;
}

export interface IItemTypeService {
  getList(): Promise<ItemTypeListItem[]>;
  getById(id: string): Promise<ItemTypeListItem | null>;
  create(data: ItemTypeCreateRequest): Promise<{ success: boolean; message?: string }>;
  update(data: ItemTypeUpdateRequest): Promise<{ success: boolean; message?: string }>;
  delete(id: string): Promise<boolean>;
}
