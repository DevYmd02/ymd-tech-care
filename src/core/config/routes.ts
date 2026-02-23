/**
 * @file routes.ts
 * @description Centralized route configuration สำหรับทั้งโปรเจ็ค
 * @purpose Single source of truth สำหรับ route paths ที่ใช้ใน App.tsx
 * @refactored UI assets moved to navigation.config.ts for performance
 */

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

export interface PlaceholderRoute {
    path: string;
    title: string;
}

// ====================================================================================
// IMPLEMENTED ROUTES - Routes ที่พัฒนาแล้ว
// ====================================================================================

export const implementedRoutes = {
    admin: '/admin',
    procurement: {
        dashboard: '/procurement/dashboard',
        pr: '/procurement/pr',
        rfq: '/procurement/rfq',
    },
    roles: {
        dashboard: '/roles/dashboard',
    },
    itGovernance: {
        dashboard: '/it-governance/dashboard',
    },
    auth: {
        login: '/auth/login',
        register: '/auth/register',
        forgotPassword: '/auth/forgot-password',
    },
};

/**
 * Global Route Constants
 * Use these instead of hardcoded strings to prevent broken links
 */
export const ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  ADMIN: {
    DASHBOARD: '/admin',
    EMPLOYEES: '/admin/employees',
    ROLES: '/admin/roles',
  },
  PROCUREMENT: {
    DASHBOARD: '/procurement/dashboard',
    PR: '/procurement/pr',
    RFQ: '/procurement/rfq',
    QT: '/procurement/qt',
    QC: '/procurement/qc',
    PO: '/procurement/po',
    GRN: '/procurement/grn',
    PRT: '/procurement/prt',
  },
  MASTER_DATA: {
    DASHBOARD: '/master-data',
    VENDOR: '/master-data/vendor',
    BRANCH: '/master-data/branch',
    SECTION: '/master-data/section',
  }
} as const;

// ====================================================================================
// PLACEHOLDER ROUTES - Routes ที่ยังไม่พัฒนา (Coming Soon)
// ====================================================================================

export const placeholderRoutes: Record<string, PlaceholderRoute[]> = {
    procurement: [
        { path: 'procurement/vendor-comparison', title: 'เปรียบเทียบราคา' },
        { path: 'procurement/po', title: 'ใบสั่งซื้อ (PO)' },
        { path: 'procurement/grn', title: 'ใบรับสินค้า (GRN)' },
        { path: 'procurement/return', title: 'คืนสินค้า (Purchase Return)' },
        { path: 'procurement/invoice', title: 'ใบแจ้งหนี้ผู้ขาย (Vendor Invoice)' },
    ],
    inventory: [
        { path: 'inventory/dashboard', title: 'Inventory Dashboard' },
        { path: 'inventory/item-master', title: 'Item Master' },
        { path: 'inventory/stock-level', title: 'Stock Level' },
        { path: 'inventory/inbound', title: 'Inbound' },
        { path: 'inventory/outbound', title: 'Outbound' },
        { path: 'inventory/transfer', title: 'Transfer' },
        { path: 'inventory/cycle-count', title: 'Cycle Count' },
        { path: 'inventory/lot-serial', title: 'Lot/Serial/Expiry' },
        { path: 'inventory/costing', title: 'Costing' },
        { path: 'inventory/reports', title: 'Inventory Reports' },
    ],
    roles: [
        { path: 'roles/users', title: 'User Management' },
        { path: 'roles/management', title: 'Role Management' },
        { path: 'roles/permissions', title: 'Permissions' },
        { path: 'roles/groups', title: 'User Groups' },
        { path: 'roles/login-history', title: 'Login History' },
    ],
    itGovernance: [
        { path: 'it-governance/access-control', title: 'Access Control Review' },
        { path: 'it-governance/sod', title: 'Segregation of Duties' },
        { path: 'it-governance/change-management', title: 'Change Management' },
        { path: 'it-governance/system-config', title: 'System Configuration' },
        { path: 'it-governance/audit-log', title: 'Audit Log' },
        { path: 'it-governance/backup', title: 'Data Backup & Recovery' },
    ],
    audit: [
        { path: 'audit/dashboard', title: 'Audit Dashboard' },
        { path: 'audit/period-close', title: 'Period Close' },
        { path: 'audit/year-end', title: 'Year-End Close' },
        { path: 'audit/trial-balance', title: 'Trial Balance' },
        { path: 'audit/financial-statements', title: 'Financial Statements' },
        { path: 'audit/reconciliation', title: 'Reconciliation' },
        { path: 'audit/trail', title: 'Audit Trail' },
        { path: 'audit/reports', title: 'Audit Reports' },
    ],
    sales: [
        { path: 'sales/dashboard', title: 'Sales Dashboard' },
        { path: 'sales/quotation', title: 'Quotation' },
        { path: 'sales/inquiry', title: 'Inquiry' },
        { path: 'sales/estimate', title: 'Estimate' },
        { path: 'sales/order', title: 'Sales Order' },
        { path: 'sales/delivery', title: 'Delivery / DO' },
        { path: 'sales/invoice', title: 'Sales Invoice' },
        { path: 'sales/return', title: 'Sales Return' },
        { path: 'sales/pricing', title: 'Pricing & Promotion' },
        { path: 'sales/customer', title: 'Customer Master' },
        { path: 'sales/approval', title: 'Sales Approval' },
        { path: 'sales/reports', title: 'Sales Reports' },
    ],
    mrp: [
        { path: 'mrp/dashboard', title: 'MRP Dashboard' },
        { path: 'mrp/bom', title: 'Bill of Materials (BOM)' },
        { path: 'mrp/routing', title: 'Routing' },
        { path: 'mrp/work-order', title: 'Work Order' },
        { path: 'mrp/production-plan', title: 'Production Plan' },
        { path: 'mrp/capacity', title: 'Capacity Planning' },
        { path: 'mrp/reports', title: 'MRP Reports' },
    ],
    ap: [
        { path: 'ap/dashboard', title: 'AP Dashboard' },
        { path: 'ap/invoice', title: 'Supplier Invoice' },
        { path: 'ap/payment', title: 'Payment' },
        { path: 'ap/aging', title: 'AP Aging' },
        { path: 'ap/advance', title: 'Advance Payment' },
        { path: 'ap/debit-note', title: 'Debit Note' },
        { path: 'ap/reports', title: 'AP Reports' },
    ],
    ar: [
        { path: 'ar/dashboard', title: 'AR Dashboard' },
        { path: 'ar/invoice', title: 'Customer Invoice' },
        { path: 'ar/receipt', title: 'Receipt' },
        { path: 'ar/aging', title: 'AR Aging' },
        { path: 'ar/advance', title: 'Advance Receipt' },
        { path: 'ar/credit-note', title: 'Credit Note' },
        { path: 'ar/reports', title: 'AR Reports' },
    ],
    gl: [
        { path: 'gl/dashboard', title: 'GL Dashboard' },
        { path: 'gl/chart-of-accounts', title: 'Chart of Accounts' },
        { path: 'gl/journal-entry', title: 'Journal Entry' },
        { path: 'gl/journal-voucher', title: 'Journal Voucher' },
        { path: 'gl/posting', title: 'GL Posting' },
        { path: 'gl/inquiry', title: 'GL Inquiry' },
        { path: 'gl/reports', title: 'GL Reports' },
    ],
    cash: [
        { path: 'cash/dashboard', title: 'Cash & Bank Dashboard' },
        { path: 'cash/petty-cash', title: 'Petty Cash' },
        { path: 'cash/bank-account', title: 'Bank Account' },
        { path: 'cash/bank-transfer', title: 'Bank Transfer' },
        { path: 'cash/bank-reconcile', title: 'Bank Reconciliation' },
        { path: 'cash/cheque', title: 'Cheque Management' },
        { path: 'cash/reports', title: 'Cash & Bank Reports' },
    ],
    budget: [
        { path: 'budget/dashboard', title: 'Budget Dashboard' },
        { path: 'budget/setup', title: 'Budget Setup' },
        { path: 'budget/allocation', title: 'Budget Allocation' },
        { path: 'budget/control', title: 'Budget Control' },
        { path: 'budget/transfer', title: 'Budget Transfer' },
        { path: 'budget/vs-actual', title: 'Budget vs Actual' },
        { path: 'budget/reports', title: 'Budget Reports' },
    ],
    fa: [
        { path: 'fa/dashboard', title: 'FA Dashboard' },
        { path: 'fa/register', title: 'Asset Register' },
        { path: 'fa/acquisition', title: 'Asset Acquisition' },
        { path: 'fa/depreciation', title: 'Depreciation' },
        { path: 'fa/transfer', title: 'Asset Transfer' },
        { path: 'fa/disposal', title: 'Asset Disposal' },
        { path: 'fa/revaluation', title: 'Asset Revaluation' },
        { path: 'fa/reports', title: 'FA Reports' },
    ],
    tax: [
        { path: 'tax/dashboard', title: 'Tax Dashboard' },
        { path: 'tax/vat', title: 'VAT' },
        { path: 'tax/withholding', title: 'Withholding Tax' },
        { path: 'tax/input', title: 'Input Tax' },
        { path: 'tax/output', title: 'Output Tax' },
        { path: 'tax/filing', title: 'Tax Filing' },
        { path: 'tax/reports', title: 'Tax Reports' },
    ],
};
