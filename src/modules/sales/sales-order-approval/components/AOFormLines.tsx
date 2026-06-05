import React from 'react';
import { Package, CheckSquare, Square } from 'lucide-react';
import type { AOLineFormData } from '../schemas/ao.schema';
import { PriceSourceBadge } from '@sales/shared/components/PriceSourceBadge';
import type { PriceLevelName } from '@sales-master/pages/price-level-name/types/price-level-name.types';

import type { WarehouseListItem } from '@master-data/types/master-data-types';
import type { Location } from '@inventory/types/inventory-master.types';

interface Props {
  lines: AOLineFormData[];
  updateLine: (index: number, field: keyof AOLineFormData, value: unknown) => void;
  priceLevelNames?: PriceLevelName[];
  readOnly?: boolean;
  warehouses?: WarehouseListItem[];
  locations?: Location[];
}

export const AOFormLines: React.FC<Props> = ({
  lines,
  updateLine,
  priceLevelNames = [],
  readOnly = false,
  warehouses = [],
  locations = [],
}) => {
  const toggleAll = (checked: boolean) => {
    if (readOnly) return;
    lines.forEach((_, index) => {
      updateLine(index, 'is_approved', checked);
      if (checked) {
        updateLine(index, 'approved_qty', lines[index].qty_ordered);
      }
    });
  };

  const allSelected = lines.length > 0 && lines.every(l => l.is_approved);
  const someSelected = lines.some(l => l.is_approved);

  const thClass = 'px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700';
  const tdClass = 'px-2 py-2.5 text-sm align-middle';
  const inputClass = 'h-8 w-full px-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50';

  const stickyHeaderClass = 'z-30 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.15)]';
  const stickyCellClass = 'z-20 border-r border-gray-100 dark:border-gray-800 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.15)] transition-colors';

  const fmt = (val: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

  const getWarehouseDisplayName = (line: AOLineFormData) => {
    if (line.warehouse_name) return line.warehouse_name;
    if (!line.warehouse_id || line.warehouse_id === '0') return '';
    const found = warehouses.find((w) => String(w.warehouse_id) === String(line.warehouse_id));
    return found ? found.warehouse_name || '' : String(line.warehouse_id);
  };

  const getLocationDisplayName = (line: AOLineFormData) => {
    if (line.location_name) return line.location_name;
    if (!line.location_id || line.location_id === '0') return '';
    const found = locations.find((l) => String(l.location_id) === String(line.location_id));
    return found ? found.name_th || found.code || '' : String(line.location_id);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Package size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">รายการสินค้า/บริการ — พิจารณาอนุมัติ</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">Line Items Approval</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm scrollbar-thin scrollbar-thumb-emerald-200 dark:scrollbar-thumb-emerald-900/30">
        <table className="w-full text-sm text-left border-separate border-spacing-0 min-w-[2100px]">
          <thead>
            <tr>
              <th className={`${thClass} w-16 text-center sticky left-0 ${stickyHeaderClass}`}>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] leading-none opacity-60">อนุมัติ</span>
                  <button
                    type="button"
                    onClick={() => toggleAll(!allSelected)}
                    disabled={readOnly}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                  >
                    {allSelected ? <CheckSquare size={16} className="text-emerald-600 dark:text-emerald-400" /> : (someSelected ? <Square className="opacity-50" size={16} /> : <Square size={16} />)}
                  </button>
                </div>
              </th>
              <th className={`${thClass} w-14 text-center sticky left-16 ${stickyHeaderClass}`}>ลำดับ</th>
              <th className={`${thClass} w-44 sticky left-[120px] ${stickyHeaderClass}`}>รหัสสินค้า</th>
              
              <th className={`${thClass} min-w-[320px]`}>ชื่อสินค้า</th>
              
              <th className={`${thClass} w-28 text-center bg-emerald-50/30 dark:bg-emerald-900/5`}>จำนวนสั่งซื้อ</th>
              <th className={`${thClass} w-36 text-center bg-emerald-50/50 dark:bg-emerald-900/10`}>จำนวนอนุมัติ</th>
              <th className={`${thClass} w-24 text-center`}>หน่วย</th>
              <th className={`${thClass} w-32 text-right`}>ราคา/หน่วย</th>
              <th className={`${thClass} w-28 text-right`}>ส่วนลด</th>
              <th className={`${thClass} w-36 text-right font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-900/5`}>ยอดสุทธิ (อนุมัติ)</th>
              
              <th className={`${thClass} w-44`}>คลังสินค้า</th>
              <th className={`${thClass} w-44`}>ที่เก็บ</th>
              <th className={`${thClass} w-44`}>LOT NUMBER</th>
              
              <th className={`${thClass} min-w-[250px]`}>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {lines.length === 0 ? (
              <tr>
                <td colSpan={14} className="px-4 py-16 text-center bg-gray-50/50 dark:bg-gray-800/10">
                  <Package size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-700 opacity-50" />
                  <p className="text-gray-400 dark:text-gray-500 font-medium">ไม่มีรายการสินค้าสำหรับการพิจารณา</p>
                </td>
              </tr>
            ) : (
              lines.map((line, index) => {
                const isSelected = line.is_approved;
                return (
                  <tr key={line.so_line_id || index} className={`group transition-colors ${isSelected ? 'bg-[#f0fdf4] dark:bg-[#131c2b]' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    {/* Sticky Column: Approve */}
                    <td className={`${tdClass} text-center sticky left-0 ${stickyCellClass} ${isSelected ? 'bg-[#f0fdf4] dark:bg-[#131c2b]' : 'bg-white dark:bg-gray-900'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          if (readOnly) return;
                          updateLine(index, 'is_approved', !isSelected);
                          if (!isSelected && line.approved_qty === 0) {
                            updateLine(index, 'approved_qty', line.qty_ordered);
                          }
                        }}
                        disabled={readOnly}
                        className={`p-1 rounded transition-colors ${isSelected ? 'text-emerald-600 dark:text-emerald-400 scale-110' : 'text-gray-300 hover:text-emerald-600'} disabled:opacity-50`}
                      >
                        {isSelected ? <CheckSquare size={22} strokeWidth={2.5} /> : <Square size={22} strokeWidth={2} />}
                      </button>
                    </td>

                    {/* Sticky Column: Index */}
                    <td className={`${tdClass} text-center text-gray-400 font-mono sticky left-16 ${stickyCellClass} ${isSelected ? 'bg-[#f0fdf4] dark:bg-[#131c2b]' : 'bg-white dark:bg-gray-900'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </td>

                    {/* Sticky Column: Item Code */}
                    <td className={`${tdClass} sticky left-[120px] ${stickyCellClass} ${isSelected ? 'bg-[#f0fdf4] dark:bg-[#131c2b]' : 'bg-white dark:bg-gray-900'}`}>
                      <input
                        value={line.item_code || ''}
                        readOnly
                        className={`${inputClass} bg-gray-50/80 italic cursor-not-allowed text-emerald-700 dark:text-emerald-300 font-bold border-transparent`}
                      />
                    </td>

                    {/* Item Name */}
                    <td className={tdClass}>
                      <input
                        value={line.item_name || ''}
                        readOnly
                        className={`${inputClass} bg-gray-50/30 italic cursor-not-allowed border-transparent truncate`}
                      />
                    </td>

                    {/* Qty Ordered */}
                    <td className={`${tdClass} text-center font-semibold text-gray-700 dark:text-gray-300 bg-emerald-50/10 dark:bg-emerald-900/5`}>
                      {Number(line.qty_ordered).toLocaleString()}
                    </td>

                    {/* Approved Qty */}
                    <td className={`${tdClass} bg-emerald-50/20 dark:bg-emerald-900/5`}>
                      <input
                        type="number"
                        min="0"
                        max={line.qty_ordered}
                        step="1"
                        value={line.approved_qty}
                        onChange={(e) => {
                          let val = Number(e.target.value);
                          if (val > line.qty_ordered) val = line.qty_ordered;
                          updateLine(index, 'approved_qty', val);
                          if (val > 0 && !isSelected) updateLine(index, 'is_approved', true);
                          else if (val === 0 && isSelected) updateLine(index, 'is_approved', false);
                        }}
                        readOnly={readOnly || !isSelected}
                        className={`${inputClass} text-center font-bold ${
                          !isSelected || readOnly 
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed' 
                            : 'bg-white dark:bg-gray-800 font-bold text-emerald-700 dark:text-emerald-400 border-emerald-500 ring-1 ring-emerald-500/20'
                        }`}
                      />
                    </td>

                    {/* UOM */}
                    <td className={tdClass}>
                      <div className={`${inputClass} bg-gray-50/50 italic cursor-not-allowed text-center flex items-center justify-center text-gray-500 border-transparent`}>
                        {line.uom_name || '-'}
                      </div>
                    </td>

                    {/* Unit Price */}
                    <td className={`${tdClass} text-right font-bold text-blue-600 dark:text-blue-400`}>
                      {fmt(Number(line.unit_price))}
                      <div className="flex justify-end mt-1">
                        <PriceSourceBadge 
                          priceSourceName={line.price_source_name}
                          priceLevelPriority={line.price_level_priority}
                          priceLevelNames={priceLevelNames}
                          unitPrice={line.unit_price}
                        />
                      </div>
                    </td>

                    {/* Discount */}
                    <td className={`${tdClass} text-right`}>
                      <div className="flex flex-col items-end">
                        <span className="text-orange-500 dark:text-orange-400 font-medium text-xs">{line.discount_expression || '0'}</span>
                        {Number(line.discount_amount) > 0 && (
                          <span className="text-[10px] font-bold text-red-500 dark:text-red-400">-{fmt(Number(line.discount_amount))}</span>
                        )}
                      </div>
                    </td>

                    {/* Net Total */}
                    <td className={`${tdClass} text-right font-bold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'} bg-emerald-50/10 dark:bg-emerald-900/5`}>
                      {fmt(Number(line.approved_net_amount))}
                    </td>

                    {/* Warehouse */}
                    <td className={tdClass}>
                      <input
                        value={getWarehouseDisplayName(line)}
                        readOnly
                        className={`${inputClass} bg-gray-50/30 italic cursor-not-allowed border-transparent text-gray-500`}
                        placeholder="-"
                      />
                    </td>

                    {/* Location */}
                    <td className={tdClass}>
                      <input
                        value={getLocationDisplayName(line)}
                        readOnly
                        className={`${inputClass} bg-gray-50/30 italic cursor-not-allowed border-transparent text-gray-500`}
                        placeholder="-"
                      />
                    </td>

                    {/* Lot Number */}
                    <td className={tdClass}>
                      <input
                        value={line.lot_no || (line.lot_id && line.lot_id !== '0' ? String(line.lot_id) : '')}
                        readOnly
                        className={`${inputClass} bg-orange-50/30 dark:bg-orange-900/5 italic cursor-not-allowed border-transparent font-bold text-orange-600 dark:text-orange-400`}
                        placeholder="-"
                      />
                    </td>

                    {/* Remarks */}
                    <td className={tdClass}>
                      <input
                        value={line.remarks || ''}
                        onChange={(e) => updateLine(index, 'remarks', e.target.value)}
                        readOnly={readOnly}
                        placeholder="หมายเหตุรายการ..."
                        className={`${inputClass} ${readOnly ? 'bg-gray-50 italic cursor-not-allowed' : 'bg-white dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700'}`}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};