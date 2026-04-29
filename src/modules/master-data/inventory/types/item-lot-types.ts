/**
 * @file item-lot-types.ts
 * @description Types for Item Lot / Batch management
 */

export type ItemLotStatus = 'ACTIVE' | 'BLOCKED' | 'QUARANTINE' | 'CLOSED';

export interface ItemLot {
    lot_id: number;
    lot_no: string;
    item_id: number;
    supplier_vendor_id?: number | null;
    supplier_name?: string; // Derived field for display
    mfg_date?: string | null;
    expiry_date?: string | null;
    status: ItemLotStatus;
    note?: string | null;
    warehouse_id?: number | null;
    warehouse_name?: string;
    location_id?: number | null;
    location_name?: string;
    qty_issued: number;
    qty_reserved: number;
    qty_stock: number; // On Hand
    qty_available: number;
    created_at: string;
    updated_at: string;
}

export interface ItemLotFormData {
    lot_id?: number;
    lot_no: string;
    item_id: number;
    supplier_vendor_id?: number | null;
    mfg_date?: string | null;
    expiry_date?: string | null;
    status: ItemLotStatus;
    note?: string | null;
    warehouse_id?: number | null;
    location_id?: number | null;
}

export const initialItemLotFormData = (itemId: number): ItemLotFormData => ({
    lot_no: '',
    item_id: itemId,
    status: 'ACTIVE',
    mfg_date: null,
    expiry_date: null,
    note: '',
});
