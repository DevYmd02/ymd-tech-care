import { mockItems } from '@/__mocks__/masterDataMocks';
import { MOCK_PRODUCTS } from '@/__mocks__/products';
import type { ItemMasterFormData, ItemMaster } from '@/types/master-data-types';
import { logger } from '@utils/logger';
import type { IItemMasterService } from '../interfaces/IItemMasterService';

// Persistent in-memory storage (Local to this service instance)
// We initialize it with mockItems but modifications happen here
const internalItems: ItemMaster[] = mockItems.map(item => ({
    ...item,
    updated_at: item.created_at || new Date().toISOString()
}));

export class MockItemMasterService implements IItemMasterService {
    async getAll(): Promise<ItemMaster[]> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return [...internalItems];
    }

    async getById(id: string): Promise<ItemMaster | undefined> {
        await new Promise(resolve => setTimeout(resolve, 300));
        return internalItems.find(i => i.item_id === id || i.item_code === id);
    }

    async create(formData: ItemMasterFormData): Promise<ItemMaster> {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const newItem: ItemMaster = {
            item_id: `IT${String(internalItems.length + 1).padStart(3, '0')}`,
            item_code: formData.item_code,
            item_name: formData.item_name,
            item_name_en: formData.item_name_en,
            description: `${formData.marketing_name} ${formData.billing_name}`,
            
            // Attributes
            category_name: 'Unknown', 
            category_id: formData.category_id,
            item_type_code: formData.item_type_code,
            
            // Units
            unit_name: 'Unknown', 
            unit_id: formData.base_uom_id,
            
            // Status
            is_active: formData.is_active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            
            // Costing
            standard_cost: formData.std_amount || 0,
            
            // Warehouse (Defaults)
            warehouse: '1001',
            location: 'A-01'
        };

        // Add to internal storage (Top of list)
        internalItems.unshift(newItem);
        logger.info('[MockItemMasterService] Created item:', newItem);

        // SYNC: Update MOCK_PRODUCTS (Global Lookup)
        const pIndex = MOCK_PRODUCTS.findIndex(p => p.item_code === formData.item_code);
        if(pIndex === -1) {
            MOCK_PRODUCTS.push({
                item_code: formData.item_code,
                item_name: formData.item_name,
                item_name_en: formData.item_name_en || '',
                category_name: newItem.category_name,
                unit_name: newItem.unit_name,
                item_type_code: formData.item_type_code,
                unit_price: formData.std_amount || 0,
                unit: newItem.unit_name
            });
        }

        return newItem;
    }

    async update(id: string, formData: ItemMasterFormData): Promise<ItemMaster | null> {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const index = internalItems.findIndex(i => i.item_id === id || i.item_code === id);
        
        if (index !== -1) {
            // Update fields
            internalItems[index] = {
                ...internalItems[index],
                
                item_code: formData.item_code,
                item_name: formData.item_name,
                item_name_en: formData.item_name_en,
                
                category_id: formData.category_id,
                item_type_code: formData.item_type_code,
                unit_id: formData.base_uom_id,
                
                standard_cost: formData.std_amount || 0,
                is_active: formData.is_active,
                updated_at: new Date().toISOString()
            };
            
            logger.info('[MockItemMasterService] Updated item:', internalItems[index]);

            // SYNC: Update MOCK_PRODUCTS
            const pIndex = MOCK_PRODUCTS.findIndex(p => p.item_code === formData.item_code || p.item_code === id);
            if (pIndex !== -1) {
                MOCK_PRODUCTS[pIndex] = {
                    ...MOCK_PRODUCTS[pIndex],
                    item_code: formData.item_code,
                    item_name: formData.item_name,
                    item_name_en: formData.item_name_en || '',
                    item_type_code: formData.item_type_code,
                    unit_price: formData.std_amount || 0
                };
            }

            return internalItems[index];
        }

        return null;
    }

    async delete(id: string): Promise<boolean> {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const index = internalItems.findIndex(i => i.item_id === id || i.item_code === id);
        if(index !== -1) {
             internalItems.splice(index, 1);
             return true;
        }
        return false;
    }
}
