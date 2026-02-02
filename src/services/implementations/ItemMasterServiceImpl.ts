import type { ItemMasterFormData, ItemMaster } from '@/types/master-data-types';
import type { IItemMasterService } from '../interfaces/IItemMasterService';
import api from '../api';

export class ItemMasterServiceImpl implements IItemMasterService {
    async getAll(): Promise<ItemMaster[]> {
        const response = await api.get<ItemMaster[]>('/items');
        return response.data;
    }

    async getById(id: string): Promise<ItemMaster | undefined> {
        const response = await api.get<ItemMaster>(`/items/${id}`);
        return response.data;
    }

    async create(data: ItemMasterFormData): Promise<ItemMaster> {
        const response = await api.post<ItemMaster>('/items', data);
        return response.data;
    }

    async update(id: string, data: ItemMasterFormData): Promise<ItemMaster | null> {
        const response = await api.put<ItemMaster>(`/items/${id}`, data);
        return response.data;
    }

    async delete(id: string): Promise<boolean> {
        await api.delete(`/items/${id}`);
        return true;
    }
}
