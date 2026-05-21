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
    
    // Add other modules as needed here (e.g. PO, PR, etc.)
} as const;

export type SystemDocumentCode = typeof SYSTEM_DOCUMENT_CODES[keyof typeof SYSTEM_DOCUMENT_CODES];
