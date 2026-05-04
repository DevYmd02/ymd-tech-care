import React from 'react';
import { Package, CheckSquare, Square } from 'lucide-react';
import type { AOLineFormData } from '../schemas/ao.schema';

interface Props {
  lines: AOLineFormData[];
  updateLine: (index: number, field: keyof AOLineFormData, value: unknown) => void;
  readOnly?: boolean;
}

export const AOFormLines: React.FC<Props> = ({
  lines,
  updateLine,
  readOnly = false,
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

  const thClass = 'px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700';
  const tdClass = 'px-2 py-2.5 text-sm align-middle';

  const fmt = (val: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <Package size={18} strokeWidth={2.5} />
          <h3 className="text-base font-bold">รายการสินค้า (Sales Order Lines)</h3>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              <th className={`${thClass} w-14 text-center`}>
                <button
                  type="button"
                  onClick={() => toggleAll(!allSelected)}
                  disabled={readOnly}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                >
                  {allSelected ? <CheckSquare size={16} /> : (someSelected ? <Square className="opacity-50" size={16} /> : <Square size={16} />)}
                </button>
              </th>
              <th className={thClass}>รหัสสินค้า / ชื่อสินค้า</th>
              <th className={`${thClass} text-right`}>จำนวนสั่งซื้อ</th>
              <th className={`${thClass} text-center`}>หน่วย</th>
              <th className={`${thClass} text-right`}>ราคา/หน่วย</th>
              <th className={`${thClass} text-right`}>ส่วนลด</th>
              <th className={`${thClass} text-right`}>จำนวนอนุมัติ</th>
              <th className={`${thClass} text-right`}>ยอดสุทธิ (อนุมัติ)</th>
              <th className={thClass}>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {lines.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <Package size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-400 text-sm">ไม่มีรายการสินค้า</p>
                </td>
              </tr>
            ) : (
              lines.map((line, index) => {
                const isSelected = line.is_approved;
                return (
                  <tr key={line.so_line_id || index} className={`transition-colors ${isSelected ? 'bg-emerald-50/40 dark:bg-emerald-900/5 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/20'}`}>
                    <td className={`${tdClass} text-center`}>
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
                        className={`p-1 rounded transition-colors ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 hover:text-emerald-600'} disabled:opacity-50`}
                      >
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-gray-100">{line.item_name || '-'}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-tight">{line.item_code || '-'}</span>
                      </div>
                    </td>
                    <td className={`${tdClass} text-right font-semibold text-gray-700 dark:text-gray-300`}>
                      {Number(line.qty_ordered).toLocaleString()}
                    </td>
                    <td className={`${tdClass} text-center text-gray-500 dark:text-gray-400 italic`}>
                      {line.uom_name || '-'}
                    </td>
                    <td className={`${tdClass} text-right font-bold text-blue-600 dark:text-blue-400`}>
                      {fmt(Number(line.unit_price))}
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <div className="flex flex-col items-end">
                        <span className="text-orange-500 dark:text-orange-400 font-medium">{line.discount_expression || '-'}</span>
                        {Number(line.discount_amount) > 0 && (
                          <span className="text-[10px] font-bold text-red-500 dark:text-red-400">-{fmt(Number(line.discount_amount))}</span>
                        )}
                      </div>
                    </td>
                    <td className={`${tdClass} w-32`}>
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
                        className={`w-full h-8 px-2 text-right text-sm border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all ${
                          !isSelected || readOnly 
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed' 
                            : 'bg-white dark:bg-gray-800 font-bold text-emerald-700 dark:text-emerald-400 border-emerald-500 ring-1 ring-emerald-500/20'
                        }`}
                      />
                    </td>
                    <td className={`${tdClass} text-right font-bold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                      {fmt(Number(line.approved_net_amount))}
                    </td>
                    <td className={tdClass}>
                      <input
                        type="text"
                        value={line.remarks || ''}
                        onChange={(e) => updateLine(index, 'remarks', e.target.value)}
                        readOnly={readOnly}
                        placeholder="..."
                        className="w-full h-8 px-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 italic text-gray-500"
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

