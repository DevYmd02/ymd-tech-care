/**
 * @file delivery.types.ts
 * @description Type definitions for Delivery module
 * @tables delivery_header (D11), delivery_line (D12)
 */

// ============================================================
// delivery_line (D12)
// ============================================================
export interface DeliveryLineData {
    delivery_line_id?: string | number;          // PK (uuid)
    delivery_id?: string | number;               // FK→delivery_header
    so_line_id?: string | number;                // FK→sale_order_line.so_line_id
    item_id: string;                             // FK→item_master
    item_code?: string;                          // display only
    item_name?: string;                          // display only
    qty_shipped: number;                         // numeric(18,3) จำนวนที่ส่ง
    uom_id: string;                              // FK→uom
    uom_name?: string;                           // display only
    warehouse_id: string;                        // FK→warehouse
    location_id?: string;                        // FK→location (nullable)
    lot_id?: string;                             // FK→item_lot (nullable)
    lot_no?: string;                             // display/input helper
    serial_no?: string;                          // Serial number (nullable)
    remarks?: string;                            // หมายเหตุ (nullable)
}

// ============================================================
// delivery_header (D11)
// ============================================================
export interface DeliveryFormData {
    delivery_id?: string | number;               // PK (uuid)
    delivery_no?: string;                        // UNIQUE varchar(30) เลขที่ใบจัดส่ง
    delivery_date: string;                       // date วันที่จัดส่ง
    so_id: string;                               // FK→sale_order_header อ้างอิง SO
    so_no?: string;                              // display only
    customer_id: string;                         // FK→customer
    customer_name?: string;                      // display only
    branch_id: string;                           // FK→org_branch สาขา
    warehouse_id?: string;                       // FK→warehouse คลังต้นทาง (nullable)
    ship_to_address?: string;                    // ที่อยู่จัดส่ง (nullable)
    ship_method?: string;                        // วิธีจัดส่ง varchar(50) (nullable)
    carrier?: string;                            // บริษัทขนส่ง varchar(50) (nullable)
    tracking_no?: string;                        // หมายเลข Tracking varchar(50) (nullable)
    status: 'DRAFT' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    ship_by_emp?: string;                        // FK→employee พนักงานจัดส่ง (nullable)
    ship_by_emp_name?: string;                   // display only
    remarks?: string;                            // หมายเหตุ (nullable)
    docu_date: string;                           // วันที่เอกสาร
    updated_at?: string;                         // วันที่แก้ไข
    lines: DeliveryLineData[];
}
