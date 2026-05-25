import { memo, useState, useMemo } from 'react';
import { Plus, Trash2, Package, Search, AlertCircle, Loader2 } from 'lucide-react';
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { PriceSourceBadge } from '@sales/shared/components/PriceSourceBadge';
import type { QuotationLineValues, QuotationFormValues } from '@sales/quotation/schemas/quotation-schemas';
import type { UOMListItem } from '@inventory/types/product-types';
import type { PriceLevelName } from '@sales-master/pages/price-level-name/types/price-level-name.types';
import { formatNumber } from '@/shared/utils';
import { UOMPickerModal, type UOMPickerItem } from '@/shared/components/ui/feedback/UOMPickerModal';
import { UOMConversionService } from '@inventory/services/uom-conversion.service';

interface QuotationLineTableProps {
    onAddLine: () => void;
    onRemoveLine: (index: number) => void;
    onLineChange: (index: number, field: keyof QuotationLineValues, value: string | number) => void;
    onSearchProduct?: (index: number) => void;
    onQtyBlur?: (index: number) => void;
    loadingPriceLines?: Set<number>;
    uoms?: UOMListItem[];
    priceLevelNames?: PriceLevelName[];
    readOnly?: boolean;
    currencySymbol?: string;
}

const compactInputClass = "h-8 w-full px-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50 shadow-sm";

/**
 * 💡 Optimized Row Component: Watches only its own index
 */
const QuotationLineRow = memo(({
    index,
    readOnly,
    onLineChange,
    onSearchProduct,
    onQtyBlur,
    loadingPriceLines,
    uoms,
    priceLevelNames,
    currencySymbol,
    onRemoveLine,
    getFieldErrorClass,
    hasLineFieldError,
    onOpenUomPicker
}: {
    index: number;
    readOnly: boolean;
    onLineChange: (index: number, field: keyof QuotationLineValues, value: string | number) => void;
    onSearchProduct?: (index: number) => void;
    onQtyBlur?: (index: number) => void;
    loadingPriceLines: Set<number>;
    uoms: UOMListItem[];
    priceLevelNames: PriceLevelName[];
    currencySymbol: string;
    onRemoveLine: (index: number) => void;
    getFieldErrorClass: (index: number, fieldName: keyof QuotationLineValues) => string;
    hasLineFieldError: (index: number, fieldName: keyof QuotationLineValues) => boolean;
    onOpenUomPicker?: (index: number) => void;
}) => {
    const { control } = useFormContext<QuotationFormValues>();
    const line = useWatch({
        control,
        name: `lines.${index}`
    }) as QuotationLineValues;

    if (!line) return null;

    const isFetchingPrice = loadingPriceLines.has(index);

    return (
        <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors group">
            <td className="px-2 py-1.5 text-center text-gray-500 font-medium">
                {index + 1}
            </td>
            <td className="px-2 py-1.5">
                <div className="flex gap-1">
                    <input 
                        value={line.item_code || ''}
                        readOnly
                        className={`${compactInputClass} bg-gray-50/50 italic cursor-not-allowed ${getFieldErrorClass(index, 'item_id')}`}
                        placeholder="รหัสสินค้า"
                    />
                    <button 
                        type="button" 
                        onClick={() => onSearchProduct?.(index)}
                        disabled={readOnly}
                        className={`p-1.5 ${getFieldErrorClass(index, 'item_id') ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded transition-all shadow-sm active:scale-95 shrink-0 h-8 w-8 flex items-center justify-center disabled:opacity-50`}
                    >
                        <Search size={14} />
                    </button>
                </div>
                {hasLineFieldError(index, 'item_id') && (
                    <div className="flex items-center gap-1 text-[10px] text-red-500 mt-0.5">
                        <AlertCircle size={10} />
                        <span>เลือกสินค้า</span>
                    </div>
                )}
            </td>
            <td className="px-2 py-1.5">
                <input 
                    type="text" 
                    value={line.item_name || ''} 
                    className={`${compactInputClass} bg-gray-50 italic cursor-not-allowed`}
                    placeholder="ชื่อสินค้าอัตโนมัติ"
                    readOnly
                />
            </td>
            <td className="px-2 py-1.5">
                <input 
                    type="text" 
                    value={line.qty || ''} 
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d{0,3}$/.test(val)) {
                            onLineChange(index, 'qty', val);
                        }
                    }}
                    onFocus={(e) => e.target.select()}
                    onBlur={(e) => {
                        const val = e.target.value;
                        if (val !== '' && !isNaN(Number(val))) {
                            onLineChange(index, 'qty', Number(val).toFixed(3));
                        }
                        if (onQtyBlur && line.item_id) onQtyBlur(index);
                    }}
                    placeholder="0"
                    maxLength={12}
                    disabled={readOnly}
                    className={`${compactInputClass} text-right ${getFieldErrorClass(index, 'qty')}`}
                />
                {hasLineFieldError(index, 'qty') && <span className="text-[10px] text-red-500 block text-right mt-0.5">ระบุจำนวน</span>}
            </td>
            <td className="px-2 py-1.5">
                <button
                    type="button"
                    disabled={readOnly || !line.item_id}
                    onClick={() => onOpenUomPicker?.(index)}
                    className={`${compactInputClass} ${getFieldErrorClass(index, 'uom_id')} text-left flex items-center justify-between font-medium disabled:bg-gray-50 dark:disabled:bg-gray-800/50 disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                    <span className="truncate">
                        {uoms.find(u => String(u.uom_id) === String(line.uom_id))?.uom_name || 
                         (line.uom_id ? `[ID: ${line.uom_id}]` : '-- หน่วย --')}
                    </span>
                    {!readOnly && !!line.item_id && <span className="text-gray-400 dark:text-gray-500 text-[10px] ml-1 shrink-0">▼</span>}
                </button>
            </td>
            <td className="px-2 py-1.5">
                <div className="relative">
                    <input 
                        type="text" 
                        value={line.unit_price || ''} 
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                                onLineChange(index, 'unit_price', val);
                            }
                        }}
                        onFocus={(e) => e.target.select()}
                        onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== '' && !isNaN(Number(val))) {
                                onLineChange(index, 'unit_price', Number(val).toFixed(2));
                            }
                        }}
                        placeholder="0.00"
                        maxLength={12}
                        disabled={isFetchingPrice || readOnly}
                        className={`${compactInputClass} text-right font-medium text-blue-600 pr-7 ${getFieldErrorClass(index, 'unit_price')} ${(isFetchingPrice || readOnly) ? 'opacity-50' : ''}`}
                    />
                    {isFetchingPrice && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Loader2 size={14} className="text-blue-500 animate-spin" />
                        </div>
                    )}
                </div>
                {!isFetchingPrice && (
                    <PriceSourceBadge 
                        priceSourceName={line.price_source_name}
                        priceLevelPriority={line.price_level_priority}
                        priceLevelNames={priceLevelNames}
                        unitPrice={line.unit_price}
                    />
                )}
                {hasLineFieldError(index, 'unit_price') && <span className="text-[10px] text-red-500 block text-right mt-0.5">ระบุราคา</span>}
            </td>
             <td className="px-2 py-1.5">
                 <div className="flex flex-col items-end gap-1">
                     <input 
                         type="text" 
                         value={line.discount_expression ?? ''} 
                         onChange={(e) => onLineChange(index, 'discount_expression', e.target.value)}
                         onFocus={(e) => e.target.select()}
                         placeholder="0%"
                         maxLength={20}
                         disabled={readOnly}
                         className={`${compactInputClass} text-right`}
                     />
                     {String(line.discount_expression || '').includes('%') && (line.line_discount ?? 0) > 0 && (
                         <div className="text-[10px] font-bold text-red-600 dark:text-red-400 whitespace-nowrap animate-in fade-in slide-in-from-top-1 duration-200">
                             {`-${formatNumber(line.line_discount || 0)} ${currencySymbol}`}
                         </div>
                     )}
                 </div>
             </td>
             <td className="px-2 py-1.5 text-right">
                 <input 
                     type="text" 
                     value={line.note || ''} 
                     onChange={(e) => onLineChange(index, 'note', e.target.value)}
                     disabled={readOnly}
                     placeholder="..."
                     className={`${compactInputClass} italic text-gray-500`}
                 />
             </td>
             <td className={`px-2 py-1.5 ${readOnly ? 'text-center' : 'text-right'} font-bold text-sm ${(line.line_total ?? 0) < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                 <div className={`flex flex-col ${readOnly ? 'items-center' : 'items-end'} overflow-hidden max-w-[150px]`}>
                     <span className={`truncate w-full ${readOnly ? 'text-center' : 'text-right'}`}>{formatNumber(line.line_total || 0)}</span>
                    {hasLineFieldError(index, 'line_total') && (
                        <div className="flex items-center gap-0.5 text-[9px] font-medium text-red-500 mt-0.5">
                            <AlertCircle size={8} />
                            <span>ส่วนลดเกิน</span>
                        </div>
                    )}
                </div>
            </td>
            {!readOnly && (
                <td className="px-2 py-1.5 text-center">
                    <button 
                        type="button" 
                        onClick={() => onRemoveLine(index)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </td>
            )}
        </tr>
    );
});

export function QuotationLineTable({ 
    onAddLine, 
    onRemoveLine, 
    onLineChange, 
    onSearchProduct, 
    onQtyBlur, 
    loadingPriceLines = new Set(), 
    uoms = [], 
    priceLevelNames = [], 
    readOnly = false, 
    currencySymbol = 'บาท' 
}: QuotationLineTableProps) {
    const { control, formState: { errors } } = useFormContext<QuotationFormValues>();
    const { fields } = useFieldArray({ control, name: 'lines' });

    // --- UOM Picker States ---
    const [activeUomRowIndex, setActiveUomRowIndex] = useState<number | null>(null);
    const lines = useWatch({ control, name: 'lines' }) || [];
    const activeLine = activeUomRowIndex !== null ? lines[activeUomRowIndex] : null;
    const activeItemId = activeLine ? Number(activeLine.item_id || 0) : 0;

    // Fetch conversions for selected item
    const { data: conversionData, isLoading: isLoadingConversions } = useQuery({
        queryKey: ['quotation-uom-conversions', activeItemId],
        queryFn: () => UOMConversionService.getByItemId(activeItemId),
        enabled: !!activeItemId && activeItemId > 0,
        staleTime: 2 * 60 * 1000,
    });

    // Map UOM conversions to UOMPickerItem[]
    const uomPickerItems = useMemo((): UOMPickerItem[] => {
        const conversions = conversionData?.items || [];
        return conversions.map(conv => {
            const uomInfo = uoms.find(u => Number(u.uom_id) === Number(conv.from_unit_id));
            return {
                conversion_id: conv.conversion_id,
                from_unit_id: conv.from_unit_id,
                from_unit_name: conv.from_unit_name || uomInfo?.uom_name || String(conv.from_unit_id),
                from_unit_name_en: uomInfo?.uom_name_en || uomInfo?.uom_nameeng || uomInfo?.uom_code || undefined,
                conversion_factor: conv.conversion_factor,
                barcode: undefined,
            };
        });
    }, [conversionData, uoms]);

    const handleSelectUom = (item: UOMPickerItem) => {
        if (activeUomRowIndex !== null) {
            onLineChange(activeUomRowIndex, 'uom_id', Number(item.from_unit_id));
        }
        setActiveUomRowIndex(null);
    };

    const getLineError = (index: number) => {
        if (!errors.lines || !Array.isArray(errors.lines)) return undefined;
        return errors.lines[index];
    };

    const hasLineFieldError = (index: number, fieldName: keyof QuotationLineValues) => {
        const lineError = getLineError(index);
        return !!(lineError as Record<string, unknown> | undefined)?.[fieldName];
    };

    const getFieldErrorClass = (index: number, fieldName: keyof QuotationLineValues) => {
        return hasLineFieldError(index, fieldName) ? "border-red-500 focus:ring-red-500 ring-1 ring-red-500/50" : "";
    };

    const headerThClass = "px-3 py-3 text-xs font-bold uppercase tracking-wider bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap";
    
    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Package size={20} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">รายการสินค้า/บริการ — Line Items</h3>
                </div>
                {!readOnly && (
                    <button 
                        type="button" 
                        onClick={onAddLine}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95"
                    >
                        <Plus size={16} strokeWidth={3} />
                        เพิ่มรายการ
                    </button>
                )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                             <th className={`${headerThClass} w-10 text-center`}>ลำดับ</th>
                             <th className={`${headerThClass} min-w-[180px]`}>รหัสสินค้า (ITEM CODE)</th>
                             <th className={`${headerThClass} min-w-[380px]`}>ชื่อสินค้า (ITEM NAME)</th>
                             <th className={`${headerThClass} w-24 text-right`}>จำนวน (QTY)</th>
                             <th className={`${headerThClass} w-32`}>หน่วย (UOM)</th>
                             <th className={`${headerThClass} w-28 text-right`}>ราคา/หน่วย</th>
                             <th className={`${headerThClass} w-28 text-right`}>ส่วนลด</th>
                             <th className={`${headerThClass} min-w-[180px]`}>หมายเหตุ (REMARK)</th>
                             <th className={`${headerThClass} w-32 ${readOnly ? 'text-center' : 'text-right'}`}>ยอดสุทธิ</th>
                             {!readOnly && <th className={`${headerThClass} w-14 text-center`}>จัดการ</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                        {fields.map((field, index) => (
                            <QuotationLineRow
                                key={field.id}
                                index={index}
                                readOnly={readOnly}
                                onLineChange={onLineChange}
                                onSearchProduct={onSearchProduct}
                                onQtyBlur={onQtyBlur}
                                loadingPriceLines={loadingPriceLines}
                                uoms={uoms}
                                priceLevelNames={priceLevelNames}
                                currencySymbol={currencySymbol}
                                onRemoveLine={onRemoveLine}
                                getFieldErrorClass={getFieldErrorClass}
                                hasLineFieldError={hasLineFieldError}
                                onOpenUomPicker={(idx) => setActiveUomRowIndex(idx)}
                            />
                        ))}
                        {fields.length === 0 && (
                            <tr>
                                 <td colSpan={readOnly ? 9 : 10} className="px-4 py-10 text-center text-gray-400 bg-gray-50/30 dark:bg-gray-800/20">
                                    <Package size={32} className="mx-auto mb-2 opacity-20" />
                                    ไม่มีรายการสินค้า กรุณาคลิกเพื่อเพิ่มรายการ
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {errors.lines && !Array.isArray(errors.lines) && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium">
                    <AlertCircle size={18} />
                    <span>{(!Array.isArray(errors.lines) && (errors.lines as { message?: string })?.message) || 'กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ'}</span>
                </div>
            )}

            {/* UOM Picker Modal Component */}
            <UOMPickerModal
                isOpen={activeUomRowIndex !== null}
                onClose={() => setActiveUomRowIndex(null)}
                onSelect={handleSelectUom}
                items={uomPickerItems}
                isLoading={isLoadingConversions}
                selectedFromUnitId={activeLine ? Number(activeLine.uom_id || 0) : undefined}
                title={`เลือกหน่วยนับสำหรับ ${activeLine?.item_name || 'สินค้า'}`}
            />
        </section>
    );
}
