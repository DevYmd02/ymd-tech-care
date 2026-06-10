import { useCallback, useEffect } from 'react';
import { useForm, type Resolver, type DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { requisitionApproveSchema, type RequisitionApproveFormData } from '../schemas/requisition-approval.schemas';
import { RequisitionApprovalService } from '../services/requisition-approval.service';
import type { ApproveRequisitionPayload } from '../types/requisition-approval.types';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import { getResolvedDocName, type DocLinkLike } from '../utils/ic-document.util';
import { RequisitionApprovalHelper } from '../utils/requisition-approval.helper';
import { ItemMasterService } from '@/modules/master-data/inventory/services/item-master.service';
import { LocationService } from '@/modules/master-data/inventory/services/inventory-master.service';
import { RequisitionService } from '../../requisition/services/requisition.service';

interface UseRequisitionApproveFormOptions {
    isOpen: boolean;
    onClose: () => void;
    requisitionId?: string | null;
    onSuccess?: () => void;
}

const DEFAULT_VALUES: RequisitionApproveFormData = {
    docu_item_id: '',
    issue_req_no: '',
    docu_item_no: '',
    docu_date: '',
    branch_id: '',
    branch_name: '',
    emp_dept_id: '',
    emp_dept_name: '',
    job_id: '',
    job_name: '',
    created_by_emp_id: '',
    save_emp_name: '',
    request_by_emp_id: '',
    audit_emp_name: '',
    remark: '',
    qty_total: 0,
    approval_no: '',
    approval_emp_id: '',
    approval_emp_name: '',
    approved_date: '',
    status: 'PENDING',
    reject_reason: '',
    lines: [],
};

export function useRequisitionApproveForm({ isOpen, onClose, requisitionId, onSuccess }: UseRequisitionApproveFormOptions) {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const formMethods = useForm<RequisitionApproveFormData>({
        resolver: zodResolver(requisitionApproveSchema) as Resolver<RequisitionApproveFormData>,
        defaultValues: DEFAULT_VALUES as DefaultValues<RequisitionApproveFormData>,
        mode: 'onChange',
    });

    const { reset } = formMethods;

    // Load master data queries
    const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
        queryKey: ['employees-options'],
        queryFn: () => MasterDataService.getEmployees(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: branches = [], isLoading: isLoadingBranches } = useQuery({
        queryKey: ['branches-options'],
        queryFn: () => MasterDataService.getBranches(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
        queryKey: ['departments-options'],
        queryFn: () => MasterDataService.getDepartments(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
        queryKey: ['jobs-options'],
        queryFn: () => MasterDataService.getProjects(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: items = [], isLoading: isLoadingItems } = useQuery({
        queryKey: ['items-options'],
        queryFn: () => ItemMasterService.getAll({ limit: 1000 }).then(res => res.items || []),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: uoms = [], isLoading: isLoadingUoms } = useQuery({
        queryKey: ['uoms-options'],
        queryFn: () => MasterDataService.getUOMs(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: warehouses = [], isLoading: isLoadingWarehouses } = useQuery({
        queryKey: ['warehouses-options'],
        queryFn: () => MasterDataService.getWarehouses(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
        queryKey: ['locations-options'],
        queryFn: () => LocationService.getAll({ limit: 1000 }).then(res => res.items || []),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: docLinks = [], isLoading: isLoadingDocLinks } = useQuery({
        queryKey: ['docLinks-options'],
        queryFn: () => RequisitionService.getDocLinks('ISSUE_REQ'),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    const { data: appvDocLinks = [], isLoading: isLoadingAppvDocLinks } = useQuery({
        queryKey: ['appvDocLinks-options'],
        queryFn: () => RequisitionService.getDocLinks('APPV_ISSUE'),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    // Load requisition details
    const { data: detailData, isLoading: isLoadingDetail } = useQuery({
        queryKey: ['requisition-detail', requisitionId],
        queryFn: () => (requisitionId ? RequisitionApprovalService.getRequisitionById(requisitionId) : null),
        enabled: !!requisitionId && isOpen,
    });

    const isLoading = isLoadingDetail || 
                      isLoadingEmployees || 
                      isLoadingBranches || 
                      isLoadingDepartments || 
                      isLoadingJobs || 
                      isLoadingItems || 
                      isLoadingUoms || 
                      isLoadingWarehouses || 
                      isLoadingLocations || 
                      isLoadingDocLinks ||
                      isLoadingAppvDocLinks;

    useEffect(() => {
        if (detailData && !isLoadingEmployees && !isLoadingBranches && !isLoadingDepartments && !isLoadingJobs && !isLoadingItems && !isLoadingUoms && !isLoadingWarehouses && !isLoadingLocations && !isLoadingDocLinks && !isLoadingAppvDocLinks) {
            const { header, lines } = detailData;
            
            const { translatedHeader, translatedLines } = RequisitionApprovalHelper.translateHeaderAndLines(
                header,
                lines,
                branches,
                departments,
                jobs,
                employees,
                items,
                uoms,
                warehouses,
                locations,
                docLinks
            );

            const rawHeader = header as unknown as Record<string, unknown>;
            const rawStatus = (rawHeader.status as 'PENDING' | 'APPROVED' | 'REJECTED') || 'PENDING';
            const isPending = rawStatus === 'PENDING';

            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const localTodayStr = `${year}-${month}-${day}`;

            const resolvedEmpId = (!rawHeader.approval_emp_id || String(rawHeader.approval_emp_id) === '0' || isPending)
                ? String(user?.employee_id || user?.employee?.employee_id || '')
                : String(rawHeader.approval_emp_id);

            const resolvedApproveDate = (!rawHeader.approved_date && !rawHeader.approve_date || isPending)
                ? localTodayStr
                : String(rawHeader.approved_date || rawHeader.approve_date || localTodayStr);

            const docuItemNoName = getResolvedDocName(rawStatus, (rawHeader.doc_link_ic_id || header.docu_item_no) as string | number | undefined,
                docLinks as unknown as DocLinkLike[], appvDocLinks as unknown as DocLinkLike[]);
            reset({
                docu_item_id: translatedHeader.docu_item_id,
                issue_req_no: translatedHeader.issue_req_no,
                docu_item_no: docuItemNoName,
                docu_date: translatedHeader.docu_date,
                branch_id: translatedHeader.branch_id,
                branch_name: translatedHeader.branch_name,
                emp_dept_id: translatedHeader.emp_dept_id,
                emp_dept_name: translatedHeader.emp_dept_name,
                job_id: translatedHeader.job_id,
                job_name: translatedHeader.job_name,
                created_by_emp_id: translatedHeader.created_by_emp_id,
                save_emp_name: translatedHeader.save_emp_name,
                request_by_emp_id: translatedHeader.request_by_emp_id,
                audit_emp_name: translatedHeader.request_emp_name,
                remark: translatedHeader.remark || '',
                qty_total: translatedHeader.qty_total,
                approval_no: String(rawHeader.approval_no || rawHeader.approve_no || ''),
                approval_emp_id: resolvedEmpId,
                status: rawStatus,
                approved_date: resolvedApproveDate,
                reject_reason: String(rawHeader.reject_reason || rawHeader.remarks || rawHeader.remark || ''),
                lines: translatedLines.map((l) => ({
                    docu_item_line_id: l.docu_item_line_id,
                    listno: l.listno,
                    item_id: l.item_id,
                    item_code: l.item_code,
                    item_name: l.item_name,
                    uom_id: l.uom_id,
                    uom_name: l.uom_name,
                    warehouse_id: l.warehouse_id,
                    warehouse_name: l.warehouse_name,
                    location_id: l.location_id,
                    location_name: l.location_name,
                    lot_id: l.lot_id,
                    lot_no: l.lot_no,
                    qty_ic: l.qty_ic,
                    qty_approved: l.qty_approved,
                    is_approved: l.is_approved,
                    remark: l.remark || '',
                    conversion_factor: l.conversion_factor,
                    to_uom_name: l.to_uom_name,
                })),
            });
        } else if (!requisitionId && isOpen) {
            reset(DEFAULT_VALUES);
        }
    }, [
        detailData,
        requisitionId,
        isOpen,
        reset,
        user,
        employees,
        branches,
        departments,
        jobs,
        items,
        uoms,
        warehouses,
        locations,
        docLinks,
        appvDocLinks,
        isLoadingEmployees,
        isLoadingBranches,
        isLoadingDepartments,
        isLoadingJobs,
        isLoadingItems,
        isLoadingUoms,
        isLoadingWarehouses,
        isLoadingLocations,
        isLoadingDocLinks,
        isLoadingAppvDocLinks
    ]);

    // Mutation for approval action
    const approveMutation = useMutation({
        mutationFn: (payload: { status: 'APPROVED' | 'REJECTED'; rejectReason?: string }) => {
            if (!requisitionId) throw new Error('Requisition ID is required');
            const formValues = formMethods.getValues();
            const header = detailData?.header as Record<string, unknown> | undefined;
            const originalLines = detailData?.lines || [];

            const mappedLines = formValues.lines.map((formLine, idx) => {
                const origLine = originalLines.find(ol => String(ol.docu_item_line_id) === String(formLine.docu_item_line_id))
                                 || originalLines[idx]
                                 || {} as Record<string, unknown>;
                const origLineRaw = origLine as unknown as Record<string, unknown>;

                return {
                    item_id: Number(formLine.item_id || origLine.item_id),
                    qty: Number(formLine.qty_ic || origLineRaw.qty || origLine.qty_ic || 0),
                    approved_qty: payload.status === 'APPROVED' && formLine.is_approved ? Number(formLine.qty_approved) : 0,
                    uom_id: Number(formLine.uom_id || origLine.uom_id),
                    warehouse_id: Number(formLine.warehouse_id || origLine.warehouse_id),
                    location_id: formLine.location_id || origLine.location_id ? Number(formLine.location_id || origLine.location_id) : null,
                    lot_id: formLine.lot_id || origLine.lot_id ? Number(formLine.lot_id || origLine.lot_id) : null,
                    lot_balance_id: formLine.lot_id || origLine.lot_id ? Number(formLine.lot_id || origLine.lot_id) : null,
                };
            });

            // Get doc_type_no of the current requisition's doc link
            const reqDocLink = (docLinks as unknown as DocLinkLike[]).find(d => Number(d.docu_type_id) === Number(header?.doc_link_ic_id || header?.docu_item_no));
            const docTypeNo = reqDocLink ? Number(reqDocLink.docu_item_no || 0) : 0;

            // Find the matching APPV_ISSUE doc link with the same doc_type_no
            const appvDocLink = (appvDocLinks as unknown as DocLinkLike[]).find(d => Number(d.docu_item_no) === docTypeNo);
            const resolvedDocLinkId = appvDocLink ? Number(appvDocLink.docu_type_id) : Number(header?.doc_link_ic_id || header?.docu_item_no || 0);

            const approvePayload: ApproveRequisitionPayload = {
                appv_issue_req_date: new Date(formValues.approved_date || new Date()).toISOString(),
                doc_link_ic_id: resolvedDocLinkId,
                doc_type_no: docTypeNo,
                issue_req_id: Number(requisitionId),
                emp_dept_id: Number(header?.emp_dept_id || 0),
                project_id: header?.project_id ? Number(header.project_id) : null,
                remarks: payload.status === 'REJECTED' 
                    ? (payload.rejectReason || 'Rejected') 
                    : (formValues.remark || (header?.remarks as string) || (header?.remark as string) || ''),
                branch_id: Number(header?.branch_id || 1),
                approval_emp_id: Number(formValues.approval_emp_id || user?.employee_id || 1),
                status: payload.status,
                stock_effect_ic: (appvDocLink as unknown as DocLinkLike)?.stock_effect_ic !== undefined 
                    ? Number((appvDocLink as unknown as DocLinkLike).stock_effect_ic) 
                    : (header?.stock_effect_ic !== undefined ? Number(header.stock_effect_ic) : 1),
                lines: mappedLines,
            };

            return RequisitionApprovalService.approve(approvePayload);
        },
        onSuccess: (result) => {
            if (result.success) {
                toast.success('ทำรายการสำเร็จ');
                queryClient.invalidateQueries({ queryKey: ['requisition-pending-approvals'] });
                queryClient.invalidateQueries({ queryKey: ['requisition-approval-history'] });
                onSuccess?.();
                onClose();
            } else {
                toast.error(result.message || 'เกิดข้อผิดพลาด');
            }
        },
        onError: () => {
            toast.error('เกิดข้อผิดพลาดในการส่งข้อมูล');
        },
    });

    const isSaving = approveMutation.isPending;

    return {
        formMethods,
        employees,
        branches,
        departments,
        jobs,
        isLoading,
        isSaving,
        originalStatus: ((detailData?.header as unknown as Record<string, unknown>)?.status as string) || 'PENDING',
        handleApprove: useCallback(() => {
            approveMutation.mutate({ status: 'APPROVED' });
        }, [approveMutation]),
        handleReject: useCallback((reason: string) => {
            approveMutation.mutate({ status: 'REJECTED', rejectReason: reason });
        }, [approveMutation]),
    };
}

