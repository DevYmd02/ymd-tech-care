import api from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import type { LotNo } from '@/modules/master-data/inventory/types/inventory-master.types';
import { USE_MOCK } from '@/core/api/api';
import { MOCK_LOT_NUMBERS } from '@/modules/master-data/inventory/mocks/inventory-master.mock';

/**
 * Service for Inventory-related lookups specifically within the Reservation module.
 * This separates transactional stock queries from general master data lookups.
 */
export const ReservationInventoryService = {
    /**
     * ดึงรายการล็อตสินค้าที่พร้อมสำหรับการจอง (มีสต็อก)
     * รองรับการกรองแบบ Progressive (Item -> Warehouse -> Location)
     */
    getAvailableLots: async (params: { 
        q?: string, 
        item_id?: string | number, 
        warehouse_id?: string | number, 
        location_id?: string | number,
        limit?: number 
    }) => {
        if (USE_MOCK) {
            logger.info('🎭 [Mock Mode] Fetching available lots for reservation', params);
            let filtered = [...MOCK_LOT_NUMBERS];
            
            if (params.q) {
                const q = params.q.toLowerCase();
                filtered = filtered.filter(i => 
                    i.code.toLowerCase().includes(q) || 
                    (i.name_th && i.name_th.toLowerCase().includes(q))
                );
            }
            if (params.item_id) {
                filtered = filtered.filter(i => String(i.item_id) === String(params.item_id));
            }
            if (params.warehouse_id) {
                filtered = filtered.filter(i => String(i.warehouse_id) === String(params.warehouse_id));
            }
            if (params.location_id) {
                filtered = filtered.filter(i => String(i.location_id) === String(params.location_id));
            }

            return {
                items: filtered,
                total: filtered.length
            };
        }

        try {
            const response = await api.get<{ items: LotNo[], total: number }>('/lot-numbers', { params });
            return response;
        } catch (error) {
            logger.error('Failed to fetch available lots for reservation:', error);
            return { items: [], total: 0 };
        }
    },

    /**
     * ดึงยอดสต็อกคงเหลือปัจจุบัน (Real-time Balance)
     * (สำหรับขยายขีดความสามารถในอนาคต)
     */
    getStockBalance: async (itemId: string | number, locationId?: string | number) => {
        // Implementation for future use
        logger.debug('Fetching stock balance for:', itemId, locationId);
        return { balance: 0, sale_stock: 0 };
    }
};
