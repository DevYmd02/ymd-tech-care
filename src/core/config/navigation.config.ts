/**
 * @file navigation.config.ts
 * @description Centralized navigation configuration for Sidebar and UI elements
 * @purpose Separates UI assets (icons, menu structure) from pure routing logic
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
    Database,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

export interface SubMenuItem {
    id: string;
    label: string;
    path?: string;
    icon?: LucideIcon;
    subItems?: SubMenuItem[];
}

export interface MenuItem {
    id: string;
    label: string;
    icon: LucideIcon;
    path?: string;
    subItems?: SubMenuItem[];
}

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
        id: 'user-management',
        label: 'จัดการผู้ใช้งาน (User Management)',
        icon: Users,
        subItems: [
            { id: 'employees', label: 'จัดการพนักงาน', path: '/admin/employees' },
            { id: 'roles-permissions', label: 'บทบาทและสิทธิ์', path: '/admin/roles' },
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
            { id: 'inquiry', label: 'สำรวจความต้องการ (Inquiry)', path: '/sales/inquiry' },
            { id: 'estimate', label: 'ประมาณราคา (Estimate)', path: '/sales/estimate' },
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
        label: 'Procurement (ระบบจัดซื้อ)',
        icon: ShoppingBag,
        subItems: [
            { id: 'proc-dashboard', label: 'Procurement Dashboard', path: '/procurement/dashboard' },
            { id: 'pr', label: 'รายการใบขอซื้อ (PR)', path: '/procurement/pr' },
            { id: 'rfq', label: 'รายการขอใบเสนอราคา (RFQ)', path: '/procurement/rfq' },
            { id: 'vq', label: 'รายการใบเสนอราคา (VQ)', path: '/procurement/vq' },
            { id: 'qc', label: 'รายการใบเปรียบเทียบราคา (QC)', path: '/procurement/qc' },
            { id: 'po', label: 'รายการขอสั่งซื้อ (PO)', path: '/procurement/po' },
            { id: 'grn', label: 'รายการใบรับสินค้า (GRN)', path: '/procurement/grn' },
            { id: 'prt', label: 'รายการใบคืนสินค้า (PRT)', path: '/procurement/prt' },
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
    {
        id: 'master-data',
        label: 'Master Data Management',
        icon: Database,
        path: '/master-data',
        subItems: [
            { id: 'master-data-dashboard', label: 'Master Data Dashboard', path: '/master-data' },
            {
                id: 'master-data-company',
                label: 'Master Data Company',
                subItems: [
                    { id: 'branch-code', label: 'กำหนดรหัสสาขา', path: '/master-data/branch' },
                    {
                    id: 'employee-side',
                    label: 'กำหนดรหัสฝ่าย (Employee Side)',
                    path: '/master-data/employee-side',
                },
                {
                    id: 'section-code',
                    label: 'กำหนดรหัสแผนก (Section)',
                    path: '/master-data/section',
                },
                {
                    id: 'job-code',
                    label: 'กำหนดรหัส Job',
                    path: '/master-data/job',
                },
                {
                    id: 'employee-code',
                    label: 'กำหนดรหัสพนักงาน',
                    path: '/master-data/employee',
                },
                {
                    id: 'employee-group',
                    label: 'กำหนดรหัสกลุ่มพนักงาน',
                    path: '/master-data/employee-group',
                },
                {
                    id: 'position',
                    label: 'กำหนดรหัสตำแหน่ง',
                    path: '/master-data/position',
                },
                {
                    id: 'sales-area',
                    label: 'กำหนดเขตการขาย',
                    path: '/master-data/sales-area',
                },
                {
                    id: 'sales-channel',
                    label: 'กำหนดช่องทางการขาย',
                    path: '/master-data/sales-channel',
                },
                {
                    id: 'sales-target',
                    label: 'กำหนดรหัสเป้าการขาย',
                    path: '/master-data/sales-target',
                },
                ]
            },
            {
                id: 'master-data-currency',
                label: 'Master Data สกุลเงิน',
                subItems: [
                    { id: 'currency-code', label: 'กำหนดรหัสสกุลเงิน', path: '/master-data/currency/code' },
                    { id: 'currency-type', label: 'กำหนดรหัสประเภทอัตราแลกเปลี่ยน', path: '/master-data/currency/type' },
                    { id: 'currency-rate', label: 'กำหนดอัตราแลกเปลี่ยนเงินตรา', path: '/master-data/currency/rate' },
                ]
            },
            {
                id: 'master-data-vendor',
                label: 'Master Data เจ้าหนี้',
                subItems: [
                    { id: 'vendor-management', label: 'กำหนดรหัสเจ้าหนี้', path: '/master-data/vendor' },
                    { id: 'vendor-type', label: 'กำหนดประเภทเจ้าหนี้', path: '/master-data/vendor-type' },
                    { id: 'vendor-group', label: 'กำหนดกลุ่มเจ้าหนี้', path: '/master-data/vendor-group' },
                ]
            },
            {
                id: 'master-data-customer',
                label: 'Master Data ลูกหนี้',
                subItems: [
                    { id: 'customer-management', label: 'กำหนดรหัสลูกหนี้', path: '/master-data/customer' },
                    { id: 'customer-business-type', label: 'กำหนดประเภทธุรกิจลูกหนี้', path: '/master-data/customer-business-type' },
                    { id: 'customer-type', label: 'กำหนดรหัสประเภทลูกหนี้', path: '/master-data/customer-type' },
                    { id: 'customer-group', label: 'กำหนดรหัสกลุ่มลูกหนี้', path: '/master-data/customer-group' },
                    { id: 'customer-billing-group', label: 'กำหนดรหัสกลุ่มวางบิล', path: '/master-data/customer-billing-group' },
                ]
            },
            {
                id: 'master-data-tax',
                label: 'Master Data ภาษี',
                subItems: [
                    { id: 'tax-code', label: 'กำหนดรหัสภาษี', path: '/master-data/tax/code' },
                    { id: 'tax-group', label: 'กำหนดกลุ่มภาษี', path: '/master-data/tax/group' },
                ]
            },
            {
                id: 'master-data-inventory',
                label: 'Master Data คลังสินค้า',
                subItems: [
                    { id: 'item-master', label: 'กำหนดรหัสสินค้าและบริการ', path: '/master-data/item' },
                    { id: 'unit', label: 'กำหนดหน่วยนับ', path: '/master-data/unit' },
                    { id: 'item-type', label: 'กำหนดประเภทสินค้า', path: '/master-data/item-type' },
                    { id: 'item-group', label: 'กำหนดกลุ่มสินค้า', path: '/master-data/item-group' },
                    { id: 'item-category', label: 'กำหนดหมวดสินค้า', path: '/master-data/product-category' },
                    { id: 'brand', label: 'กำหนดยี่ห้อสินค้า', path: '/master-data/brand' },
                    { id: 'pattern', label: 'กำหนดรูปแบบสินค้า', path: '/master-data/pattern' },
                    { id: 'design', label: 'กำหนดการออกแบบสินค้า', path: '/master-data/design' },
                    { id: 'grade', label: 'กำหนดเกรดสินค้า', path: '/master-data/grade' },
                    { id: 'model', label: 'กำหนดรุ่นสินค้า', path: '/master-data/model' },
                    { id: 'size', label: 'กำหนดขนาดสินค้า', path: '/master-data/size' },
                    { id: 'color', label: 'กำหนดสีสินค้า', path: '/master-data/color' },
                    { id: 'warehouse', label: 'กำหนดคลังสินค้า', path: '/master-data/warehouse' },
                    { id: 'location', label: 'กำหนดที่เก็บสินค้า', path: '/master-data/location' },
                    { id: 'shelf', label: 'กำหนดชั้นวางสินค้า', path: '/master-data/shelf' },
                    { id: 'lot-no', label: 'กำหนด Lot No สินค้า', path: '/master-data/lot-no' },
                    { id: 'multi-barcode', label: 'กำหนดบาร์โค้ดหลายรายการ/หลายหน่วย', path: '/master-data/item-barcode' },
                    { id: 'uom-conversion', label: 'กำหนดแปลงหน่วย (หลายหน่วยนับ)', path: '/master-data/uom-conversion' },
                ]
            },
        ]
    },
];
