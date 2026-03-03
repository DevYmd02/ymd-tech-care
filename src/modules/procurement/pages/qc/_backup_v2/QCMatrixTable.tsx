import React from 'react';
import { CheckCircle2, Circle, Search } from 'lucide-react';
import type { MatrixRow, VendorTotal } from '../hooks/useQCMatrix';

interface QCMatrixTableProps {
  matrixData: MatrixRow[];
  vendorTotals: VendorTotal[];
  onSelectWinner: (item_code: string, vq_id: string) => void;
  onSelectAllForVendor: (vq_id: string) => void;
  onOpenProductSearch?: (item_code: string) => void;
}

export const QCMatrixTable: React.FC<QCMatrixTableProps> = ({
  matrixData,
  vendorTotals,
  onSelectWinner,
  onSelectAllForVendor,
  onOpenProductSearch
}) => {
  if (vendorTotals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
        กรุณาเลือกใบเสนอราคา (VQ) ที่ต้องการเปรียบเทียบ
      </div>
    );
  }

  // Calculate lowest grand total to highlight
  const minGrandTotal = Math.min(...vendorTotals.filter(v => v.grand_total > 0).map(v => v.grand_total));

  // To make sticky work correctly, we need precise widths.
  // Col 1: No (w-12 = 48px)
  // Col 2: Code (w-32 = 128px)
  // Col 3: Desc (w-48 = 192px)
  // Col 4: Qty/Unit (w-24 = 96px)
  // Total sticky width = 48 + 128 + 192 + 96 = 464px

  const baseThClass = "px-2 py-3 text-sm font-medium border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 whitespace-nowrap sticky top-0 shadow-[0_1px_0_0_#e5e7eb] dark:shadow-[0_1px_0_0_#374151]";
  // Corners (Top-Left) need highest z-index
  const stickyLeftTh1 = `left-0 z-50 w-12 text-center border-r shadow-[1px_1px_0_0_#e5e7eb] dark:shadow-[1px_1px_0_0_#374151] ${baseThClass}`;
  const stickyLeftTh2 = `left-[48px] z-50 w-32 text-left border-r shadow-[1px_1px_0_0_#e5e7eb] dark:shadow-[1px_1px_0_0_#374151] ${baseThClass}`;
  const stickyLeftTh3 = `left-[176px] z-50 w-48 text-left border-r shadow-[1px_1px_0_0_#e5e7eb] dark:shadow-[1px_1px_0_0_#374151] ${baseThClass}`;
  const stickyLeftTh4 = `left-[368px] z-50 w-24 text-center border-r shadow-[1px_1px_0_0_#e5e7eb] dark:shadow-[1px_1px_0_0_#374151] ${baseThClass}`;
  
  // Regular top headers
  const regularThClass = `${baseThClass} z-30`;
  
  const baseTdClass = "px-2 py-2 text-sm border-b border-gray-200 dark:border-gray-700 whitespace-nowrap";
  const stickyLeftTd1 = `sticky left-0 z-10 w-12 text-center bg-white dark:bg-gray-900 border-r shadow-[1px_0_0_0_#e5e7eb] dark:shadow-[1px_0_0_0_#374151] ${baseTdClass}`;
  const stickyLeftTd2 = `sticky left-[48px] z-10 w-32 text-left bg-white dark:bg-gray-900 border-r shadow-[1px_0_0_0_#e5e7eb] dark:shadow-[1px_0_0_0_#374151] ${baseTdClass}`;
  const stickyLeftTd3 = `sticky left-[176px] z-10 w-48 text-left bg-white dark:bg-gray-900 border-r shadow-[1px_0_0_0_#e5e7eb] dark:shadow-[1px_0_0_0_#374151] overflow-hidden text-ellipsis ${baseTdClass}`;
  const stickyLeftTd4 = `sticky left-[368px] z-10 w-24 text-center bg-white dark:bg-gray-900 border-r shadow-[1px_0_0_0_#e5e7eb] dark:shadow-[1px_0_0_0_#374151] ${baseTdClass}`;

  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm w-full max-w-full relative max-h-[600px]">
      <table className="w-full border-collapse min-w-max">
        <thead>
          <tr>
            <th className={stickyLeftTh1}>ลำดับ</th>
            <th className={stickyLeftTh2}>รหัสสินค้า</th>
            <th className={stickyLeftTh3}>รายละเอียดสินค้า</th>
            <th className={stickyLeftTh4}>จำนวน : หน่วย</th>
            
            {/* Dynamic Vendor Column Headers */}
            {vendorTotals.map(vendor => {
              const isLowest = vendor.grand_total === minGrandTotal && vendor.grand_total > 0;
              return (
                <th key={vendor.vq_id} className={`text-center min-w-[200px] border-l border-gray-200 dark:border-gray-700 ${isLowest ? 'bg-amber-50 dark:bg-amber-900/20' : ''} ${regularThClass}`}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-700 dark:text-blue-400 truncate max-w-[150px]" title={vendor.vendor_name}>
                        {vendor.vendor_name}
                      </span>
                      {isLowest && (
                        <span className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-[10px] px-1.5 py-0.5 rounded border border-amber-200 uppercase font-black tracking-tighter">
                          BEST PRICE
                        </span>
                      )}
                    </div>
                    <button 
                      type="button"
                      onClick={() => onSelectAllForVendor(vendor.vq_id)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors flex items-center gap-1.5 ${
                        vendor.is_all_won 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-600' 
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {vendor.is_all_won ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Circle size={14} />}
                      <span className="font-medium">{vendor.is_all_won ? 'เลือกทั้งหมดแล้ว' : 'เลือกเจ้านี้ทั้งหมด'}</span>
                    </button>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {matrixData.map((row, index) => (
            <tr key={row.item_id} className="hover:bg-blue-50/50 dark:hover:bg-gray-800/50 transition-colors group">
              <td className={`group-hover:bg-blue-50/50 dark:group-hover:bg-gray-800/50 ${stickyLeftTd1}`}>{index + 1}</td>
              <td className={`group-hover:bg-blue-50/50 dark:group-hover:bg-gray-800/50 ${stickyLeftTd2}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate" title={row.code}>{row.code}</span>
                  {onOpenProductSearch && (
                    <button 
                      type="button"
                      onClick={() => onOpenProductSearch(row.code)}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded transition-colors"
                      title="ค้นหาสินค้า"
                    >
                      <Search size={14} />
                    </button>
                  )}
                </div>
              </td>
              <td className={`group-hover:bg-blue-50/50 dark:group-hover:bg-gray-800/50 ${stickyLeftTd3}`} title={row.description}>
                {row.description}
              </td>
              <td className={`group-hover:bg-blue-50/50 dark:group-hover:bg-gray-800/50 ${stickyLeftTd4}`}>
                {row.qty} : {row.unit}
              </td>

              {/* Dynamic Vendor Cells */}
              {vendorTotals.map(vendor => {
                const cell = row.vendors[vendor.vq_id];
                const isLowest = vendor.grand_total === minGrandTotal && vendor.grand_total > 0;
                
                if (cell?.is_no_quote) {
                  return (
                    <td key={vendor.vq_id} className={`border-l border-gray-200 dark:border-gray-700 text-center text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800/30 ${baseTdClass}`}>
                      ไม่เสนอราคา
                    </td>
                  );
                }

                return (
                  <td key={vendor.vq_id} className={`border-l border-gray-200 dark:border-gray-700 ${cell?.is_winner ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : isLowest ? 'bg-amber-50/20 dark:bg-amber-900/5' : ''} ${baseTdClass}`}>
                    <div className="flex flex-col items-center justify-center gap-1.5 min-w-[200px]">
                      <div className="flex items-center gap-4 text-xs">
                         <div className="text-right">
                           <span className="text-gray-500 mr-1">@</span>
                           <span className="font-medium text-gray-700 dark:text-gray-300">
                             {cell?.unit_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                           </span>
                         </div>
                         <div className="font-bold text-[13px] text-gray-900 dark:text-gray-100">
                           {cell?.total_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                         </div>
                      </div>
                      
                      <button 
                        type="button"
                        onClick={() => onSelectWinner(row.item_id, vendor.vq_id)}
                        className={`mt-1 p-1 rounded-full transition-colors ${
                          cell?.is_winner 
                            ? 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200' 
                            : 'text-gray-300 dark:text-gray-600 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title={cell?.is_winner ? 'ยกเลิกการเลือก' : 'เลือกเป็นผู้ชนะบรรทัดนี้'}
                      >
                         {cell?.is_winner ? <CheckCircle2 size={24} className="fill-white dark:fill-gray-900" /> : <Circle size={24} />}
                      </button>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className={`text-right font-bold bg-gray-100 dark:bg-gray-800 shadow-[1px_0_0_0_#e5e7eb] dark:shadow-[1px_0_0_0_#374151] border-t border-l border-gray-300 dark:border-gray-600 ${baseTdClass} sticky left-0 z-20`}>
              <div className="pr-4 uppercase text-[11px] tracking-wider text-gray-500 mb-1">Total Winning (Awarded)</div>
              <div className="pr-4 text-blue-700 dark:text-blue-400">รวมมูลค่าที่ได้รับเลือก :</div>
            </td>
            {vendorTotals.map(vendor => (
              <td key={vendor.vq_id} className={`text-center bg-gray-50 dark:bg-gray-800/50 border-t border-l border-gray-300 dark:border-gray-600 ${baseTdClass}`}>
                <div className="flex flex-col items-center">
                   {vendor.winning_total > 0 ? (
                      <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                        {vendor.winning_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                   ) : (
                      <span className="font-medium text-gray-400 text-lg">-</span>
                   )}
                   <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700 w-full px-4">
                     <div className="flex justify-between text-[10px] text-gray-500">
                        <span>Grand Total:</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          {vendor.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                     </div>
                   </div>
                </div>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
