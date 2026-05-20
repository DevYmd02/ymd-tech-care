/**
 * @file useAOForm.ts
 * @description Form logic for Sales Order Approval (AO) - Refactored to inherit from useApprovalForm
 */

import { useMemo, useCallback } from 'react';
import { useApprovalForm } from '../../shared/hooks/useApprovalForm';
import type { GenericLineItem } from '../../shared/hooks/useApprovalForm';
import { calculateLineTotal } from '../../shared/utils/sales-calculations';
import { AOFormSchema } from '../schemas/ao.schema';
import type { AOFormData } from '../schemas/ao.schema';
import { AOService } from '../services/ao.service';
import type { SOForApproval, AOListItem, ApproveSalesOrderPayload } from '../types/sales-order-approval.types';

// Helper functions for raw SO API mapping
const findObject = (source: Record<string, unknown>): Record<string, unknown> => {
  if (source.rawData && typeof source.rawData === 'object' && !Array.isArray(source.rawData)) return source.rawData as Record<string, unknown>;
  if (Array.isArray(source.data) && source.data[0]) {
    const first = source.data[0] as Record<string, unknown>;
    if (first.header || first.sale_order_header) return (first.header || first.sale_order_header) as Record<string, unknown>;
    return first;
  }
  if (source.data && typeof source.data === 'object' && !Array.isArray(source.data)) {
    const d = source.data as Record<string, unknown>;
    if (d.header || d.sale_order_header || d.so_header) return (d.header || d.sale_order_header || d.so_header) as Record<string, unknown>;
    if (d.so_id || d.so_no || d.id) return d;
  }
  const priority = ['sale_order_header', 'so_header', 'header', 'sale_order', 'so'];
  for (const p of priority) {
    const val = source[p];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const v = val as Record<string, unknown>;
      if (v.so_id || v.so_no || v.id) return v;
    }
  }
  if (source.so_id || source.so_no || source.id || source.sale_order_id) return source;
  if (source.data && typeof source.data === 'object' && !Array.isArray(source.data)) return source.data as Record<string, unknown>;
  return source;
};

const findLines = (source: unknown): unknown[] => {
  if (!source || typeof source !== 'object') return [];
  const src = source as Record<string, unknown>;
  const priority = ['saleOrderLines', 'sale_order_lines', 'so_lines', 'lines', 'items', 'sale_order_detail', 'sale_order_line', 'so_line'];
  for (const p of priority) {
    if (Array.isArray(src[p]) && (src[p] as unknown[]).length > 0) return src[p] as unknown[];
  }
  const lineKey = Object.keys(src).find(k => (k.toLowerCase().includes('line') || k.toLowerCase().includes('item')) && Array.isArray(src[k]) && (src[k] as unknown[]).length > 0);
  if (lineKey) return src[lineKey] as unknown[];
  const firstArray = Object.keys(src).find(k => Array.isArray(src[k]) && (src[k] as unknown[]).length > 0);
  return firstArray ? (src[firstArray] as unknown[]) : [];
};

function normalizeSO(raw: unknown): SOForApproval | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const obj = findObject(r);

  const customer = (obj.customer || obj.customer_header || obj.customer_ref || {}) as Record<string, unknown>;
  const branch = (obj.branch || obj.branch_header || obj.branch_ref || {}) as Record<string, unknown>;
  const dept = (obj.dept || obj.department || obj.emp_dept || obj.dept_ref || {}) as Record<string, unknown>;
  const tax = (obj.tax_code || obj.tax || obj.taxCode || obj.tax_ref || {}) as Record<string, unknown>;
  const reservation = (obj.reservation || obj.reservation_header || obj.res_header || obj.reservation_ref || {}) as Record<string, unknown>;

  const rawBranchId = obj.branch_id || obj.id_branch || branch.branch_id || branch.id || branch.id_branch || obj.branch_header_id;
  const rawDeptId = obj.emp_dept_id || obj.dept_id || obj.department_id || obj.id_dept || dept.id || dept.id_dept || obj.id_dept_header;
  const rawAreaId = obj.emp_area_id || obj.sale_area_id || obj.area_id || obj.id_area || obj.id_sale_area || 
                    (obj.sale_area as Record<string, unknown>)?.id || (obj.area as Record<string, unknown>)?.id;
  const rawJobId = obj.job_id || obj.project_id || obj.project_header_id || obj.job_header_id || obj.id_project || obj.id_job ||
                    (obj.project as Record<string, unknown>)?.id || (obj.job as Record<string, unknown>)?.id;
  const rawEmpId = obj.emp_sale_id || obj.sale_id || obj.employee_id || obj.sale_employee_id || obj.id_emp_sale ||
                    (obj.employee as Record<string, unknown>)?.id || (obj.sale_person as Record<string, unknown>)?.id;
  const rawTaxId = obj.tax_code_id || obj.tax_id || obj.id_tax || obj.tax_code_ref_id || tax.id || tax.id_tax || tax.tax_id ||
                    (obj.tax_code_header as Record<string, unknown>)?.id;
  const rawResId = obj.reservation_id || obj.reservation_header_id || obj.res_id || obj.id_reservation || reservation.reservation_id || reservation.id ||
                    obj.id_reservation_header;

  const rawLinesData = (
    obj.sale_order_lines || obj.saleOrderLines || obj.so_lines || obj.lines || obj.items || []
  ) as Record<string, unknown>[];

  const lines = rawLinesData.map((l) => ({
    so_line_id: String(l.so_line_id || l.id || l.line_id || ''),
    item_id: String(l.item_id || ''),
    item_code: String(l.item_code || ''),
    item_name: String(l.item_name || ''),
    uom_id: String(l.uom_id || ''),
    uom_name: String(l.uom_name || ''),
    qty_ordered: Number(l.qty_ordered || l.qty || l.quantity || 0),
    unit_price: Number(l.unit_price || l.price || 0),
    line_discount: Number(l.line_discount || l.discount_amount || 0),
    line_discount_input: String(l.line_discount_input || l.discount_expression || '0'),
    line_total: Number(l.line_total || l.net_amount || l.amount || 0),
    is_approved: true,
    approved_qty: Number(l.approved_qty || l.qty_ordered || l.qty || 0),
    approved_unit_price: Number(l.approved_unit_price || l.unit_price || 0),
    approved_line_discount: Number(l.approved_line_discount || l.line_discount || 0),
    approved_net_amount: Number(l.approved_net_amount || l.line_total || 0),
    warehouse_id: String(l.warehouse_id || ''),
    warehouse_name: String(l.warehouse_name || ''),
    location_id: String(l.location_id || ''),
    location_name: String(l.location_name || ''),
    lot_id: String(l.lot_id || ''),
    lot_no: String(l.lot_no || ''),
    note: String(l.note || l.remarks || ''),
    remarks: String(l.remarks || l.note || ''),
    price_source: l.price_source !== undefined && l.price_source !== null ? Number(l.price_source) : undefined,
    price_source_name: String(l.price_source_name || ''),
    price_level_priority: l.price_level_priority !== undefined && l.price_level_priority !== null ? Number(l.price_level_priority) : undefined,
  }));

  const subTotal = lines.reduce((sum, l) => sum + l.line_total, 0);

  return {
    so_id: String(obj.so_id || obj.sale_order_id || obj.uuid || obj.header_id || obj.id || ''),
    so_no: String(obj.so_no || ''),
    so_date: String(obj.so_date || '').split('T')[0],
    
    customer_id: String(obj.customer_id || customer.customer_id || customer.id || ''),
    customer_name: String(obj.customer_name || customer.customer_name_th || customer.customer_name || customer.name || customer.name_th || ''),
    customer_code: String(obj.customer_code || customer.customer_code || customer.code || ''),
    
    reservation_id: String(rawResId || ''),
    reservation_no: String(obj.reservation_no || reservation.reservation_no || reservation.code || reservation.no || ''),
    
    payment_term_days: Number(obj.payment_term_days || obj.credit_term || obj.credit_days || 0),
    ship_days: Number(obj.ship_days || 0),
    ship_date: String(obj.ship_date || obj.delivery_date || obj.est_ship_date || obj.delivery_date_so || '').split('T')[0],
    
    branch_id: String(rawBranchId || ''),
    branch_name: String(obj.branch_name || branch.branch_name || branch.name || branch.name_th || ''),
    
    emp_dept_id: String(rawDeptId || ''),
    emp_dept_name: String(obj.emp_dept_name || dept.dept_name || dept.name || dept.name_th || ''),
    
    emp_area_id: String(rawAreaId || ''),
    emp_area_name: String(obj.emp_area_name || obj.area_name || (obj.sale_area as Record<string, unknown>)?.area_name || ''),
    
    job_id: String(rawJobId || ''),
    job_name: String(obj.job_name || obj.project_name || (obj.project as Record<string, unknown>)?.project_name || ''),
    
    emp_sale_id: String(rawEmpId || ''),
    emp_sale_name: String(obj.emp_sale_name || reservation.emp_sale_name || reservation.emp_name || (obj.sale_person as Record<string, unknown>)?.name || ''),
    
    tax_code_id: String(rawTaxId || ''),
    tax_code: String(obj.tax_code || tax.tax_code || tax.code || tax.name || ''),
    tax_rate: (() => {
      const r = Number(obj.tax_rate || tax.tax_rate || 0);
      return (r > 0 && r < 1) ? r * 100 : r;
    })(),
    
    sub_total: subTotal,
    discount_expression: String(obj.discount_expression || obj.discount_input || '0'),
    discount_amount: Number(obj.discount_amount || 0),
    
    tax_amount: Number(obj.tax_amount || obj.base_tax_amount || obj.vat_amount || 0),
    vat_amount: Number(obj.vat_amount || obj.tax_amount || obj.base_tax_amount || 0),
    quote_tax_amount: Number(obj.quote_tax_amount || obj.vat_amount || obj.tax_amount || 0),
    base_tax_amount: Number(obj.base_tax_amount || obj.tax_amount || obj.vat_amount || 0),
    
    net_total: Number(obj.net_total || obj.total_amount || obj.base_total_amount || 0),
    total_amount: Number(obj.total_amount || obj.net_total || obj.base_total_amount || 0),
    quote_total_amount: Number(obj.quote_total_amount || obj.total_amount || obj.net_total || 0),
    base_total_amount: Number(obj.base_total_amount || obj.total_amount || obj.net_total || 0),

    base_currency_code: String(obj.base_currency_code || 'THB'),
    base_currency_id: Number(obj.base_currency_id || 1),
    quote_currency_code: String(obj.quote_currency_code || 'THB'),
    quote_currency_id: Number(obj.quote_currency_id || 1),
    currency_code: String(obj.currency_code || obj.base_currency_code || 'THB'),
    exchange_rate: Number(obj.exchange_rate || 1),
    exchange_rate_date: String(obj.exchange_rate_date || obj.so_date || '').split('T')[0],
    isMulticurrency: Boolean(obj.isMulticurrency || obj.is_multicurrency || (obj.base_currency_code && obj.base_currency_code !== 'THB')),
    
    remarks: String(obj.remarks || ''),
    status: (obj.status as SOForApproval['status']) || 'PENDING',
    lines,
  };
}

async function recoverAOPriceSources(
    lines: GenericLineItem[], 
    customerId: number, 
    branchId: number,
    setValues: (lines: GenericLineItem[]) => void
) {
    if (!lines || lines.length === 0 || !customerId || !branchId) return;

    const updatedLines = [...lines];
    let hasChanges = false;

    const promises = updatedLines.map(async (line, index) => {
        if (line.price_source_name && line.price_source_name !== '') return;

        try {
            const result = await import('@sales/quotation/services/pricing.service').then(m => m.PricingService.calculatePrice({
                itemId: String(line.item_id),
                qty: Number(line.qty_ordered || 0),
                customerId,
                branchId
            }));

            if (result) {
                const priceDiff = Math.abs(Number(result.unitPrice) - Number(line.unit_price || 0));
                if (priceDiff < 0.01) {
                    updatedLines[index] = {
                        ...line,
                        price_source: result.source,
                        price_source_name: result.sourceName,
                        price_level_priority: result.priority
                    };
                    hasChanges = true;
                } else {
                    updatedLines[index] = {
                        ...line,
                        price_source: 3,
                        price_source_name: 'MANUAL'
                    };
                    hasChanges = true;
                }
            }
        } catch { /* Silent fail */ }
    });

    await Promise.all(promises);
    if (hasChanges) {
        setValues(updatedLines);
    }
}

import type { UserProfile } from '@core/auth/auth.service';

export interface UseAOFormProps {
  soId?: string | number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  approvalItem?: SOForApproval | AOListItem;
}

export const useAOForm = ({ soId, isOpen, onClose, onSuccess, approvalItem }: UseAOFormProps) => {
  const initialValues: AOFormData = useMemo(() => ({
    ao_id: undefined,
    ao_no: '',
    ao_date: '',
    so_id: '',
    so_no: '',
    so_date: '',
    customer_id: '',
    customer_name: '',
    customer_code: '',
    reservation_id: '',
    reservation_no: '',
    status: 'PENDING',
    reject_reason: '',
    approval_emp_id: '',
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
    branch_id: '',
    branch_name: '',
    emp_sale_id: '',
    emp_sale_name: '',
    payment_term_days: 0,
    remarks: '',
    ship_days: 0,
    ship_date: '',
    emp_dept_id: '',
    emp_dept_name: '',
    emp_area_id: '',
    emp_area_name: '',
    job_id: '',
    job_name: '',
    onhold: 'N',
    lines: [],
  }), []);

  const buildApprovePayload = useCallback((data: AOFormData, activeId: string | number, user: UserProfile | null) => {
    return {
      so_id: Number(activeId || 0),
      customer_id: Number(data.customer_id || 0),
      status: 'APPROVED' as const,
      status_remark: data.remarks || '',
      remarks: data.remarks || '',
      onhold: data.onhold || 'N',
      sale_area_id: Number(data.emp_area_id || 0),
      emp_dept_id: Number(data.emp_dept_id || 0),
      project_id: Number(data.job_id || 0),
      approval_emp_id: Number(data.approval_emp_id || user?.employee_id || 1),
      approval_emp_name: data.approval_emp_name || user?.employee?.employee_fullname || '',
      branch_id: Number(data.branch_id || user?.employee?.branch_id || 1),
      emp_sale_id: data.emp_sale_id ? Number(data.emp_sale_id) : undefined,
      base_currency_code: data.base_currency_code || 'THB',
      quote_currency_code: data.quote_currency_code || 'THB',
      exchange_rate: Number(data.exchange_rate || 1),
      exchange_rate_date: data.exchange_rate_date || new Date().toISOString().split('T')[0],
      tax_code_id: data.tax_code_id ? Number(data.tax_code_id) : undefined,
      discount_expression: data.discount_expression || '0',
      CreateSaleOrderApprovalLineDtos: data.lines.filter(l => l.is_approved).map(l => ({
        so_line_id: Number(l.so_line_id || 0),
        item_id: Number(l.item_id || 0),
        qty: Number(l.qty_ordered || 0),
        uom_id: Number(l.uom_id || 0),
        approved_qty: Number(l.approved_qty || 0),
        remarks: l.remarks || '',
        unit_price: Number(l.unit_price || 0),
        discount_expression: l.discount_expression || '0',
      })),
    };
  }, []);

  const buildRejectPayload = useCallback((data: AOFormData, activeId: string | number, user: UserProfile | null, reason: string) => {
    return {
      so_id: Number(activeId || 0),
      customer_id: Number(data.customer_id || 0),
      status: 'REJECTED' as const,
      status_remark: reason,
      remarks: reason,
      onhold: data.onhold || 'N',
      sale_area_id: Number(data.emp_area_id || 0),
      emp_dept_id: Number(data.emp_dept_id || 0),
      project_id: Number(data.job_id || 0),
      approval_emp_id: Number(data.approval_emp_id || user?.employee_id || 0),
      approval_emp_name: data.approval_emp_name || user?.employee?.employee_fullname || '',
      branch_id: Number(data.branch_id || user?.employee?.branch_id || 0),
      emp_sale_id: data.emp_sale_id ? Number(data.emp_sale_id) : undefined,
      base_currency_code: data.base_currency_code || 'THB',
      quote_currency_code: data.quote_currency_code || 'THB',
      exchange_rate: Number(data.exchange_rate || 1),
      exchange_rate_date: data.exchange_rate_date || new Date().toISOString().split('T')[0],
      tax_code_id: data.tax_code_id ? Number(data.tax_code_id) : undefined,
      discount_expression: data.discount_expression || '0',
      CreateSaleOrderApprovalLineDtos: data.lines.map(l => ({
        so_line_id: Number(l.so_line_id || 0),
        item_id: Number(l.item_id || 0),
        qty: Number(l.qty_ordered || 0),
        uom_id: Number(l.uom_id || 0),
        approved_qty: 0,
        remarks: reason,
        unit_price: Number(l.unit_price || 0),
        discount_expression: l.discount_expression || '0',
      })),
    };
  }, []);

  const mapLinesFn = useCallback((
    rawLines: unknown[],
    discoveredApprovalLines: unknown[],
    fallbackApprovalLines: unknown[],
    isNew: boolean,
    _isHistory: boolean,
    status: string
  ) => {
    const linesSrc = rawLines as Record<string, unknown>[];
    return linesSrc.map((soLine) => {
      const aoLine = [...(discoveredApprovalLines as Record<string, unknown>[]), ...(fallbackApprovalLines as Record<string, unknown>[])].find(
        (al) => String(al.so_line_id || al.id) === String(soLine.so_line_id || soLine.id)
      );

      const originalQty = Number(soLine.qty_ordered || soLine.qty || soLine.quantity || 0);
      const discAmt = Number(soLine.discount_amount || soLine.line_discount || 0);
      const netAmt = Number(soLine.net_amount ?? soLine.line_total ?? soLine.amount ?? 0);

      const approvedQty = aoLine
        ? Number(aoLine.approved_qty || 0)
        : (isNew ? originalQty : (String(status).toUpperCase() === 'APPROVED' ? originalQty : 0));

      const approvedNet = (approvedQty === originalQty)
        ? netAmt
        : approvedQty > 0
          ? calculateLineTotal(approvedQty, Number(soLine.unit_price || soLine.price || 0), (originalQty > 0 ? (discAmt * approvedQty / originalQty) : 0))
          : 0;

      return {
        so_line_id: String(soLine.so_line_id || soLine.id || ''),
        item_id: String(soLine.item_id || ''),
        item_code: String(soLine.item_code || ''),
        item_name: String(soLine.item_name || ''),
        qty_ordered: originalQty,
        uom_id: String(soLine.uom_id || ''),
        uom_name: String(soLine.uom_name || ''),
        unit_price: Number(soLine.unit_price || soLine.price || 0),
        discount_expression: String(soLine.discount_expression || soLine.line_discount_input || '0'),
        discount_amount: discAmt,
        net_amount: netAmt,
        is_approved: aoLine ? Number(aoLine.approved_qty || 0) > 0 : (isNew || String(status).toUpperCase() === 'APPROVED'),
        approved_qty: approvedQty,
        approved_net_amount: Number(approvedNet.toFixed(2)),
        warehouse_id: String(soLine.warehouse_id || ''),
        warehouse_name: String(soLine.warehouse_name || ''),
        location_id: String(soLine.location_id || ''),
        location_name: String(soLine.location_name || ''),
        lot_id: String(soLine.lot_id || ''),
        lot_no: String(soLine.lot_no || ''),
        remarks: String(aoLine?.remarks || soLine.note || soLine.remarks || ''),
        price_source: soLine.price_source !== undefined && soLine.price_source !== null ? Number(soLine.price_source) : undefined,
        price_source_name: String(soLine.price_source_name || ''),
        price_level_priority: soLine.price_level_priority !== undefined && soLine.price_level_priority !== null ? Number(soLine.price_level_priority) : undefined,
      };
    });
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
  } = useApprovalForm<AOFormData, ApproveSalesOrderPayload>({
    documentId: soId,
    isOpen,
    onClose,
    onSuccess,
    documentType: 'SO',
    schema: AOFormSchema,
    initialValues,
    fetchDetail: AOService.getSOById,
    fetchApprovalById: AOService.getApprovalById,
    createApproval: AOService.createApproval,
    updateDocumentStatus: AOService.updateSOStatus,
    normalizeFn: normalizeSO,
    findLinesFn: findLines,
    mapLinesFn,
    recoverPriceSources: recoverAOPriceSources,
    buildApprovePayload,
    buildRejectPayload,
    lineFields: {
      lineId: 'so_line_id',
      isApproved: 'is_approved',
      approvedQty: 'approved_qty',
      approvedNetAmount: 'approved_net_amount',
      qty: 'qty_ordered',
      unitPrice: 'unit_price',
      discountAmount: 'discount_amount',
      netAmount: 'net_amount',
      remarks: 'remarks',
    },
    queryKeysToInvalidate: [['sales-orders'], ['so-approvals']],
    toastMessages: {
      approveSuccess: 'อนุมัติใบสั่งขายเรียบร้อยแล้ว',
      rejectSuccess: 'ไม่อนุมัติใบสั่งขายเรียบร้อยแล้ว',
      loadError: 'โหลดข้อมูลใบสั่งขายไม่สำเร็จ',
    },
    approvalItem,
  });

  return {
    formMethods,
    isSubmitting,
    isRejecting,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    isConfirmRejectOpen,
    setIsConfirmRejectOpen,
    handleApprove,
    handleConfirmApprove,
    handleReject: handleRejectInit,
    handleConfirmReject,
    lines,
    updateLine,
    activeId,
    loadSOData: loadDocumentData,
    status: formMethods.watch('status'),
    isMulticurrency: formMethods.watch('isMulticurrency'),
    currencies,
    errors,
  };
};
