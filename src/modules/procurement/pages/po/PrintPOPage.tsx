import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { POService } from '@/modules/procurement/services/po.service';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import { parseDiscountAmount } from '@/modules/procurement/utils/pricing.utils';
import { fmtDate } from '@/shared/utils';
import {
  PrintAuthGate,
  PrintToolbar,
  A4Page,
  FormTitle,
  HeaderGrid,
  ItemsTable,
  SummaryBlock,
  TermsBlock,
  SignatureRow,
  type PrintRow,
} from '@/modules/procurement/shared/components/print/PrintLayout';

interface ExtendedPOHeader {
  po_id: number;
  po_no?: string;
  po_date?: string;
  delivery_date?: string;
  payment_term_days?: number;
  credit_days?: number;
  discount_expression?: string | number;
  base_discount_amount?: number | string;
  discount_amount?: number | string;
  vendor_id?: number;
  vendor_code?: string;
  vendor_name?: string;
  vendor_phone?: string;
  vendor_address?: string;
  tax_rate?: number | string;
  remarks?: string;
  po_lines?: Array<{
    item_code?: string;
    item_name?: string;
    description?: string;
    qty?: number | string;
    uom_name?: string;
    unit_price?: number | string;
    discount_expression?: string | number;
  }>;
  lines?: Array<{
    item_code?: string;
    item_name?: string;
    description?: string;
    qty?: number | string;
    uom_name?: string;
    unit_price?: number | string;
    discount_expression?: string | number;
  }>;
}

export default function PrintPOPage() {
  const { id } = useParams<{ id: string }>();
  const poId = Number(id);

  const { data: poPrintData, isLoading, error } = useQuery({
    queryKey: ['po-detail-print', poId],
    queryFn: async () => {
      const po = await POService.getById(poId);
      const vendorId = po.vendor_id;
      let vendorInfo = null;
      if (vendorId) {
        try {
          vendorInfo = await VendorService.getById(Number(vendorId));
        } catch (e) {
          console.error('Failed to load vendor details:', e);
        }
      }
      return { po, vendorInfo };
    },
    enabled: !!poId,
  });

  if (isLoading) {
    return (
      <div className="print-shell flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>กำลังโหลดข้อมูลใบสั่งซื้อ...</div>
        </div>
      </div>
    );
  }

  if (error || !poPrintData || !poPrintData.po) {
    return (
      <div className="print-shell flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-red-200">
          <div className="text-red-500 text-xl font-bold mb-2">เกิดข้อผิดพลาด</div>
          <div>ไม่พบข้อมูลใบสั่งซื้อ หรือไม่สามารถดึงข้อมูลได้</div>
        </div>
      </div>
    );
  }

  const po = poPrintData.po as unknown as ExtendedPOHeader;
  const vendorInfo = poPrintData.vendorInfo;

  // Map backend lines to PrintRow format
  const rows: PrintRow[] = (po.po_lines || po.lines || []).map((line) => {
    const qty = Number(line.qty || 0);
    const unitPrice = Number(line.unit_price || 0);
    const discountExpr = line.discount_expression || '';
    
    // Calculate line total
    const gross = qty * unitPrice;
    const discountAmount = parseDiscountAmount(discountExpr, gross);
    const amount = gross - discountAmount;
    
    return {
      code: line.item_code || '',
      name: line.item_name || line.description || '',
      qty,
      uom: line.uom_name || '',
      unitPrice,
      discount: discountExpr,
      amount,
    };
  });

  // Calculations for summary
  const subtotal = rows.reduce((acc, row) => acc + (row.amount || 0), 0);
  const globalDiscountExpr = po.discount_expression || po.base_discount_amount || po.discount_amount || '0';
  const globalDiscount = parseDiscountAmount(globalDiscountExpr, subtotal);
  
  // Extract vendor info if available
  const defaultAddress = vendorInfo?.addresses?.find((a: { is_default: boolean }) => a.is_default) || vendorInfo?.addresses?.[0];
  const addrParts: string[] = [];
  if (defaultAddress) {
    if (defaultAddress.address) addrParts.push(defaultAddress.address);
    if (defaultAddress.sub_district) addrParts.push(defaultAddress.sub_district);
    if (defaultAddress.district) addrParts.push(defaultAddress.district);
    if (defaultAddress.province) addrParts.push(defaultAddress.province);
    if (defaultAddress.postal_code) addrParts.push(defaultAddress.postal_code);
  }

  const vendorCode = vendorInfo?.vendor_code || po.vendor_code || '';
  const vendorName = vendorInfo?.vendor_name || po.vendor_name || '';
  const vendorPhone = vendorInfo?.phone || defaultAddress?.phone || po.vendor_phone || '';
  const vendorAddress = addrParts.join(' ') || po.vendor_address || '';

  const topLeft = vendorCode ? { label: 'รหัสผู้ขาย:', value: vendorCode } : undefined;

  const leftFields = [
    { label: 'ชื่อผู้ขาย:', value: vendorName || '-' },
    { label: 'ที่อยู่:', value: vendorAddress || '-' },
    { label: 'โทร.:', value: vendorPhone || '-' },
  ];

  const creditDays = po.payment_term_days ?? po.credit_days ?? 0;

  const rightFields = [
    { label: 'เลขที่เอกสาร:', value: po.po_no || '-' },
    { label: 'วันที่เอกสาร:', value: fmtDate(po.po_date) },
    { label: 'วันที่กำหนดส่ง:', value: fmtDate(po.delivery_date) },
    { label: 'จำนวนวันเครดิต:', value: creditDays ? `${creditDays} วัน` : '-' },
  ];

  return (
    <PrintAuthGate>
      <div className="print-shell">
        <PrintToolbar />
        <A4Page>
          <FormTitle title="ใบสั่งซื้อ (Purchase Order)" />
          <HeaderGrid topLeft={topLeft} left={leftFields} right={rightFields} />
          <ItemsTable
            columns={['code', 'name', 'qty', 'uom', 'unitPrice', 'discount', 'amount']}
            rows={rows}
            minRows={12}
          />
          <SummaryBlock
            subtotal={subtotal}
            discount={globalDiscount}
            vatRate={po.tax_rate != null ? Number(po.tax_rate) : 7}
            notes={po.remarks || ''}
            costCode={''}
          />
          <TermsBlock />
          <SignatureRow slots={['ผู้จัดทำ', 'ผู้ตรวจสอบ', 'ผู้อนุมัติ']} />
        </A4Page>
      </div>
    </PrintAuthGate>
  );
}
