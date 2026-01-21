/**
 * @file rfq-types.ts
 * @description Type definitions for Request for Quotation (RFQ) module
 * @tables rfq_header, rfq_line, rfq_vendor, quotation_header
 */

// ====================================================================================
// ENUMS
// ====================================================================================

/** RFQ Status - สถานะใบขอเสนอราคา */
export type RFQStatus = 'DRAFT' | 'SENT' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED';

/** RFQ Vendor Status - สถานะการส่ง RFQ ไปยังเจ้าหนี้ */
export type RFQVendorStatus = 'PENDING' | 'SENT' | 'RESPONDED' | 'NO_RESPONSE' | 'DECLINED';



// ====================================================================================
// RFQ HEADER - ตาราง rfq_header
// ====================================================================================

/** RFQ Header - ข้อมูลหัวใบขอเสนอราคา */
export interface RFQHeader {
    rfq_id: string;                     // UUID - Primary Key
    rfq_no: string;                     // VARCHAR(50) - เลขที่ RFQ เช่น RFQ-202601-0001
    pr_id: string | null;               // UUID - FK -> pr_header.pr_id (PR ที่ Approved แล้ว)
    branch_id: string | null;           // UUID - FK -> org_branch.branch_id
    rfq_date: string;                   // DATE - วันที่ออก RFQ
    quote_due_date: string | null;      // DATE - วันครบกำหนดส่งใบเสนอราคา
    terms_and_conditions?: string | null; // TEXT - เงื่อนไขและข้อกำหนด
    status: RFQStatus;                  // VARCHAR(50) - DRAFT, SENT, IN_PROGRESS, CLOSED, CANCELLED
    created_by_user_id?: string | null;  // UUID - FK -> users.user_id
    created_at: string;                 // TIMESTAMP
    updated_at: string;                 // TIMESTAMP
    
    // Extended fields for UI display (from JOINs)
    pr_no?: string | null;              // From joined pr_header
    branch_name?: string | null;        // From joined org_branch
    created_by_name?: string | null;    // From joined users
    vendor_count?: number;              // From COUNT(rfq_vendor)
    vendor_responded?: number;          // From COUNT where responded
    
    // Form-related fields
    currency?: string;                  // สกุลเงิน
    exchange_rate?: number;             // อัตราแลกเปลี่ยน
    delivery_location?: string;         // สถานที่จัดส่ง/ส่งมอบ
    payment_terms?: string;             // เงื่อนไขการชำระ
    incoterm?: string;                  // เงื่อนไขส่งมอบ (FOB, CIF, EXW, etc.)
    remarks?: string;                   // หมายเหตุเพิ่มเติม
}

// ====================================================================================
// RFQ LINE - ตาราง rfq_line
// ====================================================================================

/** RFQ Line Item - รายการสินค้าใน RFQ (Copy from PR Lines) */
export interface RFQLine {
    rfq_line_id: string;                // UUID - Primary Key
    rfq_id: string;                     // UUID - FK -> rfq_header.rfq_id
    line_no: number;                    // INTEGER - ลำดับรายการ
    pr_line_id: string | null;          // UUID - FK -> pr_line.pr_line_id (อ้างอิง PR Line)
    item_id: string | null;             // UUID - FK -> item.item_id
    item_code: string;                  // VARCHAR(50)
    item_name: string;                  // VARCHAR(500)
    item_description: string | null;    // TEXT
    required_qty: number;               // DECIMAL(18,4) - จำนวนที่ต้องการ
    uom: string;                        // VARCHAR(50) - หน่วยนับ
    required_date: string | null;       // DATE - วันที่ต้องการสินค้า
    technical_spec: string | null;      // TEXT - ข้อกำหนดทางเทคนิค
}

// ====================================================================================
// RFQ VENDOR - ตาราง rfq_vendor (Junction Table)
// ====================================================================================

/** RFQ Vendor - รายชื่อผู้ขายที่ส่ง RFQ ไป */
export interface RFQVendor {
    rfq_vendor_id: string;              // UUID - Primary Key
    rfq_id: string;                     // UUID - FK -> rfq_header.rfq_id
    vendor_id: string;                  // UUID - FK -> vendor.vendor_id
    sent_date: string | null;           // TIMESTAMP - วันเวลาที่ส่ง RFQ
    sent_via: string | null;            // VARCHAR(50) - EMAIL, PORTAL, MANUAL
    email_sent_to: string | null;       // VARCHAR(200) - อีเมลที่ส่งไป
    response_date: string | null;       // TIMESTAMP - วันเวลาที่ผู้ขายตอบกลับ
    status: RFQVendorStatus;            // VARCHAR(50) - PENDING, SENT, RESPONDED, NO_RESPONSE, DECLINED
    remark: string | null;              // TEXT
}



// ====================================================================================
// UI DISPLAY TYPES
// ====================================================================================

/** RFQ List Item - สำหรับแสดงในตาราง */
export interface RFQListItem {
    rfq_id: string;
    rfq_no: string;
    rfq_date: string;
    pr_no: string | null;               // From joined pr_header
    pr_id: string | null;
    created_by_name: string;            // ผู้สร้าง
    status: RFQStatus;
    quote_due_date: string | null;
    vendor_count?: number;              // จำนวนเจ้าหนี้ที่ส่ง
}

// ====================================================================================
// FORM DATA TYPES
// ====================================================================================

/** RFQ Form Data - สำหรับ form input */
export interface RFQFormData {
    // Header
    rfq_no: string;
    rfq_date: string;
    pr_id: string | null;
    pr_no: string | null;
    branch_id: string | null;
    created_by_name: string;
    status: RFQStatus;
    quote_due_date: string;
    currency: string;
    exchange_rate: number;
    delivery_location: string;
    payment_terms: string;
    incoterm: string;
    remarks: string;
    
    // Lines
    lines: RFQLineFormData[];
}

/** RFQ Line Form Data */
export interface RFQLineFormData {
    line_no: number;
    item_code: string;
    item_name: string;
    item_description: string;
    required_qty: number;
    uom: string;
    required_date: string;
    remarks: string;
}

// ====================================================================================
// INITIAL VALUES
// ====================================================================================

export const initialRFQLineFormData: RFQLineFormData = {
    line_no: 1,
    item_code: '',
    item_name: '',
    item_description: '',
    required_qty: 0,
    uom: '',
    required_date: '',
    remarks: '',
};

export const initialRFQFormData: RFQFormData = {
    rfq_no: '',
    rfq_date: new Date().toISOString().split('T')[0],
    pr_id: null,
    pr_no: null,
    branch_id: null,
    created_by_name: '',
    status: 'DRAFT',
    quote_due_date: '',
    currency: 'THB',
    exchange_rate: 1,
    delivery_location: '',
    payment_terms: '',
    incoterm: '',
    remarks: '',
    lines: [{ ...initialRFQLineFormData }],
};

// ====================================================================================
// FILTER TYPES
// ====================================================================================

/** RFQ Search/Filter Criteria */
export interface RFQFilterCriteria {
    rfq_no?: string;
    pr_no?: string;
    created_by_name?: string;
    status?: RFQStatus | 'ALL';
    date_from?: string;
    date_to?: string;
}

// ====================================================================================
// API RESPONSE TYPES
// ====================================================================================

/** RFQ List Response - สำหรับ API response */
export interface RFQListResponse {
    data: RFQHeader[];
    total: number;
    page: number;
    limit: number;
}

/** RFQ Create/Update Data - สำหรับ API request */
export interface RFQCreateData extends Omit<RFQFormData, 'lines'> {
    lines: RFQLineFormData[];
    vendor_ids?: string[];
    terms_and_conditions?: string;
}



