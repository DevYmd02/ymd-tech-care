/**
 * @file QuotationApproveListPage.tsx
 * @description หน้ารายการอนุมัติใบเสนอราคาขาย (Sales Quotation Approval List Page)
 * @pattern Mirrors AVListPage.tsx from Procurement → merges PENDING SQs + AQ history
 */

import { useState, useMemo } from 'react';
import { ShieldCheck, Search, Plus, FileText, Eye, Clock } from 'lucide-react';
import { PageListLayout, SmartTable, FilterField } from '@ui';
import { createColumnHelper } from '@tanstack/react-table';
import { SQStatusBadge } from '@/modules/sales/shared/components/SQStatusBadge';
import { AQFormModal } from './components/AQFormModal';
import { AQHistoryModal } from '@/modules/sales/shared/components/AQHistoryModal';
import { useAQListData } from './hooks/useAQListData';
import type { AQListItem, SQForApproval } from './types/quotation-approve.types';

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
  const [selectedItem, setSelectedItem] = useState<SQForApproval | AQListItem | undefined>(undefined);

  // ── History Modal State ────────────────────────────────────────────────────
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySqId, setHistorySqId] = useState<number | undefined>(undefined);
  const [historySqNo, setHistorySqNo] = useState<string>('');

  // ─────────────────────────────────────────────────────────────────────────
  // Data Integration — Using specialized hook
  // ─────────────────────────────────────────────────────────────────────────
  const { 
    filteredData, 
    mergedData, 
    isLoading, 
    refetch 
  } = useAQListData({
    statusFilter,
    sqNo,
    aqNo,
    customerFilter,
    startDate,
    endDate
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────
  const handleOpenApproval = (row: AQListItem) => {
    const sqId = Number(row.sq_id);
    if (!sqId) return;
    setSelectedSqId(sqId);
    setSelectedItem(row);
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
            onClick={() => {
              setHistorySqId(info.row.original.sq_id);
              setHistorySqNo(info.row.original.sq_no || '');
              setIsHistoryOpen(true);
            }}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer transition-all"
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
            className={`font-bold ${
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
      columnHelper.accessor('base_total_amount', {
        header: () => <div className="text-center w-full">มูลค่ารวม (บาท)</div>,
        cell: (info) => {
          const row = info.row.original;
          const currency = row.currency || 'THB';
          const quoteAmount = Number(row.quote_total_amount || 0);
          const baseAmount = Number(info.getValue() || 0);

          return (
            <div className="flex flex-col items-center gap-0.5 w-full">
              <div className="flex items-center gap-1 text-emerald-600 font-bold justify-center">
                <span className="text-xs">฿</span>
                <span>{fmt(baseAmount)}</span>
              </div>
              {currency !== 'THB' && (
                <div className="text-[10px] text-gray-400 font-medium italic">
                  ({String(currency)} {fmt(quoteAmount)})
                </div>
              )}
            </div>
          );
        },
        size: 130,
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
          const canViewHistory = row.status === 'APPROVED' || row.status === 'REJECTED';

          return (
            <div className="flex justify-center items-center gap-2">
              {isPending ? (
                <button
                  onClick={() => handleOpenApproval(row)}
                  className="h-8 px-2.5 bg-[#00a67e] hover:bg-[#008f6d] text-white rounded-lg text-[11px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1"
                >
                  <ShieldCheck size={13} strokeWidth={2.5} />
                  พิจารณาอนุมัติ
                </button>
              ) : (
                <>
                  {/* 👁️ View Detail Button */}
                  <button
                    onClick={() => handleOpenApproval(row)}
                    title="ดูรายละเอียด"
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all active:scale-90"
                  >
                    <Eye size={16} strokeWidth={2} />
                  </button>
                  
                  {/* 🕒 View History Button */}
                  {canViewHistory && (
                    <button
                      onClick={() => {
                        setHistorySqId(row.sq_id);
                        setHistorySqNo(row.sq_no || '');
                        setIsHistoryOpen(true);
                      }}
                      title="ดูประวัติการอนุมัติ"
                      className="p-1 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-full transition-all active:scale-90"
                    >
                      <Clock size={16} strokeWidth={2.5} />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        },
        size: 120,
      }),
    ],
    [],
  );

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

      {/* History Modal */}
      <AQHistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setHistorySqId(undefined);
          setHistorySqNo('');
        }}
        sqId={historySqId}
        sqNo={historySqNo}
      />

    </>
  );
}
