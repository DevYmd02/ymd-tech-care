import React from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { X, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import api from '@/core/api/api';
import { formatThaiDate } from '@/shared/utils/dateUtils';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import { FormSkeleton } from '@ui';

interface RequisitionApprovalHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    requisitionId: string | number;
    requisitionNo?: string;
}

export const RequisitionApprovalHistoryModal: React.FC<RequisitionApprovalHistoryModalProps> = ({
    isOpen,
    onClose,
    requisitionId,
    requisitionNo,
}) => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['requisition-approvals', requisitionId, requisitionNo],
        queryFn: async () => {
            // Fetch the approvals history, employees, and UOMs
            const [res, employees, uoms] = await Promise.all([
                api.get<unknown>('/appv-issue-requistion'),
                MasterDataService.getEmployees().catch(() => []),
                MasterDataService.getUOMs().catch(() => [])
            ]);

            const allRecords = (Array.isArray(res) ? res : (((res as Record<string, unknown> | undefined)?.items || []))) as Record<string, unknown>[];
            const employeesList = employees as unknown as Record<string, unknown>[];
            const uomsList = uoms as unknown as Record<string, unknown>[];
            
            // Filter records for this requisition
            const filtered = allRecords.filter(rec => 
                String(rec.issue_req_id) === String(requisitionId) ||
                (requisitionNo && String(rec.issue_req_no) === String(requisitionNo))
            );

            // Fetch requisition details to get lines and map UOMs
            const reqDetail = await api.get<unknown>(`/issue-requistion/${requisitionId}`).catch(() => null);
            let qtyTotal = 0;
            let uomName = 'ชิ้น';

            if (reqDetail && typeof reqDetail === 'object') {
                const reqObj = reqDetail as Record<string, unknown>;
                const lines = (reqObj.lines || reqObj.issueRequistionLines || reqObj.issueRequisitionLines || []) as Record<string, unknown>[];
                qtyTotal = lines.reduce((sum, l) => sum + (Number(l.qty || l.qty_ic || 0)), 0);

                if (lines.length > 0) {
                    const firstLine = lines[0];
                    const matchedUom = uomsList.find(u => Number(u.uom_id || u.id) === Number(firstLine.uom_id));
                    if (matchedUom) {
                        uomName = String(matchedUom.uom_name || matchedUom.uom_name_en || 'ชิ้น');
                    }
                    
                    const uniqueUomIds = [...new Set(lines.map(l => Number(l.uom_id)))];
                    if (uniqueUomIds.length > 1) {
                        uomName = 'รายการ';
                    }
                }
            }

            return filtered.map(rec => {
                const emp = employeesList.find(e => Number(e.employee_id || e.id) === Number(rec.approval_emp_id));
                const empName = emp ? (emp.employee_fullname as string || `${(emp.employee_firstname_th as string) || ''} ${(emp.employee_lastname_th as string) || ''}`.trim()) : '-';
                const recStatus = (rec.status as 'PENDING' | 'APPROVED' | 'REJECTED') || 'PENDING';
                return {
                    appv_issue_req_id: Number(rec.appv_issue_req_id || rec.id || 0),
                    appv_issue_req_no: String(rec.appv_issue_req_no || rec.approval_no || '-'),
                    appv_issue_req_date: String(rec.appv_issue_req_date || rec.approved_date || rec.approve_date || ''),
                    approval_emp_name: empName,
                    status: recStatus,
                    remarks: String(rec.remarks || rec.remark || ''),
                    qty_total: recStatus === 'REJECTED' ? 0 : qtyTotal,
                    uom_name: uomName
                };
            });
        },
        enabled: isOpen && (!!requisitionId || !!requisitionNo),
        staleTime: 5 * 1000,
    });

    if (!isOpen) return null;

    const approvals = data || [];

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/10 rounded-t-lg">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-5 h-5" />
                        <h3 className="font-semibold text-lg">ประวัติการอนุมัติเอกสาร {requisitionNo ? `(${requisitionNo})` : ''}</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-white/50 dark:hover:bg-black/20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {isLoading ? (
                        <FormSkeleton rows={2} />
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-10 text-red-500">
                            <AlertCircle className="w-10 h-10 mb-2" />
                            <span>เกิดข้อผิดพลาดในการดึงข้อมูล</span>
                        </div>
                    ) : approvals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Clock className="w-12 h-12 mb-3 stroke-[1.5]" />
                            <p className="font-medium">ยังไม่มีประวัติการอนุมัติสำหรับใบขอเบิกใบนี้</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">รายการนี้อาจยังไม่ได้ผ่านกระบวนการ หรือรอการตัดสินใจ</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Summary Stats */}
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                <span className="text-sm text-gray-600 dark:text-gray-400">จำนวนที่อนุมัติแล้ว:</span>
                                <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{approvals.length} ชุด (Requisition)</span>
                            </div>

                            {/* Table View */}
                            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-auto">
                                    <thead className="bg-gray-50 dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 text-center w-12">ลำดับ</th>
                                            <th className="px-4 py-3 text-left">เลขที่อนุมัติใบขอเบิก</th>
                                            <th className="px-4 py-3 text-left">วันที่อนุมัติ</th>
                                            <th className="px-4 py-3 text-left">ผู้อนุมัติ</th>
                                            <th className="px-4 py-3 text-right">จำนวนรวม</th>
                                            <th className="px-4 py-3 text-left">สถานะ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                                        {approvals.map((av, index) => (
                                            <tr key={av.appv_issue_req_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-4 py-3 text-center text-gray-500">{index + 1}</td>
                                                <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                    {av.appv_issue_req_no || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                    {av.appv_issue_req_date ? formatThaiDate(av.appv_issue_req_date) : '-'}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                                    {av.approval_emp_name || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                    {new Intl.NumberFormat('th-TH').format(Number(av.qty_total || 0))} {av.uom_name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold
                                                        ${av.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : ''}
                                                        ${av.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800' : ''}
                                                        ${av.status !== 'APPROVED' && av.status !== 'REJECTED' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : ''}
                                                    `}>
                                                        {av.status === 'APPROVED' ? 'อนุมัติแล้ว' : 
                                                         av.status === 'REJECTED' ? 'ไม่อนุมัติ' : 
                                                         av.status || '-'}
                                                    </span>
                                                    {av.remarks && (
                                                        <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px]" title={av.remarks}>
                                                            หมายเหตุ: {av.remarks}
                                                        </p>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t border-gray-100 dark:border-gray-700 gap-3 rounded-b-lg">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-slate-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:focus:ring-gray-700 transition-colors"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
