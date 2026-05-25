/**
 * @file useAQForm.ts
 * @description Form logic for Sales Quotation Approval (AQ) - Refactored to inherit from useApprovalForm
 */

import { useMemo, useCallback } from 'react';
import { useApprovalForm } from '../../shared/hooks/useApprovalForm';
import type { GenericLineItem } from '../../shared/hooks/useApprovalForm';
import { AQFormSchema } from '../schemas/aq.schema';
import type { AQFormData } from '../schemas/aq.schema';
import { AQService } from '../services/aq.service';
import type { SQForApproval, AQListItem, SQLineForApproval, ApproveQuotationPayload, AQLineFormData } from '../types/quotation-approve.types';

// Utils / Mappings
import { normalizeSQ, findLines, mapAQFormDataLines, recoverApprovalPriceSources } from '../utils/aq-mapping';

import type { UserProfile } from '@core/auth/auth.service';

export interface UseAQFormProps {
  sqId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  approvalItem?: SQForApproval | AQListItem;
}

export const useAQForm = ({ sqId, isOpen, onClose, onSuccess, approvalItem }: UseAQFormProps) => {
  const initialValues: AQFormData = useMemo(() => ({
    aq_id: undefined,
    aq_no: '',
    aq_date: '',
    sq_id: 0,
    sq_no: '',
    sq_date: '',
    customer_id: 0,
    customer_name: '',
    customer_code: '',
    status: 'PENDING',
    reject_reason: '',
    approval_emp_id: 0,
    approval_emp_name: '',
    isMulticurrency: false,
    base_currency_code: 'THB',
    base_currency_id: 1,
    quote_currency_code: 'THB',
    quote_currency_id: 1,
    exchange_rate: 1,
    exchange_rate_date: '',
    sub_total: 0,
    base_total_amount: 0,
    quote_total_amount: 0,
    tax_code_id: null,
    tax_code: '',
    tax_rate: 0,
    base_tax_amount: 0,
    quote_tax_amount: 0,
    discount_expression: '0',
    discount_rate: 0,
    base_discount_amount: 0,
    quote_discount_amount: 0,
    branch_id: 0,
    branch_name: '',
    lead_id: '',
    emp_dept_id: 0,
    emp_dept_name: '',
    project_id: 0,
    project_name: '',
    sale_area_id: 0,
    sale_area_name: '',
    emp_sale_id: 0,
    emp_sale_name: '',
    valid_until: '',
    payment_term_days: 0,
    onhold: 'N',
    remarks: '',
    lines: [],
  }), []);

  const buildApprovePayload = useCallback((data: AQFormData, activeId: string | number, user: UserProfile | null) => {
    const approval_emp_id = user?.employee_id || user?.id || 1;
    return {
      sq_id: Number(activeId),
      aq_date: new Date().toISOString().split('T')[0],
      status: 'APPROVED' as const,
      remarks: data.remarks || '',
      approval_emp_id: Number(approval_emp_id),
      approval_emp_name: user?.employee?.employee_fullname || user?.username || 'System',
      base_currency_code: data.base_currency_code || 'THB',
      quote_currency_code: data.quote_currency_code || 'THB',
      exchange_rate: Number(data.exchange_rate || 1),
      exchange_rate_date: data.exchange_rate_date || new Date().toISOString().split('T')[0],
      tax_code_id: data.tax_code_id ? Number(data.tax_code_id) : undefined,
      discount_expression: data.discount_expression || '0',
      aq_lines: data.lines.filter(l => l.is_approved).map(l => ({
        sq_line_id: Number(l.sq_line_id),
        item_id: Number(l.item_id),
        qty: Number(l.qty),
        uom_id: Number(l.item_uom_id || l.uom_id),
        approved_qty: Number(l.approved_qty || 0),
        unit_price: Number(l.unit_price),
        discount_expression: l.discount_expression || '0',
        remarks: l.remarks || '',
      })),
    };
  }, []);
 
  const buildRejectPayload = useCallback((data: AQFormData, activeId: string | number, user: UserProfile | null, reason: string) => {
    const approval_emp_id = user?.employee_id || user?.id || 1;
    return {
      sq_id: Number(activeId),
      aq_date: new Date().toISOString().split('T')[0],
      status: 'REJECTED' as const,
      remarks: reason,
      approval_emp_id: Number(approval_emp_id),
      approval_emp_name: user?.employee?.employee_fullname || user?.username || 'System',
      base_currency_code: data.base_currency_code || 'THB',
      quote_currency_code: data.quote_currency_code || 'THB',
      exchange_rate: Number(data.exchange_rate || 1),
      exchange_rate_date: data.exchange_rate_date || new Date().toISOString().split('T')[0],
      aq_lines: data.lines.map(l => ({
        sq_line_id: Number(l.sq_line_id),
        item_id: Number(l.item_id),
        qty: Number(l.qty),
        uom_id: Number(l.item_uom_id || l.uom_id),
        approved_qty: 0,
        unit_price: Number(l.unit_price),
        remarks: reason,
      })),
    };
  }, []);

  const mapLinesFn = useCallback((
    rawLines: unknown[],
    discoveredApprovalLines: unknown[],
    fallbackApprovalLines: unknown[],
    isNew: boolean,
    isHistory: boolean,
    status: string
  ) => {
    return mapAQFormDataLines(
      rawLines as SQLineForApproval[],
      discoveredApprovalLines,
      fallbackApprovalLines,
      isNew,
      isHistory,
      status
    );
  }, []);

  const {
    isSubmitting,
    isRejecting,
    formMethods,
    lines,
    errors,
    activeId,
    updateLine,
    loadDocumentData,
    handleApprove,
    handleConfirmApprove,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    handleRejectInit,
    handleConfirmReject,
    isConfirmRejectOpen,
    setIsConfirmRejectOpen,
    currencies,
    priceLevelNames,
  } = useApprovalForm<AQFormData, ApproveQuotationPayload>({
    documentId: sqId,
    isOpen,
    onClose,
    onSuccess,
    documentType: 'SQ',
    schema: AQFormSchema,
    initialValues,
    fetchDetail: AQService.getSQById,
    createApproval: AQService.createApproval,
    normalizeFn: normalizeSQ,
    findLinesFn: findLines,
    mapLinesFn,
    recoverPriceSources: useCallback(async (
      lines: GenericLineItem[],
      customerId: number,
      branchId: number,
      setLines: (newLines: GenericLineItem[]) => void
    ) => {
      await recoverApprovalPriceSources(
        lines as AQLineFormData[],
        customerId,
        branchId,
        setLines as (lines: AQLineFormData[]) => void
      );
    }, []),
    buildApprovePayload,
    buildRejectPayload,
    lineFields: {
      lineId: 'sq_line_id',
      isApproved: 'is_approved',
      approvedQty: 'approved_qty',
      approvedNetAmount: 'approved_net_amount',
      qty: 'qty',
      unitPrice: 'unit_price',
      discountAmount: 'discount_amount',
      netAmount: 'net_amount',
      remarks: 'remarks',
    },
    queryKeysToInvalidate: [['quotations'], ['sq-approvals']],
    toastMessages: {
      approveSuccess: 'อนุมัติใบเสนอราคาสำเร็จ',
      rejectSuccess: 'ไม่อนุมัติใบเสนอราคาสำเร็จ',
      loadError: 'โหลดข้อมูลใบเสนอราคาไม่สำเร็จ',
    },
    approvalItem,
  });

  return {
    isSubmitting,
    isRejecting,
    formMethods,
    lines,
    errors,
    activeId,
    updateLine,
    loadSQData: loadDocumentData,
    handleApprove,
    handleConfirmApprove,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    handleRejectInit,
    handleConfirmReject,
    isConfirmRejectOpen,
    setIsConfirmRejectOpen,
    currencies,
    priceLevelNames,
  };
};
