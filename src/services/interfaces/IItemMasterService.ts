import type { ItemMaster, ItemMasterFormData } from '@/types/master-data-types';

export interface IItemMasterService {
    getAll(): Promise<ItemMaster[]>;
    getById(id: string): Promise<ItemMaster | undefined>;
    create(data: ItemMasterFormData): Promise<ItemMaster>;
    update(id: string, data: ItemMasterFormData): Promise<ItemMaster | null>;
    delete(id: string): Promise<boolean>;
}
