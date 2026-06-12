import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Layers, Database, MinusCircle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import type { ICOption } from '../types/ic-option.types';

interface ICOptionSummaryBarProps {
    options: ICOption;
    isLoading?: boolean;
    stockEffect?: number; // 0: ไม่กระทบ, 1: เพิ่มคลัง, 2: ลดคลัง
}

export const ICOptionSummaryBar: React.FC<ICOptionSummaryBarProps> = ({ options, isLoading, stockEffect }) => {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 animate-pulse">
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
        );
    }

    // Map negative stock check
    const getNegativeStockBadge = () => {
        switch (options.negative_stock_check) {
            case 1:
                return { label: 'ห้ามติดลบ', icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' };
            case 2:
                return { label: 'ติดลบได้', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' };
            case 3:
                return { label: 'เตือนก่อน', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' };
            default:
                return { label: 'ตามรายตัวสินค้า', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' };
        }
    };

    // Map stock mode
    const getStockModeBadge = () => {
        switch (options.negative_stock_mode) {
            case 1:
                return 'รวมคลังสินค้า';
            case 2:
                return 'แยกคลังสินค้า';
            case 3:
                return 'แยกคลังและที่เก็บ';
            default:
                return 'รวมคลังสินค้า';
        }
    };

    // Map quantity validation flag
    const getQtyValidationBadge = () => {
        switch (options.quantity_validation_flag) {
            case 1:
                return 'ยอดสินค้าคงเหลือ';
            case 2:
                return 'ยอดจองสินค้า';
            default:
                return 'ยอดสินค้าคงเหลือ';
        }
    };

    // Map stock effect
    const getStockEffectBadge = () => {
        switch (stockEffect) {
            case 0:
                return { label: 'ไม่กระทบ', icon: <MinusCircle className="w-3.5 h-3.5" />, color: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700' };
            case 1:
                return { label: 'เพิ่มคลัง', icon: <ArrowUpFromLine className="w-3.5 h-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' };
            case 2:
                return { label: 'ลดคลัง', icon: <ArrowDownToLine className="w-3.5 h-3.5" />, color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' };
            default:
                return null;
        }
    };

    const negStock = getNegativeStockBadge();
    const effectBadge = getStockEffectBadge();

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Stock Effect Badge */}
            {effectBadge && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${effectBadge.color}`} title="ผลต่อคลัง">
                    {effectBadge.icon}
                    {effectBadge.label}
                </span>
            )}

            {/* Negative Stock Badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${negStock.color}`} title="เงื่อนไขสินค้าติดลบ">
                {negStock.icon}
                {negStock.label}
            </span>

            {/* Stock Mode Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50" title="ระดับการเช็คสต็อก">
                <Layers className="w-3.5 h-3.5" />
                {getStockModeBadge()}
            </span>

            {/* Quantity Validation Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/50" title="ยอดที่ใช้คำนวณ">
                <Database className="w-3.5 h-3.5" />
                {getQtyValidationBadge()}
            </span>
        </div>
    );
};
