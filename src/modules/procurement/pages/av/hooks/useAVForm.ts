import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { FieldErrors, Path, FieldPathValue, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/ui/feedback/Toast';

import { AVFormSchema } from '@procurement/schemas/av.schema';
import type { AVFormData, AVLineFormData } from '@procurement/schemas/av.schema';
import { AVService } from '@procurement/services/av.service';
import type { ApprovalDetail, ApprovalLine, ApprovalHeader } from '@procurement/types/av-types';
import { PRService } from '@/modules/procurement/services/pr.service';
import { usePRMasterData } from '@/modules/procurement/pages/pr/hooks/usePRMasterData';
import type { PRLine, PRStatus } from '@/modules/procurement/types/pr-types';
import { LocationService } from '@/modules/master-data/inventory/services/inventory-master.service';
import type { Location } from '@/modules/master-data/inventory/types/inventory-master.types';
import { VendorService } from '@/modules/master-data/vendor/services/vendor.service';
import { logger } from '@/shared/utils';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { extractErrorMessage } from '@/core/api/api';

export interface UseAVFormProps {
  id?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  approvalItem?: Partial<ApprovalDetail> & { hasOtherAVs?: boolean };
  readOnly?: boolean;
}

export const useAVForm = ({ id, isOpen, onClose, onSuccess, approvalItem }: UseAVFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<number | undefined>(id);

  // Sync state if id prop changes
  useEffect(() => {
    setActiveId(id);
  }, [id]);

  const { 
    purchaseTaxOptions,
    currencies,
    costCenters,
    projects,
    warehouses,
    masterItems,
    masterUoms,
    isLoading: isMasterDataLoading,
  } = usePRMasterData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const hydrationIdRef = useRef<number | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConfirmRejectOpen, setIsConfirmRejectOpen] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const formMethods = useForm<AVFormData>({
    resolver: zodResolver(AVFormSchema) as Resolver<AVFormData>,
    mode: 'onBlur',
  });
  
  const { handleSubmit, setValue, reset, control } = formMethods;

  const { fields: lines } = useFieldArray({
    control,
    name: 'lines'
  });

  const handleFormError = useCallback((fieldErrors: FieldErrors<AVFormData>) => {
    logger.error("[useAVForm] Validation Errors:", fieldErrors);
    const errorMessages: string[] = [];
    const extractMessages = (errs: FieldErrors<AVFormData>) => {
      Object.values(errs).forEach((val) => {
        if (!val) return;
        if ('message' in val && typeof val.message === 'string') {
          errorMessages.push(val.message);
        } else if (typeof val === 'object') {
          extractMessages(val as FieldErrors<AVFormData>);
        }
      });
    };
    extractMessages(fieldErrors);
    const uniqueErrors = Array.from(new Set(errorMessages));
    if (uniqueErrors.length > 0) {
      toast(uniqueErrors.map(msg => `• ${msg}`).join('\n'), 'error', 'ตรวจสอบข้อมูลไม่ผ่าน');
    }
  }, [toast]);

  const loadPRData = useCallback(async (prId: number, itemArg?: Partial<ApprovalDetail> & { hasOtherAVs?: boolean }) => {
    // 🛑 Abort any previous hydration request for this instance
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsSubmitting(true);
    try {
      logger.info(`[useAVForm] Hydrating AV for PR ID: ${prId}`);
      
      let avDetails: ApprovalDetail | null = null;
      const targetApprovalId = itemArg?.approval_id;
      if (targetApprovalId) {
          try {
              avDetails = await AVService.getApprovalById(Number(targetApprovalId), { signal });
          } catch (err: unknown) {
              if (err instanceof Error && err.name !== 'AbortError' && err.name !== 'CanceledError') {
                  logger.warn('[useAVForm] Failed to fetch specific AV detail:', err);
              }
          }
      }

      const pr = await PRService.getDetail(prId, { signal });
      if (!pr) throw new Error('ไม่พบข้อมูล PR');

      const uniqueWhIds = Array.from(new Set((pr.lines || []).map((l: PRLine) => l.warehouse_id).filter(Boolean)));
      
      const locationMaps = await Promise.all(
        uniqueWhIds.map(async (whId) => {
          try {
            const res = await LocationService.getAll({ warehouse_id: Number(whId) }, { signal });
            return { whId: Number(whId), items: res?.items || [] };
          } catch (err: unknown) {
            if (err instanceof Error && (err.name === 'AbortError' || err.name === 'CanceledError')) {
                return { whId: Number(whId), items: [] };
            }
            logger.error(`[useAVForm] Failed to fetch locations for warehouse ${whId}:`, err);
            return { whId: Number(whId), items: [] };
          }
        })
      );

      const warehouseLookup: Record<number, string> = {};
      warehouses.forEach(w => {
        if (w.original) {
          warehouseLookup[Number(w.value)] = w.original.warehouse_code || w.original.warehouse_name || '';
        }
      });

      const itemLookup: Record<number, { code: string; name: string }> = {};
      masterItems.forEach(item => {
        itemLookup[item.item_id] = { code: item.item_code, name: item.item_name };
      });

      const unitLookup: Record<number, string> = {};
      masterUoms.forEach(u => {
        unitLookup[u.uom_id] = u.uom_name || u.uom_name_en || '';
      });

      const locationLookup: Record<number, string> = {};
      locationMaps.forEach(map => {
        map.items?.forEach((item: Location) => {
          locationLookup[item.location_id] = item.code || item.name_th;
        });
      });

      interface PRLineResponse extends PRLine {
        product_code?: string;
        product_name?: string;
        code?: string;
        name?: string;
        requested_qty?: number | string;
        price?: number | string;
        discount?: number | string;
        warehouse_code?: string;
        item?: PRLine['item'] & {
          uom?: { name: string };
          uom_name?: string;
        };
      }

      const isExistingAV = !!avDetails?.approval_id || !!itemArg?.approval_id;
      
      const prRaw = pr as unknown as Record<string, unknown>;
      const source = (prRaw.header || prRaw) as Record<string, unknown>; 
      const sourceLines = (prRaw.lines || source.lines || []) as PRLineResponse[];

      const mappedLines: AVLineFormData[] = sourceLines.map((line: PRLineResponse) => {
        const matchedAVLine = (avDetails?.pr_approval_lines || avDetails?.prApprovalLines || itemArg?.pr_approval_lines || itemArg?.prApprovalLines || [])
          .find((avL: ApprovalLine) => Number(avL.pr_line_id) === Number(line.pr_line_id));

        const statusStr = (source.status as string) || '';
        const isPartial = statusStr.toUpperCase() === 'PARTIAL';
        const rawQty = Number(line.qty || line.requested_qty || 0);
        const remainingQty = line.remaining_qty !== undefined ? Number(line.remaining_qty) : rawQty;
        
        // 🎯 For partial PRs, the actionable quantity is the remaining balance
        const qty = isPartial ? remainingQty : rawQty;
        const isApproved = isExistingAV ? !!matchedAVLine : true;

        return {
          pr_line_id: line.pr_line_id,
          item_id: line.item_id || line.item?.item_id,
          item_code: line.item_code || line.item?.item_code || itemLookup[Number(line.item_id || line.item?.item_id)]?.code || line.product_code || line.code || '',
          item_name: line.item_name || line.item?.item_name || itemLookup[Number(line.item_id || line.item?.item_id)]?.name || line.product_name || line.name || '',
          description: line.description || line.item?.description || '',
          requested_qty: qty,
          qty: qty,
          uom: line.uom || line.uom_code || unitLookup[Number(line.uom_id || line.item?.uom_id)] || line.item?.uom?.name || line.item?.uom_name || '',
          uom_id: line.uom_id || line.item?.uom_id,
          warehouse_id: line.warehouse_id,
          warehouse_code: line.warehouse_code || warehouseLookup[Number(line.warehouse_id)] || '',
          location: line.location || '',
          location_name: locationLookup[Number(line.location)] || line.location_name || line.location || '',
          unit_price: Number(line.est_unit_price || line.unit_price || line.price || 0),
          est_unit_price: Number(line.est_unit_price || line.unit_price || line.price || 0),
          total_amount: Number(line.est_amount || line.line_total || line.line_net_amount || 0),
          est_amount: Number(line.est_amount || line.line_total || line.line_net_amount || 0),
          is_approved: isApproved, 
          approved_qty: matchedAVLine ? Number(matchedAVLine.approved_qty) : (isApproved ? qty : 0),
          remark: matchedAVLine?.remarks || '',
          status: line.status || '',
          remaining_qty: Number(line.remaining_qty || 0),
          uom_code: line.uom_code || '',
          line_discount_raw: line.line_discount_raw || '',
          line_discount_amount: Number(line.line_discount_amount || 0),
          discount: Number(line.line_discount_amount || line.discount || 0),
        };
      });

      let vendorName = source.vendor_name || '';
      const vendorId = source.preferred_vendor_id;
      if (!vendorName && vendorId) {
        try {
          const vendorListRes = await VendorService.getList({ signal });
          const vendorItems = vendorListRes.items || [];
          const matched = vendorItems.find((v) => Number(v.vendor_id || v.id) === Number(vendorId));
          if (matched?.vendor_name) vendorName = matched.vendor_name;
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== 'AbortError' && err.name !== 'CanceledError') {
              logger.error('[useAVForm] Vendor lookup failed:', err);
          }
        }
      }

      hydrationIdRef.current = prId;
      setActiveId(prId);

      reset({
        ...source,
        approval_id: avDetails?.approval_id || itemArg?.approval_id,
        av_no: avDetails?.approval_no || itemArg?.approval_no || '',
        lines: mappedLines,
        pr_no: (source.pr_no as string) || '',
        purpose: ((source.purpose as string) || (source.remark as string) || '').trim(),
        need_by_date: (source.need_by_date as string) || '',
        pr_date: (source.pr_date as string) || '',
        vendor_name: vendorName,
        preparer_name: avDetails?.approval_emp_name || (source.requester_name as string) || '',
        requester_name: (source.requester_name as string) || (source.employee_name as string) || '',
        // 🎯 Prioritize the real PR status from the source header for new approvals
        status: (avDetails?.status || (isExistingAV ? itemArg?.status : null) || (source.status as string) || 'PENDING') as PRStatus,
        cost_center_id: source.cost_center_id ? Number(source.cost_center_id) : undefined,
        pr_tax_code_id: source.pr_tax_code_id ? Number(source.pr_tax_code_id) : undefined,
        pr_tax_rate: Number(source.pr_tax_rate || 0),
        isMulticurrency: (source.pr_base_currency_code || 'THB') !== 'THB',
        is_on_hold: source.is_on_hold ?? 'N',
        shipping_method: source.shipping_method || '',
        pr_base_currency_code: source.pr_base_currency_code || 'THB',
        pr_quote_currency_code: source.pr_quote_currency_code || 'THB',
        pr_exchange_rate: Number(source.pr_exchange_rate || 1),
        pr_exchange_rate_date: source.pr_exchange_rate_date || source.pr_date || '',
        pr_discount_raw: source.pr_discount_raw || '',
        total_amount: Number(source.total_amount || 0),
        requester_user_id: source.requester_user_id ? Number(source.requester_user_id) : 1,
      } as AVFormData);
    } catch (error: unknown) {
      if (error instanceof Error && (error.name === 'CanceledError' || error.name === 'AbortError')) return;
      logger.error('Failed to fetch AV details:', error);
      toast('ดึงข้อมูลผิดพลาด', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [reset, toast, warehouses, masterItems, masterUoms]);

  const loadAVData = useCallback(async (av: ApprovalHeader) => {
    if (!av.pr_id) return;
    await loadPRData(av.pr_id, av as unknown as ApprovalDetail);
  }, [loadPRData]);

  useEffect(() => {
    if (isOpen && id && !isMasterDataLoading && warehouses.length > 0 && masterItems.length > 0 && masterUoms.length > 0) {
      if (hydrationIdRef.current !== id) {
          loadPRData(id, approvalItem);
      }
    } else if (!isOpen) {
      hydrationIdRef.current = undefined;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [isOpen, id, isMasterDataLoading, warehouses.length, masterItems.length, masterUoms.length, loadPRData, approvalItem]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, []);

  const updateLine = useCallback((index: number, field: keyof AVLineFormData, value: string | number | boolean | undefined) => {
    const path = `lines.${index}.${field}` as Path<AVFormData>;
    setValue(path, value as FieldPathValue<AVFormData, typeof path>);
    
    // Auto reset approved_qty to 0 if unchecked
    if (field === 'is_approved' && value === false) {
      setValue(`lines.${index}.approved_qty` as Path<AVFormData>, 0 as FieldPathValue<AVFormData, Path<AVFormData>>);
    }
  }, [setValue]);

  const handleApprove = handleSubmit(() => {
    const data = formMethods.getValues();
    const hasApprovedItems = data.lines.some(line => line.is_approved);
    if (!hasApprovedItems) {
      toast('กรุณาเลือกรายการที่ต้องการอนุมัติอย่างน้อย 1 รายการ', 'error');
      return;
    }
    setIsConfirmModalOpen(true);
  }, handleFormError);

  const handleConfirmApprove = async () => {
    if (!activeId) return;
    const data = formMethods.getValues();

    const apiPayload = {
      approval_date: new Date().toISOString().split('T')[0],
      need_by_date: data.need_by_date ? new Date(data.need_by_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: (() => {
          const isAllApproved = data.lines.every(l => l.is_approved && Number(l.approved_qty) === Number(l.requested_qty));
          return isAllApproved ? 'APPROVED' : 'PARTIAL';
      })() as 'APPROVED' | 'PARTIAL',
      remarks: data.purpose || data.remark || "Approved",
      approval_emp_id: user?.employee_id || 1,
      approval_emp_name: user?.employee?.employee_fullname || "Admin",
      pr_id: Number(activeId),
      base_currency_code: data.pr_base_currency_code || 'THB',
      base_currency_id: Number(data.branch_id || 1),
      quote_currency_code: data.pr_quote_currency_code || 'THB',
      quote_currency_id: 1,
      exchange_rate: Number(data.pr_exchange_rate) || 1,
      exchange_rate_date: new Date().toISOString().split('T')[0],
      tax_code_id: Number(data.pr_tax_code_id) || 1,
      discount_expression: "0",
      pr_approval_lines: data.lines.filter(l => l.is_approved).map(line => ({
         approved_qty: Number(line.approved_qty),
         remarks: line.remark || "",
         pr_line_id: Number(line.pr_line_id || 1),
         approval_date: new Date().toISOString().split('T')[0]
      }))
    };

    setIsSubmitting(true);
    try {
      await AVService.approvePR(apiPayload);
      
      try {
        if (apiPayload.status === 'PARTIAL') {
          await PRService.update(Number(activeId), { status: 'PARTIAL' }, { skipToast: true });
        } else {
          await PRService.approvePR(Number(activeId), { skipToast: true });
        }
      } catch (err) {
        logger.warn('[useAVForm] PR approve sync failed (non-critical):', err);
      }

      toast('อนุมัติรายการสำเร็จ', 'success');
      queryClient.removeQueries({ queryKey: ['prs'] });
      onSuccess?.();
      onClose();
    } catch (error) {
      logger.error('[useAVForm] handleConfirmApprove error:', error);
      toast(extractErrorMessage(error), 'error');
    } finally {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
    }
  };

  const handleRejectInit = () => {
    const reason = formMethods.getValues('reject_reason');
    if (!reason?.trim()) {
      toast('กรุณาระบุเหตุผลที่ไมือนุมัติ', 'error');
      formMethods.setError('reject_reason', { type: 'required', message: 'กรุณาระบุเหตุผลที่ไม่อนุมัติ' });
      formMethods.setFocus('reject_reason');
      return;
    }
    setIsConfirmRejectOpen(true);
  };

  const handleConfirmReject = async () => {
    const reason = formMethods.getValues('reject_reason');
    if (!activeId) return;
    const data = formMethods.getValues();

    const apiPayload = {
      approval_date: new Date().toISOString().split('T')[0],
      need_by_date: data.need_by_date ? new Date(data.need_by_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: "REJECTED" as const,
      remarks: reason || "Rejected",
      approval_emp_id: user?.employee_id || 1,
      approval_emp_name: user?.employee?.employee_fullname || "Admin",
      pr_id: Number(activeId),
      base_currency_code: data.pr_base_currency_code || 'THB',
      base_currency_id: 1,
      quote_currency_code: data.pr_quote_currency_code || 'THB',
      quote_currency_id: 1,
      exchange_rate: Number(data.pr_exchange_rate) || 1,
      exchange_rate_date: new Date().toISOString().split('T')[0],
      tax_code_id: Number(data.pr_tax_code_id) || 1,
      discount_expression: "0",
      pr_approval_lines: data.lines.map(line => ({
         approved_qty: 0,
         remarks: line.remark || "ok",
         pr_line_id: Number(line.pr_line_id || 1),
         approval_date: new Date().toISOString().split('T')[0]
      }))
    };

    setIsRejecting(true);
    try {
      await AVService.rejectPR(apiPayload);

      try {
        await PRService.rejectPR(Number(activeId), reason || 'Rejected', { skipToast: true });
      } catch (err) {
        logger.error('[useAVForm] PR status sync failed:', err);
        toast('บันทึกการไม่อนุมัติแล้ว แต่ไม่สามารถอัปเดตสถานะที่หน้ารายการ PR ได้กรุณารีเฟรชหน้าจอ', 'warning');
      }

      toast('ไม่อนุมัติรายการสำเร็จ', 'success');
      queryClient.removeQueries({ queryKey: ['prs'] });
      queryClient.removeQueries({ queryKey: ['pr', Number(activeId)] });
      queryClient.removeQueries({ queryKey: ['approvals'] });
      
      onSuccess?.();
      onClose();
    } catch (error) {
      toast(extractErrorMessage(error), 'error');
    } finally {
      setIsRejecting(false);
      setIsConfirmRejectOpen(false);
    }
  };

  return {
    isSubmitting,
    purchaseTaxOptions,
    currencies,
    costCenters,
    projects,
    updateLine,
    handleApprove,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    handleConfirmApprove,
    isConfirmRejectOpen,
    setIsConfirmRejectOpen,
    handleRejectInit,
    handleConfirmReject,
    isRejecting,
    formMethods,
    lines,
    handleFormError,
    loadPRData,
    loadAVData,
    activeId,
  };
};
