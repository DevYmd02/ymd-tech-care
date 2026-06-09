import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QCService } from '@/modules/procurement/services/qc.service';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import { fmtDate, fmtMoneyTH } from '@/shared/utils';
import {
  PrintAuthGate,
  PrintToolbar,
  CompanyHeader,
  FormTitle,
  HeaderGrid,
  SignatureRow,
} from '@/modules/procurement/shared/components/print/PrintLayout';

interface MappedVendorCell {
  unit_price: number;
  total_price: number;
  is_no_quote: boolean;
  is_winner: boolean;
}

interface MatrixRow {
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  vendors: Record<number, MappedVendorCell>; // quotation_id or vq_header_id is the key
}

export default function PrintQCPage() {
  const { id } = useParams<{ id: string }>();
  const qcId = Number(id);

  const { data: qcPrintData, isLoading, error } = useQuery({
    queryKey: ['qc-detail-print', qcId],
    queryFn: async () => {
      const qc = await QCService.getById(qcId);
      const qcExt = qc as unknown as Record<string, unknown>;
      const rfqId = qc.rfq_id || (qcExt.rfq_header_id as number | undefined);
      
      let rfqDetail = null;
      let vqList: Record<string, unknown>[] = [];
      
      if (rfqId) {
        try {
          rfqDetail = await RFQService.getById(Number(rfqId));
          const rawVQs = await QCService.getVQsWaitingForQC(Number(rfqId));
          vqList = (rawVQs || []) as unknown as Record<string, unknown>[];
        } catch (e) {
          console.error('Failed to load RFQ or VQ details for QC print:', e);
        }
      }
      
      return { qc, rfqDetail, vqList };
    },
    enabled: !!qcId,
  });

  if (isLoading) {
    return (
      <div className="print-shell flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>กำลังโหลดข้อมูลตารางเปรียบเทียบราคา...</div>
        </div>
      </div>
    );
  }

  if (error || !qcPrintData || !qcPrintData.qc) {
    return (
      <div className="print-shell flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-red-200">
          <div className="text-red-500 text-xl font-bold mb-2">เกิดข้อผิดพลาด</div>
          <div>ไม่พบข้อมูลตารางเปรียบเทียบราคา หรือไม่สามารถดึงข้อมูลได้</div>
        </div>
      </div>
    );
  }

  const qc = qcPrintData.qc;
  const rfq = qcPrintData.rfqDetail;
  const vqList = qcPrintData.vqList || [];

  // Limit vendors to compare to max 3
  const activeVQs = vqList.slice(0, 3);
  const qcExt = qc as unknown as Record<string, unknown>;
  const winnerVQId = Number(qc.winning_vq_id || (qcExt.vq_header_id as number | undefined) || 0);

  // Extract RFQ Lines
  const rfqLines = rfq?.rfqLines || rfq?.lines || [];

  // Build Side-by-Side Matrix Rows
  const matrixRows: MatrixRow[] = (rfqLines as unknown as Record<string, unknown>[]).map((rfqLine) => {
    const itemCode = (rfqLine.item_code as string) || (rfqLine.itemCode as string) || ((rfqLine.item as Record<string, unknown>)?.item_code as string) || ((rfqLine.item as Record<string, unknown>)?.code as string) || '';
    const itemName = (rfqLine.item_name as string) || (rfqLine.itemName as string) || ((rfqLine.item as Record<string, unknown>)?.item_name as string) || ((rfqLine.item as Record<string, unknown>)?.name as string) || (rfqLine.description as string) || '';
    const qty = Number(rfqLine.qty || 0);
    const uom = (rfqLine.uom_name as string) || (rfqLine.uomName as string) || ((rfqLine.uom as Record<string, unknown>)?.uom_name as string) || ((rfqLine.uom as Record<string, unknown>)?.name as string) || 'หน่วย';

    const vendorsCells: Record<number, MappedVendorCell> = {};

    activeVQs.forEach((vq) => {
      const vqId = Number(vq.quotation_id || vq.vq_header_id || 0);
      const vqLines = (vq.vq_lines || vq.lines || []) as unknown as Record<string, unknown>[];
      const vqLine = vqLines.find((l) => l.item_code === itemCode || (l.item as Record<string, unknown>)?.item_code === itemCode);

      const unitPrice = Number(vqLine?.unit_price || vqLine?.price || 0);
      const totalPrice = vqLine?.net_amount != null ? Number(vqLine.net_amount) : (qty * unitPrice);
      const isNoQuote = !!vqLine?.no_quote || (!vqLine);
      const isWinner = winnerVQId === vqId;

      vendorsCells[vqId] = {
        unit_price: unitPrice,
        total_price: totalPrice,
        is_no_quote: isNoQuote,
        is_winner: isWinner,
      };
    });

    return {
      item_code: itemCode,
      item_name: itemName,
      qty,
      uom,
      vendors: vendorsCells,
    };
  });

  // Calculate Column Widths for Vendors
  const vendorColWidth = activeVQs.length > 0 ? `${40 / activeVQs.length}%` : '40%';

  const leftFields = [
    { label: 'เลขที่ RFQ:', value: rfq?.rfq_no || (qc.rfq_no as string) || '-' },
    { label: 'เลขที่ PR อ้างอิง:', value: (qcExt.ref_pr_no as string) || (qcExt.pr_no as string) || '-' },
  ];

  const dateVal = qc.comparison_date || qc.created_at;
  const displayDate = dateVal instanceof Date ? dateVal.toISOString() : (dateVal as string | undefined);

  const rightFields = [
    { label: 'เลขที่ตารางเปรียบเทียบ:', value: qc.qc_no || '-' },
    { label: 'วันที่เปรียบเทียบ:', value: fmtDate(displayDate) },
  ];

  return (
    <PrintAuthGate>
      <div className="print-shell">
        <PrintToolbar />
        <div className="landscape-print">
          <div className="a4-page-no">หน้า 1 / 1</div>
          <CompanyHeader />
          <div className="a4-body">
            <FormTitle title="ตารางเปรียบเทียบราคาเสนอซื้อ (Quotation Comparison)" />
            <HeaderGrid left={leftFields} right={rightFields} />
            
            <table className="items-table" style={{ fontSize: '9pt' }}>
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>ลำดับ</th>
                  <th style={{ width: '15%' }}>รหัสสินค้า</th>
                  <th style={{ width: '25%' }}>ชื่อสินค้า / รายละเอียด</th>
                  <th style={{ width: '15%' }}>จำนวน : หน่วย</th>
                  
                  {activeVQs.map((vq) => {
                    const vqId = Number(vq.quotation_id || vq.vq_header_id || 0);
                    const isWinner = winnerVQId === vqId;
                    return (
                      <th key={vqId} style={{ width: vendorColWidth }} className={isWinner ? 'bg-emerald-50 text-emerald-800' : ''}>
                        {(vq.vendor_name as string) || 'ผู้เสนอราคา'} {isWinner && '🏆'}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="ta-center">{idx + 1}</td>
                    <td className="ta-left">{row.item_code}</td>
                    <td className="ta-left">{row.item_name}</td>
                    <td className="ta-center">{row.qty.toLocaleString()} {row.uom}</td>
                    
                  {activeVQs.map((vq) => {
                    const vqId = Number(vq.quotation_id || vq.vq_header_id || 0);
                    const cell = row.vendors[vqId];
                    
                    if (cell?.is_no_quote) {
                      return (
                        <td key={vqId} className="ta-center text-gray-400 bg-gray-50/50">
                          ไม่เสนอราคา
                        </td>
                      );
                    }

                    return (
                      <td key={vqId} className={cell?.is_winner ? 'bg-emerald-50/30 font-semibold' : ''}>
                        <div className="flex justify-between px-2 text-xs">
                          <span className="text-gray-500">@{fmtMoneyTH(cell.unit_price)}</span>
                          <span className="font-bold">{fmtMoneyTH(cell.total_price)}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              
              {/* Grand Totals Footer */}
              <tr className="font-bold bg-slate-50" style={{ borderTop: '2px solid #00008B' }}>
                <td colSpan={4} className="ta-right pr-4">รวมมูลค่าทั้งสิ้น:</td>
                {activeVQs.map((vq) => {
                  const vqId = Number(vq.quotation_id || vq.vq_header_id || 0);
                  const grandTotal = Number(vq.total_amount || vq.base_total_amount || 0);
                  const isWinner = winnerVQId === vqId;
                  return (
                    <td key={vqId} className={`ta-center ${isWinner ? 'text-emerald-700 bg-emerald-50/50 font-black' : ''}`}>
                      {fmtMoneyTH(grandTotal)} THB
                    </td>
                  );
                })}
              </tr>
              
              <tr className="spacer-row" aria-hidden>
                <td colSpan={4 + activeVQs.length}>&nbsp;</td>
              </tr>
            </tbody>
          </table>
          
          <div className="mt-4 p-3 border border-[#00008B] rounded-lg text-sm bg-slate-50/50">
            <strong>ผู้ชนะเสนอราคา:</strong>{' '}
            {(() => {
              const winner = activeVQs.find((vq) => Number(vq.quotation_id || vq.vq_header_id) === winnerVQId);
              return winner ? (
                <span className="font-bold text-emerald-700">
                  {(winner.vendor_name as string)} — ยอดสุทธิ {fmtMoneyTH(Number(qc.vq_total_amount || winner.total_amount || 0))} THB
                </span>
              ) : (
                <span className="text-gray-500 italic">ไม่ได้ระบุผู้เสนอราคาที่ชนะ</span>
              );
            })()}
            {!!qcExt.remarks && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <strong>เหตุผล/หมายเหตุ:</strong> {qcExt.remarks as string}
              </div>
            )}
          </div>
        </div>
        <div className="a4-bottom">
          <SignatureRow slots={['ผู้เปรียบเทียบ', 'ผู้ตรวจสอบ', 'ผู้อนุมัติ']} />
        </div>
      </div>
    </div>
  </PrintAuthGate>
);
}
