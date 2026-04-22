/**
 * @file AQFormLines.tsx
 * @description Line table for AQ form — shows SQ lines with approval checkboxes + approved_qty
 * @pattern Mirrors AVFormLines.tsx
 */

import { Package, Tag } from 'lucide-react';
import type { AQLineFormData } from '../schemas/aq.schema';

interface AQFormLinesProps {
  lines: AQLineFormData[];
  updateLine: (index: number, field: keyof AQLineFormData, value: unknown) => void;
  readOnly?: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const fmtQty = (n: number) =>
  new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(n || 0);

export function AQFormLines({ lines, updateLine, readOnly = false }: AQFormLinesProps) {
  const thClass =
    'px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700';
  const tdClass = 'px-2 py-2 text-sm align-middle';
  const inputClass =
    'h-8 w-full px-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-white transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800/50';

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
        <Package size={18} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
          รายการสินค้า/บริการ — พิจารณาอนุมัติ
        </h3>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              <th className={`${thClass} w-20 text-center`}>✓ อนุมัติ</th>
              <th className={`${thClass} w-10 text-center`}>ลำดับ</th>
              <th className={`${thClass} min-w-[130px]`}>รหัสสินค้า</th>
              <th className={`${thClass} min-w-[250px]`}>ชื่อสินค้า</th>
              <th className={`${thClass} w-28 text-center`}>จำนวนเสนอ</th>
              <th className={`${thClass} w-36 text-center`}>จำนวนอนุมัติ</th>
              <th className={`${thClass} w-24 text-center`}>หน่วย</th>
              <th className={`${thClass} w-28 text-right`}>ราคา/หน่วย</th>
              <th className={`${thClass} w-28 text-right`}>ส่วนลด</th>
              <th className={`${thClass} w-32 text-right`}>ยอดสุทธิ (เสนอ)</th>
              <th className={`${thClass} w-32 text-right`}>ยอดที่อนุมัติ</th>
              <th className={`${thClass} min-w-[150px]`}>หมายเหตุรายการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {lines.map((line, index) => {
              const isApproved = line.is_approved;
              return (
                <tr
                  key={index}
                  className={`transition-colors ${
                    isApproved
                      ? 'bg-emerald-50/40 dark:bg-emerald-900/5 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10'
                      : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/20'
                  }`}
                >
                  {/* Checkbox อนุมัติ */}
                  <td className={`${tdClass} text-center`}>
                    <input
                      type="checkbox"
                      checked={!!isApproved}
                      disabled={readOnly}
                      onChange={(e) => updateLine(index, 'is_approved', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>

                  {/* ลำดับ */}
                  <td className={`${tdClass} text-center text-gray-500 font-medium`}>{index + 1}</td>

                  {/* รหัสสินค้า */}
                  <td className={tdClass}>
                    <input
                      value={line.item_code || ''}
                      readOnly
                      className={`${inputClass} bg-gray-50/80 italic cursor-not-allowed text-emerald-700 dark:text-emerald-300 font-semibold`}
                    />
                  </td>

                  {/* ชื่อสินค้า */}
                  <td className={tdClass}>
                    <input
                      value={line.item_name || ''}
                      readOnly
                      className={`${inputClass} bg-gray-50/50 italic cursor-not-allowed`}
                    />
                  </td>

                  {/* จำนวนเสนอ */}
                  <td className={`${tdClass} text-center`}>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {fmtQty(line.qty)}
                    </span>
                  </td>

                  {/* จำนวนอนุมัติ */}
                  <td className={tdClass}>
                    <input
                      type="number"
                      step="0.001"
                      min={0}
                      max={line.qty}
                      value={line.approved_qty ?? 0}
                      disabled={readOnly || !isApproved}
                      onChange={(e) => updateLine(index, 'approved_qty', Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      className={`${inputClass} text-center font-bold ${
                        !isApproved 
                          ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 cursor-not-allowed border-gray-200' 
                          : 'text-emerald-700 dark:text-emerald-400 border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-900/10'
                      }`}
                    />
                  </td>

                  {/* หน่วย */}
                  <td className={tdClass}>
                    <input
                      value={line.uom_name || String(line.uom_id || '')}
                      readOnly
                      className={`${inputClass} bg-gray-50/50 italic cursor-not-allowed text-center`}
                    />
                  </td>

                  {/* ราคา/หน่วย */}
                  <td className={`${tdClass} text-right`}>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-base">
                        {fmt(line.unit_price)}
                      </span>
                      
                      {/* 🏷️ Price Source Badge */}
                      {(() => {
                        const source = String(line.price_source_name || '').toUpperCase();
                        if (!source) return null;

                        const config: Record<string, { label: string; class: string }> = {
                          'MANUAL': { label: 'Manual', class: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30' },
                          'PRICE_LEVEL': { label: 'Price Level', class: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30' },
                          'PRICE_LIST': { label: 'Price List', class: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' },
                        };

                        const item = config[source] || { label: source, class: 'bg-gray-50 text-gray-600 border-gray-200' };

                        return (
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-tight ${item.class}`}>
                            <Tag size={10} strokeWidth={3} />
                            {item.label}
                          </div>
                        );
                      })()}
                    </div>
                  </td>

                  {/* ส่วนลด */}
                  <td className={`${tdClass} text-right`}>
                    <span className="text-orange-500 dark:text-orange-400">
                      {line.discount_expression && line.discount_expression !== '0'
                        ? line.discount_expression
                        : fmt(line.discount_amount)}
                    </span>
                  </td>

                  {/* ยอดสุทธิเสนอ */}
                  <td className={`${tdClass} text-right font-bold text-gray-900 dark:text-gray-100`}>
                    {fmt(line.net_amount)}
                  </td>

                  {/* ยอดที่อนุมัติ */}
                  <td className={`${tdClass} text-right font-bold`}>
                    <span className={isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}>
                      {fmt(line.approved_net_amount || 0)}
                    </span>
                  </td>

                  {/* หมายเหตุรายการ */}
                  <td className={tdClass}>
                    <input
                      type="text"
                      value={line.remarks || ''}
                      disabled={readOnly}
                      placeholder="..."
                      onChange={(e) => updateLine(index, 'remarks', e.target.value)}
                      className={`${inputClass} italic text-gray-500`}
                    />
                  </td>
                </tr>
              );
            })}

            {lines.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-12 text-center">
                  <Package size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-400 text-sm">ไม่มีรายการสินค้า</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
