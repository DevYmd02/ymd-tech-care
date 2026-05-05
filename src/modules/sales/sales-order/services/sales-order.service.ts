import api from '@core/api/api';
import { logger } from '@utils/logger';
import type { SalesOrderFormData } from '../types/sales-order.types';
import type { ReservationHeader } from '@sales/reservation/services/reservation.service';

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
    getList: async (params: SalesOrderListParams = {}) => {
        logger.debug('Fetching sales orders with params:', params);
        try {
            const response = await api.get<{ data: Record<string, unknown>[], total: number } | Record<string, unknown>[]>('/sale-order', { params });
            const rawData = Array.isArray(response) ? response : response.data || [];
            const total = Array.isArray(response) ? response.length : response.total || 0;

            const mappedData = rawData.map((item) => {
                const customerObj = (item.customer || {}) as Record<string, unknown>;
                const sqHeader = (item.sq_header || item.sq || {}) as Record<string, unknown>;
                const aqHeader = (item.aq_header || item.aq || {}) as Record<string, unknown>;
                const reservation = (item.reservation || {}) as Record<string, unknown>;
                
                const customerName = String(item.customer_name || 
                    customerObj.customer_name_th || customerObj.customer_name || customerObj.name ||
                    sqHeader.customer_name || aqHeader.customer_name || reservation.customer_name || '');
                
                const customerCode = String(item.customer_code || 
                    customerObj.customer_code || customerObj.code ||
                    sqHeader.customer_code || aqHeader.customer_code || reservation.customer_code || '');

                const totalVal = Number(item.total_amount || item.base_total_amount || item.net_amount || 0);

                return {
                    ...item,
                    so_id: String(item.so_id || item.sale_order_id || item.uuid || item.header_id || item.id || ''),
                    so_no: String(item.so_no || ''),
                    so_date: item.so_date ? String(item.so_date).split('T')[0] : '',
                    customer_id: String(item.customer_id || customerObj.customer_id || sqHeader.customer_id || aqHeader.customer_id || ''),
                    customer_name: customerName,
                    customer_code: customerCode,
                    total_amount: totalVal,
                    base_total_amount: Number(item.base_total_amount || totalVal),
                    currency_code: String(item.currency_code || item.base_currency_code || 'THB'),
                    ship_date: item.ship_date ? String(item.ship_date).split('T')[0] : '',
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
    getById: async (id: string): Promise<SalesOrderFormData | null> => {
        logger.debug('Fetching sales order:', id);
        try {
            const response = await api.get<Record<string, unknown>>(`/sale-order/${id}`);
            
            if (response) {
                // 🕵️ Deep Data Discovery: Handle nested .data structures
                let rRaw = response as Record<string, unknown>;
                if (rRaw['data'] && typeof rRaw['data'] === 'object' && !Array.isArray(rRaw['data'])) {
                    rRaw = rRaw['data'] as Record<string, unknown>;
                }
                
                // Find the actual SO object (might be nested under sale_order, so_header, etc.)
                const r = (rRaw['sale_order'] || rRaw['so_header'] || rRaw['order'] || rRaw['header'] || rRaw) as Record<string, unknown>;
                
                logger.info(`🔍 [SalesOrderService] Fetched SO Detail ID ${id}:`, {
                    hasShipDate: !!r['ship_date'],
                    shipDateVal: r['ship_date'],
                    allKeys: Object.keys(r)
                });

                // Date formatting (Convert ISO to YYYY-MM-DD for HTML date inputs)
                if (r['so_date']) r['so_date'] = String(r['so_date']).split('T')[0];
                if (r['ship_date']) r['ship_date'] = String(r['ship_date']).split('T')[0];
                if (r['exchange_rate_date']) r['exchange_rate_date'] = String(r['exchange_rate_date']).split('T')[0];
                if (r['ship_date_actual']) r['ship_date_actual'] = String(r['ship_date_actual']).split('T')[0];
                
                // Map lines (Robust fallback for various API names)
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

                // 🕵️ Aggressive Discovery: Scan all keys for arrays if standard ones are missing
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
                
                // 🛠️ Line Mapping with Enrichment (Mirrors ReservationService for robustness)
                r['lines'] = await Promise.all(rawLines.map(async (l: Record<string, unknown>) => {
                    const item = (l['item'] || l['item_header'] || l['item_master'] || l['product'] || l['item_ref'] || {}) as Record<string, unknown>;
                    const uom = (l['uom'] || l['unit'] || l['uom_header'] || l['uom_ref'] || {}) as Record<string, unknown>;
                    
                    const itemId = String(l['item_id'] || item['item_id'] || item['id'] || '');
                    let itemCode = String(l['item_code'] || item['item_code'] || item['code'] || '');
                    let itemName = String(l['item_name'] || item['item_name'] || item['item_name_th'] || item['name'] || '');

                    // 🚀 Re-Enrich Items if missing (Essential fallback)
                    if ((!itemCode || !itemName) && itemId) {
                        try {
                            const masterRes = await api.get<unknown>(`/item-master/${itemId}`);
                            const master = ((masterRes as Record<string, unknown>)?.data || masterRes) as Record<string, unknown>;
                            if (master) {
                                itemCode = itemCode || String(master['item_code'] || master['code'] || master['item_master_code'] || '');
                                itemName = itemName || String(master['item_name'] || master['name'] || master['item_name_th'] || master['item_master_name_th'] || '');
                            }
                        } catch { /* ignore */ }
                    }

                    // Final fallback for name if still missing
                    if (!itemName && itemId) itemName = `[Item ID: ${itemId}]`;

                    const lotIdVal = l['lot_id'];
                    const lotObj = (typeof lotIdVal === 'object' && lotIdVal !== null) ? (lotIdVal as Record<string, unknown>) : ((l['lot'] || l['lot_header'] || {}) as Record<string, unknown>);
                    let lotNo = String(l['lot_no'] || l['lot_number'] || lotObj['lot_no'] || lotObj['code'] || '');

                    // 🚀 Re-Enrich Lots if missing (Essential fallback)
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

                    return {
                        ...l,
                        so_line_id: String(l['so_line_id'] || l['id'] || l['line_id'] || ''),
                        item_id: itemId,
                        item_code: itemCode,
                        item_name: itemName,
                        uom_id: String(l['uom_id'] || item['uom_id'] || l['uom_header_id'] || uom['uom_id'] || uom['id'] || l['unit_id'] || ''),
                        uom_name: String(l['uom_name'] || uom['uom_name'] || uom['unit_name'] || uom['name'] || uom['name_th'] || uom['unit_name_th'] || l['unit_name'] || ''),
                        warehouse_id: String(l['warehouse_id'] || l['wh_id'] || ''),
                        location_id: String(l['location_id'] || l['loc_id'] || ''),
                        qty_ordered: Number(l['qty'] || l['qty_ordered'] || l['quantity'] || 0),
                        unit_price: Number(l['unit_price'] || l['price'] || 0),
                        line_discount: Number(l['discount_amount'] || l['line_discount'] || 0),
                        line_discount_input: String(l['discount_expression'] || l['line_discount_input'] || '0'),
                        line_total: Number(l['net_amount'] || l['line_total'] || l['amount'] || 0),
                        lot_id: lotIdVal ? String(
                            (typeof lotIdVal === 'object' && lotIdVal !== null) 
                                ? ((lotIdVal as Record<string, unknown>).id || (lotIdVal as Record<string, unknown>).lot_id || '') 
                                : lotIdVal
                        ) : undefined,
                        lot_no: lotNo,
                    };
                }));

                // Map header fields (Capture raw IDs first for enrichment)
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

                r['customer_id'] = String(r['customer_id'] || customerObj['customer_id'] || customerObj['id'] || '');
                r['customer_name'] = String(r['customer_name'] || customerObj['customer_name_th'] || customerObj['customer_name'] || customerObj['name'] || customerObj['name_th'] || '');
                r['customer_code'] = String(r['customer_code'] || customerObj['customer_code'] || customerObj['code'] || '');

                r['branch_id'] = rawBranchId != null ? String(rawBranchId) : '';
                r['branch_name'] = String(r['branch_name'] || branchObj['branch_name'] || branchObj['name'] || branchObj['name_th'] || '');

                r['emp_sale_id'] = rawEmpId != null ? String(rawEmpId) : '';
                r['emp_dept_id'] = rawDeptId != null ? String(rawDeptId) : '';
                r['emp_dept_name'] = String(r['emp_dept_name'] || deptObj['dept_name'] || deptObj['name'] || deptObj['name_th'] || '');

                r['emp_area_id'] = String(r['emp_area_id'] || r['sale_area_id'] || r['area_id'] || r['id_area'] || '');
                
                r['reservation_id'] = rawResId != null ? String(rawResId) : '';
                r['reservation_no'] = String(r['reservation_no'] || reservationObj['reservation_no'] || reservationObj['code'] || reservationObj['no'] || '');

                r['job_id'] = rawJobId != null ? String(rawJobId) : '';
                
                r['tax_code_id'] = rawTaxId != null ? String(rawTaxId) : '';
                r['tax_code'] = String(r['tax_code'] || taxObj['tax_code'] || taxObj['code'] || taxObj['name'] || taxObj['tax_code_name'] || '');

                // Multi-currency mapping
                r['base_currency_code'] = String(r['base_currency_code'] || r['currency_code'] || r['currency'] || 'THB');
                r['quote_currency_code'] = String(r['quote_currency_code'] || r['id_currency_code'] || r['currency_code'] || r['currency'] || 'THB');

                // Enhanced Date Discovery
                r['ship_date'] = r['ship_date'] || r['delivery_date'] || r['shipment_date'] || r['est_ship_date'] || r['scheduled_date'] || r['shipDate'] || r['ship_date_actual'];
                if (r['ship_date']) r['ship_date'] = String(r['ship_date']).split('T')[0];

                r['sub_total'] = Number(r['sub_total'] || r['base_sub_total'] || 0);
                r['discount_amount'] = Number(r['discount_amount'] || 0);
                r['discount_input'] = String(r['discount_expression'] || r['discount_input'] || '0');
                r['vat_amount'] = Number(r['vat_amount'] || 0);
                r['total_amount'] = Number(r['total_amount'] || r['quote_total_amount'] || r['base_total_amount'] || 0);

                // Multi-currency mapping (Aggressive Default to true)
                const apiIsMulticurrency = r['is_multicurrency'];
                r['isMulticurrency'] = !(apiIsMulticurrency === 'N' || apiIsMulticurrency === false || apiIsMulticurrency === 0 || apiIsMulticurrency === 'n');

                if (!!r['base_currency_code'] && r['base_currency_code'] !== 'THB') {
                    r['isMulticurrency'] = true;
                }

                // 🔍 Enrichment: Fetch extra names if missing from primary response
                
                // 1. Branch Enrichment
                if (rawBranchId && !r['branch_name']) {
                    try {
                        const branchRes = await api.get<Record<string, unknown>>(`/org-branches/${rawBranchId}`);
                        const branchData = (branchRes['data'] as Record<string, unknown>) || branchRes;
                        if (branchData) {
                            r['branch_name'] = String(branchData['branch_name'] || branchData['name'] || branchData['name_th'] || '');
                        }
                    } catch { /* ignore */ }
                }

                // 2. Employee/Sales Person Enrichment
                if (!r['emp_sale_name']) {
                    r['emp_sale_name'] = String(reservationObj['emp_sale_name'] || reservationObj['emp_name'] || '');
                }
                if (rawEmpId && !r['emp_sale_name']) {
                    try {
                        const empRes = await api.get<Record<string, unknown>>(`/employees/${rawEmpId}`);
                        const empData = (empRes['data'] as Record<string, unknown>) || empRes;
                        if (empData) {
                            r['emp_sale_name'] = String(empData['employee_fullname'] || empData['employee_name'] || 
                                `${empData['employee_firstname_th'] || ''} ${empData['employee_lastname_th'] || ''}`.trim());
                        }
                    } catch (e) {
                        logger.warn(`Failed to enrich employee name for ID ${rawEmpId}`, e);
                    }
                }

                // 3. Department Enrichment
                if (rawDeptId && !r['emp_dept_name']) {
                    try {
                        const deptRes = await api.get<Record<string, unknown>>(`/department/${rawDeptId}`);
                        const deptData = (deptRes['data'] as Record<string, unknown>) || deptRes;
                        if (deptData) {
                            r['emp_dept_name'] = String(deptData['dept_name'] || deptData['name'] || deptData['name_th'] || '');
                        }
                    } catch { /* ignore */ }
                }

                // 4. Reservation Enrichment
                if (rawResId && (!r['reservation_no'] || r['reservation_no'] === String(rawResId))) {
                    try {
                        const resRes = await api.get<Record<string, unknown>>(`/sale-reservation/${rawResId}`);
                        const resData = (resRes['data'] as Record<string, unknown>) || resRes;
                        if (resData) {
                            r['reservation_no'] = String(resData['reservation_no'] || resData['code'] || '');
                        }
                    } catch (e) {
                        logger.warn(`Failed to enrich reservation number for ID ${rawResId}`, e);
                    }
                }

                // 5. Tax Code Enrichment
                if (rawTaxId && !r['tax_code']) {
                    try {
                        const taxRes = await api.get<Record<string, unknown>>(`/tax-code/${rawTaxId}`);
                        const taxData = (taxRes['data'] as Record<string, unknown>) || taxRes;
                        if (taxData) {
                            r['tax_code'] = String(taxData['tax_code'] || taxData['code'] || taxData['name'] || '');
                        }
                    } catch { /* ignore */ }
                }

                // 6. Project/Job Enrichment
                if (rawJobId && !r['job_name']) {
                    try {
                        const jobRes = await api.get<Record<string, unknown>>(`/project/${rawJobId}`);
                        const jobData = (jobRes['data'] as Record<string, unknown>) || jobRes;
                        if (jobData) {
                            r['job_name'] = String(jobData['project_name'] || jobData['name'] || jobData['name_th'] || '');
                        }
                    } catch { /* ignore */ }
                }

                // 7. Area Enrichment
                const rawAreaId = r['emp_area_id'] || r['sale_area_id'] || r['area_id'];
                if (rawAreaId && !r['emp_area_name']) {
                    try {
                        const areaRes = await api.get<Record<string, unknown>>(`/employee-sale-area/${rawAreaId}`);
                        const areaData = (areaRes['data'] as Record<string, unknown>) || areaRes;
                        if (areaData) {
                            r['emp_area_name'] = String(areaData['area_name'] || areaData['name'] || areaData['sale_area_name'] || '');
                        }
                    } catch { /* ignore */ }
                }

                // 🚀 FINAL STEP: Mirror all enriched fields back to the root of the response
                // This ensures that regardless of whether normalizeSO looks at the top level or nested object, it SEES the data.
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
    create: async (data: SalesOrderFormData) => {
        const payload = SalesOrderService.sanitizeData(data, false);
        logger.info('🚀 [SalesOrderService] CREATE PAYLOAD:', payload);
        
        try {
            const response = await api.post('/sale-order', payload);
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
    update: async (id: string, data: Partial<SalesOrderFormData>) => {
        const payload = SalesOrderService.sanitizeData(data, true);
        logger.info(`🚀 [SalesOrderService] UPDATE PAYLOAD for ${id}:`, payload);
        
        try {
            const response = await api.patch(`/sale-order/${id}`, payload);
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

    /** อัปเดตสถานะ Sales Order (เฉพาะ status เท่านั้น ไม่ผ่าน sanitizeData) */
    updateStatus: async (id: string, status: string) => {
        logger.info(`🚀 [SalesOrderService] UPDATE STATUS for ${id}:`, { status });
        try {
            const response = await api.patch(`/sale-order/${id}/pending`, { status, so_status: status });
            return { success: true, data: response };
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string | string[] } }; message: string };
            const errorData = err.response?.data;
            if (errorData && Array.isArray(errorData.message)) {
                errorData.message.forEach(m => logger.error('Validation Error:', m));
            } else {
                logger.error(`Failed to update status for sales order ${id}:`, errorData || err.message);
            }
            throw error;
        }
    },

    /** ลบ Sales Order */
    delete: async (id: string) => {
        logger.debug('Deleting sales order:', id);
        try {
            await api.delete(`/sale-order/${id}`);
            return { success: true };
        } catch (error) {
            logger.error(`Failed to delete sales order ${id}:`, error);
            throw error;
        }
    },

    /** Helper to clean data before sending to API */
    sanitizeData: (data: SalesOrderFormData | Partial<SalesOrderFormData>, isUpdate = false) => {
        const raw = { ...data } as Record<string, unknown>;
        
        const toISOString = (dateInput?: unknown) => {
            if (!dateInput || dateInput === '') return undefined;
            try {
                const date = new Date(dateInput as string);
                if (isNaN(date.getTime())) return undefined;
                return date.toISOString();
            } catch {
                return undefined;
            }
        };

        const isValidId = (id: unknown): boolean => {
            if (id === null || id === undefined || id === '' || id === 0) return false;
            const num = Number(id);
            return !isNaN(num) && num > 0;
        };

        // 🛡️ BACKEND VALIDATION FIX: 
        // Based on console errors, the backend for /sale-order expects:
        // 1. Omission of calculated fields (total_amount, etc.)
        // 2. exchange_rate and exchange_rate_date are mandatory
        // 3. Lines must be sent as 'saleReservationLines' (likely a backend bug but required)
        // 4. emp_area_id must be 'sale_area_id'
        const payload: Record<string, unknown> = {
            so_date: toISOString(raw['so_date']) || new Date().toISOString(),
            status: raw['status'] || 'DRAFT',
            status_remark: raw['status_remark'] || '',
            // currency_code: OMITTED (Backend error: should not exist)
            base_currency_code: raw['base_currency_code'] || raw['currency_code'] || 'THB',
            quote_currency_code: raw['quote_currency_code'] || raw['currency_code'] || 'THB',
            exchange_rate: Number(raw['exchange_rate'] || 1),
            exchange_rate_date: toISOString(raw['exchange_rate_date'] || raw['so_date']) || new Date().toISOString(),
            payment_term_days: Number(raw['payment_term_days'] || 0),
            ship_days: Number(raw['ship_days'] || 0),
            onhold: raw['onhold'] === true || raw['onhold'] === 'Y' ? 'Y' : 'N',
            remarks: raw['remarks'] || '',
            discount_expression: raw['discount_input'] || raw['discount_expression'] || '0',
            ship_date: toISOString(raw['ship_date']),
            // Financial fields OMITTED as per backend "should not exist" error
        };

        // Add Optional IDs only if valid
        if (isValidId(raw['customer_id'])) payload['customer_id'] = Number(raw['customer_id']);
        if (isValidId(raw['branch_id'])) payload['branch_id'] = Number(raw['branch_id']);
        if (isValidId(raw['tax_code_id'])) payload['tax_code_id'] = Number(raw['tax_code_id']);
        if (isValidId(raw['emp_sale_id'])) payload['emp_sale_id'] = Number(raw['emp_sale_id']);
        if (isValidId(raw['emp_dept_id'])) payload['emp_dept_id'] = Number(raw['emp_dept_id']);
        if (isValidId(raw['emp_area_id'] || raw['sale_area_id'])) {
            payload['sale_area_id'] = Number(raw['emp_area_id'] || raw['sale_area_id']);
        }
        if (isValidId(raw['reservation_id'])) payload['reservation_id'] = Number(raw['reservation_id']);
        
        const project_id = raw['job_id'] || raw['project_id'];
        if (isValidId(project_id)) payload['project_id'] = Number(project_id);

        if (raw.lines && Array.isArray(raw.lines)) {
            const headerSoId = Number(raw['so_id'] || 0);
            payload.saleOrderLines = raw.lines.map((line: Record<string, unknown>) => {
                const l: Record<string, unknown> = {
                    so_id: headerSoId || Number(line['so_id'] || 0),
                    item_id: Number(line['item_id']),
                    qty: Number(line['qty_ordered'] || line['qty'] || 0),
                    uom_id: Number(line['uom_id']),
                    unit_price: Number(line['unit_price'] || 0),
                    net_amount: Number(line['line_total'] || 0), // 🧪 Backend Error 4: must be a number
                    discount_expression: line['line_discount_input'] || line['discount_expression'] || '0',
                    note: line['note'] || '',
                };

                if (isValidId(line['warehouse_id'])) l['warehouse_id'] = Number(line['warehouse_id']);
                if (isValidId(line['location_id'])) l['location_id'] = Number(line['location_id']);
                if (isValidId(line['lot_id'])) l['lot_id'] = Number(line['lot_id']);
                if (isValidId(line['reservation_line_id'])) l['reservation_line_id'] = Number(line['reservation_line_id']);

                if (isUpdate && line.so_line_id && !isNaN(Number(line.so_line_id))) {
                    l.so_line_id = Number(line.so_line_id);
                }
                return l;
            });
        }

        return payload;
    },

    /** ดึงรายการใบจองที่สามารถนำมาสร้าง Sales Order ได้ */
    getAvailableRS: async (): Promise<ReservationHeader[]> => {
        try {
            const response = await api.get<unknown>('/sale-order/available-rs');
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
