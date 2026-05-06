import api from '@core/api/api';
import { logger } from '@utils';
import type { LotNo } from '@inventory/types/inventory-master.types';
import { USE_MOCK } from '@core/api/api';
import { MOCK_LOT_NUMBERS } from '@inventory/mocks/inventory-master.mock';

interface ItemLotBalanceRecord {
    id?: number;
    lot_id?: number;
    item_id?: number;
    warehouse_id?: number;
    location_id?: number;
    qty_on_hand?: number | string;
    qty_reserved?: number | string;
    qty_available?: number | string;
    balance_qty?: number | string;
    sale_stock?: number | string;
    item_lot?: Record<string, unknown>;
    lot?: Record<string, unknown>;
    warehouse?: Record<string, unknown>;
    location?: Record<string, unknown>;
    [key: string]: unknown;
}

/**
 * Service for Inventory-related lookups specifically within the GRN (Procurement) module.
 * Cloned from ReservationInventoryService for use in Inbound processes.
 */
export const GrnInventoryService = {
    /**
     * ดึงรายการล็อตสินค้าที่พร้อมสำหรับการจอง (มีสต็อก)
     */
    getAvailableLots: async (params: { 
        q?: string, 
        item_id?: string | number, 
        warehouse_id?: string | number, 
        location_id?: string | number,
        limit?: number 
    }) => {
        if (USE_MOCK) {
            logger.info('🎭 [Mock Mode] Fetching available lots for GRN', params);
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
            const response = await api.get<ItemLotBalanceRecord[] | { items?: ItemLotBalanceRecord[], data?: ItemLotBalanceRecord[], total?: number }>('/item-lot-balance', { params });
            
            let rawItems: ItemLotBalanceRecord[] = [];
            let total = 0;
            
            if (Array.isArray(response)) {
                rawItems = response;
                total = response.length;
            } else if (response && typeof response === 'object') {
                rawItems = response.items || response.data || [];
                total = response.total || rawItems.length;
            }

            const normalizedItems = rawItems
                .filter((item: ItemLotBalanceRecord) => {
                    if (!params.item_id) return true;
                    return String(item.item_id) === String(params.item_id);
                })
                .map((item: ItemLotBalanceRecord) => {
                    const lotData = item.item_lot || item.lot || item;
                    const whData = item.warehouse || item;
                    const locData = item.location || item;
                    
                    return {
                        ...item,
                        id: item.id || item.lot_id || lotData.id || 0,
                        lot_no_id: item.lot_id || lotData.id || item.id || 0,
                        code: lotData.code || lotData.lot_no || lotData.lot_no_code || '',
                        name_th: lotData.name_th || '',
                        mfg_date: lotData.mfg_date,
                        expiry_date: lotData.expiry_date,
                        qty_on_hand: item.qty_on_hand ? Number(item.qty_on_hand) : 0,
                        qty_reserved: item.qty_reserved ? Number(item.qty_reserved) : 0,
                        qty_available: item.qty_available ? Number(item.qty_available) : 0,
                        balance_qty: item.qty_on_hand !== undefined ? Number(item.qty_on_hand) : Number(item.balance_qty || 0),
                        sale_stock: item.qty_available !== undefined ? Number(item.qty_available) : Number(item.sale_stock || 0),
                        warehouse_id: item.warehouse_id,
                        warehouse_name: whData.warehouse_name || whData.name_th || '',
                        location_id: item.location_id,
                        location_name: locData.location_name || locData.name_th || locData.name || ''
                    } as LotNo;
                });

            return { 
                items: normalizedItems, 
                total 
            };
        } catch (error: unknown) {
            const err = error as { response?: { data?: unknown }; message?: string };
            logger.error('Failed to fetch available lots from item-lot-balance:', err.response?.data || err.message || err);
            return { items: [], total: 0 };
        }
    },

    /**
     * เพิ่มข้อมูลสต็อกตั้งต้น (สร้าง Balance ใหม่)
     */
    createBalance: async (data: {
        lot_id: number;
        item_id: number | string;
        warehouse_id: number;
        location_id: number;
        qty_on_hand: number;
    }) => {
        try {
            const payload = {
                ...data,
                qty_reserved: 0,
                qty_available: data.qty_on_hand
            };
            const response = await api.post<{ data?: unknown }>('/item-lot-balance', payload);
            return response?.data || response;
        } catch (error) {
            logger.error('Failed to create item-lot-balance:', error);
            throw error;
        }
    }
};
