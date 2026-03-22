import { createColumnHelper } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Edit, Plus, XCircle } from 'lucide-react';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { VQStatusBadge } from '@ui'; 
import type { VQListItem, VQPendingQueueItem, RFQHeader } from '@/modules/procurement/types';
import { RFQ_VENDOR_STATUS_MAP } from '../constants/vq.constants';
import type { VQColumnsContext } from '../types/vq.types';
import { RFQNoDisplay, PRNoDisplay } from './VQColumnComponents';


// ====================================================================================
// COLUMNS DEFINITION: Completed VQ List
// ====================================================================================

const columnHelper = createColumnHelper<VQListItem>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getColumns = (context: VQColumnsContext): ColumnDef<VQListItem, any>[] => {
    const { vendorMap, filters, totalAmount, handleOpenView, handleOpenEdit } = context;

    return [
        columnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            footer: () => <div className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-bold text-sm text-gray-700 dark:text-gray-200">ยอดรวมทั้งหมด :</div>,
            size: 60,
            enableSorting: false,
        }),
        columnHelper.accessor('vq_no', {
            header: 'เลขที่ VQ',
            cell: (info) => {
                const item = info.row.original;
                const vqNo = info.getValue() || item.quotation_no;
                
                return vqNo ? (
                    <span className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline cursor-pointer block" title={vqNo}>
                        {vqNo}
                    </span>
                 ) : (
                    <span className="text-gray-400 dark:text-gray-600 font-medium">-</span>
                );
            },
            size: 140,
            enableSorting: false,
        }),
        columnHelper.accessor('quotation_date', {
            header: () => <div className="text-center w-full">วันที่เอกสาร</div>,
            cell: (info) => (
                <div className="text-center text-gray-600 dark:text-gray-300 whitespace-nowrap font-medium">
                    {formatThaiDate(info.getValue())}
                </div>
            ),
            size: 110,
            enableSorting: false,
        }),
        columnHelper.accessor('vendor_name', {
            header: 'ผู้ขาย',
            cell: (info) => {
                const item = info.row.original;
                const vendorId = item.vendor_id || item.vendor?.vendor_id;
                const vendorName = item.vendor_name || item.vendor?.vendor_name || (vendorId ? vendorMap[String(vendorId)] : null);
                const credit = item.payment_term_days ?? item.vendor?.payment_term_days ?? '-';
                const lead = item.lead_time_days ?? '-';

                return (
                    <div className="flex flex-col min-w-0">
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate" title={vendorName || undefined}>
                            {vendorName || '-'}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            เครดิต {credit} วัน | Lead {lead} วัน
                        </span>
                    </div>
                );
            },
            size: 180,
            enableSorting: false,
        }),
        columnHelper.accessor('rfq_no', {
            header: 'เอกสารอ้างอิง',
            cell: (info) => {
                const item = info.row.original;
                const rfqText = item.rfq_no || item.rfq?.rfq_no;
                const prText = item.pr_no || item.pr?.pr_no;

                const rfqDisplay = rfqText || (item.rfq_id ? <RFQNoDisplay rfqId={item.rfq_id} /> : '-');
                const prDisplay = prText || (item.pr_id ? <PRNoDisplay prId={item.pr_id} /> : null);

                return (
                    <div className="flex flex-col min-w-0">
                        <span className="font-medium text-purple-600 dark:text-purple-400 truncate w-fit">
                            {rfqDisplay}
                        </span>
                        {prDisplay && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                Ref: {prDisplay}
                            </span>
                        )}
                    </div>
                );
            },
            size: 140,
            enableSorting: false,
        }),
        columnHelper.accessor('base_total_amount', {
            header: () => <div className="text-right w-full">ยอดสุทธิ</div>,
            cell: (info) => {
                const item = info.row.original;
                const amount = info.getValue();
                const isRecorded = item.status === 'RECORDED';
                
                return (
                    <div className={`text-right font-bold whitespace-nowrap ${isRecorded ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-200'}`}>
                        {amount
                            ? Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '-'
                        }
                    </div>
                );
            },
            size: 120,
            enableSorting: false,
        }),
        columnHelper.accessor('quotation_expiry_date', {
            header: () => <div className="text-center w-full">วันหมดเขต</div>,
            cell: (info) => (
                <div className="text-center text-[12.5px] text-gray-500 dark:text-gray-400 font-medium">
                    {info.getValue() ? formatThaiDate(info.getValue() as string) : '-'}
                </div>
            ),
            size: 110,
            enableSorting: false,
        }),
        columnHelper.accessor('status', {
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => (
                <div className="flex justify-center">
                    <VQStatusBadge status={info.getValue() === 'DRAFT' ? 'RECORDED' : info.getValue()} />
                </div>
            ),
            size: 100,
            enableSorting: false,
        }),
        columnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                console.log("📋 [VQColumns] ROW ITEM PAYLOAD:", item);
                const canRecord = item.status === 'PENDING' && !item.quotation_no;
                const isRecorded = item.status === 'RECORDED';
                const isCancelled = item.status === 'CANCELLED';
                const hasVqDocument = !!item.quotation_no || isRecorded || item.status === 'DRAFT';

                const canEdit = hasVqDocument && !isCancelled && !isRecorded && item.status !== 'DRAFT';
                const canView = hasVqDocument || isCancelled;

                if (!canRecord && !canEdit && !canView) {
                    return <div className="flex justify-center text-gray-400 font-bold">-</div>;
                }

                return (
                    <div className="flex flex-row items-center justify-center gap-2 whitespace-nowrap">
                        {canView && (
                            <button 
                                onClick={() => handleOpenView((item as any).vq_id || item.vq_header_id)}
                                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all"
                                title="ดูรายละเอียด"
                            >
                                <Eye size={16} />
                            </button>
                        )}

                        {canEdit && (
                            <button 
                                onClick={() => handleOpenEdit((item as any).vq_id || item.vq_header_id)}
                                className="flex items-center gap-1 pl-1.5 pr-2 py-1 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded shadow-sm border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all whitespace-nowrap"
                                title="แก้ไข"
                            >
                                <Edit size={14} />
                                <span className="text-[10px] font-bold">แก้ไข</span>
                            </button>
                        )}

                        {canRecord && (
                            <button 
                                onClick={() => handleOpenEdit((item as any).vq_id || item.vq_header_id)}
                                className="flex items-center gap-1 pl-1.5 pr-2 py-1 ml-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                                title="บันทึกราคา"
                            >
                                <Edit size={12} />
                                <span>บันทึกราคา</span>
                            </button>
                        )}
                    </div>
                );
            },
            footer: () => {
                 return (
                     <div className="text-right font-bold text-base text-emerald-600 dark:text-emerald-400 whitespace-nowrap pr-2">
                         {totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                     </div>
                 );
            },
            size: 140,
            enableSorting: false,
        }),
    ];
};

// ====================================================================================
// COLUMNS DEFINITION: Pending Queues
// ====================================================================================

const pendingColumnHelper = createColumnHelper<VQPendingQueueItem>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getPendingColumns = (tab: 'WAITING_VQ' | 'WAITING_RFQ', context: VQColumnsContext): ColumnDef<VQPendingQueueItem, any>[] => {
    const { vendorMap, filters, setInitialRFQForCreate, setIsVqModalOpen, setSelectedVqId, setIsViewMode, handleCancelVendor } = context;

    return [
        pendingColumnHelper.display({
            id: 'index',
            header: () => <div className="text-center w-full">ลำดับ</div>,
            cell: (info) => <div className="text-center">{info.row.index + 1 + (filters.page - 1) * filters.limit}</div>,
            size: 60,
            enableSorting: false,
        }),
        pendingColumnHelper.accessor('created_at', {
            header: () => <div className="text-center w-full">วันที่สร้าง</div>,
            cell: (info) => (
                <div className="text-center text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
                    {formatThaiDate(info.getValue())}
                </div>
            ),
            size: 110,
            enableSorting: false,
        }),
        pendingColumnHelper.accessor('vendor_name', {
            header: 'ผู้ขาย',
            cell: (info) => {
                const item = info.row.original;
                const vendorId = item.vendor_id;
                const vendorName = info.getValue() || (vendorId ? vendorMap[String(vendorId)] : null);
                
                return (
                    <div className="text-gray-900 dark:text-gray-100 font-medium truncate" title={vendorName || undefined}>
                        {vendorName || '-'}
                    </div>
                );
            },
            size: 180,
        }),
        pendingColumnHelper.accessor('rfq_no', {
            header: 'เอกสารอ้างอิง',
            cell: (info) => {
                const item = info.row.original;
                return (
                    <div className="flex flex-col py-1 min-w-0">
                        <span className="text-purple-600 dark:text-purple-400 font-semibold leading-tight truncate">
                            {item.rfq_no || '-'}
                        </span>
                        {item.pr_no && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate leading-tight mt-1">
                                Ref: {item.pr_no}
                            </span>
                        )}
                    </div>
                );
            },
            size: 140,
        }),
        pendingColumnHelper.accessor('status', {
            header: () => <div className="text-center w-full">สถานะ</div>,
            cell: (info) => {
                const status = info.getValue() as string;
                const mapped = RFQ_VENDOR_STATUS_MAP[status] || { label: status, color: 'default' };
                
                let colorClass = "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
                if (mapped.color === 'processing') colorClass = "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800";
                if (mapped.color === 'warning') colorClass = "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800";
                if (mapped.color === 'error') colorClass = "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800";
                if (mapped.color === 'success') colorClass = "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800";

                return (
                    <div className="flex justify-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${colorClass}`}>
                            {tab === 'WAITING_VQ' ? 'รอผู้ขายตอบกลับ' : mapped.label}
                        </span>
                    </div>
                );
            },
            size: 100,
        }),
        pendingColumnHelper.display({
            id: 'actions',
            header: () => <div className="text-center w-full">จัดการ</div>,
            cell: ({ row }) => {
                const item = row.original;
                const showCancel = tab === 'WAITING_VQ' && handleCancelVendor && item.rfq_vendor_id;

                if (tab === 'WAITING_VQ' && setInitialRFQForCreate && setIsVqModalOpen && setSelectedVqId && setIsViewMode) {
                    return (
                        <div className="flex justify-center items-center gap-1.5">
                            <button 
                                onClick={() => {
                                        const rfqInit: Partial<RFQHeader> = {
                                            rfq_id: item.rfq_id,
                                            rfq_no: item.rfq_no,
                                        };
                                        
                                        setInitialRFQForCreate({ 
                                            ...rfqInit, 
                                            vendor_id: item.vendor_id, 
                                            rfq_vendor_id: item.rfq_vendor_id 
                                        } as RFQHeader);
                                        
                                        setSelectedVqId(null);
                                        setIsViewMode(false);
                                        setIsVqModalOpen(true);
                                }}
                                className="flex items-center gap-1 pl-1.5 pr-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded shadow-sm transition-all whitespace-nowrap"
                            >
                                <Plus size={12} strokeWidth={2.5} />
                                <span>สร้างใบเสนอราคา</span>
                            </button>

                            {showCancel && (
                                <button
                                    onClick={() => handleCancelVendor?.(item.rfq_vendor_id!)}
                                    className="flex items-center gap-1 pl-1.5 pr-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold rounded shadow-sm border border-red-200 dark:border-red-800 transition-all whitespace-nowrap"
                                    title="ยกเลิกผู้ขาย"
                                >
                                    <XCircle size={12} strokeWidth={2.5} />
                                    <span>ยกเลิกผู้ขาย</span>
                                </button>
                            )}
                        </div>
                    );
                }
                return <div className="text-center text-gray-400 font-bold">-</div>;
            },
            size: 140,
        }),
    ];
};
