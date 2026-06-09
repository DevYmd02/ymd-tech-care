import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { POAService } from '@/modules/procurement/services/poa.service';
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
  SignatureRow,
  type PrintRow,
} from '@/modules/procurement/shared/components/print/PrintLayout';

interface ExtendedPOAHeader {
  po_id: number;
  po_no?: string;
  poa_no?: string;
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
    qty_ordered?: number | string;
    uom_name?: string;
    unit_price?: number | string;
    discount_expression?: string | number;
  }>;
  lines?: Array<{
    item_code?: string;
    item_name?: string;
    description?: string;
    qty?: number | string;
    qty_ordered?: number | string;
    uom_name?: string;
    unit_price?: number | string;
    discount_expression?: string | number;
  }>;
}

export default function PrintPOAPage() {
  const { id } = useParams<{ id: string }>();
  const poaId = Number(id);

  const { data: poaPrintData, isLoading, error } = useQuery({
    queryKey: ['poa-detail-print', poaId],
    queryFn: async () => {
      // Fetch POA details with context 'POA'
      const poa = await POAService.getById(poaId, 'POA');
      const vendorId = poa.vendor_id;
      let vendorInfo = null;
      if (vendorId) {
        try {
          vendorInfo = await VendorService.getById(Number(vendorId));
        } catch (e) {
          console.error('Failed to load vendor details for POA:', e);
        }
      }
      return { poa, vendorInfo };
    },
    enabled: !!poaId,
  });

  if (isLoading) {
    return (
      <div className="print-shell flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>กำลังโหลดข้อมูลใบอนุมัติสั่งซื้อ...</div>
        </div>
      </div>
    );
  }

  if (error || !poaPrintData || !poaPrintData.poa) {
    return (
      <div className="print-shell flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-red-200">
          <div className="text-red-500 text-xl font-bold mb-2">เกิดข้อผิดพลาด</div>
          <div>ไม่พบข้อมูลใบอนุมัติสั่งซื้อ หรือไม่สามารถดึงข้อมูลได้</div>
        </div>
      </div>
    );
  }

  const poa = poaPrintData.poa as unknown as ExtendedPOAHeader;
  const vendorInfo = poaPrintData.vendorInfo;

  // Map backend lines to PrintRow format
  const rows: PrintRow[] = (poa.po_lines || poa.lines || []).map((line) => {
    const qty = Number(line.qty || 0); // Original Qty
    const qtyApproved = Number(line.qty_ordered || 0); // Approved Qty in this POA round
    const unitPrice = Number(line.unit_price || 0);
    const discountExpr = line.discount_expression || '';
    
    // Calculate line total based on approved quantity
    const gross = qtyApproved * unitPrice;
    const discountAmount = parseDiscountAmount(discountExpr, gross);
    const amount = gross - discountAmount;
    
    const rawLine = line as unknown as {
      item_code?: string;
      itemCode?: string;
      item?: { item_code?: string; itemCode?: string; code?: string };
    };
    const itemCode = rawLine.item_code || rawLine.itemCode || rawLine.item?.item_code || rawLine.item?.itemCode || rawLine.item?.code || '';

    return {
      code: itemCode,
      name: line.item_name || line.description || '',
      qty,
      qtyApproved,
      uom: line.uom_name || '',
      unitPrice,
      discount: discountExpr,
      amount,
    };
  });

  // Calculations for summary
  const subtotal = rows.reduce((acc, row) => acc + (row.amount || 0), 0);
  const globalDiscountExpr = poa.discount_expression || poa.base_discount_amount || poa.discount_amount || '0';
  const globalDiscount = parseDiscountAmount(globalDiscountExpr, subtotal);
  
  // Extract vendor info if available
  const addressesList = vendorInfo?.addresses || (vendorInfo as unknown as { vendorAddresses?: { is_default: boolean; address: string; sub_district?: string; district?: string; province?: string; postal_code?: string; phone?: string }[] })?.vendorAddresses || [];
  const defaultAddress = addressesList.find((a) => a.is_default) || addressesList[0];
  const addrParts: string[] = [];
  if (defaultAddress) {
    if (defaultAddress.address) addrParts.push(defaultAddress.address);
    if (defaultAddress.sub_district) addrParts.push(defaultAddress.sub_district);
    if (defaultAddress.district) addrParts.push(defaultAddress.district);
    if (defaultAddress.province) addrParts.push(defaultAddress.province);
    if (defaultAddress.postal_code) addrParts.push(defaultAddress.postal_code);
  }

  const defaultAddressObj = defaultAddress as unknown as { phone?: string; tel?: string; fax?: string; vendor_fax?: string } | undefined;
  const vendorInfoObj = vendorInfo as unknown as { phone?: string; tel?: string; fax?: string; vendor_fax?: string; vendor_code?: string; vendor_name?: string } | undefined;
  const poaExtObj = poa as unknown as { vendor_phone?: string; vendor_tel?: string; vendor_fax?: string; fax?: string; vendor_address?: string; vendor_code?: string; vendor_name?: string } | undefined;

  const vendorCode = vendorInfoObj?.vendor_code || poaExtObj?.vendor_code || '';
  const vendorName = vendorInfoObj?.vendor_name || poaExtObj?.vendor_name || '';
  const vendorPhone = vendorInfoObj?.phone || vendorInfoObj?.tel || defaultAddressObj?.phone || defaultAddressObj?.tel || poaExtObj?.vendor_phone || poaExtObj?.vendor_tel || '';
  const vendorFax = vendorInfoObj?.fax || vendorInfoObj?.vendor_fax || defaultAddressObj?.fax || defaultAddressObj?.vendor_fax || poaExtObj?.vendor_fax || poaExtObj?.fax || '';
  const vendorAddress = addrParts.join(' ') || poaExtObj?.vendor_address || '';

  const topLeft = vendorCode ? { label: 'รหัสผู้ขาย:', value: vendorCode } : undefined;

  const leftFields = [
    { label: 'ชื่อผู้ขาย:', value: vendorName || '-' },
    { label: 'ที่อยู่:', value: vendorAddress || '-' },
    { 
      label: 'โทร.:', 
      value: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span>{vendorPhone || '-'}</span>
          <span style={{ marginLeft: '40px', fontWeight: 600 }}>โทรสาร:</span>
          <span style={{ marginLeft: '8px' }}>{vendorFax || '-'}</span>
        </div>
      )
    },
  ];

  const creditDays = poa.payment_term_days ?? poa.credit_days ?? 0;

  const rightFields = [
    { label: 'เลขที่เอกสารอนุมัติ:', value: poa.poa_no || '-' },
    { label: 'เลขที่ใบสั่งซื้อ (PO):', value: poa.po_no || '-' },
    { label: 'วันที่อนุมัติ:', value: fmtDate(poa.po_date) },
    { label: 'วันที่กำหนดส่ง:', value: fmtDate(poa.delivery_date) },
    { label: 'จำนวนวันเครดิต:', value: creditDays ? `${creditDays} วัน` : '-' },
  ];

  return (
    <PrintAuthGate>
      <div className="print-shell">
        <PrintToolbar />
        <A4Page>
          <FormTitle title="ใบอนุมัติสั่งซื้อ (Purchase Order Approval)" />
          <HeaderGrid topLeft={topLeft} left={leftFields} right={rightFields} />
          <ItemsTable
            columns={['code', 'name', 'qty', 'qtyApproved', 'uom', 'unitPrice', 'discount', 'amount']}
            rows={rows}
            minRows={12}
          />
          <SummaryBlock
            subtotal={subtotal}
            discount={globalDiscount}
            vatRate={poa.tax_rate != null ? Number(poa.tax_rate) : 7}
            notes={poa.remarks || ''}
            costCode={''}
          />
          <SignatureRow slots={['ผู้เสนออนุมัติ', 'ผู้ตรวจสอบ', 'ผู้อนุมัติ']} />
        </A4Page>
      </div>
    </PrintAuthGate>
  );
}
