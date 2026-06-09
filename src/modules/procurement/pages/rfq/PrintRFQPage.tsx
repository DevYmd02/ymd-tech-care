import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RFQService } from '@/modules/procurement/services/rfq.service';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import { fmtDate } from '@/shared/utils';
import {
  PrintAuthGate,
  PrintToolbar,
  A4Page,
  FormTitle,
  HeaderGrid,
  ItemsTable,
  SummaryBlock,
  type PrintRow,
} from '@/modules/procurement/shared/components/print/PrintLayout';

interface ExtendedRFQHeader {
  rfq_id: number;
  rfq_no?: string;
  rfq_date?: string;
  quotation_due_date?: string;
  payment_term_hint?: string;
  remarks?: string;
  rfqLines?: Array<{
    rfq_line_id?: number;
    line_no?: number;
    qty?: number | string;
    item_code?: string;
    item_name?: string;
    itemName?: string;
    itemCode?: string;
    description?: string;
    uom_name?: string;
    uomName?: string;
    item?: {
      item_id?: number;
      item_code?: string;
      itemCode?: string;
      code?: string;
      item_name?: string;
      itemName?: string;
      name?: string;
    };
    uom?: {
      uom_name?: string;
      name_th?: string;
      name?: string;
    };
  }>;
  rfqVendors?: Array<{
    vendor_id?: number;
    id?: number;
    vendor_code?: string;
    vendor_name?: string;
  }>;
  vendors?: Array<{
    vendor_id?: number;
    id?: number;
    vendor_code?: string;
    vendor_name?: string;
  }>;
}

export default function PrintRFQPage() {
  const { id } = useParams<{ id: string }>();
  const rfqId = Number(id);

  const { data: rfqPrintData, isLoading, error } = useQuery({
    queryKey: ['rfq-detail-print', rfqId],
    queryFn: async () => {
      const [rfq, masterItems, masterUoms] = await Promise.all([
        RFQService.getById(rfqId),
        MasterDataService.getItems(),
        MasterDataService.getUOMs().catch(() => []),
      ]);
      const vendorList = rfq.rfqVendors || rfq.vendors || [];
      const firstVendor = vendorList[0];
      const vendorId = firstVendor?.vendor_id || firstVendor?.id;
      let vendorInfo = null;
      if (vendorId) {
        try {
          vendorInfo = await VendorService.getById(Number(vendorId));
        } catch (e) {
          console.error('Failed to load vendor details:', e);
        }
      }
      return { rfq, vendorInfo, masterItems, masterUoms };
    },
    enabled: !!rfqId,
  });

  if (isLoading) {
    return (
      <div className="print-shell flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>กำลังโหลดข้อมูลใบขอเสนอราคา...</div>
        </div>
      </div>
    );
  }

  if (error || !rfqPrintData || !rfqPrintData.rfq) {
    return (
      <div className="print-shell flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-red-200">
          <div className="text-red-500 text-xl font-bold mb-2">เกิดข้อผิดพลาด</div>
          <div>ไม่พบข้อมูลใบขอเสนอราคา หรือไม่สามารถดึงข้อมูลได้</div>
        </div>
      </div>
    );
  }

  const rfqDetailAny = rfqPrintData.rfq as unknown as ExtendedRFQHeader;
  const vendorInfo = rfqPrintData.vendorInfo;
  const masterItems = rfqPrintData.masterItems || [];
  const masterUoms = rfqPrintData.masterUoms || [];

  // Map backend lines to PrintRow format
  const rows: PrintRow[] = (rfqDetailAny.rfqLines || []).map((line) => {
    const qty = Number(line.qty || 0);
    const unitPrice = 0;
    const amount = 0;

    const rawLine = line as unknown as Record<string, unknown>;
    const itemObj = (rawLine.item || {}) as Record<string, unknown>;
    const uomObj = (rawLine.uom || {}) as Record<string, unknown>;

    // Resolve from master data as fallback
    const itemId = rawLine.item_id as number | undefined;
    const uomId = rawLine.uom_id as number | undefined;
    const matchedItem = itemId ? masterItems.find((i) => String(i.item_id) === String(itemId)) : undefined;
    const matchedUom = uomId ? masterUoms.find((u) => String(u.uom_id) === String(uomId)) : undefined;

    const itemCode = String(line.item_code || rawLine.itemCode || itemObj.item_code || itemObj.itemCode || itemObj.code || matchedItem?.item_code || '');
    const itemName = String(line.item_name || rawLine.itemName || itemObj.item_name || itemObj.itemName || itemObj.name || matchedItem?.item_name || line.description || '');
    const uomName = String(rawLine.uom_name || rawLine.uomName || uomObj.uom_name || uomObj.name_th || uomObj.name || matchedUom?.uom_name || '');

    return {
      code: itemCode,
      name: itemName,
      qty,
      uom: uomName || '-',
      unitPrice,
      discount: 0,
      amount,
    };
  });

  const subtotal = 0;

  // Extract vendor details
  const vendorList = rfqDetailAny.rfqVendors || rfqDetailAny.vendors || [];
  const vendor = vendorList[0];
  
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
  const rfqExtObj = vendor as unknown as { vendor_phone?: string; vendor_tel?: string; vendor_fax?: string; fax?: string; vendor_address?: string; vendor_code?: string; vendor_name?: string } | undefined;

  const vendorCode = vendorInfoObj?.vendor_code || rfqExtObj?.vendor_code || '';
  const vendorName = vendorInfoObj?.vendor_name || rfqExtObj?.vendor_name || '';
  const vendorPhone = vendorInfoObj?.phone || vendorInfoObj?.tel || defaultAddressObj?.phone || defaultAddressObj?.tel || rfqExtObj?.vendor_phone || rfqExtObj?.vendor_tel || '';
  const vendorFax = vendorInfoObj?.fax || vendorInfoObj?.vendor_fax || defaultAddressObj?.fax || defaultAddressObj?.vendor_fax || rfqExtObj?.vendor_fax || rfqExtObj?.fax || '';
  const vendorAddress = addrParts.join(' ') || rfqExtObj?.vendor_address || '';

  const topLeft = vendorCode ? { label: 'รหัสผู้ขาย:', value: vendorCode } : undefined;

  const leftFields = [
    { label: 'ชื่อผู้ขาย:', value: vendorName || 'ผู้ให้บริการร่วมขอราคา' },
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
    { label: 'เลขที่เอกสาร:', value: rfqDetailAny.rfq_no || '-' },
    { label: 'วันที่เอกสาร:', value: fmtDate(rfqDetailAny.rfq_date) },
    { label: 'วันที่กำหนดส่ง:', value: fmtDate(rfqDetailAny.quotation_due_date) },
    { label: 'จำนวนวันเครดิต:', value: rfqDetailAny.payment_term_hint || '-' },
  ];

  return (
    <PrintAuthGate>
      <div className="print-shell">
        <PrintToolbar />
        <A4Page>
          <FormTitle title="ใบขอใบเสนอราคา (Request for Quotation)" />
          <HeaderGrid topLeft={topLeft} left={leftFields} right={rightFields} />
          <ItemsTable
            columns={['code', 'name', 'qty', 'uom', 'unitPrice', 'discount', 'amount']}
            customHeaders={{ name: 'รายการ', uom: 'หน่วยนับ' }}
            rows={rows}
            minRows={15}
          />
          <SummaryBlock
            subtotal={subtotal}
            discount={0}
            vatRate={0}
            notes={rfqDetailAny.remarks || ''}
            costCode={''}
          />
        </A4Page>
      </div>
    </PrintAuthGate>
  );
}
