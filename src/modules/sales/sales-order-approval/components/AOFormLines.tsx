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

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <Package size={20} strokeWidth={2.5} />
          <h3 className="text-lg font-bold">รายการสินค้า (Sales Order Lines)</h3>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm text-left">
          <thead className="bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-300 font-bold border-b border-emerald-100 dark:border-emerald-800">
            <tr>
              <th className="px-4 py-3 text-center w-14">
                <button
                  type="button"
                  onClick={() => toggleAll(!allSelected)}
                  disabled={readOnly}
                  className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 rounded transition-colors disabled:opacity-50"
                >
                  {allSelected ? <CheckSquare size={18} /> : (someSelected ? <Square className="opacity-50" size={18} /> : <Square size={18} />)}
                </button>
              </th>
              <th className="px-4 py-3">รหัสสินค้า / ชื่อสินค้า</th>
              <th className="px-4 py-3 text-right">จำนวนสั่งซื้อ</th>
              <th className="px-4 py-3 text-center">หน่วย</th>
              <th className="px-4 py-3 text-right">ราคา/หน่วย</th>
              <th className="px-4 py-3 text-right">ส่วนลด</th>
              <th className="px-4 py-3 text-right">จำนวนอนุมัติ</th>
              <th className="px-4 py-3 text-right">ยอดสุทธิ (อนุมัติ)</th>
              <th className="px-4 py-3">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {lines.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  ไม่มีรายการสินค้า
                </td>
              </tr>
            ) : (
              lines.map((line, index) => {
                const isSelected = line.is_approved;
                return (
                  <tr key={line.so_line_id || index} className={`hover:bg-emerald-50/30 dark:hover:bg-emerald-900/5 transition-colors ${isSelected ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                    <td className="px-4 py-3 text-center">
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
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{line.item_name || '-'}</div>
                      <div className="text-xs text-gray-500 font-mono">{line.item_code || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{Number(line.qty_ordered).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">{line.uom_name || '-'}</td>
                    <td className="px-4 py-3 text-right font-mono">{Number(line.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      <div>{line.discount_expression || '-'}</div>
                      {Number(line.discount_amount) > 0 && <div className="text-[10px] text-red-500">({Number(line.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })})</div>}
                    </td>
                    <td className="px-4 py-3 w-32">
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
                        className={`w-full h-8 px-2 text-right text-sm border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 ${!isSelected || readOnly ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : 'bg-white dark:bg-gray-800 font-bold text-emerald-700'}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {Number(line.approved_net_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={line.remarks || ''}
                        onChange={(e) => updateLine(index, 'remarks', e.target.value)}
                        readOnly={readOnly}
                        placeholder="หมายเหตุ"
                        className="w-full h-8 px-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-50"
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
