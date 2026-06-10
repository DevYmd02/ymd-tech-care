/**
 * @file RequisitionListPage.tsx
 * @description หน้ารายการใบขอเบิก (Material Requisition List)
 * @route /inventory/requisition
 * @pattern ใช้ PageListLayout + FilterField + SmartTable (Sales module pattern)
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus, Search, Eye, Edit, Send, Clock } from 'lucide-react';
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table';
import { toast } from 'react-hot-toast';

import { PageListLayout, SmartTable, FilterField } from '@ui';
import { RequisitionApprovalHistoryModal } from './components/RequisitionApprovalHistoryModal';
import { ConfirmationModal } from '@system/ConfirmationModal';
import { useTableFilters } from '@/shared/hooks';

import { RequisitionService } from './services/requisition.service';
import { RequisitionFormPage } from './components/RequisitionFormPage';
import type { RequisitionListItem, RequisitionListParams } from './types/requisition.types';

// ====================================================================================
// CONSTANTS
// ====================================================================================

const STATUS_OPTIONS = [
    { value: 'ALL', label: 'ทั้งหมด' },
    { value: 'N', label: 'ปกติ' },
    { value: 'Y', label: 'ยกเลิกแล้ว' },
];

const colHelper = createColumnHelper<RequisitionListItem>();

// ====================================================================================
// STATUS BADGE
// ====================================================================================

function CancelBadge({ flag }: { flag: string }) {
    if (flag === 'Y') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                ยกเลิก
            </span>
        );
    }
    if (flag === 'PENDING') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                รออนุมัติ
            </span>
        );
    }
    if (flag === 'APPROVED') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                อนุมัติแล้ว
            </span>
        );
    }
    if (flag === 'REJECTED') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                ไม่อนุมัติ
            </span>
        );
    }
    if (flag === 'DRAFT') {
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                แบบร่าง
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            ปกติ
        </span>
    );
}

// ====================================================================================
// MAIN COMPONENT
// ====================================================================================

export default function RequisitionListPage() {
    const queryClient = useQueryClient();

    // ── Filters (URL-synced) ────────────────────────────────────────────────────────
    const {
        filters,
        localFilters,
        handleFilterChange,
        handleApplyFilters,
        setFilters,
        resetFilters,
        handlePageChange,
        handleSortChange,
        sortConfig,
    } = useTableFilters({
        defaultStatus: 'ALL',
        customParamKeys: {
            search: 'issue_req_no',
            status: 'cancel_flag',
        },
    });

    // ── Modal State ─────────────────────────────────────────────────────────────────
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    
    // Approval History Modal State
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [selectedApproveId, setSelectedApproveId] = useState<string | null>(null);

    // ── API Query ───────────────────────────────────────────────────────────────────
    const apiParams: RequisitionListParams = {
        issue_req_no: filters.search || undefined,
        date_start: filters.date_start || undefined,
        date_end: filters.date_end || undefined,
        cancel_flag: filters.status === 'ALL' ? undefined : filters.status,
        page: filters.page,
        limit: filters.limit,
    };

    const { data, isLoading } = useQuery({
        queryKey: ['requisitions', apiParams],
        queryFn: () => RequisitionService.getList(apiParams),
        staleTime: 0,
    });

    // ── Handlers ────────────────────────────────────────────────────────────────────
    const handleCreate = () => {
        setSelectedId(null);
        setIsReadOnly(false);
        setIsFormOpen(true);
    };

    const handleView = useCallback((id: string) => {
        setSelectedId(id);
        setIsReadOnly(true);
        setIsFormOpen(true);
    }, []);

    const handleEdit = useCallback((id: string) => {
        setSelectedId(id);
        setIsReadOnly(false);
        setIsFormOpen(true);
    }, []);

    const handleViewApproval = useCallback((id: string) => {
        setSelectedApproveId(id);
        setIsApproveModalOpen(true);
    }, []);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmSendId, setConfirmSendId] = useState<string | null>(null);
    const [isSendingApproval, setIsSendingApproval] = useState(false);

    const handleSendApproval = useCallback((id: string) => {
        setConfirmSendId(id);
        setIsConfirmOpen(true);
    }, []);

    const handleConfirmSend = useCallback(async () => {
        if (!confirmSendId) return;
        setIsSendingApproval(true);
        try {
            const doc = await RequisitionService.getById(confirmSendId);
            if (!doc) {
                toast.error('ไม่พบข้อมูลเอกสาร');
                return;
            }
            const { header, lines } = doc;
            const h = header as unknown as Record<string, unknown>;

            const payload = {
                issue_req_date: h.issue_req_date || header.docu_date,
                doc_link_ic_id: Number(h.doc_link_ic_id || header.docu_item_no),
                emp_dept_id: Number(header.emp_dept_id),
                project_id: Number(h.project_id || header.job_id),
                remarks: h.remarks || header.remark || '',
                branch_id: Number(header.branch_id),
                created_by_emp_id: Number(header.created_by_emp_id) || 1,
                request_by_emp_id: Number(header.request_by_emp_id) || 1,
                status: 'PENDING',
                stock_effect_ic: header.stock_effect_ic !== undefined ? header.stock_effect_ic : null,
                lines: lines.map((l) => {
                    const lObj = l as unknown as Record<string, unknown>;
                    return {
                        item_id: Number(l.item_id),
                        qty: Number(lObj.qty !== undefined && lObj.qty !== null ? lObj.qty : l.qty_ic),
                        uom_id: Number(l.uom_id),
                        warehouse_id: Number(l.warehouse_id),
                        location_id: l.location_id ? Number(l.location_id) : null,
                        lot_id: l.lot_id ? Number(l.lot_id) : null,
                        lot_balance_id: l.lot_id ? Number(l.lot_id) : null,
                    };
                })
            };

            const res = await RequisitionService.update(confirmSendId, payload as unknown as Parameters<typeof RequisitionService.update>[1]);
            if (res.success) {
                toast.success('ส่งอนุมัติสำเร็จ');
                queryClient.invalidateQueries({ queryKey: ['requisitions'] });
                setIsConfirmOpen(false);
                setConfirmSendId(null);
            } else {
                toast.error(res.message || 'เกิดข้อผิดพลาดในการส่งอนุมัติ');
            }
        } catch {
            toast.error('เกิดข้อผิดพลาดในการส่งอนุมัติ');
        } finally {
            setIsSendingApproval(false);
        }
    }, [confirmSendId, queryClient]);

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedId(null);
        setIsReadOnly(false);
    };

    // ── Columns ──────────────────────────────────────────────────────────────────────
    const columns = useMemo(
        () => [
            colHelper.display({
                id: 'index',
                header: () => <div className="flex justify-center items-center w-full">ลำดับ</div>,
                cell: info => (
                    <div className="flex justify-center items-center w-full">
                        {(filters.page - 1) * filters.limit + info.row.index + 1}
                    </div>
                ),
                size: 60,
                enableSorting: false,
            }),
            colHelper.accessor('issue_req_no', {
                header: 'เลขที่เอกสาร',
                cell: info => (
                    <span
                        className="font-semibold text-blue-600 hover:underline cursor-pointer transition-all"
                        onClick={() => handleView(info.row.original.docu_item_id)}
                    >
                        {info.getValue()}
                    </span>
                ),
                size: 160,
                enableSorting: false,
            }),
            colHelper.accessor('docu_item_no', {
                header: 'รายการเอกสาร',
                cell: info => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() || '-'}</span>,
                size: 150,
                enableSorting: false,
            }),
            colHelper.accessor('docu_date', {
                header: 'วันที่เอกสาร',
                cell: info => {
                    const val = info.getValue();
                    if (!val) return '-';
                    const d = new Date(val);
                    return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-GB');
                },
                size: 130,
                enableSorting: false,
            }),
            colHelper.accessor('dept_name', {
                header: 'แผนก',
                cell: info => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() || '-'}</span>,
                size: 160,
                enableSorting: false,
            }),
            colHelper.accessor('save_emp_name', {
                header: 'ผู้ขอเบิก',
                cell: info => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() || '-'}</span>,
                size: 150,
                enableSorting: false,
            }),
            colHelper.accessor('created_emp_name', {
                header: 'ผู้บันทึก',
                cell: info => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() || '-'}</span>,
                size: 150,
                enableSorting: false,
            }),
            colHelper.accessor('cancel_flag', {
                header: () => <div className="flex justify-center items-center w-full">สถานะ</div>,
                cell: info => (
                    <div className="flex justify-center items-center w-full">
                        <CancelBadge flag={info.getValue()} />
                    </div>
                ),
                size: 110,
                enableSorting: false,
            }),
            colHelper.display({
                id: 'actions',
                header: () => <div className="flex justify-center items-center w-full">การจัดการ</div>,
                cell: ({ row }) => {
                    const status = row.original.cancel_flag;
                    return (
                        <div className="flex items-center justify-center gap-1.5 w-full">
                            <button
                                onClick={() => handleView(row.original.docu_item_id)}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="ดูรายละเอียด"
                            >
                                <Eye size={16} />
                            </button>

                            {(status === 'APPROVED' || status === 'REJECTED') && (
                                <button
                                    onClick={() => handleViewApproval(row.original.docu_item_id)}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-900/30 rounded-md transition-colors"
                                    title="ประวัติการอนุมัติ"
                                >
                                    <Clock size={16} />
                                </button>
                            )}

                            {status === 'REJECTED' && (
                                <button
                                    onClick={() => handleEdit(row.original.docu_item_id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-md shadow-sm transition-all active:scale-95"
                                    title="แก้ไขและส่งอนุมัติใหม่"
                                >
                                    <Edit size={14} />
                                    <span>แก้ไขและส่งอนุมัติใหม่</span>
                                </button>
                            )}

                            {(status === 'DRAFT' || status === 'PENDING') && (
                                <button
                                    onClick={() => handleEdit(row.original.docu_item_id)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/30 rounded-md transition-colors"
                                    title="แก้ไข"
                                >
                                    <Edit size={14} />
                                    <span>แก้ไข</span>
                                </button>
                            )}

                            {status === 'DRAFT' && (
                                <button
                                    onClick={() => handleSendApproval(row.original.docu_item_id)}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm transition-colors"
                                    title="ส่งอนุมัติ"
                                >
                                    <Send size={12} />
                                    <span>ส่งอนุมัติ</span>
                                </button>
                            )}
                        </div>
                    );
                },
                size: 200,
                enableSorting: false,
            }),
        ],
        [filters.page, filters.limit, handleView, handleEdit, handleSendApproval, handleViewApproval]
    );

    // ── Render ─────────────────────────────────────────────────────────────────────
    return (
        <PageListLayout
            title="ใบขอเบิก - Material Requisition"
            subtitle="จัดการข้อมูลใบขอเบิกวัสดุและสินค้าจากคลัง"
            icon={ClipboardList}
            accentColor="blue"
            totalCount={data?.total ?? 0}
            searchForm={
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <FilterField
                        label="เลขที่เอกสาร"
                        value={localFilters.search}
                        onChange={(v) => handleFilterChange('search', v)}
                        placeholder="เลขที่ใบขอเบิก"
                        accentColor="blue"
                    />
                    <FilterField
                        label="วันที่ตั้งแต่"
                        type="date"
                        value={localFilters.date_start}
                        onChange={(v) => handleFilterChange('date_start', v)}
                        accentColor="blue"
                    />
                    <FilterField
                        label="ถึงวันที่"
                        type="date"
                        value={localFilters.date_end}
                        onChange={(v) => handleFilterChange('date_end', v)}
                        accentColor="blue"
                    />
                    <FilterField
                        label="สถานะ"
                        type="select"
                        value={localFilters.status}
                        onChange={(v) => handleFilterChange('status', v)}
                        options={STATUS_OPTIONS}
                        accentColor="blue"
                    />

                    {/* Action Buttons */}
                    <div className="md:col-span-4 flex flex-col md:flex-row md:justify-end gap-3 mt-2">
                        <div className="grid grid-cols-2 md:flex gap-2">
                            <button
                                onClick={resetFilters}
                                className="h-10 bg-white hover:bg-gray-100 text-slate-700 border border-gray-200 rounded-lg font-medium transition-all flex items-center justify-center px-4 gap-2"
                            >
                                <Plus size={18} className="rotate-45 text-slate-500" strokeWidth={2.5} />
                                ล้างค่า
                            </button>
                            <button
                                onClick={handleApplyFilters}
                                className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center px-6 gap-2"
                            >
                                <Search size={18} strokeWidth={3} />
                                ค้นหา
                            </button>
                        </div>

                        <button
                            onClick={handleCreate}
                            className="h-10 w-full md:w-auto px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            สร้างใบขอเบิกใหม่
                        </button>
                    </div>
                </div>
            }
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <SmartTable
                    data={data?.items ?? []}
                    columns={columns as ColumnDef<RequisitionListItem, unknown>[]}
                    isLoading={isLoading}
                    pagination={{
                        pageIndex: filters.page,
                        pageSize: filters.limit,
                        totalCount: data?.total ?? 0,
                        onPageChange: handlePageChange,
                        onPageSizeChange: (size: number) => setFilters({ limit: size, page: 1 }),
                    }}
                    sortConfig={sortConfig}
                    onSortChange={handleSortChange}
                    rowIdField="docu_item_id"
                />
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <RequisitionFormPage
                    isOpen={isFormOpen}
                    onClose={handleCloseForm}
                    editId={selectedId}
                    readOnly={isReadOnly}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['requisitions'] })}
                />
            )}

            {/* Approval History Modal */}
            {isApproveModalOpen && selectedApproveId && (
                <RequisitionApprovalHistoryModal
                    isOpen={isApproveModalOpen}
                    onClose={() => {
                        setIsApproveModalOpen(false);
                        setSelectedApproveId(null);
                    }}
                    requisitionId={selectedApproveId}
                    requisitionNo={data?.items?.find(x => String(x.docu_item_id) === String(selectedApproveId))?.issue_req_no}
                />
            )}

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => {
                    setIsConfirmOpen(false);
                    setConfirmSendId(null);
                }}
                onConfirm={handleConfirmSend}
                title="ยืนยันการส่งอนุมัติใบขอเบิก"
                description="คุณต้องการส่งอนุมัติใบขอเบิกนี้ใช่หรือไม่? เมื่อส่งแล้วจะไม่สามารถแก้ไขข้อมูลได้จนกว่าจะได้รับการพิจารณา"
                confirmText="ยืนยันส่งอนุมัติ"
                cancelText="ยกเลิก"
                variant="success"
                isLoading={isSendingApproval}
            />
        </PageListLayout>
    );
}
