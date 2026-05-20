import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { FieldErrors, Path, FieldPathValue, Resolver, DefaultValues, FieldValues, ArrayPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@ui/feedback/Toast';
import { useAuth } from '@core/auth/contexts/AuthContext';
import type { UserProfile } from '@core/auth/auth.service';
import { extractErrorMessage } from '@core/api/api';
import { logger } from '@utils';
import { calculateLineTotal } from '@sales/shared/utils/sales-calculations';
import api from '@core/api/api';
import type { z } from 'zod';
import type { Currency } from '@master-data/types/master-data-types';
import type { PriceLevelName } from '@sales-master/pages/price-level-name/types/price-level-name.types';

// Services
import { MasterDataService } from '@master-data/services/master-data.service';
import { TaxCodeService } from '@master-data/tax/services/tax-code.service';
import { ItemMasterService } from '@inventory/services/item-master.service';
import { UOMService } from '@inventory/services/uom.service';
import { WarehouseService } from '@inventory/services/warehouse.service';

import { 
  useUnitsContext, 
  useBranchesContext, 
  useDepartmentsContext, 
  useEmployeesContext 
} from '@core/contexts/MasterDataContext';

export interface GenericLineItem {
  item_id?: string | number;
  item_code?: string;
  item_name?: string;
  uom_id?: string | number;
  uom_name?: string;
  warehouse_id?: string | number;
  warehouse_name?: string;
  location_id?: string | number;
  location_name?: string;
  lot_id?: string | number;
  lot_no?: string;
  price_source?: string | number;
  price_source_name?: string;
  price_level_priority?: number;
  [key: string]: unknown;
}

export interface GenericDocument {
  id?: string | number;
  status?: string;
  customer_id?: string | number;
  customer_name?: string;
  customer_code?: string;
  branch_id?: string | number;
  branch_name?: string;
  project_id?: string | number;
  project_name?: string;
  job_id?: string | number;
  job_name?: string;
  emp_dept_id?: string | number;
  emp_dept_name?: string;
  dept_id?: string | number;
  id_dept?: string | number;
  sale_area_id?: string | number;
  sale_area_name?: string;
  emp_area_id?: string | number;
  emp_area_name?: string;
  tax_code_id?: string | number;
  tax_code?: string;
  emp_sale_id?: string | number;
  emp_sale_name?: string;
  sale_id?: string | number;
  lines?: GenericLineItem[];
  [key: string]: unknown;
}

export interface GenericApprovalItem {
  id?: string | number;
  aq_id?: string | number;
  ao_id?: string | number;
  so_approval_id?: string | number;
  status?: string;
  remarks?: string;
  raw?: Record<string, unknown>;
  approval_emp_id?: string | number;
  approval_emp_name?: string;
  aq_no?: string;
  ao_no?: string;
  aq_date?: string;
  ao_date?: string;
  [key: string]: unknown;
}

export interface UseApprovalFormProps<TForm extends FieldValues, TPayload = unknown> {
  documentId?: string | number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  documentType: 'SQ' | 'SO';
  
  schema: z.ZodTypeAny;
  initialValues: TForm;
  
  fetchDetail: (id: string | number) => Promise<unknown>;
  fetchApprovalById?: (id: number) => Promise<unknown>;
  createApproval: (payload: TPayload) => Promise<unknown>;
  updateDocumentStatus?: (id: string | number, status: string) => Promise<unknown>;
  
  normalizeFn: (raw: unknown) => GenericDocument | null;
  findLinesFn: (raw: unknown) => unknown[];
  mapLinesFn: (
    rawLines: unknown[],
    discoveredApprovalLines: unknown[],
    fallbackApprovalLines: unknown[],
    isNew: boolean,
    isHistory: boolean,
    status: string
  ) => GenericLineItem[];
  
  recoverPriceSources?: (
    lines: GenericLineItem[],
    customerId: number,
    branchId: number,
    setLines: (newLines: GenericLineItem[]) => void
  ) => Promise<void>;
  
  buildApprovePayload: (data: TForm, activeId: string | number, user: UserProfile | null) => TPayload;
  buildRejectPayload: (data: TForm, activeId: string | number, user: UserProfile | null, reason: string) => TPayload;
  
  lineFields: {
    lineId: string;
    isApproved: string;
    approvedQty: string;
    approvedNetAmount: string;
    qty: string;
    unitPrice: string;
    discountAmount: string;
    netAmount: string;
    remarks: string;
  };
  
  queryKeysToInvalidate: string[][];
  toastMessages: {
    approveSuccess: string;
    rejectSuccess: string;
    loadError: string;
  };
  approvalItem?: GenericApprovalItem | null;
}

export const useApprovalForm = <TForm extends FieldValues, TPayload = unknown>({
  documentId,
  isOpen,
  onClose,
  onSuccess,
  documentType,
  schema,
  initialValues,
  fetchDetail,
  fetchApprovalById,
  createApproval,
  updateDocumentStatus,
  normalizeFn,
  findLinesFn,
  mapLinesFn,
  recoverPriceSources,
  buildApprovePayload,
  buildRejectPayload,
  lineFields,
  queryKeysToInvalidate,
  toastMessages,
  approvalItem,
}: UseApprovalFormProps<TForm, TPayload>) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const contextBranches = useBranchesContext();
  const contextDepts = useDepartmentsContext();
  const contextEmployees = useEmployeesContext();
  const contextUnits = useUnitsContext();

  const [activeId, setActiveId] = useState<string | number | undefined>(documentId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isConfirmRejectOpen, setIsConfirmRejectOpen] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [priceLevelNames, setPriceLevelNames] = useState<PriceLevelName[]>([]);

  const prevIsOpenRef = useRef(false);
  const prevDocIdRef = useRef<string | number | undefined>(undefined);

  useEffect(() => {
    setActiveId(documentId);
  }, [documentId]);

  const formMethods = useForm<TForm>({
    resolver: zodResolver(schema as unknown as Parameters<typeof zodResolver>[0]) as unknown as Resolver<TForm>,
    mode: 'onBlur',
    defaultValues: initialValues as DefaultValues<TForm>,
  });

  const { handleSubmit, setValue, reset, control, formState: { errors } } = formMethods;
  const { fields: lines } = useFieldArray({ control, name: 'lines' as ArrayPath<TForm> });

  const isPlaceholder = (val: unknown) => {
    if (val === undefined || val === null) return true;
    const str = String(val).trim();
    return str === '' || str === '-' || str === '0' || str.toLowerCase() === 'null' || str.toLowerCase().includes('placeholder');
  };

  const handleFormError = useCallback((fieldErrors: FieldErrors<TForm>) => {
    logger.error(`[useApprovalForm - ${documentType}] Validation Errors:`, fieldErrors);
    const msgs: string[] = [];
    const extract = (errs: object) => {
      Object.values(errs).forEach((val) => {
        if (!val) return;
        if (typeof val === 'object' && val !== null && 'message' in val && typeof (val as Record<string, unknown>).message === 'string') {
          msgs.push((val as Record<string, unknown>).message as string);
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
  }, [toast, documentType]);

  const loadDocumentData = useCallback(async (id: string | number, approvalItemArg?: GenericApprovalItem | null) => {
    if (!id || id === '0' || id === 'undefined') {
      logger.warn(`[useApprovalForm - ${documentType}] Invalid ID:`, id);
      return;
    }
    setIsSubmitting(true);
    try {
      logger.info(`[useApprovalForm - ${documentType}] Fetching detail for ID: ${id}...`);
      let raw = await fetchDetail(id);

      // FALLBACK 1: Use provided item raw/obj
      if ((!raw || Object.keys(raw as object).length < 5) && approvalItemArg) {
        logger.info(`[useApprovalForm - ${documentType}] Falling back to provided item data.`);
        raw = (approvalItemArg.raw || approvalItemArg) as Record<string, unknown>;
      }

      const doc = normalizeFn(raw);
      if (!doc) {
        toast(toastMessages.loadError, 'error');
        return;
      }

      setActiveId(id);
      prevDocIdRef.current = id;

      // Try fetching approval details if present
      let approvalDetails: Record<string, unknown> | null = null;
      const approvalId = approvalItemArg?.aq_id || approvalItemArg?.ao_id || approvalItemArg?.so_approval_id || approvalItemArg?.id;
      if (approvalId && fetchApprovalById) {
        try {
          const res = await fetchApprovalById(Number(approvalId));
          approvalDetails = res as Record<string, unknown>;
        } catch (e) {
          logger.warn(`[useApprovalForm - ${documentType}] Could not fetch approval detail:`, e);
        }
      }

      const isHistory = !!approvalId;
      const isNew = !isHistory;

      const discoveredApprovalLines = approvalDetails ? findLinesFn(approvalDetails) : [];
      const discoveredDocLines = doc.lines || [];
      const fallbackApprovalLines = (isHistory && discoveredApprovalLines.length === 0 && approvalItemArg)
        ? findLinesFn(approvalItemArg)
        : [];

      let linesSource: unknown[] = [];
      if (discoveredDocLines.length > 0) linesSource = discoveredDocLines;
      else if (discoveredApprovalLines.length > 0) linesSource = discoveredApprovalLines;
      else if (fallbackApprovalLines.length > 0) linesSource = fallbackApprovalLines;
      else if (approvalItemArg) {
        const anyFallback = findLinesFn(approvalItemArg);
        if (anyFallback.length > 0) linesSource = anyFallback;
      }

      const mappedLines: GenericLineItem[] = mapLinesFn(
        linesSource,
        discoveredApprovalLines,
        fallbackApprovalLines,
        isNew,
        isHistory,
        doc.status || ''
      );

      // --- ENRICHMENT LOGIC ---
      const needsHeaderEnrichment = doc && (
        isPlaceholder(doc.customer_name) || isPlaceholder(doc.branch_name) ||
        isPlaceholder(doc.project_name) || isPlaceholder(doc.job_name) ||
        isPlaceholder(doc.emp_dept_name) || isPlaceholder(doc.sale_area_name) ||
        isPlaceholder(doc.tax_code) || isPlaceholder(doc.emp_sale_name)
      );
      const needsLineEnrichment = mappedLines.some((l: GenericLineItem) => isPlaceholder(l.item_name) || isPlaceholder(l.uom_name) || isPlaceholder(l.warehouse_name) || isPlaceholder(l.location_name) || isPlaceholder(l.lot_no));

      if (needsHeaderEnrichment || needsLineEnrichment) {
        try {
          // Contextual Branch Enrichment
          const bid = String(doc.branch_id || '');
          if (isPlaceholder(doc.branch_name) && bid && bid !== '0' && bid !== 'undefined') {
            const branches = contextBranches || (await queryClient.fetchQuery({
              queryKey: ['master-branches'],
              queryFn: () => MasterDataService.getBranches(),
              staleTime: 5 * 60 * 1000
            })) || [];
            const match = branches.find((b: Record<string, unknown>) => String(b['branch_id'] || b['id'] || '') === bid);
            if (match) doc.branch_name = String(match['branch_name'] || '');
          }

          // Contextual Department Enrichment
          const did = String(doc.emp_dept_id || doc.dept_id || doc.id_dept || '');
          if (isPlaceholder(doc.emp_dept_name) && did && did !== '0' && did !== 'undefined') {
            const depts = contextDepts || (await queryClient.fetchQuery({
              queryKey: ['master-departments'],
              queryFn: () => MasterDataService.getDepartments(),
              staleTime: 5 * 60 * 1000
            })) || [];
            const match = depts.find((d: Record<string, unknown>) => String(d['emp_dept_id'] || d['id'] || '') === did);
            if (match) doc.emp_dept_name = String(match['emp_dept_name'] || match['dept_name'] || match['department_name'] || '');
          }

          // Contextual Employee/Salesperson Enrichment
          const sid = String(doc.emp_sale_id || doc.sale_id || '');
          if (isPlaceholder(doc.emp_sale_name) && sid && sid !== '0' && sid !== 'undefined') {
            const employees = contextEmployees || (await queryClient.fetchQuery({
              queryKey: ['master-employees'],
              queryFn: () => MasterDataService.getEmployees(),
              staleTime: 5 * 60 * 1000
            })) || [];
            const match = employees.find((e: Record<string, unknown>) => String(e['employee_id'] || '') === sid);
            if (match) doc.emp_sale_name = String(match['employee_fullname'] || match['employee_name'] || '');
          }

          // Contextual UOM Enrichment
          if (needsLineEnrichment) {
            const uoms = contextUnits || (await queryClient.fetchQuery({
              queryKey: ['master-uoms'],
              queryFn: () => UOMService.getAll({ limit: 1000 }).then((res) => Array.isArray(res) ? res : (res as unknown as Record<string, unknown>)?.items || []),
              staleTime: 5 * 60 * 1000
            })) || [];

            mappedLines.forEach((l: GenericLineItem) => {
              if (isPlaceholder(l.uom_name) && l.uom_id) {
                const match = uoms.find((u: Record<string, unknown>) => String(u['uom_id'] || u['id'] || '') === String(l.uom_id));
                if (match) l.uom_name = String(match['uom_name'] || '');
              }
            });
          }

          // Standard Master Data Fetch Promises (using Query Caching)
          const customerId = String(doc.customer_id || '');
          const projectId = String(doc.project_id || doc.job_id || '');
          const areaId = String(doc.sale_area_id || doc.emp_area_id || '');
          const taxId = String(doc.tax_code_id || '');

          const enrichmentPromises: Promise<unknown>[] = [
            (isPlaceholder(doc.customer_name) && customerId)
              ? queryClient.fetchQuery({
                  queryKey: ['master-customers'],
                  queryFn: () => MasterDataService.getCustomers(),
                  staleTime: 5 * 60 * 1000
                })
              : Promise.resolve([]),
            (isPlaceholder(doc.project_name || doc.job_name) && projectId)
              ? queryClient.fetchQuery({
                  queryKey: ['master-projects'],
                  queryFn: () => MasterDataService.getProjects(),
                  staleTime: 5 * 60 * 1000
                })
              : Promise.resolve([]),
            (isPlaceholder(doc.sale_area_name || doc.emp_area_name) && areaId)
              ? queryClient.fetchQuery({
                  queryKey: ['master-sale-areas'],
                  queryFn: () => import('@sales-master/pages/area/services/area.service').then(m => m.SaleAreaService.getList()),
                  staleTime: 5 * 60 * 1000
                })
              : Promise.resolve([]),
            (isPlaceholder(doc.tax_code) && taxId)
              ? queryClient.fetchQuery({
                  queryKey: ['master-tax-codes'],
                  queryFn: () => TaxCodeService.getTaxCodes(),
                  staleTime: 5 * 60 * 1000
                })
              : Promise.resolve([])
          ];

          const resolvedEnrichment = await Promise.all(enrichmentPromises);
          const extractArr = (d: unknown) => Array.isArray(d) ? d : ((d as Record<string, unknown>)?.items || (d as Record<string, unknown>)?.data || []) as Record<string, unknown>[];
          const customers = extractArr(resolvedEnrichment[0]);
          const projects = extractArr(resolvedEnrichment[1]);
          const areas = extractArr(resolvedEnrichment[2]);
          const taxCodes = extractArr(resolvedEnrichment[3]);

          if (isPlaceholder(doc.customer_name) && customerId) {
            const m = customers.find((c: Record<string, unknown>) => String(c['customer_id'] || c['id'] || '') === customerId);
            if (m) doc.customer_name = String(m['customer_name_th'] || m['name_th'] || m['customer_name'] || '');
          }
          if (isPlaceholder(doc.project_name || doc.job_name) && projectId) {
            const m = projects.find((p: Record<string, unknown>) => String(p['project_id'] || p['id'] || '') === projectId);
            if (m) {
              doc.project_name = String(m['project_name'] || '');
              doc.job_name = String(m['project_name'] || '');
            }
          }
          if (isPlaceholder(doc.sale_area_name || doc.emp_area_name) && areaId) {
            const m = areas.find((a: Record<string, unknown>) => String(a['sale_area_id'] || a['id'] || '') === areaId);
            if (m) {
              doc.sale_area_name = String(m['sale_area_name'] || '');
              doc.emp_area_name = String(m['sale_area_name'] || '');
            }
          }
          if (isPlaceholder(doc.tax_code) && taxId) {
            const m = taxCodes.find((t: Record<string, unknown>) => String(t['tax_code_id'] || t['tax_id'] || '') === taxId);
            if (m) doc.tax_code = String(m['tax_code'] || m['tax_name'] || '');
          }

          // SO Line specific enrichments (warehouse, location, lot, items)
          if (needsLineEnrichment) {
            const missingItemIds = mappedLines.filter(l => isPlaceholder(l.item_name) && l.item_id).map(l => String(l.item_id));
            const itemMap = new Map<string, Record<string, unknown>>();
            if (missingItemIds.length > 0) {
              await Promise.all(missingItemIds.map(async (itemId) => {
                try {
                  const item = await queryClient.fetchQuery({
                    queryKey: ['item-master', itemId],
                    queryFn: () => ItemMasterService.getById(Number(itemId)),
                    staleTime: 10 * 60 * 1000
                  });
                  if (item) itemMap.set(itemId, item as unknown as Record<string, unknown>);
                } catch { /* ignore */ }
              }));
            }

            // Warehouses, Locations Enrichment
            const whsPromise = mappedLines.some(l => isPlaceholder(l.warehouse_name) && l.warehouse_id)
              ? queryClient.fetchQuery({
                  queryKey: ['master-warehouses'],
                  queryFn: () => WarehouseService.getAll().then((res) => Array.isArray(res) ? res : (res as unknown as Record<string, unknown>)?.items || []),
                  staleTime: 5 * 60 * 1000
                })
              : Promise.resolve([]);

            const locsPromise = mappedLines.some(l => isPlaceholder(l.location_name) && l.location_id)
              ? queryClient.fetchQuery({
                  queryKey: ['master-locations', 1000],
                  queryFn: () => import('@inventory/services/inventory-master.service').then(m => m.LocationService.getAll({ limit: 1000 })).then((res) => Array.isArray(res) ? res : (res as unknown as Record<string, unknown>)?.items || []),
                  staleTime: 5 * 60 * 1000
                })
              : Promise.resolve([]);

            const resolvedWhs = await whsPromise;
            const resolvedLocs = await locsPromise;
            const warehouses = (Array.isArray(resolvedWhs) ? resolvedWhs : []) as Record<string, unknown>[];
            const locations = (Array.isArray(resolvedLocs) ? resolvedLocs : []) as Record<string, unknown>[];

            await Promise.all(mappedLines.map(async (l: GenericLineItem) => {
              if (isPlaceholder(l.item_name) && l.item_id) {
                const match = itemMap.get(String(l.item_id));
                if (match) {
                  l.item_name = String(match['item_name'] || match['description'] || '');
                  l.item_code = String(match['item_code'] || l.item_code || '');
                }
              }
              if (isPlaceholder(l.warehouse_name) && l.warehouse_id) {
                const match = warehouses.find((w: Record<string, unknown>) => String(w['warehouse_id'] || w['id'] || '') === String(l.warehouse_id));
                if (match) l.warehouse_name = String(match['warehouse_name'] || '');
              }
              if (isPlaceholder(l.location_name) && l.location_id) {
                const match = locations.find((loc: Record<string, unknown>) => String(loc['location_id'] || loc['id'] || '') === String(l.location_id));
                if (match) l.location_name = String(match['name_th'] || match['name_en'] || '');
              }
              if (isPlaceholder(l.lot_no) && l.lot_id && l.lot_id !== '0') {
                try {
                  const lot = await queryClient.fetchQuery({
                    queryKey: ['item-lot', String(l.lot_id)],
                    queryFn: () => api.get<Record<string, unknown>>(`/item-lot/${l.lot_id}`).then(res => res?.data || res),
                    staleTime: 10 * 60 * 1000
                  }) as Record<string, unknown> | null;
                  if (lot) l.lot_no = String(lot['lot_no'] || lot['lot_no_code'] || lot['batch_no'] || '');
                } catch { /* ignore */ }
              }
            }));
          }

        } catch (e) {
          logger.error(`[useApprovalForm - ${documentType}] Enrichment failed:`, e);
        }
      }

      // Format clean price source names
      mappedLines.forEach((line: GenericLineItem) => {
        if (isPlaceholder(line.price_source_name)) {
          const s = Number(line.price_source);
          if (s === 1) line.price_source_name = 'PRICE_LIST';
          else if (s === 2) line.price_source_name = 'PRICE_LEVEL';
          else if (s === 3) line.price_source_name = 'MANUAL';
        }
      });

      // Currencies and Price Levels
      if (currencies.length === 0) {
        try {
          const fc = await MasterDataService.getCurrencies();
          setCurrencies(fc);
        } catch { /* ignore */ }
      }

      if (documentType === 'SQ' && priceLevelNames.length === 0) {
        try {
          const levels = await MasterDataService.getPriceLevelNames();
          setPriceLevelNames(levels);
        } catch { /* ignore */ }
      }

      const formValues: TForm = {
        ...doc,
        aq_id: approvalDetails?.aq_id || approvalItemArg?.aq_id || doc.aq_id,
        ao_id: approvalDetails?.ao_id || approvalItemArg?.ao_id || doc.ao_id,
        aq_no: approvalDetails?.aq_no || approvalItemArg?.aq_no || doc.aq_no || '',
        ao_no: approvalDetails?.ao_no || approvalItemArg?.ao_no || doc.ao_no || '',
        aq_date: (String(approvalDetails?.aq_date || approvalItemArg?.aq_date || doc.aq_date || '')).split('T')[0],
        ao_date: (String(approvalDetails?.ao_date || approvalItemArg?.ao_date || doc.ao_date || '')).split('T')[0],
        status: (approvalDetails?.status || approvalItemArg?.status || doc.status || 'PENDING'),
        reject_reason: (approvalDetails?.status === 'REJECTED' || approvalItemArg?.status === 'REJECTED') ? (approvalDetails?.remarks || approvalItemArg?.remarks || '') : '',
        approval_emp_id: approvalDetails?.approval_emp_id || approvalItemArg?.approval_emp_id || user?.employee_id || 1,
        approval_emp_name: approvalDetails?.approval_emp_name || approvalItemArg?.approval_emp_name || user?.employee?.employee_fullname || '',
        lines: mappedLines
      } as unknown as TForm;

      reset(formValues);

      // Trigger Smart Recovery
      if (doc.customer_id && doc.branch_id && recoverPriceSources) {
        void recoverPriceSources(
          mappedLines,
          Number(doc.customer_id),
          Number(doc.branch_id),
          (newLines) => setValue('lines' as Path<TForm>, newLines as FieldPathValue<TForm, Path<TForm>>)
        );
      }

    } catch (err) {
      logger.error(`[useApprovalForm - ${documentType}] loadDocumentData failed:`, err);
      toast(toastMessages.loadError, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    reset, user, toast, currencies.length, priceLevelNames.length, setValue, queryClient,
    contextBranches, contextDepts, contextEmployees, contextUnits, documentType,
    fetchDetail, fetchApprovalById, normalizeFn, findLinesFn, mapLinesFn, recoverPriceSources, toastMessages.loadError
  ]);

  // Reactive auto-load
  useEffect(() => {
    if (isOpen) {
      if (documentId) {
        const hasIdChanged = documentId !== prevDocIdRef.current;
        const isNewlyOpened = !prevIsOpenRef.current;

        if (isNewlyOpened || hasIdChanged) {
          prevIsOpenRef.current = true;
          prevDocIdRef.current = documentId;
          loadDocumentData(documentId, approvalItem);
        }
      } else {
        if (!prevIsOpenRef.current) {
          prevIsOpenRef.current = true;
          prevDocIdRef.current = undefined;
          reset(initialValues);
        }
      }
    } else {
      if (prevIsOpenRef.current) {
        reset(initialValues);
      }
      prevIsOpenRef.current = false;
      prevDocIdRef.current = undefined;
    }
  }, [isOpen, documentId, loadDocumentData, reset, initialValues, approvalItem]);

  // Update line calculations dynamically
  const updateLine = useCallback((
    index: number,
    field: string,
    value: unknown
  ) => {
    const path = `lines.${index}.${field}` as Path<TForm>;
    setValue(path, value as FieldPathValue<TForm, typeof path>);

    if (field === lineFields.isApproved && value === false) {
      setValue(`lines.${index}.${lineFields.approvedQty}` as Path<TForm>, 0 as FieldPathValue<TForm, Path<TForm>>);
      setValue(`lines.${index}.${lineFields.approvedNetAmount}` as Path<TForm>, 0 as FieldPathValue<TForm, Path<TForm>>);
    }

    if (field === lineFields.approvedQty) {
      const currentLines = formMethods.getValues('lines' as Path<TForm>) as GenericLineItem[];
      const line = currentLines[index];
      if (line) {
        const approvedQty = Number(value || 0);
        const origQty = Number(line[lineFields.qty] || 0);
        const discAmt = Number(line[lineFields.discountAmount] || 0);
        const netApproved = (approvedQty === origQty)
          ? Number(line[lineFields.netAmount] || 0)
          : origQty > 0
            ? calculateLineTotal(approvedQty, Number(line[lineFields.unitPrice] || 0), (discAmt * approvedQty / origQty))
            : 0;

        setValue(
          `lines.${index}.${lineFields.approvedNetAmount}` as Path<TForm>,
          Number(netApproved.toFixed(2)) as FieldPathValue<TForm, Path<TForm>>
        );
      }
    }
  }, [setValue, formMethods, lineFields]);

  // Approve trigger
  const handleApprove = handleSubmit(() => {
    const data = formMethods.getValues();
    const hasApproved = (data.lines as GenericLineItem[] || []).some(l => l[lineFields.isApproved]);
    if (!hasApproved) {
      toast('กรุณาเลือกรายการที่ต้องการอนุมัติอย่างน้อย 1 รายการ', 'error');
      return;
    }
    setIsConfirmModalOpen(true);
  }, handleFormError);

  const handleConfirmApprove = async () => {
    if (!activeId) return;
    const data = formMethods.getValues();
    const payload = buildApprovePayload(data, activeId, user);

    setIsSubmitting(true);
    try {
      await createApproval(payload);

      if (updateDocumentStatus) {
        try {
          await updateDocumentStatus(activeId, 'APPROVED');
        } catch (err) {
          logger.warn(`[useApprovalForm - ${documentType}] Document status sync failed (non-critical):`, err);
        }
      }

      toast(toastMessages.approveSuccess, 'success');
      
      // Invalidate queries
      queryKeysToInvalidate.forEach((qk) => {
        queryClient.removeQueries({ queryKey: qk });
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      toast(extractErrorMessage(err), 'error');
    } finally {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
    }
  };

  // Reject triggers
  const handleRejectInit = () => {
    const reason = formMethods.getValues('reject_reason' as Path<TForm>);
    if (!reason?.trim()) {
      toast('กรุณาระบุเหตุผลที่ไม่อนุมัติ', 'error');
      formMethods.setError('reject_reason' as Path<TForm>, { type: 'required', message: 'กรุณาระบุเหตุผล' });
      formMethods.setFocus('reject_reason' as Path<TForm>);
      return;
    }
    setIsConfirmRejectOpen(true);
  };

  const handleConfirmReject = async (reasonArg?: string) => {
    if (!activeId) return;
    const data = formMethods.getValues();
    const reason = reasonArg || data.reject_reason || 'Rejected';
    const payload = buildRejectPayload(data, activeId, user, reason);

    setIsRejecting(true);
    try {
      await createApproval(payload);

      if (updateDocumentStatus) {
        try {
          await updateDocumentStatus(activeId, 'REJECTED');
        } catch (err) {
          logger.warn(`[useApprovalForm - ${documentType}] Document status sync failed:`, err);
        }
      }

      toast(toastMessages.rejectSuccess, 'success');
      
      // Invalidate queries
      queryKeysToInvalidate.forEach((qk) => {
        queryClient.removeQueries({ queryKey: qk });
      });

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
    loadDocumentData,
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
