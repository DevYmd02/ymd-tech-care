import api from '@core/api/api';
import type { AxiosRequestConfig } from 'axios';
import { logger } from '@utils';
import { masterDataCache } from '@/shared/utils/master-data-cache';
import { 
    normalizeId, 
    normalizeDate, 
    normalizeCustomerName, 
    normalizeItemName, 
    normalizeItemCode 
} from '@/shared/utils/data-mapping.utils';
import type { CustomAxiosConfig } from '@/core/api/api';
import type { SalesOrderFormData } from '../types/sales-order.types';
import type { SalesOrderFormValues } from '../schemas/sales-order.schemas';
import type { ReservationHeader } from '@sales/reservation/services/reservation.service';
import { mapSalesOrderFormToDTO } from '../utils/sales-order-mappers';

export interface SalesOrderListParams {
    so_no?: string;
    customer_name?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
}

/** แสดงในตาราง List Page */
export interface SalesOrderHeader {
    so_id: string;              // PK uuid
    so_no: string;              // เลขที่ SO
    so_date: string;            // วันที่ SO (so_date)
    customer_name: string;      // ชื่อลูกค้า (join)
    customer_id: string;        // ID ลูกค้า
    customer_code: string;      // รหัสลูกค้า (join)
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONFIRMED' | 'CLOSED' | 'CANCELLED';
    total_amount: number;       // total_amount
    base_total_amount?: number; // base_total_amount
    currency_code: string;      // currency_code
    ship_date?: string;         // วันที่กำหนดส่ง
    remarks?: string;           // หมายเหตุ
    onhold: 'Y' | 'N';         // onhold
    rawData?: Record<string, unknown>;
}

export const SalesOrderService = {
    /** ดึงรายการ Sales Order */
    getList: async (params: SalesOrderListParams = {}, config?: CustomAxiosConfig) => {
        logger.debug('Fetching sales orders with params:', params);
        try {
            const response = await api.get<{ data: Record<string, unknown>[], total: number } | Record<string, unknown>[]>('/sale-order', { ...config, params });
            const rawData = Array.isArray(response) ? response : response.data || [];
            const total = Array.isArray(response) ? response.length : response.total || 0;

            const mappedData = rawData.map((item) => {
                const customerObj = (item.customer || {}) as Record<string, unknown>;
                const sqHeader = (item.sq_header || item.sq || {}) as Record<string, unknown>;
                const aqHeader = (item.aq_header || item.aq || {}) as Record<string, unknown>;
                const reservation = (item.reservation || {}) as Record<string, unknown>;
                
                const customerName = normalizeCustomerName(item);
                const customerCode = String(item.customer_code || 
                    customerObj.customer_code || customerObj.code ||
                    sqHeader.customer_code || aqHeader.customer_code || reservation.customer_code || '');

                const totalVal = Number(item.total_amount || item.base_total_amount || item.net_amount || 0);

                return {
                    ...item,
                    so_id: normalizeId(item.so_id || item.sale_order_id || item.uuid || item.header_id || item.id),
                    so_no: String(item.so_no || ''),
                    so_date: normalizeDate(item.so_date),
                    customer_id: normalizeId(item.customer_id || customerObj.customer_id || sqHeader.customer_id || aqHeader.customer_id),
                    customer_name: customerName,
                    customer_code: customerCode,
                    total_amount: totalVal,
                    base_total_amount: Number(item.base_total_amount || totalVal),
                    currency_code: String(item.currency_code || item.base_currency_code || 'THB'),
                    ship_date: normalizeDate(item.ship_date),
                    status: item.status || 'DRAFT',
                    onhold: item.onhold || 'N',
                    rawData: item,
                } as SalesOrderHeader;
            });

            return { data: mappedData, total };
        } catch (error) {
            logger.error('Failed to fetch sales orders:', error);
            return { data: [], total: 0 };
        }
    },

    /** ดึงข้อมูล Sales Order รายตัว */
    getById: async (id: string, config?: CustomAxiosConfig): Promise<SalesOrderFormData | null> => {
        logger.debug('Fetching sales order:', id);
        try {
            const response = await api.get<Record<string, unknown>>(`/sale-order/${id}`, config);
            
            if (response) {
                let rRaw = response as Record<string, unknown>;
                if (rRaw['data'] && typeof rRaw['data'] === 'object' && !Array.isArray(rRaw['data'])) {
                    rRaw = rRaw['data'] as Record<string, unknown>;
                }
                
                const r = (rRaw['sale_order'] || rRaw['so_header'] || rRaw['order'] || rRaw['header'] || rRaw) as Record<string, unknown>;
                
                r['so_date'] = normalizeDate(r['so_date']);
                r['ship_date'] = normalizeDate(r['ship_date']);
                r['exchange_rate_date'] = normalizeDate(r['exchange_rate_date']);
                r['ship_date_actual'] = normalizeDate(r['ship_date_actual']);
                
                let rawLinesData = (
                    r['sale_order_lines'] || 
                    r['saleOrderLines'] || 
                    r['saleReservationLines'] || 
                    r['so_lines'] || 
                    r['lines'] || 
                    r['items'] ||
                    r['sale_order_line'] ||
                    r['saleOrderLine'] ||
                    []
                ) as unknown;

                if (!Array.isArray(rawLinesData) || (rawLinesData as unknown[]).length === 0) {
                    const potentialLinesKey = Object.keys(r).find(key => 
                        Array.isArray(r[key]) && 
                        (key.toLowerCase().includes('line') || key.toLowerCase().includes('item') || key.toLowerCase().includes('detail'))
                    );
                    if (potentialLinesKey) {
                        rawLinesData = r[potentialLinesKey];
                    }
                }

                const rawLines = (Array.isArray(rawLinesData) ? rawLinesData : []) as Record<string, unknown>[];
                
                // 🎯 [Performance] Step 1: Extract unique Item & Lot IDs for batch hydration
                const uniqueItemIds = Array.from(new Set(rawLines.map(l => normalizeId(l['item_id'] || ((l['item'] || {}) as Record<string, unknown>)['id'])).filter(Boolean))) as string[];
                const uniqueLotIds = Array.from(new Set(rawLines.map(l => l['lot_id']).filter(id => id && (typeof id === 'string' || typeof id === 'number')))) as (string|number)[];

                // 🎯 [Performance] Step 2: Fetch Item and Lot details in parallel (Unique IDs only)
                const [itemMasterResults, lotResults] = await Promise.all([
                    Promise.all(uniqueItemIds.map(async (itemId) => {
                        try {
                            const res = await api.get<unknown>(`/item-master/${itemId}`, config);
                            return { itemId, data: ((res as Record<string, unknown>)?.data || res) as Record<string, unknown> };
                        } catch { return { itemId, data: null }; }
                    })),
                    Promise.all(uniqueLotIds.map(async (lotId) => {
                        try {
                            const res = await api.get<unknown>(`/item-lot/${lotId}`, config);
                            return { lotId, data: ((res as Record<string, unknown>)?.data || res) as Record<string, unknown> };
                        } catch { return { lotId, data: null }; }
                    }))
                ]);

                // Create lookups for O(1) access
                const itemLookup = new Map(itemMasterResults.filter(r => r.data).map(r => [r.itemId, r.data]));
                const lotLookup = new Map(lotResults.filter(r => r.data).map(r => [String(r.lotId), r.data]));

                // 🎯 [Performance] Step 3: Map lines using the pre-fetched lookup data
                r['lines'] = rawLines.map((l: Record<string, unknown>) => {
                    const itemId = normalizeId(l['item_id'] || ((l['item'] || {}) as Record<string, unknown>)['id']);
                    let itemCode = normalizeItemCode(l);
                    let itemName = normalizeItemName(l);

                    const master = itemId ? itemLookup.get(itemId as string) : null;
                    if (master) {
                        itemCode = itemCode || normalizeItemCode(master);
                        itemName = itemName || normalizeItemName(master);
                    }

                    if (!itemName && itemId) itemName = `[Item ID: ${itemId}]`;

                    const lotIdVal = l['lot_id'];
                    const lotObj = (typeof lotIdVal === 'object' && lotIdVal !== null) ? (lotIdVal as Record<string, unknown>) : ((l['lot'] || l['lot_header'] || {}) as Record<string, unknown>);
                    let lotNo = String(l['lot_no'] || l['lot_number'] || lotObj['lot_no'] || lotObj['code'] || '');

                    const lotData = lotIdVal ? lotLookup.get(String(lotIdVal)) : null;
                    if (lotData) {
                        lotNo = lotNo || String(lotData['lot_no'] || lotData['code'] || '');
                    }

                    return {
                        ...l,
                        so_line_id: normalizeId(l['so_line_id'] || l['id']),
                        item_id: itemId,
                        item_code: itemCode,
                        item_name: itemName,
                        uom_id: normalizeId(l['uom_id'] || ((l['item'] || {}) as Record<string, unknown>)['uom_id']),
                        uom_name: String(l['uom_name'] || ((l['uom'] || {}) as Record<string, unknown>)['uom_name'] || ''),
                        warehouse_id: normalizeId(l['warehouse_id']),
                        location_id: normalizeId(l['location_id']),
                        qty_ordered: Number(l['qty'] || l['qty_ordered'] || l['quantity'] || 0),
                        unit_price: Number(l['unit_price'] || l['price'] || 0),
                        line_discount: Number(l['discount_amount'] || l['line_discount'] || 0),
                        line_total: Number(l['net_amount'] || l['line_total'] || l['amount'] || 0),
                        lot_id: normalizeId(lotIdVal ? (
                            (typeof lotIdVal === 'object' && lotIdVal !== null)
                                ? ((lotIdVal as Record<string, unknown>).id || (lotIdVal as Record<string, unknown>).lot_id)
                                : lotIdVal
                        ) : undefined),
                        lot_no: lotNo,
                        price_source: l['price_source'],
                        price_source_name: String(l['price_source_name'] || ''),
                        price_level_priority: l['price_level_priority'],
                    };
                });

                const customerObj = (r['customer'] || r['customer_header'] || r['customer_ref'] || r['cust'] || {}) as Record<string, unknown>;
                const reservationObj = (r['reservation'] || r['reservation_header'] || r['res_header'] || r['reservation_ref'] || {}) as Record<string, unknown>;
                const branchObj = (r['branch'] || r['branch_header'] || r['id_branch'] || r['branch_ref'] || {}) as Record<string, unknown>;
                const deptObj = (r['dept'] || r['department'] || r['id_dept'] || r['dept_ref'] || r['emp_dept'] || {}) as Record<string, unknown>;
                const taxObj = (r['tax_code'] || r['tax'] || r['taxCode'] || r['tax_ref'] || r['tax_id'] || {}) as Record<string, unknown>;
                
                const rawEmpId = r['emp_sale_id'] || r['sale_id'] || r['employee_id'] || r['sale_employee_id'] || r['id_emp_sale'];
                const rawResId = r['reservation_id'] || r['reservation_header_id'] || r['res_id'] || r['id_reservation'];
                const rawJobId = r['job_id'] || r['project_id'] || r['project_header_id'] || r['job_header_id'] || r['id_project'] || r['id_job'];
                const rawBranchId = r['branch_id'] || r['id_branch'] || branchObj['branch_id'] || branchObj['id'] || branchObj['id_branch'] || r['branch_header_id'] || r['id_branch_header'];
                const rawDeptId = r['emp_dept_id'] || r['dept_id'] || r['department_id'] || r['id_dept'] || deptObj['id'] || deptObj['id_dept'] || r['emp_dept_id'] || r['id_dept_header'];
                const rawTaxId = r['tax_code_id'] || r['tax_id'] || r['id_tax'] || r['tax_code_ref_id'] || taxObj['id'] || taxObj['id_tax'] || taxObj['tax_id'];

                r['customer_id'] = normalizeId(r['customer_id'] || customerObj['customer_id'] || customerObj['id']);
                r['customer_name'] = normalizeCustomerName(r);
                r['customer_code'] = String(r['customer_code'] || customerObj['customer_code'] || customerObj['code'] || '');

                r['branch_id'] = normalizeId(rawBranchId);
                r['branch_name'] = String(r['branch_name'] || branchObj['branch_name'] || branchObj['name'] || '');

                r['emp_sale_id'] = normalizeId(rawEmpId);
                r['emp_dept_id'] = normalizeId(rawDeptId);
                r['emp_dept_name'] = String(r['emp_dept_name'] || deptObj['dept_name'] || '');

                r['emp_area_id'] = normalizeId(r['emp_area_id'] || r['sale_area_id'] || r['area_id']);
                
                r['reservation_id'] = normalizeId(rawResId);
                r['reservation_no'] = String(r['reservation_no'] || reservationObj['reservation_no'] || '');

                r['job_id'] = normalizeId(rawJobId);
                
                r['tax_code_id'] = normalizeId(rawTaxId);
                r['tax_code'] = String(r['tax_code'] || taxObj['tax_code'] || taxObj['code'] || '');

                r['base_currency_code'] = String(r['base_currency_code'] || r['currency_code'] || r['currency'] || 'THB');
                r['quote_currency_code'] = String(r['quote_currency_code'] || r['id_currency_code'] || r['currency_code'] || r['currency'] || 'THB');

                r['ship_date'] = r['ship_date'] || r['delivery_date'] || r['shipment_date'] || r['est_ship_date'] || r['scheduled_date'] || r['shipDate'] || r['ship_date_actual'];
                if (r['ship_date']) r['ship_date'] = String(r['ship_date']).split('T')[0];

                r['sub_total'] = Number(r['sub_total'] || r['base_sub_total'] || 0);
                r['discount_amount'] = Number(r['discount_amount'] || 0);
                r['discount_input'] = String(r['discount_expression'] || r['discount_input'] || '0');
                r['vat_amount'] = Number(r['vat_amount'] || 0);
                r['total_amount'] = Number(r['total_amount'] || r['quote_total_amount'] || r['base_total_amount'] || 0);

                const apiIsMulticurrency = r['is_multicurrency'];
                r['isMulticurrency'] = !(apiIsMulticurrency === 'N' || apiIsMulticurrency === false || apiIsMulticurrency === 0 || apiIsMulticurrency === 'n');

                if (!!r['base_currency_code'] && r['base_currency_code'] !== 'THB') {
                    r['isMulticurrency'] = true;
                }

                // 🎯 [Performance] Step 4: Final Metadata Hydration (Branch, Employee, Dept)
                // Use parallel fetching for any metadata missing from the cache
                await Promise.all([
                    (async () => {
                        if (rawBranchId && !r['branch_name']) {
                            const cachedName = masterDataCache.getBranchName(rawBranchId as string | number);
                            if (cachedName) {
                                r['branch_name'] = cachedName;
                            } else {
                                try {
                                    const branchRes = await api.get<Record<string, unknown>>(`/org-branches/${rawBranchId}`, config);
                                    const branchData = (branchRes['data'] as Record<string, unknown>) || branchRes;
                                    if (branchData) r['branch_name'] = String(branchData['branch_name'] || branchData['name'] || branchData['name_th'] || '');
                                } catch { /* ignore */ }
                            }
                        }
                    })(),
                    (async () => {
                        if (rawEmpId && !r['emp_sale_name']) {
                            const cachedName = masterDataCache.getEmployeeName(rawEmpId as string | number);
                            if (cachedName) {
                                r['emp_sale_name'] = cachedName;
                            } else {
                                try {
                                    const empRes = await api.get<Record<string, unknown>>(`/employees/${rawEmpId}`, config);
                                    const empData = (empRes['data'] as Record<string, unknown>) || empRes;
                                    if (empData) r['emp_sale_name'] = String(empData['employee_fullname'] || empData['employee_name'] || 
                                            `${empData['employee_firstname_th'] || ''} ${empData['employee_lastname_th'] || ''}`.trim());
                                } catch { /* ignore */ }
                            }
                        }
                    })(),
                    (async () => {
                        if (rawDeptId && !r['emp_dept_name']) {
                            const cachedName = masterDataCache.getDepartmentName(rawDeptId as string | number);
                            if (cachedName) {
                                r['emp_dept_name'] = cachedName;
                            } else {
                                try {
                                    const deptRes = await api.get<Record<string, unknown>>(`/department/${rawDeptId}`, config);
                                    const deptData = (deptRes['data'] as Record<string, unknown>) || deptRes;
                                    if (deptData) r['emp_dept_name'] = String(deptData['dept_name'] || deptData['name'] || deptData['name_th'] || '');
                                } catch { /* ignore */ }
                            }
                        }
                    })()
                ]);

                if (r !== rRaw) {
                    const criticalFields = [
                        'branch_name', 'branch_id', 'emp_dept_name', 'emp_dept_id', 
                        'emp_sale_name', 'emp_sale_id', 'tax_code', 'tax_code_id',
                        'job_name', 'job_id', 'emp_area_name', 'emp_area_id',
                        'reservation_no', 'reservation_id', 'ship_date', 
                        'base_currency_code', 'quote_currency_code', 'lines',
                        'customer_name', 'customer_code', 'customer_id'
                    ];
                    criticalFields.forEach(field => {
                        if (r[field] !== undefined) rRaw[field] = r[field];
                    });
                }

                return rRaw as unknown as SalesOrderFormData;
            }
            return null;
        } catch (error) {
            logger.error(`Failed to fetch sales order ${id}:`, error);
            return null;
        }
    },

    /** สร้าง Sales Order ใหม่ */
    create: async (data: SalesOrderFormData, config?: AxiosRequestConfig) => {
        const payload = mapSalesOrderFormToDTO(data as unknown as SalesOrderFormValues, false);
        logger.info('🚀 [SalesOrderService] CREATE PAYLOAD:', payload);
        
        try {
            const response = await api.post('/sale-order', payload, config);
            return { success: true, data: response };
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string | string[] } }; message: string };
            const errorData = err.response?.data;
            if (errorData && Array.isArray(errorData.message)) {
                errorData.message.forEach(m => logger.error('Validation Error:', m));
            } else {
                logger.error('Failed to create sales order:', errorData || err.message);
            }
            throw error;
        }
    },

    /** อัปเดต Sales Order */
    update: async (id: string, data: Partial<SalesOrderFormData>, config?: AxiosRequestConfig) => {
        const payload = mapSalesOrderFormToDTO(data as unknown as SalesOrderFormValues, true);
        logger.info(`🚀 [SalesOrderService] UPDATE PAYLOAD for ${id}:`, payload);
        
        try {
            const response = await api.patch(`/sale-order/${id}`, payload, config);
            return { success: true, data: response };
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string | string[] } }; message: string };
            const errorData = err.response?.data;
            if (errorData && Array.isArray(errorData.message)) {
                errorData.message.forEach(m => logger.error('Validation Error:', m));
            } else {
                logger.error(`Failed to update sales order ${id}:`, errorData || err.message);
            }
            throw error;
        }
    },

    /** อัปเดตสถานะ Sales Order */
    updateStatus: async (id: string, status: string, config?: AxiosRequestConfig) => {
        logger.info(`🚀 [SalesOrderService] UPDATE STATUS for ${id}:`, { status });
        try {
            const response = await api.patch(`/sale-order/${id}/pending`, { status, so_status: status }, config);
            return { success: true, data: response };
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string | string[] } }; message: string };
            logger.error(`Failed to update status for sales order ${id}:`, err.response?.data || err.message);
            throw error;
        }
    },

    /** ลบ Sales Order */
    delete: async (id: string, config?: AxiosRequestConfig) => {
        logger.debug('Deleting sales order:', id);
        try {
            await api.delete(`/sale-order/${id}`, config);
            return { success: true };
        } catch (error) {
            logger.error(`Failed to delete sales order ${id}:`, error);
            throw error;
        }
    },

    /** ดึงรายการใบจองที่สามารถนำมาสร้าง Sales Order ได้ */
    getAvailableRS: async (config?: AxiosRequestConfig): Promise<ReservationHeader[]> => {
        try {
            const response = await api.get<unknown>('/sale-order/available-rs', config);
            const data = (Array.isArray(response) ? response : (response as Record<string, unknown>)?.data || []) as Record<string, unknown>[];
            
            return data.map((item) => {
                const sqHeader = (item.sq_header || item.sq || {}) as Record<string, unknown>;
                const aqHeader = (item.aq_header || item.aq || {}) as Record<string, unknown>;
                const customerObj = (item.customer || sqHeader.customer || aqHeader.customer || {}) as Record<string, unknown>;
                
                const customerName = String(item.customer_name || 
                                   sqHeader.customer_name || 
                                   aqHeader.customer_name || 
                                   customerObj.customer_name_th || 
                                   customerObj.customer_name || 
                                   customerObj.name || 
                                   item.customer_name_th || '');
                                   
                const customerCode = String(item.customer_code || 
                                   sqHeader.customer_code || 
                                   aqHeader.customer_code || 
                                   customerObj.customer_code || 
                                   customerObj.code || 
                                   item.customer_code || '');
 
                return {
                    ...item,
                    reservation_id: String(item.reservation_id || ''),
                    reservation_no: String(item.reservation_no || ''),
                    reservation_date: String(item.reservation_date || ''),
                    customer_id: String(item.customer_id || sqHeader.customer_id || aqHeader.customer_id || ''),
                    customer_name: customerName,
                    customer_code: customerCode,
                    base_total_amount: Number(item.base_total_amount || item.total_amount || item.net_amount || sqHeader.total_amount || aqHeader.total_amount || 0),
                    quote_currency_code: String(item.quote_currency_code || item.currency_code || sqHeader.currency_code || 'THB'),
                    status: String(item.status || '')
                } as ReservationHeader;
            });
        } catch (error) {
            logger.error('Failed to fetch available reservations:', error);
            return [];
        }
    },
};
