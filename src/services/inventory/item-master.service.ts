import api, { USE_MOCK } from '@/services/core/api';
import type { ItemMasterFormData, ItemMaster } from '@/types/master-data-types';
import { mockItems } from '@/__mocks__/masterDataMocks';
import { logger } from '@/utils/logger';

// Local in-memory store for mocks (persists during session)
let localItemMasterData: ItemMaster[] = [...(mockItems as unknown as ItemMaster[])];

export const ItemMasterService = {
  getAll: async (): Promise<ItemMaster[]> => {
    if (USE_MOCK) {
       return localItemMasterData;
    }
    try {
      const response = await api.get<ItemMaster[]>('/item-master');
      return response.data;
    } catch (error: unknown) {
      logger.error('[ItemMasterService] getAll error:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<ItemMaster | undefined> => {
    if (USE_MOCK) {
      return localItemMasterData.find(item => item.item_id === id);
    }
    try {
      const response = await api.get<ItemMaster>(`/item-master/${id}`);
      return response.data;
    } catch (error: unknown) {
      logger.error('[ItemMasterService] getById error:', error);
      return undefined;
    }
  },

  create: async (data: ItemMasterFormData): Promise<ItemMaster | null> => {
    if (USE_MOCK) {
      const newId = `ITEM-${Date.now()}`;
      const newItem: ItemMaster = {
        item_id: newId,
        item_code: data.item_code,
        item_name: data.item_name,
        item_name_en: data.item_name_en,
        marketing_name: data.marketing_name,
        billing_name: data.billing_name,
        category_id: data.category_id,
        category_name: 'Mock Category', // Placeholder
        item_type_code: data.item_type_code,
        unit_id: data.base_uom_id,
        unit_name: 'Mock Unit', // Placeholder
        standard_cost: Number(data.std_amount || 0),
        barcode: data.barcode,
        tax_code: data.default_tax_code,
        is_active: data.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        description: ''
      };
      
      localItemMasterData.unshift(newItem);
      return newItem;
    }
    
    try {
      // Strict Type Casting for Backend Compatibility
      const payload = {
        ...data,
        std_amount: Number(data.std_amount || 0),
        tax_rate: Number(data.tax_rate || 7),
      };

      const response = await api.post<ItemMaster>('/item-master', payload);
      return response.data;
    } catch (error: unknown) {
      logger.error('[ItemMasterService] create error:', error);
      throw error; // Re-throw to be handled by UI
    }
  },

  update: async (id: string, data: ItemMasterFormData): Promise<ItemMaster | null> => {
    if (USE_MOCK) {
      const index = localItemMasterData.findIndex(item => item.item_id === id);
      if (index !== -1) {
        localItemMasterData[index] = {
          ...localItemMasterData[index],
          ...data,
          standard_cost: Number(data.std_amount || 0),
          updated_at: new Date().toISOString()
        } as ItemMaster;
        return localItemMasterData[index];
      }
      return null;
    }

    try {
      // Strict Type Casting
      const payload = {
        ...data,
        std_amount: Number(data.std_amount || 0),
        tax_rate: Number(data.tax_rate || 7),
      };

      const response = await api.put<ItemMaster>(`/item-master/${id}`, payload);
      return response.data;
    } catch (error: unknown) {
      logger.error('[ItemMasterService] update error:', error);
      throw error;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (USE_MOCK) {
      const initialLength = localItemMasterData.length;
      localItemMasterData = localItemMasterData.filter(item => item.item_id !== id);
      return localItemMasterData.length < initialLength;
    }

    try {
      await api.delete(`/item-master/${id}`);
      return true;
    } catch (error: unknown) {
      logger.error('[ItemMasterService] delete error:', error);
      return false;
    }
  }
};
