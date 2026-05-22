/**
 * @file UOMPickerModal.tsx
 * @description Shared UOM Conversion Picker Modal — ใช้สำหรับเลือกหน่วยนับของสินค้า
 *
 * แสดงตาราง 5 คอลัมน์:
 *   หน่วยนับ | ชื่อหน่วยนับ | ชื่อหน่วยนับ (Eng) | อัตราส่วน | บาร์โค้ด
 *
 * พัฒนาโดยการใช้ ModalLayout มาตรฐานของระบบ ERP (Standard Modal System)
 * ใช้สีฟ้าคราม Royal Blue (bg-blue-600) แบบเดียวกับหน้าหลักของระบบตามภาพตัวอย่าง
 */
import React, { useState, useMemo } from 'react';
import { Search, ScanBarcode, Package } from 'lucide-react';
import { styles } from '@/shared/constants/styles';
import { ModalLayout } from '../layout/ModalLayout';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

/** ข้อมูลหน่วยนับที่ใช้ใน Picker */
export interface UOMPickerItem {
    /** PK ของ item_uom table — ใช้เป็น item_uom_id ส่งไป backend */
    conversion_id: number;
    /** Standard UOM ID (uom_id) — เก็บใน form state เพื่อ resolve ตอน save */
    from_unit_id: number;
    /** ชื่อหน่วย (ภาษาไทย) เช่น "ชิ้น", "แพ็ค", "ลัง" */
    from_unit_name: string;
    /** ชื่อหน่วย (ภาษาอังกฤษ) เช่น "PCS", "INNER", "CARTON" */
    from_unit_name_en?: string;
    /** อัตราส่วนการแปลง เช่น 1, 12, 24 */
    conversion_factor: number;
    /** บาร์โค้ดที่ผูกกับหน่วยนี้อยู่แล้ว (ถ้ามี) */
    barcode?: string;
}

/** Props สำหรับ UOMPickerModal */
export interface UOMPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Callback เมื่อผู้ใช้เลือกหน่วยนับ */
    onSelect: (item: UOMPickerItem) => void;
    /** รายการหน่วยนับที่แสดงใน picker */
    items: UOMPickerItem[];
    /** Loading state (ขณะ fetch data) */
    isLoading?: boolean;
    /** from_unit_id ของ row ที่เลือกอยู่ (สำหรับ highlight) */
    selectedFromUnitId?: number;
    /** หัวเรื่องของ modal */
    title?: string;
    /** z-index (default 60 เพื่อซ้อนบน Modal อื่น) */
    zIndex?: number;
}

// ====================================================================================
// COMPONENT
// ====================================================================================

export const UOMPickerModal: React.FC<UOMPickerModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    items,
    isLoading = false,
    selectedFromUnitId,
    title = 'เลือกหน่วยนับสำหรับบาร์โค้ด',
    zIndex = 60,
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    // กรองข้อมูลตามคำค้นหา
    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) return items;
        const term = searchTerm.toLowerCase();
        return items.filter(item =>
            item.from_unit_name.toLowerCase().includes(term) ||
            (item.from_unit_name_en || '').toLowerCase().includes(term) ||
            (item.barcode || '').toLowerCase().includes(term)
        );
    }, [items, searchTerm]);

    // Reset search เมื่อเปิด modal
    React.useEffect(() => {
        if (isOpen) setSearchTerm('');
    }, [isOpen]);

    const isEmpty = items.length === 0;
    const noResults = !isEmpty && filteredItems.length === 0;

    const Footer = (
        <div className="flex items-center justify-between w-full">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                พบ {filteredItems.length} รายการหน่วยนับ
                {searchTerm && ` (ค้นพบจากทั้งหมด ${items.length} รายการ)`}
            </span>
            <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-semibold transition-all text-sm active:scale-95 duration-150"
            >
                ปิดหน้าต่าง
            </button>
        </div>
    );

    return (
        <ModalLayout
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            titleIcon={<Package size={20} />}
            subtitle="คลิกแถวเพื่อเลือกหน่วยนับ - Click row to select Unit of Measure"
            variant="dialog"
            size="lg"
            isLoading={isLoading}
            headerColor="bg-blue-600 dark:bg-blue-700"
            zIndex={zIndex}
            footer={Footer}
        >
            <div className="space-y-4 flex flex-col">
                {/* Search Bar Panel */}
                <div className="relative">
                    <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                        type="text"
                        placeholder="ค้นหาหน่วยนับ, ชื่อหน่วย (ENG), บาร์โค้ด... - Search UOM, Barcode..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        autoFocus
                        className={`${styles.input} pl-10 pr-4`}
                    />
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl max-h-[50vh]">
                    <table className="w-full border-collapse text-sm">
                        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className={`${styles.tableTh} w-28`}>หน่วยนับ</th>
                                <th className={styles.tableTh}>ชื่อหน่วยนับ</th>
                                <th className={styles.tableTh}>ชื่อหน่วยนับ (Eng)</th>
                                <th className={`${styles.tableTh} text-center w-28`}>อัตราส่วน</th>
                                <th className={styles.tableTh}>บาร์โค้ด</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800/20">
                            {/* Loading Skeleton */}
                            {isLoading && Array.from({ length: 3 }).map((_, i) => (
                                <tr key={`skel-${i}`} className="animate-pulse">
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <td key={j} className="px-4 py-4">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md" />
                                        </td>
                                    ))}
                                </tr>
                            ))}

                            {/* Empty State */}
                            {!isLoading && isEmpty && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                                            <div className="p-3.5 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500 flex items-center justify-center">
                                                <Package size={44} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                                    ไม่พบข้อมูลหน่วยนับ
                                                </h4>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
                                                    สินค้านี้อาจจะยังไม่มีการกำหนดการแปลงหน่วยนับ <br />
                                                    กรุณากำหนดแปลงหน่วยเพื่อใช้งานระบบเลือกหน่วยนับ
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* No Search Results */}
                            {!isLoading && noResults && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-14 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-60">
                                            <Search size={24} className="text-gray-400" />
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    ไม่พบหน่วยนับที่ตรงตามค้นหา
                                                </h4>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                    กรุณาลองสะกดคำค้นหาใหม่อีกครั้ง
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {/* Data Rows */}
                            {!isLoading && filteredItems.map(item => {
                                const isSelected = item.from_unit_id === selectedFromUnitId;

                                return (
                                    <tr
                                        key={item.conversion_id}
                                        onClick={() => onSelect(item)}
                                        className={`cursor-pointer transition-colors duration-100 border-l-[4px] ${
                                            isSelected
                                                ? 'bg-blue-50/20 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-l-blue-500 font-semibold'
                                                : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-700/30 text-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {/* Code / Unit Tag */}
                                        <td className="px-4 py-3.5">
                                            <div className="flex items-center gap-2">
                                                {isSelected && (
                                                    <div className="w-1.5 h-5 bg-blue-500 rounded-full flex-shrink-0 -ml-1" />
                                                )}
                                                <span className={`font-bold text-sm tracking-wide ${
                                                    isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                                                }`}>
                                                    {item.from_unit_name}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Unit Name (Thai) */}
                                        <td className="px-4 py-3.5 text-sm font-medium">
                                            {item.from_unit_name}
                                        </td>

                                        {/* Unit Name (English) */}
                                        <td className="px-4 py-3.5">
                                            {item.from_unit_name_en ? (
                                                <span className={`font-mono text-sm font-semibold uppercase tracking-wider ${
                                                    isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                                                }`}>
                                                    {item.from_unit_name_en}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 dark:text-gray-500 italic">-</span>
                                            )}
                                        </td>

                                        {/* Ratio */}
                                        <td className="px-4 py-3.5 text-center">
                                            <span className={`font-mono text-sm font-bold ${
                                                isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-850 dark:text-gray-200'
                                            }`}>
                                                {Number(item.conversion_factor).toLocaleString('th-TH', {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 4,
                                                    useGrouping: true
                                                })}
                                            </span>
                                        </td>

                                        {/* Barcode Reference */}
                                        <td className="px-4 py-3.5">
                                            {item.barcode ? (
                                                <div className={`inline-flex items-center gap-1.5 font-mono text-sm font-medium ${
                                                    isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-650 dark:text-gray-300'
                                                }`}>
                                                    <ScanBarcode size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                    <span>{item.barcode}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-405 dark:text-gray-500 italic">
                                                    ไม่มีบาร์โค้ด
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </ModalLayout>
    );
};
