import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PRService } from '@/modules/procurement/services/pr.service';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
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

interface ExtendedPRHeader {
  pr_id: number;
  pr_no?: string;
  pr_date?: string;
  delivery_date?: string;
  credit_days?: number;
  payment_term_days?: number;
  pr_discount_raw?: string;
  pr_tax_rate?: number | string;
  remark?: string;
  cost_center_code?: string;
  cost_center_id?: number;
  preferred_vendor_id?: number;
  vendor_id?: number;
  vendor_code?: string;
  vendor_name?: string;
  vendor_phone?: string;
  vendor_tel?: string;
  vendor_address?: string;
  pr_lines?: Array<{
    item_id?: number | string;
    item_code?: string;
    item_name?: string;
    description?: string;
    qty?: number | string;
    qty_approved?: number | string;
    qtyApproved?: number | string;
    uom_id?: number | string;
    uom_name?: string;
    uom?: string;
    est_unit_price?: number | string;
    unit_price?: number | string;
    unitPrice?: number | string;
    line_discount_raw?: string | number;
    discount_expression?: string | number;
  }>;
  lines?: Array<{
    item_id?: number | string;
    item_code?: string;
    item_name?: string;
    description?: string;
    qty?: number | string;
    qty_approved?: number | string;
    qtyApproved?: number | string;
    uom_id?: number | string;
    uom_name?: string;
    uom?: string;
    est_unit_price?: number | string;
    unit_price?: number | string;
    unitPrice?: number | string;
    line_discount_raw?: string | number;
    discount_expression?: string | number;
  }>;
}

export default function PrintPRPage() {
  const { id } = useParams<{ id: string }>();
  const prId = Number(id);

  const { data: prPrintData, isLoading, error } = useQuery({
    queryKey: ['pr-detail-print', prId],
    queryFn: async () => {
      const [pr, masterItems, masterUoms] = await Promise.all([
        PRService.getDetail(prId),
        MasterDataService.getItems(),
        MasterDataService.getUOMs().catch(() => [])
      ]);

      const vendorId = pr.preferred_vendor_id ?? pr.vendor_id;
      let vendorInfo = null;
      if (vendorId) {
        try {
          vendorInfo = await VendorService.getById(Number(vendorId));
        } catch (e) {
          console.error('Failed to load vendor details:', e);
        }
      }
      return { pr, vendorInfo, masterItems, masterUoms };
    },
    enabled: !!prId,
  });

  if (isLoading) {
    return (
      <div className="print-shell flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>กำลังโหลดข้อมูลใบขอซื้อ...</div>
        </div>
      </div>
    );
  }

  if (error || !prPrintData || !prPrintData.pr) {
    return (
      <div className="print-shell flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-red-200">
          <div className="text-red-500 text-xl font-bold mb-2">เกิดข้อผิดพลาด</div>
          <div>ไม่พบข้อมูลใบขอซื้อ หรือไม่สามารถดึงข้อมูลได้</div>
        </div>
      </div>
    );
  }

  const pr = prPrintData.pr as unknown as ExtendedPRHeader;
  const vendorInfo = prPrintData.vendorInfo;
  const masterItems = prPrintData.masterItems || [];
  const masterUoms = prPrintData.masterUoms || [];

  // Map backend lines to PrintRow format
  const rows: PrintRow[] = (pr.pr_lines || pr.lines || []).map((line) => {
    const qty = Number(line.qty || 0);
    const qtyApproved = Number(line.qty_approved || line.qtyApproved || 0);
    // PR stores prices in est_unit_price
    const unitPrice = Number(line.est_unit_price || line.unit_price || line.unitPrice || 0);
    const discountExpr = line.line_discount_raw || line.discount_expression || '';
    
    // Calculate line-level gross and discount
    const gross = qty * unitPrice;
    const discountAmount = parseDiscountAmount(discountExpr, gross);
    const amount = gross - discountAmount;
    
    // Find item in master data to get code/name
    const matchedItem = masterItems.find((i) => String(i.item_id) === String(line.item_id));
    const matchedUnit = masterUoms.find((u) => String(u.uom_id) === String(line.uom_id));

    const rawLine = line as unknown as {
      item_code?: string;
      itemCode?: string;
      item?: { item_code?: string; itemCode?: string; code?: string };
    };
    const itemCode = matchedItem?.item_code || rawLine.item_code || rawLine.itemCode || rawLine.item?.item_code || rawLine.item?.itemCode || rawLine.item?.code || '';
    const itemName = matchedItem?.item_name || line.item_name || line.description || '';
    const uomName = matchedUnit?.uom_name || line.uom_name || line.uom || '';

    return {
      code: itemCode,
      name: itemName,
      qty,
      qtyApproved,
      uom: uomName,
      unitPrice,
      discount: discountExpr,
      amount,
    };
  });

  // Calculations for summary
  const subtotal = rows.reduce((acc, row) => acc + (row.amount || 0), 0);
  const globalDiscount = parseDiscountAmount(pr.pr_discount_raw, subtotal);
  
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
  const prExtObj = pr as unknown as { vendor_phone?: string; vendor_tel?: string; vendor_fax?: string; fax?: string; vendor_address?: string; vendor_code?: string; vendor_name?: string } | undefined;

  const vendorCode = vendorInfoObj?.vendor_code || prExtObj?.vendor_code || '';
  const vendorName = vendorInfoObj?.vendor_name || prExtObj?.vendor_name || '';
  const vendorPhone = vendorInfoObj?.phone || vendorInfoObj?.tel || defaultAddressObj?.phone || defaultAddressObj?.tel || prExtObj?.vendor_phone || prExtObj?.vendor_tel || '';
  const vendorFax = vendorInfoObj?.fax || vendorInfoObj?.vendor_fax || defaultAddressObj?.fax || defaultAddressObj?.vendor_fax || prExtObj?.vendor_fax || prExtObj?.fax || '';
  const vendorAddress = addrParts.join(' ') || prExtObj?.vendor_address || '';

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

  const creditDays = pr.credit_days ?? pr.payment_term_days ?? 0;

  const rightFields = [
    { label: 'เลขที่เอกสาร:', value: pr.pr_no || '-' },
    { label: 'วันที่เอกสาร:', value: fmtDate(pr.pr_date) },
    { label: 'วันที่กำหนดส่ง:', value: fmtDate(pr.delivery_date) },
    { label: 'จำนวนวันเครดิต:', value: creditDays ? `${creditDays} วัน` : '-' },
  ];

  return (
    <PrintAuthGate>
      <div className="print-shell">
        <PrintToolbar />
        <A4Page>
          <FormTitle title="ใบขอซื้อ (Purchase Requisition)" />
          <HeaderGrid topLeft={topLeft} left={leftFields} right={rightFields} />
          <ItemsTable
            columns={['code', 'name', 'qty', 'uom', 'unitPrice', 'discount', 'amount']}
            rows={rows}
            minRows={12}
          />
          <SummaryBlock
            subtotal={subtotal}
            discount={globalDiscount}
            vatRate={pr.pr_tax_rate != null ? Number(pr.pr_tax_rate) : 7}
            notes={pr.remark || ''}
            costCode={pr.cost_center_code || (pr.cost_center_id ? String(pr.cost_center_id) : '')}
          />
          <SignatureRow slots={['ผู้จัดทำ', 'ผู้ตรวจสอบ', 'ผู้อนุมัติ']} />
        </A4Page>
      </div>
    </PrintAuthGate>
  );
}
