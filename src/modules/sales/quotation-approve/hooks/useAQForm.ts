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
import { useToast } from '@/shared/components/ui/feedback/Toast';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { extractErrorMessage } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';

// Enrichment Services
import { MasterDataService } from '@/modules/master-data/services/master-data.service';
import { TaxCodeService } from '@/modules/master-data/tax/services/tax-code.service';

import { AQFormSchema } from '../schemas/aq.schema';
import type { AQFormData, AQLineFormData } from '../schemas/aq.schema';
import { AQService } from '../services/aq.service';
import type { SQForApproval, SQLineForApproval, ApproveQuotationPayload, AQListItem } from '../types/quotation-approve.types';

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

/**
 * Smart Unwrapping for API responses
 */
const findObject = (source: Record<string, unknown>): Record<string, unknown> => {
  // 🛡️ RESILIENCY: If the object already looks like a normalized SQ (has sq_id at top level), return it as is.
  // This prevents double-unwrapping which causes 'Not Found' errors.
  if (source.sq_id || source.sq_no || source.id || source.sale_quotation_id || source.quotation_id) return source;

  if (source.data && typeof source.data === 'object' && !Array.isArray(source.data)) return source.data as Record<string, unknown>;
  if (Array.isArray(source.data) && source.data[0]) return source.data[0] as Record<string, unknown>;
  if (source.sale_quotation && typeof source.sale_quotation === 'object') return source.sale_quotation as Record<string, unknown>;
  if (source.quotation && typeof source.quotation === 'object') return source.quotation as Record<string, unknown>;
  if (source.sq && typeof source.sq === 'object') return source.sq as Record<string, unknown>;
  if (source.sale_quotation_header && typeof source.sale_quotation_header === 'object') return source.sale_quotation_header as Record<string, unknown>;
  return source;

};

/**
 * Discovery helper for lines — More aggressive detection
 */
const findLines = (source: Record<string, unknown>): unknown[] => {
  const priority = [
    'saleQuotationLines', 
    'sale_quotation_lines', 
    'sq_lines', 
    'lines', 
    'items', 
    'sale_quotation_detail',
    'sale_quotation_line',
    'sq_line'
  ];

  for (const p of priority) {
    if (Array.isArray(source[p]) && (source[p] as unknown[]).length > 0) {
      return source[p] as unknown[];
    }
  }
  
  // Fallback: search any key that contains "line" or "item" and is an array
  const lineKey = Object.keys(source).find(k => 
    (k.toLowerCase().includes('line') || k.toLowerCase().includes('item')) && 
    Array.isArray(source[k]) && 
    (source[k] as unknown[]).length > 0
  );
  
  if (lineKey) return source[lineKey] as unknown[];

  // Absolute fallback: first non-empty array
  const firstArray = Object.keys(source).find(k => Array.isArray(source[k]) && (source[k] as unknown[]).length > 0);
  return firstArray ? (source[firstArray] as unknown[]) : [];
};

function normalizeSQ(raw: unknown): SQForApproval | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const obj = findObject(r);

  const sqId = Number(
    obj.sq_id || 
    obj.id || 
    obj.sale_quotation_id || 
    obj.quotation_id || 
    obj.id_sale_quotation || 
    0
  );
  if (!sqId) return null;

  // 3. Line Mapping
  const rawLines = findLines(obj);
  const lines: SQLineForApproval[] = rawLines.map((l: unknown) => {
    const line = l as Record<string, unknown>;
    const item = (line.item as Record<string, unknown>) || (line.item_master as Record<string, unknown>) || {};
    const uom = (line.uom as Record<string, unknown>) || (line.unit as Record<string, unknown>) || {};
    
    return {
      sq_line_id: Number(line.sq_line_id || line.id || 0),
      item_id: Number(line.item_id || item.item_id || item.id || 0),
      item_code: String(line.item_code || item.item_code || line.code || ''),
      item_name: String(line.item_name || item.item_name || item.item_name_th || line.description || line.name || ''),
      qty: Number(line.qty || line.quantity || 0),
      uom_id: Number(line.uom_id || uom.uom_id || uom.id || 0),
      uom_name: String(line.uom_name || uom.uom_name || uom.unit_name || uom.name || ''),
      unit_price: Number(line.unit_price || line.price || 0),
      discount_expression: String(line.discount_expression || line.line_discount_input || '0'),
      discount_amount: Number(line.line_discount || line.discount_amount || 0),
      net_amount: Number(line.line_total || line.net_amount || 0),
      remarks: String(line.remarks || line.note || ''),
      tax_code_id: line.tax_code_id ? Number(line.tax_code_id) : null,
    };
  });

  // 4. Header Discovery (Fixed & Type-safe)
  const getNested = (source: Record<string, unknown>, keys: string[]): Record<string, unknown> => {
    for (const k of keys) { 
      const val = source[k];
      if (val && typeof val === 'object' && !Array.isArray(val)) return val as Record<string, unknown>; 
    }
    return {};
  };

  const customer = getNested(obj, ['customer', 'customer_ref']);
  const branch = getNested(obj, ['branch', 'branch_ref']);
  const dept = getNested(obj, ['emp_dept', 'department', 'dept']);
  const area = getNested(obj, ['saleArea', 'empArea', 'sale_area']);
  const tax = getNested(obj, ['taxCode', 'tax_code_ref', 'tax']);

  const qCurrency = (obj.quote_currency as Record<string, unknown>) || {};
  const bCurrency = (obj.base_currency as Record<string, unknown>) || {};

  const qCurrencyCode = String(obj.quote_currency_code || qCurrency.currency_code || obj.currency_code || 'THB');

  return {
    sq_id: sqId,
    sq_no: String(obj.sq_no || obj.sale_quotation_no || obj.code || obj.no || ''),
    sq_date: String(obj.sq_date || obj.sale_quotation_date || obj.date || '').split('T')[0],
    
    customer_id: Number(obj.customer_id || customer.customer_id || customer.id || obj.id_customer || 0),
    customer_name: String(obj.customer_name || obj.customer_name_th || obj.name_th || customer.customer_name_th || customer.name_th || customer.name || ''),
    customer_code: String(obj.customer_code || customer.customer_code || customer.code || ''),
    
    status: String(obj.status || 'PENDING'),

    base_currency_code: String(obj.base_currency_code || bCurrency.currency_code || 'THB'),
    base_currency_id: Number(obj.base_currency_id || bCurrency.id || 1),
    quote_currency_code: qCurrencyCode,
    quote_currency_id: Number(obj.quote_currency_id || qCurrency.id || 1),
    exchange_rate: Number(obj.exchange_rate || 1),
    isMulticurrency: Boolean(
      (obj.is_multicurrency === true) ||
      (obj.quote_currency_code) || 
      (qCurrencyCode)
    ),
    exchange_rate_date: String(obj.exchange_rate_date || obj.sq_date || '').split('T')[0],

    total_amount: Number(obj.total_amount || obj.quote_total_amount || 0),
    base_total_amount: Number(obj.base_total_amount || 0),
    quote_total_amount: Number(obj.quote_total_amount || 0),
    vat_amount: Number(obj.vat_amount || 0),
    base_tax_amount: Number(obj.base_tax_amount || 0),
    quote_tax_amount: Number(obj.quote_tax_amount || 0),
    
    tax_code_id: obj.tax_code_id ? Number(obj.tax_code_id) : (tax.id ? Number(tax.id) : undefined),
    tax_rate: Number(obj.tax_rate ?? obj.tax_pct ?? tax.tax_rate ?? tax.tax_pct ?? 0),
    tax_code: String(obj.tax_code || obj.tax_code_name || tax.tax_code || tax.name || tax.tax_code_name || '').replace(/^-$/, ''),

    remarks: String(obj.remarks || ''),
    valid_until: String(obj.valid_until || '').split('T')[0],
    payment_term_days: Number(obj.payment_term_days || 0),

    branch_id: Number(obj.branch_id || branch.id || obj.id_branch || 0),
    branch_name: String(obj.branch_name || branch.name || '').replace(/^-$/, ''),
    emp_dept_id: Number(obj.emp_dept_id || dept.id || obj.id_dept || obj.id_department || obj.dept_id || 0),
    emp_dept_name: String(obj.emp_dept_name || dept.name || '').replace(/^-$/, ''),
    project_id: Number(obj.project_id || obj.id_project || (obj.project as Record<string, unknown>)?.project_id || (obj.project as Record<string, unknown>)?.id || 0),
    project_name: String(obj.project_name || (obj.project as Record<string, unknown>)?.project_name || (obj.project as Record<string, unknown>)?.name || '').replace(/^-$/, ''),
    sale_area_id: Number(obj.sale_area_id || obj.emp_area_id || area.id || obj.id_sale_area || obj.id_area || 0),
    sale_area_name: String(obj.sale_area_name || area.name || '').replace('-', ''),
    emp_sale_id: Number(obj.emp_sale_id || obj.id_emp_sale || 0),
    emp_sale_name: String(obj.emp_sale_name || (obj.emp_sale as Record<string, unknown>)?.employee_fullname || (obj.emp_sale as Record<string, unknown>)?.employee_name || ''),

    discount_expression: String(obj.discount_expression || obj.discount_rate_expression || '0'),
    discount_amount: Number(obj.discount_amount || obj.quote_discount_amount || 0),

    // Approval Metadata
    approval_emp_id: Number(obj.approval_emp_id || 0),
    approval_emp_name: String(obj.approval_emp_name || ''),

    lines,
    saleQuotationLines: lines,
    sub_total: Number(obj.sub_total || lines.reduce((s, l) => s + (l.net_amount || 0), 0) || 0),
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
  const [currencies, setCurrencies] = useState<import('@/modules/master-data/types/master-data-types').Currency[]>([]);
  
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
      
      // 🕵️ FALLBACK 1: If Detail API returns null/empty, use the record passed from the modal
      if ((!raw || Object.keys(raw as object).length < 5) && aqItemArg) {
        logger.info('[useAQForm] Detail API returned empty or shallow. Falling back to provided item data.');
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
      
      // 🕵️ DUAL-SOURCE DISCOVERY: Check both SQ detail AND AQ detail for lines
      const discoveredAQLines = aqDetails ? findLines(aqDetails as Record<string, unknown>) : [];
      const discoveredSQLines = sq.lines || [];
      
      // If we are in history mode but detail API failed (404), try to find lines in the row data itself
      const fallbackAQLines = (isHistory && discoveredAQLines.length === 0 && aqItemArg) 
        ? findLines(aqItemArg as Record<string, unknown>) 
        : [];

      let sqLinesSource: SQLineForApproval[] = [];
      
      if (discoveredSQLines.length > 0) {
        sqLinesSource = discoveredSQLines;
      } else if (discoveredAQLines.length > 0) {
        sqLinesSource = discoveredAQLines as SQLineForApproval[];
      } else if (fallbackAQLines.length > 0) {
        sqLinesSource = fallbackAQLines as SQLineForApproval[];
      } else if (aqItemArg) {
        const anyFallback = findLines(aqItemArg as Record<string, unknown>);
        if (anyFallback.length > 0) sqLinesSource = anyFallback as SQLineForApproval[];
      }

      // Map lines
      const mappedLines = sqLinesSource.map((sqLine) => {
        // Try to find the approval info for this specific line
        const aqLine = [...(discoveredAQLines as Record<string, unknown>[]), ...(fallbackAQLines as Record<string, unknown>[])].find(
          (al) => Number(al.sq_line_id || al.id) === Number(sqLine.sq_line_id)
        );

        const originalQty = Number(sqLine.qty || 0);
        const discAmt = Number(sqLine.discount_amount || 0);
        const netAmt = Number(sqLine.net_amount ?? sqLine.line_total ?? 0);

        const approvedQty = aqLine
          ? Number(aqLine.approved_qty || 0)
          : (isNew ? originalQty : 0);

        // Calculate net amount for approval
        const approvedNet = (approvedQty === originalQty)
          ? netAmt
          : approvedQty > 0
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
          discount_expression: String(sqLine.discount_expression || '0'),
          discount_amount: discAmt,
          net_amount: netAmt,
          // 🛡️ RE-CALCULATION CONSISTENCY: If it's history, we assume it was approved unless explicitly rejected
          is_approved: aqLine ? Number(aqLine.approved_qty || 0) > 0 : (isHistory ? true : isNew),
          approved_qty: approvedQty,
          approved_net_amount: Number(approvedNet.toFixed(2)),
          remarks: String(aqLine?.remarks || sqLine.note || sqLine.remarks || ''),
        };
      });

      // 🕵️ ENRICHMENT
      const needsLineEnrichment = mappedLines.some(l => !l.item_name || !l.uom_name || l.item_name === '-' || l.uom_name === '-');
      const needsHeaderEnrichment = sq && (!sq.customer_name || !sq.branch_name || !sq.project_name || !sq.emp_dept_name || !sq.emp_area_name || !sq.tax_code || sq.tax_code === '-');

      if (needsHeaderEnrichment || needsLineEnrichment) {
        try {
          const results = await Promise.all([
            MasterDataService.getCustomers(),
            MasterDataService.getBranches(),
            MasterDataService.getProjects(),
            MasterDataService.getDepartments(),
            MasterDataService.getSaleAreas(),
            MasterDataService.getEmployees(),
            TaxCodeService.getTaxCodes(),
            needsLineEnrichment ? MasterDataService.getItems() : Promise.resolve([]),
            needsLineEnrichment ? MasterDataService.getUnits() : Promise.resolve([]),
          ]);
          const [customers, branches, projects, depts, areas, employees, taxCodes, items, uoms] = results;
          if (sq.customer_id && (!sq.customer_name || sq.customer_name === '-')) {
            const m = customers.find(c => Number(c.customer_id || c.id) === Number(sq.customer_id));
            if (m) sq.customer_name = m.customer_name_th || m.name_th || m.customer_name || '';
          }
          if (sq.branch_id && (!sq.branch_name || sq.branch_name === '-')) {
            sq.branch_name = branches.find(b => Number(b.branch_id) === Number(sq.branch_id))?.branch_name || sq.branch_name;
          }
          if (sq.project_id && (!sq.project_name || sq.project_name === '-' || sq.project_name === '')) {
            const m = projects.find(p => Number(p.project_id || p.id) === Number(sq.project_id));
            if (m) sq.project_name = m.project_name || sq.project_name;
          }
          if (sq.emp_dept_id && (!sq.emp_dept_name || sq.emp_dept_name === '-' || sq.emp_dept_name === '')) {
            const m = depts.find(d => Number(d.emp_dept_id || d.dept_id || d.id) === Number(sq.emp_dept_id));
            if (m) sq.emp_dept_name = m.emp_dept_name || m.dept_name || m.department_name || sq.emp_dept_name;
          }
          if (sq.sale_area_id && (!sq.sale_area_name || sq.sale_area_name === '-')) {
            sq.sale_area_name = areas.find(a => String(a.sale_area_id) === String(sq.sale_area_id))?.sale_area_name || sq.sale_area_name;
          }
          if (sq.emp_sale_id && (!sq.emp_sale_name || sq.emp_sale_name === '-' || sq.emp_sale_name === '')) {
            const m = employees.find(e => Number(e.employee_id) === Number(sq.emp_sale_id));
            if (m) {
              sq.emp_sale_name = m.employee_fullname || 
                `${m.employee_title_th || m.title_name || ''} ${m.employee_firstname_th || m.first_name || ''} ${m.employee_lastname_th || m.last_name || ''}`.trim() || 
                m.employee_name || '';
            }
          }

          if (sq.tax_code_id && (!sq.tax_code || sq.tax_code === '-')) {
            const taxMatch = taxCodes.find(t => Number(t.tax_code_id || t.tax_id) === Number(sq.tax_code_id));
            if (taxMatch) sq.tax_code = taxMatch.tax_code || taxMatch.tax_name || '';
          }
          if (needsLineEnrichment) {
            mappedLines.forEach(l => {
              if (!l.item_name || l.item_name === '-') {
                const match = items.find(i => Number(i.item_id || i.id) === Number(l.item_id));
                if (match) { l.item_name = match.item_name || match.description || ''; l.item_code = match.item_code || l.item_code; }
              }
              if (!l.uom_name || l.uom_name === '-') {
                const match = uoms.find(u => Number(u.uom_id || u.id) === Number(l.uom_id));
                if (match) l.uom_name = match.uom_name || match.unit_name || '';
              }
            });
          }
        } catch (e) { logger.error('[useAQForm] Enrichment failed:', e); }
      }

      if (currencies.length === 0) {
        try { const fc = await MasterDataService.getCurrencies(); setCurrencies(fc); } catch (e) { logger.error('[useAQForm] Failed to fetch currencies:', e); }
      }

      // Reset form with SQ data + AQ details + AQ List Fallbacks
      reset({
        aq_id: aqDetails ? Number((aqDetails as Record<string, unknown>).aq_id) : (aqItemArg?.aq_id ? Number(aqItemArg.aq_id) : undefined),
        aq_no: String((aqDetails as Record<string, unknown>)?.aq_no || aqItemArg?.aq_no || ''),
        aq_date: String((aqDetails as Record<string, unknown>)?.aq_date || '').split('T')[0] || String(aqItemArg?.aq_date || ''),
        sq_id: sq.sq_id,
        sq_no: sq.sq_no || String(aqItemArg?.sq_no || ''),
        sq_date: sq.sq_date || String(aqItemArg?.sq_date || ''),
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
        lines: mappedLines,
      } as AQFormData);
    } catch (err) {
      logger.error('[useAQForm] loadSQData failed:', err);
      showAlert('โหลดข้อมูลใบเสนอราคาไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  }, [reset, user, showAlert, currencies.length]);


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


    const payload: ApproveQuotationPayload = {
      sq_id: Number(activeId),
      aq_date: new Date().toISOString().split('T')[0],
      status: finalStatus,
      remarks: data.remarks || '',
      approval_emp_id: user?.employee_id || 1,
      approval_emp_name: user?.employee?.employee_fullname || '',
      base_currency_code: data.base_currency_code || 'THB',
      quote_currency_code: data.quote_currency_code || 'THB',
      exchange_rate: data.exchange_rate || 1,
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

    setIsSubmitting(true);
    try {
      await AQService.createApproval(payload);

      // Sync SQ status → APPROVED
      try {
        await AQService.updateSQStatus(activeId, 'APPROVED');
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

    const payload: ApproveQuotationPayload = {
      sq_id: Number(activeId),
      aq_date: new Date().toISOString().split('T')[0],
      status: 'REJECTED',
      remarks: reason,
      approval_emp_id: user?.employee_id || 1,
      approval_emp_name: user?.employee?.employee_fullname || '',
      base_currency_code: data.base_currency_code || 'THB',
      quote_currency_code: data.quote_currency_code || 'THB',
      exchange_rate: data.exchange_rate || 1,
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
    currencies,
  };
};
