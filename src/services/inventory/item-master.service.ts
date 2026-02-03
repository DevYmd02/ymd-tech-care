import api, { USE_MOCK } from '@/services/core/api';
import type { ItemMasterFormData, ItemMaster } from '@/types/master-data-types';
import { mockItems } from '@/__mocks__/masterDataMocks';

export const ItemMasterService = {
  getAll: async (): Promise<ItemMaster[]> => {
    if (USE_MOCK) {
       return mockItems as unknown as ItemMaster[];
    }
    const response = await api.get<ItemMaster[]>('/item-master');
    return response.data;
  },

  getById: async (id: string): Promise<ItemMaster | undefined> => {
    const response = await api.get<ItemMaster>(`/item-master/${id}`);
    return response.data;
  },

  create: async (data: ItemMasterFormData): Promise<ItemMaster> => {
    const response = await api.post<ItemMaster>('/item-master', data);
    return response.data;
  },

  update: async (id: string, data: ItemMasterFormData): Promise<ItemMaster | null> => {
    const response = await api.put<ItemMaster>(`/item-master/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<boolean> => {
    await api.delete(`/item-master/${id}`);
    return true;
  }
};
