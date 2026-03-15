/**
 * @file rfq-types.ts
 * @description Type definitions for Request for Quotation (RFQ) module
 * @tables rfq_header, rfq_line, rfq_vendor, quotation_header
 */

// ====================================================================================
// ENUMS
// ====================================================================================

/** RFQ Status - สถานะใบขอเสนอราคา */
export const RFQ_STATUS_OPTIONS = ['DRAFT', 'SENT', 'CLOSED', 'CANCELLED'] as const;
export type RFQStatus = typeof RFQ_STATUS_OPTIONS[number];

/** RFQ Vendor Status - สถานะการส่ง RFQ ไปยังเจ้าหนี้ */
export const RFQ_VENDOR_STATUS_OPTIONS = ['PENDING', 'SENT', 'RESPONDED', 'NO_RESPONSE', 'DECLINED', 'RECORDED'] as const;
export type RFQVendorStatus = typeof RFQ_VENDOR_STATUS_OPTIONS[number];



// ====================================================================================
// RFQ HEADER - ตาราง rfq_header
// ====================================================================================

/** RFQ Header - ข้อมูลหัวใบขอเสนอราคา */
export interface RFQHeader {
    rfq_id: number;                     // INTEGER
    rfq_no: string;                     // VARCHAR(50) - เลขที่ RFQ เช่น RFQ-202601-0001
    pr_id: number | null;               // INTEGER
    branch_id: number | null;           // INTEGER
    rfq_date: string;                   // DATE - วันที่ออก RFQ
    quotation_due_date: string | null;  // DATE - วันครบกำหนดส่งใบเสนอราคา (จาก Golden Payload)
    terms_and_conditions?: string | null; // TEXT - เงื่อนไขและข้อกำหนด
    status: RFQStatus;                  // VARCHAR(50) - DRAFT, SENT, IN_PROGRESS, CLOSED, CANCELLED
    created_by_user_id?: number | null;  // INTEGER
    created_at: string;                 // TIMESTAMP
    updated_at: string;                 // TIMESTAMP
    
    // Extended fields for UI display (from JOINs)
    pr_no?: string | null;              // เลขที่ PR (UI อาจใช้ ref_pr_no เพื่อความชัดเจนใน Filter)
    ref_pr_no?: string | null;          // Alias สำหรับ pr_no
    branch_name?: string | null;        // From joined org_branch
    created_by_name?: string | null;    // ชื่อผู้สร้าง
    creator_name?: string | null;       // Alias สำหรับ created_by_name
    vendor_name?: string | null;        // ชื่อผู้ขาย ( joined or representative)
    vendor_count?: number;              // From COUNT(rfq_vendor)
    vendor_responded?: number;          // From COUNT where responded
    
    // UI Counters from Backend
    vendor_total?: number;              // Y: Total vendors in this RFQ
    vendor_sent?: number;               // X: Vendors already sent
    
    // New Required Fields
    purpose: string;                    // REQUIRED: เรื่อง/วัตถุประสงค์
    responded_vendors_count: number;    // REQUIRED: จำนวนผู้ขายที่เสนอราคามาแล้ว
    sent_vendors_count: number;         // REQUIRED: จำนวนผู้ขายที่ส่ง RFQ ออกไปแล้ว
    has_quotation?: boolean;            // มีการสร้างใบเสนอราคา (VQ) ในระบบแล้วหรือไม่
    
    // Relation Fields (from Prisma include)
    pr?: {
        pr_id: number;
        pr_no: string;
    } | null;

    _count?: {
        rfqVendors?: number;
    } | null;
    
    // Relation Fields 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rfqVendors?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vendors?: any[];

    requested_by_user?: {
        employee_id: number;
        employee_firstname_th: string;
        employee_lastname_th: string;
    } | null;

    // Form-related fields
    rfq_base_currency_code?: string;      // สกุลเงินฐาน (THB)
    rfq_quote_currency_code?: string;     // สกุลเงินที่ขอราคา (USD, etc.)
    rfq_exchange_rate?: number;           // อัตราแลกเปลี่ยน
    rfq_exchange_rate_date?: string;      // วันที่อัตราแลกเปลี่ยน
    receive_location?: string;           // สถานที่รับของ
    payment_term_hint?: string;          // เงื่อนไขการชำระ (hint)
    incoterm?: string;                  // เงื่อนไขส่งมอบ (FOB, CIF, EXW, etc.)
    remarks?: string;                   // หมายเหตุเพิ่มเติม
}

// ====================================================================================
// RFQ LINE - ตาราง rfq_line
// ====================================================================================

/** RFQ Line Item - รายการสินค้าใน RFQ (Copy from PR Lines) */
export interface RFQLine {
    rfq_line_id: number;                // INTEGER
    rfq_id: number;                     // INTEGER
    line_no: number;                    // INTEGER - ลำดับรายการ
    pr_line_id: number | null;          // INTEGER
    item_id: number | null;             // INTEGER
    item_code: string;                  // VARCHAR(50)
    item_name: string;                  // VARCHAR(500)
    description: string | null;         // TEXT (จาก Golden Payload)
    qty: number;                        // DECIMAL(18,4) - จำนวนที่ต้องการ (จาก Golden Payload)
    uom: string;                        // VARCHAR(50) - หน่วยนับ
    uom_id: number | null;              // INTEGER
    target_delivery_date: string | null; // DATE - วันที่ต้องการสินค้า (จาก Golden Payload)
    technical_spec: string | null;      // TEXT - ข้อกำหนดทางเทคนิค
    est_unit_price?: number;            // Added for VQ reference
    note_to_vendor: string | null;      // TEXT - หมายเหตุ (จาก Golden Payload)
    discount_raw?: string;              // Legacy/Utility field for mapping
    status?: string | null;             // Utility field for mapping
    
    // 💧 @Agent_UI_Hydrator: Fallback fields for strict type-safe hydration
    itemCode?: string;                  
    itemName?: string;
    product_code?: string;
    product_name?: string;
    item?: {
        item_code?: string;
        item_name?: string;
    };
    product?: {
        product_code?: string;
        product_name?: string;
    };
}

// ====================================================================================
// RFQ VENDOR - ตาราง rfq_vendor (Junction Table)
// ====================================================================================

/** RFQ Vendor - รายชื่อผู้ขายที่ส่ง RFQ ไป */
export interface RFQVendor {
    rfq_vendor_id: number;              // INTEGER
    rfq_id: number;                     // INTEGER
    vendor_id: number;                  // INTEGER
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
    rfq_id: number;
    rfq_no: string;
    rfq_date: string;
    ref_pr_no: string | null;               // จาก pr_no เดิม
    pr_id: number | null;
    creator_name: string;            // จาก created_by_name เดิม
    status: RFQStatus;
    quotation_due_date: string | null;
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
    pr_id: number | null;
    pr_no: string | null;
    branch_id: number | null;
    project_id?: number | null; // โครงการ (Optional)
    requested_by_user_id: number;
    requested_by: string;
    status: RFQStatus;
    quotation_due_date: string;
    rfq_base_currency_code: string;
    rfq_quote_currency_code: string;
    rfq_exchange_rate_date?: string;
    rfq_exchange_rate: number;
    receive_location: string;
    payment_term_hint: string;
    incoterm: string;
    remarks: string;
    isMulticurrency: boolean;
    
    // V-07: Fields carried over from PR
    purpose?: string;              // วัตถุประสงค์ (จาก PR)
    cost_center_id?: number;       // ศูนย์ต้นทุน (จาก PR)
    pr_tax_code_id?: number;       // รหัสภาษี (จาก PR)
    pr_tax_rate?: number;          // อัตราภาษี (จาก PR)
    
    // Lines
    rfqLines: RFQLineFormData[];
    
    // Vendors
    vendors: RFQVendorFormData[];
}

/** RFQ Vendor Form Data */
export interface RFQVendorFormData {
    vendor_id?: number;
    vendor_code: string;
    vendor_name: string;
    vendor_name_display: string;
    is_existing?: boolean;
}

/** RFQ Line Form Data */
export interface RFQLineFormData {
    line_no: number;
    item_code: string;
    item_name: string;
    description: string;
    qty: number;
    uom: string;
    uom_id: number;
    required_receipt_type: string;
    target_delivery_date: string;
    note_to_vendor: string;
    item_id?: number;              // FK → item (for traceability)
    pr_line_id?: number;           // FK → pr_line (for traceability)
    est_unit_price?: number;       // ราคาต่อหน่วยโดยประมาณ from PR
    est_amount?: number;           // มูลค่ารวมโดยประมาณ from PR
}

// ====================================================================================
// INITIAL VALUES
// ====================================================================================

export const initialRFQLineFormData: RFQLineFormData = {
    line_no: 1,
    item_code: '',
    item_name: '',
    description: '',
    qty: 0,
    uom: '',
    uom_id: 0,
    required_receipt_type: 'FULL',
    target_delivery_date: '',
    note_to_vendor: '',
    est_unit_price: 0,
    est_amount: 0,
};

export const initialRFQFormData: RFQFormData = {
    rfq_no: '',
    rfq_date: new Date().toISOString().split('T')[0],
    pr_id: null,
    pr_no: null,
    branch_id: null,
    requested_by_user_id: 2,
    requested_by: '',
    status: 'DRAFT',
    quotation_due_date: '',
    rfq_base_currency_code: 'THB',
    rfq_quote_currency_code: 'THB',
    rfq_exchange_rate: 1,
    receive_location: '',
    payment_term_hint: '',
    incoterm: '',
    remarks: '',
    isMulticurrency: false,
    purpose: '', // Initial value
    rfqLines: [{ ...initialRFQLineFormData }],
    vendors: [{ vendor_code: '', vendor_name: '', vendor_name_display: '' }]
};

// ====================================================================================
// FILTER TYPES
// ====================================================================================

/** RFQ Search/Filter Criteria */
export interface RFQFilterCriteria {
    rfq_no?: string;
    ref_pr_no?: string;
    pr_id?: number;
    creator_name?: string;
    search?: string;
    keyword?: string;
    status?: RFQStatus | 'ALL';
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
    sort?: string;
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
  totalPages: number;
}

/** RFQ Create/Update Data - สำหรับ API request */
export interface RFQCreateData extends Omit<RFQFormData, 'rfqLines'> {
    rfqLines: RFQLineFormData[];
    vendor_ids?: number[];
    terms_and_conditions?: string;
}

/** RFQ Detail Response - สำหรับ API GET /rfq/{id} */
export interface RFQDetailResponse extends RFQHeader {
    vendors?: (RFQVendor & { 
        vendor_name: string; 
        vendor_code: string; 
        vq_no?: string; 
    })[];
    rfqVendors?: (RFQVendor & { 
        vendor_name: string; 
        vendor_code: string; 
        vq_no?: string; 
    })[];
    lines?: RFQLine[];
    rfqLines?: RFQLine[];
}

// ====================================================================================
// PAYLOAD TYPES
// ====================================================================================

/** Payload for PATCH /rfq/:id/send-to-vendor - Strict Alignment Object */
export interface SendRFQToVendorPayload {
    to: string[];
    cc: string[];
}
