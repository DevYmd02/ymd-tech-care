/**
 * @file ProcurementComingSoon.tsx
 * @description Coming Soon placeholder pages for Procurement modules (QT, QC, PO, GRN, PRT)
 */

import { Clock, FileText, ShoppingCart, Package, RotateCcw, CheckSquare } from 'lucide-react';

interface ProcurementComingSoonProps {
    module: 'QT' | 'QC' | 'PO' | 'GRN' | 'PRT';
}

const moduleConfig = {
    QT: {
        title: 'รายการใบเสนอราคา (QT)',
        subtitle: 'Quotation',
        description: 'ระบบจัดการใบเสนอราคาจากผู้ขาย',
        icon: FileText,
        color: 'text-blue-400',
        bgColor: 'bg-blue-600/20',
    },
    QC: {
        title: 'รายการใบเปรียบเทียบราคา (QC)',
        subtitle: 'Quotation Comparison',
        description: 'ระบบเปรียบเทียบราคาจากผู้ขายหลายราย',
        icon: CheckSquare,
        color: 'text-purple-400',
        bgColor: 'bg-purple-600/20',
    },
    PO: {
        title: 'รายการขอสั่งซื้อ (PO)',
        subtitle: 'Purchase Order',
        description: 'ระบบจัดการใบสั่งซื้อสินค้า',
        icon: ShoppingCart,
        color: 'text-green-400',
        bgColor: 'bg-green-600/20',
    },
    GRN: {
        title: 'รายการใบรับสินค้า (GRN)',
        subtitle: 'Goods Receipt Note',
        description: 'ระบบบันทึกการรับสินค้าเข้าคลัง',
        icon: Package,
        color: 'text-orange-400',
        bgColor: 'bg-orange-600/20',
    },
    PRT: {
        title: 'รายการใบคืนสินค้า (PRT)',
        subtitle: 'Purchase Return',
        description: 'ระบบจัดการการคืนสินค้าให้ผู้ขาย',
        icon: RotateCcw,
        color: 'text-red-400',
        bgColor: 'bg-red-600/20',
    },
};

export function ProcurementComingSoon({ module }: ProcurementComingSoonProps) {
    const config = moduleConfig[module];
    const Icon = config.icon;

    return (
        <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-8">
            <div className="text-center max-w-md">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${config.bgColor} mb-6`}>
                    <Icon size={48} className={config.color} />
                </div>
                
                {/* Title */}
                <h1 className="text-2xl font-bold text-white mb-2">{config.title}</h1>
                <p className="text-gray-400 text-lg mb-4">{config.subtitle}</p>
                
                {/* Description */}
                <p className="text-gray-500 mb-8">{config.description}</p>
                
                {/* Coming Soon Badge */}
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 rounded-full border border-gray-700">
                    <Clock size={20} className="text-yellow-400" />
                    <span className="text-gray-300 font-medium">Coming Soon</span>
                </div>
                
                {/* Additional Info */}
                <p className="text-gray-600 text-sm mt-6">
                    ฟีเจอร์นี้กำลังอยู่ในระหว่างการพัฒนา
                </p>
            </div>
        </div>
    );
}

// Export individual page components
export function QuotationListPage() {
    return <ProcurementComingSoon module="QT" />;
}

export function QuotationComparisonListPage() {
    return <ProcurementComingSoon module="QC" />;
}

export function PurchaseOrderListPage() {
    return <ProcurementComingSoon module="PO" />;
}

export function GoodsReceiptNoteListPage() {
    return <ProcurementComingSoon module="GRN" />;
}

export function PurchaseReturnListPage() {
    return <ProcurementComingSoon module="PRT" />;
}
