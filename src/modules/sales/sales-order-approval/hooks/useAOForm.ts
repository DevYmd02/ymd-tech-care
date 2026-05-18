/**
 * @file useAOForm.ts
 * @description Form logic for Sales Order Approval (AO)
 * @pattern Mirrors useAQForm.ts from Sales Quotation Approval domain
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '@core/api/api';
import type { FieldErrors, Path, FieldPathValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@ui/feedback/Toast';
import { useAuth } from '@core/auth/contexts/AuthContext';
import { logger } from '@utils';
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
      return (r > 0 && r < 1) ? r * 100 : r; // Handle decimal vs percentage (0.07 vs 7)
    })(),

    
    sub_total: subTotal,
    discount_expression: String(obj.discount_expression || obj.discount_input || '0'),
    discount_amount: Number(obj.discount_amount || 0),
    
    // Financial Fields (Multi-alias for robustness)
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

/**
 * 🕵️ Smart Recovery for Sales Order Approval: Automatically detect price sources if missing
 */
async function recoverAOPriceSources(
    lines: AOLineFormData[], 
    customerId: number, 
    branchId: number,
    setValues: (lines: AOLineFormData[]) => void
) {
    if (!lines || lines.length === 0 || !customerId || !branchId) return;

    const updatedLines = [...lines];
    let hasChanges = false;

    const promises = updatedLines.map(async (line, index) => {
        // Skip if already has a source name
        if (line.price_source_name && line.price_source_name !== '') return;

        try {
            const result = await import('@sales/quotation/services/pricing.service').then(m => m.PricingService.calculatePrice({
                itemId: line.item_id,
                qty: line.qty_ordered || 0,
                customerId,
                branchId
            }));

            if (result) {
                const priceDiff = Math.abs(Number(result.unitPrice) - Number(line.unit_price));
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
        } catch {
            // Silent fail for recovery
        }
    });

    await Promise.all(promises);
    if (hasChanges) {
        setValues(updatedLines);
    }
}

export const useAOForm = ({ soId, isOpen, onClose, onSuccess, approvalItem }: UseAOFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeId, setActiveId] = useState<string | number | undefined>(
    (typeof soId === 'number' && isNaN(soId)) ? undefined : soId
  );
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

  useEffect(() => { 
    if (typeof soId === 'number' && isNaN(soId)) return;
    setActiveId(soId); 
  }, [soId]);

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
    if (!id || id === '0' || id === 'undefined') {
      logger.warn('[useAOForm] Invalid SO ID:', id);
      return;
    }
    
    setIsSubmitting(true);
    try {
      let raw = await AOService.getSOById(id);
      
      if ((!raw || Object.keys(raw as object).length < 5) && aoItemArg?.so_no) {
        // Fallback global search if needed
      }

      if ((!raw || Object.keys(raw as object).length < 5) && aoItemArg) {
        raw = (aoItemArg.raw || aoItemArg) as Record<string, unknown>;
      }
      
      const so = normalizeSO(raw);
      if (!so) {
        showAlert('ไม่พบข้อมูลใบสั่งขาย');
        return;
      }

      const obj = findObject(raw as Record<string, unknown>);

      // 🚀 Header Enrichment: Fetch missing master data names (Only if ID is valid)
      await Promise.all([
        // 1. Branch Enrichment
        (async () => {
          const bid = String(so.branch_id || '');
          if ((!so.branch_name || so.branch_name === '-' || so.branch_name === '') && bid && bid !== '0' && bid !== 'undefined') {
            try {
              const res = await api.get<Record<string, unknown>>(`/org-branches/${bid}`);
              const data = (res?.data || res) as Record<string, unknown>;
              if (data) {
                const name = String(data.branch_name || data.name || data.name_th || data.branch_name_th || '');
                if (name) so.branch_name = name;
              }
            } catch { /* ignore */ }
          }
        })(),

        // 2. Department/Section Enrichment
        (async () => {
          const did = String(so.emp_dept_id || '');
          if ((!so.emp_dept_name || so.emp_dept_name === '-' || so.emp_dept_name === '') && did && did !== '0' && did !== 'undefined') {
            try {
              const res = await api.get<Record<string, unknown>>(`/department/${did}`);
              const data = (res?.data || res) as Record<string, unknown>;
              if (data) {
                const name = String(data.emp_dept_name || data.dept_name || data.department_name || data.section_name || data.name || data.name_th || '');
                if (name) so.emp_dept_name = name;
                else {
                  // Fallback: try /org-departments if /department fails to give name
                  const res2 = await api.get<Record<string, unknown>>(`/org-departments/${did}`);
                  const data2 = (res2?.data || res2) as Record<string, unknown>;
                  if (data2) {
                    const name2 = String(data2.dept_name || data2.name || data2.name_th || data2.department_name || '');
                    if (name2) so.emp_dept_name = name2;
                  }
                }
              }
            } catch { /* ignore */ }
          }
        })(),

        // 3. Sales Area Enrichment
        (async () => {
          const aid = String(so.emp_area_id || '');
          if ((!so.emp_area_name || so.emp_area_name === '-' || so.emp_area_name === '') && aid && aid !== '0' && aid !== 'undefined') {
            try {
              const res = await api.get<Record<string, unknown>>(`/employee-sale-area/${aid}`);
              const data = (res?.data || res) as Record<string, unknown>;
              if (data) {
                const name = String(data.sale_area_name || data.area_name || data.name || data.name_th || '');
                if (name) so.emp_area_name = name;
              }
            } catch { /* ignore */ }
          }
        })(),

        // 4. Job/Project Enrichment
        (async () => {
          const jid = String(so.job_id || '');
          if ((!so.job_name || so.job_name === '-' || so.job_name === '') && jid && jid !== '0' && jid !== 'undefined') {
            try {
              const res = await api.get<Record<string, unknown>>(`/project/${jid}`);
              const data = (res?.data || res) as Record<string, unknown>;
              if (data) {
                const name = String(data.project_name || data.name || data.name_th || data.job_name || '');
                if (name) so.job_name = name;
              }
            } catch { /* ignore */ }
          }
        })(),

        // 5. Reservation Enrichment
        (async () => {
          const rid = String(so.reservation_id || '');
          if ((!so.reservation_no || so.reservation_no === '-' || so.reservation_no === '' || so.reservation_no === rid) && rid && rid !== '0' && rid !== 'undefined') {
            try {
              const res = await api.get<Record<string, unknown>>(`/sale-reservation/${rid}`);
              const data = (res?.data || res) as Record<string, unknown>;
              if (data) {
                const no = String(data.reservation_no || data.code || data.no || '');
                if (no) so.reservation_no = no;
              }
            } catch { /* ignore */ }
          }
        })(),

        // 6. Sales Person Enrichment
        (async () => {
          const sid = String(so.emp_sale_id || '');
          if ((!so.emp_sale_name || so.emp_sale_name === '-' || so.emp_sale_name === '') && sid && sid !== '0' && sid !== 'undefined') {
            try {
              const res = await api.get<Record<string, unknown>>(`/employees/${sid}`);
              const data = (res?.data || res) as Record<string, unknown>;
              if (data) {
                const name = String(data.employee_fullname || data.employee_name || data.name || data.name_th || 
                  `${data.employee_firstname_th || ''} ${data.employee_lastname_th || ''}`.trim());
                if (name) so.emp_sale_name = name;
              }
            } catch { /* ignore */ }
          }
        })(),

        // 7. Tax Code Enrichment
        (async () => {
          const tid = String(so.tax_code_id || '');
          if ((!so.tax_code || so.tax_code === '-' || so.tax_code === '') && tid && tid !== '0' && tid !== 'undefined') {
            try {
              const res = await api.get<Record<string, unknown>>(`/tax-code/${tid}`);
              const data = (res?.data || res) as Record<string, unknown>;
              if (data) so.tax_code = String(data.tax_code || data.code || data.name || '-');
            } catch { /* ignore */ }
          }
        })(),
      ]);

      // 🚀 Final touch for Reservation No (Only if still missing after enrichment)
      if (!so.reservation_no || so.reservation_no === '-' || so.reservation_no === '') {
          so.reservation_no = String(obj.reservation_no || obj.reserve_no || '-');
      }

      if (!so.ship_date || so.ship_date === 'null' || so.ship_date === '') {
          so.ship_date = String(obj.ship_date || obj.delivery_date || obj.est_ship_date || obj.delivery_date_so || '').split('T')[0];
      }

      if (!so.payment_term_days) {
          so.payment_term_days = Number(obj.payment_term_days || obj.credit_term || obj.credit_days || 0);
      }

      // 🚀 Line Enrichment
      if (so.lines && so.lines.length > 0) {
        await Promise.all(so.lines.map(async (line) => {
          if ((!line.item_name || line.item_name === '-' || line.item_name === '') && line.item_id) {
            try {
              const res = await api.get<Record<string, unknown>>(`/item-master/${line.item_id}`);
              const item = (res?.data || res) as Record<string, unknown>;
              if (item) {
                line.item_name = String(item.item_name || item.item_name_th || item.name || item.name_th || line.item_name || '-');
                line.item_code = String(item.item_code || item.code || line.item_code || '-');
              }
            } catch { /* ignore */ }
          }
          if ((!line.uom_name || line.uom_name === '-' || line.uom_name === '') && line.uom_id) {
            try {
              const res = await api.get<Record<string, unknown>>(`/uom/${line.uom_id}`);
              const uom = (res?.data || res) as Record<string, unknown>;
              if (uom) {
                line.uom_name = String(uom.uom_name || uom.uom_name || uom.name || uom.name_th || line.uom_name || '-');
              }
            } catch { /* ignore */ }
          }
          if ((!line.warehouse_name || line.warehouse_name === '-' || line.warehouse_name === '') && line.warehouse_id && line.warehouse_id !== '0') {
            try {
              const res = await api.get<Record<string, unknown>>(`/warehouse/${line.warehouse_id}`);
              const wh = (res?.data || res) as Record<string, unknown>;
              if (wh) {
                line.warehouse_name = String(wh.warehouse_name || wh.name || wh.name_th || line.warehouse_name || '-');
              }
            } catch { /* ignore */ }
          }
          if ((!line.location_name || line.location_name === '-' || line.location_name === '') && line.location_id && line.location_id !== '0') {
            try {
              const res = await api.get<Record<string, unknown>>(`/location/${line.location_id}`);
              const loc = (res?.data || res) as Record<string, unknown>;
              if (loc) {
                line.location_name = String(loc.location_name || loc.name_th || loc.name_en || loc.code || line.location_name || '-');
              }
            } catch { /* ignore */ }
          }
          if ((!line.lot_no || line.lot_no === '-' || line.lot_no === '') && line.lot_id && line.lot_id !== '0') {
            try {
              const res = await api.get<Record<string, unknown>>(`/item-lot/${line.lot_id}`);
              const lot = (res?.data || res) as Record<string, unknown>;
              if (lot) {
                line.lot_no = String(lot.lot_no || lot.lot_no_code || lot.batch_no || lot.code || line.lot_no || '-');
              }
            } catch { /* ignore */ }
          }
        }));
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

      const mappedLines: AOLineFormData[] = soLinesSource.map((soLine) => {
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
          warehouse_id: String(soLine.warehouse_id || ''),
          warehouse_name: String(soLine.warehouse_name || ''),
          location_id: String(soLine.location_id || ''),
          location_name: String(soLine.location_name || ''),
          lot_id: String(soLine.lot_id || ''),
          lot_no: String(soLine.lot_no || ''),
          remarks: String(aoLine?.remarks || soLine.note || soLine.remarks || ''),
          price_source: soLine.price_source !== undefined && soLine.price_source !== null ? Number(soLine.price_source) : null,
          price_source_name: String(soLine.price_source_name || ''),
          price_level_priority: soLine.price_level_priority !== undefined && soLine.price_level_priority !== null ? Number(soLine.price_level_priority) : null,
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
        customer_id: so.customer_id || '',
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
        tax_code: so.tax_code || '',
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
        reservation_id: so.reservation_id || '',
        reservation_no: so.reservation_no || '',
        ship_days: so.ship_days || 0,
        ship_date: so.ship_date || '',
        emp_dept_id: so.emp_dept_id || '',
        emp_dept_name: so.emp_dept_name || '',
        emp_area_id: so.emp_area_id || '',
        emp_area_name: so.emp_area_name || '',
        job_id: so.job_id || '',
        job_name: so.job_name || '',
        onhold: so.onhold || 'N',
        isMulticurrency: aoDetails && 'isMulticurrency' in aoDetails 
          ? Boolean(aoDetails.isMulticurrency) 
          : (so.isMulticurrency !== undefined ? Boolean(so.isMulticurrency) : (so.base_currency_code !== 'THB' && so.base_currency_code !== '')),
        lines: mappedLines,
      } as AOFormData);

      // 🕵️ Trigger Smart Recovery for missing sources in AO view
      if (so.customer_id && so.branch_id) {
          void recoverAOPriceSources(
              mappedLines, 
              Number(so.customer_id), 
              Number(so.branch_id),
              (newLines) => setValue('lines', newLines)
          );
      }
    } catch (err) {
      logger.error('[useAOForm] Error loading SO data:', err);
      showAlert('โหลดข้อมูลใบสั่งขายไม่สำเร็จ');
    } finally {
      setIsSubmitting(false);
    }
  }, [reset, user, showAlert, currencies.length, setValue]);

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
      so_id: Number(activeId || 0),
      customer_id: Number(data.customer_id || 0),
      status: 'APPROVED',
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

    try {
      setIsSubmitting(true);
      await AOService.createApproval(payload);
      
      try {
        await AOService.updateSOStatus(Number(activeId), 'APPROVED');
      } catch (err) {
        logger.warn('[useAOForm] SO status sync failed:', err);
      }

      toast('อนุมัติใบสั่งขายเรียบร้อยแล้ว', 'success');
      onSuccess?.();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string | string[] } }; message: string };
      const errorMsg = Array.isArray(err.response?.data?.message) 
        ? err.response.data.message.join(' ') 
        : (err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการอนุมัติ');
      logger.error('[useAOForm] Error approving SO:', err.response?.data || err);
      toast(errorMsg, 'error');
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
      so_id: Number(activeId || 0),
      customer_id: Number(data.customer_id || 0),
      status: 'REJECTED',
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

    try {
      setIsRejecting(true);
      await AOService.createApproval(payload);

      try {
        await AOService.updateSOStatus(Number(activeId), 'REJECTED');
      } catch (err) {
        logger.warn('[useAOForm] SO status sync failed:', err);
      }

      toast('ไม่อนุมัติใบสั่งขายเรียบร้อยแล้ว', 'success');
      onSuccess?.();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string | string[] } }; message: string };
      const errorMsg = Array.isArray(err.response?.data?.message) 
        ? err.response.data.message.join(' ') 
        : (err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการปฏิเสธ');
      logger.error('[useAOForm] Error rejecting SO:', err.response?.data || err);
      toast(errorMsg, 'error');
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
    currencies,
  };
};
