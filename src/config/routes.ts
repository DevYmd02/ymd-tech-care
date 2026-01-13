/**
 * @file routes.ts
 * @description Centralized route configuration สำหรับทั้งโปรเจ็ค
 * @purpose Single source of truth สำหรับ route paths ที่ใช้ใน App.tsx และ Sidebar.tsx
 */

import {
    Home,
    Users,
    ShieldCheck,
    Calculator,
    ShoppingCart,
    ShoppingBag,
    Package,
    Factory,
    Wallet,
    BookOpen,
    Receipt,
    FileText,
    Landmark,
    PieChart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

export interface SubMenuItem {
    id: string;
    label: string;
    path: string;
}

export interface MenuItem {
    id: string;
    label: string;
    icon: LucideIcon;
    path?: string;
    subItems?: SubMenuItem[];
}

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
    },
    roles: {
        dashboard: '/roles/dashboard',
    },
    itGovernance: {
        dashboard: '/it-governance/dashboard',
    },
    auth: {
        login: '/login',
        register: '/register',
        forgotPassword: '/forgot-password',
    },
};

// ====================================================================================
// PLACEHOLDER ROUTES - Routes ที่ยังไม่พัฒนา (Coming Soon)
// ====================================================================================

export const placeholderRoutes: Record<string, PlaceholderRoute[]> = {
    procurement: [
        { path: 'procurement/vendor-comparison', title: 'Vendor Comparison' },
        { path: 'procurement/po', title: 'Purchase Order' },
        { path: 'procurement/grn', title: 'Goods Receipt Note' },
        { path: 'procurement/return', title: 'Return to Supplier' },
        { path: 'procurement/invoice', title: 'Supplier Invoice' },
        { path: 'procurement/vendor-master', title: 'Vendor Master' },
        { path: 'procurement/approval', title: 'Procurement Approval' },
        { path: 'procurement/reports', title: 'Procurement Reports' },
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

// ====================================================================================
// SIDEBAR MENU ITEMS - Menu configuration สำหรับ Sidebar
// ====================================================================================

export const sidebarMenuItems: MenuItem[] = [
    {
        id: 'admin',
        label: 'Admin Dashboard',
        icon: Home,
        path: '/admin'
    },
    {
        id: 'roles',
        label: 'บทบาทและสิทธิ์ (Roles)',
        icon: Users,
        subItems: [
            { id: 'roles-dashboard', label: 'Roles Dashboard', path: '/roles/dashboard' },
            { id: 'user-management', label: 'จัดการผู้ใช้ (User Management)', path: '/roles/users' },
            { id: 'role-management', label: 'จัดการบทบาท (Role Management)', path: '/roles/management' },
            { id: 'permissions', label: 'สิทธิ์การเข้าถึง (Permissions)', path: '/roles/permissions' },
            { id: 'user-groups', label: 'กลุ่มผู้ใช้ (User Groups)', path: '/roles/groups' },
            { id: 'login-history', label: 'ประวัติการเข้าสู่ระบบ', path: '/roles/login-history' },
        ]
    },
    {
        id: 'it-governance',
        label: 'IT Governance & Controls',
        icon: ShieldCheck,
        subItems: [
            { id: 'itgc-dashboard', label: 'ITGC Dashboard', path: '/it-governance/dashboard' },
            { id: 'access-control', label: 'Access Control Review', path: '/it-governance/access-control' },
            { id: 'sod', label: 'Segregation of Duties (SoD)', path: '/it-governance/sod' },
            { id: 'change-management', label: 'Change Management', path: '/it-governance/change-management' },
            { id: 'system-config', label: 'System Configuration', path: '/it-governance/system-config' },
            { id: 'audit-log', label: 'Audit Log / Activity Log', path: '/it-governance/audit-log' },
            { id: 'data-backup', label: 'Data Backup & Recovery', path: '/it-governance/backup' },
        ]
    },
    {
        id: 'audit',
        label: 'Audit & Financial Close',
        icon: Calculator,
        subItems: [
            { id: 'audit-dashboard', label: 'Audit Dashboard', path: '/audit/dashboard' },
            { id: 'period-close', label: 'ปิดงวดบัญชี (Period Close)', path: '/audit/period-close' },
            { id: 'year-end', label: 'ปิดบัญชีสิ้นปี (Year-End Close)', path: '/audit/year-end' },
            { id: 'trial-balance', label: 'งบทดลอง (Trial Balance)', path: '/audit/trial-balance' },
            { id: 'financial-statements', label: 'งบการเงิน (Financial Statements)', path: '/audit/financial-statements' },
            { id: 'reconciliation', label: 'กระทบยอด (Reconciliation)', path: '/audit/reconciliation' },
            { id: 'audit-trail', label: 'Audit Trail', path: '/audit/trail' },
            { id: 'audit-reports', label: 'รายงานตรวจสอบ', path: '/audit/reports' },
        ]
    },
    {
        id: 'sales',
        label: 'ระบบขาย (Sales)',
        icon: ShoppingCart,
        subItems: [
            { id: 'sales-dashboard', label: 'Sales Dashboard', path: '/sales/dashboard' },
            { id: 'quotation', label: 'ใบเสนอราคา (Quotation)', path: '/sales/quotation' },
            { id: 'sales-order', label: 'คำสั่งขาย (Sales Order)', path: '/sales/order' },
            { id: 'delivery', label: 'จัดส่งสินค้า (Delivery / DO)', path: '/sales/delivery' },
            { id: 'sales-invoice', label: 'วางบิล/ใบแจ้งหนี้ (Invoice)', path: '/sales/invoice' },
            { id: 'sales-return', label: 'รับคืนสินค้า/ลดหนี้ (Sales Return)', path: '/sales/return' },
            { id: 'pricing', label: 'เงื่อนไขราคา/โปรโมชัน', path: '/sales/pricing' },
            { id: 'customer', label: 'ลูกค้า (Customer Master)', path: '/sales/customer' },
            { id: 'sales-approval', label: 'อนุมัติฝ่ายขาย', path: '/sales/approval' },
            { id: 'sales-reports', label: 'รายงานขาย (Sales Reports)', path: '/sales/reports' },
        ]
    },
    {
        id: 'procurement',
        label: 'ระบบจัดซื้อ (Procurement)',
        icon: ShoppingBag,
        subItems: [
            { id: 'proc-dashboard', label: 'Procurement Dashboard', path: '/procurement/dashboard' },
            { id: 'pr', label: 'ใบขอซื้อ (PR)', path: '/procurement/pr' },
            { id: 'vendor-compare', label: 'เปรียบเทียบราคา/คัดเลือกผู้ขาย', path: '/procurement/vendor-comparison' },
            { id: 'po', label: 'ใบสั่งซื้อ (PO)', path: '/procurement/po' },
            { id: 'grn', label: 'รับสินค้า/รับบริการ (GRN)', path: '/procurement/grn' },
            { id: 'return', label: 'คืนสินค้าให้ผู้ขาย', path: '/procurement/return' },
            { id: 'invoice', label: 'ใบแจ้งหนี้ผู้ขาย', path: '/procurement/invoice' },
            { id: 'vendor', label: 'ผู้ขาย (Vendor Master)', path: '/procurement/vendor-master' },
            { id: 'approval', label: 'อนุมัติจัดซื้อ', path: '/procurement/approval' },
            { id: 'reports', label: 'รายงานจัดซื้อ', path: '/procurement/reports' },
        ]
    },
    {
        id: 'inventory',
        label: 'ระบบคลังสินค้า (Inventory)',
        icon: Package,
        subItems: [
            { id: 'inv-dashboard', label: 'Warehouse Dashboard', path: '/inventory/dashboard' },
            { id: 'item-master', label: 'สินค้า/รหัสสินค้า (Item Master)', path: '/inventory/item-master' },
            { id: 'stock-level', label: 'ผังคลัง/ทำเลจัดเก็บ', path: '/inventory/stock-level' },
            { id: 'inbound', label: 'รับเข้า (Inbound)', path: '/inventory/inbound' },
            { id: 'outbound', label: 'จ่ายออก (Outbound)', path: '/inventory/outbound' },
            { id: 'transfer', label: 'โอนย้าย/ปรับปรุง (Transfer)', path: '/inventory/transfer' },
            { id: 'cycle-count', label: 'นับสต็อก (Cycle Count)', path: '/inventory/cycle-count' },
            { id: 'lot-serial', label: 'Lot/Serial/Expiry', path: '/inventory/lot-serial' },
            { id: 'costing', label: 'ต้นทุนสินค้า (Costing)', path: '/inventory/costing' },
            { id: 'inv-reports', label: 'รายงานคลัง', path: '/inventory/reports' },
        ]
    },
    {
        id: 'mrp',
        label: 'ระบบวางแผนผลิต (MRP)',
        icon: Factory,
        subItems: [
            { id: 'mrp-dashboard', label: 'MRP Dashboard', path: '/mrp/dashboard' },
            { id: 'bom', label: 'โครงสร้างสินค้า (BOM)', path: '/mrp/bom' },
            { id: 'routing', label: 'ขั้นตอนการผลิต (Routing)', path: '/mrp/routing' },
            { id: 'work-order', label: 'ใบสั่งผลิต (Work Order)', path: '/mrp/work-order' },
            { id: 'production-plan', label: 'แผนการผลิต', path: '/mrp/production-plan' },
            { id: 'capacity', label: 'กำลังการผลิต (Capacity)', path: '/mrp/capacity' },
            { id: 'mrp-reports', label: 'รายงานการผลิต', path: '/mrp/reports' },
        ]
    },
    {
        id: 'ap',
        label: 'บัญชีเจ้าหนี้ (AP)',
        icon: Receipt,
        subItems: [
            { id: 'ap-dashboard', label: 'AP Dashboard', path: '/ap/dashboard' },
            { id: 'ap-invoice', label: 'ใบแจ้งหนี้ผู้ขาย', path: '/ap/invoice' },
            { id: 'ap-payment', label: 'การจ่ายชำระ (Payment)', path: '/ap/payment' },
            { id: 'ap-aging', label: 'อายุหนี้เจ้าหนี้ (AP Aging)', path: '/ap/aging' },
            { id: 'ap-advance', label: 'เงินจ่ายล่วงหน้า', path: '/ap/advance' },
            { id: 'ap-debit-note', label: 'ใบลดหนี้ (Debit Note)', path: '/ap/debit-note' },
            { id: 'ap-reports', label: 'รายงานเจ้าหนี้', path: '/ap/reports' },
        ]
    },
    {
        id: 'ar',
        label: 'บัญชีลูกหนี้ (AR)',
        icon: FileText,
        subItems: [
            { id: 'ar-dashboard', label: 'AR Dashboard', path: '/ar/dashboard' },
            { id: 'ar-invoice', label: 'ใบแจ้งหนี้ลูกค้า', path: '/ar/invoice' },
            { id: 'ar-receipt', label: 'รับชำระเงิน (Receipt)', path: '/ar/receipt' },
            { id: 'ar-aging', label: 'อายุหนี้ลูกหนี้ (AR Aging)', path: '/ar/aging' },
            { id: 'ar-advance', label: 'เงินรับล่วงหน้า', path: '/ar/advance' },
            { id: 'ar-credit-note', label: 'ใบลดหนี้ (Credit Note)', path: '/ar/credit-note' },
            { id: 'ar-reports', label: 'รายงานลูกหนี้', path: '/ar/reports' },
        ]
    },
    {
        id: 'gl',
        label: 'สมุดบัญชี (General Ledger)',
        icon: BookOpen,
        subItems: [
            { id: 'gl-dashboard', label: 'GL Dashboard', path: '/gl/dashboard' },
            { id: 'chart-of-accounts', label: 'ผังบัญชี (Chart of Accounts)', path: '/gl/chart-of-accounts' },
            { id: 'journal-entry', label: 'บันทึกรายการ (Journal Entry)', path: '/gl/journal-entry' },
            { id: 'journal-voucher', label: 'ใบสำคัญทั่วไป (JV)', path: '/gl/journal-voucher' },
            { id: 'gl-posting', label: 'ผ่านรายการ (Posting)', path: '/gl/posting' },
            { id: 'gl-inquiry', label: 'สอบถามบัญชี (GL Inquiry)', path: '/gl/inquiry' },
            { id: 'gl-reports', label: 'รายงานบัญชีแยกประเภท', path: '/gl/reports' },
        ]
    },
    {
        id: 'petty-cash',
        label: 'เงินสดและธนาคาร (Cash & Bank)',
        icon: Wallet,
        subItems: [
            { id: 'cash-dashboard', label: 'Cash & Bank Dashboard', path: '/cash/dashboard' },
            { id: 'petty-cash-mgmt', label: 'เงินสดย่อย (Petty Cash)', path: '/cash/petty-cash' },
            { id: 'bank-account', label: 'บัญชีธนาคาร (Bank Account)', path: '/cash/bank-account' },
            { id: 'bank-transfer', label: 'โอนเงินระหว่างบัญชี', path: '/cash/bank-transfer' },
            { id: 'bank-reconcile', label: 'กระทบยอดธนาคาร', path: '/cash/bank-reconcile' },
            { id: 'cheque-mgmt', label: 'จัดการเช็ค (Cheque)', path: '/cash/cheque' },
            { id: 'cash-reports', label: 'รายงานเงินสด/ธนาคาร', path: '/cash/reports' },
        ]
    },
    {
        id: 'budget',
        label: 'จัดการค่าใช้จ่าย (Budget)',
        icon: PieChart,
        subItems: [
            { id: 'budget-dashboard', label: 'Budget Dashboard', path: '/budget/dashboard' },
            { id: 'budget-setup', label: 'ตั้งงบประมาณ (Budget Setup)', path: '/budget/setup' },
            { id: 'budget-allocation', label: 'จัดสรรงบประมาณ', path: '/budget/allocation' },
            { id: 'budget-control', label: 'ควบคุมงบประมาณ', path: '/budget/control' },
            { id: 'budget-transfer', label: 'โอนงบประมาณ', path: '/budget/transfer' },
            { id: 'budget-vs-actual', label: 'เปรียบเทียบงบประมาณ', path: '/budget/vs-actual' },
            { id: 'budget-reports', label: 'รายงานงบประมาณ', path: '/budget/reports' },
        ]
    },
    {
        id: 'fa',
        label: 'สินทรัพย์ถาวร (FA)',
        icon: Landmark,
        subItems: [
            { id: 'fa-dashboard', label: 'FA Dashboard', path: '/fa/dashboard' },
            { id: 'fa-register', label: 'ทะเบียนสินทรัพย์', path: '/fa/register' },
            { id: 'fa-acquisition', label: 'รับเข้าสินทรัพย์', path: '/fa/acquisition' },
            { id: 'fa-depreciation', label: 'คิดค่าเสื่อมราคา', path: '/fa/depreciation' },
            { id: 'fa-transfer', label: 'โอนย้ายสินทรัพย์', path: '/fa/transfer' },
            { id: 'fa-disposal', label: 'จำหน่ายสินทรัพย์', path: '/fa/disposal' },
            { id: 'fa-revaluation', label: 'ตีราคาใหม่', path: '/fa/revaluation' },
            { id: 'fa-reports', label: 'รายงานสินทรัพย์', path: '/fa/reports' },
        ]
    },
    {
        id: 'tax',
        label: 'ภาษี (Tax & Compliance)',
        icon: Calculator,
        subItems: [
            { id: 'tax-dashboard', label: 'Tax Dashboard', path: '/tax/dashboard' },
            { id: 'vat', label: 'ภาษีมูลค่าเพิ่ม (VAT)', path: '/tax/vat' },
            { id: 'withholding-tax', label: 'ภาษีหัก ณ ที่จ่าย', path: '/tax/withholding' },
            { id: 'input-tax', label: 'ภาษีซื้อ (Input Tax)', path: '/tax/input' },
            { id: 'output-tax', label: 'ภาษีขาย (Output Tax)', path: '/tax/output' },
            { id: 'tax-filing', label: 'ยื่นแบบภาษี', path: '/tax/filing' },
            { id: 'tax-reports', label: 'รายงานภาษี', path: '/tax/reports' },
        ]
    },
];
