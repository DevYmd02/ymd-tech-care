/**
 * @file IUnitService.ts
 * @description Interface for Unit Service - defines standard methods for both Mock and Real implementations
 */

import type { UnitListItem } from '../../types/master-data-types';

export interface UnitCreateRequest {
  unit_code: string;
  unit_name: string;
  unit_name_en?: string;
  is_active?: boolean;
}

export interface UnitUpdateRequest extends Partial<UnitCreateRequest> {
  unit_id: string;
}

export interface IUnitService {
  getList(): Promise<UnitListItem[]>;
  getById(id: string): Promise<UnitListItem | null>;
  create(data: UnitCreateRequest): Promise<{ success: boolean; message?: string }>;
  update(data: UnitUpdateRequest): Promise<{ success: boolean; message?: string }>;
  delete(id: string): Promise<boolean>;
}
