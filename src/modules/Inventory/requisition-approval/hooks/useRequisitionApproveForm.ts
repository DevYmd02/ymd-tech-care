import { useCallback, useEffect } from 'react';
import { useForm, type Resolver, type DefaultValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { requisitionApproveSchema, type RequisitionApproveFormData } from '../schemas/requisition-approval.schemas';
import { RequisitionApprovalService } from '../services/requisition-approval.service';
import { MasterDataService } from '@/modules/master-data/services/master-data.service';

interface UseRequisitionApproveFormOptions {
    isOpen: boolean;
    onClose: () => void;
    requisitionId?: string | null;
    onSuccess?: () => void;
}

const DEFAULT_VALUES: RequisitionApproveFormData = {
    issue_req_no: '',
    docu_date: '',
    branch_id: '',
    branch_name: '',
    emp_dept_id: '',
    emp_dept_name: '',
    job_id: '',
    job_name: '',
    save_emp_id: '',
    save_emp_name: '',
    audit_emp_id: '',
    audit_emp_name: '',
    remark: '',
    qty_total: 0,
    approval_emp_id: '',
    approval_emp_name: '',
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

    // Load master data (employees lookup)
    const { data: employees = [] } = useQuery({
        queryKey: ['employees-options'],
        queryFn: () => MasterDataService.getEmployees(),
        staleTime: 5 * 60 * 1000,
        enabled: isOpen,
    });

    // Load requisition details
    const { data: detailData, isLoading } = useQuery({
        queryKey: ['requisition-detail', requisitionId],
        queryFn: () => (requisitionId ? RequisitionApprovalService.getRequisitionById(requisitionId) : null),
        enabled: !!requisitionId && isOpen,
    });

    useEffect(() => {
        if (detailData) {
            const { header, lines } = detailData;
            
            // Map IDs to employee names
            const saveEmp = employees.find(e => String(e.employee_id || e.id) === String(header.save_emp_id));
            const auditEmp = employees.find(e => String(e.employee_id || e.id) === String(header.audit_emp_id));

            reset({
                docu_item_id: header.docu_item_id,
                issue_req_no: header.issue_req_no,
                docu_date: header.docu_date,
                branch_id: header.branch_id,
                emp_dept_id: header.emp_dept_id,
                job_id: header.job_id,
                save_emp_id: header.save_emp_id,
                save_emp_name: saveEmp ? saveEmp.employee_fullname || saveEmp.employee_name : '',
                audit_emp_id: header.audit_emp_id,
                audit_emp_name: auditEmp ? auditEmp.employee_fullname || auditEmp.employee_name : '',
                remark: header.remark || '',
                qty_total: header.qty_total,
                approval_emp_id: user?.employee_id ? String(user.employee_id) : '',
                status: 'PENDING',
                reject_reason: '',
                lines: lines.map((l, i) => ({
                    docu_item_line_id: l.docu_item_line_id,
                    listno: l.listno || i + 1,
                    item_id: l.item_id,
                    item_code: l.item_code,
                    item_name: l.item_name,
                    uom_id: l.uom_id,
                    warehouse_id: l.warehouse_id,
                    warehouse_name: l.warehouse_name,
                    location_id: l.location_id,
                    location_name: l.location_name,
                    lot_id: l.lot_id,
                    lot_no: l.lot_no,
                    qty_ic: l.qty_ic,
                    remark: l.remark || '',
                })),
            });
        } else if (!requisitionId && isOpen) {
            reset(DEFAULT_VALUES);
        }
    }, [detailData, requisitionId, isOpen, reset, user, employees]);

    // Mutation for approval action
    const approveMutation = useMutation({
        mutationFn: (payload: { status: 'APPROVED' | 'REJECTED'; rejectReason?: string }) => {
            if (!requisitionId) throw new Error('Requisition ID is required');
            return RequisitionApprovalService.approve({
                docu_item_id: requisitionId,
                status: payload.status,
                approval_emp_id: user?.employee_id || 0,
                reject_reason: payload.rejectReason,
            });
        },
        onSuccess: (result) => {
            if (result.success) {
                toast.success('ทำรายการสำเร็จ');
                queryClient.invalidateQueries({ queryKey: ['requisition-approvals'] });
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
        isLoading,
        isSaving,
        handleApprove: useCallback(() => {
            approveMutation.mutate({ status: 'APPROVED' });
        }, [approveMutation]),
        handleReject: useCallback((reason: string) => {
            approveMutation.mutate({ status: 'REJECTED', rejectReason: reason });
        }, [approveMutation]),
    };
}
