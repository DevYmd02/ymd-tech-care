import React, { useState, useCallback, useMemo } from 'react';
import { Search, Package, Check, X } from 'lucide-react';
import { DialogFormLayout } from '@layout/DialogFormLayout';
import { cn } from '@/shared/utils';
import { ItemMasterService } from '@inventory/services/item-master.service';
import type { ItemListItem } from '@inventory/types/product-types';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@hooks/useDebounce';
import { formatNumber } from '@/shared/utils';

/**
 * @file ProductSearchModal.tsx
 * @description Localized Search Modal for selecting Products in Quotation module.
 */

export interface ProductSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: ItemListItem) => void;
    title?: string;
    headerColor?: string;
}

export const ProductSearchModal: React.FC<ProductSearchModalProps> = React.memo(({
    isOpen,
    onClose,
    onSelect,
    title = 'ค้นหาสินค้า - Find Product',
    headerColor
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    // Fetch products using Server-side search
    const { data: response, isLoading } = useQuery({
        queryKey: ['products-lookup', debouncedSearch],
        queryFn: () => ItemMasterService.getAll({ q: debouncedSearch, limit: 100 }),
        enabled: isOpen,
        staleTime: 0, 
    });

    const products = useMemo(() => response?.items || [], [response]);

    const handleSelect = useCallback((product: ItemListItem) => {
        onSelect(product);
        onClose();
    }, [onSelect, onClose]);

    return (
        <DialogFormLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            headerColor={headerColor}
            titleIcon={
                <div className={cn(
                    "p-1.5 rounded-lg shadow-sm",
                    headerColor?.includes('indigo') ? "bg-white/20" :
                    headerColor ? "bg-white/20" : "bg-emerald-600"
                )}>
                    <Package size={20} className="text-white" />
                </div>
            }
            width="max-w-[1200px]"
        >
            <div className="flex flex-col h-[70vh]">
                {/* Search Bar */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="relative group">
                        <Search className={cn(
                            "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors",
                            headerColor?.includes('indigo') ? "group-focus-within:text-indigo-500" : "group-focus-within:text-emerald-500"
                        )} size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="ค้นหารหัสสินค้า, ชื่อสินค้า..."
                            className={cn(
                                "w-full pl-12 pr-4 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 text-base text-gray-900 dark:text-white shadow-sm group-hover:border-gray-300 dark:group-hover:border-gray-600 transition-all font-medium placeholder-gray-400 dark:placeholder-gray-500",
                                headerColor?.includes('indigo') ? "focus:ring-indigo-500" : "focus:ring-emerald-500"
                            )}
                            autoFocus
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-auto p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 opacity-60">
                            <div className={cn(
                                "animate-spin rounded-full h-12 w-12 border-b-2 mb-4",
                                headerColor?.includes('indigo') ? "border-indigo-600" : "border-emerald-600"
                            )} />
                            <p className="text-gray-500 font-medium">กำลังโหลดข้อมูลสินค้า...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">รหัสสินค้า</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">ชื่อสินค้า</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">หน่วย</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-right">ราคามาตรฐาน</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#0b1120]/30 transition-all">
                                {products.length > 0 ? (
                                    products.map((product) => (
                                        <tr 
                                            key={product.item_id || product.id} 
                                            className={cn(
                                                "transition-colors group cursor-pointer",
                                                headerColor?.includes('indigo') ? "hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10" : "hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10"
                                            )}
                                            onClick={() => handleSelect(product)}
                                        >
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "font-bold group-hover:scale-105 transition-transform inline-block",
                                                    headerColor?.includes('indigo') ? "text-indigo-600 dark:text-indigo-400" : "text-emerald-600 dark:text-emerald-400"
                                                )}>
                                                    {product.item_code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-800 dark:text-gray-200">
                                                    {product.item_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px] font-bold uppercase">
                                                    {product.uom_name || product.uom_name || product.base_uom_name || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-700 dark:text-gray-200">
                                                {formatNumber(Number(product.standard_cost || 0))}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelect(product);
                                                    }}
                                                    className={cn(
                                                        "inline-flex items-center gap-2 px-4 py-1.5 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95",
                                                        headerColor?.includes('indigo') ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"
                                                    )}
                                                >
                                                    เลือก
                                                    <Check size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center items-center justify-center">
                                            <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                                                <Package size={64} className="mb-4 opacity-20" />
                                                <p className="text-xl font-bold">ไม่พบข้อมูลสินค้า</p>
                                                <p className="text-sm opacity-80">ลองเปลี่ยนคำค้นหาอีกครั้ง</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center px-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        แสดงข้อมูล <span className={cn(
                            "font-bold",
                            headerColor?.includes('indigo') ? "text-indigo-600" : "text-emerald-600"
                        )}>{products.length}</span> รายการ
                    </p>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm active:scale-95"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </div>
        </DialogFormLayout>
    );
});
