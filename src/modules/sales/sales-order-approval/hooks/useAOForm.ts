/**
 * @file useAOForm.ts
 * @description Form logic for Sales Order Approval (AO)
 * @pattern Mirrors useAQForm.ts from Sales Quotation Approval domain
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { FieldErrors, Path, FieldPathValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@ui/feedback/Toast';
import { useAuth } from '@core/auth/contexts/AuthContext';
import { logger } from '@utils/logger';
import { calculateLineTotal } from '@sales/shared/utils/sales-calculations';

// Enrichment Services
import { MasterDataService } from '@master-data/services/master-data.service';

import { AOFormSchema } from '../schemas/ao.schema';
import type { AOFormData, AOLineFormData } from '../schemas/ao.schema';
import { AOService } from '../services/ao.service';
import type { SOForApproval, SOLineForApproval, ApproveSalesOrderPayload, AOListItem } from '../types/sales-order-approval.types';
import type { Currency } from '@master-data/currency/types/currency-types';

export interface UseAOFormProps {
  soId?: string | number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  approvalItem?: SOForApproval | AOListItem;
}

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


const findLines = (source: Record<string, unknown>): unknown[] => {
  const priority = ['saleOrderLines', 'sale_order_lines', 'so_lines', 'lines', 'items', 'sale_order_detail', 'sale_order_line', 'so_line'];
  for (const p of priority) {
    if (Array.isArray(source[p]) && (source[p] as unknown[]).length > 0) return source[p] as unknown[];
  }
  const lineKey = Object.keys(source).find(k => (k.toLowerCase().includes('line') || k.toLowerCase().includes('item')) && Array.isArray(source[k]) && (source[k] as unknown[]).length > 0);
  if (lineKey) return source[lineKey] as unknown[];
  const firstArray = Object.keys(source).find(k => Array.isArray(source[k]) && (source[k] as unknown[]).length > 0);
  return firstArray ? (source[firstArray] as unknown[]) : [];
};

function normalizeSO(raw: unknown): SOForApproval | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const obj = findObject(r);

  const soId = obj.so_id || obj.id || obj.sale_order_id || obj.id_sale_order || 0;
  if (!soId) return null;

  const rawLines = findLines(obj);
  const lines: SOLineForApproval[] = rawLines.map((l: unknown) => {
    const line = l as Record<string, unknown>;
    const item = (line.item as Record<string, unknown>) || (line.item_master as Record<string, unknown>) || {};
    const uom = (line.uom as Record<string, unknown>) || (line.unit as Record<string, unknown>) || {};
    
    return {
      so_line_id: (line.so_line_id as string | number) || (line.id as string | number) || 0,
      item_id: (line.item_id as string | number) || (item.item_id as string | number) || (item.id as string | number) || 0,
      item_code: String(line.item_code || item.item_code || line.code || ''),
      item_name: String(line.item_name || item.item_name || item.item_name_th || line.description || line.name || ''),
      qty_ordered: Number(line.qty_ordered || line.qty || line.quantity || 0),
      uom_id: (line.uom_id as string | number) || (uom.uom_id as string | number) || (uom.id as string | number) || 0,
      uom_name: String(line.uom_name || uom.uom_name || uom.unit_name || uom.name || ''),
      unit_price: Number(line.unit_price || line.price || 0),
      discount_expression: String(line.discount_expression || line.line_discount_input || '0'),
      discount_amount: Number(line.line_discount || line.discount_amount || 0),
      net_amount: Number(line.line_total || line.net_amount || 0),
      remarks: String(line.remarks || line.note || ''),
      tax_code_id: (line.tax_code_id as string | number) || null,
    };
  });

  const getNested = (source: Record<string, unknown>, keys: string[]): Record<string, unknown> => {
    for (const k of keys) { 
      const val = source[k];
      if (val && typeof val === 'object' && !Array.isArray(val)) return val as Record<string, unknown>; 
    }
    return {};
  };

  const customer = getNested(obj, ['customer', 'customer_ref', 'customer_master', 'cust']);
  const branch = getNested(obj, ['branch', 'branch_ref', 'id_branch']);
  const tax = getNested(obj, ['taxCode', 'tax_code_ref', 'tax', 'tax_id']);

  const finalBCurrencyCode = String(obj.base_currency_code || obj.currency_code || obj.currency || 'THB');
  const finalQCurrencyCode = String(obj.quote_currency_code || obj.id_currency_code || obj.currency_code || obj.currency || 'THB');
  const finalRate = Number(obj.exchange_rate || obj.rate || 1);

  return {
    so_id: soId as string | number,
    so_no: String(obj.so_no || obj.sale_order_no || obj.code || obj.no || ''),
    so_date: String(obj.so_date || obj.sale_order_date || obj.date || '').split('T')[0],
    
    customer_id: (obj.customer_id as string | number) || (customer.customer_id as string | number) || (customer.id as string | number) || (obj.id_customer as string | number) || 0,
    customer_name: String(obj.customer_name || obj.customer_name_th || obj.name_th || customer.customer_name_th || customer.name_th || customer.name || ''),
    customer_code: String(obj.customer_code || customer.customer_code || customer.code || ''),
    
    status: String(obj.status || 'PENDING'),

    base_currency_code: finalBCurrencyCode,
    base_currency_id: Number(obj.base_currency_id || 1),
    quote_currency_code: finalQCurrencyCode,
    quote_currency_id: Number(obj.quote_currency_id || 1),
    exchange_rate: finalRate,
    isMulticurrency: Boolean((obj.is_multicurrency === true) || (finalBCurrencyCode !== 'THB') || (finalQCurrencyCode !== 'THB')),
    exchange_rate_date: String(obj.exchange_rate_date || obj.so_date || obj.date || '').split('T')[0],
    
    total_amount: Number(obj.total_amount || obj.quote_total_amount || 0),
    base_total_amount: Number(obj.base_total_amount || 0),
    quote_total_amount: Number(obj.quote_total_amount || 0),
    vat_amount: Number(obj.vat_amount || 0),
    base_tax_amount: Number(obj.base_tax_amount || 0),
    quote_tax_amount: Number(obj.quote_tax_amount || 0),
    
    tax_code_id: (obj.tax_code_id || obj.tax_id || obj.id_tax || tax.id) ? (obj.tax_code_id || obj.tax_id || obj.id_tax || tax.id) as string | number : undefined,
    tax_rate: Number(obj.tax_rate ?? obj.tax_pct ?? tax.tax_rate ?? tax.tax_pct ?? 0),
    
    remarks: String(obj.remarks || ''),
    payment_term_days: Number(obj.payment_term_days || 0),

    branch_id: (obj.branch_id as string | number) || (branch.id as string | number) || (obj.id_branch as string | number) || 0,
    emp_sale_id: (obj.emp_sale_id as string | number) || (obj.id_emp_sale as string | number) || (obj.sale_emp_id as string | number) || 0,
    emp_sale_name: String(obj.emp_sale_name || obj.sale_person_name || ''),

    discount_expression: String(obj.discount_expression || obj.discount_input || '0'),
    discount_amount: Number(obj.discount_amount || obj.quote_discount_amount || 0),

    reservation_no: String(obj.reservation_no || ''),
    ship_days: Number(obj.ship_days || 0),
    ship_date: String(obj.ship_date || '').split('T')[0],
    emp_dept_id: (obj.emp_dept_id as string | number) || 0,
    emp_dept_name: String(obj.emp_dept_name || ''),
    emp_area_id: (obj.emp_area_id as string | number) || 0,
    job_id: (obj.job_id as string | number) || 0,
    onhold: (obj.onhold === 'Y' || obj.onhold === true) ? 'Y' : 'N',

    lines,
    sub_total: Number(obj.sub_total || lines.reduce((s, l) => s + (l.net_amount || 0), 0) || 0),
  };
}

export const useAOForm = ({ soId, isOpen, onClose, onSuccess, approvalItem }: UseAOFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeId, setActiveId] = useState<string | number | undefined>(soId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConfirmRejectOpen, setIsConfirmRejectOpen] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  
  const prevIsOpenRef = useRef(false);
  const prevSoIdRef = useRef<string | number | undefined>(undefined);

  const initialValues: AOFormData = useMemo(() => ({
    ao_id: undefined,
    ao_no: '',
    ao_date: '',
    so_id: '',
    so_no: '',
    so_date: '',
    customer_name: '',
    customer_code: '',
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
    reservation_no: '',
    ship_days: 0,
    ship_date: '',
    emp_dept_id: '',
    emp_dept_name: '',
    emp_area_id: '',
    job_id: '',
    onhold: 'N',
    lines: [],
  }), []);

  useEffect(() => { setActiveId(soId); }, [soId]);

  const showAlert = useCallback((msg: string) => toast(msg, 'error'), [toast]);

  const formMethods = useForm<AOFormData>({
    resolver: zodResolver(AOFormSchema) as unknown as never,
    mode: 'onBlur',
    defaultValues: initialValues,
  });

  const { handleSubmit, setValue, reset, control } = formMethods;

  const { fields: lines } = useFieldArray({ control, name: 'lines' });

  const handleFormError = useCallback((fieldErrors: FieldErrors<AOFormData>) => {
    logger.error('[useAOForm] Validation Errors:', fieldErrors);
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

  const loadSOData = useCallback(async (id: string | number, aoItemArg?: SOForApproval | AOListItem) => {
    setIsSubmitting(true);
    try {
      let raw = await AOService.getSOById(id);
      
      if ((!raw || Object.keys(raw as object).length < 5) && aoItemArg?.so_no) {
        // Fallback global search
      }

      if ((!raw || Object.keys(raw as object).length < 5) && aoItemArg) {
        raw = (aoItemArg.raw || aoItemArg) as Record<string, unknown>;
      }
      
      const so = normalizeSO(raw);
      if (!so) {
        showAlert('ไม่พบข้อมูลใบสั่งขาย');
        return;
      }

      setActiveId(id);
      prevSoIdRef.current = id;

      let aoDetails: Record<string, unknown> | null = null;
      if (aoItemArg?.ao_id) {
        try {
          const res = await AOService.getApprovalById(Number(aoItemArg.ao_id));
          aoDetails = res as Record<string, unknown>;
        } catch (e) {
          logger.error('[useAOForm] Error fetching AO details:', e);
        }
      }

      const isHistory = !!aoItemArg?.ao_id;
      const isNew = !isHistory;
      
      const discoveredAOLines = aoDetails ? findLines(aoDetails as Record<string, unknown>) : [];
      const discoveredSOLines = so.lines || [];
      const fallbackAOLines = (isHistory && discoveredAOLines.length === 0 && aoItemArg) ? findLines(aoItemArg as Record<string, unknown>) : [];

      let soLinesSource: SOLineForApproval[] = [];
      if (discoveredSOLines.length > 0) soLinesSource = discoveredSOLines;
      else if (discoveredAOLines.length > 0) soLinesSource = discoveredAOLines as SOLineForApproval[];
      else if (fallbackAOLines.length > 0) soLinesSource = fallbackAOLines as SOLineForApproval[];

      const mappedLines = soLinesSource.map((soLine) => {
        const aoLine = [...(discoveredAOLines as Record<string, unknown>[]), ...(fallbackAOLines as Record<string, unknown>[])].find(
          (al) => String(al.so_line_id || al.id) === String(soLine.so_line_id)
        );

        const originalQty = Number(soLine.qty_ordered || 0);
        const discAmt = Number(soLine.discount_amount || 0);
        const netAmt = Number(soLine.net_amount ?? soLine.line_total ?? 0);

        const approvedQty = aoLine
          ? Number(aoLine.approved_qty || 0)
          : (isNew ? originalQty : (String(so.status).toUpperCase() === 'APPROVED' ? originalQty : 0));

        const approvedNet = (approvedQty === originalQty)
          ? netAmt
          : approvedQty > 0
            ? calculateLineTotal(approvedQty, Number(soLine.unit_price || 0), (originalQty > 0 ? (discAmt * approvedQty / originalQty) : 0))
            : 0;

        return {
          so_line_id: soLine.so_line_id,
          item_id: soLine.item_id,
          item_code: soLine.item_code || '',
          item_name: soLine.item_name || '',
          qty_ordered: originalQty,
          uom_id: soLine.uom_id,
          uom_name: soLine.uom_name || '',
          unit_price: Number(soLine.unit_price),
          discount_expression: String(soLine.discount_expression || '0'),
          discount_amount: discAmt,
          net_amount: netAmt,
          is_approved: aoLine ? Number(aoLine.approved_qty || 0) > 0 : (isHistory ? true : isNew),
          approved_qty: approvedQty,
          approved_net_amount: Number(approvedNet.toFixed(2)),
          remarks: String(aoLine?.remarks || soLine.note || soLine.remarks || ''),
        };
      });

      // simplified enrichment
      if (currencies.length === 0) {
        try {
          const fc = await MasterDataService.getCurrencies();
          setCurrencies(fc as Currency[]);
        } catch (e) {
          logger.error('[useAOForm] Error fetching currencies:', e);
        }
      }
      
      reset({
        ao_id: aoDetails ? Number((aoDetails as Record<string, unknown>).ao_id) : (aoItemArg?.ao_id ? Number(aoItemArg.ao_id) : undefined),
        ao_no: String((aoDetails as Record<string, unknown>)?.ao_no || aoItemArg?.ao_no || ''),
        ao_date: String((aoDetails as Record<string, unknown>)?.ao_date || '').split('T')[0] || String(aoItemArg?.ao_date || ''),
        so_id: so.so_id,
        so_no: so.so_no || String(aoItemArg?.so_no || ''),
        so_date: so.so_date || String(aoItemArg?.so_date || ''),
        customer_name: so.customer_name || String(aoItemArg?.customer_name || ''),
        customer_code: so.customer_code || String(aoItemArg?.customer_code || ''),
        status: String((aoDetails as Record<string, unknown>)?.status || aoItemArg?.status || so.status) as AOFormData['status'],
        reject_reason: String((aoDetails as Record<string, unknown>)?.status === 'REJECTED' ? ((aoDetails as Record<string, unknown>).remarks || '') : ''),
        approval_emp_id: (aoDetails as Record<string, unknown>)?.approval_emp_id as string | number || user?.employee_id || 1,
        approval_emp_name: String((aoDetails as Record<string, unknown>)?.approval_emp_name || aoItemArg?.approval_emp_name || user?.employee?.employee_fullname || ''),

        base_currency_code: so.base_currency_code || 'THB',
        base_currency_id: so.base_currency_id || 1,
        quote_currency_code: so.quote_currency_code || 'THB',
        quote_currency_id: so.quote_currency_id || 1,
        exchange_rate: Number(so.exchange_rate || 1),
        exchange_rate_date: so.exchange_rate_date || so.so_date || new Date().toISOString(),
        sub_total: so.sub_total || 0,
        base_total_amount: so.base_total_amount || 0,
        quote_total_amount: so.quote_total_amount || so.total_amount || 0,
        tax_code_id: so.tax_code_id ?? null,
        tax_rate: so.tax_rate || 0,
        base_tax_amount: so.base_tax_amount || 0,
        quote_tax_amount: so.quote_tax_amount || so.vat_amount || 0,
        discount_expression: so.discount_expression || '0',
        discount_rate: 0,
        base_discount_amount: so.base_discount_amount || 0,
        quote_discount_amount: so.quote_discount_amount || so.discount_amount || 0,
        payment_term_days: so.payment_term_days || 0,
        remarks: so.remarks || '',
        branch_id: so.branch_id || '',
        branch_name: so.branch_name || String(aoItemArg?.branch_name || ''),
        emp_sale_id: so.emp_sale_id || '',
        emp_sale_name: so.emp_sale_name || String(aoItemArg?.emp_sale_name || ''),
        reservation_no: so.reservation_no || '',
        ship_days: so.ship_days || 0,
        ship_date: so.ship_date || '',
        emp_dept_id: so.emp_dept_id || '',
        emp_dept_name: so.emp_dept_name || '',
        emp_area_id: so.emp_area_id || '',
        job_id: so.job_id || '',
        onhold: so.onhold || 'N',
        isMulticurrency: Boolean(so.isMulticurrency),
        lines: mappedLines,
      } as AOFormData);
    } catch (err) {
      logger.error('[useAOForm] Error loading SO data:', err);
      showAlert('โหลดข้อมูลใบสั่งขายไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  }, [reset, user, showAlert, currencies.length]);

  useEffect(() => {
    if (isOpen) {
      if (soId) {
        const hasIdChanged = soId !== prevSoIdRef.current;
        const isNewlyOpened = !prevIsOpenRef.current;
        if (isNewlyOpened || hasIdChanged) {
          prevIsOpenRef.current = true;
          prevSoIdRef.current = soId;
          loadSOData(soId, approvalItem);
        }
      } else {
        if (!prevIsOpenRef.current) {
          prevIsOpenRef.current = true;
          prevSoIdRef.current = undefined;
          reset(initialValues);
        }
      }
    } else {
      if (prevIsOpenRef.current) reset(initialValues);
      prevIsOpenRef.current = false;
      prevSoIdRef.current = undefined;
    }
  }, [isOpen, soId, loadSOData, approvalItem, reset, initialValues]);

  const updateLine = useCallback((index: number, field: keyof AOLineFormData, value: unknown) => {
    const path = `lines.${index}.${field}` as Path<AOFormData>;
    setValue(path, value as FieldPathValue<AOFormData, typeof path>);

    if (field === 'is_approved' && value === false) {
      setValue(`lines.${index}.approved_qty` as Path<AOFormData>, 0 as never);
      setValue(`lines.${index}.approved_net_amount` as Path<AOFormData>, 0 as never);
    }

    if (field === 'approved_qty') {
      const currentLines = formMethods.getValues('lines');
      const line = currentLines[index];
      if (line) {
        const approvedQty = Number(value || 0);
        const origQty = line.qty_ordered || 0;
        const discAmt = line.discount_amount || 0;
        const netApproved = (approvedQty === origQty)
          ? line.net_amount
          : origQty > 0
            ? calculateLineTotal(approvedQty, line.unit_price, (discAmt * approvedQty / origQty))
            : 0;
        setValue(`lines.${index}.approved_net_amount` as Path<AOFormData>, Number(netApproved.toFixed(2)) as never);
      }
    }
  }, [setValue, formMethods]);

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

    const payload: ApproveSalesOrderPayload = {
      so_id: activeId,
      ao_date: new Date().toISOString().split('T')[0],
      status: 'APPROVED',
      remarks: data.remarks || '',
      approval_emp_id: data.approval_emp_id || user?.employee_id || 1,
      approval_emp_name: data.approval_emp_name || user?.employee?.employee_fullname || '',
      base_currency_code: data.base_currency_code,
      quote_currency_code: data.quote_currency_code,
      exchange_rate: data.exchange_rate,
      exchange_rate_date: data.exchange_rate_date,
      tax_code_id: data.tax_code_id || undefined,
      discount_expression: data.discount_expression,
      branch_id: data.branch_id || undefined,
      emp_sale_id: data.emp_sale_id || undefined,
      ao_lines: data.lines.map(l => ({
        so_line_id: l.so_line_id,
        item_id: l.item_id,
        qty_ordered: l.qty_ordered,
        uom_id: l.uom_id,
        approved_qty: l.is_approved ? l.approved_qty : 0,
        remarks: l.remarks,
        unit_price: l.unit_price,
        discount_expression: l.discount_expression,
      })),
    };

    try {
      setIsSubmitting(true);
      await AOService.createApproval(payload);
      toast('อนุมัติใบสั่งขายเรียบร้อยแล้ว', 'success');
      onSuccess?.();
      onClose();
    } catch (e) {
      logger.error('[useAOForm] Error approving SO:', e);
      toast('เกิดข้อผิดพลาดในการอนุมัติ', 'error');
    } finally {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
    }
  };

  const handleReject = () => setIsConfirmRejectOpen(true);

  const handleConfirmReject = async (reason: string) => {
    if (!activeId) return;
    const data = formMethods.getValues();
    
    const payload: ApproveSalesOrderPayload = {
      so_id: activeId,
      ao_date: new Date().toISOString().split('T')[0],
      status: 'REJECTED',
      remarks: reason,
      approval_emp_id: data.approval_emp_id || user?.employee_id || 1,
      approval_emp_name: data.approval_emp_name || user?.employee?.employee_fullname || '',
      ao_lines: data.lines.map(l => ({
        so_line_id: l.so_line_id,
        item_id: l.item_id,
        qty_ordered: l.qty_ordered,
        uom_id: l.uom_id,
        approved_qty: 0,
        remarks: reason,
        unit_price: l.unit_price,
        discount_expression: l.discount_expression,
      })),
    };

    try {
      setIsRejecting(true);
      await AOService.createApproval(payload);
      toast('ไม่อนุมัติใบสั่งขายเรียบร้อยแล้ว', 'success');
      onSuccess?.();
      onClose();
    } catch (e) {
      logger.error('[useAOForm] Error rejecting SO:', e);
      toast('เกิดข้อผิดพลาดในการไม่อนุมัติ', 'error');
    } finally {
      setIsRejecting(false);
      setIsConfirmRejectOpen(false);
    }
  };

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
    handleReject,
    handleConfirmReject,
    lines,
    updateLine,
    activeId,
    loadSOData,
    status: formMethods.watch('status'),
    isMulticurrency: formMethods.watch('isMulticurrency'),
  };
};
