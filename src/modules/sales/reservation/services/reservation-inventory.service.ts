import api from '@core/api/api';
import { logger } from '@utils/logger';
import type { LotNo } from '@inventory/types/inventory-master.types';
import { USE_MOCK } from '@core/api/api';
import { MOCK_LOT_NUMBERS } from '@inventory/mocks/inventory-master.mock';

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
            // Updated endpoint to /item-lot as /lot-numbers is returning 404 on some environments
            const response = await api.get<LotNo[] | { items: LotNo[], total: number }>('/item-lot', { params });
            
            // Normalize response (handle both array and { items, total } formats)
            const rawItems = Array.isArray(response) ? response : (response.items || []);
            const total = Array.isArray(response) ? response.length : (response.total || rawItems.length);

            // Normalize items (ensure code and id exist regardless of backend field names)
            const normalizedItems = rawItems
                .filter(item => {
                    if (!params.item_id) return true;
                    const r = (item as unknown) as Record<string, unknown>;
                    const recordItemId = item.item_id || r['item_id'];
                    return String(recordItemId) === String(params.item_id);
                })
                .map(item => {
                    const r = (item as unknown) as Record<string, unknown>;
                    return {
                        ...item,
                        // Map common lot field variations
                        id: item.id || (r['lot_no_id'] as number) || (r['lot_id'] as number) || 0,
                        lot_no_id: (r['lot_no_id'] as number) || (r['lot_id'] as number) || item.id || 0,
                        code: item.code || (r['lot_no'] as string) || (r['lot_no_code'] as string) || '',
                        name_th: item.name_th || (r['lot_no'] as string) || '',
                    } as LotNo;
                });

            return { 
                items: normalizedItems, 
                total 
            };
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
