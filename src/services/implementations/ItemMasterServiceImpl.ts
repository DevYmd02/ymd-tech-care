import type { ItemMasterFormData, ItemMaster } from '@/types/master-data-types';
import type { IItemMasterService } from '../interfaces/IItemMasterService';
import api from '../api';

export class ItemMasterServiceImpl implements IItemMasterService {
    async getAll(): Promise<ItemMaster[]> {
        const response = await api.get<ItemMaster[]>('/item-master');
        return response.data;
    }

    async getById(id: string): Promise<ItemMaster | undefined> {
        const response = await api.get<ItemMaster>(`/item-master/${id}`);
        return response.data;
    }

    async create(data: ItemMasterFormData): Promise<ItemMaster> {
        const response = await api.post<ItemMaster>('/item-master', data);
        return response.data;
    }

    async update(id: string, data: ItemMasterFormData): Promise<ItemMaster | null> {
        const response = await api.put<ItemMaster>(`/item-master/${id}`, data);
        return response.data;
    }

    async delete(id: string): Promise<boolean> {
        await api.delete(`/item-master/${id}`);
        return true;
    }
}
