/**
 * @file QuotationApproveListPage.tsx
 * @description หน้ารายการอนุมัติใบเสนอราคาขาย (Sales Quotation Approval List Page)
 * @pattern Mirrors AVListPage.tsx from Procurement → merges PENDING SQs + AQ history
 */

import { useState, useMemo } from 'react';
import { ShieldCheck, Search, Plus, FileText } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { CustomerService } from '@/modules/master-data/customer/customer-master/services/customer.service';
import { SQStatusBadge } from '@/modules/sales/shared/components/SQStatusBadge';
import { AQFormModal } from './components/AQFormModal';
import { AQService } from './services/aq.service';
import type { AQListItem } from './types/quotation-approve.types';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'ทั้งหมด' },
  { value: 'PENDING', label: 'รออนุมัติ' },
  { value: 'APPROVED', label: 'อนุมัติแล้ว' },
  { value: 'REJECTED', label: 'ไม่อนุมัติ' },
  { value: 'CANCELLED', label: 'ยกเลิก' },
];

type ColItem = AQListItem;
const columnHelper = createColumnHelper<ColItem>();

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function QuotationApproveListPage() {
  // ── Filter State ──────────────────────────────────────────────────────────
  const [sqNo, setSqNo] = useState('');
  const [aqNo, setAqNo] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ── Modal State ────────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSqId, setSelectedSqId] = useState<number | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<Record<string, unknown> | undefined>(undefined);

  // ─────────────────────────────────────────────────────────────────────────
  // Data Fetching — "Hybrid" pattern: PENDING SQs + AQ history
  // ─────────────────────────────────────────────────────────────────────────

  // 1. PENDING SQs (for first-time approval)
  const { data: pendingSQsRaw, isLoading: isLoadingPending, refetch } = useQuery({
    queryKey: ['sq-approvals-pending'],
    queryFn: () => AQService.getPendingSQs(),
    staleTime: 3 * 60 * 1000,
  });

  // 2. AQ History (already approved / rejected records)
  const { data: aqHistoryRaw, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['sq-approvals-history'],
    queryFn: () => AQService.getApprovalList({ limit: 1000 }),
    staleTime: 3 * 60 * 1000,
  });

  // 3. Customer lookup
  const { data: customerResponse } = useQuery({
    queryKey: ['master-customers-lookup'],
    queryFn: () => CustomerService.getList({ limit: 1000 }),
    staleTime: 30 * 60 * 1000,
  });

  const customerMap = useMemo(() => {
    const map = new Map<string | number, string>();
    (customerResponse?.data || []).forEach((c) => {
      map.set(String(c.customer_id), c.customer_name_th || c.customer_name || '');
    });
    return map;
  }, [customerResponse]);

  // ─────────────────────────────────────────────────────────────────────────
  // Merge + Normalize data — same client-side merge as AVListPage
  // ─────────────────────────────────────────────────────────────────────────
  const mergedData = useMemo((): AQListItem[] => {
    // Extract AQ history records
    const aqHistory: Array<Record<string, unknown>> = (() => {
      if (!aqHistoryRaw) return [];
      const r = aqHistoryRaw as Record<string, unknown>;
      if (Array.isArray(r.data)) return r.data as Array<Record<string, unknown>>;
      if (Array.isArray(aqHistoryRaw)) return aqHistoryRaw as Array<Record<string, unknown>>;
      return [];
    })();

    // Build map: sq_id → latest AQ record (for deduplication)
    const aqBySqId = new Map<number, Record<string, unknown>>();
    aqHistory.forEach((aq) => {
      const sqId = Number(aq.sq_id);
      if (!aqBySqId.has(sqId)) {
        aqBySqId.set(sqId, aq);
      }
    });

    // Transform PENDING SQs → AQListItem
    const pendingRows: AQListItem[] = (pendingSQsRaw || []).map((raw) => {
      const r = raw as Record<string, unknown>;
      const sqId = Number(r.sq_id || r.id || 0);
      const sqNo = String(r.sq_no || '');

      // Check if this SQ already has an AQ record
      const existingAQ = aqBySqId.get(sqId);
      if (existingAQ) {
        // Don't show separately — it'll appear in AQ history rows
        return null;
      }

      const cid = String(r.customer_id || '');
      const customerNameFallback = customerMap.get(cid) || String(r.customer_name || '');

      return {
        row_key: `sq-${sqId}`,
        sq_id: sqId,
        sq_no: sqNo,
        sq_date: String(r.sq_date || r.date || '').split('T')[0],
        customer_name: customerNameFallback,
        customer_code: String(r.customer_code || ''),
        status: 'PENDING',
        quote_total_amount: Number(r.total_amount || r.quote_total_amount || 0),
        base_total_amount: Number(r.base_total_amount || r.total_amount || 0),
        raw: r,
      } satisfies AQListItem;
    }).filter(Boolean) as AQListItem[];

    // Transform AQ history records → AQListItem
    const historyRows: AQListItem[] = aqHistory.map((aq) => {
      const sqId = Number(aq.sq_id);
      const sqObj = aq.sq as Record<string, unknown> | undefined;

      return {
        row_key: `aq-${aq.aq_id}`,
        aq_id: Number(aq.aq_id),
        aq_no: String(aq.aq_no || ''),
        aq_date: String(aq.aq_date || '').split('T')[0],
        sq_id: sqId,
        sq_no: String(aq.sq_no || sqObj?.sq_no || ''),
        sq_date: String(aq.sq_date || sqObj?.sq_date || '').split('T')[0],
        customer_name:
          customerMap.get(String(sqObj?.customer_id || '')) ||
          String(aq.customer_name || sqObj?.customer_name || ''),
        customer_code: String(aq.customer_code || sqObj?.customer_code || ''),
        status: String(aq.status || 'APPROVED'),
        approval_emp_name: String(aq.approval_emp_name || ''),
        quote_total_amount: Number(aq.quote_total_amount || aq.base_total_amount || 0),
        base_total_amount: Number(aq.base_total_amount || aq.quote_total_amount || 0),
        raw: aq,
      } satisfies AQListItem;
    });

    return [...pendingRows, ...historyRows];
  }, [pendingSQsRaw, aqHistoryRaw, customerMap]);

  // ─────────────────────────────────────────────────────────────────────────
  // Client-side Filtering
  // ─────────────────────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return mergedData.filter((row) => {
      if (statusFilter !== 'ALL' && row.status !== statusFilter) return false;
      if (sqNo && !String(row.sq_no || '').toLowerCase().includes(sqNo.toLowerCase())) return false;
      if (aqNo && !String(row.aq_no || '').toLowerCase().includes(aqNo.toLowerCase())) return false;
      if (customerFilter && !String(row.customer_name || '').toLowerCase().includes(customerFilter.toLowerCase())) return false;
      if (startDate && String(row.sq_date || row.aq_date || '') < startDate) return false;
      if (endDate && String(row.sq_date || row.aq_date || '') > endDate) return false;
      return true;
    });
  }, [mergedData, statusFilter, sqNo, aqNo, customerFilter, startDate, endDate]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleOpenApproval = (row: AQListItem) => {
    const sqId = Number(row.sq_id);
    if (!sqId) return;
    setSelectedSqId(sqId);
    setSelectedItem(row as unknown as Record<string, unknown>);
    setIsModalOpen(true);
  };

  const handleClearFilter = () => {
    setSqNo('');
    setAqNo('');
    setCustomerFilter('');
    setStatusFilter('PENDING');
    setStartDate('');
    setEndDate('');
  };

  const formatDate = (val?: string) => {
    if (!val) return '-';
    const [y, m, d] = val.split('-');
    return y && m && d ? `${d}/${m}/${y}` : val;
  };

  const fmt = (n?: number) =>
    n !== undefined && n !== null
      ? new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n)
      : '-';

  // ─────────────────────────────────────────────────────────────────────────
  // Columns
  // ─────────────────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'index',
        header: () => <div className="flex justify-center w-full">ลำดับ</div>,
        cell: (info) => <div className="text-center">{info.row.index + 1}</div>,
        size: 55,
      }),
      columnHelper.accessor('sq_no', {
        header: 'เลขที่ SQ',
        cell: (info) => (
          <span
            onClick={() => handleOpenApproval(info.row.original)}
            className="text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline"
          >
            {info.getValue() || '-'}
          </span>
        ),
        size: 140,
      }),
      columnHelper.accessor('aq_no', {
        header: 'เลขที่ AQ',
        cell: (info) => (
          <span
            onClick={() => handleOpenApproval(info.row.original)}
            className={`font-semibold cursor-pointer hover:underline ${
              info.getValue()
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-gray-400 italic text-xs'
            }`}
          >
            {info.getValue() || '— รอพิจารณา —'}
          </span>
        ),
        size: 140,
      }),
      columnHelper.accessor('sq_date', {
        header: 'วันที่ SQ',
        cell: (info) => <span className="text-sm">{formatDate(String(info.getValue() || ''))}</span>,
        size: 110,
      }),
      columnHelper.accessor('customer_name', {
        header: 'ลูกค้า',
        cell: (info) => (
          <div className="flex flex-col max-w-[200px]">
            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {info.getValue() || '-'}
            </span>
            {info.row.original.customer_code && (
              <span className="text-xs text-gray-400">{info.row.original.customer_code}</span>
            )}
          </div>
        ),
        size: 200,
      }),
      columnHelper.accessor('quote_total_amount', {
        header: () => <div className="text-center w-full">มูลค่ารวม</div>,
        cell: (info) => (
          <div className="text-center font-bold text-emerald-600 dark:text-emerald-400">
            {fmt(info.getValue() as number)}
          </div>
        ),
        size: 140,
      }),
      columnHelper.accessor('approval_emp_name', {
        header: () => <div className="text-center w-full">ผู้อนุมัติ</div>,
        cell: (info) => (
          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            {info.getValue() || '-'}
          </div>
        ),
        size: 140,
      }),
      columnHelper.accessor('status', {
        header: () => <div className="text-center w-full">สถานะ</div>,
        cell: (info) => (
          <div className="flex justify-center">
            <SQStatusBadge status={String(info.getValue() || '')} />
          </div>
        ),
        size: 120,
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-center w-full">การจัดการ</div>,
        cell: (info) => {
          const row = info.row.original;
          const isPending = row.status === 'PENDING';
          return (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => handleOpenApproval(row)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  isPending
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {isPending ? (
                  <>
                    <ShieldCheck size={14} strokeWidth={2.5} />
                    พิจารณาอนุมัติ
                  </>
                ) : (
                  <>
                    <FileText size={14} />
                    ดูรายละเอียด
                  </>
                )}
              </button>
            </div>
          );
        },
        size: 140,
      }),
    ],
    [],
  );

  const isLoading = isLoadingPending || isLoadingHistory;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <PageListLayout
        title="อนุมัติใบเสนอราคาขาย (Quotation Approval)"
        subtitle="พิจารณาและอนุมัติใบเสนอราคาที่อยู่ในสถานะรออนุมัติ"
        icon={ShieldCheck}
        accentColor="emerald"
        totalCount={filteredData.length}
        isLoading={isLoading}
        searchForm={
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <FilterField
              label="เลขที่ใบเสนอราคา (SQ)"
              value={sqNo}
              onChange={setSqNo}
              placeholder="SQ-xxxx"
              accentColor="emerald"
            />
            <FilterField
              label="เลขที่อนุมัติ (AQ)"
              value={aqNo}
              onChange={setAqNo}
              placeholder="AQ-xxxx"
              accentColor="emerald"
            />
            <FilterField
              label="ลูกค้า"
              value={customerFilter}
              onChange={setCustomerFilter}
              placeholder="ชื่อลูกค้า"
              accentColor="emerald"
            />
            <FilterField
              label="วันที่ตั้งแต่"
              type="date"
              value={startDate}
              onChange={setStartDate}
              accentColor="emerald"
            />
            <FilterField
              label="สถานะ"
              type="select"
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
              accentColor="emerald"
            />

            {/* Buttons */}
            <div className="md:col-span-5 flex flex-col sm:flex-row justify-end gap-3 mt-2">
              <div className="flex gap-2">
                <button
                  onClick={handleClearFilter}
                  className="h-10 px-5 bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <Plus size={18} className="rotate-45 text-slate-500" strokeWidth={2.5} />
                  ล้างค่า
                </button>
                <button
                  onClick={() => refetch()}
                  className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2"
                >
                  <Search size={18} strokeWidth={3} />
                  ค้นหา
                </button>
                <button
                  onClick={() => {
                    setSelectedSqId(undefined);
                    setSelectedItem(undefined);
                    setIsModalOpen(true);
                  }}
                  className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2"
                >
                  <FileText size={18} strokeWidth={2.5} /> รายการอนุมัติใบเสนอราคา
                </button>
              </div>
            </div>
          </div>
        }
      >
        {/* Pending count badge */}
        {mergedData.filter(r => r.status === 'PENDING').length > 0 && (
          <div className="mb-3 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-lg flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              มีใบเสนอราคา{' '}
              <strong>{mergedData.filter(r => r.status === 'PENDING').length}</strong>{' '}
              รายการ รอการพิจารณาอนุมัติ
            </span>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <SmartTable
            data={filteredData}
            columns={columns}
            isLoading={isLoading}
            pagination={{
              pageIndex: 1,
              pageSize: 20,
              totalCount: filteredData.length,
              onPageChange: () => {},
              onPageSizeChange: () => {},
            }}
          />
        </div>
      </PageListLayout>

      {/* Approval Modal */}
      <AQFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSqId(undefined);
          setSelectedItem(undefined);
        }}
        sqId={selectedSqId}
        approvalItem={selectedItem}
        onSuccess={() => {
          refetch();
        }}
      />

    </>
  );
}
