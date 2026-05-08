import api from '@core/api/api';
import { logger } from '@utils';
import { masterDataCache } from '@/shared/utils/master-data-cache';
import { sanitizePayload } from '@/shared/utils/payload.utils';
import { 
    normalizeId, 
    normalizeDate, 
    normalizeCustomerName, 
    normalizeItemName, 
    normalizeItemCode 
} from '@/shared/utils/data-mapping.utils';
import type { DeliveryFormData } from '../types/delivery.types';
import type { SalesOrderHeader } from '@sales/sales-order/services/sales-order.service';

/** Fields allowed by the backend DTO for Delivery Header */
const KNOWN_DELIVERY_DTO_FIELDS = [
    'delivery_date', 'docu_date', 'status', 'ship_to_address', 'ship_method',
    'carrier', 'tracking_no', 'remarks', 'ship_by_emp', 'so_id', 'customer_id',
    'branch_id', 'warehouse_id', 'deliveryLines'
];

/** Fields allowed by the backend DTO for Delivery Lines */
const KNOWN_DELIVERY_LINE_FIELDS = [
    'item_id', 'qty_shipped', 'uom_id', 'remarks', 'so_line_id', 
    'warehouse_id', 'location_id', 'lot_id', 'serial_no', 'delivery_line_id'
];

// ============================================================
// List Params & Header Interface
// ============================================================
export interface DeliveryListParams {
    delivery_no?: string;
    customer_name?: string;
    so_no?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
}

/** แสดงในตาราง List Page */
export interface DeliveryHeader {
    delivery_id: string;
    delivery_no: string;
    delivery_date: string;
    so_id: string;
    so_no: string;
    customer_id: string;
    customer_name: string;
    branch_id: string;
    status: 'DRAFT' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    tracking_no?: string;
    carrier?: string;
    ship_method?: string;
    docu_date?: string;
    rawData?: Record<string, unknown>;
}

// ============================================================
// Service
// ============================================================
export const DeliveryService = {

    /** ดึงรายการใบจัดส่งสินค้า */
    getList: async (params: DeliveryListParams = {}) => {
        logger.debug('[DeliveryService] getList params:', params);
        try {
            const response = await api.get<{ data: Record<string, unknown>[]; total: number } | Record<string, unknown>[]>(
                '/delivery', { params }
            );
            const rawData = Array.isArray(response) ? response : (response as { data: Record<string, unknown>[]; total: number }).data || [];
            const total = Array.isArray(response) ? response.length : (response as { data: unknown[]; total: number }).total || 0;

            // 🚀 Optimization: Batch Enrichment (Fix N+1)
            const soIdMap: Record<string, string> = {};
            const uniqueSoIdsToFetch = new Set<string>();

            rawData.forEach(item => {
                const soObj = (item.sale_order || item.so || item.so_header || item.sale_order_header || {}) as Record<string, unknown>;
                const soNo = String(item.so_no || soObj.so_no || soObj.no || item.sale_order_no || '');
                const soId = normalizeId(item.so_id || soObj.so_id || soObj.id);
                
                if (!soNo && soId) {
                    uniqueSoIdsToFetch.add(soId);
                } else if (soNo && soId) {
                    soIdMap[soId] = soNo;
                }
            });

            if (uniqueSoIdsToFetch.size > 0) {
                await Promise.all(Array.from(uniqueSoIdsToFetch).map(async (id) => {
                    try {
                        const soRes = await api.get<Record<string, unknown>>(`/sale-order/${id}`);
                        const soDataRaw = (soRes['data'] as Record<string, unknown>) || soRes;
                        const soData = (soDataRaw['sale_order'] || soDataRaw['so_header'] || soDataRaw) as Record<string, unknown>;
                        if (soData && soData['so_no']) {
                            soIdMap[id] = String(soData['so_no']);
                        }
                    } catch { /* ignore */ }
                }));
            }

            const mappedData = rawData.map((item) => {
                const customerObj = (item.customer || item.customer_header || item.customer_ref || {}) as Record<string, unknown>;
                const soObj = (item.sale_order || item.so || item.so_header || item.sale_order_header || {}) as Record<string, unknown>;

                const soId = normalizeId(item.so_id || soObj.so_id || soObj.id);
                const soNo = soIdMap[soId] || String(item.so_no || soObj.so_no || soObj.no || item.sale_order_no || '');

                return {
                    ...item,
                    delivery_id: normalizeId(item.delivery_id || item.id),
                    delivery_no: String(item.delivery_no || ''),
                    delivery_date: normalizeDate(item.delivery_date),
                    so_id: soId,
                    so_no: soNo,
                    customer_id: normalizeId(item.customer_id || customerObj.customer_id || customerObj.id),
                    customer_name: normalizeCustomerName(item),
                    branch_id: normalizeId(item.branch_id),
                    status: item.status || 'DRAFT',
                    tracking_no: String(item.tracking_no || ''),
                    carrier: String(item.carrier || ''),
                    ship_method: String(item.ship_method || ''),
                    docu_date: normalizeDate(item.docu_date),
                    rawData: item,
                } as DeliveryHeader;
            });

            return { data: mappedData, total };
        } catch (error) {
            logger.error('[DeliveryService] getList failed:', error);
            return { data: [], total: 0 };
        }
    },

    /** ดึงข้อมูลใบจัดส่งรายตัว */
    getById: async (id: string): Promise<DeliveryFormData | null> => {
        logger.debug('[DeliveryService] getById:', id);
        try {
            const response = await api.get<Record<string, unknown>>(`/delivery/${id}`);
            if (!response) return null;

            let rRaw = response as Record<string, unknown>;
            if (rRaw['data'] && typeof rRaw['data'] === 'object' && !Array.isArray(rRaw['data'])) {
                rRaw = rRaw['data'] as Record<string, unknown>;
            }

            const r = (rRaw['delivery'] || rRaw['delivery_header'] || rRaw) as Record<string, unknown>;

            r['delivery_date'] = normalizeDate(r['delivery_date']);
            r['docu_date'] = normalizeDate(r['docu_date']);
            r['updated_at'] = normalizeDate(r['updated_at']);

            const customerObj = (r['customer'] || r['customer_header'] || {}) as Record<string, unknown>;
            const soObj = (r['sale_order'] || r['so_header'] || r['so'] || {}) as Record<string, unknown>;
            const branchObj = (r['branch'] || r['branch_header'] || {}) as Record<string, unknown>;
            const warehouseObj = (r['warehouse'] || r['warehouse_header'] || {}) as Record<string, unknown>;
            const empObj = (r['ship_by_employee'] || r['employee'] || r['emp'] || {}) as Record<string, unknown>;

            r['customer_id'] = normalizeId(r['customer_id'] || customerObj['customer_id'] || customerObj['id']);
            r['customer_name'] = normalizeCustomerName(r);
            
            const rawSoId = String(r['so_id'] || soObj['so_id'] || soObj['id'] || r['sale_order_id'] || r['so_header_id'] || '');
            let sharedSoData: Record<string, unknown> | null = null;
            
            if (rawSoId && rawSoId !== '0') {
                try {
                    const soRes = await api.get<Record<string, unknown>>(`/sale-order/${rawSoId}`);
                    const soDataRaw = (soRes['data'] as Record<string, unknown>) || soRes;
                    sharedSoData = (soDataRaw['sale_order'] || soDataRaw['so_header'] || soDataRaw) as Record<string, unknown>;
                    
                    if (sharedSoData) {
                        if (!r['so_no']) r['so_no'] = String(sharedSoData['so_no'] || '');
                        if (!r['customer_id']) r['customer_id'] = String(sharedSoData['customer_id'] || '');
                        if (!r['branch_id']) r['branch_id'] = String(sharedSoData['branch_id'] || '');
                        
                        if (!r['customer_name']) {
                            const cObj = (sharedSoData['customer'] || sharedSoData['customer_header'] || {}) as Record<string, unknown>;
                            r['customer_name'] = String(
                                sharedSoData['customer_name'] || cObj['customer_name_th'] || cObj['customer_name'] || cObj['name'] || ''
                            );
                        }
                    }
                } catch { /* ignore */ }
            }

            r['so_id'] = rawSoId;

            const rawCustId = r['customer_id'];
            if (rawCustId && !r['customer_name']) {
                try {
                    const custRes = await api.get<Record<string, unknown>>(`/customer-master/${rawCustId}`);
                    const custData = (custRes['data'] as Record<string, unknown>) || custRes;
                    if (custData) {
                        r['customer_name'] = String(custData['customer_name_th'] || custData['customer_name'] || custData['name'] || '');
                    }
                } catch { /* ignore */ }
            }

            r['branch_id'] = normalizeId(r['branch_id'] || branchObj['branch_id'] || branchObj['id']);
            r['warehouse_id'] = normalizeId(r['warehouse_id'] || warehouseObj['warehouse_id'] || warehouseObj['id']);
            r['ship_by_emp'] = normalizeId(r['ship_by_emp'] || r['ship_by_employee_id'] || r['ship_by_employee'] || empObj['id'] || empObj['employee_id']);
            r['ship_by_emp_name'] = String(
                r['ship_by_emp_name'] || empObj['employee_fullname'] ||
                `${empObj['employee_firstname_th'] || ''} ${empObj['employee_lastname_th'] || ''}`.trim() || ''
            );

            let rawLinesData = (
                r['delivery_lines'] || r['deliveryLines'] || r['lines'] || r['items'] || r['delivery_line'] || []
            ) as unknown;

            if (!Array.isArray(rawLinesData) || (rawLinesData as unknown[]).length === 0) {
                const potentialKey = Object.keys(r).find(key =>
                    Array.isArray(r[key]) &&
                    (key.toLowerCase().includes('line') || key.toLowerCase().includes('item') || key.toLowerCase().includes('detail'))
                );
                if (potentialKey) rawLinesData = r[potentialKey];
            }

            const rawLines = (Array.isArray(rawLinesData) ? rawLinesData : []) as Record<string, unknown>[];

            r['lines'] = await Promise.all(rawLines.map(async (l: Record<string, unknown>) => {
                const item = (l['item'] || l['item_master'] || l['item_header'] || {}) as Record<string, unknown>;
                const uom = (l['uom'] || l['unit'] || {}) as Record<string, unknown>;
                const warehouseLine = (l['warehouse'] || {}) as Record<string, unknown>;

                const itemId = normalizeId(l['item_id'] || item['item_id'] || item['id']);
                let itemCode = normalizeItemCode(l);
                let itemName = normalizeItemName(l);

                if ((!itemCode || !itemName) && itemId) {
                    try {
                        const masterRes = await api.get<unknown>(`/item-master/${itemId}`);
                        const master = ((masterRes as Record<string, unknown>)?.data || masterRes) as Record<string, unknown>;
                        if (master) {
                            itemCode = itemCode || normalizeItemCode(master);
                            itemName = itemName || normalizeItemName(master);
                        }
                    } catch { /* ignore */ }
                }

                const lotIdVal = l['lot_id'];
                const lotObj = (typeof lotIdVal === 'object' && lotIdVal !== null)
                    ? (lotIdVal as Record<string, unknown>)
                    : ((l['lot'] || l['lot_header'] || {}) as Record<string, unknown>);
                let lotNo = String(l['lot_no'] || l['lot_number'] || lotObj['lot_no'] || lotObj['code'] || '');

                if (!lotNo && lotIdVal && (typeof lotIdVal === 'number' || typeof lotIdVal === 'string')) {
                    try {
                        const lotRes = await api.get<unknown>(`/item-lot/${lotIdVal}`);
                        const lotData = (lotRes as Record<string, unknown>)?.data || lotRes;
                        if (lotData && typeof lotData === 'object' && !Array.isArray(lotData)) {
                            const lotItem = lotData as Record<string, unknown>;
                            lotNo = String(lotItem['lot_no'] || lotItem['code'] || '');
                        }
                    } catch { /* ignore */ }
                }

                let qtyOrdered = Number(
                    l['qty_ordered'] || l['ordered_qty'] || l['qty_order'] || 
                    l['so_qty'] || l['order_qty'] || l['qtyOrdered'] || 0
                );
                let remainingQty = Number(
                    l['remaining_qty'] || l['qty_pending'] || l['pending_qty'] || 
                    l['qtyRemaining'] || l['remainingQty'] || 0
                );
                
                const soLineId = String(
                    l['so_line_id'] || l['sale_order_line_id'] || l['so_item_id'] || 
                    l['ref_line_id'] || l['so_detail_id'] || l['detail_id'] || ''
                );

                if (qtyOrdered === 0 && sharedSoData) {
                    const soLines = (
                        sharedSoData['sale_order_lines'] || 
                        sharedSoData['saleOrderLines'] || 
                        sharedSoData['lines'] || 
                        sharedSoData['items'] || 
                        sharedSoData['details'] || []
                    ) as Record<string, unknown>[];

                    let matchedSoLine = soLineId ? soLines.find(sl => 
                        String(sl.id || sl.so_line_id || sl.sale_order_line_id || sl.uuid || sl.detail_id) === soLineId
                    ) : null;

                    if (!matchedSoLine && itemId) {
                        const sameItemLines = soLines.filter(sl => String(sl.item_id || sl.id) === itemId);
                        if (sameItemLines.length === 1) {
                            matchedSoLine = sameItemLines[0];
                        }
                    }

                    if (matchedSoLine) {
                        qtyOrdered = Number(
                            matchedSoLine.qty || 
                            matchedSoLine.quantity || 
                            matchedSoLine.qty_ordered || 
                            matchedSoLine.qty_order || 0
                        );
                        if (remainingQty === 0) {
                            remainingQty = Number(
                                matchedSoLine.remaining_qty || matchedSoLine.qty_pending || 
                                matchedSoLine.pending_qty || qtyOrdered
                            );
                        }
                    }
                }

                return {
                    ...l,
                    delivery_line_id: normalizeId(l['delivery_line_id'] || l['id']),
                    delivery_id: normalizeId(l['delivery_id']),
                    so_line_id: soLineId,
                    item_id: itemId,
                    item_code: itemCode,
                    item_name: itemName,
                    qty_ordered: qtyOrdered,
                    remaining_qty: remainingQty,
                    qty_shipped: Number(l['qty_shipped'] || l['qty'] || l['quantity'] || 0),
                    uom_id: normalizeId(l['uom_id'] || uom['uom_id'] || uom['id']),
                    uom_name: String(l['uom_name'] || uom['uom_name'] || uom['name'] || ''),
                    warehouse_id: normalizeId(l['warehouse_id'] || warehouseLine['warehouse_id'] || warehouseLine['id']),
                    location_id: l['location_id'] ? normalizeId(l['location_id']) : undefined,
                    lot_id: normalizeId(lotIdVal ? (
                        (typeof lotIdVal === 'object' && lotIdVal !== null)
                            ? ((lotIdVal as Record<string, unknown>).id || (lotIdVal as Record<string, unknown>).lot_id)
                            : lotIdVal
                    ) : undefined),
                    lot_no: lotNo,
                    serial_no: String(l['serial_no'] || ''),
                    remarks: String(l['remarks'] || ''),
                };
            }));

            // Enrich branch name if missing
            const rawBranchId = r['branch_id'];
            if (rawBranchId && !r['branch_name']) {
                const cachedName = masterDataCache.getBranchName(rawBranchId as string | number);
                if (cachedName) {
                    r['branch_name'] = cachedName;
                } else {
                    try {
                        const branchRes = await api.get<Record<string, unknown>>(`/org-branches/${rawBranchId}`);
                        const branchData = (branchRes['data'] as Record<string, unknown>) || branchRes;
                        if (branchData) {
                            r['branch_name'] = String(branchData['branch_name'] || branchData['name'] || '');
                        }
                    } catch { /* ignore */ }
                }
            }

            // Enrich ship_by_emp_name if missing
            const rawEmpId = r['ship_by_emp'];
            if (rawEmpId && !r['ship_by_emp_name']) {
                const cachedName = masterDataCache.getEmployeeName(rawEmpId as string | number);
                if (cachedName) {
                    r['ship_by_emp_name'] = cachedName;
                } else {
                    try {
                        const empRes = await api.get<Record<string, unknown>>(`/employees/${rawEmpId}`);
                        const empData = (empRes['data'] as Record<string, unknown>) || empRes;
                        if (empData) {
                            r['ship_by_emp_name'] = String(
                                empData['employee_fullname'] ||
                                `${empData['employee_firstname_th'] || ''} ${empData['employee_lastname_th'] || ''}`.trim()
                            );
                        }
                    } catch { /* ignore */ }
                }
            }

            return r as unknown as DeliveryFormData;
        } catch (error) {
            logger.error(`[DeliveryService] getById ${id} failed:`, error);
            return null;
        }
    },

    /** สร้างใบจัดส่งใหม่ */
    create: async (data: DeliveryFormData) => {
        const payload = DeliveryService.sanitizeData(data, false);
        logger.info('[DeliveryService] CREATE PAYLOAD:', payload);
        try {
            const response = await api.post('/delivery', payload);
            return { success: true, data: response };
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string | string[] } }; message: string };
            const errorData = err.response?.data;
            if (errorData && Array.isArray(errorData.message)) {
                errorData.message.forEach(m => logger.error('Validation Error:', m));
            } else {
                logger.error('[DeliveryService] create failed:', errorData || err.message);
            }
            throw error;
        }
    },

    /** อัปเดตใบจัดส่ง */
    update: async (id: string, data: Partial<DeliveryFormData>) => {
        const payload = DeliveryService.sanitizeData(data, true);
        logger.info(`[DeliveryService] UPDATE PAYLOAD for ${id}:`, payload);
        try {
            const response = await api.patch(`/delivery/${id}`, payload);
            return { success: true, data: response };
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string | string[] } }; message: string };
            const errorData = err.response?.data;
            if (errorData && Array.isArray(errorData.message)) {
                errorData.message.forEach(m => logger.error('Validation Error:', m));
            } else {
                logger.error(`[DeliveryService] update ${id} failed:`, errorData || err.message);
            }
            throw error;
        }
    },

    /** อัปเดตสถานะใบจัดส่ง */
    updateStatus: async (id: string, status: string) => {
        logger.info(`[DeliveryService] UPDATE STATUS for ${id}:`, { status });
        try {
            const response = await api.patch(`/delivery/${id}/status`, { status });
            return { success: true, data: response };
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string | string[] } }; message: string };
            logger.error(`[DeliveryService] updateStatus ${id} failed:`, err.response?.data || err.message);
            throw error;
        }
    },

    /** ลบใบจัดส่ง */
    delete: async (id: string) => {
        logger.debug('[DeliveryService] delete:', id);
        try {
            await api.delete(`/delivery/${id}`);
            return { success: true };
        } catch (error) {
            logger.error(`[DeliveryService] delete ${id} failed:`, error);
            throw error;
        }
    },

    /** ดึงรายการใบสั่งขายที่รอจัดส่ง (Pending Deliveries) */
    getPendingDeliveries: async (params: Record<string, unknown> = {}) => {
        logger.debug('[DeliveryService] getPendingDeliveries params:', params);
        try {
            const response = await api.get<Record<string, unknown>[]>('/delivery/pending-deliveries', { params });
            const rawData = Array.isArray(response) ? response : [];

            const mappedData = rawData.map((item) => {
                const customerObj = (item.customer || {}) as Record<string, unknown>;
                const reservation = (item.reservation || {}) as Record<string, unknown>;

                const customerName = String(
                    item.customer_name ||
                        customerObj.customer_name_th ||
                        customerObj.customer_name ||
                        customerObj.name ||
                        reservation.customer_name ||
                        ''
                );

                const customerCode = String(
                    item.customer_code ||
                        customerObj.customer_code ||
                        customerObj.code ||
                        reservation.customer_code ||
                        ''
                );

                const totalVal = Number(item.total_amount || item.base_total_amount || item.quote_total_amount || 0);

                return {
                    ...item,
                    so_id: String(item.so_id || ''),
                    so_no: String(item.so_no || ''),
                    so_date: item.so_date ? String(item.so_date).split('T')[0] : '',
                    customer_id: String(item.customer_id || customerObj.customer_id || ''),
                    customer_name: customerName,
                    customer_code: customerCode,
                    total_amount: totalVal,
                    currency_code: String(item.currency_code || item.base_currency_code || 'THB'),
                    onhold: item.onhold === 'Y' || item.onhold === true ? 'Y' : 'N',
                    status: (item.status as SalesOrderHeader['status']) || 'APPROVED',
                    rawData: item,
                } as SalesOrderHeader;
            });

            return { data: mappedData, total: mappedData.length };
        } catch (error) {
            logger.error('[DeliveryService] getPendingDeliveries failed:', error);
            return { data: [], total: 0 };
        }
    },

    /** ดึงรายละเอียดใบสั่งขายที่รอจัดส่งรายใบ (รวม Line Items) */
    getPendingDeliveryDetail: async (soId: string) => {
        logger.debug('[DeliveryService] getPendingDeliveryDetail soId:', soId);
        try {
            const response = await api.get<Record<string, unknown> | Record<string, unknown>[]>(`/delivery/${soId}/pending-deliveries`);
            const r = Array.isArray(response) ? (response.length > 0 ? response[0] : null) : response;
            if (!r) return null;

            const rawLines = (r['saleOrderLines'] || r['lines'] || []) as Record<string, unknown>[];
            
            const lines = await Promise.all(rawLines.map(async (l) => {
                const item = (l['item'] || l['item_master'] || {}) as Record<string, unknown>;
                const uom = (l['uom'] || l['unit'] || {}) as Record<string, unknown>;
                const wh = (l['warehouse'] || {}) as Record<string, unknown>;
                const loc = (l['location'] || {}) as Record<string, unknown>;

                const itemId = String(l['item_id'] || item['item_id'] || item['id'] || '');
                let itemCode = String(l['item_code'] || item['item_code'] || item['code'] || '');
                let itemName = String(l['item_name'] || item['item_name'] || item['item_name_th'] || item['name'] || '');

                let uomId = String(l['uom_id'] || uom['uom_id'] || uom['id'] || '');
                let uomName = String(l['uom_name'] || uom['uom_name'] || uom['name'] || uom['unit_name'] || '');

                if (itemId && (!itemCode || !itemName)) {
                    try {
                        const { ItemMasterService } = await import('@master-data/inventory/services/item-master.service');
                        const masterItem = await ItemMasterService.getById(Number(itemId));
                        if (masterItem) {
                            itemCode = masterItem.item_code || itemCode;
                            itemName = masterItem.item_name || itemName;
                            if (!uomId) {
                                uomId = String(masterItem.unit_id || masterItem.base_uom_id || '');
                                uomName = masterItem.unit_name || '';
                            }
                        }
                    } catch (err) {
                        logger.error('[DeliveryService] Failed to enrich item info:', err);
                    }
                }

                const warehouseId = String(l['warehouse_id'] || wh['warehouse_id'] || wh['id'] || '');
                const warehouseName = String(l['warehouse_name'] || wh['warehouse_name'] || wh['name'] || wh['name_th'] || '');

                const locationId = String(l['location_id'] || loc['location_id'] || loc['id'] || '');
                const locationName = String(l['location_name'] || loc['location_name'] || loc['name'] || loc['name_th'] || '');

                const lotId = l['lot_id'] ? String(l['lot_id']) : '';
                let lotNo = String(l['lot_no'] || '');

                if (lotId && !lotNo) {
                    try {
                        const { LotNoService } = await import('@master-data/inventory/services/inventory-master.service');
                        const masterLot = await LotNoService.getById(Number(lotId));
                        if (masterLot) {
                            lotNo = masterLot.name_th || masterLot.code || '';
                        }
                    } catch (err) {
                        logger.error('[DeliveryService] Failed to enrich lot info:', err);
                    }
                }

                const qtyOrdered = Number(l['qty'] || l['qty_ordered'] || l['quantity'] || 0);
                const remainingQtyVal = Number(l['remaining_qty'] || l['remaining_quantity'] || 0);
                const remainingQty = remainingQtyVal > 0 ? remainingQtyVal : qtyOrdered;

                return {
                    ...l,
                    so_line_id: String(l['so_line_id'] || l['id'] || ''),
                    item_id: itemId,
                    item_code: itemCode,
                    item_name: itemName,
                    qty_ordered: qtyOrdered,
                    remaining_qty: remainingQty,
                    qty_shipped: remainingQty,
                    uom_id: uomId,
                    uom_name: uomName,
                    warehouse_id: warehouseId,
                    warehouse_name: warehouseName,
                    location_id: locationId,
                    location_name: locationName,
                    lot_id: lotId,
                    lot_no: lotNo,
                    serial_no: String(l['serial_no'] || ''),
                };
            }));

            return {
                ...r,
                lines,
            };
        } catch (error) {
            logger.error('[DeliveryService] getPendingDeliveryDetail failed:', error);
            return null;
        }
    },

    /** Sanitize data before API call */
    sanitizeData: (data: DeliveryFormData | Partial<DeliveryFormData>, isUpdate = false) => {
        const raw = { ...data } as Record<string, unknown>;

        const toISOString = (dateInput?: unknown) => {
            if (!dateInput || dateInput === '') return undefined;
            try {
                const d = new Date(dateInput as string);
                if (isNaN(d.getTime())) return undefined;
                return d.toISOString();
            } catch {
                return undefined;
            }
        };

        const isValidId = (id: unknown): boolean => {
            if (id === null || id === undefined || id === '' || id === 0 || id === '0') return false;
            return true;
        };

        const mapId = (id: unknown) => {
            if (!id) return undefined;
            const num = Number(id);
            return !isNaN(num) ? num : String(id);
        };

        const transformed: Record<string, unknown> = {
            delivery_date: toISOString(raw['delivery_date']) || new Date().toISOString(),
            docu_date: toISOString(raw['docu_date']) || new Date().toISOString(),
            status: raw['status'] || 'DRAFT',
            ship_to_address: raw['ship_to_address'] || '',
            ship_method: raw['ship_method'] || '',
            carrier: raw['carrier'] || '',
            tracking_no: raw['tracking_no'] || '',
            remarks: raw['remarks'] || '',
            ship_by_emp: mapId(raw['ship_by_emp']) || null,
        };

        if (isValidId(raw['so_id'])) transformed['so_id'] = mapId(raw['so_id']);
        if (isValidId(raw['customer_id'])) transformed['customer_id'] = mapId(raw['customer_id']);
        if (isValidId(raw['branch_id'])) transformed['branch_id'] = mapId(raw['branch_id']);
        if (isValidId(raw['warehouse_id'])) transformed['warehouse_id'] = mapId(raw['warehouse_id']);

        if (raw.lines && Array.isArray(raw.lines)) {
            transformed.deliveryLines = (raw.lines as Record<string, unknown>[]).map((line) => {
                const l: Record<string, unknown> = {
                    item_id: mapId(line['item_id']),
                    qty_shipped: Number(line['qty_shipped'] || 0),
                    uom_id: mapId(line['uom_id']),
                    remarks: line['remarks'] || '',
                };

                if (isValidId(line['so_line_id'])) l['so_line_id'] = mapId(line['so_line_id']);
                if (isValidId(line['warehouse_id'])) l['warehouse_id'] = mapId(line['warehouse_id']);
                if (isValidId(line['location_id'])) l['location_id'] = mapId(line['location_id']);
                if (isValidId(line['lot_id'])) l['lot_id'] = mapId(line['lot_id']);
                if (line['serial_no']) l['serial_no'] = String(line['serial_no']);

                if (isUpdate && line.delivery_line_id && isValidId(line.delivery_line_id)) {
                    l.delivery_line_id = mapId(line.delivery_line_id);
                }

                return sanitizePayload(l, KNOWN_DELIVERY_LINE_FIELDS);
            });
        }

        return sanitizePayload(transformed, KNOWN_DELIVERY_DTO_FIELDS);
    },
};
