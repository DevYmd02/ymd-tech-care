import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AVService } from '@/modules/procurement/services/av.service';
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

interface MappedPRLine {
  pr_line_id: number;
  item_id?: number | string;
  item_code?: string;
  item_name?: string;
  description?: string;
  qty?: number;
  uom?: string;
  uom_name?: string;
  uom_id?: number | string;
  warehouse_code?: string;
  warehouse_id?: number;
  location_name?: string;
  location?: string;
  est_unit_price?: number;
  unit_price?: number;
  line_discount_raw?: string;
}

export default function PrintAVPage() {
  const { id } = useParams<{ id: string }>();
  const avId = Number(id);

  const { data: avPrintData, isLoading, error } = useQuery({
    queryKey: ['av-detail-print', avId],
    queryFn: async () => {
      const [av, masterItems, masterUoms] = await Promise.all([
        AVService.getApprovalById(avId),
        MasterDataService.getItems(),
        MasterDataService.getUOMs().catch(() => [])
      ]);
      
      // Fetch linked PR details to get item details
      let prDetail = null;
      let vendorInfo = null;
      
      if (av.pr_id) {
        try {
          prDetail = await PRService.getDetail(av.pr_id);
          const vendorId = prDetail.preferred_vendor_id ?? prDetail.vendor_id;
          if (vendorId) {
            vendorInfo = await VendorService.getById(Number(vendorId));
          }
        } catch (e) {
          console.error('Failed to load linked PR or Vendor details for AV:', e);
        }
      }
      
      return { av, prDetail, vendorInfo, masterItems, masterUoms };
    },
    enabled: !!avId,
  });

  if (isLoading) {
    return (
      <div className="print-shell flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>กำลังโหลดข้อมูลใบอนุมัติขอซื้อ...</div>
        </div>
      </div>
    );
  }

  if (error || !avPrintData || !avPrintData.av) {
    return (
      <div className="print-shell flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-red-200">
          <div className="text-red-500 text-xl font-bold mb-2">เกิดข้อผิดพลาด</div>
          <div>ไม่พบข้อมูลใบอนุมัติขอซื้อ หรือไม่สามารถดึงข้อมูลได้</div>
        </div>
      </div>
    );
  }

  const av = avPrintData.av;
  const pr = avPrintData.prDetail;
  const vendorInfo = avPrintData.vendorInfo;
  const masterItems = avPrintData.masterItems || [];
  const masterUoms = avPrintData.masterUoms || [];

  // Build a lookup map for PR lines
  const prLinesMap = new Map<number, MappedPRLine>();
  const rawPRLines = pr?.lines || [];
  (rawPRLines as unknown as MappedPRLine[]).forEach((line) => {
    if (line.pr_line_id) {
      prLinesMap.set(Number(line.pr_line_id), line);
    }
  });

  // Map AV lines to PrintRow format
  const avLines = av.pr_approval_lines || av.prApprovalLines || [];
  const rows: PrintRow[] = avLines.map((line) => {
    const prLine = prLinesMap.get(Number(line.pr_line_id));
    const qtyApproved = Number(line.approved_qty || 0);
    const qtyRequested = Number(prLine?.qty || 0);
    const unitPrice = Number(prLine?.est_unit_price || prLine?.unit_price || 0);
    
    // Line discount
    const discountExpr = prLine?.line_discount_raw && prLine?.line_discount_raw !== '0' ? prLine.line_discount_raw : '';
    const gross = qtyApproved * unitPrice;
    const discountAmount = parseDiscountAmount(discountExpr, gross);
    const amount = gross - discountAmount;

    const itemId = prLine?.item_id || (line as unknown as Record<string, unknown>).item_id;
    const matchedItem = masterItems.find((i) => String(i.item_id) === String(itemId));
    const uomId = prLine?.uom_id || (line as unknown as Record<string, unknown>).uom_id;
    const matchedUnit = masterUoms.find((u) => String(u.uom_id) === String(uomId));

    // Resolve item code
    const rawLine = prLine as unknown as {
      item_code?: string;
      itemCode?: string;
      item?: { item_code?: string; itemCode?: string; code?: string };
    };
    const itemCode = matchedItem?.item_code || rawLine?.item_code || rawLine?.itemCode || rawLine?.item?.item_code || rawLine?.item?.itemCode || rawLine?.item?.code || '';
    const itemName = matchedItem?.item_name || prLine?.item_name || prLine?.description || '';
    const uomName = matchedUnit?.uom_name || prLine?.uom_name || prLine?.uom || '';

    return {
      code: itemCode,
      name: itemName,
      qty: qtyRequested,
      qtyApproved,
      uom: uomName,
      unitPrice,
      discount: discountExpr,
      amount,
    };
  });

  // Calculations for summary
  const subtotal = rows.reduce((acc, row) => acc + (row.amount || 0), 0);
  const globalDiscountExpr = av.discount_expression || pr?.pr_discount_raw || '0';
  const globalDiscount = parseDiscountAmount(globalDiscountExpr, subtotal) || Number(av.base_discount_amount || 0);
  
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
  const prExtObj = pr as unknown as { cost_center_code?: string; vendor_phone?: string; vendor_tel?: string; vendor_fax?: string; fax?: string; vendor_address?: string; vendor_code?: string; vendor_name?: string } | undefined;

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

  const rightFields = [
    { label: 'เลขที่เอกสารอนุมัติ:', value: av.approval_no || '-' },
    { label: 'เลขที่ใบขอซื้อ (PR):', value: pr?.pr_no || '-' },
    { label: 'วันที่อนุมัติ:', value: fmtDate(av.approval_date) },
    { label: 'วันที่กำหนดส่ง:', value: fmtDate(av.need_by_date || pr?.need_by_date) },
    { label: 'จำนวนวันเครดิต:', value: pr?.credit_days != null ? `${pr.credit_days} วัน` : '-' },
  ];

  return (
    <PrintAuthGate>
      <div className="print-shell">
        <PrintToolbar />
        <A4Page>
          <FormTitle title="ใบอนุมัติขอซื้อ (Approval Voucher)" />
          <HeaderGrid topLeft={topLeft} left={leftFields} right={rightFields} />
          <ItemsTable
            columns={['code', 'name', 'qtyApproved', 'uom', 'unitPrice', 'discount', 'amount']}
            customHeaders={{ name: 'รายการ', qtyApproved: 'จำนวนอนุมัติ' }}
            customWidths={{ name: '34%', qtyApproved: '14%' }}
            rows={rows}
            minRows={12}
          />
          <SummaryBlock
            subtotal={subtotal}
            discount={globalDiscount}
            vatRate={av.tax_rate != null ? Number(av.tax_rate) : 7}
            notes={av.remarks || ''}
            costCode={(prExtObj?.cost_center_code as string) || (pr?.cost_center_id ? String(pr.cost_center_id) : '')}
          />
          <SignatureRow slots={['ผู้จัดทำ', 'ผู้ตรวจสอบ', 'ผู้อนุมัติ']} />
        </A4Page>
      </div>
    </PrintAuthGate>
  );
}
