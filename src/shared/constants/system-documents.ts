/**
 * System Document Codes used across the ERP system to identify document types.
 * These codes correspond to the system_document_code in the database.
 * Centralizing them here prevents magic strings and improves maintainability.
 */
export const SYSTEM_DOCUMENT_CODES = {
    // Sales Documents
    SALES_RESERVATION: 'RSV',
    SALES_ORDER: 'SO',
    SALES_QUOTATION: 'QT',
    APPROVED_QUOTATION: 'QTA',
    ESTIMATE: 'EST',
    INQUIRY: 'INQ',

    // Inventory Documents
    INVENTORY_ISSUE_REQ: 'ISSUE_REQ',         // ใบขอเบิก
    INVENTORY_APPV_ISSUE: 'APPV_ISSUE',       // ใบอนุมัติเบิก
    INVENTORY_ISSUE: 'ISSUE',                 // ใบเบิก
    INVENTORY_TRANSFER_REQ: 'TR',             // ใบขอโอนย้ายสินค้า
    INVENTORY_TRANSFER: 'TRANSFER',           // ใบโอนสินค้า (legacy)
    INVENTORY_TRANSFER_OUT: 'TO',             // ใบโอนย้ายสินค้าออก
    INVENTORY_TRANSFER_IN: 'TI',              // ใบโอนย้ายสินค้าเข้า
    INVENTORY_TRANSFER_APPV: 'TRANSFER_APPV', // ใบอนุมัติโอนสินค้า
    INVENTORY_RETURN_ISSUE: 'RETURN_ISSUE',   // ใบคืนสินค้า
} as const;

export type SystemDocumentCode = typeof SYSTEM_DOCUMENT_CODES[keyof typeof SYSTEM_DOCUMENT_CODES];
