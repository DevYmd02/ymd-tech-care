/**
 * @file useAQForm.ts
 * @description Form logic for Sales Quotation Approval (AQ)
 * @pattern Mirrors useAVForm.ts from Procurement domain
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { FieldErrors, Path, FieldPathValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { extractErrorMessage } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';

import { AQFormSchema } from '../schemas/aq.schema';
import type { AQFormData, AQLineFormData } from '../schemas/aq.schema';
import { AQService } from '../services/aq.service';
import type { SQForApproval, SQLineForApproval, ApproveQuotationPayload } from '../types/quotation-approve.types';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface UseAQFormProps {
  sqId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  approvalItem?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — map raw SQ API to SQForApproval
// ─────────────────────────────────────────────────────────────────────────────

function normalizeSQ(raw: unknown): SQForApproval | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  // Unwrap { data: [...] } or { sale_quotation: {...} } or [ {...} ]
  let obj = (r.data && typeof r.data === 'object') ? r.data as Record<string, unknown> :
            (r.sale_quotation && typeof r.sale_quotation === 'object') ? r.sale_quotation as Record<string, unknown> :
            (r.quotation && typeof r.quotation === 'object') ? r.quotation as Record<string, unknown> : r;

  // Handle single-item arrays (common in this backend)
  if (Array.isArray(obj)) {
    obj = (obj[0] || {}) as Record<string, unknown>;
  }

  // Basic validation — must have some unique ID
  const sqId = Number(obj.sq_id || obj.id || obj.sale_quotation_id || obj.ID || 0);
  if (!sqId) {
    logger.warn('[useAQForm] normalizeSQ failed: No valid ID found in response', obj);
    return null;
  }

  const rawLines: unknown[] =
    Array.isArray(obj.sale_quotation_lines) ? (obj.sale_quotation_lines as unknown[]) :
    Array.isArray(obj.saleQuotationLines) ? (obj.saleQuotationLines as unknown[]) :
    Array.isArray(obj.lines) ? (obj.lines as unknown[]) : [];

  const lines: SQLineForApproval[] = rawLines.map((l) => {
    const line = l as Record<string, unknown>;
    return {
      sq_line_id: Number(line.sq_line_id || line.id || 0),
      item_id: Number(line.item_id || 0),
      item_code: String(line.item_code || (line.item as Record<string, unknown>)?.item_code || line.code || ''),
      item_name: String(line.item_name || (line.item as Record<string, unknown>)?.item_name || line.description || line.name || ''),
      qty: Number(line.qty || line.quantity || 0),
      uom_id: Number(line.uom_id || 0),
      uom_name: String(line.uom_name || (line.uom as Record<string, unknown>)?.uom_name || line.unit_name || ''),
      unit_price: Number(line.unit_price || line.price || 0),
      discount_expression: String(line.discount_expression || line.line_discount_input || line.discount_input || '0'),
      discount_amount: Number(line.line_discount || line.discount_amount || 0),
      net_amount: Number(line.line_total || line.net_amount || 0),
      note: String(line.note || line.remarks || ''),
      remarks: String(line.remarks || line.note || ''),
      tax_code_id: line.tax_code_id ? Number(line.tax_code_id) : null,
    };
  });

  return {
    sq_id: sqId,
    sq_no: String(obj.sq_no || obj.code || obj.no || ''),
    sq_date: String(obj.sq_date || obj.date || '').split('T')[0],
    customer_id: Number(obj.customer_id || 0),
    customer_name: String(obj.customer_name_th || obj.customer_name || (obj.customer as Record<string, unknown>)?.customer_name_th || ''),
    customer_code: String(obj.customer_code || (obj.customer as Record<string, unknown>)?.customer_code || ''),
    status: String(obj.status || 'PENDING'),

    base_currency_code: String(
      obj.base_currency_code || 
      (obj.base_currency as Record<string, unknown>)?.currency_code || 
      obj.currency_code || 
      'THB'
    ),
    base_currency_id: Number(
      obj.base_currency_id || 
      (obj.base_currency as Record<string, unknown>)?.id || 
      (obj.base_currency as Record<string, unknown>)?.currency_id || 
      obj.currency_id || 
      1
    ),
    quote_currency_code: String(
      obj.quote_currency_code || 
      (obj.quote_currency as Record<string, unknown>)?.currency_code || 
      obj.currency_code || 
      'THB'
    ),
    quote_currency_id: Number(
      obj.quote_currency_id || 
      (obj.quote_currency as Record<string, unknown>)?.id || 
      (obj.quote_currency as Record<string, unknown>)?.currency_id || 
      obj.currency_id || 
      1
    ),
    exchange_rate: Number(obj.exchange_rate || 1),
    exchange_rate_date: String(obj.exchange_rate_date || obj.sq_date || obj.date || '').split('T')[0],

    sub_total: Number(obj.sub_total || 0),
    total_amount: Number(obj.total_amount || obj.quote_total_amount || 0),
    base_total_amount: Number(obj.base_total_amount || obj.total_amount || 0),
    quote_total_amount: Number(obj.quote_total_amount || obj.total_amount || 0),
    vat_amount: Number(obj.vat_amount || obj.quote_tax_amount || 0),
    base_tax_amount: Number(obj.base_tax_amount || obj.vat_amount || 0),
    quote_tax_amount: Number(obj.quote_tax_amount || obj.vat_amount || 0),
    tax_code_id: obj.tax_code_id ? Number(obj.tax_code_id) : undefined,
    tax_rate: Number(obj.tax_rate || 0),
    discount_expression: String(obj.discount_expression || obj.discount_input || '0'),
    discount_amount: Number(obj.discount_amount || obj.quote_discount_amount || 0),
    base_discount_amount: Number(obj.base_discount_amount || obj.discount_amount || 0),
    quote_discount_amount: Number(obj.quote_discount_amount || obj.discount_amount || 0),

    remarks: String(obj.remarks || ''),
    valid_until: String(obj.valid_until || obj.expiry_date || obj.due_date || '').split('T')[0],
    payment_term_days: Number(obj.payment_term_days || 0),

    // Master Data Reference
    branch_id: Number(obj.branch_id || (obj.branch as Record<string, unknown>)?.branch_id || 0),
    branch_name: String(obj.branch_name || (obj.branch as Record<string, unknown>)?.branch_name || ''),
    lead_id: String(obj.lead_id || obj.lead_no || ''),
    emp_dept_id: Number(obj.emp_dept_id || (obj.department as Record<string, unknown>)?.emp_dept_id || 0),
    emp_dept_name: String(obj.emp_dept_name || (obj.department as Record<string, unknown>)?.emp_dept_name || ''),
    project_id: Number(obj.project_id || (obj.project as Record<string, unknown>)?.project_id || 0),
    project_name: String(obj.project_name || (obj.project as Record<string, unknown>)?.project_name || ''),
    emp_area_id: Number(obj.emp_area_id || (obj.saleArea as Record<string, unknown>)?.sale_area_id || 0),
    emp_area_name: String(obj.emp_area_name || (obj.saleArea as Record<string, unknown>)?.sale_area_name || ''),
    tax_code: String(obj.tax_code || (obj.taxCode as Record<string, unknown>)?.tax_code || ''),

    // Approval Metadata
    approval_emp_id: Number(obj.approval_emp_id || 0),
    approval_emp_name: String(obj.approval_emp_name || ''),

    isMulticurrency: Boolean(
      obj.isMulticurrency || 
      obj.is_multicurrency ||
      ((obj.quote_currency_code || (obj.quote_currency as Record<string, unknown>)?.currency_code || obj.currency_code) && 
       (obj.quote_currency_code || (obj.quote_currency as Record<string, unknown>)?.currency_code || obj.currency_code) !== 'THB')
    ),

    lines,
    saleQuotationLines: lines,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export const useAQForm = ({ sqId, isOpen, onClose, onSuccess, approvalItem }: UseAQFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeId, setActiveId] = useState<number | undefined>(sqId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConfirmRejectOpen, setIsConfirmRejectOpen] = useState(false);
  const prevIsOpenRef = useRef(false);

  useEffect(() => { setActiveId(sqId); }, [sqId]);

  const showAlert = useCallback((msg: string) => toast(msg, 'error'), [toast]);

  // ── Form Setup ──────────────────────────────────────────────────────────────
  const formMethods = useForm<AQFormData>({
    resolver: zodResolver(AQFormSchema) as unknown as never,
    mode: 'onBlur',
  });

  const { handleSubmit, setValue, reset, control, formState: { errors } } = formMethods;

  const { fields: lines } = useFieldArray({ control, name: 'lines' });

  // ── Error Handler ───────────────────────────────────────────────────────────
  const handleFormError = useCallback((fieldErrors: FieldErrors<AQFormData>) => {
    logger.error('[useAQForm] Validation Errors:', fieldErrors);
    const msgs: string[] = [];
    const extract = (errs: object) => {
      Object.values(errs).forEach((val) => {
        if (!val) return;
        if (typeof (val as { message?: string }).message === 'string') {
          msgs.push((val as { message: string }).message);
        } else if (typeof val === 'object') {
          extract(val as object);
        }
      });
    };
    extract(fieldErrors);
    const unique = Array.from(new Set(msgs));
    if (unique.length > 0) {
      toast(unique.map(m => `• ${m}`).join('\n'), 'error', 'ตรวจสอบข้อมูลไม่ผ่าน');
    }
  }, [toast]);

  // ── Load SQ Data into Form ──────────────────────────────────────────────────
  const loadSQData = useCallback(async (id: number, aqItemArg?: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const raw = await AQService.getSQById(id);
      const sq = normalizeSQ(raw);
      if (!sq) { showAlert('ไม่พบข้อมูลใบเสนอราคา'); return; }

      setActiveId(id);
      logger.info('[useAQForm] Loaded SQ:', sq.sq_no);

      // If opening an existing AQ, try to load AQ detail for pre-fill
      let aqDetails: Record<string, unknown> | null = null;
      const targetAqId = aqItemArg?.aq_id;
      if (targetAqId) {
        try {
          aqDetails = await AQService.getApprovalById(Number(targetAqId)) as Record<string, unknown>;
        } catch (err) {
          logger.warn('[useAQForm] Failed to fetch AQ detail:', err);
        }
      }

      // Map AQ lines from existing record
      const aqLines: Array<Record<string, unknown>> =
        Array.isArray((aqDetails as Record<string, unknown>)?.sq_approval_lines)
          ? (aqDetails as Record<string, unknown>).sq_approval_lines as Array<Record<string, unknown>>
          : [];

      const aqLineMap = new Map<number, Record<string, unknown>>();
      aqLines.forEach((al) => {
        aqLineMap.set(Number(al.sq_line_id || al.aq_line_id), al);
      });

      // Build form lines by merging SQ line + AQ approval line
      const mappedLines = sq.lines.map((sqLine): AQLineFormData => {
        const aqLine = aqLineMap.get(Number(sqLine.sq_line_id));
        const isNew = !aqItemArg?.aq_id || aqItemArg?.status === 'PENDING';

        const originalQty = Number(sqLine.qty || 0);
        const discExpr = sqLine.discount_expression || '0';
        const discAmt = Number(sqLine.discount_amount ?? sqLine.line_discount ?? 0);
        const netAmt = Number(sqLine.net_amount ?? sqLine.line_total ?? 0);

        const approvedQty = aqLine
          ? Number(aqLine.approved_qty || 0)
          : (isNew ? originalQty : 0);

        // Compute approved net: approved_qty * unit_price - discount_proportional
        const approvedNet = approvedQty > 0
          ? (approvedQty * Number(sqLine.unit_price || 0)) - (originalQty > 0 ? (discAmt * approvedQty / originalQty) : 0)
          : 0;

        return {
          sq_line_id: Number(sqLine.sq_line_id),
          item_id: Number(sqLine.item_id),
          item_code: sqLine.item_code || '',
          item_name: sqLine.item_name || '',
          qty: originalQty,
          uom_id: Number(sqLine.uom_id),
          uom_name: sqLine.uom_name || '',
          unit_price: Number(sqLine.unit_price),
          discount_expression: discExpr,
          discount_amount: discAmt,
          net_amount: netAmt,
          is_approved: aqLine ? Number(aqLine.approved_qty || 0) > 0 : isNew,
          approved_qty: approvedQty,
          approved_net_amount: Number(approvedNet.toFixed(2)),
          remarks: String(aqLine?.remarks || sqLine.note || sqLine.remarks || ''),
        };
      });

      // Reset form with SQ data
      reset({
        aq_id: aqDetails ? Number((aqDetails as Record<string, unknown>).aq_id) : undefined,
        aq_no: String((aqDetails as Record<string, unknown>)?.aq_no || aqItemArg?.aq_no || ''),
        aq_date: String((aqDetails as Record<string, unknown>)?.aq_date || '').split('T')[0],
        sq_id: sq.sq_id,
        sq_no: sq.sq_no,
        sq_date: sq.sq_date,
        customer_name: sq.customer_name || '',
        customer_code: sq.customer_code || '',
        status: String(
          (aqDetails as Record<string, unknown>)?.status ||
          aqItemArg?.status ||
          sq.status
        ) as AQFormData['status'],
        reject_reason: String((aqDetails as Record<string, unknown>)?.status === 'REJECTED'
          ? ((aqDetails as Record<string, unknown>).remarks || '')
          : ''),
        approval_emp_id: user?.employee_id || 1,
        approval_emp_name: user?.employee?.employee_fullname || 'Admin',

        base_currency_code: sq.base_currency_code || 'THB',
        base_currency_id: sq.base_currency_id || 1,
        quote_currency_code: sq.quote_currency_code || 'THB',
        quote_currency_id: sq.quote_currency_id || 1,
        exchange_rate: sq.exchange_rate || 1,
        exchange_rate_date: sq.exchange_rate_date || sq.sq_date,

        sub_total: sq.sub_total || 0,
        base_total_amount: sq.base_total_amount || 0,
        quote_total_amount: sq.quote_total_amount || sq.total_amount || 0,
        tax_code_id: sq.tax_code_id ?? null,
        tax_rate: sq.tax_rate || 0,
        base_tax_amount: sq.base_tax_amount || 0,
        quote_tax_amount: sq.quote_tax_amount || sq.vat_amount || 0,
        discount_expression: sq.discount_expression || '0',
        discount_rate: 0,
        base_discount_amount: sq.base_discount_amount || 0,
        quote_discount_amount: sq.quote_discount_amount || sq.discount_amount || 0,

        valid_until: sq.valid_until || '',
        payment_term_days: sq.payment_term_days || 0,
        remarks: sq.remarks || '',

        lines: mappedLines,
      });
    } catch (err) {
      logger.error('[useAQForm] loadSQData failed:', err);
      showAlert('โหลดข้อมูลใบเสนอราคาไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  }, [reset, user, showAlert]);

  // ── Auto-load on open ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && sqId && !prevIsOpenRef.current) {
      prevIsOpenRef.current = true;
      const timer = setTimeout(() => { loadSQData(sqId, approvalItem); }, 0);
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      prevIsOpenRef.current = false;
    }
  }, [isOpen, sqId, loadSQData, approvalItem]);

  // ── Update Line helper ──────────────────────────────────────────────────────
  const updateLine = useCallback((
    index: number,
    field: keyof AQLineFormData,
    value: unknown
  ) => {
    const path = `lines.${index}.${field}` as Path<AQFormData>;
    setValue(path, value as FieldPathValue<AQFormData, typeof path>);

    // If uncheck approval → reset approved_qty to 0
    if (field === 'is_approved' && value === false) {
      setValue(`lines.${index}.approved_qty` as Path<AQFormData>, 0 as never);
      setValue(`lines.${index}.approved_net_amount` as Path<AQFormData>, 0 as never);
    }

    // If approved_qty changes → recalculate approved_net_amount
    if (field === 'approved_qty') {
      const currentLines = formMethods.getValues('lines');
      const line = currentLines[index];
      if (line) {
        const approvedQty = Number(value || 0);
        const origQty = line.qty || 0;
        const discAmt = line.discount_amount || 0;
        const netApproved = origQty > 0
          ? (approvedQty * line.unit_price) - (discAmt * approvedQty / origQty)
          : 0;
        setValue(
          `lines.${index}.approved_net_amount` as Path<AQFormData>,
          Number(netApproved.toFixed(2)) as never
        );
      }
    }
  }, [setValue, formMethods]);

  // ── Approve ─────────────────────────────────────────────────────────────────
  const handleApprove = handleSubmit(() => {
    const data = formMethods.getValues();
    const hasApproved = data.lines.some(l => l.is_approved);
    if (!hasApproved) {
      toast('กรุณาเลือกรายการที่ต้องการอนุมัติอย่างน้อย 1 รายการ', 'error');
      return;
    }
    setIsConfirmModalOpen(true);
  }, handleFormError);

  const handleConfirmApprove = async () => {
    if (!activeId) return;
    const data = formMethods.getValues();

    const approvedLines = data.lines.filter(l => l.is_approved);
    const isAllApproved = approvedLines.length === data.lines.length &&
      data.lines.every(l => l.is_approved && Number(l.approved_qty) >= Number(l.qty));
    const finalStatus: 'APPROVED' | 'REJECTED' = isAllApproved ? 'APPROVED' : 'APPROVED'; // partial → still APPROVED

    const approvedTotal = data.lines.reduce((sum, l) => sum + (l.is_approved ? (l.approved_net_amount || 0) : 0), 0);
    const rate = data.exchange_rate || 1;

    const payload: ApproveQuotationPayload = {
      sq_id: Number(activeId),
      aq_date: new Date().toISOString().split('T')[0],
      status: finalStatus,
      remarks: data.remarks || 'Approved',
      approval_emp_id: user?.employee_id || 1,
      approval_emp_name: user?.employee?.employee_fullname || 'Admin',
      base_currency_code: data.base_currency_code || 'THB',
      base_currency_id: data.base_currency_id || 1,
      quote_currency_code: data.quote_currency_code || 'THB',
      quote_currency_id: data.quote_currency_id || 1,
      exchange_rate: data.exchange_rate || 1,
      exchange_rate_date: data.exchange_rate_date || new Date().toISOString().split('T')[0],
      base_total_amount: Number((approvedTotal * rate).toFixed(2)),
      quote_total_amount: Number(approvedTotal.toFixed(2)),
      tax_code_id: data.tax_code_id ? Number(data.tax_code_id) : undefined,
      tax_rate: data.tax_rate || 0,
      base_tax_amount: data.base_tax_amount || 0,
      quote_tax_amount: data.quote_tax_amount || 0,
      discount_expression: data.discount_expression || '0',
      base_discount_amount: data.base_discount_amount || 0,
      quote_discount_amount: data.quote_discount_amount || 0,
      sq_approval_lines: data.lines.filter(l => l.is_approved).map(l => ({
        sq_line_id: l.sq_line_id,
        approved_qty: Number(l.approved_qty),
        remarks: l.remarks || 'ok',
        unit_price: l.unit_price,
        discount_expression: l.discount_expression,
        net_amount: Number(l.approved_net_amount),
      })),
    };

    setIsSubmitting(true);
    try {
      await AQService.createApproval(payload);

      // Sync SQ status → ACCEPTED
      try {
        await AQService.updateSQStatus(activeId, 'ACCEPTED');
      } catch (err) {
        logger.warn('[useAQForm] SQ status sync failed (non-critical):', err);
      }

      toast('อนุมัติใบเสนอราคาสำเร็จ', 'success');
      queryClient.removeQueries({ queryKey: ['quotations'] });
      queryClient.removeQueries({ queryKey: ['sq-approvals'] });
      onSuccess?.();
      onClose();
    } catch (err) {
      toast(extractErrorMessage(err), 'error');
    } finally {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
    }
  };

  // ── Reject ──────────────────────────────────────────────────────────────────
  const handleRejectInit = () => {
    const reason = formMethods.getValues('reject_reason');
    if (!reason?.trim()) {
      toast('กรุณาระบุเหตุผลที่ไม่อนุมัติ', 'error');
      formMethods.setError('reject_reason', { type: 'required', message: 'กรุณาระบุเหตุผล' });
      formMethods.setFocus('reject_reason');
      return;
    }
    setIsConfirmRejectOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!activeId) return;
    const data = formMethods.getValues();
    const reason = data.reject_reason || 'Rejected';
    const rate = data.exchange_rate || 1;

    const payload: ApproveQuotationPayload = {
      sq_id: Number(activeId),
      aq_date: new Date().toISOString().split('T')[0],
      status: 'REJECTED',
      remarks: reason,
      approval_emp_id: user?.employee_id || 1,
      approval_emp_name: user?.employee?.employee_fullname || 'Admin',
      base_currency_code: data.base_currency_code || 'THB',
      base_currency_id: data.base_currency_id || 1,
      quote_currency_code: data.quote_currency_code || 'THB',
      quote_currency_id: data.quote_currency_id || 1,
      exchange_rate: data.exchange_rate || 1,
      exchange_rate_date: data.exchange_rate_date || new Date().toISOString().split('T')[0],
      base_total_amount: Number((data.quote_total_amount * rate).toFixed(2)),
      quote_total_amount: data.quote_total_amount || 0,
      tax_code_id: data.tax_code_id ? Number(data.tax_code_id) : undefined,
      quote_tax_amount: data.quote_tax_amount || 0,
      discount_expression: data.discount_expression || '0',
      quote_discount_amount: data.quote_discount_amount || 0,
      sq_approval_lines: data.lines.map(l => ({
        sq_line_id: l.sq_line_id,
        approved_qty: 0,
        remarks: reason,
      })),
    };

    setIsRejecting(true);
    try {
      await AQService.createApproval(payload);

      try {
        await AQService.updateSQStatus(activeId, 'REJECTED');
      } catch (err) {
        logger.error('[useAQForm] SQ status sync failed:', err);
        toast('บันทึกการไม่อนุมัติแล้ว แต่อัปเดตสถานะ SQ ไม่สำเร็จ กรุณารีเฟรชหน้า', 'warning');
      }

      toast('ไม่อนุมัติใบเสนอราคาสำเร็จ', 'success');
      queryClient.removeQueries({ queryKey: ['quotations'] });
      queryClient.removeQueries({ queryKey: ['sq-approvals'] });
      onSuccess?.();
      onClose();
    } catch (err) {
      toast(extractErrorMessage(err), 'error');
    } finally {
      setIsRejecting(false);
      setIsConfirmRejectOpen(false);
    }
  };

  return {
    isSubmitting,
    isRejecting,
    formMethods,
    lines,
    errors,
    activeId,
    updateLine,
    loadSQData,
    handleApprove,
    handleConfirmApprove,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    handleRejectInit,
    handleConfirmReject,
    isConfirmRejectOpen,
    setIsConfirmRejectOpen,
    handleFormError,
  };
};
