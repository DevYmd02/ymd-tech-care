/**
 * @file useAQForm.ts
 * @description Form logic for Sales Quotation Approval (AQ)
 * @pattern Mirrors useAVForm.ts from Procurement domain
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { FieldErrors, Path, FieldPathValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@ui/feedback/Toast';
import { useAuth } from '@core/auth/contexts/AuthContext';
import { extractErrorMessage } from '@core/api/api';
import { logger } from '@utils';
import { calculateLineTotal } from '@sales/shared/utils/sales-calculations';

// Enrichment Services
import { MasterDataService } from '@master-data/services/master-data.service';
import { TaxCodeService } from '@master-data/tax/services/tax-code.service';
import { QuotationService } from '@sales/quotation/services/quotation.service';
import type { QuotationHeader } from '@sales/quotation/types/quotation.types';
import { ItemMasterService } from '@inventory/services/item-master.service';

import { AQFormSchema } from '../schemas/aq.schema';
import type { AQFormData, AQLineFormData } from '../schemas/aq.schema';
import { AQService } from '../services/aq.service';
import type { SQForApproval, SQLineForApproval, ApproveQuotationPayload, AQListItem } from '../types/quotation-approve.types';

// Master Data Types
import type { 
  BranchListItem, 
  DepartmentListItem, 
  EmployeeListItem, 
  UOMListItem,
  Project,
  SaleAreaListItem,
  Currency
} from '@/modules/master-data/types/master-data-types';
import type { CustomerMaster } from '@/modules/master-data/customer/customer-master/types/customer-types';
import type { TaxCode } from '@/modules/master-data/tax/types/tax-types';
import type { PriceLevelName } from '@/modules/master-data/sales/pages/price-level-name/types/price-level-name.types';

// Utils
import { normalizeSQ, findLines, mapAQFormDataLines, isPlaceholder, recoverApprovalPriceSources } from '../utils/aq-mapping';
import { 
  useUnitsContext, 
  useBranchesContext, 
  useDepartmentsContext, 
  useEmployeesContext 
} from '@core/contexts/MasterDataContext';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface UseAQFormProps {
  sqId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  approvalItem?: SQForApproval | AQListItem;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — map raw SQ API to SQForApproval
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export const useAQForm = ({ sqId, isOpen, onClose, onSuccess, approvalItem }: UseAQFormProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 💡 Optimization: Leverage centralized master data contexts
  const contextBranches = useBranchesContext();
  const contextDepts = useDepartmentsContext();
  const contextEmployees = useEmployeesContext();
  const contextUnits = useUnitsContext();

  const [activeId, setActiveId] = useState<number | undefined>(sqId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConfirmRejectOpen, setIsConfirmRejectOpen] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [priceLevelNames, setPriceLevelNames] = useState<PriceLevelName[]>([]);
  
  const prevIsOpenRef = useRef(false);
  const prevSqIdRef = useRef<number | undefined>(undefined);

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

  useEffect(() => { setActiveId(sqId); }, [sqId]);

  const showAlert = useCallback((msg: string) => toast(msg, 'error'), [toast]);

  // ── Form Setup ──────────────────────────────────────────────────────────────
  const formMethods = useForm<AQFormData>({
    resolver: zodResolver(AQFormSchema) as unknown as never,
    mode: 'onBlur',
    defaultValues: initialValues,
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
  const loadSQData = useCallback(async (id: number, aqItemArg?: SQForApproval | AQListItem) => {
    setIsSubmitting(true);
    try {
      logger.info(`[useAQForm] Fetching SQ detail for ID: ${id}...`);
      let raw = await AQService.getSQById(id);
      
      // 🕵️ FALLBACK 1: Global Search by SQ No (Crucial for History items where ID lookup fails)
      if ((!raw || Object.keys(raw as object).length < 5) && aqItemArg?.sq_no) {
        logger.info(`[useAQForm] Detail API failed for ID ${id}. Attempting Global Search by SQ No: ${aqItemArg.sq_no}`);
        // Search across all statuses
        const searchRes = await QuotationService.getList({ q: aqItemArg.sq_no, limit: 10 });
        const match = searchRes.data.find((d: QuotationHeader) => String(d.sq_no) === String(aqItemArg.sq_no));
        if (match) {
          logger.info('[useAQForm] Global Search success! Found original SQ.');
          const realId = match.sq_id || match.id;
          if (realId && String(realId) !== String(id)) {
             try { raw = await AQService.getSQById(Number(realId)); } catch { raw = match; }
          } else {
             raw = match;
          }
        }
      }

      // 🕵️ FALLBACK 2: Use the record passed from the modal as last resort
      if ((!raw || Object.keys(raw as object).length < 5) && aqItemArg) {
        logger.info('[useAQForm] Falling back to provided item data.');
        raw = (aqItemArg.raw || aqItemArg) as Record<string, unknown>;
      }
      
      logger.info('[useAQForm] Raw Data for Normalization:', raw);

      const sq = normalizeSQ(raw);
      if (!sq) {
        logger.warn('[useAQForm] Normalization failed. sq is null. Data received:', raw);
        showAlert('ไม่พบข้อมูลใบเสนอราคา');
        return;
      }

      setActiveId(id);
      prevSqIdRef.current = id;
      logger.info('[useAQForm] Normalized SQ Success:', sq.sq_no);

      // If opening an existing AQ, try to load AQ detail for pre-fill
      let aqDetails: Record<string, unknown> | null = null;
      if (aqItemArg?.aq_id) {
        try {
          const res = await AQService.getApprovalById(Number(aqItemArg.aq_id));
          aqDetails = res as Record<string, unknown>;
        } catch (e) {
          logger.warn('[useAQForm] Could not fetch AQ detail:', e);
        }
      }

      const isHistory = !!aqItemArg?.aq_id;
      const isNew = !isHistory;
      
      const discoveredAQLines = aqDetails ? findLines(aqDetails as Record<string, unknown>) : [];
      const discoveredSQLines = sq.lines || [];
      const fallbackAQLines = (isHistory && discoveredAQLines.length === 0 && aqItemArg) 
        ? findLines(aqItemArg as Record<string, unknown>) 
        : [];

      let sqLinesSource: SQLineForApproval[] = [];
      if (discoveredSQLines.length > 0) sqLinesSource = discoveredSQLines;
      else if (discoveredAQLines.length > 0) sqLinesSource = discoveredAQLines as SQLineForApproval[];
      else if (fallbackAQLines.length > 0) sqLinesSource = fallbackAQLines as SQLineForApproval[];
      else if (aqItemArg) {
        const anyFallback = findLines(aqItemArg as Record<string, unknown>);
        if (anyFallback.length > 0) sqLinesSource = anyFallback as SQLineForApproval[];
      }

      // 💡 Optimization: Use utility for line mapping
      const mappedLines = mapAQFormDataLines(
        sqLinesSource,
        discoveredAQLines as unknown[],
        fallbackAQLines as unknown[],
        isNew,
        isHistory,
        sq.status
      );

      // 🕵️ ENRICHMENT (Optimized)
      const needsLineEnrichment = mappedLines.some(l => isPlaceholder(l.item_name) || isPlaceholder(l.uom_name));
      const needsHeaderEnrichment = sq && (
        isPlaceholder(sq.customer_name) || isPlaceholder(sq.branch_name) || 
        isPlaceholder(sq.project_name) || isPlaceholder(sq.emp_dept_name) || 
        isPlaceholder(sq.sale_area_name) || isPlaceholder(sq.tax_code)
      );

      if (needsHeaderEnrichment || needsLineEnrichment) {
        try {
          // 💡 Reuse data from contexts where possible to avoid redundant API calls
          if (sq.branch_id && isPlaceholder(sq.branch_name)) {
            const m = (contextBranches as unknown as BranchListItem[]).find(b => Number(b.branch_id) === Number(sq.branch_id));
            if (m) sq.branch_name = m.branch_name || sq.branch_name;
          }
          if (sq.emp_dept_id && isPlaceholder(sq.emp_dept_name)) {
            const m = (contextDepts as unknown as (DepartmentListItem & { id?: number })[]).find(d => Number(d.emp_dept_id || d.id) === Number(sq.emp_dept_id));
            if (m) sq.emp_dept_name = m.emp_dept_name || m.dept_name || m.department_name || sq.emp_dept_name;
          }
          if (sq.emp_sale_id && isPlaceholder(sq.emp_sale_name)) {
            const m = (contextEmployees as unknown as EmployeeListItem[]).find(e => Number(e.employee_id) === Number(sq.emp_sale_id));
            if (m) sq.emp_sale_name = m.employee_fullname || m.employee_name || '';
          }

          // Fetch only missing datasets that are NOT in global context
          const enrichmentPromises: [Promise<CustomerMaster[]>, Promise<Project[]>, Promise<SaleAreaListItem[]>, Promise<TaxCode[]>] = [
            isPlaceholder(sq.customer_name) ? MasterDataService.getCustomers() : Promise.resolve([]),
            isPlaceholder(sq.project_name) ? MasterDataService.getProjects() : Promise.resolve([]),
            isPlaceholder(sq.sale_area_name) ? MasterDataService.getSaleAreas() : Promise.resolve([]),
            TaxCodeService.getTaxCodes()
          ];

          const [customers, projects, areas, taxCodes] = await Promise.all(enrichmentPromises);

          if (sq.customer_id && isPlaceholder(sq.customer_name)) {
            const m = customers.find((c) => Number(c.customer_id || (c as unknown as {id: number}).id) === Number(sq.customer_id));
            if (m) sq.customer_name = m.customer_name_th || m.name_th || m.customer_name || '';
          }
          if (sq.project_id && isPlaceholder(sq.project_name)) {
            const m = projects.find((p) => Number(p.project_id || (p as unknown as {id: number}).id) === Number(sq.project_id));
            if (m) sq.project_name = m.project_name || sq.project_name;
          }
          if (sq.sale_area_id && isPlaceholder(sq.sale_area_name)) {
            sq.sale_area_name = areas.find((a) => String(a.sale_area_id) === String(sq.sale_area_id))?.sale_area_name || sq.sale_area_name;
          }
          if (sq.tax_code_id && isPlaceholder(sq.tax_code)) {
            const taxMatch = taxCodes.find((t) => Number(t.tax_code_id || (t as unknown as {tax_id: number}).tax_id) === Number(sq.tax_code_id));
            if (taxMatch) sq.tax_code = taxMatch.tax_code || taxMatch.tax_name || '';
          }

          if (needsLineEnrichment) {
            const missingItemIds = mappedLines.filter(l => isPlaceholder(l.item_name)).map(l => l.item_id);
            const itemMap = new Map();
            if (missingItemIds.length > 0) {
              const items = await Promise.all(missingItemIds.map(id => ItemMasterService.getById(Number(id))));
              items.forEach(item => { if (item) itemMap.set(String(item.item_id), item); });
            }

            mappedLines.forEach(l => {
              if (isPlaceholder(l.item_name)) {
                const match = itemMap.get(String(l.item_id));
                if (match) { l.item_name = match.item_name || match.description || ''; l.item_code = match.item_code || l.item_code; }
              }
              if (isPlaceholder(l.uom_name)) {
                const match = (contextUnits as unknown as (UOMListItem & { id?: number })[]).find(u => Number(u.uom_id || u.id) === Number(l.uom_id));
                if (match) l.uom_name = match.uom_name || (match as unknown as { uom_name?: string }).uom_name || '';
              }
            });
          }
        } catch (e) { logger.error('[useAQForm] Enrichment failed:', e); }
      }

      // Clean up Price Source names
      mappedLines.forEach(line => {
        if (isPlaceholder(line.price_source_name)) {
          const s = Number(line.price_source);
          if (s === 1) line.price_source_name = 'PRICE_LIST';
          else if (s === 2) line.price_source_name = 'PRICE_LEVEL';
          else if (s === 3) line.price_source_name = 'MANUAL';
        }
      });

      if (currencies.length === 0) {
        try { const fc = await MasterDataService.getCurrencies(); setCurrencies(fc); } catch (e) { logger.error('[useAQForm] Failed to fetch currencies:', e); }
      }
      
      if (priceLevelNames.length === 0) {
        try { 
          const levels = await MasterDataService.getPriceLevelNames(); 
          setPriceLevelNames(levels); 
        } catch (e) { 
          logger.error('[useAQForm] Failed to fetch price level names:', e); 
        }
      }

      // Reset form with SQ data + AQ details + AQ List Fallbacks
      reset({
        aq_id: aqDetails ? Number((aqDetails as Record<string, unknown>).aq_id) : (aqItemArg?.aq_id ? Number(aqItemArg.aq_id) : undefined),
        aq_no: String((aqDetails as Record<string, unknown>)?.aq_no || aqItemArg?.aq_no || ''),
        aq_date: String((aqDetails as Record<string, unknown>)?.aq_date || '').split('T')[0] || String(aqItemArg?.aq_date || ''),
        sq_id: sq.sq_id,
        sq_no: sq.sq_no || String(aqItemArg?.sq_no || ''),
        sq_date: sq.sq_date || String(aqItemArg?.sq_date || ''),
        customer_id: sq.customer_id || 0,
        customer_name: sq.customer_name || String(aqItemArg?.customer_name || ''),
        customer_code: sq.customer_code || String(aqItemArg?.customer_code || ''),
        status: String((aqDetails as Record<string, unknown>)?.status || aqItemArg?.status || sq.status) as AQFormData['status'],
        reject_reason: String((aqDetails as Record<string, unknown>)?.status === 'REJECTED' ? ((aqDetails as Record<string, unknown>).remarks || '') : ''),
        approval_emp_id: Number((aqDetails as Record<string, unknown>)?.approval_emp_id || user?.employee_id || 1),
        approval_emp_name: String((aqDetails as Record<string, unknown>)?.approval_emp_name || aqItemArg?.approval_emp_name || user?.employee?.employee_fullname || ''),

        base_currency_code: sq.base_currency_code || 'THB',
        base_currency_id: sq.base_currency_id || 1,
        quote_currency_code: sq.quote_currency_code || 'THB',
        quote_currency_id: sq.quote_currency_id || 1,
        exchange_rate: Number(sq.exchange_rate || 1),
        exchange_rate_date: sq.exchange_rate_date || sq.sq_date || new Date().toISOString(),
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
        branch_id: sq.branch_id || 0,
        branch_name: sq.branch_name || String(aqItemArg?.branch_name || ''),
        lead_id: sq.lead_id || '',
        project_id: sq.project_id || 0,
        project_name: sq.project_name || String(aqItemArg?.project_name || ''),
        sale_area_id: sq.sale_area_id || 0,
        sale_area_name: sq.sale_area_name || String(aqItemArg?.sale_area_name || ''),
        emp_sale_id: sq.emp_sale_id || 0,
        emp_sale_name: sq.emp_sale_name || String(aqItemArg?.emp_sale_name || ''),
        emp_dept_id: sq.emp_dept_id || 0,
        emp_dept_name: sq.emp_dept_name || String(aqItemArg?.emp_dept_name || ''),
        tax_code: sq.tax_code || String(aqItemArg?.tax_code || ''),
        isMulticurrency: Boolean(sq.isMulticurrency),
        onhold: sq.onhold || 'N',
        lines: mappedLines,
      } as AQFormData);

      // 🕵️ Trigger Smart Recovery for missing sources in Approval view
      if (sq.customer_id && sq.branch_id) {
          void recoverApprovalPriceSources(
              mappedLines, 
              Number(sq.customer_id), 
              Number(sq.branch_id),
              (newLines) => setValue('lines', newLines)
          );
      }

    } catch (err) {
      logger.error('[useAQForm] loadSQData failed:', err);
      showAlert('โหลดข้อมูลใบเสนอราคาไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  }, [reset, user, showAlert, currencies.length, priceLevelNames.length, setValue, contextBranches, contextDepts, contextEmployees, contextUnits]);


  // ── Reactive Auto-load ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      if (sqId) {
        // Mode 1: Opened with active ID (e.g. from List row)
        const hasIdChanged = sqId !== prevSqIdRef.current;
        const isNewlyOpened = !prevIsOpenRef.current;

        if (isNewlyOpened || hasIdChanged) {
          logger.info(`[useAQForm] Triggering load for SQ ID: ${sqId}`);
          prevIsOpenRef.current = true;
          prevSqIdRef.current = sqId;
          loadSQData(sqId, approvalItem);
        }
      } else {
        // Mode 2: Opened without ID (Fresh lookup)
        if (!prevIsOpenRef.current) {
          logger.info('[useAQForm] Empty open. Resetting form.');
          prevIsOpenRef.current = true;
          prevSqIdRef.current = undefined;
          reset(initialValues);
        }
      }
    } else {
      // Mode 3: Closed
      if (prevIsOpenRef.current) {
        logger.info('[useAQForm] Modal closed. Cleaning up.');
        reset(initialValues);
      }
      prevIsOpenRef.current = false;
      prevSqIdRef.current = undefined;
    }
  }, [isOpen, sqId, loadSQData, approvalItem, reset, initialValues]);

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
        const netApproved = (approvedQty === origQty)
          ? line.net_amount
          : origQty > 0
            ? calculateLineTotal(approvedQty, line.unit_price, (discAmt * approvedQty / origQty))
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
    const approval_emp_id = user?.employee_id || user?.id; // Try to get a valid ID
    
    if (!approval_emp_id) {
      toast('ไม่พบรหัสพนักงานของคุณในระบบ ไม่สามารถอนุมัติได้', 'error');
      return;
    }

    const payload: ApproveQuotationPayload = {
      sq_id: Number(activeId),
      aq_date: new Date().toISOString().split('T')[0],
      status: 'APPROVED',
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
        item_id: l.item_id,
        qty: l.qty,
        uom_id: l.uom_id,
        approved_qty: Number(l.approved_qty || 0),
        unit_price: l.unit_price,
        discount_expression: l.discount_expression,
        remarks: l.remarks || '',
      })),
    };

    logger.info('[useAQForm] Confirming Approval with payload:', payload);

    setIsSubmitting(true);
    try {
      await AQService.createApproval(payload);

      // Sync SQ status → APPROVED
      // try {
      //   await AQService.updateSQStatus(activeId, 'APPROVED');
      // } catch (err) {
      //   logger.warn('[useAQForm] SQ status sync failed (non-critical):', err);
      // }

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

    const approval_emp_id = user?.employee_id || user?.id;
    if (!approval_emp_id) {
      toast('ไม่พบรหัสพนักงานของคุณในระบบ ไม่สามารถดำเนินการได้', 'error');
      return;
    }

    const payload: ApproveQuotationPayload = {
      sq_id: Number(activeId),
      aq_date: new Date().toISOString().split('T')[0],
      status: 'REJECTED',
      remarks: reason,
      approval_emp_id: Number(approval_emp_id),
      approval_emp_name: user?.employee?.employee_fullname || user?.username || 'System',
      base_currency_code: data.base_currency_code || 'THB',
      quote_currency_code: data.quote_currency_code || 'THB',
      exchange_rate: Number(data.exchange_rate || 1),
      exchange_rate_date: data.exchange_rate_date || new Date().toISOString().split('T')[0],
      aq_lines: data.lines.map(l => ({
        sq_line_id: Number(l.sq_line_id),
        item_id: l.item_id,
        qty: l.qty,
        uom_id: l.uom_id,
        approved_qty: 0,
        unit_price: l.unit_price,
        remarks: reason,
      })),
    };

    logger.info('[useAQForm] Confirming Reject with payload:', payload);

    setIsRejecting(true);
    try {
      await AQService.createApproval(payload);

      // try {
      //   await AQService.updateSQStatus(activeId, 'REJECTED');
      // } catch (err) {
      //   logger.error('[useAQForm] SQ status sync failed:', err);
      //   toast('บันทึกการไม่อนุมัติแล้ว แต่อัปเดตสถานะ SQ ไม่สำเร็จ กรุณารีเฟรชหน้า', 'warning');
      // }

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
    currencies,
    priceLevelNames,
  };
};
